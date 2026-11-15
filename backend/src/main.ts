import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.enableCors({
        origin: ['http://localhost:5173', process.env.FRONTEND_URL].filter(
            Boolean,
        ),
    });

    const port = process.env.PORT ?? 3000;
    await app.listen(port, '0.0.0.0');
}

void bootstrap();
