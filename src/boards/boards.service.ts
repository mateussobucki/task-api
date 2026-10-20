import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Board } from "./board.entity";
import { Repository } from "typeorm";
import { CreateBoardDto, UpdateBoardDto } from "./dto/board.dto";

@Injectable()
export class BoardService{
  constructor(@InjectRepository(Board) private repo: Repository<Board>){}

  create(userId: string, dto: CreateBoardDto){
    return this.repo.save(this.repo.create({ ...dto, owner: {id: userId} }));
  }

  findAll(userId: string){
    return this.repo.find({where: {owner: { id: userId }}});
  }
  
  async findOwned(id: string, userId: string){
    const board = await this.repo.findOne({ where: {id}, relations: {owner: true} });
    if(!board){
      throw new NotFoundException("Board not found");
    }
    if(board.owner.id !== userId){
      throw new ForbiddenException();
    }
    return board;
  }

  async update(id: string, userId: string, dto: UpdateBoardDto){
    const board = await this.findOwned(id, userId);
    Object.assign(board, dto);
    return this.repo.save(board);
  }

  async remove(id: string, userId: string){
    const board = await this.findOwned(id, userId);
    await this.repo.remove(board);
  }
}