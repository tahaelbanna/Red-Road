import { Injectable } from '@nestjs/common';
import {
    OBVIOUS_OUTLIERS_REGEX,
    MARS_CONTEXT_KEYWORDS,
    OUT_OF_DOMAIN_MESSAGE,
} from '../constants/index.js';

@Injectable()
export class CheckDomainGuardUseCase {
    execute(input: string): { blocked: boolean; message?: string } {
        const textLower = input.toLowerCase();
        const isMarsContext = MARS_CONTEXT_KEYWORDS.some((kw) =>
            textLower.includes(kw),
        );

        if (OBVIOUS_OUTLIERS_REGEX.test(input) && !isMarsContext) {
            return {
                blocked: true,
                message: OUT_OF_DOMAIN_MESSAGE,
            };
        }

        return { blocked: false };
    }
}
