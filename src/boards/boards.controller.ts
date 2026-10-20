import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { BoardService } from "./boards.service";
import { ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { CreateBoardDto, UpdateBoardDto } from "./dto/board.dto";

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('boards')
export class BoardController{
  constructor(private board: BoardService){}

  @Post()
  create(@CurrentUser() u: { id: string }, @Body() dto: CreateBoardDto){
    return this.board.create(u.id, dto);
  }

  @Get()
  findAll(@CurrentUser() u: { id: string }){
    return this.board.findAll(u.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() u: { id: string }){
    return this.board.findOwned(id, u.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @CurrentUser() u: { id: string }, @Body() dto: UpdateBoardDto){
    return this.board.update(id, u.id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string, @CurrentUser() u: { id: string }){
    return this.board.remove(id, u.id);
  }
}