import { Injectable, Logger } from '@nestjs/common';
import { CopilotResponse, IntentResult } from '../interfaces/index.js';
import { COPILOT_TOOLS } from '../constants/index.js';
import { CheckDomainGuardUseCase } from './check-domain-guard.use-case.js';
import { BuildCopilotPromptUseCase } from './build-copilot-prompt.use-case.js';
import { GeminiApiClientUseCase } from './gemini-api-client.use-case.js';
import { NormalizePrioritiesUseCase } from './normalize-priorities.use-case.js';

@Injectable()
export class HandleUserRequestUseCase {
    private readonly logger = new Logger(HandleUserRequestUseCase.name);

    constructor(
        private readonly checkDomainGuardUseCase: CheckDomainGuardUseCase,
        private readonly buildCopilotPromptUseCase: BuildCopilotPromptUseCase,
        private readonly geminiApiClientUseCase: GeminiApiClientUseCase,
        private readonly normalizePrioritiesUseCase: NormalizePrioritiesUseCase,
    ) {}

    async execute(params: {
        input: string;
        context: any;
        apiKey: string | null;
        model: string;
        parseIntent: (input: string) => IntentResult;
    }): Promise<CopilotResponse> {
        const { input, context, apiKey, model, parseIntent } = params;

        if (!apiKey) {
            return {
                text: 'The AI Copilot is not configured. To enable this feature, create a `.env` file in the `backend/` directory with the following content:\n\n`GEMINI_API_KEY=your-gemini-api-key-here`\n\nThen restart the backend server.',
                fallback: true,
            };
        }

        try {
            // Step 1: Check deterministic local intents
            const intent = parseIntent(input);
            const localResponse = this.resolveLocalIntent(intent, context);
            if (localResponse) {
                return localResponse;
            }

            // Step 2: Check out-of-domain guard
            const guard = this.checkDomainGuardUseCase.execute(input);
            if (guard.blocked) {
                return { text: guard.message! };
            }

            // Step 3: Build prompt & call Gemini API
            const systemPrompt =
                this.buildCopilotPromptUseCase.execute(context);
            const data = await this.geminiApiClientUseCase.generateContent({
                apiKey,
                model,
                systemPrompt,
                input,
                tools: COPILOT_TOOLS,
            });

            // Step 4: Parse & normalize response
            return this.formatGeminiResponse(data);
        } catch (error: any) {
            this.logger.error(`Copilot error: ${error.message}`);
            return {
                text: `Sorry, I encountered an error communicating with the AI service: ${error.message}`,
                error: true,
            };
        }
    }

    private resolveLocalIntent(
        intent: IntentResult,
        context: any,
    ): CopilotResponse | null {
        if (!intent.matched) return null;

        if (!intent.confident && intent.clarificationPrompt) {
            return {
                text: intent.clarificationPrompt,
                fallback: true,
            };
        }

        if (intent.action === 'updateMissionContext' && intent.payload) {
            return {
                text: 'I have updated the mission context based on your clear instruction.',
                updates: intent.payload,
            };
        }

        if (intent.action === 'createRoute') {
            if (
                !context.route ||
                context.route.status === 'No route currently selected'
            ) {
                return {
                    text: 'Please select both a start and destination point on the map first to calculate a route.',
                    action: 'missingEndpoints',
                };
            }
            return {
                text: 'Calculating your route now...',
                action: 'createRoute',
            };
        }

        return null;
    }

    private formatGeminiResponse(data: any): CopilotResponse {
        const candidate = data.candidates?.[0];
        const parts = candidate?.content?.parts || [];

        const updates: any = {};
        let responseText = '';

        for (const part of parts) {
            if (part.text) {
                responseText += part.text;
            }
            if (
                part.functionCall &&
                part.functionCall.name === 'updateMissionContext'
            ) {
                Object.assign(updates, part.functionCall.args);
            }
        }

        if (updates.priorities) {
            this.normalizePrioritiesUseCase.execute(updates.priorities);
        }

        const hasUpdates = Object.keys(updates).length > 0;
        let finalResponseText = responseText.trim();

        if (!finalResponseText) {
            finalResponseText = hasUpdates
                ? 'I have updated the mission configuration as requested.'
                : "I couldn't identify a valid mission update from your request. Could you clarify?";
        }

        return {
            text: finalResponseText,
            updates: hasUpdates ? updates : undefined,
        };
    }
}
