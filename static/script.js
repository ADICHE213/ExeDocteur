let symptomesSelectionnes = [];

function ajouterSymptome() {
    const input = document.getElementById("symptomeInput");
    const valeur = input.value.trim();
    if (valeur && !symptomesSelectionnes.includes(valeur)) {
        symptomesSelectionnes.push(valeur);
        input.value = "";
        afficherListeSymptomes();
    }
}

function supprimerSymptome(index) {
    symptomesSelectionnes.splice(index, 1);
    afficherListeSymptomes();
    document.getElementById("resultat").innerHTML = "";  // 👈 Vide les résultats
}

function reinitialiserEntrees() {
    symptomesSelectionnes = [];
    afficherListeSymptomes();
    document.getElementById("resultat").innerHTML = "";
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



