import { Controller, Post, Body } from '@nestjs/common';
import { CopilotService } from './copilot.service.js';
import type { CopilotRequest, CopilotResponse } from './interfaces/index.js';

@Controller('api/ai')
export class AIController {
    constructor(private readonly copilotService: CopilotService) {}

    @Post('copilot')
    async handleCopilot(@Body() req: CopilotRequest): Promise<CopilotResponse> {
        return this.copilotService.handleUserRequest(req.message, req.context);
    }
}
