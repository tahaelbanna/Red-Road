import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerrainModule } from './terrain/terrain.module.js';
import { RouteModule } from './route/route.module.js';
import { MissionModule } from './mission/mission.module.js';
import { AIModule } from './ai/ai.module.js';
import { BioenergeticsModule } from './bioenergetics/bioenergetics.module.js';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true, // Make env variables accessible globally
        }),
        TerrainModule,
        RouteModule,
        MissionModule,
        AIModule,
        BioenergeticsModule,
    ],
})
export class AppModule {}
