# ToDo ✓

Een strakke, self-hosted todo-app voor werk. Eén kleine Docker-container, geen externe afhankelijkheden, je data in één SQLite-bestand.

![ToDo screenshot](docs/screenshot.jpg)

## Features

- **Agenda als startpagina**: je taken in een weekrooster van 2, 3 of 4 weken (zie hieronder)
- **Slimme weergaven**: Vandaag (incl. te laat), Gepland (per dag gegroepeerd), Alle taken, Belangrijk, Voltooid
- **Klanten, projecten en categorieën** om je werk te scheiden (zie hieronder)
- **Snel invoeren** in één regel:
  `Notulen sturen #gemeente +overleg @morgen !hoog`
  - `@vandaag`, `@morgen`, `@overmorgen`, `@vrijdag` / `@vr`, `@volgendeweek`, `@20-10`, `@2026-10-20`
  - `!hoog` / `!middel` / `!laag` (of `!3` `!2` `!1`)
  - `#naam` voor een klant of project, `+naam` voor een categorie; meerdere `+` mag (begin van de naam is genoeg)
- **Detailpaneel** met notities, deadline, prioriteit, klant, project en categorie-labels (slaat automatisch op)
- **Snel verzetten** van een taak met het klokje (lijst en agenda) of de datumknoppen in het detailpaneel: vandaag, morgen, overmorgen, volgende maandag of een week later
- Voortgangsring voor vandaag, afvinken met ongedaan maken, slepen om te sorteren
- **Dupliceren** van een taak (knop in de lijst of het detailpaneel, of `⌘D` / `Ctrl+D`): de kopie opent meteen met de naam geselecteerd, zodat je hem direct kunt hernoemen
- Licht/donker thema, werkt op mobiel en is als app te installeren (PWA)
- Sneltoetsen: `N` nieuwe taak, `/` of `⌘K` zoeken, `⌘D` dupliceren, `1`–`6` wissel weergave, `Esc` sluiten
- JSON-export via de zijbalk
- **Inlogpagina** met "ingelogd blijven", versleuteld opgeslagen wachtwoord en bescherming tegen raden (optioneel)

## Agenda

De startpagina is een agenda van de komende weken (maandag t/m zondag), te wisselen tussen **2, 3 of 4 weken** en te verschuiven met de pijltjes.

- Elke taak met een deadline staat op zijn dag, met de kleur van de klant als streepje en de prioriteit als rondje. Afvinken kan direct in de agenda; klik op een taak voor het detailpaneel.
- **Sleep** een taak naar een andere dag om hem te verzetten.
- Met de **+** bij een dag maak je meteen een taak op die dag (`#klant`, `+label` en `!hoog` werken ook hier).
- Naast (of op smalle schermen boven) de agenda staan **Te laat** en **Nog inplannen**: taken zonder datum. Sleep ze naar een dag om ze in te plannen, of sleep een taak terug naar *Nog inplannen* om de datum weg te halen.
- Op dagen in het verleden zie je wat je hebt afgerond; wat nog open staat, staat onder *Te laat*.
- Klik op het logo om altijd terug te gaan naar de agenda.

## Klanten, projecten en categorieën

| Wat           | Betekenis                        | Voorbeeld                         |
| ------------- | -------------------------------- | --------------------------------- |
| **Klant**     | Voor wie je het werk doet (met eigen kleur) | Gemeente Utrecht, Provincie |
| **Project**   | Een klus, optioneel onder een klant | Koppeling Suite4, Sprint 42    |
| **Categorie** | Labels: wat voor soort werk het is | Overleg, Ontwikkeling, Support  |

- Een taak heeft hooguit één klant en één project, maar zoveel categorieën als je wilt. Klik in het detailpaneel op een label om het aan of uit te zetten, of maak er direct een nieuwe aan met **+ Nieuw**.
- Ook een nieuwe klant of nieuw project maak je direct vanuit het detailpaneel: kies **+ Nieuwe klant…** of **+ Nieuw project…** in de keuzelijst en het wordt meteen aan de taak gekoppeld.
- Alleen klanten hebben een kleur; projecten en categorieën zijn neutraal, zodat de kleur altijd betekent: voor wie is dit Elke klant krijgt een eigen kleur: kleuren die al in gebruik zijn, zijn uitgegrijsd.
- Kies je een project dat bij een klant hoort, dan krijgt de taak automatisch die klant. Kies je een andere klant, dan vervalt het project van de oude klant.
- Projecten zonder klant (bijv. intern werk) staan in de zijbalk onder *Projecten*; projecten van een klant staan onder die klant.
- De klantweergave groepeert taken per project. Een categorie loopt dwars door alle klanten heen, zodat je bijvoorbeeld al je overleggen bij elkaar ziet.
- Sleep een taak naar een klant of project in de zijbalk om hem te verplaatsen, of naar een categorie om dat label toe te voegen.

## Starten

Images staan op GitHub Container Registry als `ghcr.io/richrdj/todo` (amd64 + arm64, dus ook voor een Raspberry Pi of Synology).

| Tag                 | Wat                                                  |
| ------------------- | ---------------------------------------------------- |
| `latest`            | Laatste release                                      |
| `1.2.3` `1.2` `1`   | Vaste release (`1` volgt automatisch 1.x-updates)    |
| `edge`              | Laatste commit op `main`, ongetest                   |

### Docker stack (Swarm / Portainer)

```bash
docker stack deploy -c stack.yml klaar
```

Een vaste versie kiezen:

