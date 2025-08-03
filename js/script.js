   // Globale Variable für Drag-Daten (Fallback-Methode)
      let dragData = null;

      // Daten-Variablen
      let classes = [];
      let settings = {
        maxSize: 30,
        minSize: 12,
        halls: 4,
      };
      let currentCouples = {};

      // Funktion zum Speichern der Daten im localStorage
      function saveToLocalStorage() {
        localStorage.setItem("sportkoppeln_classes", JSON.stringify(classes));
        localStorage.setItem("sportkoppeln_settings", JSON.stringify(settings));
        localStorage.setItem(
          "sportkoppeln_couples",
          JSON.stringify(currentCouples)
        );
        updateDebugInfo("Daten im localStorage gespeichert");
      }

      // Funktion zum Laden der Daten aus dem localStorage
      function loadFromLocalStorage() {
        const savedClasses = localStorage.getItem("sportkoppeln_classes");
        const savedSettings = localStorage.getItem("sportkoppeln_settings");
        const savedCouples = localStorage.getItem("sportkoppeln_couples");

        if (savedClasses) {
          classes = JSON.parse(savedClasses);
        }
        if (savedSettings) {
          settings = JSON.parse(savedSettings);
        }
        if (savedCouples) {
          currentCouples = JSON.parse(savedCouples);
          // Sicherstellen, dass jede Koppel eine locked-Eigenschaft hat
          Object.keys(currentCouples).forEach((year) => {
            currentCouples[year].forEach((couple) => {
              if (typeof couple.locked === "undefined") {
                couple.locked = false;
              }
            });
          });
        }

        document.getElementById("maxSize").value = settings.maxSize;
        document.getElementById("minSize").value = settings.minSize;
        document.getElementById("halls").value = settings.halls;

        updateClassTable();
        renderAllCouples(); // Einheitliches Rendering aller Jahrgangsstufen
        updateDebugInfo("Daten aus localStorage geladen");
      }

      // Beim Laden der Seite Daten aus localStorage laden
      document.addEventListener("DOMContentLoaded", loadFromLocalStorage);

      // Debug-Funktionen
      function updateDebugInfo(message) {
        const debugElement = document.getElementById("debugInfo");
        debugElement.textContent = `Debug: ${message}`;
        console.log("Debug:", message);
      }

      // Klassenliste anzeigen (editierbar)
      function updateClassTable() {
        const tbody = document.getElementById("classTableBody");
        tbody.innerHTML = "";
        classes.forEach((cls, index) => {
          const row = document.createElement("tr");
          row.setAttribute("data-index", index);
          row.setAttribute("draggable", "true"); // Zeile draggable machen
          row.classList.add("class-row"); // Klasse für Styling
          row.innerHTML = `
            <td><span class="drag-handle">☰</span></td> <!-- Neue Spalte mit Drag-Symbol -->
            <td><input type="text" value="${cls.yearGroup}" class="edit-yearGroup" data-index="${index}"></td>
            <td><input type="text" value="${cls.className}" class="edit-className" data-index="${index}"></td>
            <td><input type="number" value="${cls.female}" min="0" class="edit-female" data-index="${index}"></td>
            <td><input type="number" value="${cls.male}" min="0" class="edit-male" data-index="${index}"></td>
            <td><button onclick="deleteClass(${index})">Löschen</button></td>
        `;
          // Drag-and-Drop Event-Listener
          row.addEventListener("dragstart", handleClassDragStart);
          row.addEventListener("dragover", handleClassDragOver);
          row.addEventListener("drop", handleClassDrop);
          row.addEventListener("dragenter", handleClassDragEnter);
          row.addEventListener("dragleave", handleClassDragLeave);
          tbody.appendChild(row);
        });

        // Event-Listener für Änderungen in editierbaren Feldern
        document
          .querySelectorAll(
            ".edit-yearGroup, .edit-className, .edit-female, .edit-male"
          )
          .forEach((input) => {
            input.addEventListener("change", handleClassEdit);
          });

        // Daten speichern
        saveToLocalStorage();
      }

      // Globale Variable für Drag-Daten der Klassentabelle
      let classDragData = null;

      function handleClassDragStart(e) {
        const element = e.target.closest("tr");
        const index = parseInt(element.getAttribute("data-index"));

        if (isNaN(index)) {
          console.error("Ungültiger Index beim Drag-Start:", index);
          updateDebugInfo("Fehler: Ungültiger Index beim Drag-Start");
          e.preventDefault();
          return;
        }

        // Drag-Daten speichern
        classDragData = { index };
        try {
          e.dataTransfer.setData("text/plain", index.toString());
          e.dataTransfer.effectAllowed = "move";
        } catch (err) {
          console.error("Fehler beim Setzen der Drag-Daten:", err);
          updateDebugInfo("Fehler beim Setzen der Drag-Daten");
        }

        element.classList.add("dragging");
        updateDebugInfo(`Drag gestartet: Klasse an Index ${index}`);
      }

      function handleClassDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }

      function handleClassDragEnter(e) {
        e.preventDefault();
        const targetRow = e.target.closest("tr");
        if (targetRow && targetRow.classList.contains("class-row")) {
          targetRow.classList.add("drag-over");
        }
      }

      function handleClassDragLeave(e) {
        e.preventDefault();
        const targetRow = e.target.closest("tr");
        if (targetRow && !targetRow.contains(e.relatedTarget)) {
          targetRow.classList.remove("drag-over");
        }
      }

      function handleClassDrop(e) {
        e.preventDefault();
        e.stopPropagation();

        const targetRow = e.target.closest("tr");
        targetRow.classList.remove("drag-over");

        updateDebugInfo("Drop-Event empfangen (Klassentabelle)");

        let sourceIndex = null;
        try {
          sourceIndex = parseInt(e.dataTransfer.getData("text/plain"));
          if (isNaN(sourceIndex) && classDragData) {
            sourceIndex = classDragData.index;
            updateDebugInfo("Verwende Fallback-Daten für Klassentabelle");
          }
        } catch (err) {
          console.warn("Fehler beim Lesen der Drag-Daten:", err);
        }

        if (isNaN(sourceIndex)) {
          document.getElementById("error").textContent =
            "Fehler: Keine gültigen Drag-Daten empfangen.";
          updateDebugInfo("Fehler: Keine gültigen Drag-Daten");
          return;
        }

        const targetIndex = parseInt(targetRow.getAttribute("data-index"));

        if (isNaN(targetIndex)) {
          document.getElementById("error").textContent =
            "Fehler: Ungültiges Ziel für Drop.";
          updateDebugInfo("Fehler: Ungültiges Ziel für Drop");
          return;
        }

        if (sourceIndex === targetIndex) {
          updateDebugInfo("Quelle und Ziel sind gleich - überspringe");
          return;
        }

        // Reihenfolge im classes-Array ändern
        const [movedClass] = classes.splice(sourceIndex, 1);
        classes.splice(targetIndex, 0, movedClass);

        // Tabelle aktualisieren
        updateClassTable();
        document.getElementById("error").textContent = "";
        updateDebugInfo(
          `Klasse von Index ${sourceIndex} nach Index ${targetIndex} verschoben`
        );

        // Koppeln neu berechnen
        calculateCouples();

        // Zurücksetzen der globalen Drag-Daten
        classDragData = null;

        // Daten speichern
        saveToLocalStorage();
      }

      // Klasse bearbeiten
      function handleClassEdit(e) {
        const index = parseInt(e.target.getAttribute("data-index"));
        const field = e.target.classList[0].split("-")[1]; // z.B. 'yearGroup', 'className', etc.
        let value = e.target.value;

        // Validierung
        if (field === "female" || field === "male") {
          value = parseInt(value);
          if (isNaN(value) || value < 0) {
            document.getElementById("error").textContent =
              "Schülerzahlen müssen positive Zahlen sein!";
            e.target.value = classes[index][field]; // Alten Wert wiederherstellen
            return;
          }
        } else if (field === "yearGroup" || field === "className") {
          if (!value.trim()) {
            document.getElementById("error").textContent =
              "Jahrgangsstufe und Klassenname dürfen nicht leer sein!";
            e.target.value = classes[index][field]; // Alten Wert wiederherstellen
            return;
          }
        }

        // Wert aktualisieren
        classes[index][field] =
          field === "female" || field === "male" ? value : value.trim();
        document.getElementById("error").textContent = "";
        updateDebugInfo(
          `Klasse ${classes[index].className} aktualisiert: ${field} = ${value}`
        );

        // Koppeln neu berechnen
        calculateCouples();

        // Daten speichern
        saveToLocalStorage();
      }

      // Klasse löschen
      function deleteClass(index) {
        classes.splice(index, 1);
        updateClassTable();
        document.getElementById("error").textContent = "";
        updateDebugInfo(`Klasse an Index ${index} gelöscht`);

        // Koppeln neu berechnen
        calculateCouples();

        // Daten speichern
        saveToLocalStorage();
      }

      const uploadArea = document.getElementById("upload-area");
      const fileInput = document.getElementById("csvFile");
      const fileNameDisplay = document.getElementById("fileName");

      fileInput.addEventListener("change", () => {
        const fileName = fileInput.files[0]
          ? fileInput.files[0].name
          : "Keine Datei gewählt";
        fileNameDisplay.textContent = fileName;
      });

      uploadArea.addEventListener("dragover", (e) => {
        e.preventDefault();
        uploadArea.style.backgroundColor = "#d0eaff";
      });

      uploadArea.addEventListener("dragleave", () => {
        uploadArea.style.backgroundColor = "#f0f8ff";
      });

      uploadArea.addEventListener("drop", (e) => {
        e.preventDefault();
        uploadArea.style.backgroundColor = "#f0f8ff";
        fileInput.files = e.dataTransfer.files;
        const fileName = fileInput.files[0]
          ? fileInput.files[0].name
          : "Keine Datei gewählt";
        fileNameDisplay.textContent = fileName;
      });

      function uploadCSV() {
        const fileInput = document.getElementById("csvFile");
        const file = fileInput.files[0];

        if (!file) {
          alert("Bitte wähle eine CSV-Datei aus.");
          return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
          const lines = e.target.result.split("\n");

          let importCount = 0;
          let errorCount = 0;

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || (i === 0 && line.toLowerCase().startsWith("klasse")))
              continue; // Kopfzeile überspringen

            const parts = line.split(";");
            if (parts.length !== 3) {
              console.warn(
                `Zeile ${i + 1} übersprungen (falsches Format): ${line}`
              );
              errorCount++;
              continue;
            }

            const className = parts[0].trim().toUpperCase();
            const femaleCount = parseInt(parts[1].trim());
            const maleCount = parseInt(parts[2].trim());

            if (
              !className ||
              isNaN(femaleCount) ||
              isNaN(maleCount) ||
              femaleCount < 0 ||
              maleCount < 0
            ) {
              console.warn(
                `Zeile ${i + 1} übersprungen (ungültige Werte): ${line}`
              );
              errorCount++;
              continue;
            }

            const match = className.match(/^(\d+)/);
            if (!match) {
              console.warn(
                `Zeile ${
                  i + 1
                } übersprungen (Jahrgang nicht erkannt): ${className}`
              );
              errorCount++;
              continue;
            }

            const yearGroup = match[1];

            const alreadyExists = classes.some(
              (c) =>
                c.yearGroup === yearGroup &&
                c.className.toLowerCase() === className.toLowerCase()
            );
            if (alreadyExists) {
              alert(
                `Die Klasse ${className} in Jahrgangsstufe ${yearGroup} ist bereits vorhanden und wird nicht erneut hinzugefügt.`
              );
              errorCount++;
              continue;
            }

            classes.push({
              yearGroup,
              className,
              female: femaleCount,
              male: maleCount,
            });
            importCount++;
          }

          updateClassTable();
          saveToLocalStorage();
          updateDebugInfo(
            `${importCount} Klassen importiert, ${errorCount} Zeilen übersprungen.`
          );

          fileInput.value = ""; // Reset
          if (importCount > 0) {
            alert(
              `${importCount} Klassen erfolgreich importiert.` +
                (errorCount > 0 ? ` (${errorCount} Zeilen übersprungen)` : "")
            );
          } else {
            alert(
              "Keine gültigen Klassendaten gefunden. Überprüfe die CSV-Datei."
            );
          }
        };

        reader.readAsText(file);
      }

      // Klasse hinzufügen
      function addClass() {
        let yearGroup = document.getElementById("yearGroup").value.trim();
        const className = document.getElementById("className").value.trim();
        const femaleCount = parseInt(
          document.getElementById("femaleCount").value
        );
        const maleCount = parseInt(document.getElementById("maleCount").value);

        // Validierung der Eingaben
        if (
          !className ||
          isNaN(femaleCount) ||
          isNaN(maleCount) ||
          femaleCount < 0 ||
          maleCount < 0
        ) {
          document.getElementById("error").textContent =
            "Bitte alle Felder korrekt ausfüllen!";
          return;
        }

        // Automatische Erkennung der Jahrgangsstufe aus dem Klassennamen
        if (!yearGroup) {
          const match = className.match(/^(\d+)/); // Extrahiert führende Ziffern (z.B. "5A" → "5")
          if (match) {
            yearGroup = match[1];
          } else {
            alert(
              "Bitte verwende einen Klassennamen mit führender Zahl (z. B. 5A, 10B)."
            );
            document.getElementById("error").textContent =
              "Klassenname muss mit einer Jahrgangsstufe beginnen (z.B. 5A) oder geben Sie die Jahrgangsstufe manuell ein!";
            return;
          }
        }

        // Prüfen, ob die Jahrgangsstufe gültig ist
        if (!/^\d+$/.test(yearGroup)) {
          document.getElementById("error").textContent =
            "Jahrgangsstufe muss eine Zahl sein!";
          return;
        }

        // Duplikat-Prüfung
        if (
          classes.some(
            (c) =>
              c.yearGroup === yearGroup &&
              c.className.toLowerCase() === className.toLowerCase()
          )
        ) {
          alert(`Die Klasse ${className} ist bereits vorhanden!`);
          return;
        }

        classes.push({
          yearGroup,
          className,
          female: femaleCount,
          male: maleCount,
        });
        updateClassTable();
        document.getElementById("error").textContent = "";
        document.getElementById("warning").textContent = "";
        document.getElementById("className").value = "";
        document.getElementById("femaleCount").value = "";
        document.getElementById("maleCount").value = "";
        document.getElementById("yearGroup").value = ""; // Eingabefeld zurücksetzen

        // Daten speichern
        saveToLocalStorage();
        updateDebugInfo(
          `Klasse ${className} hinzugefügt mit Jahrgangsstufe ${yearGroup}`
        );
      }

      // Einstellungen speichern
      function saveSettings() {
        if (!validateSettings()) return;

        // Werte erst nach erfolgreicher Validierung setzen
        settings.halls = parseInt(document.getElementById("halls").value);
        settings.maxSize = parseInt(document.getElementById("maxSize").value);
        settings.minSize = parseInt(document.getElementById("minSize").value);

        saveToLocalStorage();
        alert("Einstellungen wurden gespeichert.");
      }

      // Anzahl Hallen berechnen
      function calculateHalls(count, maxSize) {
        return Math.ceil(count / maxSize);
      }

      // Verbesserte Greedy-Ansatz für initiale Koppeln
      function createCouples(classes, maxSize, minSize, maxHalls) {
        const year = classes[0].yearGroup;
        const lockedCouples = currentCouples[year]
          ? currentCouples[year].filter((c) => c.locked && c.classes.length > 0)
          : [];
        const lockedClasses = lockedCouples.flatMap((c) => c.classes);
        const freeClasses = classes.filter(
          (cls) => !lockedClasses.includes(cls.className)
        );

        console.log("Gesperrte Koppeln:", lockedCouples); // Debug
        console.log(
          "Freie Klassen:",
          freeClasses.map((c) => c.className)
        ); // Debug

        let bestCouples = [...lockedCouples];
        let bestWarnings = [];
        let minWarningsCount = Infinity;
        let minCouplesCount = Infinity;

        // Sortierstrategien für die Klassen
        const sortStrategies = [
          {
            name: "totalDesc",
            sort: (a, b) => b.female + b.male - (a.female + a.male),
          },
          {
            name: "totalAsc",
            sort: (a, b) => a.female + a.male - (b.female + b.male),
          },
          { name: "femaleDesc", sort: (a, b) => b.female - a.female },
          { name: "maleDesc", sort: (a, b) => b.male - a.male },
        ];

        // Funktion zur Erstellung von Koppeln für eine gegebene Sortierung
        function createInitialCouples(sortedClasses) {
          const couples = [...lockedCouples];
          const warnings = [];
          let remainingClasses = [...sortedClasses];

          while (remainingClasses.length > 0) {
            let currentCouple = [];
            let femaleCount = 0;
            let maleCount = 0;

            // Schritt 1: Größte Klasse hinzufügen
            if (remainingClasses.length > 0) {
              currentCouple.push(remainingClasses[0]);
              femaleCount += remainingClasses[0].female;
              maleCount += remainingClasses[0].male;
              remainingClasses.splice(0, 1);
            }

            // Schritt 2: Versuche, weitere Klassen hinzuzufügen
            const sortedBySmallest = [...remainingClasses].sort(
              (a, b) => a.female + a.male - (b.female + b.male)
            );
            for (let i = 0; i < sortedBySmallest.length; i++) {
              const cls = sortedBySmallest[i];
              const newFemaleCount = femaleCount + cls.female;
              const newMaleCount = maleCount + cls.male;
              const newFemaleHalls = calculateHalls(newFemaleCount, maxSize);
              const newMaleHalls = calculateHalls(newMaleCount, maxSize);
              const totalHalls = newFemaleHalls + newMaleHalls;

              if (totalHalls <= maxHalls) {
                currentCouple.push(cls);
                femaleCount = newFemaleCount;
                maleCount = newMaleCount;
                remainingClasses.splice(
                  remainingClasses.findIndex(
                    (c) => c.className === cls.className
                  ),
                  1
                );
              }
            }

            // Schritt 3: Koppel validieren (nur für ungesperrte Koppeln)
            const femaleHalls = calculateHalls(femaleCount, maxSize);
            const maleHalls = calculateHalls(maleCount, maxSize);
            const totalHalls = femaleHalls + maleHalls;

            if (totalHalls <= maxHalls) {
              couples.push({
                classes: currentCouple.map((c) => c.className),
                female: { count: femaleCount, halls: femaleHalls },
                male: { count: maleCount, halls: maleHalls },
                locked: false,
              });
            } else {
              const cls = currentCouple[0];
              const femaleHalls = calculateHalls(cls.female, maxSize);
              const maleHalls = calculateHalls(cls.male, maxSize);
              const totalHalls = femaleHalls + maleHalls;
              if (totalHalls <= maxHalls) {
                couples.push({
                  classes: [cls.className],
                  female: { count: cls.female, halls: femaleHalls },
                  male: { count: cls.male, halls: maleHalls },
                  locked: false,
                });
              } else {
                return {
                  couples: [],
                  warnings: [],
                  error: `Klasse ${cls.className} überschreitet Hallenbeschränkung pro Koppel (${totalHalls} > ${maxHalls}).`,
                };
              }
            }
          }

          // Warnungen nur für ungesperrte Koppeln generieren
          couples.forEach((couple) => {
            if (couple.locked) return;
            const femaleCount = couple.female.count;
            const maleCount = couple.male.count;
            const femaleHalls = couple.female.halls;
            const maleHalls = couple.male.halls;
            const totalHalls = femaleHalls + maleHalls;

            if (totalHalls > maxHalls) {
              warnings.push(
                `Warnung: Koppel ${couple.classes.join(
                  "+"
                )} überschreitet Hallenbeschränkung pro Koppel (${totalHalls} > ${maxHalls}).`
              );
            }
            if (femaleCount < minSize && femaleCount > 0) {
              warnings.push(
                `Warnung: Koppel ${couple.classes.join(
                  "+"
                )} hat zu wenige weibliche Schüler (${femaleCount} < ${minSize}).`
              );
            }
            if (maleCount < minSize && maleCount > 0) {
              warnings.push(
                `Warnung: Koppel ${couple.classes.join(
                  "+"
                )} hat zu wenige männliche Schüler (${maleCount} < ${minSize}).`
              );
            }
            if (femaleCount / femaleHalls > maxSize && femaleCount > 0) {
              warnings.push(
                `Warnung: Koppel ${couple.classes.join(
                  "+"
                )} überschreitet Maximalgröße pro Halle für weibliche Schüler (${(
                  femaleCount / femaleHalls
                ).toFixed(1)} > ${maxSize}).`
              );
            }
            if (maleCount / maleHalls > maxSize && maleCount > 0) {
              warnings.push(
                `Warnung: Koppel ${couple.classes.join(
                  "+"
                )} überschreitet Maximalgröße pro Halle für männliche Schüler (${(
                  maleCount / maleHalls
                ).toFixed(1)} > ${maxSize}).`
              );
            }
          });

          return { couples, warnings, error: null };
        }

        // Prüfen, ob es freie Klassen gibt, die berechnet werden müssen
        if (freeClasses.length === 0) {
          // Wenn alle Klassen in gesperrten Koppeln sind, nur gesperrte Koppeln validieren
          const { couples, warnings, error } = updateCouplesAfterDrag(
            year,
            lockedCouples
          );
          if (error) {
            return { couples: [], warnings: [], error };
          }
          // Prüfen, ob alle Schüler abgedeckt sind
          const totalFemale = classes.reduce((sum, c) => sum + c.female, 0);
          const totalMale = classes.reduce((sum, c) => sum + c.male, 0);
          const femaleCovered = couples.reduce(
            (sum, c) => sum + c.female.count,
            0
          );
          const maleCovered = couples.reduce((sum, c) => sum + c.male.count, 0);

          if (femaleCovered !== totalFemale || maleCovered !== totalMale) {
            return {
              couples: [],
              warnings: [],
              error: `Nicht alle Schüler in Jahrgangsstufe ${year} abgedeckt! (Weiblich: ${femaleCovered}/${totalFemale}, Männlich: ${maleCovered}/${totalMale})`,
            };
          }
          return { couples, warnings, error: null };
        }

        // Teste alle Sortierstrategien für freie Klassen
        for (const strategy of sortStrategies) {
          const sortedClasses = [...freeClasses].sort(strategy.sort);
          const { couples, warnings, error } =
            createInitialCouples(sortedClasses);
          if (error) {
            return { couples: [], warnings: [], error };
          }

          const allCouples = [...lockedCouples, ...couples];
          if (
            warnings.length < minWarningsCount ||
            (warnings.length === minWarningsCount &&
              allCouples.length < minCouplesCount)
          ) {
            bestCouples = allCouples;
            bestWarnings = warnings;
            minWarningsCount = warnings.length;
            minCouplesCount = allCouples.length;
          }
        }

        // Lokale Optimierung durch Klassentausch nur für ungesperrte Koppeln
        let optimizedCouples = [...bestCouples];
        let optimizedWarnings = [...bestWarnings];
        let improved = true;

        while (improved) {
          improved = false;
          for (let i = 0; i < optimizedCouples.length; i++) {
            if (optimizedCouples[i].locked) continue;
            for (let j = i + 1; j < optimizedCouples.length; j++) {
              if (optimizedCouples[j].locked) continue;
              for (let ci = 0; ci < optimizedCouples[i].classes.length; ci++) {
                for (
                  let cj = 0;
                  cj < optimizedCouples[j].classes.length;
                  cj++
                ) {
                  const temp = optimizedCouples[i].classes[ci];
                  optimizedCouples[i].classes[ci] =
                    optimizedCouples[j].classes[cj];
                  optimizedCouples[j].classes[cj] = temp;

                  const {
                    couples: newCouples,
                    warnings: newWarnings,
                    error,
                  } = updateCouplesAfterDrag(year, optimizedCouples);
                  if (
                    !error &&
                    (newWarnings.length < minWarningsCount ||
                      (newWarnings.length === minWarningsCount &&
                        newCouples.length < minCouplesCount))
                  ) {
                    optimizedCouples = newCouples;
                    optimizedWarnings = newWarnings;
                    minWarningsCount = newWarnings.length;
                    minCouplesCount = newCouples.length;
                    improved = true;
                  } else {
                    optimizedCouples[j].classes[cj] =
                      optimizedCouples[i].classes[ci];
                    optimizedCouples[i].classes[ci] = temp;
                  }
                }
              }
            }
          }
        }

        // Optimierung durch Zusammenfassen kleiner ungesperrter Koppeln
        let finalCouples = [];
        let tempCouples = [...optimizedCouples];

        while (tempCouples.length > 1) {
          let bestMerge = null;
          let bestMergeHalls = Infinity;
          let bestMergeIndex = -1;
          let secondMergeIndex = -1;

          for (let i = 0; i < tempCouples.length; i++) {
            if (tempCouples[i].locked) continue;
            for (let j = i + 1; j < tempCouples.length; j++) {
              if (tempCouples[j].locked) continue;
              const mergedClasses = [
                ...tempCouples[i].classes,
                ...tempCouples[j].classes,
              ];
              const femaleCount =
                tempCouples[i].female.count + tempCouples[j].female.count;
              const maleCount =
                tempCouples[i].male.count + tempCouples[j].male.count;
              const femaleHalls = calculateHalls(femaleCount, maxSize);
              const maleHalls = calculateHalls(maleCount, maxSize);
              const totalHalls = femaleHalls + maleHalls;

              if (totalHalls <= maxHalls) {
                if (
                  totalHalls < bestMergeHalls ||
                  (totalHalls === bestMergeHalls &&
                    mergedClasses.length >
                      (bestMerge ? bestMerge.classes.length : 0))
                ) {
                  bestMerge = {
                    classes: mergedClasses,
                    female: { count: femaleCount, halls: femaleHalls },
                    male: { count: maleCount, halls: maleHalls },
                    locked: false,
                  };
                  bestMergeHalls = totalHalls;
                  bestMergeIndex = i;
                  secondMergeIndex = j;
                }
              }
            }
          }

          if (bestMerge) {
            finalCouples.push(bestMerge);
            tempCouples.splice(Math.max(bestMergeIndex, secondMergeIndex), 1);
            tempCouples.splice(Math.min(bestMergeIndex, secondMergeIndex), 1);
          } else {
            finalCouples.push(...tempCouples);
            break;
          }
        }

        if (tempCouples.length === 1) {
          finalCouples.push(tempCouples[0]);
        }

        // Warnungen nur für ungesperrte Koppeln generieren
        const finalWarnings = [];
        finalCouples.forEach((couple) => {
          if (couple.locked) return; // Keine Warnungen für gesperrte Koppeln
          const femaleCount = couple.female.count;
          const maleCount = couple.male.count;
          const femaleHalls = couple.female.halls;
          const maleHalls = couple.male.halls;
          const totalHalls = femaleHalls + maleHalls;

          if (totalHalls > maxHalls) {
            finalWarnings.push(
              `Warnung: Koppel ${couple.classes.join(
                "+"
              )} überschreitet Hallenbeschränkung pro Koppel (${totalHalls} > ${maxHalls}).`
            );
          }
          if (femaleCount < minSize && femaleCount > 0) {
            finalWarnings.push(
              `Warnung: Koppel ${couple.classes.join(
                "+"
              )} hat zu wenige weibliche Schüler (${femaleCount} < ${minSize}).`
            );
          }
          if (maleCount < minSize && maleCount > 0) {
            finalWarnings.push(
              `Warnung: Koppel ${couple.classes.join(
                "+"
              )} hat zu wenige männliche Schüler (${maleCount} < ${minSize}).`
            );
          }
          if (femaleCount / femaleHalls > maxSize && femaleCount > 0) {
            finalWarnings.push(
              `Warnung: Koppel ${couple.classes.join(
                "+"
              )} überschreitet Maximalgröße pro Halle für weibliche Schüler (${(
                femaleCount / femaleHalls
              ).toFixed(1)} > ${maxSize}).`
            );
          }
          if (maleCount / maleHalls > maxSize && maleCount > 0) {
            finalWarnings.push(
              `Warnung: Koppel ${couple.classes.join(
                "+"
              )} überschreitet Maximalgröße pro Halle für männliche Schüler (${(
                maleCount / maleHalls
              ).toFixed(1)} > ${maxSize}).`
            );
          }
        });

        // Prüfen, ob alle Klassen abgedeckt sind
        const usedClasses = finalCouples.flatMap((c) => c.classes);
        const allClasses = classes.map((c) => c.className);
        if (!allClasses.every((cls) => usedClasses.includes(cls))) {
          return {
            couples: [],
            warnings: [],
            error: `Nicht alle Klassen in Jahrgangsstufe ${year} abgedeckt: ${allClasses
              .filter((cls) => !usedClasses.includes(cls))
              .join(", ")}`,
          };
        }

        // Prüfen, ob alle Schüler abgedeckt sind
        const totalFemale = classes.reduce((sum, c) => sum + c.female, 0);
        const totalMale = classes.reduce((sum, c) => sum + c.male, 0);
        const femaleCovered = finalCouples.reduce(
          (sum, c) => sum + c.female.count,
          0
        );
        const maleCovered = finalCouples.reduce(
          (sum, c) => sum + c.male.count,
          0
        );

        if (femaleCovered !== totalFemale || maleCovered !== totalMale) {
          return {
            couples: [],
            warnings: [],
            error: `Nicht alle Schüler in Jahrgangsstufe ${year} abgedeckt! (Weiblich: ${femaleCovered}/${totalFemale}, Männlich: ${maleCovered}/${totalMale})`,
          };
        }

        console.log("Ergebnis-Koppeln:", finalCouples); // Debug
        return { couples: finalCouples, warnings: finalWarnings, error: null };
      }

      // Aktualisiere Koppeln nach Drag-and-Drop
 function updateCouplesAfterDrag(year, newCouples) {
    const warnings = [];
    const validatedCouples = [];
    const maxHalls = settings.halls;
    const maxSize = settings.maxSize;
    const minSize = settings.minSize;

    console.log(`updateCouplesAfterDrag für Jahrgangsstufe ${year}:`, JSON.stringify(newCouples));

    for (const couple of newCouples) {
        const coupleClasses = classes.filter(
            (cls) => cls.yearGroup === year && couple.classes.includes(cls.className)
        );
        const femaleCount = coupleClasses.reduce((sum, cls) => sum + cls.female, 0);
        const maleCount = coupleClasses.reduce((sum, cls) => sum + cls.male, 0);
        const femaleHalls = calculateHalls(femaleCount, maxSize);
        const maleHalls = calculateHalls(maleCount, maxSize);
        const totalHalls = femaleHalls + maleHalls;

        // Warnungen nur für ungesperrte Koppeln generieren
        if (!couple.locked) {
            if (totalHalls > maxHalls) {
                warnings.push(
                    `Warnung: Koppel ${couple.classes.join("+")} überschreitet Hallenbeschränkung pro Koppel (${totalHalls} > ${maxHalls}).`
                );
            }
            if (femaleCount < minSize && femaleCount > 0) {
                warnings.push(
                    `Warnung: Koppel ${couple.classes.join("+")} hat zu wenige weibliche Schüler (${femaleCount} < ${minSize}).`
                );
            }
            if (maleCount < minSize && maleCount > 0) {
                warnings.push(
                    `Warnung: Koppel ${couple.classes.join("+")} hat zu wenige männliche Schüler (${maleCount} < ${minSize}).`
                );
            }
            if (femaleCount / femaleHalls > maxSize && femaleCount > 0) {
                warnings.push(
                    `Warnung: Koppel ${couple.classes.join("+")} überschreitet Maximalgröße pro Halle für weibliche Schüler (${(femaleCount / femaleHalls).toFixed(1)} > ${maxSize}).`
                );
            }
            if (maleCount / maleHalls > maxSize && maleCount > 0) {
                warnings.push(
                    `Warnung: Koppel ${couple.classes.join("+")} überschreitet Maximalgröße pro Halle für männliche Schüler (${(maleCount / maleHalls).toFixed(1)} > ${maxSize}).`
                );
            }
        }

        validatedCouples.push({
            classes: couple.classes,
            female: { count: femaleCount, halls: femaleHalls },
            male: { count: maleCount, halls: maleHalls },
            locked: couple.locked || false, // Behalte den Sperr-Status
        });
    }

    // Prüfen, ob alle Klassen abgedeckt sind
    const usedClasses = validatedCouples.flatMap((c) => c.classes);
    const yearClasses = classes.filter((cls) => cls.yearGroup === year).map((cls) => cls.className);
    if (!yearClasses.every((cls) => usedClasses.includes(cls))) {
        return {
            couples: [],
            warnings: [],
            error: `Nicht alle Klassen in Jahrgangsstufe ${year} abgedeckt: ${yearClasses.filter((cls) => !usedClasses.includes(cls)).join(", ")}`,
        };
    }

    console.log(`Validierte Koppeln für Jahrgangsstufe ${year}:`, JSON.stringify(validatedCouples));
    return { couples: validatedCouples, warnings, error: null };
}

      // Koppeln rendern mit Drag-and-Drop
     function renderCouples(year, couples, warnings) {
    const tbody = document.getElementById("coupleTableBody");

    couples.forEach((couple, index) => {
        if (couple.classes.length === 0) return; // Überspringe leere Koppeln
        const row = document.createElement("tr");
        row.setAttribute("data-year", year);
        row.setAttribute("data-couple-index", index.toString());
        row.classList.add("drop-zone");
        if (couple.locked) {
            row.classList.add("locked"); // Kennzeichne nur diese Zeile als gesperrt
        }

        // Event-Listener für Drop-Zone (nur für nicht gesperrte Zeilen)
        if (!couple.locked) {
            row.addEventListener("dragover", handleDragOver);
            row.addEventListener("drop", handleDrop);
            row.addEventListener("dragenter", handleDragEnter);
            row.addEventListener("dragleave", handleDragLeave);
        }

        const classSpans = couple.classes
            .map((className) => {
                return `<span class="class-item" 
                              draggable="${!couple.locked}" 
                              data-year="${year}" 
                              data-class="${className}" 
                              data-source-index="${index}"
                              onmousedown="handleMouseDown(event)"
                              ${!couple.locked ? 'ondragstart="handleDragStart(event)"' : ""} 
                              ondragend="handleDragEnd(event)">${className}</span>`;
            })
            .join("+");

        row.innerHTML = `
            <td class="drop-zone">${classSpans}</td>
            <td>${couple.female.count} Schülerinnen / ${couple.female.halls} Halle${couple.female.halls !== 1 ? "n" : ""}</td>
            <td>${couple.male.count} Schüler / ${couple.male.halls} Halle${couple.male.halls !== 1 ? "n" : ""}</td>
            <td><button class="lock-btn ${couple.locked ? "locked" : ""}" 
                        onclick="toggleLock('${year}', ${index})">${
                couple.locked
                    ? '<svg xmlns="http://www.w3.org/2000/svg" style="width: 16px" viewBox="0 0 640 640"><path d="M256 160L256 224L384 224L384 160C384 124.7 355.3 96 320 96C284.7 96 256 124.7 256 160zM192 224L192 160C192 89.3 249.3 32 320 32C390.7 32 448 89.3 448 160L448 224C483.3 224 512 252.7 512 288L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 288C128 252.7 156.7 224 192 224z"/></svg>'
                    : '<svg xmlns="http://www.w3.org/2000/svg" style="width: 16px" viewBox="0 0 640 640"><path d="M416 160C416 124.7 444.7 96 480 96C515.3 96 544 124.7 544 160L544 192C544 209.7 558.3 224 576 224C593.7 224 608 209.7 608 192L608 160C608 89.3 550.7 32 480 32C409.3 32 352 89.3 352 160L352 224L192 224C156.7 224 128 252.7 128 288L128 512C128 547.3 156.7 576 192 576L448 576C483.3 576 512 547.3 512 512L512 288C512 252.7 483.3 224 448 224L416 224L416 160z"/></svg>'
            }</button></td>
        `;
        tbody.appendChild(row);
    });

    // Neue leere Drop-Zone für neue Koppeln (nur wenn nicht alle gesperrt sind)
    if (!couples.every((c) => c.locked)) {
        const newRow = document.createElement("tr");
        newRow.setAttribute("data-year", year);
        newRow.setAttribute("data-couple-index", couples.length.toString());
        newRow.classList.add("drop-zone");
        newRow.addEventListener("dragover", handleDragOver);
        newRow.addEventListener("drop", handleDrop);
        newRow.addEventListener("dragenter", handleDragEnter);
        newRow.addEventListener("dragleave", handleDragLeave);
        newRow.innerHTML = `
            <td class="drop-zone">Neue Koppel</td>
            <td>0 Schülerinnen / 0 Hallen</td>
            <td>0 Schüler / 0 Hallen</td>
            <td></td>
        `;
        tbody.appendChild(newRow);
    }

    // Zusammenfassungszeile für die Jahrgangsstufe
    const summaryRow = document.createElement("tr");
    summaryRow.innerHTML = `
        <td>Gesamt (Jahrgangsstufe ${year})</td>
        <td colspan="3">Anzahl Koppeln: ${couples.filter((c) => c.classes.length > 0).length}</td>
    `;
    tbody.appendChild(summaryRow);

    // Warnungen anzeigen
    const warningElement = document.getElementById("warning");
    warnings.forEach((warning) => {
        const warningDiv = document.createElement("div");
        warningDiv.textContent = `${warning}`;
        warningElement.appendChild(warningDiv);
    });

    updateDebugInfo(`Koppeln für Jahrgangsstufe ${year} gerendert`);
}
      function toggleLock(year, index) {
        if (currentCouples[year] && currentCouples[year][index]) {
          currentCouples[year][index].locked =
            !currentCouples[year][index].locked;
          updateDebugInfo(
            `Koppel ${index + 1} in Jahrgangsstufe ${year} ${
              currentCouples[year][index].locked ? "gesperrt" : "entsperrt"
            }`
          );

          // Koppeln validieren, um Warnungen zu aktualisieren
          const { couples, warnings, error } = updateCouplesAfterDrag(
            year,
            currentCouples[year]
          );
          if (error) {
            document.getElementById(
              "error"
            ).textContent = `Fehler in Jahrgangsstufe ${year}: ${error}`;
            return;
          }

          // Aktualisierte Koppeln speichern
          currentCouples[year] = couples;

          // Alle Jahrgangsstufen neu rendern, um Konsistenz sicherzustellen
          renderAllCouples();

          // Daten speichern
          saveToLocalStorage();
        } else {
          document.getElementById("error").textContent = `Fehler: Koppel ${
            index + 1
          } in Jahrgangsstufe ${year} nicht gefunden.`;
          updateDebugInfo(
            `Fehler: Koppel ${
              index + 1
            } in Jahrgangsstufe ${year} nicht gefunden.`
          );
        }
      }

      // Verbesserte Drag-and-Drop-Handler
      function handleMouseDown(e) {
        updateDebugInfo(
          `Maus gedrückt auf: ${e.target.getAttribute("data-class")}`
        );
      }

      function handleDragStart(e) {
        const element = e.target;
        const year = element.getAttribute("data-year");
        const className = element.getAttribute("data-class");
        const sourceIndex = element.getAttribute("data-source-index");

        if (!year || !className || sourceIndex === null) {
          console.error("Ungültige Drag-Daten:", {
            year,
            className,
            sourceIndex,
          });
          updateDebugInfo("Fehler: Ungültige Drag-Daten");
          e.preventDefault();
          return;
        }

        // Erstelle Drag-Daten-Objekt
        const data = {
          year,
          className,
          sourceIndex: parseInt(sourceIndex),
        };

        // Speichere Daten in globaler Variable (Fallback)
        dragData = data;

        // Visuelle Rückmeldung
        element.classList.add("dragging");

        updateDebugInfo(
          `Drag gestartet: ${className} aus Koppel ${sourceIndex}`
        );

        // Versuche verschiedene Methoden zum Setzen der Daten
        try {
          const dataString = JSON.stringify(data);

          // Methode 1: Standard text/plain
          e.dataTransfer.setData("text/plain", dataString);

          // Methode 2: Custom MIME-Type
          e.dataTransfer.setData("application/x-sportkoppeln", dataString);

          // Methode 3: Einfacher Text als Fallback
          e.dataTransfer.setData("text", `${year}|${className}|${sourceIndex}`);

          e.dataTransfer.effectAllowed = "move";

          console.log("Drag-Daten gesetzt:", data);
        } catch (err) {
          console.error("Fehler beim Setzen der Drag-Daten:", err);
          updateDebugInfo("Fehler beim Setzen der Drag-Daten");
        }
      }

      function handleDragEnd(e) {
        e.target.classList.remove("dragging");
        document
          .querySelectorAll(".drop-zone")
          .forEach((zone) => zone.classList.remove("drag-over"));
        updateDebugInfo("Drag beendet");
      }

      function handleDragEnter(e) {
        e.preventDefault();
        if (e.target.closest(".drop-zone")) {
          e.target.closest(".drop-zone").classList.add("drag-over");
        }
      }

      function handleDragLeave(e) {
        e.preventDefault();
        // Nur entfernen, wenn wir die Drop-Zone wirklich verlassen
        if (!e.currentTarget.contains(e.relatedTarget)) {
          e.currentTarget.classList.remove("drag-over");
        }
      }

      function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }

      function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();

        const targetRow = e.currentTarget;
        targetRow.classList.remove("drag-over");

        updateDebugInfo("Drop-Event empfangen");

        let data = null;

        try {
          let dataString = null;
          if (e.dataTransfer.types.includes("application/x-sportkoppeln")) {
            dataString = e.dataTransfer.getData("application/x-sportkoppeln");
          } else if (e.dataTransfer.types.includes("text/plain")) {
            dataString = e.dataTransfer.getData("text/plain");
          } else if (e.dataTransfer.types.includes("text")) {
            dataString = e.dataTransfer.getData("text");
          }

          if (dataString) {
            if (dataString.includes("|")) {
              const parts = dataString.split("|");
              if (parts.length === 3) {
                data = {
                  year: parts[0],
                  className: parts[1],
                  sourceIndex: parseInt(parts[2]),
                };
              }
            } else {
              data = JSON.parse(dataString);
            }
          }
        } catch (err) {
          console.warn("Fehler beim Lesen der dataTransfer-Daten:", err);
        }

        if (!data && dragData) {
          data = dragData;
          updateDebugInfo("Verwende Fallback-Daten");
        }

        if (!data) {
          updateDebugInfo("Keine Drag-Daten verfügbar");
          document.getElementById("error").textContent =
            "Fehler: Keine Drag-Daten empfangen.";
          return;
        }

        updateDebugInfo(`Drop verarbeitet: ${data.className}`);

        if (!data.year || !data.className || isNaN(data.sourceIndex)) {
          console.error("Ungültige Datenstruktur:", data);
          document.getElementById("error").textContent =
            "Fehler: Ungültige Drag-Daten.";
          return;
        }

        const targetIndex = parseInt(
          targetRow.getAttribute("data-couple-index")
        );
        const year = targetRow.getAttribute("data-year");

        if (data.year !== year) {
          document.getElementById("error").textContent =
            "Klassen können nur innerhalb derselben Jahrgangsstufe verschoben werden!";
          return;
        }

        let yearCouples = currentCouples[year] || [];
        if (!yearCouples[data.sourceIndex]) {
          console.error(
            "Quell-Koppel nicht gefunden:",
            data.sourceIndex,
            yearCouples
          );
          document.getElementById("error").textContent =
            "Fehler: Quell-Koppel nicht gefunden.";
          return;
        }

        if (yearCouples[data.sourceIndex].locked) {
          document.getElementById("error").textContent =
            "Fehler: Die Quell-Koppel ist gesperrt und kann nicht verändert werden.";
          return;
        }

        if (
          targetIndex < yearCouples.length &&
          yearCouples[targetIndex]?.locked
        ) {
          document.getElementById("error").textContent =
            "Fehler: Die Ziel-Koppel ist gesperrt und kann nicht verändert werden.";
          return;
        }

        if (data.sourceIndex === targetIndex) {
          updateDebugInfo("Quelle und Ziel sind gleich - überspringe");
          return;
        }

        // Klasse aus Quell-Koppel entfernen
        yearCouples[data.sourceIndex].classes = yearCouples[
          data.sourceIndex
        ].classes.filter((cls) => cls !== data.className);

        // Klasse zur Ziel-Koppel hinzufügen
        if (!yearCouples[targetIndex]) {
          yearCouples[targetIndex] = { classes: [], locked: false };
        }
        yearCouples[targetIndex].classes.push(data.className);

        // Leere Koppeln entfernen
        yearCouples = yearCouples.filter(
          (couple) => couple.classes.length > 0 || couple.locked
        );

        // Koppeln validieren und aktualisieren
        const { couples, warnings, error } = updateCouplesAfterDrag(
          year,
          yearCouples
        );
        if (error) {
          document.getElementById("error").textContent = error;
          return;
        }

        // Prüfen, ob alle Klassen abgedeckt sind
        const usedClasses = couples.flatMap((couple) => couple.classes);
        const yearClasses = classes
          .filter((cls) => cls.yearGroup === year)
          .map((cls) => cls.className);
        if (!yearClasses.every((cls) => usedClasses.includes(cls))) {
          console.error(
            "Nicht alle Klassen abgedeckt:",
            usedClasses,
            yearClasses
          );
          document.getElementById(
            "error"
          ).textContent = `Fehler: Nicht alle Klassen in Jahrgangsstufe ${year} abgedeckt!`;
          return;
        }

        // Koppeln speichern
        currentCouples[year] = couples;
        console.log("Koppeln aktualisiert:", currentCouples);

        // Alle Jahrgangsstufen neu rendern
        renderAllCouples();
        updateDebugInfo(`Erfolgreich verschoben: ${data.className}`);

        // Zurücksetzen der globalen Drag-Daten
        dragData = null;

        // Daten speichern
        saveToLocalStorage();
      }

