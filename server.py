#!/usr/bin/env python3
"""Klaar — a small, self-hosted todo app for work.

Zero dependencies: only the Python standard library (http.server + sqlite3).
Configuration via environment variables:

  PORT          port to listen on              (default 8080)
  DB_PATH       path to the SQLite database    (default data/klaar.db)
  APP_PASSWORD  enables HTTP basic auth when set
  APP_USER      basic auth username            (default "admin")
  APP_VERSION   version shown in the app       (set at image build time)
"""
import base64
import hmac
import json
import os
import re
import sqlite3
import threading
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

PORT = int(os.environ.get("PORT", "8080"))
DB_PATH = os.environ.get("DB_PATH", "data/klaar.db")
APP_USER = os.environ.get("APP_USER", "admin")
APP_PASSWORD = os.environ.get("APP_PASSWORD", "")
APP_VERSION = os.environ.get("APP_VERSION", "dev")
STATIC_DIR = (Path(__file__).parent / "static").resolve()

DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}$")
MAX_BODY = 1_000_000

SCHEMA = """
CREATE TABLE IF NOT EXISTS clients (
    id         INTEGER PRIMARY KEY,
    name       TEXT    NOT NULL,
    color      TEXT    NOT NULL DEFAULT '#3b82f6',
    position   REAL    NOT NULL DEFAULT 0,
    created_at TEXT    NOT NULL
);
CREATE TABLE IF NOT EXISTS categories (
    id         INTEGER PRIMARY KEY,
    name       TEXT    NOT NULL,
    color      TEXT    NOT NULL DEFAULT '#94a3b8',
    position   REAL    NOT NULL DEFAULT 0,
    created_at TEXT    NOT NULL
);
CREATE TABLE IF NOT EXISTS projects (
    id         INTEGER PRIMARY KEY,
    name       TEXT    NOT NULL,
    color      TEXT    NOT NULL DEFAULT '#7c5cff',
    position   REAL    NOT NULL DEFAULT 0,
    created_at TEXT    NOT NULL
);
CREATE TABLE IF NOT EXISTS todos (
    id           INTEGER PRIMARY KEY,
    title        TEXT    NOT NULL,
    notes        TEXT    NOT NULL DEFAULT '',
    done         INTEGER NOT NULL DEFAULT 0,
    priority     INTEGER NOT NULL DEFAULT 0,
    due          TEXT,
    project_id   INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    position     REAL    NOT NULL DEFAULT 0,
    created_at   TEXT    NOT NULL,
    completed_at TEXT
);
"""

# Columns added after 1.0.0; applied to existing databases on startup.
MIGRATIONS = [
    ("projects", "client_id", "INTEGER REFERENCES clients(id) ON DELETE SET NULL"),
    ("todos", "client_id", "INTEGER REFERENCES clients(id) ON DELETE SET NULL"),
    ("todos", "category_id", "INTEGER REFERENCES categories(id) ON DELETE SET NULL"),
]

INDEXES = """
CREATE INDEX IF NOT EXISTS todos_project ON todos(project_id);
CREATE INDEX IF NOT EXISTS todos_client ON todos(client_id);
CREATE INDEX IF NOT EXISTS todos_category ON todos(category_id);
CREATE INDEX IF NOT EXISTS projects_client ON projects(client_id);
"""

# Grouping entities that share the same CRUD API: /api/<table>.
GROUPS = {
    "clients": {"label": "klant", "refs": {}},
    "categories": {"label": "categorie", "refs": {}},
    "projects": {"label": "project", "refs": {"client_id": "clients"}},
}

CONTENT_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".ico": "image/x-icon",
    ".webmanifest": "application/manifest+json",
}


def now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


class BadRequest(Exception):
    pass


class NotFound(Exception):
    pass


