# Hinweise zum Programmierbeispiel

<Juergen.Zimmermann@HS-Karlsruhe.de>

> Diese Datei ist in Markdown geschrieben und kann mit `<Strg><Shift>v` in
> Visual Studio Code leicht gelesen werden.
>
> Näheres zu Markdown gibt es in einem [Wiki](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)
>
> Nur in den ersten beiden Vorlesungswochen kann es Unterstützung bei
> Installationsproblemen geben.

## Vorbereitung der Installation

-   Das Beispiel _nicht_ in einem Pfad mit _Leerzeichen_ installieren.
    Viele Javascript-Bibliotheken werden unter Linux entwickelt und dort benutzt
    man keine Leerzeichen in Pfaden. Ebenso würde ich das Beispiel nicht auf dem
    _Desktop_ auspacken bzw. installieren.

-   Bei [GitHub](https://github.com) registrieren, falls man dort noch nicht registriert ist.

## Installation

-   _Falls es das Unterverzeichnis `node_modules` **NICHT** gibt_:
    Installation durch npm (Node Package Manager) in einer Powershell (s.u.), :
    -   Die Installation der Software-Pakete erfolgt i.a. über [NPM](http://www.npmjs.com)
        und damit über den Port 80 (oder 443 bei https). Wenn `git` benötigt wird,
        dann wird `ssh` aufgerufen und deshalb _Port 22_ benötigt.
    -   Eine persönliche Firewall o.ä. kann diesen Port blockieren.
        Dann funktioniert die Installation natürlich _nicht_ und man muss z.B.
        die eigene Firewall geeignet konfigurieren oder vorübergehend ausschalten.
    -   Der Port 22 ist am Hochschul-Proxy _nicht_ freigeschaltet.

```CMD
    npm i
```

## Künftige Routineaufgaben

### Starten und Herunterfahren von MongoDB

```CMD
    npm run mongo
    npm run mongo stop
```

### JSON-Datensätze in MongoDB importieren und exportieren

```CMD
    npm run mongo import
    npm run mongo export
```

Beim Importieren wird die Datei `config\mongoimport\spiel.json` verwendet.
Beim Importieren darf der DB-Browser _Mongo Express_ (s.u.) nicht gestartet
sein.

### Datenbankbrowser _Compass_

Defaultwerte für MongoDB beibehalten zzgl. Authentifizierung:

```YAML
    Server:         localhost
    Port:           27017
    Authentication: admin/p
```

Alternativ könnte man auch _Mongo Express_ verwenden, was allerdings immer
wieder Probleme macht, wenn MongoDB über TLS angesprochen werden muss:

```CMD
    npm run mongo mongoexpress
```

Bei _Mongo Express_ wird ein Webserver gestartet. Über einen Webbrowser kann
dann mit der URI `https://localhost:8081/db/hskadb/spiel` auf die Collection
`spiel` in der Datenbank `hska` zugegriffen werden.

## Übersetzung durch den TypeScript-Compiler in einer Powershell

```CMD
    npm run tsc
```

-   Zuerst die Codequalität mit _tslint_ prüfen und dann
-   .ts-Dateien durch _tsc_ in das Verzeichnis `dist` übersetzen

## Starten des Appservers (mit Node.js und Express)

### Mit _nodemon_ in einer Powershell

Durch _nodemon_ (= Node Monitor) wird der Appserver so gestartet, dass er
JavaScript-Dateien im laufenden Betrieb nachlädt, wenn sie später aktualisiert
werden, weil z.B. eine TypeScript-Datei neu übersetzt wird.
Beim Starten des Appservers wird mit _mongoose_ auf _MongoDB_ zugegriffen.

```CMD
    npm start
```

Von Zeit zu Zeit hängt sich nodemon auf und muss dann halt neu gestartet werden.

Falls _nodemon_ nicht vernünftig funktioniert, kann man auch den Appserver
direkt starten (s.u.) und muss diesen dann _bei jeder Änderung_ neu starten.

### Ohne _nodemon_ in einer Powershell

```CMD
    npm run serve
```

Dadurch wird der eigene Node-basierte Server gestartet. Das ist _aber_ nach jeder
Übersetzung neu erforderlich.

### Mocking der DB

```CMD
    $env:MOCK_DB = "true"
    npm start
```

Dadurch wird der eigene Node-basierte Server gestartet, ohne dass auf die
Datenbank zugegriffen wird. Stattdessen wird mit Mock-Objekten gearbeitet.

### Interaktiver Client für GraphQL im Webbrowser

```URL
    https://localhost:8443/api
```

Beispielhafte Eingaben sind in der Date `config\graphql\beispiele.txt`.

## Tests aufrufen

### Voraussetzungen

-   Der MongoDB-Server muss laufen
-   Der Appserver darf _nicht_ laufen

### Aufruf in einer Powershell

```CMD
    npm t
```

Statt `t` kann man auch `test` ausschreiben.

## Empfohlene Entwicklungsumgebung

### Visual Studio Code oder WebStorm

[Visual Studio Code](https://code.visualstudio.com/Download) kann man
kostenfrei herunterladen.

> Tipps:
>
> -   `<Strg>kc` : Markierte Zeilen werden auskommentiert
> -   `<Strg>ku` : Bei markierten Zeilen wird der Kommentar entfernt
> -   `<Strg><Shift>p`: `Terminal: Neues integriertes Terminal erstellen`

Für WebStorm gibt es bei [JetBrains](http://jetbrains.com/student) auf
Initiative von Jürgen Zimmermann eine Studenten-Lizenz, die für 1 Jahr gültig
ist.

Für Visual Studio Code ist u.a. die Erweiterung _REST Client_ aus dem
Marketplace empfehlenswert.

### Chrome mit Erweiterungen

#### _JSON Viewer_ für GET-Requests

Aus dem [Chrome Webstore](https://chrome.google.com/webstore) installieren.

#### _Recx Security Analyzer_ für Sicherheitslücken

Aus dem [Chrome Webstore](https://chrome.google.com/webstore) installieren.

## Empfohlene Code-Konventionen

In Anlehnung an die [Guidelines von TypeScript](https://github.com/Microsoft/TypeScript/wiki/Coding-guidelines)

-   "Feature Filenames", z.B. spiel.service.ts
-   Klassennamen und Enums mit PascalCase,
-   Attribute und Funktionen mit camelCase,
-   private Properties _nicht_ mit vorangestelltem **\_**,
-   Interfaces _nicht_ mit vorangestelltem **I**
-   _Barrel_ für häufige Imports, z.B.
    -   `shared\index.ts` erstellen:
        ```javascript
        export * from './bar';
        export * from './foo';
        ```
    -   einfaches Importieren:
        ```javascript
        import { Bar, Foo } from 'shared';
        ```
-   [...].forEach() und [...].filter() statt for-Schleife
-   Arrow-Functions statt anonyme Funktionen
-   undefined verwenden, nicht: null
-   Geschweifte Klammern bei if-Anweisungen
-   Maximale Dateigröße: 400 Zeilen
-   Maximale Funktionsgröße: 75 Zeilen

## Sonstiges

### Endlosrekursion bei `JSON.stringify(obj)`

Ein JSON-Objekt kann eine rekursive Datenstruktur haben, wie z.B.:

```javascript
const obj: any = {
    id: 4711,
    foo: {
        bar: 'a string',
        rekursiv: obj,
    },
};
```

Bei einer solchen rekursiven Datenstruktur gibt es beim Aufruf von
`JSON.stringify(obj)` eine Endlosrekursion und damit einen _Stackoverflow_.
Bei den _Request_- und _Response_-Objekten von _Express_ gibt es rekursive
Datenstrukturen.

Alternative 1: Mit der Function `stringify` von _fast-safe-stringify_ kann man
dennoch ein Objekt mit einer rekursiven Datenstruktur in einen String
konvertieren:

```javascript
    import stringify from 'fast-safe-stringify'
    ...
    stringify(obj)   // statt JSON.stringify(obj)
```

Alternative 2: Mit der Function `inspect` von Node.js kann man dennoch ein
Objekt mit einer rekursiven Datenstruktur in einen String konvertieren:

```javascript
    import {inspect} from 'util'   // util ist Bestandteil von Node.js
    ...
    inspect(obj)   // statt JSON.stringify(obj)
```

### Debugging mit Visual Studio Code

-   Das _Debug Icon_ in der _Activity Bar_ anklicken
-   Den Tab _Terminal_ auswählen, dort in das Projektverzeichnis wechseln und
    dann `nodemon` als (Remote) Server starten:

```cmd
    cd <Projektverzeichnis>
    nodemon -V
```

`nodemon` ruft dann die JS-Datei auf, die in `package.json` bei der Property
_main_ steht, d.h. `dist\index.js`.

Nun kann man Breakpoints setzen, indem man bei einer geöffneten .ts-Datei links
von der Zeilennummer klickt. Beim Übersetzen hat nämlich der TypeScript-Compiler
Dateien für das _Source Mapping_ generiert.

Jetzt muss man nur noch links oben bei "Debugging starten" auf den linken grünen
Button klicken (siehe auch .vscode\launch.json).

_Am Ende nicht vergessen, im Terminal den Server mit `<Strg>C` zu beenden!_

[Dokumentation zum Debugging](https://code.visualstudio.com/docs/nodejs/nodejs-debugging)
