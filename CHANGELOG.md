# Changelog

Alle noemenswaardige wijzigingen per versie. Formaat volgens [Keep a Changelog](https://keepachangelog.com/nl/1.1.0/), versies volgens [SemVer](https://semver.org/lang/nl/).

## [Unreleased]

## [1.7.0] - 2026-10-19

### Toegevoegd
- Instellingen (tandwiel in de zijbalk, of `,`): thema licht/donker/systeem, startpagina, aantal agendaweken, weekend en afgeronde taken in de agenda aan/uit
- Inloggen aan- en uitzetten in de instellingen, met gebruikersnaam en wachtwoord (versleuteld in de database); geen stack-variabele meer nodig
- Wachtwoord wijzigen in de app; dat vraagt om je huidige wachtwoord en logt andere apparaten uit
- *Andere apparaten uitloggen* in de instellingen
- `python server.py reset-login` als je het wachtwoord uit de app kwijt bent

### Gewijzigd
- `APP_PASSWORD_HASH` / `APP_PASSWORD` werken zoals voorheen en gaan vóór een wachtwoord uit de app
- Het logo brengt je naar je gekozen startpagina (standaard de agenda)

## [1.6.0] - 2026-10-16

### Toegevoegd
- Inlogpagina in plaats van het browserpopupje, met *ingelogd blijven* (standaard 30 dagen) en een uitlogknop
- Versleuteld wachtwoord via `APP_PASSWORD_HASH`; maak er een met `python server.py hash-password`
- Na 5 foute inlogpogingen in 15 minuten wordt inloggen een kwartier geblokkeerd
- Snel verzetten: klokje bij taken in de lijst en de agenda met vandaag, morgen, overmorgen, volgende maandag, een week later of geen datum, met ongedaan maken
- Detailpaneel: dezelfde keuzes als datumknoppen

### Gewijzigd
- `APP_PASSWORD` werkt nog steeds, maar toont nu de inlogpagina. Basic auth blijft werken voor scripts
- Schrijfacties vanaf andere websites worden geweigerd

## [1.5.0] - 2026-10-16

### Toegevoegd
- Taken dupliceren via de knop in de lijst, in het detailpaneel of met `⌘D` / `Ctrl+D`
- De kopie komt direct onder het origineel, met dezelfde deadline, prioriteit, klant, project, labels en notities, en opent meteen met de naam geselecteerd om te hernoemen

## [1.4.3] - 2026-10-16

### Gewijzigd
- Agenda: de knoppen rechtsboven (weken en navigatie) lijnen uit met de rechterrand van de taakbalk en de agenda
- Agenda: de weeknavigatie staat in hetzelfde kader als de weekkeuze

## [1.4.2] - 2026-10-16

### Gewijzigd
- Agenda: *Nog inplannen* begint op dezelfde hoogte als de eerste rij dagen
- Agenda: de balk voor een nieuwe taak is even breed als de agenda zelf

## [1.4.1] - 2026-10-16

### Gewijzigd
- De app heet nu **ToDo** (was Klaar), met een nieuw logo en de datum van vandaag onder de naam
- Technische namen (volume `klaar-data`, databasebestand `klaar.db`, stacknaam) blijven hetzelfde, zodat bestaande data gewoon behouden blijft

## [1.4.0] - 2026-10-16

### Toegevoegd
- Agenda als startpagina: weekrooster van 2, 3 of 4 weken met je taken per dag
- Taken naar een andere dag slepen om ze te verzetten; **+** per dag om direct een taak op die dag te maken
- Vak *Te laat* en *Nog inplannen* (taken zonder datum) naast de agenda; sleep ze naar een dag om ze in te plannen
- Op mobiel een lijst per dag, met *Te laat* en *Nog inplannen* bovenaan

### Gewijzigd
- De app opent altijd op de agenda; klik op het logo om ernaar terug te gaan
- Sneltoetsen: `1` agenda, `2` vandaag, `3` gepland, `4` alle taken, `5` belangrijk, `6` voltooid

## [1.3.2] - 2026-10-16

### Gewijzigd
- Kleuren die al bij een andere klant horen zijn uitgegrijsd (met de klantnaam als tooltip), zodat elke klant een eigen kleur houdt
- Een nieuwe klant krijgt automatisch de eerste vrije kleur
- Palet uitgebreid van 10 naar 16 kleuren; zijn ze allemaal bezet, dan mag je er weer een dubbel kiezen

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

[Unreleased]: https://github.com/RichrdJ/todo/compare/v1.7.0...HEAD
[1.7.0]: https://github.com/RichrdJ/todo/compare/v1.6.0...v1.7.0
[1.6.0]: https://github.com/RichrdJ/todo/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/RichrdJ/todo/compare/v1.4.3...v1.5.0
[1.4.3]: https://github.com/RichrdJ/todo/compare/v1.4.2...v1.4.3
[1.4.2]: https://github.com/RichrdJ/todo/compare/v1.4.1...v1.4.2
[1.4.1]: https://github.com/RichrdJ/todo/compare/v1.4.0...v1.4.1
[1.4.0]: https://github.com/RichrdJ/todo/compare/v1.3.2...v1.4.0
[1.3.2]: https://github.com/RichrdJ/todo/compare/v1.3.1...v1.3.2
[1.3.1]: https://github.com/RichrdJ/todo/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/RichrdJ/todo/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/RichrdJ/todo/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/RichrdJ/todo/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/RichrdJ/todo/releases/tag/v1.0.0
