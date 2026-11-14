import json
import math

MARS_RADIUS_M = 3396190.0
STANDARD_PARALLEL_DEG = 18.4663

TERRAIN_FILE = "/home/tahaelbanna/Nasa Space Apps/backend/data/terrain/terrain_jezero_crater.json"
OUTPUT_FILE = "/home/tahaelbanna/Nasa Space Apps/backend/data/terrain/scientific_targets_jezero_crater.json"

RAW_TARGETS = [
    {
        "id": "landing-site",
        "category": "point",
        "name": "Octavia E. Butler Landing",
        "lat": 18.4447,
        "lon": 77.4508,
        "type": "Landing site",
        "science_value": 0.3,
        "position_accuracy": "published",
        "source": "NASA/JPL-Caltech, Perseverance landing coordinates, 18 Feb 2021",
    },
    {
        "id": "three-forks",
        "category": "point",
        "name": "Three Forks Sample Depot",
        "lat": 18.4391,
        "lon": 77.4494,
        "type": "Sample cache (10 tubes)",
        "science_value": 0.9,
        "position_accuracy": "published",
        "source": "NASA/JPL-Caltech, witness-tube coordinates, Dec 2022 - Jan 2023",
    },
    {
        "id": "belva-crater",
        "category": "region",
        "name": "Belva Crater",
        "lat": 18.48,
        "lon": 77.38,
        "type": "Impact crater, exposed subsurface layers",
        "science_value": 0.70,
        "position_accuracy": "published",
        "source": "USGS Planetary Names",
    },
    {
        "id": "neretva-vallis",
        "category": "region",
        "name": "Neretva Vallis",
        "lat": 18.55,
        "lon": 77.20,
        "type": "Ancient river channel",
        "science_value": 0.90,
        "position_accuracy": "published",
        "source": "USGS Planetary Names",
    },
    {
        "id": "seitah",
        "category": "region",
        "name": "Séítah",
        "lat": 18.452,
        "lon": 77.443,
        "type": "Ancient bedrock ridge, olivine-rich",
        "science_value": 0.75,
        "position_accuracy": "approximate",
        "source": "NASA Perseverance Traverse Map",
    },
    {
        "id": "delta-front",
        "category": "region",
        "name": "Jezero delta front",
        "lat": 18.465,
        "lon": 77.455,
        "type": "Fluvial delta deposit, candidate for past habitability",
        "science_value": 0.95,
        "position_accuracy": "approximate",
        "source": "Placed by eye on the CTX/HiRISE mosaic",
    },
    {
        "id": "wildcat-ridge",
        "category": "point",
        "name": "Wildcat Ridge",
        "lat": 18.466,
        "lon": 77.456,
        "type": "Delta sedimentary rock (mudstone/sandstone)",
        "science_value": 0.80,
        "position_accuracy": "approximate",
        "source": "NASA Perseverance Traverse Map (Delta Front region)",
    },
    {
        "id": "skinner-ridge",
        "category": "point",
        "name": "Skinner Ridge",
        "lat": 18.466,
        "lon": 77.455,
        "type": "Delta sedimentary rock",
        "science_value": 0.85,
        "position_accuracy": "approximate",
        "source": "NASA Perseverance Traverse Map (Delta Front region)",
    },
    {
        "id": "bright-angel",
        "category": "point",
        "name": "Bright Angel",
        "lat": 18.472,
        "lon": 77.440,
        "type": "Light-toned rock outcrop (Cheyava Falls site)",
        "science_value": 0.95,
        "position_accuracy": "approximate",
        "source": "NASA Perseverance Traverse Map (Neretva Vallis margin)",
    },
    {
        "id": "dox-castle",
        "category": "point",
        "name": "Dox Castle",
        "lat": 18.482,
        "lon": 77.365,
        "type": "Crater rim geological site",
        "science_value": 0.80,
        "position_accuracy": "approximate",
        "source": "NASA Perseverance Traverse Map (Crater Rim Campaign)",
    },
    {
        "id": "pico-turquino",
        "category": "point",
        "name": "Pico Turquino",
        "lat": 18.485,
        "lon": 77.355,
        "type": "Crater rim ridge, quartz-rich fractures",
        "science_value": 0.90,
        "position_accuracy": "approximate",
        "source": "NASA Perseverance Traverse Map (Crater Rim Campaign)",
    },
    {
        "id": "witch-hazel-hill",
        "category": "point",
        "name": "Witch Hazel Hill",
        "lat": 18.488,
        "lon": 77.350,
        "type": "Ancient layered bedrock slope",
        "science_value": 0.90,
        "position_accuracy": "approximate",
        "source": "NASA Perseverance Traverse Map (Crater Rim Campaign)",
    },
    {
        "id": "broom-point",
        "category": "point",
        "name": "Broom Point",
        "lat": 18.487,
        "lon": 77.352,
        "type": "Ancient impact breccia bedrock",
        "science_value": 0.85,
        "position_accuracy": "approximate",
        "source": "NASA Perseverance Traverse Map (Crater Rim Campaign)",
    },
    {
        "id": "rochette",
        "category": "point",
        "name": "Rochette",
        "lat": 18.435,
        "lon": 77.436,
        "type": "First successful rock core (Montdenier & Montagnac)",
        "science_value": 0.90,
        "position_accuracy": "approximate",
        "source": "NASA Perseverance Traverse Map; representative coordinate estimated from mapped location"
    },
    {
        "id": "roubion",
        "category": "point",
        "name": "Roubion",
        "lat": 18.441,
        "lon": 77.447,
        "type": "First sample attempt (crumbled rock)",
        "science_value": 0.75,
        "position_accuracy": "approximate",
        "source": "NASA Perseverance Traverse Map; representative coordinate estimated from mapped location"
    },
    {
        "id": "brac",
        "category": "point",
        "name": "Brac",
        "lat": 18.443,
        "lon": 77.443,
        "type": "Séítah formation sample site (Salette & Coulettes)",
        "science_value": 0.85,
        "position_accuracy": "approximate",
        "source": "NASA Perseverance Traverse Map; representative coordinate estimated from mapped location"
    },
    {
        "id": "issole",
        "category": "point",
        "name": "Issole",
        "lat": 18.448,
        "lon": 77.438,
        "type": "Séítah formation sample site (Robine & Haas)",
        "science_value": 0.85,
        "position_accuracy": "approximate",
        "source": "NASA Perseverance Traverse Map; representative coordinate estimated from mapped location"
    },
    {
        "id": "sid",
        "category": "point",
        "name": "Sid",
        "lat": 18.455,
        "lon": 77.452,
        "type": "Crater Floor Fracture sample site (Chétien)",
        "science_value": 0.80,
        "position_accuracy": "approximate",
        "source": "NASA Perseverance Traverse Map; representative coordinate estimated from mapped location"
    },
    {
        "id": "kodiak",
        "category": "region",
        "name": "Kodiak Mesa",
        "lat": 18.411,
        "lon": 77.426,
        "type": "Delta remnant mesa",
        "science_value": 0.95,
        "position_accuracy": "approximate",
        "source": "NASA Perseverance Traverse Map; representative coordinate estimated from mapped location"
    },
    {
        "id": "enchanted-lake",
        "category": "region",
        "name": "Enchanted Lake",
        "lat": 18.468,
        "lon": 77.452,
        "type": "Delta front outcrops",
        "science_value": 0.85,
        "position_accuracy": "approximate",
        "source": "NASA Perseverance Traverse Map; representative coordinate estimated from mapped location"
    },
    {
        "id": "hogwallow-flats",
        "category": "region",
        "name": "Hogwallow Flats",
        "lat": 18.464,
        "lon": 77.456,
        "type": "Fine-grained rocks",
        "science_value": 0.90,
        "position_accuracy": "approximate",
        "source": "NASA Perseverance Traverse Map; representative coordinate estimated from mapped location"
    },
    {
        "id": "yori-pass",
        "category": "region",
        "name": "Yori Pass",
        "lat": 18.467,
        "lon": 77.450,
        "type": "Sandstone sample location",
        "science_value": 0.85,
        "position_accuracy": "approximate",
        "source": "NASA Perseverance Traverse Map; representative coordinate estimated from mapped location"
    },
    {
        "id": "amalik",
        "category": "point",
        "name": "Amalik",
        "lat": 18.465,
        "lon": 77.453,
        "type": "Delta front sample",
        "science_value": 0.80,
        "position_accuracy": "approximate",
        "source": "NASA Perseverance Traverse Map; representative coordinate estimated from mapped location"
    },
    {
        "id": "ouzel-falls",
        "category": "region",
        "name": "Ouzel Falls",
        "lat": 18.472,
        "lon": 77.445,
        "type": "Delta top geological site",
        "science_value": 0.85,
        "position_accuracy": "approximate",
        "source": "NASA Perseverance Traverse Map; representative coordinate estimated from mapped location"
    },
    {
        "id": "snowdrift-peak",
        "category": "region",
        "name": "Snowdrift Peak",
        "lat": 18.470,
        "lon": 77.440,
        "type": "Delta top geological site",
        "science_value": 0.85,
        "position_accuracy": "approximate",
        "source": "NASA Perseverance Traverse Map; representative coordinate estimated from mapped location"
    },
    {
        "id": "mandu-wall",
        "category": "region",
        "name": "Mandu Wall",
        "lat": 18.468,
        "lon": 77.447,
        "type": "Delta front/top edge",
        "science_value": 0.80,
        "position_accuracy": "approximate",
        "source": "NASA Perseverance Traverse Map; representative coordinate estimated from mapped location"
    },
    {
        "id": "bunsen-peak",
        "category": "region",
        "name": "Bunsen Peak",
        "lat": 18.480,
        "lon": 77.430,
        "type": "Margin unit",
        "science_value": 0.90,
        "position_accuracy": "approximate",
        "source": "NASA Perseverance Traverse Map; representative coordinate estimated from mapped location"
    },
    {
        "id": "margin-unit",
        "category": "region",
        "name": "Margin Unit Outcrop",
        "lat": 18.490,
        "lon": 77.410,
        "type": "Carbonate-rich margin unit",
        "science_value": 0.95,
        "position_accuracy": "approximate",
        "source": "NASA Perseverance Traverse Map; representative coordinate estimated from mapped location"
    },
    {
        "id": "wallace-butte",
        "category": "region",
        "name": "Wallace Butte",
        "lat": 18.485,
        "lon": 77.400,
        "type": "Crater rim climb site",
        "science_value": 0.85,
        "position_accuracy": "approximate",
        "source": "NASA Perseverance Traverse Map; representative coordinate estimated from mapped location"
    },
    {
        "id": "fall-river-pass",
        "category": "region",
        "name": "Fall River Pass",
        "lat": 18.495,
        "lon": 77.395,
        "type": "Crater rim geological site",
        "science_value": 0.80,
        "position_accuracy": "approximate",
        "source": "NASA Perseverance Traverse Map; representative coordinate estimated from mapped location"
    },
    {
        "id": "washburn",
        "category": "point",
        "name": "Washburn",
        "lat": 18.462,
        "lon": 77.440,
        "type": "Unique light-toned rock",
        "science_value": 0.95,
        "position_accuracy": "approximate",
        "source": "NASA Perseverance Traverse Map; representative coordinate estimated from mapped location"
    },
    {
        "id": "omo-valley",
        "category": "region",
        "name": "Omo Valley",
        "lat": 18.470,
        "lon": 77.455,
        "type": "Delta region",
        "science_value": 0.80,
        "position_accuracy": "approximate",
        "source": "NASA Perseverance Traverse Map; representative coordinate estimated from mapped location"
    },
    {
        "id": "melyn",
        "category": "point",
        "name": "Melyn",
        "lat": 18.475,
        "lon": 77.448,
        "type": "Delta top sample site",
        "science_value": 0.85,
        "position_accuracy": "approximate",
        "source": "NASA Perseverance Traverse Map; representative coordinate estimated from mapped location"
    },
    {
        "id": "otis-peak",
        "category": "point",
        "name": "Otis Peak",
        "lat": 18.472,
        "lon": 77.442,
        "type": "Delta top sample site",
        "science_value": 0.85,
        "position_accuracy": "approximate",
        "source": "NASA Perseverance Traverse Map; representative coordinate estimated from mapped location"
    },
    {
        "id": "lefroy-bay",
        "category": "point",
        "name": "Lefroy Bay",
        "lat": 18.478,
        "lon": 77.444,
        "type": "Delta top sample site",
        "science_value": 0.85,
        "position_accuracy": "approximate",
        "source": "NASA Perseverance Traverse Map; representative coordinate estimated from mapped location"
    },
    {
        "id": "pelican-point",
        "category": "point",
        "name": "Pelican Point",
        "lat": 18.476,
        "lon": 77.445,
        "type": "Delta top sample site",
        "science_value": 0.85,
        "position_accuracy": "approximate",
        "source": "NASA Perseverance Traverse Map; representative coordinate estimated from mapped location"
    },
    {
        "id": "jezero-crater",
        "category": "region",
        "name": "Jezero Crater Center",
        "lat": 18.38,
        "lon": 77.58,
        "type": "Impact crater center",
        "science_value": 0.40,
        "position_accuracy": "published",
        "source": "USGS Planetary Names"
    }
]


