import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { AuthRepository } from './auth.repository';
import { UsersRepository } from '../users/users.repository';
export declare class AuthService {
    private readonly authRepository;
    private readonly usersRepository;
    private readonly jwtService;
    constructor(authRepository: AuthRepository, usersRepository: UsersRepository, jwtService: JwtService);
    login(loginDto: LoginDto): Promise<LoginResponseDto>;
    validateToken(token: string): Promise<any>;
    logout(userId: string): Promise<void>;
}
