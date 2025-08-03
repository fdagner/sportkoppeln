# Sportkoppeln - README

## Überblick

**Sportkoppeln** ist eine Webanwendung zur Verwaltung und Optimierung von Sportgruppen (Koppeln) für Schulklassen, basierend auf Jahrgangsstufen, Schülerzahlen und verfügbaren Sporthallen. Die Anwendung ermöglicht das Erstellen, Bearbeiten und Speichern von Klassen, das automatische Generieren von Koppeln unter Berücksichtigung von Hallenbeschränkungen sowie das manuelle Anpassen von Koppeln per Drag-and-Drop. Daten werden im `localStorage` des Browsers gespeichert, Klassen können über CSV-Dateien importiert werden.

## Funktionen

- **Klassenverwaltung**:
  - Hinzufügen, Bearbeiten und Löschen von Klassen mit Jahrgangsstufe, Klassenname, Anzahl weiblicher und männlicher Schüler.
  - Drag-and-Drop zum Umordnen von Klassen in der Liste.
  - Import von Klassen aus CSV-Dateien.
- **Einstellungen**:
  - Konfiguration der maximalen und minimalen Gruppengröße pro Halle sowie der maximalen Anzahl an Hallen pro Koppel.
- **Koppelbildung**:
  - Automatische Erstellung von Sportgruppen (Koppeln) basierend auf einem Greedy-Algorithmus, der Schülerzahlen und Hallenbeschränkungen berücksichtigt.
  - Optimierung durch Klassentausch und Zusammenfassen kleiner Koppeln.
  - Sperren/Entsperren einzelner Koppeln, um manuelle Anpassungen zu fixieren.
  - Drag-and-Drop zum manuellen Verschieben von Klassen zwischen Koppeln.
- **Datenpersistenz**:
  - Speichern von Klassen, Einstellungen und Koppeln im `localStorage`.
  - Laden der gespeicherten Daten beim Start der Anwendung.
- **Debugging**:
  - Anzeige von Debug-Informationen und Warnungen zu ungültigen Konfigurationen (z. B. zu kleine Gruppen oder Überschreitung der Hallenanzahl).
- **Benutzeroberfläche**:
  - Tab-basierte Navigation zwischen Klassenverwaltung, Einstellungen und Koppeln.
  - Visuelle Rückmeldung für gesperrte Koppeln und Drag-and-Drop-Interaktionen.

## Technologien

- **Frontend**: HTML, CSS, JavaScript (Vanilla JS)
- **Speicherung**: `localStorage` für persistente Daten
- **Drag-and-Drop**: HTML5 Drag-and-Drop API
- **Icons**: Font Awesome für Sperr-/Entsperrsymbole

## Verwendung

### 1. Klassen hinzufügen
- **Manuell**:
  - Navigieren Sie zum Tab „Klassen“.
  - Geben Sie Jahrgangsstufe, Klassenname, Anzahl weiblicher und männlicher Schüler ein.
  - Klicken Sie auf „Klasse hinzufügen“.
  - Hinweis: Der Klassenname muss mit einer Zahl beginnen (z. B. `9A`), oder die Jahrgangsstufe muss explizit angegeben werden.
- **CSV-Import**:
  - Ziehen Sie eine CSV-Datei in den Upload-Bereich oder wählen Sie sie aus.
  - Format: `Klassenname;Weibliche Schüler;Männliche Schüler` (z. B. `9A;10;12`).
  - Kopfzeile (z. B. `Klasse;Weiblich;Männlich`) wird übersprungen.

### 2. Einstellungen anpassen
- Navigieren Sie zum Tab „Einstellungen“.
- Legen Sie die maximale Anzahl an Hallen pro Koppel (`halls`), die maximale Gruppengröße pro Halle (`maxSize`) und die minimale Gruppengröße (`minSize`) fest.
- Klicken Sie auf „Einstellungen speichern“.
- Validierung: `halls` muss zwischen 2 und 100 liegen, `maxSize` ≥ `minSize`, und beide müssen ≥ 1 sein.

### 3. Koppeln berechnen
- Navigieren Sie zum Tab „Koppeln“.
- Klicken Sie auf „Koppeln berechnen“, um automatisch optimierte Sportgruppen zu erstellen.
- Ergebnisse werden pro Jahrgangsstufe angezeigt, mit Schülerzahlen und Hallenaufteilung.
- Warnungen werden angezeigt, wenn Koppeln die Beschränkungen verletzen (z. B. zu wenige Schüler oder zu viele Hallen).

### 4. Koppeln bearbeiten
- **Sperren/Entsperren**: Klicken Sie auf das Schloss-Symbol neben einer Koppel, um sie zu fixieren oder wieder editierbar zu machen.
- **Drag-and-Drop**: Ziehen Sie Klassen zwischen Koppeln oder in eine neue Koppel („Neue Koppel“-Zeile), um die Gruppen manuell anzupassen.
- Hinweis: Gesperrte Koppeln können nicht bearbeitet werden, und Klassen können nur innerhalb derselben Jahrgangsstufe verschoben werden.

### 5. Daten zurücksetzen
- Klicken Sie auf „Daten zurücksetzen“, um alle Klassen, Koppeln und Einstellungen zu löschen und auf Standardwerte zurückzusetzen (`maxSize: 30`, `minSize: 12`, `halls: 2`).

## Dateistruktur

```plaintext
sportkoppeln/
├── index.html       # Haupt-HTML-Datei mit der Benutzeroberfläche
├── style.css        # CSS-Styles für Layout und visuelle Gestaltung
├── script.js        # JavaScript-Logik für Funktionalität und Datenverarbeitung
└── README.md        # Diese Dokumentation

## CSV-Format für Import

Die CSV-Datei für den Klassenimport muss folgendes Format haben:

```plaintext
Klasse;w;m
9A;10;12
9B;15;10
...