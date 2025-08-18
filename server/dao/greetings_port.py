#Defined the buttons the API can press (create/get/list) without saying how the DB is implemented
from typing import Protocol, Iterable, TypedDict

class Greeting(TypedDict, total=False):
    id: str
    text: str

class GreetingsPort(Protocol):
    def create(self, text: str) -> str: ...
    def get(self, greeting_id: str) -> Greeting | None: ...
    def list(self, limit: int = 20) -> Iterable[Greeting]: ...
