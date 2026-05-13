import ollama

from app.core.config import settings


class EmbeddingService:

    def __init__(self) -> None:
        self.client = ollama.Client(host=settings.OLLAMA_HOST)

    def embed_text(self, text: str) -> list[float]:
        response = self.client.embeddings(model=settings.EMBEDDING_MODEL, prompt=text)
        return response["embedding"]

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        return [self.embed_text(text) for text in texts]
