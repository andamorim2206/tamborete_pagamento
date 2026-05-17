import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../../../src/auth/auth.service';
import { AuthRepository } from '../../../src/auth/auth.repository';
import { UsersRepository } from '../../../src/users/users.repository';
import { LogsService } from '../../../src/logs/logs.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

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

    describe('login', () => {
        const loginDto = {
            email: 'joao@example.com',
            password: 'senha123',
        };

        it('deve fazer login e retornar token JWT', async () => {
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

            const result = await service.login(loginDto);

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

            expect(usersRepository.findByEmail).toHaveBeenCalledWith('joao@example.com');

            expect(bcrypt.compare).toHaveBeenCalledWith('senha123', mockUser.password);

            expect(authRepository.deactivateAllUserTokens).toHaveBeenCalledWith(mockUser.id);

            expect(jwtService.sign).toHaveBeenCalledWith(
                {
                    sub: mockUser.id,
                    email: mockUser.email,
                    name: mockUser.name,
                    role: 'USER',
                },
                { expiresIn: '86400s' }
            );

            expect(authRepository.createToken).toHaveBeenCalledWith(
                mockUser.id,
                mockToken,
                expect.any(Date)
            );
        });

        it('deve retornar erro 401 se email não existe', async () => {
            usersRepository.findByEmail.mockResolvedValue(null);

            await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);

            expect(bcrypt.compare).not.toHaveBeenCalled();
        });

        it('deve retornar erro 401 se senha está incorreta', async () => {
            usersRepository.findByEmail.mockResolvedValue(mockUser as any);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);

            expect(jwtService.sign).not.toHaveBeenCalled();
            expect(authRepository.createToken).not.toHaveBeenCalled();
        });

        it('deve retornar mensagem genérica para email ou senha inválidos', async () => {
            usersRepository.findByEmail.mockResolvedValue(null);

            try {
                await service.login(loginDto);
            } catch (error) {
                expect(error.message).toBe('Email ou senha incorretos');
                expect(error.message).not.toContain('email não encontrado');
            }
        });

        it('deve desativar todos os tokens antigos do usuário', async () => {
            usersRepository.findByEmail.mockResolvedValue(mockUser as any);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            jwtService.sign.mockReturnValue(mockToken);
            authRepository.createToken.mockResolvedValue({} as any);

            await service.login(loginDto);

            const deactivateCall = authRepository.deactivateAllUserTokens.mock.invocationCallOrder[0];
            const createTokenCall = authRepository.createToken.mock.invocationCallOrder[0];
            expect(deactivateCall).toBeLessThan(createTokenCall);
        });

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


        it('deve rejeitar token não encontrado no banco', async () => {
            jwtService.verify.mockReturnValue({
                sub: 'user-123',
                email: 'joao@example.com',
            });
            authRepository.findByToken.mockResolvedValue(null);

            await expect(service.validateToken(mockToken)).rejects.toThrow(UnauthorizedException);
            await expect(service.validateToken(mockToken)).rejects.toThrow('Token inválido');
        });


        it('deve rejeitar token com assinatura inválida', async () => {
            jwtService.verify.mockImplementation(() => {
                throw new Error('Invalid signature');
            });

            await expect(service.validateToken('invalid-token')).rejects.toThrow(UnauthorizedException);
            await expect(service.validateToken('invalid-token')).rejects.toThrow('Token inválido');
        });
    });
});
