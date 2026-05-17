import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersRepository } from './users.repository';
import { LogsService } from '../logs/logs.service';
export declare class UsersService {
    private readonly usersRepository;
    private readonly logsService;
    constructor(usersRepository: UsersRepository, logsService: LogsService);
    create(createUserDto: CreateUserDto): Promise<UserResponseDto>;
    findAll(): Promise<UserResponseDto[]>;
    findById(id: string): Promise<UserResponseDto>;
}
