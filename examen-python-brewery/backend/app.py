"""
Solstice Brewing Co. - Batch tracking API

Regels:
  - Alle routes draaien onder /api
  - STORAGE bepaalt de opslag: memory (default) | mongodb
  - Bij mongodb wordt verbonden via MONGODB_HOST, MONGODB_DB,
    MONGODB_USER en MONGODB_PWD
  - De API luistert op poort 8000

Deze applicatie is bewust klein en leesbaar gehouden.
Je hoeft de Python code NIET aan te passen om deze oefening op te lossen.
"""

import os
import threading

from flask import Flask, jsonify, request

PORT = 8000

STORAGE = os.environ.get("STORAGE", "memory").lower()

app = Flask(__name__)


class MemoryStorage:
    """Opslag in het geheugen. Data is weg bij een herstart."""

    def __init__(self):
        self._batches = []
        self._next_id = 1
        self._lock = threading.Lock()

    def type(self):
        return "memory"

    def list(self):
        with self._lock:
            return sorted(self._batches, key=lambda b: b["id"])

    def add(self, batch):
        with self._lock:
            batch["id"] = self._next_id
            self._next_id += 1
            self._batches.append(batch)
            return batch

    def update_stage(self, batch_id, stage):
        with self._lock:
            for batch in self._batches:
                if batch["id"] == batch_id:
                    batch["stage"] = stage
                    return batch
            return None

    def delete(self, batch_id):
        with self._lock:
            self._batches = [b for b in self._batches if b["id"] != batch_id]


class MongoStorage:
    """Opslag in MongoDB."""

    def __init__(self):
        from pymongo import MongoClient

        host = os.environ.get("MONGODB_HOST", "127.0.0.1")
        db_name = os.environ.get("MONGODB_DB", "brewery")
        user = os.environ.get("MONGODB_USER", "")
        pwd = os.environ.get("MONGODB_PWD", "")

        if user and pwd:
            uri = f"mongodb://{user}:{pwd}@{host}:27017/{db_name}"
        else:
            uri = f"mongodb://{host}:27017/{db_name}"

        # De database heeft bij het opstarten even tijd nodig. serverSelection
        # zorgt ervoor dat pymongo zelf een tijdje blijft proberen.
        self._client = MongoClient(uri, serverSelectionTimeoutMS=30000)
        self._db = self._client[db_name]
        self._batches = self._db["batches"]
        self._counters = self._db["counters"]

    def type(self):
        return "mongodb"

    def _next_id(self):
        # Een atomaire teller, zodat elke batch een uniek oplopend id krijgt.
        doc = self._counters.find_one_and_update(
            {"_id": "batch_id"},
            {"$inc": {"seq": 1}},
            upsert=True,
            return_document=True,
        )
        return int(doc["seq"])

    def list(self):
        # _id weglaten: dat is een ObjectId en niet zomaar JSON.
        return list(self._batches.find({}, {"_id": 0}).sort("id", 1))

    def add(self, batch):
        batch["id"] = self._next_id()
        self._batches.insert_one(dict(batch))
        return batch

    def update_stage(self, batch_id, stage):
        self._batches.update_one({"id": batch_id}, {"$set": {"stage": stage}})
        return self._batches.find_one({"id": batch_id}, {"_id": 0})

    def delete(self, batch_id):
        self._batches.delete_one({"id": batch_id})


storage = MongoStorage() if STORAGE == "mongodb" else MemoryStorage()

# De stappen die een brouwsel doorloopt.
STAGES = ["maischen", "koken", "gisting", "lagering", "afgevuld"]


@app.get("/api/verify")
def verify():
    """Geeft terug welke opslag in gebruik is."""
    return jsonify({"storage": storage.type()})


@app.get("/api/batches")
def list_batches():
    return jsonify(storage.list())


@app.post("/api/batches")
def add_batch():
    data = request.get_json(silent=True) or {}

    name = str(data.get("name", "")).strip()
    style = str(data.get("style", "")).strip()
    volume = data.get("volume_l", 0)
    stage = str(data.get("stage", "")).strip() or "maischen"

    if not name or not style:
        return jsonify({"error": "naam en stijl zijn verplicht"}), 400

    if stage not in STAGES:
        return jsonify({"error": f"stage moet een van {STAGES} zijn"}), 400

    try:
        volume = int(volume)
    except (TypeError, ValueError):
        volume = 0

    batch = storage.add(
        {
            "name": name,
            "style": style,
            "volume_l": max(volume, 0),
            "stage": stage,
        }
    )
    return jsonify(batch), 201


@app.post("/api/batches/<int:batch_id>/stage")
def update_stage(batch_id):
    data = request.get_json(silent=True) or {}
    stage = str(data.get("stage", "")).strip()

    if stage not in STAGES:
        return jsonify({"error": f"stage moet een van {STAGES} zijn"}), 400

    updated = storage.update_stage(batch_id, stage)
    if updated is None:
        return jsonify({"error": "batch niet gevonden"}), 404

    return jsonify(updated)


@app.delete("/api/batches/<int:batch_id>")
def delete_batch(batch_id):
    storage.delete(batch_id)
    return jsonify({"deleted": True})


if __name__ == "__main__":
    print(f"Batch API luistert op http://localhost:{PORT}")
    print(f"Opslag: {storage.type()}")
    app.run(host="0.0.0.0", port=PORT)