class Store:
    def __init__(self, path):
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self.lock = threading.Lock()
        with self.lock:
            self.conn.execute("PRAGMA journal_mode=WAL")
            self.conn.execute("PRAGMA foreign_keys=ON")
            self.conn.executescript(SCHEMA)
            for table, column, decl in MIGRATIONS:
                existing = {r[1] for r in self.conn.execute(f"PRAGMA table_info({table})")}
                if column not in existing:
                    self.conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {decl}")
            self.conn.executescript(INDEXES)
            self.conn.commit()

    def query(self, sql, args=()):
        with self.lock:
            rows = self.conn.execute(sql, args).fetchall()
        return [dict(r) for r in rows]

    def one(self, sql, args=()):
        rows = self.query(sql, args)
        return rows[0] if rows else None

    def execute(self, sql, args=()):
        with self.lock:
            cur = self.conn.execute(sql, args)
            self.conn.commit()
            return cur

    def executemany(self, sql, seq):
        with self.lock:
            self.conn.executemany(sql, seq)
            self.conn.commit()


def todo_out(row):
    row["done"] = bool(row["done"])
    return row


def clean_ref(store, data, out, key, table, label):
    """Validate an optional foreign key: null or the id of an existing row."""
    if key not in data:
        return
    ref = data[key]
    if ref is None:
        out[key] = None
    elif isinstance(ref, int) and not isinstance(ref, bool) and store.one(
        f"SELECT id FROM {table} WHERE id=?", (ref,)
    ):
        out[key] = ref
    else:
        raise BadRequest(f"onbekende {label}")


def clean_position(data, out):
    if "position" in data:
        try:
            out["position"] = float(data["position"])
        except (TypeError, ValueError):
            raise BadRequest("position moet een getal zijn")


def clean_todo(store, data, partial):
    out = {}
    if "title" in data or not partial:
        title = str(data.get("title") or "").strip()
        if not title:
            raise BadRequest("title is verplicht")
        out["title"] = title[:500]
    if "notes" in data:
        out["notes"] = str(data["notes"] or "")[:20000]
    if "priority" in data:
        p = data["priority"]
        if isinstance(p, bool) or not isinstance(p, int) or not 0 <= p <= 3:
            raise BadRequest("priority moet 0-3 zijn")
        out["priority"] = p
    if "due" in data:
        d = data["due"]
        if d in (None, ""):
            out["due"] = None
        elif isinstance(d, str) and DATE_RE.match(d):
            out["due"] = d
        else:
            raise BadRequest("due moet YYYY-MM-DD zijn")
    clean_ref(store, data, out, "project_id", "projects", "project")
    clean_ref(store, data, out, "client_id", "clients", "klant")
    clean_ref(store, data, out, "category_id", "categories", "categorie")
    if "done" in data:
        out["done"] = 1 if data["done"] else 0
    clean_position(data, out)
    return out


def project_client(store, project_id):
    row = store.one("SELECT client_id FROM projects WHERE id=?", (project_id,))
    return row["client_id"] if row else None


def reconcile_client(store, fields, current):
    """Keep a todo's client consistent with its project: choosing a project
    of a client sets that client; choosing another client drops a project
    that belongs to a different client."""
    project_id = fields.get("project_id", current.get("project_id") if current else None)
    if project_id is None:
        return
    owner = project_client(store, project_id)
    if owner is None:
        return
    if "project_id" in fields:
        fields["client_id"] = owner
    elif "client_id" in fields and fields["client_id"] != owner:
        fields["project_id"] = None


def clean_group(store, table, data, partial):
    out = {}
    if "name" in data or not partial:
        name = str(data.get("name") or "").strip()
        if not name:
            raise BadRequest("name is verplicht")
        out["name"] = name[:80]
    if "color" in data:
        if not isinstance(data["color"], str) or not COLOR_RE.match(data["color"]):
            raise BadRequest("color moet #rrggbb zijn")
        out["color"] = data["color"]
    for key, ref_table in GROUPS[table]["refs"].items():
        clean_ref(store, data, out, key, ref_table, GROUPS[ref_table]["label"])
    clean_position(data, out)
    return out


# --- API handlers: (store, body, *url_groups) -> (status, payload) ---------


def get_state(store, _body):
    state = {"version": APP_VERSION}
    for table in GROUPS:
        state[table] = store.query(f"SELECT * FROM {table} ORDER BY position, id")
    state["todos"] = [todo_out(t) for t in store.query("SELECT * FROM todos ORDER BY position, id")]
    return 200, state


def get_export(store, _body):
    _, state = get_state(store, None)
    state["exported_at"] = now()
    return 200, state


