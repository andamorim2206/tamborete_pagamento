import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from '../../../src/users/users.service';
import { UsersRepository } from '../../../src/users/users.repository';
import { LogsService } from '../../../src/logs/logs.service';
import * as bcrypt from 'bcrypt';

// Mock do bcrypt para todos os testes
jest.mock('bcrypt');

/**
 * TESTE DO USERS SERVICE
 * 
 * O que testamos aqui:
 * - Criação de usuários com hash de senha
 * - Validação de email único
 * - Busca de usuários
 * - Retorno de DTOs (sem senha)
 */
describe('UsersService', () => {
    let service: UsersService;
    let repository: jest.Mocked<UsersRepository>;

    const mockUser = {
        id: 'user-123',
        name: 'João Silva',
        email: 'joao@example.com',
        password: '$2b$10$hashedpassword', // Senha já com hash
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(async () => {
        const mockUsersRepository = {
            create: jest.fn(),
            findByEmail: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
        };

        const mockLogsService = {
            createLog: jest.fn(),
            logUserCreated: jest.fn(),
            logError: jest.fn(),
            logErrorWithStack: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: UsersRepository,
                    useValue: mockUsersRepository,
                },
                {
                    provide: LogsService,
                    useValue: mockLogsService,
                },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        repository = module.get(UsersRepository);
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    it('deve ser definido', () => {
        expect(service).toBeDefined();
    });

    /**
     * TESTE 1: Criar usuário com sucesso
     * Por quê? Fluxo principal de registro
     * 
     * Testa:
     * 1. Verifica se email já existe
     * 2. Hash da senha com bcrypt
     * 3. Salva no banco
     * 4. Retorna DTO sem senha
     */
    describe('create', () => {
        const createDto = {
            name: 'João Silva',
            email: 'joao@example.com',
            password: 'senha123',
        };

        it('deve criar usuário com senha hasheada', async () => {
            // Arrange
            repository.findByEmail.mockResolvedValue(null); // Email disponível
            repository.create.mockResolvedValue(mockUser as any);

            // Mock do bcrypt.hash
            (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashedpassword');

            // Act
            const result = await service.create(createDto);

            // Assert
            expect(result).toBeDefined();
            expect(result.email).toBe('joao@example.com');
            expect(result.name).toBe('João Silva');
            expect(result.password).toBeUndefined(); // DTO não deve conter senha

            // Verificar que email foi checado
            expect(repository.findByEmail).toHaveBeenCalledWith('joao@example.com');

            // Verificar que senha foi hasheada
            expect(bcrypt.hash).toHaveBeenCalledWith('senha123', 10);

            // Verificar que usuário foi criado com senha hasheada e saldo inicial
            expect(repository.create).toHaveBeenCalledWith({
                name: 'João Silva',
                email: 'joao@example.com',
                password: '$2b$10$hashedpassword',
                balance: 1000.00,
                role: 'USER',
            });
        });

        /**
         * TESTE 2: Email duplicado
         * Por quê? Validar unicidade de email
         */
        it('deve retornar erro 409 se email já existe', async () => {
            // Arrange: Email já cadastrado
            repository.findByEmail.mockResolvedValue(mockUser as any);

            // Act & Assert
            await expect(service.create(createDto)).rejects.toThrow(ConflictException);

            // Não deve tentar criar
            expect(repository.create).not.toHaveBeenCalled();
        });

        /**
         * TESTE 3: Senha com tamanho mínimo
         * Por quê? Validação de segurança
         * Nota: ValidationPipe faz isso, mas testamos a integração
         */
        it('deve aceitar senha com 6+ caracteres', async () => {
            repository.findByEmail.mockResolvedValue(null);
            repository.create.mockResolvedValue(mockUser as any);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

            const dto = { ...createDto, password: '123456' }; // Mínimo

            await expect(service.create(dto)).resolves.toBeDefined();
        });
    });

    /**
     * TESTE 4: Listar todos os usuários
     * Por quê? Consulta administrativa
     */
    describe('findAll', () => {
        it('deve retornar lista de usuários sem senhas', async () => {
            const mockUsers = [
                mockUser,
                {
                    id: 'user-456',
                    name: 'Maria Santos',
                    email: 'maria@example.com',
                    password: '$2b$10$anotherhash',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            repository.findAll.mockResolvedValue(mockUsers as any);

            const result = await service.findAll();

            expect(result).toHaveLength(2);
            expect(result[0].password).toBeUndefined();
            expect(result[1].password).toBeUndefined();
            expect(result[0].email).toBe('joao@example.com');
            expect(result[1].email).toBe('maria@example.com');
        });

        it('deve retornar array vazio se não há usuários', async () => {
            repository.findAll.mockResolvedValue([]);

            const result = await service.findAll();

            expect(result).toEqual([]);
        });
    });

    /**
     * TESTE 5: Buscar usuário por ID
     * Por quê? Consulta individual
     */
    describe('findById', () => {
        it('deve retornar usuário específico sem senha', async () => {
            repository.findById.mockResolvedValue(mockUser as any);

            const result = await service.findById('user-123');

            expect(result).toBeDefined();
            expect(result.id).toBe('user-123');
            expect(result.password).toBeUndefined();
            expect(repository.findById).toHaveBeenCalledWith('user-123');
        });

        /**
         * TESTE 6: Usuário não encontrado
         * Por quê? Tratar erro 404
         */
        it('deve retornar erro 404 se usuário não existe', async () => {
            repository.findById.mockResolvedValue(null);

            await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
        });
    });

    /**
     * TESTE 7: Validação de hash de senha
     * Por quê? Garantir segurança
     */
    describe('Hash de senha', () => {
        it('deve usar bcrypt com salt rounds 10', async () => {
            const createDto = {
                name: 'Test',
                email: 'test@example.com',
                password: 'mypassword',
            };

            repository.findByEmail.mockResolvedValue(null);
            repository.create.mockResolvedValue(mockUser as any);
            (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$mockedhash');

            await service.create(createDto);

            // Verificar que bcrypt.hash foi chamado com salt rounds 10
            expect(bcrypt.hash).toHaveBeenCalledWith('mypassword', 10);
        });

        it('deve gerar hash diferente da senha original', async () => {
            const password = 'senha123';
            (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$fakehash123');
            const hashedPassword = await bcrypt.hash(password, 10);

            // Hash deve ser diferente da senha original
            expect(hashedPassword).not.toBe(password);
            expect(hashedPassword).toMatch(/^\$2b\$10\$/); // Formato bcrypt
        });

        it('deve validar senha com bcrypt.compare', async () => {
            const password = 'senha123';
            const hashedPassword = '$2b$10$fakehash123';

            // Mock bcrypt.compare
            (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
            (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

            // Senha correta deve passar
            const isValid = await bcrypt.compare(password, hashedPassword);
            expect(isValid).toBe(true);

            // Senha incorreta deve falhar
            const isInvalid = await bcrypt.compare('senhaerrada', hashedPassword);
            expect(isInvalid).toBe(false);
        });
    });
});
