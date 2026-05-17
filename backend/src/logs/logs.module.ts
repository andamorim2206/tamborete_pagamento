import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogsController } from './logs.controller';
import { LogsService } from './logs.service';
import { LogsRepository } from './logs.repository';
import { Log } from './entities/log.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Log])],
    controllers: [LogsController],
    providers: [LogsService, LogsRepository],
    exports: [LogsService],
})
export class LogsModule { }
