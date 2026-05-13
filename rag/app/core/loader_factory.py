from pathlib import Path

from .loaders.base_loader import BaseLoader
from .loaders.json_loader import JsonLoader
from .loaders.md_loader import MdLoader
# from loaders.pdf_loader import PdfLoader
from .loaders.txt_loader import TxtLoader


class LoaderFactory:

    @staticmethod
    def get_loader(path: str) -> BaseLoader:
        extension = Path(path).suffix.lower()
        loaders: dict[str, BaseLoader] = {
            ".txt": TxtLoader(),
            # ".pdf": PdfLoader(),
            ".md": MdLoader(),
            ".json": JsonLoader(),
        }
        loader = loaders.get(extension)
        if loader is None:
            raise ValueError(f"Unsupported file type: {extension}")
        return loader
