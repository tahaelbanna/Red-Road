from build_scientific_targets import RAW_TARGETS
import math

for i, t1 in enumerate(RAW_TARGETS):
    for j, t2 in enumerate(RAW_TARGETS):
        if i < j:
            dist = math.hypot(t1['lat'] - t2['lat'], t1['lon'] - t2['lon'])
            if dist < 0.002:
                print(f"VERY CLOSE: {t1['name']} and {t2['name']} (Dist: {dist:.5f} deg)")
