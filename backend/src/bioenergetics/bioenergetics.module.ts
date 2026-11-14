import { Module } from '@nestjs/common';
import { TerrainModule } from '../terrain/terrain.module.js';
import { BioenergeticsController } from './bioenergetics.controller.js';
import { BioenergeticsService } from './bioenergetics.service.js';
import {
    CalculateEdgeBioenergeticsUseCase,
    CalculateRouteBioenergeticsUseCase,
    EvaluateSafeReturnUseCase,
    EvaluateEvaFeasibilityUseCase,
} from './use-cases/index.js';

const USE_CASES = [
    CalculateEdgeBioenergeticsUseCase,
    CalculateRouteBioenergeticsUseCase,
    EvaluateSafeReturnUseCase,
    EvaluateEvaFeasibilityUseCase,
];

@Module({
    imports: [TerrainModule],
    controllers: [BioenergeticsController],
    providers: [BioenergeticsService, ...USE_CASES],
    exports: [BioenergeticsService],
})
export class BioenergeticsModule {}
