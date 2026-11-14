import { Injectable, Optional } from '@nestjs/common';
import { IntentResult } from './interfaces/index.js';
import { ParseIntentUseCase } from './use-cases/index.js';

export type { IntentResult } from './interfaces/index.js';

@Injectable()
export class CommandIntentService {
    private readonly parseIntentUseCase: ParseIntentUseCase;

    constructor(@Optional() parseIntentUseCase?: ParseIntentUseCase) {
        this.parseIntentUseCase =
            parseIntentUseCase ?? new ParseIntentUseCase();
    }

    public parseIntent(input: string): IntentResult {
        return this.parseIntentUseCase.execute(input);
    }
}
