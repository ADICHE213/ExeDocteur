from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)  # ✅ Permet aux navigateurs comme Firefox de faire des requêtes JS

# Charger les données depuis data.json
basedir = os.path.abspath(os.path.dirname(__file__))
data_file = os.path.join(basedir, "data.json")

with open(data_file, "r", encoding="utf-8") as f:
    diagnostic_data = json.load(f)

# Extraire tous les symptômes pour l'autocomplétion
tous_les_symptomes = set()
for diag in diagnostic_data:
    tous_les_symptomes.update(diag.get("symptomes", []))
liste_symptomes = sorted(tous_les_symptomes)

# ✅ Page principale
@app.route('/')
def index():
    return render_template('index.html', symptomes=liste_symptomes)

# ✅ Route d’autocomplétion appelée par JS
@app.route('/autocompletion')
def autocompletion():
    return jsonify(liste_symptomes)

# ✅ Route pour les diagnostics
@app.route('/diagnostic', methods=['POST'])
def diagnostic():
    data = request.get_json()
    symptomes_selectionnes = set(data.get('symptomes', []))
    sexe = data.get('sexe', 'Tous')
    age = data.get('age', '15-45')

    if not symptomes_selectionnes:
        return jsonify([])

    resultats = []
    for d in diagnostic_data:
        d_symptomes = set(d.get("symptomes", []))
        d_sexe = d.get("sexe", ["Tous"])  # ✅ Liste attendue
        d_age = d.get("age", ["Tous"])    # ✅ Liste attendue

        # ✅ Comparaison corrigée
        if symptomes_selectionnes.issubset(d_symptomes):
            if sexe in d_sexe and age in d_age:
                resultats.append(d)

    # Tri par fréquence décroissante
    resultats = sorted(resultats, key=lambda x: x.get("frequence", 0), reverse=True)

    return jsonify(resultats)

# ✅ Lancer le serveur
if __name__ == '__main__':
    app.run()











