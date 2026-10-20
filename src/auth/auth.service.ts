import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { UserService } from "../users/users.service";
import { LoginDto, RegisterDto } from "./dto/auth.dto";
import * as bcrypt from 'bcrypt';
import { User } from "../users/user.entity";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class AuthService{
  constructor(private users: UserService, private jwt: JwtService){}

  async register(dto: RegisterDto){
    if (await this.users.findByEmail(dto.email)){
      throw new ConflictException("Email already in use");
    }

    const password = await bcrypt.hash(dto.password, 10);
    const user = await this.users.create({...dto, password});
    return this.sign(user);
  }

  async login(dto: LoginDto){
    const user = await this.users.findByEmail(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.password))){
      throw new UnauthorizedException("Invalid Credentials");
    }
    return this.sign(user);
  }

  private sign(user: User){
    return {accessToken: this.jwt.sign({ sub: user.id, email: user.email })};
  }
}