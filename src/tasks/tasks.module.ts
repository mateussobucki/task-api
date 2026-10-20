import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './task.entity';
import { BoardsModule } from '../boards/boards.module';

@Module({
  imports: [TypeOrmModule.forFeature([Task]), BoardsModule],
  providers: [TasksService],
  controllers: [TasksController]
})
export class TasksModule {}
