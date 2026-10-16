# Changelog

Alle noemenswaardige wijzigingen per versie. Formaat volgens [Keep a Changelog](https://keepachangelog.com/nl/1.1.0/), versies volgens [SemVer](https://semver.org/lang/nl/).

## [Unreleased]

## [1.1.0] - 2026-10-16

### Toegevoegd
- Klanten: projecten en taken kun je aan een klant koppelen; de klantweergave groepeert taken per project
- Categorieën (bijv. Overleg, Support) als aparte indeling dwars door klanten heen
- Snel invoeren: `#naam` voor klant of project, `+naam` voor categorie
- Klant, project en categorie in het detailpaneel; slepen naar de zijbalk werkt voor alle drie
- Zoeken vindt taken ook op naam van klant, project of categorie

### Gewijzigd
- Een taak met een project van een klant krijgt automatisch die klant
- Bestaande databases van 1.0.0 worden bij het opstarten automatisch bijgewerkt

## [1.0.0] - 2026-10-16

### Toegevoegd
- Weergaven Vandaag, Gepland, Alle taken, Belangrijk en Voltooid
- Projecten met kleur, taken verslepen naar een project
- Snel invoeren met `@datum`, `!prioriteit` en `#project`
- Detailpaneel met notities, deadline, prioriteit en project
- Voortgangsring, ongedaan maken, sorteren door te slepen
- Licht/donker thema, mobiele weergave, PWA
- JSON-export, optionele wachtwoordbeveiliging
- Docker-image op ghcr.io, `docker-compose.yml` en `stack.yml` voor Docker Swarm / Portainer
- Versienummer in de app en in `/api/health`

[Unreleased]: https://github.com/RichrdJ/todo/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/RichrdJ/todo/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/RichrdJ/todo/releases/tag/v1.0.0