```bash
KLAAR_VERSION=1.0.0 docker stack deploy -c stack.yml klaar
```

Bij elke [release](https://github.com/RichrdJ/todo/releases) staat ook een `klaar-stack.yml` met de versie al ingevuld. In Portainer: *Stacks → Add stack → Web editor* en plak de inhoud van `stack.yml`.

De stack draait bewust precies één container: SQLite verdraagt geen twee schrijvers tegelijk. Updates stoppen daarom eerst de oude container voordat de nieuwe start.

### Docker Compose

```bash
git clone https://github.com/RichrdJ/todo.git
cd todo
docker compose up -d
```

Open daarna <http://localhost:6060>. Dit bouwt de image lokaal; wil je de kant-en-klare image, vervang dan in `docker-compose.yml` de regel `build: .` door `image: ghcr.io/richrdj/todo:latest`.

### Alleen Docker

```bash
docker run -d --name klaar -p 6060:6060 -v klaar-data:/data --restart unless-stopped ghcr.io/richrdj/todo:latest
```

### Zonder Docker

Alleen Python 3.9+ nodig:

```bash
python3 server.py
```

## Configuratie

| Variabele           | Standaard        | Uitleg                                                        |
| ------------------- | ---------------- | ------------------------------------------------------------- |
| `PORT`              | `6060`           | Poort waarop de server luistert                               |
| `DB_PATH`           | `/data/klaar.db` | Locatie van de SQLite-database                                |
| `APP_USER`          | `admin`          | Gebruikersnaam om in te loggen                                |
| `APP_PASSWORD_HASH` | _(leeg)_         | Versleuteld wachtwoord (aanbevolen), zie hieronder            |
| `APP_PASSWORD`      | _(leeg)_         | Wachtwoord als gewone tekst (eenvoudiger, minder veilig)      |
| `SESSION_DAYS`      | `30`             | Hoe lang *ingelogd blijven* geldt                             |
| `COOKIE_SECURE`     | `auto`           | `true` / `false` / `auto` (auto: alleen achter een HTTPS-proxy) |
| `TZ`                | —                | Tijdzone, bijv. `Europe/Amsterdam`                            |

## Inloggen

Zonder wachtwoord opent de app direct. Zet je `APP_PASSWORD_HASH` (of `APP_PASSWORD`), dan krijg je een inlogpagina.

**Versleuteld wachtwoord maken:**

```bash
docker run --rm -it ghcr.io/richrdj/todo:latest python server.py hash-password
```

Dit vraagt twee keer je wachtwoord en geeft een regel als `APP_PASSWORD_HASH: "pbkdf2_sha256:600000:…"` die je zo in `stack.yml` of `docker-compose.yml` zet.

- **Ingelogd blijven** houdt je `SESSION_DAYS` dagen ingelogd; zonder dat vinkje eindigt de sessie als je de browser sluit (en na uiterlijk 12 uur).
- Na **5 foute pogingen** in 15 minuten wordt inloggen vanaf dat adres een kwartier geblokkeerd.
- **Uitloggen** via het icoon rechtsboven in de zijbalk.
- Scripts kunnen de API nog steeds met basic auth gebruiken (`curl -u gebruiker:wachtwoord …`).

Draai je ToDo buiten je eigen netwerk, zet er dan een reverse proxy met HTTPS voor (Caddy, Traefik, Nginx Proxy Manager). De inlogcookie wordt dan automatisch alleen over HTTPS verstuurd.

## Back-up

Alle data staat in het volume `klaar-data` (`/data/klaar.db`). Een back-up maken:

```bash
docker cp klaar:/data/klaar.db ./klaar-backup.db
```

Of download een JSON-export via **Export** onderin de zijbalk.

## API

| Methode  | Pad                     | Doel                              |
| -------- | ----------------------- | --------------------------------- |
| `GET`    | `/api/state`            | Alle klanten, projecten, categorieën en taken |
| `POST`   | `/api/todos`            | Taak aanmaken                     |
| `PATCH`  | `/api/todos/:id`        | Taak wijzigen                     |
| `DELETE` | `/api/todos/:id`        | Taak verwijderen                  |
| `POST`   | `/api/todos/reorder`    | Volgorde opslaan (`{"ids": [...]}`) |
| `POST`   | `/api/projects`         | Project aanmaken                  |
| `PATCH`  | `/api/projects/:id`     | Project wijzigen                  |
| `DELETE` | `/api/projects/:id`     | Project verwijderen               |
| `POST` `PATCH` `DELETE` | `/api/clients[/:id]` | Klanten, net als projecten |
| `POST` `PATCH` `DELETE` | `/api/categories[/:id]` | Categorieën, net als projecten |
| `GET`    | `/api/export`           | JSON-export                       |
| `GET`    | `/api/health`           | Healthcheck (zonder auth)         |

## Releases

Versies volgen [SemVer](https://semver.org). Een nieuwe release maken:

1. Werk [CHANGELOG.md](CHANGELOG.md) bij en commit.
2. Tag en push:

   ```bash
   git tag v1.1.0
   git push origin v1.1.0
   ```

GitHub Actions bouwt dan de image (`1.1.0`, `1.1`, `1` en `latest`) en maakt een GitHub Release met automatische release notes en een `klaar-stack.yml`. De versie staat ook rechtsonder in de app en in `/api/health`.

## Techniek

- Backend: Python standaardbibliotheek (`http.server` + `sqlite3`), één bestand
- Frontend: vanilla HTML/CSS/JS, geen build-stap
- Image: `python:3.13-alpine`, draait als niet-root gebruiker
