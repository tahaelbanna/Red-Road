import { IntentRule } from '../interfaces/index.js';

export const INTENT_RULES: IntentRule[] = [
    {
        exactMatches: [
            'prioritize safety',
            'make safety the top priority',
            'set priority to safety',
            'i want to prioritize safety',
        ],
        ambiguousMatches: [
            'priptrize safty',
            'will you try safety',
            'highbury tries safety',
            'peru tries safety',
            'priorities safety',
            'prioritize safely',
        ],
        action: 'updateMissionContext',
        payload: {
            priorities: { safety: 1, slope: 0, distance: 0, science: 0 },
        },
        clarificationPrompt:
            'Did you mean to prioritize route safety? (Yes/No)',
    },
    {
        exactMatches: [
            'minimize distance',
            'shortest route',
            'prioritize distance',
            'make distance the top priority',
        ],
        ambiguousMatches: [
            'minimize distant',
            'shortest road',
            'priorities distance',
        ],
        action: 'updateMissionContext',
        payload: {
            priorities: { safety: 0, slope: 0, distance: 1, science: 0 },
        },
        clarificationPrompt:
            'Did you mean to minimize the route distance? (Yes/No)',
    },
    {
        exactMatches: [
            'maximize science',
            'prioritize science',
            'most scientific targets',
        ],
        ambiguousMatches: [
            'prioritize silence',
            'maximize signs',
            'priorities science',
        ],
        action: 'updateMissionContext',
        payload: {
            priorities: { safety: 0, slope: 0, distance: 0, science: 1 },
        },
        clarificationPrompt:
            'Did you mean to prioritize scientific targets? (Yes/No)',
    },
    {
        exactMatches: ['minimize slope', 'flattest route', 'prioritize slope'],
        ambiguousMatches: [
            'minimize slip',
            'flattest road',
            'priorities slope',
        ],
        action: 'updateMissionContext',
        payload: {
            priorities: { safety: 0, slope: 1, distance: 0, science: 0 },
        },
        clarificationPrompt: 'Did you mean to minimize route slope? (Yes/No)',
    },
    {
        exactMatches: [
            'create a route',
            'calculate a route',
            'calculate route',
            'find a route',
            'plan a route',
        ],
        action: 'createRoute',
        payload: {},
    },
    {
        exactMatches: ['yes', 'yeah', 'yep', 'do it'],
        matchMode: 'exact',
        action: 'confirm',
    },
    {
        exactMatches: ['no', 'nope', 'cancel'],
        matchMode: 'exact',
        action: 'cancel',
    },
];
