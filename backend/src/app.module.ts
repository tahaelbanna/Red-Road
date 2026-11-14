import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { TerrainModule } from './terrain/terrain.module.js';
import { RouteModule } from './route/route.module.js';
import { MissionModule } from './mission/mission.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Make env variables accessible globally
    }),
    TerrainModule,
    RouteModule,
    MissionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
