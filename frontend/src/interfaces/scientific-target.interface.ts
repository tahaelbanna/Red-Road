export interface ScientificTarget {
  id: string;
  name: string;
  row: number;
  col: number;
  type: string;
  category?: string;
  science_value: number;
  position_accuracy: string;
  source: string;
}
