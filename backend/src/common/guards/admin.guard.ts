import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { UserRole } from '../../users/enums/user-role.enum';

@Injectable()
export class AdminGuard implements CanActivate {
    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('Usuário não autenticado');
        }

        if (user.role !== UserRole.ADMIN) {
            throw new ForbiddenException(
                'Acesso negado. Apenas administradores podem acessar este recurso.',
            );
        }

        return true;
    }
}
