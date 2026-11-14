import { Injectable, OnModuleInit } from '@nestjs/common';
import { TerrainData, CellInfo, ScientificTarget } from './interfaces/index.js';
import {
    LoadRegionUseCase,
    LoadScientificTargetsUseCase,
    BuildScienceBenefitGridUseCase,
    GetCellUseCase,
    WorldToRowColUseCase,
    RowColToWorldUseCase,
} from './use-cases/index.js';

@Injectable()
export class TerrainService implements OnModuleInit {
    private regions = new Map<string, TerrainData>();
    private scientificTargets = new Map<string, ScientificTarget[]>();
    private scienceBenefitGrids = new Map<string, number[]>();

    constructor(
        private readonly loadRegionUseCase: LoadRegionUseCase,
        private readonly loadScientificTargetsUseCase: LoadScientificTargetsUseCase,
        private readonly buildScienceBenefitGridUseCase: BuildScienceBenefitGridUseCase,
        private readonly getCellUseCase: GetCellUseCase,
        private readonly worldToRowColUseCase: WorldToRowColUseCase,
        private readonly rowColToWorldUseCase: RowColToWorldUseCase,
    ) {}

    onModuleInit() {
        this.initRegion('jezero_crater');
    }

    private initRegion(regionName: string) {
        const terrain = this.loadRegionUseCase.execute(regionName);
        this.regions.set(regionName, terrain);

        const targets = this.loadScientificTargetsUseCase.execute(regionName);
        this.scientificTargets.set(regionName, targets);

        const benefitGrid = this.buildScienceBenefitGridUseCase.execute(
            regionName,
            terrain,
            targets,
        );
        this.scienceBenefitGrids.set(regionName, benefitGrid);
    }

    getRegion(regionName: string): TerrainData {
        const data = this.regions.get(regionName);
        if (!data) {
            throw new Error(`Region not found: ${regionName}`);
        }
        return data;
    }

    getScientificTargets(regionName: string): ScientificTarget[] {
        return this.scientificTargets.get(regionName) ?? [];
    }

    getScienceBenefit(regionName: string, row: number, col: number): number {
        const terrain = this.getRegion(regionName);
        const grid = this.scienceBenefitGrids.get(regionName);
        if (!grid) {
            throw new Error(
                `Science benefit grid not built for region: ${regionName}`,
            );
        }
        const index = row * terrain.grid_cols + col;
        return grid[index];
    }

    getCell(regionName: string, row: number, col: number): CellInfo {
        const data = this.getRegion(regionName);
        return this.getCellUseCase.execute(data, row, col);
    }

    worldToRowCol(
        regionName: string,
        x: number,
        y: number,
    ): { row: number; col: number } {
        const data = this.getRegion(regionName);
        return this.worldToRowColUseCase.execute(data, x, y);
    }

    rowColToWorld(
        regionName: string,
        row: number,
        col: number,
    ): { x: number; y: number } {
        const data = this.getRegion(regionName);
        return this.rowColToWorldUseCase.execute(data, row, col);
    }
}
