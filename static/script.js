// Déclaration des variables globales
let symptomesDisponiblesData = [];
let symptomesSelectionnes = [];
let isDataLoaded = false;
let motsClesUniques = new Set();
const motsIgnorer = new Set([
    "de", "des", "du", "la", "le", "les", "qui", "que", "ma", "mes", 
    "j", "d", "pour", "alors", "à", "a", "j'ai", "est", "lors", "je", 
    "suis", "au", "dans", "ces", "me", "sens", "se", "ce", "très", 
    "tres", "trop", "beaucoup", "souvent", "matin", "nuit", "heure", 
    "heures", "semaine", "semaines", "tout", "toute", "toutes", 
    "tous", "années", "année", "annee", "annes", "fois", "plusieurs", 
    "reprises", "atroce", "térrible", "terrible", "térribles", 
    "terribles", "soir", "sur", "un", "une", "avec", "dans",
    "taux", "valeur", "degre", "degres", "°c", "°C", "forte", "fort", 
    "sans", "arret", "vers", "arrive", "niveau"
]);

// Fonction pour normaliser une chaîne de caractères (supprimer les accents)
function sansAccents(texte) {
  return texte.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Fonction pour activer l'interface une fois les données chargées
function enableUI() {
  isDataLoaded = true;
  const elementsToEnable = ['nomPatient', 'sexe', 'age', 'symptomeInput'];
  elementsToEnable.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.disabled = false;
    }
  });

  const buttons = document.querySelectorAll('button');
  buttons.forEach(button => {
    button.disabled = false;
  });
}

// Fonction pour extraire tous les mots clés uniques de mots.json
function extraireMotsCles() {
  motsClesUniques.clear();
  symptomesDisponiblesData.forEach(item => {
    item.mots.forEach(mot => {
      motsClesUniques.add(sansAccents(mot.toLowerCase()));
    });
  });
}

// Fonction pour filtrer les mots d'entrée en ne gardant que ceux présents dans mots.json et non dans motsIgnorer
function filtrerMotsEfficaces(motsSaisie) {
  return motsSaisie.filter(mot => {
    const motNorm = sansAccents(mot.toLowerCase());
    return motsClesUniques.has(motNorm) && !motsIgnorer.has(motNorm);
  });
}