// Verbesserte calculateCouples Funktion mit mehr Debug-Informationen
function calculateCouples() {
    if (!validateSettings()) return;

    const yearGroups = [...new Set(classes.map((c) => c.yearGroup))];
    document.getElementById("error").textContent = "";
    document.getElementById("warning").innerHTML = "";
    let allWarnings = [];

    yearGroups.forEach((year) => {
        console.log(`\n=== BERECHNUNG FÜR JAHRGANGSSTUFE ${year} ===`);
        
        const yearClasses = classes.filter((c) => c.yearGroup === year);
        if (yearClasses.length === 0) return;

        console.log(`Alle Klassen in Jahrgangsstufe ${year}:`, yearClasses.map(c => `${c.className}(${c.female}w/${c.male}m)`));

        // Bestehende gesperrte Koppeln beibehalten
        const existingCouples = currentCouples[year] || [];
        console.log(`Bestehende Koppeln:`, existingCouples.map(c => ({classes: c.classes, locked: c.locked})));
        
        const lockedCouples = existingCouples.filter(c => c.locked && c.classes.length > 0);
        console.log(`Gesperrte Koppeln:`, lockedCouples.map(c => ({classes: c.classes, locked: c.locked})));
        
        const lockedClasses = lockedCouples.flatMap((c) => c.classes);
        console.log(`Gesperrte Klassen:`, lockedClasses);
        
        const freeClasses = yearClasses.filter(cls => !lockedClasses.includes(cls.className));
        console.log(`Freie Klassen:`, freeClasses.map(c => `${c.className}(${c.female}w/${c.male}m)`));

        let couples, warnings, error;

        if (freeClasses.length === 0) {
            console.log(`-> Alle Klassen sind gesperrt, nur Validierung`);
            const result = updateCouplesAfterDrag(year, lockedCouples);
            couples = result.couples;
            warnings = result.warnings;
            error = result.error;
        } else {
            console.log(`-> ${freeClasses.length} freie Klassen müssen neu berechnet werden`);
            
            // WICHTIG: Erstelle neue Koppeln nur für freie Klassen
            // aber berücksichtige dabei die bereits belegten gesperrten Koppeln
            const result = createCouplesWithLockedOnes(
                yearClasses,
                lockedCouples,
                settings.maxSize,
                settings.minSize,
                settings.halls
            );
            
            couples = result.couples;
            warnings = result.warnings;
            error = result.error;
        }

        if (error) {
            console.log(`FEHLER in Jahrgangsstufe ${year}:`, error);
            document.getElementById("error").textContent += `Fehler in Jahrgangsstufe ${year}: ${error}\n`;
            return;
        }

        console.log(`Finale Koppeln für Jahrgangsstufe ${year}:`, couples.map(c => ({classes: c.classes, locked: c.locked})));

        // Validierungen
        const totalFemale = yearClasses.reduce((sum, c) => sum + c.female, 0);
        const totalMale = yearClasses.reduce((sum, c) => sum + c.male, 0);
        const femaleCovered = couples.reduce((sum, c) => sum + c.female.count, 0);
        const maleCovered = couples.reduce((sum, c) => sum + c.male.count, 0);

        if (femaleCovered !== totalFemale || maleCovered !== totalMale) {
            const errorMsg = `Nicht alle Schüler in Jahrgangsstufe ${year} abgedeckt! (Weiblich: ${femaleCovered}/${totalFemale}, Männlich: ${maleCovered}/${totalMale})`;
            console.log(`FEHLER:`, errorMsg);
            document.getElementById("error").textContent += `Fehler: ${errorMsg}\n`;
            return;
        }

        const usedClasses = couples.flatMap((c) => c.classes);
        const yearClassNames = yearClasses.map((c) => c.className);
        if (!yearClassNames.every((cls) => usedClasses.includes(cls))) {
            const missingClasses = yearClassNames.filter((cls) => !usedClasses.includes(cls));
            const errorMsg = `Nicht alle Klassen in Jahrgangsstufe ${year} abgedeckt: ${missingClasses.join(", ")}`;
            console.log(`FEHLER:`, errorMsg);
            document.getElementById("error").textContent += `Fehler: ${errorMsg}\n`;
            return;
        }

        // Koppeln speichern
        currentCouples[year] = couples;
        allWarnings.push(...warnings.map((w) => `${w}`));
        
        console.log(`=== ENDE JAHRGANGSSTUFE ${year} ===\n`);
    });

    // Alle Jahrgangsstufen rendern
    renderAllCouples();

    if (document.getElementById("coupleTableBody").innerHTML === "") {
        document.getElementById("error").textContent =
            "Keine gültigen Koppeln gefunden! Überprüfen Sie die Schülerzahlen oder die Hallenbeschränkung pro Koppel.";
    } else if (allWarnings.length > 0) {
        const warningElement = document.getElementById("warning");
        warningElement.innerHTML = "";
        allWarnings.forEach((warning) => {
            const warningDiv = document.createElement("div");
            warningDiv.textContent = warning;
            warningElement.appendChild(warningDiv);
        });
    }

    updateDebugInfo("Koppeln erfolgreich berechnet für alle Jahrgangsstufen");
    saveToLocalStorage();
}

