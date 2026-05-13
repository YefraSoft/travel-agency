"""
Pipeline de ejemplo: Flujo completo de RAG.

Este archivo demuestra cómo usar el pipeline modularizado para:
1. Cargar documentos
2. Dividirlos en chunks
3. Generar embeddings
4. Almacenarlos en ChromaDB
5. Realizar búsquedas semánticas

Uso:
    python -m app.examples.pipeline_example
"""

from app.core.chunking import MarkdownChunker
from app.core.config import settings
from app.core.services import RAGPipeline



def main():
    """Ejemplo completo del pipeline RAG."""

    print("🚀 Inicializando pipeline RAG...")
    
    # Crear pipeline con chunker especializado para Markdown
    pipeline = RAGPipeline(
        chunker=MarkdownChunker(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
        ),
    )

    print("\n📂 Ingesting documents from knowledge directory...")
    ingest_result = pipeline.ingest_directory(str(settings.KNOWLEDGE_DIR))
    
    print(f"   ✓ Total files: {ingest_result['total_files']}")
    print(f"   ✓ Total documents: {ingest_result['total_documents']}")
    print(f"   ✓ Total chunks: {ingest_result['total_chunks']}")
    print(f"   ✓ Successful: {ingest_result['successful']}")
    print(f"   ✗ Failed: {ingest_result['failed']}")

    if ingest_result['failed'] > 0:
        print("\n   Failed files:")
        for file_result in ingest_result['files']:
            if file_result['status'] == 'failed':
                print(f"     - {file_result['file']}: {file_result.get('error')}")

    # Mostrar estadísticas
    print("\n📊 Pipeline stats:")
    stats = pipeline.get_stats()
    print(f"   Embedding model: {stats['embedding_model']}")
    print(f"   Chunker: {stats['chunker_type']}")
    print(f"   Vector store: {stats['vector_store']}")

    # Ejemplo de búsqueda
    print("\n🔍 Testing semantic search...")
    queries = [
        "¿Cuáles son las mejores playas?",
        "¿Qué destinos hay en México?",
        "¿Cuáles son las políticas de cancelación?",
    ]

    for query in queries:
        print(f"\n   Query: {query}")
        results = pipeline.search(query, top_k=3)
        for i, result in enumerate(results, 1):
            similarity = result['similarity'] * 100
            print(f"   [{i}] ({similarity:.1f}%) {result['content'][:80]}...")


if __name__ == "__main__":
    main()
