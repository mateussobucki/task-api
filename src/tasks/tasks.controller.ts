import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TasksService } from './tasks.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateTaskDto, QueryTasksDto, UpdateTaskDto } from './dto/task.dto';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class TasksController {
  constructor(private service: TasksService){}

  @Post('boards/:boardId/tasks')
  create(@Param('boardId') boardId: string, @CurrentUser() u: {id: string}, @Body() dto: CreateTaskDto){
    return this.service.create(boardId, u.id, dto);
  }

  @Get('boards/:boardId/tasks')
  list(@Param('boardId') boardId: string, @CurrentUser() u: {id: string}, @Query() q: QueryTasksDto){
    return this.service.list(boardId, u.id, q);
  }

  @Patch('tasks/:id')
  update(@Param('id') id: string, @CurrentUser() u: {id: string}, @Body() dto: UpdateTaskDto){
    return this.service.update(id, u.id, dto);
  }

  @Delete('tasks/:id')
  @HttpCode(204)
  remove(@Param('id') id: string, @CurrentUser() u: {id: string}){
    return this.service.remove(id, u.id);
  }
}
