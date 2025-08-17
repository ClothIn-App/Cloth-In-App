from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from .config import settings
from .dao.greetings_firestore import GreetingsFirestore
# If you later add a memory adapter for testing, you could import it here too

app = FastAPI(title="Hello Test")

# Existing routes
class HelloOut(BaseModel):
    id: str
    text: str

@app.get("/api/v1/hello", response_model=HelloOut)
def get_hello():
    return {"id": "test", "text": "hello world"}

@app.get("/")
def root():
    return {"message": "Welcome to the API"}


# --- New Firestore-backed greetings API ---

# Choose the DB adapter based on config
def get_greetings_port():
    if settings.DB_BACKEND == "firestore":
        return GreetingsFirestore()
    # If you add other adapters in the future, handle them here
    raise RuntimeError(f"Unsupported DB_BACKEND={settings.DB_BACKEND}")

GREETINGS = get_greetings_port()

class GreetingIn(BaseModel):
    text: str

class GreetingOut(BaseModel):
    id: str
    text: str

@app.post("/api/v1/greetings", response_model=GreetingOut)
def create_greeting(payload: GreetingIn):
    gid = GREETINGS.create(payload.text)
    return {"id": gid, "text": payload.text}

@app.get("/api/v1/greetings/{greeting_id}", response_model=GreetingOut)
def get_greeting(greeting_id: str):
    g = GREETINGS.get(greeting_id)
    if not g:
        raise HTTPException(status_code=404, detail="Greeting not found")
    return g

@app.get("/api/v1/greetings", response_model=list[GreetingOut])
def list_greetings(limit: int = 20):
    return list(GREETINGS.list(limit))
