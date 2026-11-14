import {
    GridPosition,
    AStarResult,
} from './interfaces/index.js';
import { EdgeCostFn } from './types/index.js';

const NEIGHBOR_OFFSETS: Array<{ dr: number; dc: number }> = [
    { dr: -1, dc: 0 },
    { dr: 1, dc: 0 },
    { dr: 0, dc: -1 },
    { dr: 0, dc: 1 },
    { dr: -1, dc: -1 },
    { dr: -1, dc: 1 },
    { dr: 1, dc: -1 },
    { dr: 1, dc: 1 },
];

class MinHeap<T> {
    private items: Array<{ priority: number; value: T }> = [];

    get size(): number {
        return this.items.length;
    }

    push(priority: number, value: T) {
        this.items.push({ priority, value });
        let i = this.items.length - 1;
        while (i > 0) {
            const parent = (i - 1) >> 1;
            if (this.items[parent].priority <= this.items[i].priority) break;
            [this.items[parent], this.items[i]] = [
                this.items[i],
                this.items[parent],
            ];
            i = parent;
        }
    }

    pop(): T | undefined {
        if (this.items.length === 0) return undefined;
        const top = this.items[0];
        const last = this.items.pop()!;
        if (this.items.length > 0) {
            this.items[0] = last;
            let i = 0;
            while (true) {
                const left = 2 * i + 1;
                const right = 2 * i + 2;
                let smallest = i;
                if (
                    left < this.items.length &&
                    this.items[left].priority < this.items[smallest].priority
                )
                    smallest = left;
                if (
                    right < this.items.length &&
                    this.items[right].priority < this.items[smallest].priority
                )
                    smallest = right;
                if (smallest === i) break;
                [this.items[smallest], this.items[i]] = [
                    this.items[i],
                    this.items[smallest],
                ];
                i = smallest;
            }
        }
        return top.value;
    }
}

export function findPath(
    gridRows: number,
    gridCols: number,
    start: GridPosition,
    end: GridPosition,
    edgeCost: EdgeCostFn,
    heuristicWeight: number,
): AStarResult {
    const startTime = performance.now();
    const totalCells = gridRows * gridCols;
    const index = (row: number, col: number) => row * gridCols + col;

    const gScore = new Float64Array(totalCells).fill(Infinity);
    const cameFrom = new Int32Array(totalCells).fill(-1);
    const visited = new Uint8Array(totalCells);

    const startIdx = index(start.row, start.col);
    const endIdx = index(end.row, end.col);

    gScore[startIdx] = 0;

    const heuristic = (row: number, col: number) => {
        if (heuristicWeight <= 0) return 0;
        const dr = row - end.row;
        const dc = col - end.col;
        return heuristicWeight * Math.sqrt(dr * dr + dc * dc);
    };

    const open = new MinHeap<number>();
    open.push(heuristic(start.row, start.col), startIdx);
    let nodesExpanded = 0;

    while (open.size > 0) {
        const currentIdx = open.pop()!;
        if (visited[currentIdx]) continue;
        visited[currentIdx] = 1;
        nodesExpanded++;

        if (currentIdx === endIdx) {
            const executionTimeMs = performance.now() - startTime;
            return {
                found: true,
                path: reconstructPath(cameFrom, endIdx, gridCols),
                totalCost: gScore[endIdx],
                nodesExpanded,
                executionTimeMs,
            };
        }

        const currentRow = Math.floor(currentIdx / gridCols);
        const currentCol = currentIdx % gridCols;

        for (const { dr, dc } of NEIGHBOR_OFFSETS) {
            const neighborRow = currentRow + dr;
            const neighborCol = currentCol + dc;

            if (
                neighborRow < 0 ||
                neighborRow >= gridRows ||
                neighborCol < 0 ||
                neighborCol >= gridCols
            ) {
                continue;
            }

            const neighborIdx = index(neighborRow, neighborCol);
            if (visited[neighborIdx]) continue;

            const stepCost = edgeCost(
                currentRow,
                currentCol,
                neighborRow,
                neighborCol,
            );
            if (!Number.isFinite(stepCost)) continue;

            const tentativeG = gScore[currentIdx] + stepCost;
            if (tentativeG < gScore[neighborIdx]) {
                gScore[neighborIdx] = tentativeG;
                cameFrom[neighborIdx] = currentIdx;
                const f = tentativeG + heuristic(neighborRow, neighborCol);
                open.push(f, neighborIdx);
            }
        }
    }

    const executionTimeMs = performance.now() - startTime;
    return {
        found: false,
        path: [],
        totalCost: Infinity,
        nodesExpanded,
        executionTimeMs,
    };
}

/**
 * Dijkstra Reference Implementation
 * Runs pathfinding on the exact same graph, constraints, and cost function with h(n) = 0.
 * Serves as the ground-truth benchmark to verify A* optimality and admissibility.
 */
export function dijkstraFindPath(
    gridRows: number,
    gridCols: number,
    start: GridPosition,
    end: GridPosition,
    edgeCost: EdgeCostFn,
): AStarResult {
    return findPath(gridRows, gridCols, start, end, edgeCost, 0);
}

function reconstructPath(
    cameFrom: Int32Array,
    endIdx: number,
    gridCols: number,
): GridPosition[] {
    const path: GridPosition[] = [];
    let currentIdx = endIdx;

    while (currentIdx !== -1) {
        path.push({
            row: Math.floor(currentIdx / gridCols),
            col: currentIdx % gridCols,
        });
        currentIdx = cameFrom[currentIdx];
    }

    return path.reverse();
}