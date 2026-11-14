import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MissionService } from '../mission/mission.service.js';
import { RouteService } from '../route/route.service.js';
import { CommandIntentService } from './command-intent.service.js';
import { CopilotResponse } from './interfaces/index.js';
import {
    HandleUserRequestUseCase,
    CheckDomainGuardUseCase,
    BuildCopilotPromptUseCase,
    GeminiApiClientUseCase,
    NormalizePrioritiesUseCase,
} from './use-cases/index.js';

@Injectable()
export class CopilotService {
    private readonly logger = new Logger(CopilotService.name);
    private readonly apiKey: string | null = null;
    private readonly model: string;
    private readonly handleUserRequestUseCase: HandleUserRequestUseCase;

    constructor(
        private readonly configService: ConfigService,
        private readonly commandIntentService: CommandIntentService,
        private readonly missionService: MissionService,
        private readonly routeService: RouteService,
        @Optional() handleUserRequestUseCase?: HandleUserRequestUseCase,
    ) {
        this.apiKey =
            this.configService.get<string>('GEMINI_API_KEY') ||
            process.env.GEMINI_API_KEY ||
            null;
        this.model =
            this.configService.get<string>('GEMINI_MODEL') ||
            process.env.GEMINI_MODEL ||
            'gemini-3.5-flash-lite';

        this.handleUserRequestUseCase =
            handleUserRequestUseCase ??
            new HandleUserRequestUseCase(
                new CheckDomainGuardUseCase(),
                new BuildCopilotPromptUseCase(),
                new GeminiApiClientUseCase(),
                new NormalizePrioritiesUseCase(),
            );

        if (this.apiKey) {
            this.logger.log(
                `Gemini Copilot initialized with model ${this.model}`,
            );
        } else {
            this.logger.warn(
                'GEMINI_API_KEY not found. Copilot will operate in fallback mode.',
            );
        }
    }

    async handleUserRequest(
        input: string,
        context: any,
    ): Promise<CopilotResponse> {
        return this.handleUserRequestUseCase.execute({
            input,
            context,
            apiKey: this.apiKey,
            model: this.model,
            parseIntent: (text) => this.commandIntentService.parseIntent(text),
        });
    }
}
