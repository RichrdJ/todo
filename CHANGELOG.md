# Changelog

Alle noemenswaardige wijzigingen per versie. Formaat volgens [Keep a Changelog](https://keepachangelog.com/nl/1.1.0/), versies volgens [SemVer](https://semver.org/lang/nl/).

## [Unreleased]

## [1.3.1] - 2026-10-16

### Toegevoegd
- In het detailpaneel kun je via **+ Nieuwe klant…** en **+ Nieuw project…** direct een klant of project aanmaken en aan de taak koppelen; een nieuw project krijgt automatisch de klant van de taak

## [1.3.0] - 2026-10-16

### Toegevoegd
- Categorieën werken als labels: een taak kan er meerdere hebben
- Labels aan- en uitzetten in het detailpaneel, en direct een nieuw label maken met **+ Nieuw**
- Meerdere `+label` bij snel invoeren; een taak naar een categorie slepen voegt dat label toe

### Gewijzigd
- Alleen klanten hebben nog een kleur; projecten en categorieën worden neutraal weergegeven
- Bestaande categorieën van taken worden bij het opstarten automatisch omgezet naar labels
- API: taken hebben `category_ids` (lijst) in plaats van `category_id`

## [1.2.0] - 2026-10-16

### Gewijzigd
- Standaardpoort is nu **6060** (was 8080). Gebruik je een eigen stack- of compose-bestand met `8080:8080`, verander dat dan in `6060:6060` (of `8080:6060` om de oude poort aan de buitenkant te houden).

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

[Unreleased]: https://github.com/RichrdJ/todo/compare/v1.3.1...HEAD
[1.3.1]: https://github.com/RichrdJ/todo/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/RichrdJ/todo/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/RichrdJ/todo/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/RichrdJ/todo/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/RichrdJ/todo/releases/tag/v1.0.0
