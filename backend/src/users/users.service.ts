import {
    Injectable,
    ConflictException,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
    constructor(private readonly usersRepository: UsersRepository) { }

    async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
        // Verificar se o email já existe
        const existingUser = await this.usersRepository.findByEmail(
            createUserDto.email,
        );

        if (existingUser) {
            throw new ConflictException('Email já cadastrado');
        }

        // Criptografar a senha
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

        // Criar o usuário
        const user = await this.usersRepository.create({
            name: createUserDto.name,
            email: createUserDto.email,
            password: hashedPassword,
        });

        // Retornar sem a senha
        return UserResponseDto.fromEntity(user);
    }

    async findAll(): Promise<UserResponseDto[]> {
        const users = await this.usersRepository.findAll();
        return users.map((user) => UserResponseDto.fromEntity(user));
    }

    async findById(id: string): Promise<UserResponseDto> {
        const user = await this.usersRepository.findById(id);

        if (!user) {
            throw new NotFoundException('Usuário não encontrado');
        }

        return UserResponseDto.fromEntity(user);
    }
}
