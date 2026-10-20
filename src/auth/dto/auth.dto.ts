import { IsEmail, IsString, IsStrongPassword } from 'class-validator'

export class RegisterDto{
  @IsString() name: string;

  @IsEmail() email: string;

  @IsStrongPassword() password: string;

  constructor(name: string, email: string, password: string){
    this.name = name;
    this.email = email;
    this.password = password;
  }
}

export class LoginDto{
  @IsEmail() email: string;
  @IsString() password: string;

  constructor(email: string, password: string){
    this.email = email;
    this.password = password;
  }
}