def create_todo(store, body):
    fields = clean_todo(store, body, partial=False)
    reconcile_client(store, fields, None)
    if "position" not in fields:
        lowest = store.one("SELECT MIN(position) AS p FROM todos")["p"]
        fields["position"] = (lowest if lowest is not None else 0) - 1
    fields["created_at"] = now()
    if fields.get("done"):
        fields["completed_at"] = now()
    cols = ", ".join(fields)
    marks = ", ".join("?" for _ in fields)
    cur = store.execute(f"INSERT INTO todos ({cols}) VALUES ({marks})", tuple(fields.values()))
    return 201, todo_out(store.one("SELECT * FROM todos WHERE id=?", (cur.lastrowid,)))


def update_todo(store, body, todo_id):
    todo_id = int(todo_id)
    current = store.one("SELECT * FROM todos WHERE id=?", (todo_id,))
    if not current:
        raise NotFound()
    fields = clean_todo(store, body, partial=True)
    reconcile_client(store, fields, current)
    if "done" in fields and fields["done"] != current["done"]:
        fields["completed_at"] = now() if fields["done"] else None
    if fields:
        sets = ", ".join(f"{k}=?" for k in fields)
        store.execute(f"UPDATE todos SET {sets} WHERE id=?", (*fields.values(), todo_id))
    return 200, todo_out(store.one("SELECT * FROM todos WHERE id=?", (todo_id,)))


def delete_todo(store, _body, todo_id):
    if store.execute("DELETE FROM todos WHERE id=?", (int(todo_id),)).rowcount == 0:
        raise NotFound()
    return 204, None


def reorder_todos(store, body):
    """Give the listed todos the given order, reusing the position slots they
    already occupy so their order relative to unlisted todos is preserved."""
    ids = body.get("ids")
    if not isinstance(ids, list) or not all(isinstance(i, int) for i in ids):
        raise BadRequest("ids moet een lijst met getallen zijn")
    if not ids:
        return 200, {"ok": True}
    marks = ",".join("?" for _ in ids)
    rows = store.query(f"SELECT id, position FROM todos WHERE id IN ({marks})", ids)
    if len(rows) != len(set(ids)):
        raise BadRequest("onbekende taak in ids")
    slots = sorted(r["position"] for r in rows)
    # Equal slots would make the order ambiguous; spread them out.
    if len(set(slots)) != len(slots):
        slots = [slots[0] + i for i in range(len(slots))]
    store.executemany("UPDATE todos SET position=? WHERE id=?", list(zip(slots, ids)))
    return 200, {"ok": True}


def group_handlers(table):
    def create(store, body):
        fields = clean_group(store, table, body, partial=False)
        if "position" not in fields:
            highest = store.one(f"SELECT MAX(position) AS p FROM {table}")["p"]
            fields["position"] = (highest if highest is not None else 0) + 1
        fields["created_at"] = now()
        cols = ", ".join(fields)
        marks = ", ".join("?" for _ in fields)
        cur = store.execute(f"INSERT INTO {table} ({cols}) VALUES ({marks})", tuple(fields.values()))
        return 201, store.one(f"SELECT * FROM {table} WHERE id=?", (cur.lastrowid,))

    def update(store, body, group_id):
        group_id = int(group_id)
        if not store.one(f"SELECT id FROM {table} WHERE id=?", (group_id,)):
            raise NotFound()
        fields = clean_group(store, table, body, partial=True)
        if fields:
            sets = ", ".join(f"{k}=?" for k in fields)
            store.execute(f"UPDATE {table} SET {sets} WHERE id=?", (*fields.values(), group_id))
        if table == "projects" and fields.get("client_id") is not None:
            # Moving a project to a client moves its todos along.
            store.execute("UPDATE todos SET client_id=? WHERE project_id=?", (fields["client_id"], group_id))
        return 200, store.one(f"SELECT * FROM {table} WHERE id=?", (group_id,))

    def delete(store, _body, group_id):
        if store.execute(f"DELETE FROM {table} WHERE id=?", (int(group_id),)).rowcount == 0:
            raise NotFound()
        return 204, None

    return [
        ("POST", rf"/api/{table}", create),
        ("PATCH", rf"/api/{table}/(\d+)", update),
        ("DELETE", rf"/api/{table}/(\d+)", delete),
    ]


