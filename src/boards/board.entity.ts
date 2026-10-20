import { User } from "../users/user.entity";
import { Task } from "../tasks/task.entity";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Board{
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column() name: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' }) 
  owner: User;

  @OneToMany(() => Task, (t) => t.board) 
  tasks: Task[]

  constructor(id: string, name: string, owner: User, tasks: Task[]){
    this.id = id;
    this.name = name;
    this.owner = owner;
    this.tasks = tasks;
  }
}