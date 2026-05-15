import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { DataSource } from 'typeorm';
import { CacheService } from '../../../src/cache/cache.service';

/**
 * TESTE E2E (End-to-End) - FLUXO COMPLETO DE TRANSAÇÕES
 * 
 * O que testamos aqui:
 * - Fluxo completo do sistema (do HTTP até o banco)
 * - Integração entre todos os componentes
 * - PostgreSQL, Redis e RabbitMQ reais (ou mocks)
 * - Comportamento em cenários reais
 * 
 * IMPORTANTE: Estes testes precisam:
 * - Banco de dados de testes
 * - Redis rodando
 * - RabbitMQ rodando (ou mock)
 */
describe('Transactions E2E', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let cacheService: CacheService;
    let authToken: string;
    let senderId: string;
    let receiverId: string;

    /**
     * SETUP: Configurar aplicação de teste
     */
    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        // Aplicar mesmas configurações do main.ts
        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        );

        app.enableCors();

        await app.init();

        dataSource = moduleFixture.get(DataSource);
        cacheService = moduleFixture.get(CacheService);
    });

    afterAll(async () => {
        await app.close();
    });

    /**
     * SETUP: Limpar banco e criar usuários de teste
     */
    beforeEach(async () => {
        // Limpar banco (em ordem devido a FKs)
        await dataSource.query('DELETE FROM transactions');
        await dataSource.query('DELETE FROM user_tokens');
        await dataSource.query('DELETE FROM users');

        // Limpar Redis
        await cacheService['redis'].flushall();

        // Criar usuário sender
        const senderResponse = await request(app.getHttpServer())
            .post('/users')
            .send({
                name: 'João Silva',
                email: 'joao@example.com',
                password: 'senha123',
            });

        senderId = senderResponse.body.id;

        // Criar usuário receiver
        const receiverResponse = await request(app.getHttpServer())
            .post('/users')
            .send({
                name: 'Maria Santos',
                email: 'maria@example.com',
                password: 'senha456',
            });

        receiverId = receiverResponse.body.id;

        // Fazer login para obter token
        const loginResponse = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                email: 'joao@example.com',
                password: 'senha123',
            });

        authToken = loginResponse.body.accessToken;
    });

    /**
     * TESTE 1: Criar transação E2E
     * Por quê? Validar fluxo completo
     * 
     * Fluxo:
     * 1. POST /transactions com JWT
     * 2. Valida DTO
     * 3. Verifica idempotência no Redis
     * 4. Salva no PostgreSQL
     * 5. Cacheia no Redis
     * 6. Publica no RabbitMQ
     * 7. Retorna 201 Created
     */
    describe('POST /transactions', () => {
        it('deve criar transação completa (E2E)', async () => {
            const createDto = {
                receiverEmail: 'maria@example.com',
                amount: 150.75,
                paymentMethod: 'PIX',
            };

            const response = await request(app.getHttpServer())
                .post('/transactions')
                .set('Authorization', `Bearer ${authToken}`)
                .send(createDto)
                .expect(201);

            // Verificar resposta
            expect(response.body).toMatchObject({
                id: expect.any(String),
                senderId,
                senderEmail: 'joao@example.com',
                receiverId,
                receiverEmail: 'maria@example.com',
                amount: 150.75,
                paymentMethod: 'PIX',
                status: 'PENDING',
            });

            const transactionId = response.body.id;

            // Verificar que foi salvo no banco
            const dbResult = await dataSource.query(
                'SELECT * FROM transactions WHERE id = $1',
                [transactionId],
            );
            expect(dbResult).toHaveLength(1);
            expect(dbResult[0].amount).toBe('150.75');

            // Verificar que foi cacheado
            const cached = await cacheService.get(`transaction:${transactionId}`);
            expect(cached).toBeDefined();
            expect(cached.id).toBe(transactionId);

            // Verificar que chave de idempotência foi criada
            const idempotencyKey = `idempotency:${senderId}:maria@example.com:150.75:PIX`;
            const idempotencyValue = await cacheService.checkIdempotency(idempotencyKey);
            expect(idempotencyValue).toBe(transactionId);
        });

        /**
         * TESTE 2: IDEMPOTÊNCIA E2E
         * Por quê? Garantir que duplicatas são bloqueadas
         */
        it('deve bloquear transação duplicada (idempotência)', async () => {
            const createDto = {
                receiverEmail: 'maria@example.com',
                amount: 200.00,
                paymentMethod: 'PIX',
            };

            // Primeira requisição
            const firstResponse = await request(app.getHttpServer())
                .post('/transactions')
                .set('Authorization', `Bearer ${authToken}`)
                .send(createDto)
                .expect(201);

            const firstTransactionId = firstResponse.body.id;

            // Segunda requisição idêntica (DUPLICATA)
            const secondResponse = await request(app.getHttpServer())
                .post('/transactions')
                .set('Authorization', `Bearer ${authToken}`)
                .send(createDto)
                .expect(409); // Conflict

            // Verificar mensagem de erro
            expect(secondResponse.body.message).toContain('já foi processada');

            // Verificar que retorna a transação original
            expect(secondResponse.body.existingTransaction.id).toBe(firstTransactionId);

            // Verificar que apenas 1 transação existe no banco
            const dbResult = await dataSource.query(
                'SELECT * FROM transactions WHERE sender_id = $1 AND receiver_id = $2',
                [senderId, receiverId],
            );
            expect(dbResult).toHaveLength(1);
        });

        /**
         * TESTE 3: Validação de receiver inexistente
         * Por quê? Tratar erro de negócio
         */
        it('deve retornar 400 se receiver não existe', async () => {
            const response = await request(app.getHttpServer())
                .post('/transactions')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    receiverEmail: 'naoexiste@example.com',
                    amount: 100,
                    paymentMethod: 'PIX',
                })
                .expect(400);

            expect(response.body.message).toContain('não encontrado');
        });

        /**
         * TESTE 4: Não pode enviar para si mesmo
         * Por quê? Regra de negócio
         */
        it('deve retornar 400 se tentar enviar para si mesmo', async () => {
            const response = await request(app.getHttpServer())
                .post('/transactions')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    receiverEmail: 'joao@example.com', // Mesmo email do sender
                    amount: 100,
                    paymentMethod: 'PIX',
                })
                .expect(400);

            expect(response.body.message).toContain('si mesmo');
        });

        /**
         * TESTE 5: Validação de DTO (valor negativo)
         * Por quê? ValidationPipe deve rejeitar
         */
        it('deve retornar 400 para valor negativo', async () => {
            await request(app.getHttpServer())
                .post('/transactions')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    receiverEmail: 'maria@example.com',
                    amount: -50, // Negativo
                    paymentMethod: 'PIX',
                })
                .expect(400);
        });

        /**
         * TESTE 6: Autenticação obrigatória
         * Por quê? Endpoint protegido
         */
        it('deve retornar 401 sem token JWT', async () => {
            await request(app.getHttpServer())
                .post('/transactions')
                .send({
                    receiverEmail: 'maria@example.com',
                    amount: 100,
                    paymentMethod: 'PIX',
                })
                .expect(401);
        });
    });

    /**
     * TESTE 7: Listar transações E2E
     * Por quê? Validar cache e consultas
     */
    describe('GET /transactions', () => {
        it('deve retornar lista de transações', async () => {
            // Criar 2 transações
            await request(app.getHttpServer())
                .post('/transactions')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    receiverEmail: 'maria@example.com',
                    amount: 50,
                    paymentMethod: 'PIX',
                });

            await request(app.getHttpServer())
                .post('/transactions')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    receiverEmail: 'maria@example.com',
                    amount: 100,
                    paymentMethod: 'CARTAO_DE_CREDITO',
                });

            // Buscar todas
            const response = await request(app.getHttpServer())
                .get('/transactions')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveLength(2);
            expect(response.body[0].amount).toBe(100); // Mais recente primeiro (ORDER BY createdAt DESC)
            expect(response.body[1].amount).toBe(50);
        });

        /**
         * TESTE 8: CACHE - Segunda requisição deve ser mais rápida
         * Por quê? Validar que cache funciona
         */
        it('deve usar cache na segunda requisição', async () => {
            // Criar transação
            await request(app.getHttpServer())
                .post('/transactions')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    receiverEmail: 'maria@example.com',
                    amount: 75,
                    paymentMethod: 'PIX',
                });

            // Primeira busca (sem cache)
            const start1 = Date.now();
            await request(app.getHttpServer())
                .get('/transactions')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            const time1 = Date.now() - start1;

            // Segunda busca (com cache)
            const start2 = Date.now();
            const response2 = await request(app.getHttpServer())
                .get('/transactions')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            const time2 = Date.now() - start2;

            // Cache deve ser mais rápido
            expect(time2).toBeLessThan(time1);
            expect(response2.body).toHaveLength(1);
        });
    });

    /**
     * TESTE 9: Buscar transação por ID E2E
     * Por quê? Validar cache individual
     */
    describe('GET /transactions/:id', () => {
        it('deve retornar transação específica', async () => {
            // Criar transação
            const createResponse = await request(app.getHttpServer())
                .post('/transactions')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    receiverEmail: 'maria@example.com',
                    amount: 300,
                    paymentMethod: 'PIX',
                });

            const transactionId = createResponse.body.id;

            // Buscar por ID
            const response = await request(app.getHttpServer())
                .get(`/transactions/${transactionId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toMatchObject({
                id: transactionId,
                amount: 300,
                paymentMethod: 'PIX',
            });
        });

        it('deve retornar 404 para ID inexistente', async () => {
            await request(app.getHttpServer())
                .get('/transactions/00000000-0000-0000-0000-000000000000')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });
    });

    /**
     * TESTE 10: Atualizar status E2E
     * Por quê? Validar invalidação de cache
     */
    describe('PATCH /transactions/:id/status', () => {
        it('deve atualizar status e invalidar cache', async () => {
            // Criar transação
            const createResponse = await request(app.getHttpServer())
                .post('/transactions')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    receiverEmail: 'maria@example.com',
                    amount: 500,
                    paymentMethod: 'PIX',
                });

            const transactionId = createResponse.body.id;

            // Verificar que está cacheada como PENDING
            let cached = await cacheService.get(`transaction:${transactionId}`);
            expect(cached.status).toBe('PENDING');

            // Atualizar status
            const updateResponse = await request(app.getHttpServer())
                .patch(`/transactions/${transactionId}/status`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ status: 'COMPLETED' })
                .expect(200);

            expect(updateResponse.body.status).toBe('COMPLETED');

            // Aguardar um pouco para cache ser invalidado
            await new Promise((resolve) => setTimeout(resolve, 100));

            // Verificar que cache foi invalidado
            cached = await cacheService.get(`transaction:${transactionId}`);
            expect(cached).toBeNull(); // Cache foi deletado

            // Buscar novamente (deve ir ao banco e cachear novamente)
            const getResponse = await request(app.getHttpServer())
                .get(`/transactions/${transactionId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(getResponse.body.status).toBe('COMPLETED');
        });
    });

    /**
     * TESTE 11: Rate Limiting E2E
     * Por quê? Validar proteção contra spam
     */
    describe('Rate Limiting', () => {
        it('deve bloquear após 5 transações em 1 minuto', async () => {
            // Criar 5 transações (limite)
            for (let i = 0; i < 5; i++) {
                await request(app.getHttpServer())
                    .post('/transactions')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        receiverEmail: 'maria@example.com',
                        amount: 10 + i, // Valores diferentes para não triggerar idempotência
                        paymentMethod: 'PIX',
                    })
                    .expect(201);
            }

            // 6ª transação deve ser bloqueada
            const response = await request(app.getHttpServer())
                .post('/transactions')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    receiverEmail: 'maria@example.com',
                    amount: 999,
                    paymentMethod: 'PIX',
                })
                .expect(429); // Too Many Requests

            expect(response.body.message).toContain('ThrottlerException');
        }, 30000); // Timeout maior para este teste
    });
});
