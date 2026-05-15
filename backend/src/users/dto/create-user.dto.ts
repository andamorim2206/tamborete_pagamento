import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
    @IsNotEmpty({ message: 'O nome é obrigatório' })
    @IsString({ message: 'O nome deve ser um texto' })
    name!: string;

    @IsNotEmpty({ message: 'O email é obrigatório' })
    @IsEmail({}, { message: 'Email inválido' })
    email!: string;

    @IsNotEmpty({ message: 'A senha é obrigatória' })
    @IsString({ message: 'A senha deve ser um texto' })
    @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
    password!: string;
}
