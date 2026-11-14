import { Body, Controller, Get, Post, BadRequestException } from '@nestjs/common';
import { BioenergeticsService } from './bioenergetics.service.js';
import type { CalculateBioenergeticsDto, EvaAssessmentDto } from './dto/index.js';
import type { AstronautProfile } from './interfaces/astronaut-profile.interface.js';
import type { RouteBioenergeticsSummary } from './interfaces/route-bioenergetics.interface.js';
import type { EvaFeasibilityResult } from './interfaces/eva-feasibility.interface.js';

@Controller('api/bioenergetics')
export class BioenergeticsController {
    constructor(private readonly bioenergeticsService: BioenergeticsService) {}

    @Get('profile/default')
    getDefaultProfile(): AstronautProfile {
        return this.bioenergeticsService.getDefaultProfile();
    }

    @Post('calculate')
    calculateRouteBioenergetics(
        @Body() dto: CalculateBioenergeticsDto,
    ): RouteBioenergeticsSummary {
        if (!dto || !Array.isArray(dto.path) || dto.path.length === 0) {
            throw new BadRequestException('A valid non-empty route path array is required.');
        }

        const region = dto.region || 'jezero_crater';
        const stationaryTimeHours = Math.max(0, dto.stationaryTimeHours ?? 0);

        return this.bioenergeticsService.calculateRoute(
            region,
            dto.path,
            dto.profile,
            dto.reverse ?? false,
            stationaryTimeHours,
        );
    }

    @Post('eva-assessment')
    assessEvaFeasibility(
        @Body() dto: EvaAssessmentDto,
    ): EvaFeasibilityResult {
        if (!dto || !Array.isArray(dto.path) || dto.path.length === 0) {
            throw new BadRequestException('A valid non-empty route path array is required for EVA assessment.');
        }

        const region = dto.region || 'jezero_crater';
        const stationaryTimeHours = Math.max(0, dto.stationaryTimeHours ?? 0);

        return this.bioenergeticsService.evaluateEvaFeasibility(
            region,
            dto.path,
            dto.profile,
            stationaryTimeHours,
        );
    }
}
