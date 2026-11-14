export interface ScientificTarget {
    id: string;
    name: string;
    category?: 'point' | 'region';
    lat: number;
    lon: number;
    x: number;
    y: number;
    row: number;
    col: number;
    in_bounds: boolean;
    type: string;
    science_value: number;
    position_accuracy: 'published' | 'approximate';
    source: string;
}