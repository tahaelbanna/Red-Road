import { Injectable } from '@nestjs/common';
import { IntentResult } from '../interfaces/index.js';
import { INTENT_RULES } from '../constants/index.js';

@Injectable()
export class ParseIntentUseCase {
    execute(input: string): IntentResult {
        const normalized = input
            .toLowerCase()
            .replace(/[.,!?;:']/g, '')
            .trim();

        for (const rule of INTENT_RULES) {
            const isExactMatch =
                rule.matchMode === 'exact'
                    ? rule.exactMatches.includes(normalized)
                    : rule.exactMatches.some(
                          (m) => normalized === m || normalized.includes(m),
                      );

            if (isExactMatch) {
                return {
                    matched: true,
                    confident: true,
                    action: rule.action,
                    ...(rule.payload !== undefined
                        ? { payload: structuredClone(rule.payload) }
                        : {}),
                };
            }

            if (rule.ambiguousMatches?.some((m) => normalized.includes(m))) {
                return {
                    matched: true,
                    confident: false,
                    clarificationPrompt: rule.clarificationPrompt,
                };
            }
        }

        return { matched: false, confident: false };
    }
}
