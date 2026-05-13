from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Travel Agency RAG", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4321",
        "http://localhost:4322",
        "http://127.0.0.1:4321",
        "https://lanky-violator-freight.ngrok-free.dev",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
def shutdown() -> None:
    backend.close()


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "model": os.getenv("OLLAMA_LLM_MODEL", "gemma3:12b"),
        "backend_url": BACKEND_URL,
    }
