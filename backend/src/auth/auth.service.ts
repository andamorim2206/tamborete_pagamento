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

@Injectable()
export class AuthService {
    constructor(
        private readonly authRepository: AuthRepository,
        private readonly usersRepository: UsersRepository,
        private readonly jwtService: JwtService,
    ) { }

    async login(loginDto: LoginDto): Promise<LoginResponseDto> {
        // 1. Buscar usuário por email
        const user = await this.usersRepository.findByEmail(loginDto.email);

        if (!user) {
            throw new UnauthorizedException('Email ou senha incorretos');
        }

        // 2. Validar senha
        const isPasswordValid = await bcrypt.compare(
            loginDto.password,
            user.password!,
        );

        if (!isPasswordValid) {
            throw new UnauthorizedException('Email ou senha incorretos');
        }

        // 3. Desativar tokens anteriores do usuário
        await this.authRepository.deactivateAllUserTokens(user.id!);

        // 4. Gerar novo token JWT
        const payload = {
            sub: user.id!,
            email: user.email!,
            name: user.name!,
        };

        const expiresIn = 86400; // 24 horas em segundos
        const token = this.jwtService.sign(payload, {
            expiresIn: `${expiresIn}s`,
        });

        // 5. Calcular data de expiração
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

        // 6. Salvar token no banco
        await this.authRepository.createToken(user.id!, token, expiresAt);

        // 7. Retornar resposta
        return new LoginResponseDto(token, expiresIn, {
            id: user.id!,
            name: user.name!,
            email: user.email!,
        });
    }

    async validateToken(token: string): Promise<any> {
        try {
            const payload = this.jwtService.verify(token);

            // Verificar se o token está ativo no banco
            const userToken = await this.authRepository.findByToken(token);

            if (!userToken || !userToken.active) {
                throw new UnauthorizedException('Token inválido ou expirado');
            }

            // Verificar se o token expirou
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
