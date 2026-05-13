# 🎯 Guía de Modularización del RAG

## ✨ Lo que acabamos de crear

Tu RAG ha sido completamente modularizado con arquitectura de capas. Ahora tienes:

### 📦 3 Nuevos Módulos

#### 1️⃣ **Chunking Module** (`app/core/chunking/`)

Divide documentos en fragmentos inteligentes:

```python
from app.core.chunking import MarkdownChunker, GenericChunker

# Para Markdown: respeta encabezados
chunker_md = MarkdownChunker(chunk_size=500)
chunks = chunker_md.chunk(document)

# Para cualquier tipo de texto: divide por párrafos
chunker_generic = GenericChunker(chunk_size=800)
chunks = chunker_generic.chunk(document)
```

**Archivos:**

- `base_chunker.py` - Interfaz abstracta (extiende para crear custom)
- `markdown_chunker.py` - Especializado para .md
- `generic_chunker.py` - Universal para cualquier texto

---

#### 2️⃣ **Vector Store Service** (`app/core/services/vector_store_service.py`)

Persistencia de embeddings en ChromaDB:

```python
from app.core.services import VectorStoreService

# Crear/conectar a ChromaDB
vs = VectorStoreService(persist_dir="./storage/chroma")

# Guardar chunks con embeddings
vs.add_chunks(chunks, embeddings)

# Buscar por similitud
query_vector = embedder.embed_text("¿dónde ir?")
results = vs.search(query_vector, top_k=5)

# Estadísticas
print(vs.get_stats())  # {"count": 127, "collection_name": "documents"}
```

**Beneficios:**

- ✅ Persistencia entre sesiones
- ✅ Búsqueda rápida con HNSW
- ✅ Fácil de escalar
- ✅ Interfaz limpia

---

#### 3️⃣ **Semantic Search Service** (`app/core/services/semantic_search_service.py`)

Búsqueda semántica de alto nivel:

```python
from app.core.services import SemanticSearchService

search = SemanticSearchService(persist_dir="./storage/chroma")

# Indexar chunks (genera embeddings automáticamente)
indexed = search.index_chunks(chunks)
print(f"Indexados: {indexed} chunks")

# Búsqueda con una línea (texto → embedding → búsqueda)
results = search.search("¿cuáles son las playas más bonitas?", top_k=3)

# Cada resultado:
# {
#   "id": "chunk-uuid",
#   "content": "Contenido del chunk...",
#   "similarity": 0.92,  # Similitud 0-1
#   "metadata": {"source": "playas_demo.md", ...}
# }

# Reindexar (limpia y reconstruye)
search.reindex(new_chunks)
```

---

#### 4️⃣ **RAG Pipeline** (`app/core/services/rag_pipeline.py`)

Orquestación completa: Loader → Chunking → Embeddings → Search

```python
from app.core.services import RAGPipeline
from app.core.config import settings

# Crear pipeline
pipeline = RAGPipeline()

# Opción A: Ingestar un archivo
result = pipeline.ingest_file("documento.md")
# {"file": "documento.md", "documents": 1, "chunks": 12, "status": "success"}

# Opción B: Ingestar directorio completo
result = pipeline.ingest_directory(str(settings.KNOWLEDGE_DIR))
# {
#   "directory": "./data/knowledge",
#   "total_files": 4,
#   "total_documents": 8,
#   "total_chunks": 127,
#   "successful": 4,
#   "failed": 0,
#   "files": [...]
# }

# Buscar
results = pipeline.search("consulta", top_k=5)

# Estadísticas
stats = pipeline.get_stats()

# Limpiar índice
pipeline.clear()
```

---

## 🔄 Flujo Completo: Antes vs Después

### ❌ ANTES (knowledge_base.py monolítico)

```
Archivos → split_markdown() → embed() → json.dump() → cosine()
```

Problemas:

- ❌ Chunking hardcoded solo para Markdown
- ❌ Almacenamiento en JSON (lento, no escalable)
- ❌ Sin reutilización de componentes
- ❌ Difícil de extender

### ✅ AHORA (Arquitectura modular)

```
Archivos → LoaderFactory → Chunker(estrategia) → EmbeddingService → 
VectorStoreService(ChromaDB) → SemanticSearchService → RAGPipeline
```

Beneficios:

- ✅ Cada componente independiente
- ✅ Fácil agregar nuevas estrategias de chunking
- ✅ ChromaDB: rápido, persistente, escalable
- ✅ Interfaces claras y reutilizables
- ✅ Totalmente testeable

---

## 📝 Ejemplos de Uso

### Ejemplo 1: Ingestar documentos en FastAPI

```python
from fastapi import FastAPI
from app.core.services import RAGPipeline
from app.core.config import settings

app = FastAPI()
pipeline = RAGPipeline()

@app.post("/reindex")
async def reindex():
    """Reindexar base de conocimiento."""
    result = pipeline.ingest_directory(str(settings.KNOWLEDGE_DIR))
    return result
```

### Ejemplo 2: Chat con contexto

```python
@app.post("/chat")
async def chat(request: ChatRequest):
    """Chat con RAG contextualizado."""
    
    # Buscar documentos relevantes
    context_docs = pipeline.search(request.message, top_k=5)
    
    # Preparar contexto para LLM
    context = "\n\n".join([
        f"[{doc['metadata']['source']}] {doc['content']}"
        for doc in context_docs
    ])
    
    # Usar en cadena RAG...
    response = llm_chain.invoke({
        "message": request.message,
        "contexts": context,
    })
    
    return {
        "answer": response,
        "sources": [doc['metadata']['source'] for doc in context_docs]
    }
```

