export const COPILOT_TOOLS = [
    {
        functionDeclarations: [
            {
                name: 'updateMissionContext',
                description:
                    'Updates the UI state for mission configuration such as route priorities (safety, slope, distance, science) or oxygen budget. Return ONLY the fields that should be changed.',
                parameters: {
                    type: 'object',
                    properties: {
                        priorities: {
                            type: 'object',
                            properties: {
                                safety: { type: 'number' },
                                slope: { type: 'number' },
                                distance: { type: 'number' },
                                science: { type: 'number' },
                            },
                        },
                        oxygenConfig: {
                            type: 'object',
                            properties: {
                                supplyKg: { type: 'number' },
                                reserveFraction: { type: 'number' },
                                consumptionRateKgPerHour: { type: 'number' },
                            },
                        },
                        traversalConfig: {
                            type: 'object',
                            properties: {
                                baseSpeedKmh: { type: 'number' },
                                stationaryTimeHours: { type: 'number' },
                            },
                        },
                    },
                },
            },
        ],
    },
];
