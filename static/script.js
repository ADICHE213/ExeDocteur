let symptomesSelectionnes = [];

function sansAccents(texte) {
    return texte.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function afficherListeSymptomes() {
    const ul = document.getElementById("listeSymptomes");
    ul.innerHTML = "";
    symptomesSelectionnes.forEach((s, i) => {
        const li = document.createElement("li");

        const span = document.createElement("span");
        span.textContent = s;

        const btn = document.createElement("button");
        btn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e63946" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
        `;
        btn.title = "Supprimer cette entrée";
        btn.className = "remove-btn";
        btn.onclick = () => supprimerSymptome(i);

        li.appendChild(span);
        li.appendChild(btn);
        ul.appendChild(li);
    });
}

function supprimerSymptome(index) {
    symptomesSelectionnes.splice(index, 1);
    afficherListeSymptomes();
    document.getElementById("resultat").innerHTML = "";
}

function reinitialiserEntrees() {
    symptomesSelectionnes = [];
    afficherListeSymptomes();
    document.getElementById("resultat").innerHTML = "";
}

function envoyerDiagnostic() {
    if (symptomesSelectionnes.length === 0) {
        document.getElementById("resultat").innerHTML = "";
        return;
    }

    const nomPatient = document.getElementById("nomPatient").value.trim();
    const sexe = document.getElementById("sexe").value;
    const age = document.getElementById("age").value;

    fetch("/diagnostic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            symptomes: symptomesSelectionnes,
            sexe: sexe,
            age: age,
            nom: nomPatient || "Cas sans nom"
        })
    })
    .then(response => response.json())
    .then(data => {
        let html = "";

        if (data.length === 0) {
            html = `
                <div style="padding: 10px; background-color: #fff3cd; border: 1px solid #ffeeba; border-radius: 6px; color: #856404;">
                    Aucun diagnostic ne correspond aux entrées sélectionnées.
                </div>
            `;
        } else {
            html = `<h3>Résultats pour : <em>${nomPatient || "Cas sans nom"}</em></h3>`;
            data.forEach(([diag, score]) => {
                const recherche = encodeURIComponent(diag.trim());

                const msd = `https://www.msdmanuals.com/fr/professional/SearchResults?query=${recherche}&force=true`;
                const wiki = `https://fr.wikipedia.org/wiki/${recherche}`;
                const google = `https://www.google.com/search?q=${recherche}`;
                const scholar = `https://scholar.google.com/scholar?q=${recherche}`;
                const image = `https://www.google.com/search?tbm=isch&q=${recherche}`;

                html += `
                <div class="diagnostic-card">
                    <div class="diagnostic-title">${diag}</div>
                    <div class="diagnostic-score">Score : ${score}</div>
                    <div class="link-buttons">
                        <a href="${msd}" target="_blank">MSD</a>
                        <a href="${wiki}" target="_blank">Wikipédia</a>
                        <a href="${google}" target="_blank">Google</a>
                        <a href="${scholar}" target="_blank">Scholar</a>
                        <a href="${image}" target="_blank">Images</a>
                    </div>
                </div>
                `;
            });
        }

        document.getElementById("resultat").innerHTML = html;
    });
}

function montrerSuggestions() {
    const input = document.getElementById("symptomeInput");
    const liste = document.getElementById("suggestions");
    const saisie = sansAccents(input.value.trim().toLowerCase());

    liste.innerHTML = "";

    if (!saisie) return;

    const suggestions = symptomesDisponibles.filter(s =>
        sansAccents(s.toLowerCase()).includes(saisie) &&
        !symptomesSelectionnes.includes(s)
    ).slice(0, 10);

    if (suggestions.length > 0) {
        suggestions.forEach(s => {
            const li = document.createElement("li");
            li.textContent = s;
            li.style.cursor = "pointer";
            li.style.padding = "6px";
            li.style.border = "1px solid #ccc";
            li.style.borderRadius = "6px";
            li.style.marginTop = "4px";
            li.style.background = "#e6ecf5";
            li.onclick = () => {
                symptomesSelectionnes.push(s);
                input.value = "";
                liste.innerHTML = "";
                afficherListeSymptomes();
            };
            liste.appendChild(li);
        });
    } else {
        // 🔍 Proposer l’entrée la plus proche
        const suggestionProche = meilleureCorrespondance(input.value);
        if (suggestionProche && !symptomesSelectionnes.includes(suggestionProche)) {
            const li = document.createElement("li");
            li.textContent = suggestionProche + " (proposition)";
            li.style.cursor = "pointer";
            li.style.padding = "6px";
            li.style.border = "1px dashed #aaa";
            li.style.borderRadius = "6px";
            li.style.marginTop = "4px";
            li.style.background = "#fff0f0";
            li.onclick = () => {
                symptomesSelectionnes.push(suggestionProche);
                input.value = "";
                liste.innerHTML = "";
                afficherListeSymptomes();
            };
            liste.appendChild(li);
        }
    }
}

// 🔤 Fonction de correspondance la plus proche
function meilleureCorrespondance(texte) {
    const saisie = sansAccents(texte.trim().toLowerCase());
    let meilleurScore = 0;
    let meilleurMot = null;

    for (const s of symptomesDisponibles) {
        const normalise = sansAccents(s.toLowerCase());
        const score = similarite(normalise, saisie);
        if (score > meilleurScore) {
            meilleurScore = score;
            meilleurMot = s;
        }
    }

    return (meilleurScore >= 0.5) ? meilleurMot : null;
}

// 🔣 Fonction de similarité simple (Jaccard sur lettres)
function similarite(a, b) {
    const setA = new Set(a);
    const setB = new Set(b);
    const intersection = new Set([...setA].filter(c => setB.has(c)));
    return intersection.size / Math.max(setA.size, setB.size);
}






