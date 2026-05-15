import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        // Chama a validação do Passport JWT
        return super.canActivate(context);
    }

    handleRequest(err: any, user: any, info: any) {
        // Se houver erro ou não houver usuário, lança exceção
        if (err || !user) {
            throw err || new UnauthorizedException('Token inválido ou expirado');
        }
        return user;
    }
}
