# app.py
import os
from flask import Flask, render_template, request, jsonify
import json

# Créez l'application Flask
app = Flask(__name__)

# Charge le fichier data.json (liste)
# Le chemin du fichier est relatif au dossier de l'application
with open("data.json", "r", encoding="utf-8") as f:
    diagnostic_data = json.load(f)

# Page d'accueil
@app.route("/")
def index():
    # Extrait et trie les symptômes uniques pour le formulaire
    symptomes = sorted({
        s for item in diagnostic_data
        for s in item.get("symptomes", [])
    })
    return render_template("index.html", symptomes=symptomes)

# Endpoint pour le diagnostic
@app.route("/diagnostic", methods=["POST"])
def diagnostic():
    donnees = request.get_json()

    symptomes_utilisateur = donnees.get("symptomes", [])
    sexe = donnees.get("sexe", None)
    age = donnees.get("age", None)

    if not symptomes_utilisateur:
        return jsonify([])

    resultats = []

    for item in diagnostic_data:
        nom_diagnostic = item.get("diagnostic", "")
        symptomes_diagnostic = item.get("symptomes", [])
        frequence = item.get("frequence", 0)
        sexes = item.get("sexe", ["Masculin", "Féminin"])
        ages = item.get("age", ["0-15", "15-45", ">45"])

        # Recherche par contenance (substring) insensible à la casse
        def contient_symptome(symp_util):
            symp_util = symp_util.lower().strip()
            for symp_diag in symptomes_diagnostic:
                if symp_util in symp_diag.lower().strip():
                    return True
            return False

        # Tous les symptômes utilisateur doivent matcher au moins un symptôme diagnostic
        if all(contient_symptome(symp) for symp in symptomes_utilisateur):
            # Vérification sexe et âge (si fournis)
            sexe_ok = (sexe is None) or (sexe in sexes)
            age_ok = (age is None) or (age == "Tous") or (age in ages)

            if sexe_ok and age_ok:
                resultats.append((nom_diagnostic, frequence))

    # Trie les résultats par fréquence décroissante
    resultats.sort(key=lambda x: x[1], reverse=True)
    return jsonify(resultats)

# Code pour le démarrage local (non utilisé par Render, mais utile pour tester en local)
if __name__ == "__main__":
    # Récupère le port de l'environnement, sinon utilise 5000
    port = int(os.environ.get("PORT", 5000))
    # Le host '0.0.0.0' est nécessaire pour que l'application soit accessible
    # depuis l'extérieur du conteneur Render
    app.run(host='0.0.0.0', port=port, debug=False)
