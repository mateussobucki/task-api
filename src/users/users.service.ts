import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./user.entity";
import { Repository } from "typeorm";

@Injectable()
export class UserService{
  constructor(@InjectRepository(User) private userRepo: Repository<User>) { }

  findByEmail(email: string) {
    return this.userRepo.findOne({where: {email}});
  }

  create(data: Partial<User>){
    return this.userRepo.save(this.userRepo.create(data));
  }
}