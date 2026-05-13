# Arquitectura Modular - RAG Agencia de Viajes

## 📐 Diagrama de Flujo

```
                    ┌─────────────────────────────────────────┐
                    │         FUENTES DE DOCUMENTOS             │
                    │  (Markdown, JSON, TXT, etc.)             │
                    └────────────┬────────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   LoaderFactory          │
                    │  ├─ MarkdownLoader      │
                    │  ├─ JSONLoader          │
                    │  └─ TextLoader          │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────────────┐
                    │   Modelo Document               │
                    │  ├─ id (UUID)                   │
                    │  ├─ source (str)                │
                    │  ├─ content (str)               │
                    │  └─ metadata (dict)             │
                    └────────────┬────────────────────┘
                                 │
                    ┌────────────▼────────────────────┐
                    │   Chunking Strategy             │
                    │  ├─ MarkdownChunker             │
                    │  ├─ GenericChunker              │
                    │  └─ CustomChunker (extensible)  │
                    └────────────┬────────────────────┘
                                 │
                    ┌────────────▼────────────────────┐
                    │   Modelo Chunk                  │
                    │  ├─ id (UUID)                   │
                    │  ├─ document_id (UUID)          │
                    │  ├─ content (str)               │
                    │  └─ metadata (dict)             │
                    └────────────┬────────────────────┘
                                 │
                    ┌────────────▼────────────────────┐
                    │   EmbeddingService              │
                    │   (Ollama: qwen3-embedding)     │
                    └────────────┬────────────────────┘
                                 │
                    ┌────────────▼────────────────────┐
                    │   Vector Embeddings             │
                    │   list[list[float]]             │
                    └────────────┬────────────────────┘
                                 │
                    ┌────────────▼────────────────────┐
                    │   VectorStoreService            │
                    │   (ChromaDB Persistent)         │
                    │  ├─ add_chunks()                │
                    │  ├─ search()                    │
                    │  └─ delete_collection()         │
                    └────────────┬────────────────────┘
                                 │
                    ┌────────────▼────────────────────┐
                    │   ChromaDB Storage              │
                    │   (./storage/chroma/)           │
                    └────────────┬────────────────────┘
                                 │
                    ┌────────────▼────────────────────┐
                    │   SemanticSearchService         │
                    │   ├─ index_chunks()             │
                    │   ├─ search()                   │
                    │   └─ reindex()                  │
                    └────────────┬────────────────────┘
                                 │
                    ┌────────────▼────────────────────┐
                    │   RAG Pipeline                  │
                    │   (Orquestación completa)       │
                    │   ├─ ingest_file()              │
                    │   ├─ ingest_directory()         │
                    │   ├─ search()                   │
                    │   └─ get_stats()                │
                    └────────────┬────────────────────┘
                                 │
                    ┌────────────▼────────────────────┐
                    │   Resultados de Búsqueda       │
                    │   ├─ content (str)              │
                    │   ├─ similarity (float: 0-1)    │
                    │   └─ metadata (dict)            │
                    └─────────────────────────────────┘
```

## 🏗️ Estructura de Directorios

```
app/
├── core/
│   ├── config.py                    # Configuración centralizada
│   ├── chunking/                    # Estrategias de fragmentación
│   │   ├── __init__.py
│   │   ├── base_chunker.py          # Interfaz abstracta
│   │   ├── markdown_chunker.py      # Especializada para Markdown
│   │   └── generic_chunker.py       # Genérica (paragraphs/líneas)
│   │
│   ├── loaders/                     # Cargadores de documentos
│   │   ├── base_loader.py           # Interfaz abstracta
│   │   ├── markdown_loader.py       # .md
│   │   ├── json_loader.py           # .json
│   │   ├── txt_loader.py            # .txt
│   │   └── models.py                # Document, Chunk
│   │
│   ├── loader_factory.py            # Factory pattern para loaders
│   │
│   └── services/                    # Servicios de IA
│       ├── __init__.py
│       ├── embedding_service.py     # Ollama embeddings
│       ├── vector_store_service.py  # ChromaDB persistence
│       ├── semantic_search_service.py # Búsqueda unificada
│       └── rag_pipeline.py          # Pipeline completo
│
├── examples/
│   ├── pipeline_example.py          # Ejemplo de uso completo
│
└── main.py                          # FastAPI app
```

## 🔧 Componentes Principales

### 1. Loaders (ya existentes)
**Responsabilidad:** Leer archivos y convertirlos a objetos `Document`

```python
from app.core.loader_factory import LoaderFactory

factory = LoaderFactory()
loader = factory.get_loader("documento.md")
documents = loader.load("documento.md")
```

### 2. Chunking (NUEVO)
**Responsabilidad:** Dividir documentos en fragmentos manejables

```python
from app.core.chunking import MarkdownChunker, GenericChunker
from app.core.loaders.models import Document

doc = Document(source="readme.md", content="...")

# Chunking especializado para Markdown
chunker = MarkdownChunker(chunk_size=500)
chunks = chunker.chunk(doc)

# Chunking genérico
generic_chunker = GenericChunker(chunk_size=800)
chunks = generic_chunker.chunk(doc)
```

