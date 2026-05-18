import { DirectoryLoader } from "@langchain/classic/document_loaders/fs/directory";
import { JSONLoader } from "@langchain/classic/document_loaders/fs/json";
import { TextLoader } from "@langchain/classic/document_loaders/fs/text";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import type { Document } from "@langchain/core/documents";
import type { FileLoaderMap, SplitterConfig } from "../../utils/types";
import { SPLITTER_CONFIG } from "../../config/AppConfig";

const DEFAULT_FILE_LOADERS: FileLoaderMap = {
  ".json": (path: string) => new JSONLoader(path, "/json"),
  ".txt": (path: string) => new TextLoader(path),
  ".csv": (path: string) => new CSVLoader(path, "text"),
  ".md": (path: string) => new TextLoader(path),
};

/**
 * DocumentLoader
 *
 * Responsible for:
 * - Loading files from a directory
 * - Parsing multiple file formats into Documents
 * - Splitting documents into smaller chunks for RAG pipelines
 *
 * Built on top of:
 * - DirectoryLoader (file ingestion)
 * - RecursiveCharacterTextSplitter (chunking strategy)
 *
 * Typical usage:
 * - Load knowledge base files
 * - Prepare documents for embeddings
 * - Feed chunks into vector databases (e.g., Chroma)
 */
export class DocumentLoader {
  private readonly path: string;
  private readonly splitterConfig: SplitterConfig;
  private readonly fileLoaders: FileLoaderMap;

  /**
   * Creates a new DocumentLoader instance.
   *
   * @param path - Directory path containing source documents
   * @param splitterConfig - Configuration for text splitting (default: SPLITTER_CONFIG)
   * @param fileLoaders - Custom file loaders (default: DEFAULT_FILE_LOADERS)
   */
  constructor(
    path: string,
    splitterConfig: SplitterConfig = SPLITTER_CONFIG,
    fileLoaders: FileLoaderMap = DEFAULT_FILE_LOADERS,
  ) {
    this.path = path;
    this.splitterConfig = splitterConfig;
    this.fileLoaders = fileLoaders;
  }

  /**
   * Builds a DirectoryLoader instance responsible for reading files
   * from the configured directory using the provided file loaders.
   *
   * @returns DirectoryLoader instance
   */
  private buildDirectoryLoader(): DirectoryLoader {
    return new DirectoryLoader(this.path, this.fileLoaders);
  }

  /**
   * Builds a text splitter used to break documents into chunks.
   *
   * Chunking improves:
   * - embedding quality
   * - retrieval accuracy
   * - context window efficiency
   *
   * @returns RecursiveCharacterTextSplitter instance
   */
  private buildSplitter(): RecursiveCharacterTextSplitter {
    return new RecursiveCharacterTextSplitter({
      chunkSize: this.splitterConfig.chunkSize,
      chunkOverlap: this.splitterConfig.chunkOverlap,
    });
  }

  /**
   * Loads all documents from the configured directory,
   * then splits them into smaller chunks.
   *
   * Workflow:
   * 1. Load raw documents from filesystem
   * 2. Split documents into chunks
   * 3. Log transformation stats
   *
   * @returns Array of processed document chunks
   */
  async load(): Promise<Document[]> {
    const loader = this.buildDirectoryLoader();
    const rawDocs = await loader.load();

    const splitter = this.buildSplitter();
    const splitDocs = await splitter.splitDocuments(rawDocs);

    console.log(
      `Loaded ${rawDocs.length} documents → ${splitDocs.length} chunks from "${this.path}"`,
    );
    return splitDocs;
  }
}
