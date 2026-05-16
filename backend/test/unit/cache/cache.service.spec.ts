import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from '../../../src/cache/cache.service';
import RedisMock from 'ioredis-mock';

/**
 * TESTE DO CACHE SERVICE
 * 
 * O que testamos aqui:
 * - Conexão com Redis
 * - Operações básicas (get, set, del)
 * - Idempotência (verificar e marcar duplicatas)
 * - Distributed locks (adquirir e liberar)
 * - TTL (expiração de chaves)
 */
describe('CacheService', () => {
    let service: CacheService;
    let redisMock: RedisMock;

    beforeEach(async () => {
        // Criar mock do Redis (não conecta ao Redis real)
        redisMock = new RedisMock();

        const mockMetricsService = {
            recordRedisOperation: jest.fn(),
            recordMessagePublished: jest.fn(),
            recordMessageConsumed: jest.fn(),
            recordApiRequest: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                {
                    provide: CacheService,
                    useFactory: () => {
                        const cacheService = new CacheService();
                        // Substituir Redis real pelo mock
                        (cacheService as any).redis = redisMock;
                        // Adicionar mock do MetricsService
                        (cacheService as any).metricsService = mockMetricsService;
                        return cacheService;
                    },
                },
            ],
        }).compile();

        service = module.get<CacheService>(CacheService);
    });

    afterEach(async () => {
        // Limpar Redis após cada teste
        await redisMock.flushall();
    });

    /**
     * TESTE 1: Verificar se o serviço foi criado corretamente
     * Por quê? Garante que a injeção de dependência funcionou
     */
    it('deve ser definido', () => {
        expect(service).toBeDefined();
    });

    /**
     * TESTE 2: SET e GET
     * Por quê? Valida operação básica de cache
     * Cenário: Salvar um objeto e recuperá-lo
     */
    describe('set e get', () => {
        it('deve salvar e recuperar um valor do cache', async () => {
            const key = 'test-key';
            const value = { id: '123', name: 'Test' };

            // Salvar no cache
            await service.set(key, value);

            // Recuperar do cache
            const result = await service.get(key);

            // Verificar se retornou o mesmo objeto
            expect(result).toEqual(value);
        });

        /**
         * TESTE 3: GET de chave inexistente
         * Por quê? Garantir que retorna null em vez de erro
         */
        it('deve retornar null para chave inexistente', async () => {
            const result = await service.get('non-existent-key');
            expect(result).toBeNull();
        });

        /**
         * TESTE 4: SET com TTL
         * Por quê? Validar que chaves expiram automaticamente
         */
        it('deve respeitar o TTL (expiração)', async () => {
            const key = 'ttl-test';
            const value = 'will-expire';

            // Salvar com TTL de 1 segundo
            await service.set(key, value, 1);

            // Verificar que existe
            let result = await service.get(key);
            expect(result).toBe(value);

            // Aguardar expiração (1.5 segundos)
            await new Promise((resolve) => setTimeout(resolve, 1500));

            // Verificar que expirou
            result = await service.get(key);
            expect(result).toBeNull();
        });
    });

    /**
     * TESTE 5: DELETE
     * Por quê? Validar remoção de chaves
     */
    describe('del', () => {
        it('deve deletar uma chave do cache', async () => {
            const key = 'delete-test';
            await service.set(key, 'value');

            // Verificar que existe
            let result = await service.get(key);
            expect(result).toBe('value');

            // Deletar
            await service.del(key);

            // Verificar que foi removido
            result = await service.get(key);
            expect(result).toBeNull();
        });
    });

    /**
     * TESTE 6: DELETE por padrão
     * Por quê? Validar limpeza em massa (ex: deletar todos os caches de transações)
     */
    describe('delPattern', () => {
        it('deve deletar múltiplas chaves que correspondem ao padrão', async () => {
            // Criar várias chaves com o mesmo prefixo
            await service.set('transaction:1', { id: '1' });
            await service.set('transaction:2', { id: '2' });
            await service.set('transaction:3', { id: '3' });
            await service.set('user:1', { name: 'User' });

            // Deletar apenas as transações
            await service.delPattern('transaction:*');

            // Verificar que transações foram deletadas
            expect(await service.get('transaction:1')).toBeNull();
            expect(await service.get('transaction:2')).toBeNull();
            expect(await service.get('transaction:3')).toBeNull();

            // Verificar que user continua
            expect(await service.get('user:1')).toEqual({ name: 'User' });
        });
    });

    /**
     * TESTE 7: IDEMPOTÊNCIA - Verificar se transação já foi processada
     * Por quê? Evitar processamento duplicado
     */
    describe('checkIdempotency', () => {
        it('deve retornar null se chave de idempotência não existe', async () => {
            const result = await service.checkIdempotency('idempotency:test');
            expect(result).toBeNull();
        });

        it('deve retornar transaction ID se já existe', async () => {
            const key = 'idempotency:test';
            const transactionId = 'txn-123';

            await service.setIdempotency(key, transactionId, 300);

            const result = await service.checkIdempotency(key);
            expect(result).toBe(transactionId);
        });
    });

    /**
     * TESTE 8: IDEMPOTÊNCIA - Marcar transação como processada
     * Por quê? Garantir que duplicatas sejam detectadas
     */
    describe('setIdempotency', () => {
        it('deve salvar chave de idempotência com TTL', async () => {
            const key = 'idempotency:sender:receiver:100:PIX';
            const transactionId = 'txn-456';

            await service.setIdempotency(key, transactionId, 60);

            const result = await service.checkIdempotency(key);
            expect(result).toBe(transactionId);
        });
    });

    /**
     * TESTE 9: DISTRIBUTED LOCK - Adquirir lock
     * Por quê? Garantir que apenas um worker processa cada transação
     */
    describe('acquireLock', () => {
        it('deve adquirir lock com sucesso', async () => {
            const lockKey = 'lock:transaction:123';

            const acquired = await service.acquireLock(lockKey, 30);

            expect(acquired).toBe(true);
        });

        /**
         * TESTE 10: Não adquirir lock se já existe
         * Por quê? Evitar processamento concorrente
         */
        it('não deve adquirir lock se já está em uso', async () => {
            const lockKey = 'lock:transaction:456';

            // Primeiro worker adquire
            const firstAcquired = await service.acquireLock(lockKey, 30);
            expect(firstAcquired).toBe(true);

            // Segundo worker tenta adquirir (deve falhar)
            const secondAcquired = await service.acquireLock(lockKey, 30);
            expect(secondAcquired).toBe(false);
        });

        /**
         * TESTE 11: Lock expira automaticamente
         * Por quê? Evitar lock infinito se worker crashar
         */
        it('deve permitir adquirir lock após expiração', async () => {
            const lockKey = 'lock:transaction:789';

            // Adquirir com TTL de 1 segundo
            const firstAcquired = await service.acquireLock(lockKey, 1);
            expect(firstAcquired).toBe(true);

            // Aguardar expiração
            await new Promise((resolve) => setTimeout(resolve, 1500));

            // Deve conseguir adquirir novamente
            const secondAcquired = await service.acquireLock(lockKey, 30);
            expect(secondAcquired).toBe(true);
        });
    });

    /**
     * TESTE 12: DISTRIBUTED LOCK - Liberar lock
     * Por quê? Permitir que próximo worker processe
     */
    describe('releaseLock', () => {
        it('deve liberar lock corretamente', async () => {
            const lockKey = 'lock:transaction:release-test';

            // Adquirir lock
            await service.acquireLock(lockKey, 30);
            expect(await service.hasLock(lockKey)).toBe(true);

            // Liberar lock
            await service.releaseLock(lockKey);
            expect(await service.hasLock(lockKey)).toBe(false);

            // Outro worker deve conseguir adquirir
            const acquired = await service.acquireLock(lockKey, 30);
            expect(acquired).toBe(true);
        });
    });

    /**
     * TESTE 13: Verificar se lock existe
     * Por quê? Útil para logs e debugging
     */
    describe('hasLock', () => {
        it('deve retornar true se lock existe', async () => {
            const lockKey = 'lock:test';

            expect(await service.hasLock(lockKey)).toBe(false);

            await service.acquireLock(lockKey, 30);

            expect(await service.hasLock(lockKey)).toBe(true);
        });
    });
});
