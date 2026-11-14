import json

with open('../backend/data/terrain/scientific_targets_jezero_crater.json', 'r') as f:
    data = json.load(f)

targets = data["targets"]

ids = set()
names = set()

for t in targets:
    if t["id"] in ids: print(f"Duplicate ID: {t['id']}")
    ids.add(t["id"])
    
    if t["name"] in names: print(f"Duplicate Name: {t['name']}")
    names.add(t["name"])
    
    if t["category"] not in ["point", "region"]: print(f"Invalid category: {t['category']} for {t['name']}")
    if t["position_accuracy"] not in ["published", "approximate"]: print(f"Invalid accuracy: {t['position_accuracy']} for {t['name']}")
    if not t["in_bounds"]: print(f"Out of bounds: {t['name']}")

print(f"Validation complete. Checked {len(targets)} targets.")

