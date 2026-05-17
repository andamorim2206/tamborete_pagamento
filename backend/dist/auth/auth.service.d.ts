import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { AuthRepository } from './auth.repository';
import { UsersRepository } from '../users/users.repository';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { LogsService } from '../logs/logs.service';
export declare class AuthService {
    private readonly authRepository;
    private readonly usersRepository;
    private readonly jwtService;
    private readonly logsService;
    constructor(authRepository: AuthRepository, usersRepository: UsersRepository, jwtService: JwtService, logsService: LogsService);
    login(loginDto: LoginDto): Promise<LoginResponseDto>;
    validateToken(token: string): Promise<any>;
    logout(userId: string): Promise<void>;
    getMe(userId: string): Promise<UserResponseDto>;
}