// Neue Funktion, die gesperrte Koppeln korrekt berücksichtigt
function createCouplesWithLockedOnes(allYearClasses, lockedCouples, maxSize, minSize, maxHalls) {
    const year = allYearClasses[0].yearGroup;
    
    console.log(`createCouplesWithLockedOnes für Jahrgangsstufe ${year}:`);
    console.log(`- Alle Klassen:`, allYearClasses.map(c => c.className));
    console.log(`- Gesperrte Koppeln:`, lockedCouples.map(c => c.classes));
    
    // Ermittle freie Klassen
    const lockedClasses = lockedCouples.flatMap(c => c.classes);
    const freeClasses = allYearClasses.filter(cls => !lockedClasses.includes(cls.className));
    
    console.log(`- Freie Klassen:`, freeClasses.map(c => c.className));
    
    if (freeClasses.length === 0) {
        console.log(`- Keine freien Klassen, returniere nur gesperrte Koppeln`);
        return updateCouplesAfterDrag(year, lockedCouples);
    }
    
    // Berechne neue Koppeln nur für freie Klassen
    console.log(`- Berechne Koppeln für ${freeClasses.length} freie Klassen`);
    
    // Verwende die ursprüngliche createCouples Funktion, aber mit einem leeren currentCouples
    // um sicherzustellen, dass nur die freien Klassen berechnet werden
    const tempCurrentCouples = currentCouples[year];
    currentCouples[year] = []; // Temporär leeren
    
    const freeResult = createCouples(freeClasses, maxSize, minSize, maxHalls);
    
    // Stelle die ursprünglichen currentCouples wieder her
    currentCouples[year] = tempCurrentCouples;
    
    if (freeResult.error) {
        console.log(`- Fehler bei Berechnung freier Klassen:`, freeResult.error);
        return freeResult;
    }
    
    console.log(`- Neue Koppeln für freie Klassen:`, freeResult.couples.map(c => c.classes));
    
    // Kombiniere gesperrte und neue Koppeln
    const combinedCouples = [...lockedCouples, ...freeResult.couples];
    console.log(`- Kombinierte Koppeln:`, combinedCouples.map(c => ({classes: c.classes, locked: c.locked})));
    
    // Validiere die Kombination
    const result = updateCouplesAfterDrag(year, combinedCouples);
    console.log(`- Finale validierte Koppeln:`, result.couples.map(c => ({classes: c.classes, locked: c.locked})));
    
    return result;
}

