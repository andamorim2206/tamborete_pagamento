import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthRepository } from '../auth.repository';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly configService: ConfigService,
        private readonly authRepository: AuthRepository,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey:
                configService.get<string>('JWT_SECRET') ||
                'seu-secret-super-secreto-mude-em-producao',
        });
    }

    async validate(payload: any) {
        return {
            id: payload.sub,
            email: payload.email,
            name: payload.name,
            role: payload.role || 'USER',
        };
    }
}
