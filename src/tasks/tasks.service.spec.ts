import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { BoardService } from '../boards/boards.service';
import { Priority, Task, TaskStatus } from './task.entity';
import { TasksService } from './tasks.service';
import { CreateTaskDto, QueryTasksDto, UpdateTaskDto } from './dto/task.dto';

type AsyncMock = jest.Mock<(...args: any[]) => Promise<any>>;

describe('TasksService', () => {
  let service: TasksService;

  const repo: {
    findOne: AsyncMock;
    findAndCount: AsyncMock;
    save: AsyncMock;
    remove: AsyncMock;
  } = {
    findOne: jest.fn<(...args: any[]) => Promise<any>>(),
    findAndCount: jest.fn<(...args: any[]) => Promise<any>>(),
    save: jest.fn<(...args: any[]) => Promise<any>>(),
    remove: jest.fn<(...args: any[]) => Promise<any>>(),
  };

  const boards: { findOwned: AsyncMock } = {
    findOwned: jest.fn<(...args: any[]) => Promise<any>>(),
  };

  const userId = 'me';
  const board = { id: 'b1', owner: { id: userId } };
  const ownedTask = () => ({
    id: 't1',
    title: 'Task 1',
    status: TaskStatus.TODO,
    priority: Priority.MEDIUM,
    board,
  });

  beforeEach(async () => {
    jest.resetAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task), useValue: repo },
        { provide: BoardService, useValue: boards },
      ],
    }).compile();

    service = module.get(TasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('saves a task linked to the owned board', async () => {
      const dto = new CreateTaskDto('New task');
      dto.priority = Priority.HIGH;
      boards.findOwned.mockResolvedValue(board);
      repo.save.mockImplementation(async (t) => ({ id: 't1', ...t }));

      const result = await service.create('b1', userId, dto);

      expect(boards.findOwned).toHaveBeenCalledWith('b1', userId);
      expect(repo.save).toHaveBeenCalledWith({ ...dto, board });
      expect(result).toEqual({ id: 't1', ...dto, board });
    });

    it('propagates ForbiddenException when board is not owned', async () => {
      boards.findOwned.mockRejectedValue(new ForbiddenException());

      await expect(
        service.create('b1', userId, new CreateTaskDto('x')),
      ).rejects.toThrow(ForbiddenException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('propagates NotFoundException when board does not exist', async () => {
      boards.findOwned.mockRejectedValue(new NotFoundException());

      await expect(
        service.create('b1', userId, new CreateTaskDto('x')),
      ).rejects.toThrow(NotFoundException);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('returns paginated tasks with filters', async () => {
      const q = new QueryTasksDto();
      q.page = 2;
      q.limit = 5;
      q.status = TaskStatus.DOING;
      q.priority = Priority.LOW;
      const items = [ownedTask()];
      boards.findOwned.mockResolvedValue(board);
      repo.findAndCount.mockResolvedValue([items, 6]);

      const result = await service.list('b1', userId, q);

      expect(boards.findOwned).toHaveBeenCalledWith('b1', userId);
      expect(repo.findAndCount).toHaveBeenCalledWith({
        where: {
          board: { id: 'b1' },
          status: TaskStatus.DOING,
          priority: Priority.LOW,
        },
        order: { dueDate: 'ASC' },
        skip: 5,
        take: 5,
      });
      expect(result).toEqual({ items, total: 6, page: 2, limit: 5 });
    });

    it('uses default pagination and omits unset filters', async () => {
      boards.findOwned.mockResolvedValue(board);
      repo.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.list('b1', userId, new QueryTasksDto());

      expect(repo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { board: { id: 'b1' } }, skip: 0, take: 10 }),
      );
      expect(result).toEqual({ items: [], total: 0, page: 1, limit: 10 });
    });

    it('does not query tasks when board is not owned', async () => {
      boards.findOwned.mockRejectedValue(new ForbiddenException());

      await expect(
        service.list('b1', userId, new QueryTasksDto()),
      ).rejects.toThrow(ForbiddenException);
      expect(repo.findAndCount).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('merges dto into the task and saves it', async () => {
      const dto: UpdateTaskDto = { title: 'Updated', status: TaskStatus.DONE };
      repo.findOne.mockResolvedValue(ownedTask());
      repo.save.mockImplementation(async (t) => t);

      const result = await service.update('t1', userId, dto);

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 't1' },
        relations: { board: { owner: true } },
      });
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 't1', title: 'Updated', status: TaskStatus.DONE }),
      );
      expect(result).toMatchObject({ title: 'Updated', status: TaskStatus.DONE });
    });

    it('throws NotFoundException when task does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.update('t1', userId, {})).rejects.toThrow(NotFoundException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when task belongs to another user', async () => {
      repo.findOne.mockResolvedValue({ id: 't1', board: { owner: { id: 'another' } } });

      await expect(service.update('t1', userId, {})).rejects.toThrow(ForbiddenException);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('removes an owned task', async () => {
      const task = ownedTask();
      repo.findOne.mockResolvedValue(task);
      repo.remove.mockResolvedValue(task);

      const result = await service.remove('t1', userId);

      expect(repo.remove).toHaveBeenCalledWith(task);
      expect(result).toBe(task);
    });

    it('throws NotFoundException when task does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.remove('t1', userId)).rejects.toThrow(NotFoundException);
      expect(repo.remove).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when task belongs to another user', async () => {
      repo.findOne.mockResolvedValue({ id: 't1', board: { owner: { id: 'another' } } });

      await expect(service.remove('t1', userId)).rejects.toThrow(ForbiddenException);
      expect(repo.remove).not.toHaveBeenCalled();
    });
  });
});
