import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    const allowedOrigins = [
        'http://localhost:5173',
        'https://red-road.vercel.app',
    ];

    app.enableCors({
        origin: (
            origin: string | undefined,
            callback: (error: Error | null, allow?: boolean) => void,
        ) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
                return;
            }

            console.warn(`[CORS] Blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        },
    });

    const port = process.env.PORT ?? 3000;
    await app.listen(port, '0.0.0.0');
}

void bootstrap();
