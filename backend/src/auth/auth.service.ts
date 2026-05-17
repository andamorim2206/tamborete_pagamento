import {
    Injectable,
    UnauthorizedException,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { AuthRepository } from './auth.repository';
import { UsersRepository } from '../users/users.repository';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { LogsService } from '../logs/logs.service';
import { LogType } from '../logs/enums/log-type.enum';

@Injectable()
export class AuthService {
    constructor(
        private readonly authRepository: AuthRepository,
        private readonly usersRepository: UsersRepository,
        private readonly jwtService: JwtService,
        private readonly logsService: LogsService,
    ) { }

    async login(loginDto: LoginDto): Promise<LoginResponseDto> {
        try {
            const user = await this.usersRepository.findByEmail(loginDto.email);

            if (!user) {
                throw new UnauthorizedException('Email ou senha incorretos');
            }

            const isPasswordValid = await bcrypt.compare(
                loginDto.password,
                user.password!,
            );

            if (!isPasswordValid) {
                throw new UnauthorizedException('Email ou senha incorretos');
            }

            await this.authRepository.deactivateAllUserTokens(user.id!);

            const payload = {
                sub: user.id!,
                email: user.email!,
                name: user.name!,
                role: user.role || 'USER',
            };

            const expiresIn = 86400; // 24 horas em segundos
            const token = this.jwtService.sign(payload, {
                expiresIn: `${expiresIn}s`,
            });

            const expiresAt = new Date();
            expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

            await this.authRepository.createToken(user.id!, token, expiresAt);

            await this.logsService.logUserLogin(user.id!, 200, user.email!);

            return new LoginResponseDto(token, expiresIn, {
                id: user.id!,
                name: user.name!,
                email: user.email!,
            });
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                await this.logsService.createLog({
                    typeLog: LogType.ERROR,
                    statusCode: 401,
                    message: `Tentativa de login falhou: ${loginDto.email}`,
                    metadata: { email: loginDto.email, error: error.message },
                });
            } else {
                await this.logsService.logErrorWithStack(
                    error,
                    'AuthService.login',
                    undefined,
                    { email: loginDto.email }
                );
            }
            throw error;
        }
    }

    async validateToken(token: string): Promise<any> {
        try {
            const payload = this.jwtService.verify(token);

            const userToken = await this.authRepository.findByToken(token);

            if (!userToken || !userToken.active) {
                throw new UnauthorizedException('Token inválido ou expirado');
            }

            if (new Date() > userToken.expiresAt) {
                await this.authRepository.deactivateToken(userToken.id);
                throw new UnauthorizedException('Token expirado');
            }

            return payload;
        } catch (error) {
            throw new UnauthorizedException('Token inválido');
        }
    }

    async logout(userId: string): Promise<void> {
        await this.authRepository.deactivateAllUserTokens(userId);
    }

    async getMe(userId: string): Promise<UserResponseDto> {
        const user = await this.usersRepository.findById(userId);

        if (!user) {
            throw new NotFoundException('Usuário não encontrado');
        }

        return UserResponseDto.fromEntity(user);
    }
}
