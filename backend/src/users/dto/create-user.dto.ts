import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, Matches, IsOptional, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '../enums/user-role.enum';

export class CreateUserDto {
    @IsNotEmpty({ message: 'O nome é obrigatório' })
    @IsString({ message: 'O nome deve ser um texto' })
    @MinLength(3, { message: 'O nome deve ter no mínimo 3 caracteres' })
    @MaxLength(100, { message: 'O nome deve ter no máximo 100 caracteres' })
    @Matches(/^[a-zA-ZÀ-ÿ\s]+$/, { message: 'O nome deve conter apenas letras' })
    @Transform(({ value }) => value?.trim())
    name!: string;

    @IsNotEmpty({ message: 'O email é obrigatório' })
    @IsEmail({}, { message: 'Email inválido' })
    @MaxLength(255, { message: 'O email deve ter no máximo 255 caracteres' })
    @Transform(({ value }) => value?.toLowerCase().trim())
    email!: string;

    @IsNotEmpty({ message: 'A senha é obrigatória' })
    @IsString({ message: 'A senha deve ser um texto' })
    @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres' })
    @MaxLength(100, { message: 'A senha deve ter no máximo 100 caracteres' })
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/,
        { message: 'A senha deve conter ao menos: 1 letra maiúscula, 1 minúscula, 1 número e 1 caractere especial (@$!%*?&#)' }
    )
    password!: string;

    @IsOptional()
    @IsEnum(UserRole, { message: 'O tipo de usuário deve ser ADMIN ou USER' })
    role?: UserRole;
}
