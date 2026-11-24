from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

root = Path("dist").resolve()

class Assets(HTMLParser):
    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key not in {"href", "src", "srcset"} or not value:
                continue
            for item in value.split(",") if key == "srcset" else [value]:
                url = urlsplit(item.strip().split()[0])
                if url.scheme or url.netloc or not url.path:
                    continue
                path = (root / url.path.lstrip("/")).resolve()
                if not path.is_relative_to(root) or not path.is_file():
                    raise ValueError(f"Missing asset {value}")

html = (root / "index.html").read_text()
if "<title>SatWalk" not in html or "bitcoin" in html.replace('href="https://bitcoinwalk.org/app"', '').replace('href="https://bitcoinwalk.org/admin"', '').replace('href="https://bitcoinwalk.org/start"', '').lower():
    raise ValueError("Unexpected homepage branding")
Assets().feed(html)
