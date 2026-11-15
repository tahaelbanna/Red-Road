import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
    @Get()
    root() {
        return {
            status: 'ok',
            service: 'RED ROAD API',
            timestamp: new Date().toISOString(),
        };
    }

    @Get('health')
    health() {
        return {
            status: 'ok',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
        };
    }
}
