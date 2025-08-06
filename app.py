from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)  # Autoriser les requêtes depuis le navigateur

# 📂 Chemin absolu vers data.json
basedir = os.path.abspath(os.path.dirname(__file__))
data_file = os.path.join(basedir, "data.json")

# 📥 Charger les données
with open(data_file, "r", encoding="utf-8") as f:
    diagnostic_data = json.load(f)

# 📋 Extraire tous les symptômes pour l'autocomplétion
tous_les_symptomes = set()
for diag in diagnostic_data:
    tous_les_symptomes.update(diag.get("symptomes", []))
liste_symptomes = sorted(tous_les_symptomes)

# ✅ Page d'accueil
@app.route('/')
def index():
    return render_template('index.html', symptomes=liste_symptomes)

# ✅ Autocomplétion
@app.route('/autocompletion')
def autocompletion():
    return jsonify(liste_symptomes)

# ✅ Diagnostic
@app.route('/diagnostic', methods=['POST'])
def diagnostic():
    try:
        data = request.get_json(force=True)  # ⚠️ force=True pour Render
    except Exception as e:
        print("❌ Erreur get_json:", e)
        return jsonify({"erreur": "JSON invalide"}), 400

    print("📥 Données reçues :", data)

    symptomes_selectionnes = set(data.get('symptomes', []))
    sexe = data.get('sexe', 'Tous')
    age = data.get('age', '15-45')

    if not symptomes_selectionnes:
        return jsonify([])

    resultats = []
    for d in diagnostic_data:
        d_symptomes = set(d.get("symptomes", []))
        d_sexe = d.get("sexe", ["Tous"])
        d_age = d.get("age", ["Tous"])

        # 💡 Logs pour Render
        print("🔎 Test:", d.get("diagnostic"))
        print("  - Symptômes:", d_symptomes)
        print("  - Sexe:", d_sexe, "← contient", sexe, "?", sexe in d_sexe)
        print("  - Âge :", d_age, "← contient", age, "?", age in d_age)

        if symptomes_selectionnes.issubset(d_symptomes):
            if sexe in d_sexe and age in d_age:
                print("✅ Match:", d.get("diagnostic"))
                resultats.append(d)

    print("🎯 Total résultats:", len(resultats))
    return jsonify(resultats)

# ✅ Lancer en local (pas utilisé sur Render)
if __name__ == '__main__':
    app.run(debug=True)










