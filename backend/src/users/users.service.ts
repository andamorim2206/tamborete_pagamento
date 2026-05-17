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
import { UserRole } from './enums/user-role.enum';
import { LogsService } from '../logs/logs.service';

@Injectable()
export class UsersService {
    constructor(
        private readonly usersRepository: UsersRepository,
        private readonly logsService: LogsService,
    ) { }

    async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
        try {
            const existingUser = await this.usersRepository.findByEmail(
                createUserDto.email,
            );

            if (existingUser) {
                throw new ConflictException('Email já cadastrado');
            }

            const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

            const user = await this.usersRepository.create({
                name: createUserDto.name,
                email: createUserDto.email,
                password: hashedPassword,
                balance: 1000.00,
                role: createUserDto.role || UserRole.USER,
            });

            // Log de criação de usuário
            await this.logsService.logUserCreated(user.id!, 201, `Usuário ${user.name} criado com sucesso`);

            return UserResponseDto.fromEntity(user);
        } catch (error) {
            // Log de erro com stack trace
            await this.logsService.logErrorWithStack(
                error,
                'UsersService.create',
                undefined,
                { email: createUserDto.email, name: createUserDto.name }
            );
            throw error;
        }
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
