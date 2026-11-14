import { Module } from '@nestjs/common';
import { RouteController } from './route.controller.js';
import { RouteService } from './route.service.js';

@Module({
  controllers: [RouteController],
  providers: [RouteService]
})
export class RouteModule {}
