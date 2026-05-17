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

export class DocumentLoader {
  private readonly path: string;
  private readonly splitterConfig: SplitterConfig;
  private readonly fileLoaders: FileLoaderMap;

  constructor(
    path: string,
    splitterConfig: SplitterConfig = SPLITTER_CONFIG,
    fileLoaders: FileLoaderMap = DEFAULT_FILE_LOADERS,
  ) {
    this.path = path;
    this.splitterConfig = splitterConfig;
    this.fileLoaders = fileLoaders;
  }

  private buildDirectoryLoader(): DirectoryLoader {
    return new DirectoryLoader(
      this.path,
      this.fileLoaders as Parameters<typeof DirectoryLoader>[1],
    );
  }

  private buildSplitter(): RecursiveCharacterTextSplitter {
    return new RecursiveCharacterTextSplitter({
      chunkSize: this.splitterConfig.chunkSize,
      chunkOverlap: this.splitterConfig.chunkOverlap,
    });
  }

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
