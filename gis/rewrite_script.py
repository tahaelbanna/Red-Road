import re

with open('build_scientific_targets.py', 'r') as f:
    content = f.read()

regions = [
    "belva-crater", "neretva-vallis", "seitah", "delta-front",
    "kodiak", "enchanted-lake", "hogwallow-flats", "yori-pass",
    "ouzel-falls", "snowdrift-peak", "mandu-wall", "bunsen-peak",
    "margin-unit", "wallace-butte", "fall-river-pass", "omo-valley",
    "jezero-crater"
]

def replacer(match):
    id_val = match.group(2)
    cat = "region" if id_val in regions else "point"
    return match.group(1) + f'        "category": "{cat}",\n'

new_content = re.sub(r'(\s*"id": "([^"]+)",\s*.*?\n)(\s*"source":)', replacer, content, flags=re.DOTALL)

def replacer_id(match):
    id_val = match.group(1)
    cat = "region" if id_val in regions else "point"
    return f'"id": "{id_val}",\n        "category": "{cat}",'

new_content = re.sub(r'"id":\s*"([^"]+)",', replacer_id, content)

with open('build_scientific_targets.py', 'w') as f:
    f.write(new_content)

print("Rewritten.")