**Estrategias disponibles:**
- `MarkdownChunker`: Respeta estructura de encabezados (##)
- `GenericChunker`: Divide por párrafos/líneas (universal)
- Extensible: Crear `CustomChunker(BaseChunker)` para formatos especiales

### 3. EmbeddingService (mejorado)
**Responsabilidad:** Generar vectores usando Ollama

```python
from app.core.services import EmbeddingService

embedder = EmbeddingService()
vector = embedder.embed_text("¿Dónde ir?")           # Un texto
vectors = embedder.embed_texts(["texto1", "texto2"]) # Batch
```

### 4. VectorStoreService (NUEVO)
**Responsabilidad:** Persistencia y búsqueda en ChromaDB

```python
from app.core.services import VectorStoreService

vs = VectorStoreService(persist_dir="./storage/chroma")

# Agregar chunks
vs.add_chunks(chunks, embeddings)

# Búsqueda
query_embedding = embedder.embed_text("query")
results = vs.search(query_embedding, top_k=5)

# Estadísticas
print(vs.get_stats())
```

### 5. SemanticSearchService (NUEVO)
**Responsabilidad:** Interfaz unificada de búsqueda (Embeddings + VectorStore)

```python
from app.core.services import SemanticSearchService

search = SemanticSearchService(persist_dir="./storage/chroma")

# Indexar chunks
indexed = search.index_chunks(chunks)

# Búsqueda (texto → embedding → búsqueda automática)
results = search.search("¿Dónde ir?", top_k=5)
# [
#   {
#     "id": "chunk-uuid",
#     "content": "...",
#     "similarity": 0.87,
#     "metadata": {...}
#   },
#   ...
# ]

# Reindexar
search.reindex(new_chunks)
```

### 6. RAGPipeline (NUEVO)
**Responsabilidad:** Orquestación completa (LoaderFactory → Chunking → Embeddings → Search)

```python
from app.core.services import RAGPipeline
from app.core.config import settings

pipeline = RAGPipeline()

# Ingestar archivos individuales
result = pipeline.ingest_file("documento.md")

# Ingestar directorio completo
result = pipeline.ingest_directory("./data/knowledge")
# {
#   "total_files": 4,
#   "total_documents": 8,
#   "total_chunks": 127,
#   "successful": 4,
#   "failed": 0,
#   "files": [...]
# }

# Buscar
results = pipeline.search("¿Dónde ir?", top_k=3)

# Estadísticas
pipeline.get_stats()

# Limpiar
pipeline.clear()
```

## 🚀 Flujo de Uso Típico

### Opción A: Usar RAGPipeline (recomendado)
```python
from app.core.services import RAGPipeline
from app.core.config import settings

# 1. Crear pipeline
pipeline = RAGPipeline()

# 2. Ingestar documentos
pipeline.ingest_directory(str(settings.KNOWLEDGE_DIR))

# 3. Buscar
results = pipeline.search("consulta del usuario", top_k=5)

# 4. Usar en RAG
for result in results:
    context += result['content']
```

### Opción B: Control granular
```python
from app.core.services import (
    EmbeddingService,
    VectorStoreService,
    SemanticSearchService,
)
from app.core.chunking import MarkdownChunker
from app.core.loader_factory import LoaderFactory

# 1. Cargar
loader = LoaderFactory().get_loader("doc.md")
documents = loader.load("doc.md")

# 2. Chunking
chunker = MarkdownChunker()
chunks = [c for doc in documents for c in chunker.chunk(doc)]

# 3. Embeddings
embedder = EmbeddingService()
embeddings = embedder.embed_texts([c.content for c in chunks])

# 4. Almacenamiento
vs = VectorStoreService(persist_dir="./storage/chroma")
vs.add_chunks(chunks, embeddings)

# 5. Búsqueda
query_vector = embedder.embed_text("query")
results = vs.search(query_vector, top_k=5)
```

## ⚙️ Variables de Configuración

Ver [config.py](app/core/config.py):

```python
# Ollama
OLLAMA_HOST = "http://localhost:11434"
EMBEDDING_MODEL = "qwen3-embedding:latest"
LLM_MODEL = "gemma3:12b"

# RAG
TOP_K = 5
SIMILARITY_THRESHOLD = 0.0
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50

# ChromaDB
CHROMA_PERSIST_DIR = "./storage/chroma"
CHROMA_COLLECTION = "documents"
```

Se pueden sobrescribir con variables de entorno:
```bash
export CHUNK_SIZE=800
export TOP_K=10
export CHROMA_PERSIST_DIR="/custom/path"
python app/main.py
```

## 🔌 Integración con main.py

El pipeline puede usarse en los endpoints FastAPI:

```python
from app.core.services import RAGPipeline
from app.core.config import settings

pipeline = RAGPipeline()

@app.post("/reindex")
def reindex_knowledge():
    """Reindexar base de conocimiento."""
    result = pipeline.ingest_directory(str(settings.KNOWLEDGE_DIR))
    return result

@app.post("/chat")
def chat(request: ChatRequest):
    """Chat con RAG."""
    # Buscar contexto
    results = pipeline.search(request.message, top_k=5)
    contexts = [r["content"] for r in results]
    
    # Usar en LLM chain...
```

## 📊 Beneficios de la Arquitectura

✅ **Modular:** Cada componente tiene una responsabilidad clara  
✅ **Extensible:** Crear nuevos chunkers, loaders, etc. heredando de interfaces  
✅ **Reutilizable:** Los servicios se usan independientemente o en pipeline  
✅ **Testeable:** Cada componente es independent y mockeable  
✅ **Persistente:** ChromaDB mantiene índice entre sesiones  
✅ **Escalable:** Soporte para múltiples colecciones, batch processing  
✅ **Configurable:** Parámetros controlables por variables de entorno  

## 🎯 Próximas Mejoras

- [ ] Soporte para múltiples estrategias de embedding (OpenAI, Hugging Face)
- [ ] Caché de embeddings para evitar reprocessamiento
- [ ] Métrica de relevancia personalizada por tipo de consulta
- [ ] Logging/telemetría de búsquedas
- [ ] Validación de calidad de chunks
- [ ] API REST para gestión de índices
- [ ] Interfaz web para administración
