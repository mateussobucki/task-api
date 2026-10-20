import { Board } from "../boards/board.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

export enum TaskStatus { TODO = 'todo', DOING = 'doing', DONE = 'done' };
export enum Priority { LOW = 'low', MEDIUM = 'medium', HIGH = 'high' };

@Entity()
export class Task{
  @PrimaryGeneratedColumn('uuid') id: string;
  
  @Column() title: string;
  
  @Column({ nullable: true }) description? : string;
  
  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.TODO }) 
  status: TaskStatus;
  
  @Column({ type: 'enum', enum: Priority, default: Priority.MEDIUM }) 
  priority: Priority;
  
  @Column({ type: 'timestamp', nullable: true }) dueDate?: Date;

  @ManyToOne(() => Board, (b) => b.tasks, { onDelete: 'CASCADE' }) 
  board: Board;

  constructor(id: string, title: string, status: TaskStatus, priority: Priority, board: Board){
    this.id = id;
    this.title = title;
    this.status = status;
    this.priority = priority;
    this.board = board;
  }
}