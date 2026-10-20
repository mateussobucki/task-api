import { PartialType } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateBoardDto{
  @IsString()
  @IsNotEmpty()
  name: string;

  constructor(name: string){
    this.name = name;
  }
}
export class UpdateBoardDto extends PartialType(CreateBoardDto){}