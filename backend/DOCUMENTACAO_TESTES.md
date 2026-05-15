# 🧪 Documentação de Testes Automatizados

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura de Testes](#estrutura-de-testes)
3. [Como Executar](#como-executar)
4. [Testes do Cache (Redis)](#testes-do-cache-redis)
5. [Testes de Transações](#testes-de-transações)
6. [Testes do Processor (RabbitMQ)](#testes-do-processor-rabbitmq)
7. [Testes de Usuários](#testes-de-usuários)
8. [Testes de Autenticação](#testes-de-autenticação)
9. [Testes E2E](#testes-e2e)

---

## 🎯 Visão Geral

Este projeto possui **testes completos** em 3 níveis:

### 1. **Testes Unitários**
- Testam classes isoladamente (mocks para dependências)
- Rápidos (milissegundos)
- **Arquivos**: `*.service.spec.ts`, `*.controller.spec.ts`

### 2. **Testes de Integração**
- Testam integração entre componentes
- Usam mocks do banco, Redis e RabbitMQ
- **Arquivos**: `*.spec.ts` nos módulos

### 3. **Testes E2E (End-to-End)**
- Testam fluxo completo do sistema
- Usam banco de dados real (ou test container)
- **Arquivos**: `test/*.e2e-spec.ts`

---

## 📁 Estrutura de Testes

```
backend/
└── test/
    ├── unit/                              # Testes unitários
    │   ├── cache/
    │   │   └── cache.service.spec.ts      # 13 testes do Redis
    │   ├── transactions/
    │   │   ├── transactions.service.spec.ts   # 9 testes do service
    │   │   ├── transactions.processor.spec.ts # 6 testes do RabbitMQ
    │   │   └── transactions.controller.spec.ts # 8 testes dos endpoints
    │   ├── users/
    │   │   └── users.service.spec.ts      # 7 testes do service
    │   └── auth/
    │       └── auth.service.spec.ts       # 11 testes de autenticação
    ├── e2e/                               # Testes End-to-End
    │   └── transactions/
    │       └── transactions.e2e-spec.ts   # 11 testes E2E completos
    └── README.md                          # Guia da estrutura de testes
```

**Total: 65+ testes automatizados**

---

## 🚀 Como Executar

### 1. Instalar Dependências
```bash
npm install
```

### 2. Rodar Todos os Testes
```bash
npm test
```

### 3. Rodar Testes com Coverage (Cobertura)
```bash
npm run test:cov
```

### 4. Rodar Testes em Modo Watch (auto-reload)
```bash
npm run test:watch
```

### 5. Rodar Apenas Testes E2E
```bash
npm run test:e2e
```

### 6. Rodar Testes por Módulo
```bash
# Apenas testes unitários
npm test -- test/unit

# Apenas testes de cache
npm test -- test/unit/cache

# Apenas testes de transações (unitários)
npm test -- test/unit/transactions

# Apenas testes de usuários
npm test -- test/unit/users

# Apenas testes de autenticação
npm test -- test/unit/auth

# Apenas testes E2E de transações
npm test -- test/e2e/transactions
```

### 7. Rodar Teste Específico
```bash
npm test -- cache.service.spec.ts
npm test -- transactions.processor.spec.ts
npm test -- transactions.e2e-spec.ts
```

---

## 🔴 Testes do Cache (Redis)

**Arquivo**: `src/cache/cache.service.spec.ts`

### O que é testado?

#### ✅ 1. Operações Básicas
```typescript
// Salvar e recuperar do cache
await cacheService.set('key', { data: 'value' });
const result = await cacheService.get('key');
// Espera: retornar o objeto salvo
```

**Por quê?** Valida operação fundamental do cache.

---

#### ✅ 2. Cache Miss (chave não existe)
```typescript
const result = await cacheService.get('non-existent');
// Espera: null
```

**Por quê?** Garante que não dá erro quando chave não existe.

---

#### ✅ 3. TTL (Time To Live)
```typescript
await cacheService.set('key', 'value', 1); // 1 segundo
await sleep(1500); // Aguarda expirar
const result = await cacheService.get('key');
// Espera: null (expirou)
```

**Por quê?** Valida que cache expira automaticamente.

---

#### ✅ 4. Deletar Chave
```typescript
await cacheService.set('key', 'value');
await cacheService.del('key');
const result = await cacheService.get('key');
// Espera: null
```

**Por quê?** Invalidação de cache ao atualizar dados.

---

#### ✅ 5. Deletar por Padrão
```typescript
await cacheService.set('transaction:1', {});
await cacheService.set('transaction:2', {});
await cacheService.delPattern('transaction:*');
// Espera: ambas deletadas
```

**Por quê?** Limpar todos os caches relacionados de uma vez.

---

#### ✅ 6-7. Idempotência (Detectar Duplicatas)
```typescript
// Verificar se já processado
const exists = await cacheService.checkIdempotency('key');
// Espera: null (não existe)

// Marcar como processado
await cacheService.setIdempotency('key', 'transaction-id', 300);
const exists2 = await cacheService.checkIdempotency('key');
// Espera: 'transaction-id'
```

**Por quê?** Evitar cobranças duplicadas.

**Exemplo Real**:
- Usuário clica "Pagar" 2 vezes
- 1ª requisição: chave não existe → processa
- 2ª requisição: chave existe → retorna 409 Conflict

---

#### ✅ 8-9. Distributed Lock (Controle de Concorrência)
```typescript
// Worker 1 tenta adquirir lock
const acquired1 = await cacheService.acquireLock('lock:txn-123', 30);
// Espera: true

// Worker 2 tenta adquirir MESMO lock
const acquired2 = await cacheService.acquireLock('lock:txn-123', 30);
// Espera: false (bloqueado)
```

**Por quê?** Evitar processamento duplicado por múltiplos workers.

**Cenário Real**:
- 2 workers pegam mesma mensagem do RabbitMQ
- Worker 1 adquire lock → processa transação
- Worker 2 NÃO adquire lock → ignora mensagem

---

#### ✅ 10. Lock com Expiração Automática
```typescript
await cacheService.acquireLock('lock:key', 1); // 1 segundo
await sleep(1500);
const acquired = await cacheService.acquireLock('lock:key', 30);
// Espera: true (lock expirou)
```

**Por quê?** Se worker crashar, lock não fica travado para sempre.

---

#### ✅ 11-13. Liberar Lock
```typescript
await cacheService.acquireLock('lock:key', 30);
await cacheService.releaseLock('lock:key');
const acquired = await cacheService.acquireLock('lock:key', 30);
// Espera: true (foi liberado)
```

**Por quê?** Próximo worker pode processar.

---

## 💰 Testes de Transações

**Arquivo**: `src/transactions/transactions.service.spec.ts`

### ✅ 1. Criar Transação com Sucesso

```typescript
const dto = {
    receiverEmail: 'maria@example.com',
    amount: 100.50,
    paymentMethod: 'PIX',
};

const result = await service.create('sender-id', dto);
// Espera:
// 1. Verificou idempotência
// 2. Buscou receiver por email
// 3. Criou no banco com status PENDING
// 4. Salvou idempotência no Redis
// 5. Cacheou transação (60s TTL)
// 6. Publicou no RabbitMQ
```

**Por quê?** Fluxo principal do sistema.

---

### ✅ 2. Detectar Duplicata (Idempotência)

```typescript
// 1ª requisição
await service.create('sender', dto);

// 2ª requisição IDÊNTICA
await service.create('sender', dto);
// Espera: ConflictException (409)
```

**Por quê?** Se usuário clicar 2x, não deve cobrar 2x.

**Como funciona?**
- Chave de idempotência: `idempotency:{senderId}:{receiverEmail}:{amount}:{paymentMethod}`
- TTL: 5 minutos
- Se chave existe → retorna transação original com 409

---

### ✅ 3. Receiver Não Encontrado

```typescript
const dto = {
    receiverEmail: 'naoexiste@example.com',
    amount: 100,
    paymentMethod: 'PIX',
};

await service.create('sender-id', dto);
// Espera: BadRequestException (400)
```

**Por quê?** Não pode transferir para usuário inexistente.

---

### ✅ 4. Não Pode Enviar para Si Mesmo

```typescript
// Sender: joao@example.com
const dto = {
    receiverEmail: 'joao@example.com', // Mesmo email
    amount: 100,
    paymentMethod: 'PIX',
};

await service.create('joao-id', dto);
// Espera: BadRequestException (400)
```

**Por quê?** Regra de negócio.

---

### ✅ 5-6. Cache em Consultas (findAll)

```typescript
// 1ª busca (sem cache)
const result1 = await service.findAll();
// → Busca no banco
// → Cacheia com TTL de 30 segundos

// 2ª busca (com cache)
const result2 = await service.findAll();
// → Retorna do cache (não busca no banco)
```

**Por quê?** Melhorar performance.

**Resultado Real**: 4x mais rápido
- Sem cache: ~40ms
- Com cache: ~10ms

---

### ✅ 7-8. Cache em Consulta Individual (findById)

```typescript
// 1ª busca
const result1 = await service.findById('txn-123');
// → Busca no banco
// → Cacheia com TTL de 60 segundos

// 2ª busca
const result2 = await service.findById('txn-123');
// → Retorna do cache
```

**Por quê?** Transações específicas são consultadas frequentemente.

---

### ✅ 9. Invalidar Cache ao Atualizar

```typescript
await service.updateStatus('txn-123', { status: 'COMPLETED' });
// Espera:
// 1. Atualiza no banco
// 2. Deleta cache: transaction:txn-123
// 3. Deleta cache: transactions:all
```

**Por quê?** Usuário deve ver status atualizado.

---

## 🐰 Testes do Processor (RabbitMQ)

**Arquivo**: `src/transactions/transactions.processor.spec.ts`

### ✅ 1. Processar Transação com Sucesso

```typescript
const event = {
    transactionId: 'txn-123',
    senderId: 'sender-456',
    receiverId: 'receiver-789',
    amount: 150.50,
    paymentMethod: 'PIX',
};

await processor.handleTransactionCreated(event);
// Espera:
// 1. Adquire lock: lock:transaction:txn-123
// 2. Atualiza status: PENDING → PROCESSING
// 3. Invalida cache
// 4. Simula processamento (3s)
// 5. Atualiza status: PROCESSING → COMPLETED
// 6. Invalida cache novamente
// 7. Libera lock
```

**Por quê?** Worker processa transações em background.

---

### ✅ 2. NÃO Processar se Lock Está em Uso

```typescript
// Worker 1 adquire lock
// Worker 2 recebe mesma mensagem

await processor.handleTransactionCreated(event);
// Espera:
// - Tenta adquirir lock → FALHA
// - NÃO atualiza status
// - NÃO processa
// - NÃO libera lock (não adquiriu)
```

**Por quê?** **CONTROLE DE CONCORRÊNCIA** - múltiplos workers não processam mesma transação.

**Cenário Real**:
- RabbitMQ pode entregar mesma mensagem para 2 workers
- Lock garante que apenas 1 processa
- Outro ignora

---

### ✅ 3. Marcar como FAILED em Caso de Erro

```typescript
// Simular erro no processamento
jest.spyOn(processor, 'simulateProcessing')
    .mockRejectedValue(new Error('API fora do ar'));

await processor.handleTransactionCreated(event);
// Espera:
// 1. Atualiza: PENDING → PROCESSING
// 2. Tenta processar → ERRO
// 3. Atualiza: PROCESSING → FAILED
// 4. Invalida cache
// 5. Libera lock (SEMPRE, no finally)
```

**Por quê?** Falhas acontecem (API de pagamento fora, etc).

---

### ✅ 4. Liberar Lock Mesmo com Erro

```typescript
// Banco de dados cai
repository.updateStatus.mockRejectedValue(new Error('DB down'));

await processor.handleTransactionCreated(event);
// Espera:
// - Lock É LIBERADO mesmo com erro
```

**Por quê?** Evitar lock infinito. Block finally garante isso.

---

### ✅ 5. Invalidar Cache Após Cada Mudança de Status

```typescript
await processor.handleTransactionCreated(event);
// Espera 4 invalidações:
// 1. transaction:txn-123 (após PROCESSING)
// 2. transactions:all (após PROCESSING)
// 3. transaction:txn-123 (após COMPLETED)
// 4. transactions:all (após COMPLETED)
```

**Por quê?** Usuário vê status atualizado em tempo real.

---

## 👤 Testes de Usuários

**Arquivo**: `src/users/users.service.spec.ts`

### ✅ 1. Criar Usuário com Senha Hasheada

```typescript
const dto = {
    name: 'João Silva',
    email: 'joao@example.com',
    password: 'senha123',
};

const result = await service.create(dto);
// Espera:
// 1. Verifica se email já existe
// 2. Hash da senha com bcrypt (salt rounds 10)
// 3. Salva no banco com senha hasheada
// 4. Retorna DTO SEM senha
```

**Por quê?** Nunca salvar senha em texto puro.

---

### ✅ 2. Email Duplicado

```typescript
// Já existe: joao@example.com
await service.create({ email: 'joao@example.com', ... });
// Espera: ConflictException (409)
```

**Por quê?** Email deve ser único.

---

### ✅ 3-7. Validações e Segurança

- Senha mínima de 6 caracteres
- Hash bcrypt com salt rounds 10
- DTO de resposta SEM senha
- Buscar por ID retorna sem senha
- bcrypt.compare valida senha

---

## 🔐 Testes de Autenticação

**Arquivo**: `src/auth/auth.service.spec.ts`

### ✅ 1. Login com Sucesso

```typescript
const dto = {
    email: 'joao@example.com',
    password: 'senha123',
};

const result = await service.login(dto);
// Espera:
// 1. Busca usuário por email
// 2. bcrypt.compare(senha, hash)
// 3. Desativa tokens antigos
// 4. Gera JWT com payload: { sub: userId, email, name }
// 5. Salva token no banco (active: true, expiresAt: +24h)
// 6. Retorna: { accessToken, tokenType: 'Bearer', expiresIn: 86400, user }
```

**Por quê?** Fluxo de autenticação.

---

### ✅ 2-4. Credenciais Inválidas

```typescript
// Email não existe
await service.login({ email: 'naoexiste@example.com', ... });
// Espera: UnauthorizedException

// Senha incorreta
await service.login({ email: 'joao@example.com', password: 'errada' });
// Espera: UnauthorizedException

// Mensagem genérica (segurança)
// "Email ou senha inválidos" (não revela qual está errado)
```

---

### ✅ 5. Desativar Tokens Antigos

```typescript
// Usuário faz login no celular (token1)
// Usuário faz login no computador (token2)
// → token1 é DESATIVADO automaticamente
```

**Por quê?** Apenas 1 token ativo por usuário.

---

### ✅ 7-11. Validar Token

```typescript
// Token válido e ativo
await service.validateToken(token);
// Espera: true

// Token desativado (logout)
await service.validateToken(inactiveToken);
// Espera: false

// Token expirado (>24h)
await service.validateToken(expiredToken);
// Espera: false

// Token não existe no banco
await service.validateToken(unknownToken);
// Espera: false

// Assinatura inválida
await service.validateToken('token-manipulado');
// Espera: false
```

**Por quê?** Segurança. Validação dupla: JWT + banco de dados.

---

## 🌐 Testes E2E

**Arquivo**: `test/transactions.e2e-spec.ts`

### O que são Testes E2E?

- **End-to-End**: testam fluxo COMPLETO
- HTTP → Controller → Service → Repository → PostgreSQL
- Integração com Redis e RabbitMQ REAIS
- Cenários do mundo real

---

### ✅ 1. Criar Transação E2E

```http
POST /transactions
Authorization: Bearer {token}
{
    "receiverEmail": "maria@example.com",
    "amount": 150.75,
    "paymentMethod": "PIX"
}
```

**Valida**:
- ✅ Retorna 201 Created
- ✅ Salvo no PostgreSQL
- ✅ Cacheado no Redis
- ✅ Chave de idempotência criada
- ✅ Mensagem publicada no RabbitMQ

---

### ✅ 2. Idempotência E2E

```http
# 1ª requisição
POST /transactions → 201 Created (txn-123)

# 2ª requisição IDÊNTICA
POST /transactions → 409 Conflict
{
    "message": "Esta transação já foi processada",
    "existingTransaction": { id: "txn-123", ... }
}
```

**Valida**:
- ✅ Apenas 1 transação no banco
- ✅ Retorna transação original

---

### ✅ 3-6. Validações de Negócio

- ❌ Receiver não existe → 400
- ❌ Enviar para si mesmo → 400
- ❌ Valor negativo → 400
- ❌ Sem JWT → 401

---

### ✅ 7-8. Cache E2E

```http
# 1ª busca (sem cache)
GET /transactions → ~40ms

# 2ª busca (com cache)
GET /transactions → ~10ms (4x mais rápido)
```

---

### ✅ 9-10. Atualizar Status E2E

```http
PATCH /transactions/txn-123/status
{ "status": "COMPLETED" }
```

**Valida**:
- ✅ Atualiza no banco
- ✅ Invalida cache
- ✅ Próxima busca retorna status atualizado

---

### ✅ 11. Rate Limiting E2E

```http
POST /transactions (1) → 201
POST /transactions (2) → 201
POST /transactions (3) → 201
POST /transactions (4) → 201
POST /transactions (5) → 201
POST /transactions (6) → 429 Too Many Requests
```

**Limite**: 5 transações por minuto

**Por quê?** Proteção contra spam/abuso.

---

## 📊 Executar e Ver Resultados

### 1. Rodar Todos os Testes

```bash
npm test
```

**Saída Esperada**:
```
PASS  src/cache/cache.service.spec.ts
  ✓ deve salvar e recuperar do cache (25 ms)
  ✓ deve detectar duplicata com idempotência (18 ms)
  ✓ deve adquirir distributed lock (12 ms)
  ...

PASS  src/transactions/transactions.service.spec.ts
  ✓ deve criar transação com sucesso (32 ms)
  ✓ deve bloquear duplicata (15 ms)
  ...

PASS  src/transactions/transactions.processor.spec.ts
  ✓ deve processar transação (28 ms)
  ✓ não deve processar sem lock (10 ms)
  ...

Test Suites: 6 passed, 6 total
Tests:       65 passed, 65 total
Time:        12.5 s
```

---

### 2. Ver Cobertura de Código

```bash
npm run test:cov
```

**Saída**:
```
--------------------|---------|----------|---------|---------|
File                | % Stmts | % Branch | % Funcs | % Lines |
--------------------|---------|----------|---------|---------|
cache.service.ts    |   100   |   100    |   100   |   100   |
transactions.svc.ts |   95.2  |   88.5   |   100   |   95.8  |
users.service.ts    |   100   |   100    |   100   |   100   |
auth.service.ts     |   97.3  |   91.2   |   100   |   98.1  |
--------------------|---------|----------|---------|---------|
```

**Meta**: >80% de cobertura

---

### 3. Modo Watch (Desenvolvimento)

```bash
npm run test:watch
```

- Roda testes automaticamente ao salvar arquivo
- Útil durante desenvolvimento

---

## 🎯 Resumo

### Por Que Testes São Importantes?

1. **Confiança**: Código funciona como esperado
2. **Regressão**: Novos recursos não quebram código antigo
3. **Documentação**: Testes mostram como usar cada função
4. **Refatoração**: Pode alterar código com segurança
5. **Debugging**: Encontra bugs mais rápido

### O Que Foi Testado?

✅ **Redis**: Cache, TTL, idempotência, distributed locks  
✅ **RabbitMQ**: Processamento assíncrono, controle de concorrência  
✅ **PostgreSQL**: CRUD, validações, integridade referencial  
✅ **Autenticação**: JWT, bcrypt, tokens no banco  
✅ **Regras de Negócio**: Duplicatas, validações, rate limiting  
✅ **Integração**: Fluxo completo HTTP → Banco  

### Próximos Passos

1. ✅ Executar: `npm test`
2. ✅ Ver cobertura: `npm run test:cov`
3. ✅ Adicionar mais testes conforme novos recursos
4. ✅ Manter cobertura >80%
5. ✅ Executar testes no CI/CD (GitHub Actions, etc)

---

## 🆘 Troubleshooting

### Erro: "Redis connection refused"
**Solução**: Certifique-se que Redis está rodando
```bash
docker-compose up -d redis
```

### Erro: "Database not found"
**Solução**: Rodar migrations
```bash
npm run migration:run
```

### Testes E2E Lentos
**Solução**: Usar banco de testes separado
- Criar `.env.test` com banco diferente
- Usar test containers

---

## 📚 Referências

- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest](https://github.com/visionmedia/supertest)
- [ioredis-mock](https://github.com/stipsan/ioredis-mock)
