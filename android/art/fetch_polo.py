"""
Downloads the source model for the welcome screen's polo into a local cache.

"Polo Shirt" by Giovani Franca, BlenderKit asset 712334fb-5efe-41e6-bd62-94266e9ec445 (free,
royalty-free licence). The licence covers using renders of it in the app, not redistributing the
model, so it lives in art/.cache (gitignored) and only the rendered frames are committed.

    python art/fetch_polo.py art/.cache
"""
import json
import os
import sys
import urllib.request
import uuid

ASSET = "712334fb-5efe-41e6-bd62-94266e9ec445"
API = "https://www.blenderkit.com/api/v1"


def get_json(url):
    with urllib.request.urlopen(url) as r:
        return json.load(r)


def main():
    out_dir = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), ".cache")
    os.makedirs(out_dir, exist_ok=True)
    target = os.path.join(out_dir, "polo_src.blend")
    if os.path.exists(target):
        print(f"already there: {target}")
        return

    asset = get_json(f"{API}/assets/{ASSET}/")
    print(f"{asset['name']} by {asset['author']['fullName']} ({asset['license']})")
    blend = next(f for f in asset["files"] if f["fileType"] == "blend")
    # Free assets resolve to a signed download link without an account.
    link = get_json(f"{blend['downloadUrl']}?scene_uuid={uuid.uuid4()}")["filePath"]
    print("downloading ~100 MB ...")
    urllib.request.urlretrieve(link, target)
    print(f"saved {target}")


if __name__ == "__main__":
    main()
