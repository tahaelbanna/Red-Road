export interface Priorities {
    safety: number; // weight on hazard (0-1)
    slope: number; // weight on slope difficulty (0-1)
    distance: number; // weight on raw distance (0-1)
    science: number; // weight on nearby scientific targets (0-1)
}