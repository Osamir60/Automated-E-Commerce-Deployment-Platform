from flask import Flask

app = Flask(__name__)

@app.route("/")
def home():
    return "Backend API Running 🚀"

@app.route("/products")
def products():
    return {
        "products": [
            {"id": 1, "name": "Laptop"},
            {"id": 2, "name": "Phone"},
            {"id": 3, "name": "Headphones"}
        ]
    }

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
