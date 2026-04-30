# RAG Demo Temporal

Servicio demo para validar el alcance del asistente conversacional de la agencia.

## Ejecutar

```bash
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 5000 --reload
```

## Endpoints

- `GET /health`
- `POST /reindex`
- `POST /chat`

## Notas

- Usa Ollama para embeddings y generacion.
- Si WSL no puede conectar con Ollama en Windows por HTTP directo, el servicio usa PowerShell como fallback local.
- El RAG no procesa pagos; siempre escala pagos al agente humano.
