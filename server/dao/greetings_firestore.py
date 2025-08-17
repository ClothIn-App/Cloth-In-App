from typing import Iterable
import os
import firebase_admin
from firebase_admin import credentials, firestore
from ..config import settings
from .greetings_port import GreetingsPort, Greeting

class GreetingsFirestore(GreetingsPort):
    def __init__(self):
        # init Firebase Admin once
        if not firebase_admin._apps:
            cred_path = settings.FIREBASE_CRED_PATH or os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
            if not cred_path or not os.path.exists(cred_path):
                raise RuntimeError("Service account JSON path not set. Set FIREBASE_CRED_PATH or GOOGLE_APPLICATION_CREDENTIALS.")
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
        self.db = firestore.client()
        self.col = self.db.collection("greetings")

    def create(self, text: str) -> str:
        doc_ref = self.col.document()  # auto ID
        doc_ref.set({"text": text})
        return doc_ref.id

    def get(self, greeting_id: str) -> Greeting | None:
        snap = self.col.document(greeting_id).get()
        if not snap.exists:
            return None
        data = snap.to_dict() or {}
        return {"id": snap.id, "text": data.get("text", "")}

    def list(self, limit: int = 20) -> Iterable[Greeting]:
        items: list[Greeting] = []
        for snap in self.col.limit(limit).stream():
            d = snap.to_dict() or {}
            items.append({"id": snap.id, "text": d.get("text", "")})
        return items
