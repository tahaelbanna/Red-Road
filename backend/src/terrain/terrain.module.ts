import { Module } from '@nestjs/common';
import { TerrainService } from './terrain.service.js';
import { TerrainController } from './terrain.controller.js';
import {
    LoadRegionUseCase,
    LoadScientificTargetsUseCase,
    BuildScienceBenefitGridUseCase,
    GetCellUseCase,
    WorldToRowColUseCase,
    RowColToWorldUseCase,
} from './use-cases/index.js';

const USE_CASES = [
    LoadRegionUseCase,
    LoadScientificTargetsUseCase,
    BuildScienceBenefitGridUseCase,
    GetCellUseCase,
    WorldToRowColUseCase,
    RowColToWorldUseCase,
];

@Module({
    controllers: [TerrainController],
    providers: [TerrainService, ...USE_CASES],
    exports: [TerrainService],
})
export class TerrainModule {}