function renderAllCouples() {
    const tbody = document.getElementById("coupleTableBody");
    tbody.innerHTML = "";
    document.getElementById("error").textContent = "";
    document.getElementById("warning").innerHTML = "";

    let allWarnings = [];
    const yearGroups = [...new Set(classes.map((c) => c.yearGroup))];

    yearGroups.forEach((year) => {
        console.log(`RenderAllCouples für Jahrgangsstufe ${year}:`, JSON.stringify(currentCouples[year]));
        if (currentCouples[year]) {
            const yearClasses = classes.filter((c) => c.yearGroup === year);
            const { couples, warnings, error } = updateCouplesAfterDrag(year, currentCouples[year]);
            if (error) {
                document.getElementById("error").textContent += `Fehler in Jahrgangsstufe ${year}: ${error}\n`;
                return;
            }
            currentCouples[year] = couples;

            const yearRow = document.createElement("tr");
            yearRow.innerHTML = `<td colspan="4"><strong>Jahrgangsstufe ${year}</strong></td>`;
            tbody.appendChild(yearRow);

            renderCouples(year, couples, warnings);
            allWarnings.push(...warnings.map((w) => `Jahrgangsstufe ${year}: ${w}`));
        }
    });

    console.log("Finale currentCouples:", JSON.stringify(currentCouples));
    if (tbody.innerHTML === "") {
        document.getElementById("error").textContent = "Keine Koppeln vorhanden!";
    } else if (allWarnings.length > 0) {
        const warningElement = document.getElementById("warning");
        warningElement.innerHTML = "";
        allWarnings.forEach((warning) => {
            const warningDiv = document.createElement("div");
            warningDiv.textContent = warning;
            warningElement.appendChild(warningDiv);
        });
    }

    updateDebugInfo("Alle Koppeln neu gerendert");
    saveToLocalStorage();
}

      function openTab(tabId) {
        const contents = document.querySelectorAll(".tab-content");
        const buttons = document.querySelectorAll(".tab-btn");

        contents.forEach((c) => (c.style.display = "none"));
        buttons.forEach((b) => b.classList.remove("active"));

        document.getElementById(tabId).style.display = "block";
        document
          .querySelector(`.tab-btn[onclick="openTab('${tabId}')"]`)
          .classList.add("active");
      }

      document.addEventListener("DOMContentLoaded", function () {
        openTab("koppelTab");
      });

      function validateSettings() {
        const halls = parseInt(document.getElementById("halls").value);
        const maxSize = parseInt(document.getElementById("maxSize").value);
        const minSize = parseInt(document.getElementById("minSize").value);

        let errorMessage = "";

        if (isNaN(halls) || halls < 2 || halls > 100) {
          errorMessage += "Anzahl der Hallen muss zwischen 2 und 100 liegen.\n";
        }

        if (isNaN(maxSize) || maxSize < 1) {
          errorMessage += "Maximalgröße muss mindestens 1 sein.\n";
        }

        if (isNaN(minSize) || minSize < 1) {
          errorMessage += "Mindestgröße muss mindestens 1 sein.\n";
        }

        if (!errorMessage && maxSize < minSize) {
          errorMessage +=
            "Maximalgröße darf nicht kleiner als Mindestgröße sein.\n";
        }

        if (errorMessage) {
          alert(errorMessage);
          return false;
        }

        return true;
      }

      // Daten zurücksetzen
      function clearData() {
        classes = [];
        currentCouples = {};
        settings = { maxSize: 30, minSize: 12, halls: 2 }; // Standardwerte zurücksetzen
        document.getElementById("maxSize").value = settings.maxSize;
        document.getElementById("minSize").value = settings.minSize;
        document.getElementById("halls").value = settings.halls;
        updateClassTable();
        document.getElementById("coupleTableBody").innerHTML = "";
        document.getElementById("error").textContent = "";
        document.getElementById("warning").textContent = "";
        localStorage.removeItem("sportkoppeln_classes");
        localStorage.removeItem("sportkoppeln_settings");
        localStorage.removeItem("sportkoppeln_couples");
        updateDebugInfo("Alle Daten zurückgesetzt");
      }