import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from "class-validator";
import { Priority, TaskStatus } from "../task.entity";
import { PartialType } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class CreateTaskDto{
  @IsString() @IsNotEmpty() title: string;

  @IsOptional() @IsString() description?: string;

  @IsOptional() @IsEnum(Priority) priority?: Priority;

  @IsOptional() @IsDateString() dueDate?: string;

  constructor(title: string){
    this.title = title;
  }
}

export class UpdateTaskDto extends PartialType(CreateTaskDto){
  @IsOptional() @IsEnum(TaskStatus) status?: TaskStatus
}

export class QueryTasksDto{
  @IsOptional() @IsEnum(TaskStatus) status?: TaskStatus
  @IsOptional() @IsEnum(Priority) priority?: Priority
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)  @Max(100) limit: number = 10;
}