ROUTES = [
    ("GET", r"/api/state", get_state),
    ("GET", r"/api/export", get_export),
    ("POST", r"/api/todos", create_todo),
    ("POST", r"/api/todos/reorder", reorder_todos),
    ("PATCH", r"/api/todos/(\d+)", update_todo),
    ("DELETE", r"/api/todos/(\d+)", delete_todo),
]
for _table in GROUPS:
    ROUTES += group_handlers(_table)
ROUTES = [(m, re.compile(p + r"/?$"), h) for m, p, h in ROUTES]


class Handler(BaseHTTPRequestHandler):
    server_version = "Klaar"
    store = None  # set in main()

    def log_message(self, fmt, *args):
        print(f"{self.address_string()} {fmt % args}", flush=True)

    # -- helpers --
    def send_json(self, status, payload, extra_headers=None):
        data = b"" if payload is None else json.dumps(payload).encode()
        self.send_response(status)
        if payload is not None:
            self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        for k, v in (extra_headers or {}).items():
            self.send_header(k, v)
        self.end_headers()
        if data and self.command != "HEAD":
            self.wfile.write(data)

    def authorized(self):
        if not APP_PASSWORD:
            return True
        header = self.headers.get("Authorization", "")
        if header.startswith("Basic "):
            try:
                user, _, pw = base64.b64decode(header[6:]).decode().partition(":")
            except Exception:
                return False
            return hmac.compare_digest(user.encode(), APP_USER.encode()) and hmac.compare_digest(
                pw.encode(), APP_PASSWORD.encode()
            )
        return False

    def read_body(self):
        length = int(self.headers.get("Content-Length") or 0)
        if length > MAX_BODY:
            raise BadRequest("body te groot")
        if not length:
            return {}
        try:
            body = json.loads(self.rfile.read(length))
        except ValueError:
            raise BadRequest("ongeldige JSON")
        if not isinstance(body, dict):
            raise BadRequest("body moet een JSON object zijn")
        return body

    # -- dispatch --
    def handle_any(self):
        path = urlparse(self.path).path
        if path == "/api/health":
            return self.send_json(200, {"ok": True, "version": APP_VERSION})
        if not self.authorized():
            self.send_response(401)
            self.send_header("WWW-Authenticate", 'Basic realm="Klaar", charset="UTF-8"')
            self.send_header("Content-Length", "0")
            self.end_headers()
            return
        if path.startswith("/api/"):
            return self.handle_api(path)
        if self.command in ("GET", "HEAD"):
            return self.serve_static(path)
        self.send_json(405, {"error": "method not allowed"})

    def handle_api(self, path):
        for method, pattern, handler in ROUTES:
            match = pattern.match(path)
            if match and method == self.command:
                try:
                    body = self.read_body() if method in ("POST", "PATCH") else {}
                    status, payload = handler(self.store, body, *match.groups())
                except BadRequest as e:
                    return self.send_json(400, {"error": str(e)})
                except NotFound:
                    return self.send_json(404, {"error": "niet gevonden"})
                headers = None
                if handler is get_export:
                    stamp = datetime.now().strftime("%Y-%m-%d")
                    headers = {"Content-Disposition": f'attachment; filename="klaar-export-{stamp}.json"'}
                return self.send_json(status, payload, headers)
        self.send_json(404, {"error": "niet gevonden"})

    def serve_static(self, path):
        rel = path.lstrip("/") or "index.html"
        target = (STATIC_DIR / rel).resolve()
        if STATIC_DIR not in target.parents or not target.is_file():
            # Unknown paths fall back to the app shell.
            target = STATIC_DIR / "index.html"
        data = target.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", CONTENT_TYPES.get(target.suffix, "application/octet-stream"))
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-cache")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(data)

    do_GET = do_HEAD = do_POST = do_PATCH = do_DELETE = handle_any


def main():
    Handler.store = Store(DB_PATH)
    server = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    auth = "aan" if APP_PASSWORD else "uit"
    print(f"Klaar {APP_VERSION} draait op http://0.0.0.0:{PORT}  (db: {DB_PATH}, wachtwoord: {auth})", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
