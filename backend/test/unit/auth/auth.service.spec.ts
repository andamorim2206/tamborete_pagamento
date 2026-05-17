import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../../../src/auth/auth.service';
import { AuthRepository } from '../../../src/auth/auth.repository';
import { UsersRepository } from '../../../src/users/users.repository';
import { LogsService } from '../../../src/logs/logs.service';
import * as bcrypt from 'bcrypt';

// Mock do bcrypt para todos os testes
jest.mock('bcrypt');

/**
 * TESTE DO AUTH SERVICE
 * 
 * O que testamos aqui:
 * - Login com email e senha
 * - Geração de JWT
 * - Validação de token
 * - Desativação de tokens antigos
 * - Tratamento de credenciais inválidas
 */
describe('AuthService', () => {
    let service: AuthService;
    let authRepository: jest.Mocked<AuthRepository>;
    let usersRepository: jest.Mocked<UsersRepository>;
    let jwtService: jest.Mocked<JwtService>;

    const mockUser = {
        id: 'user-123',
        name: 'João Silva',
        email: 'joao@example.com',
        password: '$2b$10$hashedpassword',
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mocktoken';

    beforeEach(async () => {
        const mockAuthRepository = {
            createToken: jest.fn(),
            findActiveTokenByUserId: jest.fn(),
            findByToken: jest.fn(),
            deactivateToken: jest.fn(),
            deactivateAllUserTokens: jest.fn(),
        };

        const mockUsersRepository = {
            findByEmail: jest.fn(),
        };

        const mockJwtService = {
            sign: jest.fn(),
            verify: jest.fn(),
        };

        const mockLogsService = {
            createLog: jest.fn(),
            logUserLogin: jest.fn(),
            logError: jest.fn(),
            logErrorWithStack: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: AuthRepository,
                    useValue: mockAuthRepository,
                },
                {
                    provide: UsersRepository,
                    useValue: mockUsersRepository,
                },
                {
                    provide: JwtService,
                    useValue: mockJwtService,
                },
                {
                    provide: LogsService,
                    useValue: mockLogsService,
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        authRepository = module.get(AuthRepository);
        usersRepository = module.get(UsersRepository);
        jwtService = module.get(JwtService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('deve ser definido', () => {
        expect(service).toBeDefined();
    });

    /**
     * TESTE 1: Login com sucesso
     * Por quê? Fluxo principal de autenticação
     * 
     * Fluxo:
     * 1. Busca usuário por email
     * 2. Compara senha com bcrypt
     * 3. Desativa tokens antigos
     * 4. Gera novo JWT
     * 5. Salva token no banco
     * 6. Retorna LoginResponseDto
     */
    describe('login', () => {
        const loginDto = {
            email: 'joao@example.com',
            password: 'senha123',
        };

        it('deve fazer login e retornar token JWT', async () => {
            // Arrange
            usersRepository.findByEmail.mockResolvedValue(mockUser as any);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            jwtService.sign.mockReturnValue(mockToken);
            authRepository.createToken.mockResolvedValue({
                id: 'token-456',
                userId: mockUser.id,
                token: mockToken,
                expiresAt: new Date(Date.now() + 86400000),
                active: true,
                createdAt: new Date(),
            } as any);

            // Act
            const result = await service.login(loginDto);

            // Assert
            expect(result).toMatchObject({
                accessToken: mockToken,
                tokenType: 'Bearer',
                expiresIn: 86400,
                user: {
                    id: mockUser.id,
                    name: mockUser.name,
                    email: mockUser.email,
                },
            });

            // Verificar que usuário foi buscado
            expect(usersRepository.findByEmail).toHaveBeenCalledWith('joao@example.com');

            // Verificar que senha foi comparada
            expect(bcrypt.compare).toHaveBeenCalledWith('senha123', mockUser.password);

            // Verificar que tokens antigos foram desativados
            expect(authRepository.deactivateAllUserTokens).toHaveBeenCalledWith(mockUser.id);

            // Verificar que JWT foi gerado com payload correto
            expect(jwtService.sign).toHaveBeenCalledWith(
                {
                    sub: mockUser.id,
                    email: mockUser.email,
                    name: mockUser.name,
                    role: 'USER',
                },
                { expiresIn: '86400s' }
            );

            // Verificar que token foi salvo no banco
            expect(authRepository.createToken).toHaveBeenCalledWith(
                mockUser.id,
                mockToken,
                expect.any(Date)
            );
        });

        /**
         * TESTE 2: Email não encontrado
         * Por quê? Validar credenciais
         */
        it('deve retornar erro 401 se email não existe', async () => {
            usersRepository.findByEmail.mockResolvedValue(null);

            await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);

            // Não deve tentar comparar senha
            expect(bcrypt.compare).not.toHaveBeenCalled();
        });

        /**
         * TESTE 3: Senha incorreta
         * Por quê? Validar credenciais
         */
        it('deve retornar erro 401 se senha está incorreta', async () => {
            usersRepository.findByEmail.mockResolvedValue(mockUser as any);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);

            // Não deve gerar token
            expect(jwtService.sign).not.toHaveBeenCalled();
            expect(authRepository.createToken).not.toHaveBeenCalled();
        });

        /**
         * TESTE 4: Mensagem de erro genérica
         * Por quê? Segurança - não revelar se email existe
         */
        it('deve retornar mensagem genérica para email ou senha inválidos', async () => {
            usersRepository.findByEmail.mockResolvedValue(null);

            try {
                await service.login(loginDto);
            } catch (error) {
                expect(error.message).toBe('Email ou senha incorretos');
                expect(error.message).not.toContain('email não encontrado');
            }
        });

        /**
         * TESTE 5: Desativar tokens antigos
         * Por quê? Apenas um token ativo por usuário
         */
        it('deve desativar todos os tokens antigos do usuário', async () => {
            usersRepository.findByEmail.mockResolvedValue(mockUser as any);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            jwtService.sign.mockReturnValue(mockToken);
            authRepository.createToken.mockResolvedValue({} as any);

            await service.login(loginDto);

            // Deve desativar tokens ANTES de criar novo
            const deactivateCall = authRepository.deactivateAllUserTokens.mock.invocationCallOrder[0];
            const createTokenCall = authRepository.createToken.mock.invocationCallOrder[0];
            expect(deactivateCall).toBeLessThan(createTokenCall);
        });

        /**
         * TESTE 6: JWT expiração de 24 horas
         * Por quê? Validar configuração de segurança
         */
        it('deve criar token com expiração de 24 horas', async () => {
            usersRepository.findByEmail.mockResolvedValue(mockUser as any);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            jwtService.sign.mockReturnValue(mockToken);

            const mockExpiresAt = new Date(Date.now() + 86400000); // 24h
            authRepository.createToken.mockImplementation(async (userId, token, expiresAt) => {
                expect(expiresAt.getTime()).toBeCloseTo(mockExpiresAt.getTime(), -3); // Tolerância de 1000ms
                return {} as any;
            });

            await service.login(loginDto);
        });
    });

    /**
     * TESTE 7: Validar token JWT
     * Por quê? Autenticação em rotas protegidas
     */
    describe('validateToken', () => {
        it('deve validar token ativo', async () => {
            const mockTokenEntity = {
                id: 'token-123',
                userId: 'user-123',
                token: mockToken,
                active: true,
                expiresAt: new Date(Date.now() + 86400000),
            };

            const mockPayload = {
                sub: 'user-123',
                email: 'joao@example.com',
                name: 'João Silva',
            };

            jwtService.verify.mockReturnValue(mockPayload);
            authRepository.findByToken.mockResolvedValue(mockTokenEntity as any);

            const result = await service.validateToken(mockToken);

            expect(result).toEqual(mockPayload);
            expect(jwtService.verify).toHaveBeenCalledWith(mockToken);
            expect(authRepository.findByToken).toHaveBeenCalledWith(mockToken);
        });

        /**
         * TESTE 8: Rejeitar token inativo
         * Por quê? Token foi desativado no logout
         */
        it('deve rejeitar token desativado', async () => {
            const mockTokenEntity = {
                id: 'token-123',
                userId: 'user-123',
                token: mockToken,
                active: false, // Desativado
                expiresAt: new Date(Date.now() + 86400000),
            };

            jwtService.verify.mockReturnValue({
                sub: 'user-123',
                email: 'joao@example.com',
            });
            authRepository.findByToken.mockResolvedValue(mockTokenEntity as any);

            await expect(service.validateToken(mockToken)).rejects.toThrow(UnauthorizedException);
            await expect(service.validateToken(mockToken)).rejects.toThrow('Token inválido');
        });

        /**
         * TESTE 9: Rejeitar token expirado
         * Por quê? Segurança
         */
        it('deve rejeitar token expirado', async () => {
            const mockTokenEntity = {
                id: 'token-123',
                userId: 'user-123',
                token: mockToken,
                active: true,
                expiresAt: new Date(Date.now() - 1000), // Expirou há 1 segundo
            };

            jwtService.verify.mockReturnValue({
                sub: 'user-123',
                email: 'joao@example.com',
            });
            authRepository.findByToken.mockResolvedValue(mockTokenEntity as any);

            await expect(service.validateToken(mockToken)).rejects.toThrow(UnauthorizedException);
            await expect(service.validateToken(mockToken)).rejects.toThrow('Token inválido');
        });

        /**
         * TESTE 10: Rejeitar token não encontrado no banco
         * Por quê? Token pode ter sido deletado
         */
        it('deve rejeitar token não encontrado no banco', async () => {
            jwtService.verify.mockReturnValue({
                sub: 'user-123',
                email: 'joao@example.com',
            });
            authRepository.findByToken.mockResolvedValue(null);

            await expect(service.validateToken(mockToken)).rejects.toThrow(UnauthorizedException);
            await expect(service.validateToken(mockToken)).rejects.toThrow('Token inválido');
        });

        /**
         * TESTE 11: Rejeitar token com assinatura inválida
         * Por quê? Token pode ter sido manipulado
         */
        it('deve rejeitar token com assinatura inválida', async () => {
            jwtService.verify.mockImplementation(() => {
                throw new Error('Invalid signature');
            });

            await expect(service.validateToken('invalid-token')).rejects.toThrow(UnauthorizedException);
            await expect(service.validateToken('invalid-token')).rejects.toThrow('Token inválido');
        });
    });
});
