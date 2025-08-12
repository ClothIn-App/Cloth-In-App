from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Hello Test")

class HelloOut(BaseModel):
    id: str
    text: str

@app.get("/api/v1/hello", response_model=HelloOut)
def get_hello():
    return {"id": "test", "text": "hello world"}

@app.get("/")
def root():
    return {"message": "Welcome to the API"}

