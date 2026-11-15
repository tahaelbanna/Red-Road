import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://red-road.vercel.app',
        ...(process.env.FRONTEND_URL
            ? [process.env.FRONTEND_URL.trim().replace(/\/+$/, '')]
            : []),
    ];

    const vercelPreviewRegex =
        /^https:\/\/red-road[a-zA-Z0-9-_]*\.vercel\.app$/;

    app.enableCors({
        origin: (
            origin: string | undefined,
            callback: (error: Error | null, allow?: boolean) => void,
        ) => {
            // Allow curl, server-to-server, or local tools without an Origin header
            if (!origin) {
                callback(null, true);
                return;
            }

            const normalized = origin.trim().replace(/\/+$/, '');
            if (
                allowedOrigins.includes(normalized) ||
                vercelPreviewRegex.test(normalized)
            ) {
                callback(null, true);
                return;
            }

            console.warn(`[CORS] Disallowed origin: ${origin}`);
            callback(null, false);
        },
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'Accept',
            'Origin',
            'X-Requested-With',
        ],
        credentials: true,
    });

    const port = Number(process.env.PORT) || 3000;
    await app.listen(port, '0.0.0.0');
    console.log(`[RED ROAD API] Primary server running on http://0.0.0.0:${port}`);

    // If Railway or host assigned a dynamic port other than 3000,
    // also listen on 3000 as a fallback in case Railway domain target port is pinned to 3000.
    if (port !== 3000) {
        try {
            const http = await import('http');
            const secondary = http.createServer((req, res) => {
                app.getHttpAdapter().getInstance()(req, res);
            });
            secondary.listen(3000, '0.0.0.0', () => {
                console.log(
                    '[RED ROAD API] Secondary fallback listener active on http://0.0.0.0:3000',
                );
            });
        } catch (e: any) {
            console.warn(
                `[RED ROAD API] Could not bind secondary fallback port 3000: ${e.message}`,
            );
        }
    }
}

void bootstrap();
