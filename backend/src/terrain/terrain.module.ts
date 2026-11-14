import { Module } from '@nestjs/common';
import { TerrainController } from './terrain.controller.js';
import { TerrainService } from './terrain.service.js';

@Module({
  controllers: [TerrainController],
  providers: [TerrainService]
})
export class TerrainModule {}
