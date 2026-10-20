import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './task.entity';
import { BoardService } from '../boards/boards.service';
import { CreateTaskDto, QueryTasksDto, UpdateTaskDto } from './dto/task.dto';

@Injectable()
export class TasksService {
  constructor(@InjectRepository(Task) 
    private repo: Repository<Task>,
    private boards: BoardService
  ){}

  async create(boardId: string, userId: string, dto: CreateTaskDto){
    const board = await this.boards.findOwned(boardId, userId);
    return this.repo.save({...dto, board});
  }

  async list(boardId: string, userId: string, q: QueryTasksDto){
    await this.boards.findOwned(boardId, userId);
    const [items, total] = await this.repo.findAndCount({
      where: {
        board: {id: boardId},
        // TypeORM v1 rejects undefined values in where clauses, so only add filters that were provided
        ...(q.status !== undefined && { status: q.status }),
        ...(q.priority !== undefined && { priority: q.priority }),
      },
      order: { dueDate: 'ASC' },
      skip: (q.page - 1) * q.limit,
      take: q.limit,
    })

    return { items, total, page: q.page, limit: q.limit };
  }

  private async findOwnedTask(id: string, userId: string){
    const task = await this.repo.findOne({where: {id}, relations: {board: {owner: true}}});
    if(!task){
      throw new NotFoundException("Task not found");
    }
    if(task.board.owner.id !== userId){
      throw new ForbiddenException();
    }
    return task;
  }

  async update(id: string, userId: string, dto: UpdateTaskDto){
    const task = await this.findOwnedTask(id, userId);
    Object.assign(task, dto);
    return this.repo.save(task);
  }

  async remove(id: string, userId: string){
    const task = await this.findOwnedTask(id, userId);
    return this.repo.remove(task);
  }
}
