import { Controller, Get, Param } from '@nestjs/common';
import { TerrainService } from './terrain.service.js';
import { ScientificTarget } from './interfaces/index.js';

@Controller('terrain')
export class TerrainController {
    constructor(private readonly terrainService: TerrainService) {}

    @Get(':region/targets')
    getTargets(@Param('region') region: string): ScientificTarget[] {
        return this.terrainService.getScientificTargets(region);
    }
}
