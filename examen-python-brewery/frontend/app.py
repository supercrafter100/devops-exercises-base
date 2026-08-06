"""
Solstice Brewing Co. - Webinterface

Deze Flask applicatie rendert de pagina's op de server met Jinja2 templates.
De data haalt ze op bij de API via HTTP REST calls.

De applicatie moet weten hoe ze de API kan bereiken. Dat stel je in met:

    API_URL=http://<naam-van-je-api-service>:8000

De frontend luistert op poort 3000.

Je hoeft de Python code NIET aan te passen om deze oefening op te lossen.
"""

import os

import requests
from flask import Flask, redirect, render_template, request, url_for

PORT = 3000

# Waar bereiken we de API? Zonder deze variabele valt de app terug op localhost,
# wat binnen Docker niet zal werken.
API_URL = os.environ.get("API_URL", "http://127.0.0.1:8000").rstrip("/")

STAGES = ["maischen", "koken", "gisting", "lagering", "afgevuld"]

app = Flask(__name__)


def api_get(path):
    """Haalt data op bij de API. Geeft None terug als de API onbereikbaar is."""
    try:
        response = requests.get(f"{API_URL}{path}", timeout=5)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as exc:
        app.logger.warning("API onbereikbaar: %s", exc)
        return None


@app.get("/")
def index():
    batches = api_get("/api/batches")
    verify = api_get("/api/verify")

    return render_template(
        "index.html",
        batches=batches if batches is not None else [],
        api_online=batches is not None,
        storage=(verify or {}).get("storage", "onbekend"),
        stages=STAGES,
    )


@app.post("/batches")
def create_batch():
    """Stuurt een nieuwe batch door naar de API."""
    try:
        requests.post(
            f"{API_URL}/api/batches",
            json={
                "name": request.form.get("name", ""),
                "style": request.form.get("style", ""),
                "volume_l": request.form.get("volume_l", 0),
                "stage": request.form.get("stage", "maischen"),
            },
            timeout=5,
        )
    except requests.RequestException as exc:
        app.logger.warning("Kon batch niet toevoegen: %s", exc)

    return redirect(url_for("index"))


@app.post("/batches/<int:batch_id>/stage")
def move_stage(batch_id):
    try:
        requests.post(
            f"{API_URL}/api/batches/{batch_id}/stage",
            json={"stage": request.form.get("stage", "")},
            timeout=5,
        )
    except requests.RequestException as exc:
        app.logger.warning("Kon fase niet wijzigen: %s", exc)

    return redirect(url_for("index"))


@app.post("/batches/<int:batch_id>/delete")
def delete_batch(batch_id):
    try:
        requests.delete(f"{API_URL}/api/batches/{batch_id}", timeout=5)
    except requests.RequestException as exc:
        app.logger.warning("Kon batch niet verwijderen: %s", exc)

    return redirect(url_for("index"))


if __name__ == "__main__":
    print(f"Webinterface luistert op http://localhost:{PORT}")
    print(f"API_URL: {API_URL}")
    app.run(host="0.0.0.0", port=PORT)
