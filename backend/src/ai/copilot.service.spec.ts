import { describe, expect, it } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { CopilotService } from './copilot.service.js';
import { CommandIntentService } from './command-intent.service.js';
import { MissionService } from '../mission/mission.service.js';
import { RouteService } from '../route/route.service.js';

describe('CopilotService & Gemini Model Configuration', () => {
    const mockIntentService = {
        parseIntent: (text: string) => {
            if (text === 'prioritize safety') {
                return {
                    matched: true,
                    confident: true,
                    action: 'updateMissionContext',
                    payload: {
                        priorities: {
                            safety: 1,
                            slope: 0,
                            distance: 0,
                            science: 0,
                        },
                    },
                };
            }
            return { matched: false };
        },
    } as unknown as CommandIntentService;

    const mockMissionService = {} as unknown as MissionService;
    const mockRouteService = {} as unknown as RouteService;

    it('should default to official "gemini-3.5-flash-lite" model when env is unset', () => {
        const mockConfig = {
            get: (key: string) => (key === 'GEMINI_MODEL' ? null : null),
        } as unknown as ConfigService;

        const service = new CopilotService(
            mockConfig,
            mockIntentService,
            mockMissionService,
            mockRouteService,
        );

        expect((service as any).model).toBe('gemini-3.5-flash-lite');
    });

    it('should allow overriding GEMINI_MODEL via ConfigService', () => {
        const mockConfig = {
            get: (key: string) =>
                key === 'GEMINI_MODEL' ? 'gemini-1.5-flash' : null,
        } as unknown as ConfigService;

        const service = new CopilotService(
            mockConfig,
            mockIntentService,
            mockMissionService,
            mockRouteService,
        );

        expect((service as any).model).toBe('gemini-1.5-flash');
    });

    it('should return a friendly configuration prompt when API key is missing', async () => {
        const mockConfig = {
            get: () => null,
        } as unknown as ConfigService;

        const service = new CopilotService(
            mockConfig,
            mockIntentService,
            mockMissionService,
            mockRouteService,
        );

        const response = await service.handleUserRequest(
            'What is the terrain like?',
            {},
        );
        expect(response.fallback).toBe(true);
        expect(response.text).toContain('The AI Copilot is not configured');
        expect(response.text).toContain('GEMINI_API_KEY');
    });

    it('should execute local intent deterministically without API key', async () => {
        // When an API key is provided, local intent intercepts before calling Gemini:
        const mockConfigWithKey = {
            get: (key: string) => (key === 'GEMINI_API_KEY' ? 'test-key' : null),
        } as unknown as ConfigService;

        const serviceWithKey = new CopilotService(
            mockConfigWithKey,
            mockIntentService,
            mockMissionService,
            mockRouteService,
        );

        const response = await serviceWithKey.handleUserRequest(
            'prioritize safety',
            {},
        );
        expect(response.updates).toBeDefined();
        expect(response.updates.priorities).toEqual({
            safety: 1,
            slope: 0,
            distance: 0,
            science: 0,
        });
    });
});