### Ejemplo 3: Crear chunker custom

```python
from app.core.chunking import BaseChunker
from app.core.loaders.models import Chunk, Document

class JSONChunker(BaseChunker):
    """Chunker especializado para JSON."""
    
    def chunk(self, document: Document) -> list[Chunk]:
        import json
        data = json.loads(document.content)
        chunks = []
        
        for key, value in data.items():
            chunks.append(Chunk(
                document_id=document.id,
                content=f"{key}: {value}",
                metadata={"source": document.source, "key": key}
            ))
        
        return chunks

# Usar:
pipeline = RAGPipeline(chunker=JSONChunker())
```

---

## ⚙️ Configuración

Variables de entorno en `app/core/config.py`:

```python
# Tamaño de chunks
CHUNK_SIZE=500              # Caracteres por chunk
CHUNK_OVERLAP=50            # Superposición entre chunks

# Búsqueda
TOP_K=5                     # Resultados por defecto
SIMILARITY_THRESHOLD=0.0    # Umbral mínimo (0-1)

# ChromaDB
CHROMA_PERSIST_DIR="./storage/chroma"
CHROMA_COLLECTION="documents"

# Ollama
OLLAMA_HOST="http://localhost:11434"
OLLAMA_EMBEDDING_MODEL="qwen3-embedding:latest"
OLLAMA_LLM_MODEL="gemma3:12b"
```

Sobrescribir con variables de entorno:

```bash
export CHUNK_SIZE=1000
export TOP_K=10
python app/main.py
```

---

## 📊 Estructura de Resultados de Búsqueda

Todos los servicios retornan esta estructura:

```python
{
    "id": "chunk-uuid-string",
    "content": "Texto del chunk...",
    "similarity": 0.87,  # Float 0-1 (1=perfecto)
    "metadata": {
        "source": "documento.md",
        "section_index": 2,
        "chunking_strategy": "markdown",
        "document_id": "doc-uuid-string"
    }
}
```

---

## 🚀 Próximos Pasos

1. **Reemplazar knowledge_base.py**

   ```python
   # En main.py o donde usas el RAG:
   from app.core.services import RAGPipeline
   pipeline = RAGPipeline()
   results = pipeline.search(query)
   ```

2. **Migrar datos** (opcional)

   ```python
   # Los embeddings anteriores en JSON se perderán
   # ChromaDB creará nuevos automáticamente
   pipeline.ingest_directory("./data/knowledge")
   ```

3. **Monitoreo** (próximas versiones)
   - Métricas de búsqueda
   - Telemetría de queries
   - Dashboard de administración

---

## 📚 Archivos Nuevos

```
app/
├── core/
│   ├── config.py ← NUEVO: Configuración centralizada
│   ├── chunking/ ← NUEVO: Módulo de estrategias de chunking
│   │   ├── __init__.py
│   │   ├── base_chunker.py
│   │   ├── markdown_chunker.py
│   │   └── generic_chunker.py
│   │
│   └── services/
│       ├── __init__.py ← ACTUALIZADO: Importaciones
│       ├── embedding_service.py ← SIN CAMBIOS
│       ├── vector_store_service.py ← NUEVO: ChromaDB
│       ├── semantic_search_service.py ← NUEVO: Búsqueda
│       └── rag_pipeline.py ← NUEVO: Orquestación
│
├── examples/
│   ├── __init__.py
│   └── pipeline_example.py ← NUEVO: Ejemplo completo
│
├── ARCHITECTURE.md ← NUEVO: Documentación técnica
└── MODULARIZATION_GUIDE.md ← ESTE ARCHIVO
```

---

## ✅ Checklist de Verificación

- [ ] Dependencias instaladas: `pip install -r requirements.txt`
- [ ] ChromaDB descargado: `chromadb==0.4.24`
- [ ] Ollama ejecutándose: `http://localhost:11434`
- [ ] Estructura de directorios correcta
- [ ] Ejemplo ejecutable: `python -m app.examples.pipeline_example`

---

## 🆘 Troubleshooting

### Error: "No module named 'chromadb'"

```bash
pip install chromadb==0.4.24
```

### Error: "ChromaDB cannot connect to storage"

```bash
# Verificar permisos
mkdir -p ./storage/chroma
chmod 755 ./storage/chroma
```

### Error: "Ollama connection refused"

```bash
# Verificar Ollama está corriendo
curl http://localhost:11434/api/tags
```

### Búsquedas muy lentas

```python
# Reducir TOP_K o usar threshold
results = pipeline.search(query, top_k=3, threshold=0.5)
```

---

## 💡 Tips

1. **Para desarrollo:** Usa ChromaDB en memoria (sin persist_dir)
2. **Para producción:** Usa persist_dir para guardar entre sesiones
3. **Múltiples colecciones:** Crea varios RAGPipeline con nombres diferentes
4. **Benchmarking:** Usa `pipeline.get_stats()` para monitorear crecimiento

---

**¿Necesitas ayuda?** Revisa [ARCHITECTURE.md](ARCHITECTURE.md) para detalles técnicos completos.
