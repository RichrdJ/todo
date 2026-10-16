# Klaar ✓

Een strakke, self-hosted todo-app voor werk. Eén kleine Docker-container, geen externe afhankelijkheden, je data in één SQLite-bestand.

![Klaar screenshot](docs/screenshot.jpg)

## Features

- **Slimme weergaven**: Vandaag (incl. te laat), Gepland (per dag gegroepeerd), Alle taken, Belangrijk, Voltooid
- **Projecten** met eigen kleur; sleep een taak naar een project in de zijbalk om hem te verplaatsen
- **Snel invoeren** in één regel:
  `Offerte sturen @morgen !hoog #klant`
  - `@vandaag`, `@morgen`, `@overmorgen`, `@vrijdag` / `@vr`, `@volgendeweek`, `@20-10`, `@2026-10-20`
  - `!hoog` / `!middel` / `!laag` (of `!3` `!2` `!1`)
  - `#project` (begin van de projectnaam is genoeg)
- **Detailpaneel** met notities, deadline, prioriteit en project (slaat automatisch op)
- Voortgangsring voor vandaag, afvinken met ongedaan maken, slepen om te sorteren
- Licht/donker thema, werkt op mobiel en is als app te installeren (PWA)
- Sneltoetsen: `N` nieuwe taak, `/` of `⌘K` zoeken, `1`–`5` wissel weergave, `Esc` sluiten
- JSON-export via de zijbalk
- Optioneel wachtwoord (HTTP basic auth)

## Starten

### Docker Compose (aanbevolen)

```bash
git clone https://github.com/<jouw-gebruiker>/klaar.git
cd klaar
docker compose up -d
```

Open daarna <http://localhost:8080>.

### Alleen Docker

```bash
docker build -t klaar .
docker run -d --name klaar -p 8080:8080 -v klaar-data:/data --restart unless-stopped klaar
```

### Kant-en-klare image

Bij elke push naar `main` bouwt GitHub Actions een multi-arch image (amd64 + arm64, dus ook voor een Raspberry Pi of Synology):

```bash
docker run -d --name klaar -p 8080:8080 -v klaar-data:/data ghcr.io/<jouw-gebruiker>/klaar:latest
```

> Is de repo privé, dan is de package dat ook. Log dan eerst in met `docker login ghcr.io`, of zet de package op public in GitHub onder *Packages → Package settings*.

### Zonder Docker

Alleen Python 3.9+ nodig:

```bash
python3 server.py
```

## Configuratie

| Variabele      | Standaard        | Uitleg                                          |
| -------------- | ---------------- | ----------------------------------------------- |
| `PORT`         | `8080`           | Poort waarop de server luistert                 |
| `DB_PATH`      | `/data/klaar.db` | Locatie van de SQLite-database                  |
| `APP_PASSWORD` | _(leeg)_         | Zet dit om de app met een wachtwoord te beveiligen |
| `APP_USER`     | `admin`          | Gebruikersnaam bij wachtwoordbeveiliging        |
| `TZ`           | —                | Tijdzone, bijv. `Europe/Amsterdam`              |

Draai je Klaar buiten je eigen netwerk, zet dan een `APP_PASSWORD` én een reverse proxy met HTTPS (Caddy, Traefik, Nginx Proxy Manager) ervoor; basic auth zonder HTTPS stuurt het wachtwoord leesbaar mee.

## Back-up

Alle data staat in het volume `klaar-data` (`/data/klaar.db`). Een back-up maken:

```bash
docker cp klaar:/data/klaar.db ./klaar-backup.db
```

Of download een JSON-export via **Export** onderin de zijbalk.

## API

| Methode  | Pad                     | Doel                              |
| -------- | ----------------------- | --------------------------------- |
| `GET`    | `/api/state`            | Alle projecten en taken           |
| `POST`   | `/api/todos`            | Taak aanmaken                     |
| `PATCH`  | `/api/todos/:id`        | Taak wijzigen                     |
| `DELETE` | `/api/todos/:id`        | Taak verwijderen                  |
| `POST`   | `/api/todos/reorder`    | Volgorde opslaan (`{"ids": [...]}`) |
| `POST`   | `/api/projects`         | Project aanmaken                  |
| `PATCH`  | `/api/projects/:id`     | Project wijzigen                  |
| `DELETE` | `/api/projects/:id`     | Project verwijderen               |
| `GET`    | `/api/export`           | JSON-export                       |
| `GET`    | `/api/health`           | Healthcheck (zonder auth)         |

## Techniek

- Backend: Python standaardbibliotheek (`http.server` + `sqlite3`), één bestand
- Frontend: vanilla HTML/CSS/JS, geen build-stap
- Image: `python:3.13-alpine`, draait als niet-root gebruiker
