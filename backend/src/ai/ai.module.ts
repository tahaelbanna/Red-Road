import { Module } from '@nestjs/common';
import { AIController } from './ai.controller.js';
import { CopilotService } from './copilot.service.js';
import { RouteExplanationService } from './explanation.service.js';
import { CommandIntentService } from './command-intent.service.js';
import { MissionModule } from '../mission/mission.module.js';
import { RouteModule } from '../route/route.module.js';
import {
    ParseIntentUseCase,
    CheckDomainGuardUseCase,
    BuildCopilotPromptUseCase,
    NormalizePrioritiesUseCase,
    GeminiApiClientUseCase,
    HandleUserRequestUseCase,
    GenerateExplanationUseCase,
} from './use-cases/index.js';

const USE_CASES = [
    ParseIntentUseCase,
    CheckDomainGuardUseCase,
    BuildCopilotPromptUseCase,
    NormalizePrioritiesUseCase,
    GeminiApiClientUseCase,
    HandleUserRequestUseCase,
    GenerateExplanationUseCase,
];

@Module({
    imports: [MissionModule, RouteModule],
    controllers: [AIController],
    providers: [
        CopilotService,
        RouteExplanationService,
        CommandIntentService,
        ...USE_CASES,
    ],
    exports: [RouteExplanationService],
})
export class AIModule {}
