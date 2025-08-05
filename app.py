from flask import Flask, render_template, request, jsonify
import json

app = Flask(__name__)

# Charger le fichier data.json
with open("data.json", "r", encoding="utf-8") as f:
    diagnostic_data = json.load(f)

@app.route("/")
def index():
    # Extraire tous les symptômes pour l'autocomplétion
    symptomes = sorted({
        s for infos in diagnostic_data.values()
        for s in infos.get("symptomes", [])
    })
    return render_template("index.html", symptomes=symptomes)

@app.route("/diagnostic", methods=["POST"])
def diagnostic():
    donnees = request.get_json()
    symptomes_utilisateur = set(donnees.get("symptomes", []))
    sexe = donnees.get("sexe")
    age = donnees.get("age")

    # ✅ Si aucun symptôme n’est sélectionné, on ne retourne rien
    if not symptomes_utilisateur:
        return jsonify([])

    resultats = []

    for diagnostic, infos in diagnostic_data.items():
        symptomes_diagnostic = set(infos.get("symptomes", []))
        frequence = infos.get("frequence", 0)
        sexes = infos.get("sexe", ["Masculin", "Féminin"])
        ages = infos.get("age", ["0-15", "15-45", ">45"])

        # ✅ Filtrer selon symptômes, sexe et âge
        if (
            symptomes_utilisateur.issubset(symptomes_diagnostic)
            and sexe in sexes
            and (age == "Tous" or age in ages)
        ):
            resultats.append((diagnostic, frequence))

    # ✅ Trier par fréquence décroissante
    resultats.sort(key=lambda x: x[1], reverse=True)

    return jsonify(resultats)

if __name__ == "__main__":
    app.run(debug=True)