def latlon_to_xy(lat_deg: float, lon_deg: float) -> tuple[float, float]:
    """Equirectangular projection matching the terrain DEM's CRS.

    x = R * lon(rad) * cos(standard_parallel)
    y = R * lat(rad)
    (central_meridian = 0, false_easting/northing = 0, per the DEM's CRS)
    """
    lat_rad = math.radians(lat_deg)
    lon_rad = math.radians(lon_deg)
    std_parallel_rad = math.radians(STANDARD_PARALLEL_DEG)

    x = MARS_RADIUS_M * lon_rad * math.cos(std_parallel_rad)
    y = MARS_RADIUS_M * lat_rad
    return x, y


def main():
    with open(TERRAIN_FILE) as f:
        terrain = json.load(f)

    origin_x = terrain["origin_x"]
    origin_y = terrain["origin_y"]
    cell_size = terrain["cell_size_meters"]
    grid_rows = terrain["grid_rows"]
    grid_cols = terrain["grid_cols"]

    targets = []
    for raw in RAW_TARGETS:
        x, y = latlon_to_xy(raw["lat"], raw["lon"])

        col = round((x - origin_x) / cell_size)
        row = round((origin_y - y) / cell_size)

        in_bounds = 0 <= row < grid_rows and 0 <= col < grid_cols

        targets.append({
            "id": raw["id"],
            "name": raw["name"],
            "lat": raw["lat"],
            "lon": raw["lon"],
            "x": round(x, 1),
            "y": round(y, 1),
            "row": row,
            "col": col,
            "in_bounds": in_bounds,
            "type": raw["type"],
            "category": raw.get("category", "point"),
            "science_value": raw["science_value"],
            "position_accuracy": raw["position_accuracy"],
            "source": raw["source"],
        })

    output = {
        "region": terrain["region"],
        "targets": targets,
    }

    with open(OUTPUT_FILE, "w") as f:
        json.dump(output, f, indent=2)

    print(f"Wrote {len(targets)} targets to {OUTPUT_FILE}")
    for t in targets:
        status = "OK" if t["in_bounds"] else "OUT OF BOUNDS"
        print(f"  {t['id']:16s} row={t['row']:4d} col={t['col']:4d}  [{status}]  ({t['position_accuracy']})")


if __name__ == "__main__":
    main()
