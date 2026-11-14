import { describe, expect, it } from 'vitest';
import { findPath, dijkstraFindPath } from './pathfinding.js';
import { GridPosition } from './interfaces/index.js';
import { EdgeCostFn } from './types/index.js';

describe('Pathfinding & Optimization Engine (A* vs Dijkstra Benchmark)', () => {
    // Helper to calculate Euclidean distance between two grid cells
    const euclideanDist = (p1: GridPosition, p2: GridPosition) =>
        Math.hypot(p1.row - p2.row, p1.col - p2.col);

    // Scenario 1: Small synthetic 5x5 grid with known optimal path
    it('Scenario 1: should find identical optimal path cost on small synthetic 5x5 grid', () => {
        const rows = 5;
        const cols = 5;
        const start = { row: 0, col: 0 };
        const end = { row: 4, col: 4 };

        // Uniform cost 1.0 for cardinal, Math.SQRT2 for diagonal
        const edgeCost: EdgeCostFn = (fr, fc, tr, tc) =>
            fr !== tr && fc !== tc ? Math.SQRT2 : 1.0;
        const heuristicWeight = 1.0; // Admissible since min step cost is 1.0

        const astar = findPath(rows, cols, start, end, edgeCost, heuristicWeight);
        const dijkstra = dijkstraFindPath(rows, cols, start, end, edgeCost);

        expect(astar.found).toBe(true);
        expect(dijkstra.found).toBe(true);
        expect(astar.totalCost).toBeCloseTo(dijkstra.totalCost, 6);
        expect(astar.totalCost).toBeCloseTo(4 * Math.SQRT2, 6);
        expect(astar.nodesExpanded!).toBeLessThanOrEqual(dijkstra.nodesExpanded!);
    });

    // Scenario 2: Flat terrain with diagonal and cardinal movements (15x15)
    it('Scenario 2: should produce identical path cost on flat terrain with diagonal movement', () => {
        const rows = 15;
        const cols = 15;
        const start = { row: 1, col: 1 };
        const end = { row: 12, col: 10 };

        const edgeCost: EdgeCostFn = (fr, fc, tr, tc) =>
            fr !== tr && fc !== tc ? Math.SQRT2 : 1.0;
        const heuristicWeight = 1.0;

        const astar = findPath(rows, cols, start, end, edgeCost, heuristicWeight);
        const dijkstra = dijkstraFindPath(rows, cols, start, end, edgeCost);

        expect(astar.found).toBe(true);
        expect(dijkstra.found).toBe(true);
        expect(astar.totalCost).toBeCloseTo(dijkstra.totalCost, 6);
        // A* should expand significantly fewer nodes than Dijkstra on flat open space
        expect(astar.nodesExpanded!).toBeLessThan(dijkstra.nodesExpanded!);
    });

    // Scenario 3: Terrain with varying slopes (gradient penalty)
    it('Scenario 3: should match Dijkstra cost on terrain with varying slopes', () => {
        const rows = 12;
        const cols = 12;
        const start = { row: 0, col: 0 };
        const end = { row: 11, col: 11 };

        // Slope elevation ramp: elevation = row * 5 + col * 2
        const edgeCost: EdgeCostFn = (fr, fc, tr, tc) => {
            const isDiag = fr !== tr && fc !== tc;
            const dist = isDiag ? Math.SQRT2 : 1.0;
            const slope = Math.abs((tr * 5 + tc * 2) - (fr * 5 + fc * 2));
            return dist + slope * 0.1;
        };
        const minCost = 1.0; // Minimal possible step cost

        const astar = findPath(rows, cols, start, end, edgeCost, minCost);
        const dijkstra = dijkstraFindPath(rows, cols, start, end, edgeCost);

        expect(astar.found).toBe(true);
        expect(dijkstra.found).toBe(true);
        expect(astar.totalCost).toBeCloseTo(dijkstra.totalCost, 6);
        expect(astar.nodesExpanded!).toBeLessThanOrEqual(dijkstra.nodesExpanded!);
    });

    // Scenario 4: Hazardous cells and obstacle wall detour
    it('Scenario 4: should route around impassable obstacle walls identically to Dijkstra', () => {
        const rows = 10;
        const cols = 10;
        const start = { row: 4, col: 1 };
        const end = { row: 4, col: 8 };

        // Vertical wall at col 5 from row 1 to row 7
        const edgeCost: EdgeCostFn = (fr, fc, tr, tc) => {
            if (tc === 5 && tr >= 1 && tr <= 7) {
                return Infinity; // Impassable wall
            }
            return fr !== tr && fc !== tc ? Math.SQRT2 : 1.0;
        };

        const astar = findPath(rows, cols, start, end, edgeCost, 1.0);
        const dijkstra = dijkstraFindPath(rows, cols, start, end, edgeCost);

        expect(astar.found).toBe(true);
        expect(dijkstra.found).toBe(true);
        expect(astar.totalCost).toBeCloseTo(dijkstra.totalCost, 6);
        // Ensure path avoided the wall
        for (const p of astar.path) {
            expect(p.col === 5 && p.row >= 1 && p.row <= 7).toBe(false);
        }
    });

    // Scenario 5: Multiple scientific targets attracting the path
    it('Scenario 5: should find optimal path with Gaussian scientific target discounts', () => {
        const rows = 20;
        const cols = 20;
        const start = { row: 2, col: 2 };
        const end = { row: 18, col: 18 };

        // Two science targets at (10, 5) and (8, 12)
        const targets = [
            { r: 10, c: 5, val: 0.9 },
            { r: 8, c: 12, val: 0.8 },
        ];
        const maxBenefit = 1.7; // Max possible benefit sum
        const scienceWeight = 0.5;
        const maxDiscount = 1 + scienceWeight * maxBenefit * 20;

        const edgeCost: EdgeCostFn = (fr, fc, tr, tc) => {
            const isDiag = fr !== tr && fc !== tc;
            const dist = isDiag ? Math.SQRT2 : 1.0;
            let benefit = 0;
            for (const t of targets) {
                const d2 = (tr - t.r) ** 2 + (tc - t.c) ** 2;
                benefit += t.val * Math.exp(-d2 / 18);
            }
            const discount = 1 + scienceWeight * benefit * 20;
            return dist / discount;
        };

        // Admissible lower bound
        const heuristicWeight = 1.0 / maxDiscount;

        const astar = findPath(rows, cols, start, end, edgeCost, heuristicWeight);
        const dijkstra = dijkstraFindPath(rows, cols, start, end, edgeCost);

        expect(astar.found).toBe(true);
        expect(dijkstra.found).toBe(true);
        expect(astar.totalCost).toBeCloseTo(dijkstra.totalCost, 6);
        expect(astar.nodesExpanded!).toBeLessThanOrEqual(dijkstra.nodesExpanded!);
    });

    // Scenario 6: Different priority weight configurations (Distance, Safety, Science)
    it('Scenario 6: should preserve A* optimality across varied priority combinations', () => {
        const rows = 10;
        const cols = 10;
        const start = { row: 0, col: 0 };
        const end = { row: 9, col: 9 };

        const testPriorities = [
            { distance: 0.8, safety: 0.1, slope: 0.1, science: 0.0 }, // Distance dominant
            { distance: 0.1, safety: 0.7, slope: 0.2, science: 0.0 }, // Safety dominant
            { distance: 0.2, safety: 0.2, slope: 0.1, science: 0.5 }, // Science dominant
        ];

        for (const pri of testPriorities) {
            const maxScienceDiscount = 1 + pri.science * 2.0 * 20;
            const minPossibleCost = Math.max(pri.distance, 0.01) / maxScienceDiscount;

            const edgeCost: EdgeCostFn = (fr, fc, tr, tc) => {
                const isDiag = fr !== tr && fc !== tc;
                const distCost = isDiag ? Math.SQRT2 : 1.0;
                const hazard = (tr % 3 === 0) ? 0.4 : 0.1;
                const slope = Math.min((tr + tc) / 20, 1.0);
                const science = (tr === 5 && tc === 5) ? 1.0 : 0.0;

                const base = Math.max(pri.distance, 0.01) * distCost + pri.safety * hazard + pri.slope * slope;
                const discount = 1 + pri.science * science * 20;
                return base / discount;
            };

            const astar = findPath(rows, cols, start, end, edgeCost, minPossibleCost);
            const dijkstra = dijkstraFindPath(rows, cols, start, end, edgeCost);

            expect(astar.found).toBe(true);
            expect(dijkstra.found).toBe(true);
            expect(astar.totalCost).toBeCloseTo(dijkstra.totalCost, 5);
        }
    });

    // Scenario 7: Diagonal movement restrictions & step cost proportionality
    it('Scenario 7: should respect diagonal movement step cost proportionality', () => {
        const rows = 4;
        const cols = 4;
        const start = { row: 0, col: 0 };
        const end = { row: 3, col: 3 };

        const edgeCost: EdgeCostFn = (fr, fc, tr, tc) =>
            fr !== tr && fc !== tc ? Math.SQRT2 : 1.0;

        const astar = findPath(rows, cols, start, end, edgeCost, 1.0);
        expect(astar.found).toBe(true);
        expect(astar.path.length).toBe(4); // (0,0), (1,1), (2,2), (3,3)
        expect(astar.totalCost).toBeCloseTo(3 * Math.SQRT2, 6);
    });

    // Scenario 8: Unreachable destination (fully boxed in by impassable cells)
    it('Scenario 8: should correctly return found=false when destination is unreachable', () => {
        const rows = 8;
        const cols = 8;
        const start = { row: 1, col: 1 };
        const end = { row: 6, col: 6 };

        // Box around destination (6,6)
        const edgeCost: EdgeCostFn = (_fr, _fc, tr, tc) => {
            if (tr >= 5 && tr <= 7 && tc >= 5 && tc <= 7 && (tr !== 6 || tc !== 6)) {
                return Infinity; // Boxed in
            }
            return 1.0;
        };

        const astar = findPath(rows, cols, start, end, edgeCost, 1.0);
        const dijkstra = dijkstraFindPath(rows, cols, start, end, edgeCost);

        expect(astar.found).toBe(false);
        expect(dijkstra.found).toBe(false);
        expect(astar.path).toEqual([]);
        expect(dijkstra.path).toEqual([]);
        expect(astar.totalCost).toBe(Infinity);
        expect(dijkstra.totalCost).toBe(Infinity);
    });

    // Scenario 9: Start and destination edge cases (same cell, adjacent cells)
    it('Scenario 9: should handle identical start/destination and adjacent cells', () => {
        const rows = 5;
        const cols = 5;
        const start = { row: 2, col: 2 };

        const edgeCost: EdgeCostFn = () => 1.0;

        // Same cell
        const sameResult = findPath(rows, cols, start, start, edgeCost, 1.0);
        expect(sameResult.found).toBe(true);
        expect(sameResult.path).toEqual([start]);
        expect(sameResult.totalCost).toBe(0);

        // Adjacent cell (cardinal)
        const adj = { row: 2, col: 3 };
        const adjResult = findPath(rows, cols, start, adj, edgeCost, 1.0);
        expect(adjResult.found).toBe(true);
        expect(adjResult.path).toEqual([start, adj]);
        expect(adjResult.totalCost).toBeCloseTo(1.0, 6);
    });
});
