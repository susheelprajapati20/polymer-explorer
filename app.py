from flask import Flask, render_template, jsonify
import csv
import os

app = Flask(__name__)

def load_polymers():
    polymers = []
    # Make sure you have a 'data' folder with 'polymers.csv' inside it!
    filepath = os.path.join(app.root_path, 'data', 'polymers.csv')
    try:
        with open(filepath, mode='r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                polymers.append(row)
    except Exception as e:
        print(f"Error loading CSV: {e}")
    return polymers

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/polymers')
def get_polymers():
    data = load_polymers()
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True)