// Fonction pour afficher la liste des symptômes sélectionnés dans l'interface
function afficherListeSymptomes() {
  const ul = document.getElementById("listeSymptomes");
  if (!ul) return;
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

// Fonction pour supprimer un symptôme de la liste
function supprimerSymptome(index) {
  symptomesSelectionnes.splice(index, 1);
  afficherListeSymptomes();
  document.getElementById("resultat").innerHTML = "";
}

// Fonction pour réinitialiser la liste des entrées et les résultats
function reinitialiserEntrees() {
  symptomesSelectionnes = [];
  afficherListeSymptomes();
  document.getElementById("resultat").innerHTML = "";
  document.getElementById("symptomeInput").value = "";
  document.getElementById("suggestions").innerHTML = "";
}

// Fonction principale pour envoyer le diagnostic à l'API (reste inchangée)
function envoyerDiagnostic() {
  if (symptomesSelectionnes.length === 0) {
    document.getElementById("resultat").innerHTML = "";
    return;
  }
  const nomPatient = document.getElementById("nomPatient").value.trim();
  const sexe = document.getElementById("sexe").value;
  const age = document.getElementById("age").value;
  fetch(window.location.origin + "/diagnostic", {
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
          Dans cette version de l’application, aucun diagnostic ne correspond aux entrées sélectionnées. Vous pouvez nous signaler ce cas pour une prochaine mise à jour à l’adresse suivante : <br><a href="mailto:tewfik@dr-adiche.com" style="color: #856404; text-decoration: underline;">tewfik@dr-adiche.com</a>
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
            <div class="diagnostic-score">           </div>
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

// Fonction pour afficher les suggestions basées sur les mots-clés, avec filtrage des mots inefficaces
function montrerSuggestions() {
  if (!isDataLoaded) return;
  
  const input = document.getElementById("symptomeInput");

  // 🔹 Nettoyer la saisie
  let saisie = sansAccents(input.value.trim().toLowerCase());
  saisie = saisie.replace(/[0-9\/\*\_\+\=\.\,\;\:\#\&\@\|\%\>\<\?\!]/g, ""); 

  const liste = document.getElementById("suggestions");
  liste.innerHTML = "";

  if (!saisie || symptomesDisponiblesData.length === 0) return;

  // 🔹 Découper en mots et ignorer ceux non pertinents
  let motsSaisie = saisie.split(' ').filter(mot => mot.length > 0 && !motsIgnorer.has(mot));
  if (motsSaisie.length === 0) return;

  // 🔹 Récupérer sexe et âge sélectionnés
  const sexeChoisi = document.getElementById("sexe").value;
  const ageChoisi = document.getElementById("age").value;

  const suggestions = symptomesDisponiblesData
    .filter(item => {
      // Vérifier les mots-clés
      const motsNormalisesDeSymptome = item.mots.map(m => sansAccents(m.toLowerCase()));
      const correspondanceMots = motsSaisie.every(motSaisi =>
        motsNormalisesDeSymptome.some(motCles => motCles.includes(motSaisi))
      );

      if (!correspondanceMots) return false;

      // 🔹 Filtrage par sexe
      if (item.sexe && !item.sexe.includes(sexeChoisi)) return false;

      // 🔹 Filtrage par âge
      if (ageChoisi !== "Tous" && item.age && !item.age.includes(ageChoisi)) return false;

      return true;
    })
    .map(item => item.entree)
    .filter(s => !symptomesSelectionnes.includes(s));

  // 🔹 Affichage suggestions
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
        const resultatDiv = document.getElementById("resultat");
        if (resultatDiv) resultatDiv.innerHTML = "";
      };
      liste.appendChild(li);
    });
  }
}



// Fonction pour charger les données du fichier JSON
async function chargerSymptomes() {
  try {
    const response = await fetch('/static/mots.json');
    if (!response.ok) {
      throw new Error(`Erreur de chargement: ${response.status}`);
    }
    symptomesDisponiblesData = await response.json();
    extraireMotsCles();
    enableUI();
  } catch (error) {
    console.error("Erreur de chargement des données de symptômes:", error);
    const resultatDiv = document.getElementById("resultat");
    if (resultatDiv) {
      resultatDiv.innerHTML = `<div style="background-color: #fcebeb; color: #cc0000; padding: 15px; border-left: 4px solid #cc0000; border-radius: 8px; text-align: center; font-weight: 600;">Erreur : Impossible de charger le fichier de données 'mots.json'.</div>`;
    }
  }
}

// 🔹 Réinitialiser les entrées quand on change le sexe ou la tranche d'âge
document.getElementById("sexe").addEventListener("change", () => {
  reinitialiserEntrees();
});

document.getElementById("age").addEventListener("change", () => {
  reinitialiserEntrees();
});

document.getElementById("sexe").addEventListener("change", () => {
  reinitialiserEntrees();
  document.getElementById("nomPatient").value = "";
});



// Événement pour lancer le chargement des données au démarrage de la page
document.addEventListener('DOMContentLoaded', chargerSymptomes);

// 🔹 Mise en majuscule de la première lettre de chaque mot du nom du patient
document.getElementById("nomPatient").addEventListener("input", function () {
  this.value = this.value
    .split(" ")
    .map(mot => mot.charAt(0).toUpperCase() + mot.slice(1))
    .join(" ");
});

function exporterPDF() {
  if (symptomesSelectionnes.length === 0 && document.getElementById("resultat").innerText.trim() === "") {
    alert("Aucun diagnostic à exporter.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const bleuMedical = [0, 102, 204];
  const grisClair = [200, 200, 200];

  const nomPatient = document.getElementById("nomPatient").value || "Cas sans nom";
  const sexe = document.getElementById("sexe").value;

  let age = document.getElementById("age").value;
  switch (age) {
    case "0-15": age = "moins de 15 ans"; break;
    case "15-45": age = "entre 15 et 45 ans"; break;
    case ">45": age = "plus de 45 ans"; break;
    default: age = "non précisée";
  }

  const entrees = symptomesSelectionnes.length > 0 ? symptomesSelectionnes : ["Aucune"];
  const resultatsElements = document.querySelectorAll("#resultat .diagnostic-title");
  let diagnostics = [];
  resultatsElements.forEach(el => diagnostics.push(el.textContent));
  if (diagnostics.length === 0) diagnostics = ["Aucun"];

  let y = 20;
  const pageHeight = doc.internal.pageSize.height;

  function checkPageBreak() {
    if (y > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }
  }

  // Titre principal
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...bleuMedical);
  doc.text("Rapport Diagnostic - Dr ADICHE", 105, y, { align: "center" });

  // ➕ Ajout date/heure sous le titre
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR');
  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  y += 6;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...bleuMedical);
  //doc.setTextColor(0, 0, 0);
  doc.text(`${dateStr}   ${timeStr}`, 105, y, { align: "center" });

  // Ligne séparation
  y += 5;
  doc.setDrawColor(...grisClair);
  doc.line(10, y, 200, y);

  y += 10;
  doc.setFontSize(12);
  doc.setTextColor(...bleuMedical);
  doc.setFont("helvetica", "bold"); 
  doc.text("Informations du patient", 10, y);

  y += 3;
  doc.setDrawColor(...bleuMedical);
  doc.rect(10, y, 190, 25);

  // Nom / Sexe / Age
  doc.setFont("helvetica", "bold"); doc.setTextColor(...bleuMedical);
  doc.text("Nom :", 12, y + 8);
  doc.setFont("helvetica", "normal"); doc.setTextColor(0, 0, 0);
  doc.text(nomPatient, 50, y + 8);

  doc.setFont("helvetica", "bold"); doc.setTextColor(...bleuMedical);
  doc.text("Sexe :", 12, y + 15);
  doc.setFont("helvetica", "normal"); doc.setTextColor(0, 0, 0);
  doc.text(sexe, 50, y + 15);

  doc.setFont("helvetica", "bold"); doc.setTextColor(...bleuMedical);
  doc.text("Tranche d'âge :", 12, y + 22);
  doc.setFont("helvetica", "normal"); doc.setTextColor(0, 0, 0);
  doc.text(age, 50, y + 22);

  y += 35;
  checkPageBreak();

  // Entrées sélectionnées
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...bleuMedical);
  doc.text("Entrées sélectionnées :", 10, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  entrees.forEach(e => {
    doc.text(`• ${e}`, 15, y);
    y += 6;
    checkPageBreak();
  });

  // Diagnostics trouvés
  y += 4;
  checkPageBreak();
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...bleuMedical);
  doc.text("Diagnostics trouvés :", 10, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  diagnostics.forEach(d => {
    doc.text(`• ${d}`, 15, y);
    y += 6;
    checkPageBreak();
  });

// -- Pagination --
const pageCount = doc.internal.getNumberOfPages();
for (let i = 1; i <= pageCount; i++) {
  doc.setPage(i);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text(`Page ${i} / ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: "center" });
}

// Sauvegarde finale
doc.save(`Diagnostic_${nomPatient.replace(/\s+/g, "_")}.pdf`);
}


