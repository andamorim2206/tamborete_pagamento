# 🏦 Tamborete Pagamentos

Sistema completo de pagamentos com processamento assíncrono, cache distribuído e arquitetura escalável.

---

## 📋 1. Instruções de Instalação

### Pré-requisitos

- **Docker** (versão 20.10 ou superior)
- **Docker Compose** (versão 1.29 ou superior)
- **Git**

### Passo a Passo

#### 1.1. Clonar o repositório

```bash
git clone git@github.com:andamorim2206/tamborete_pagamento.git
cd tamborete-pagamentos
```

#### 1.2. Executar o setup

```bash
./setup.sh
```

O script irá:
- ✅ Criar arquivo `.env` se não existir
- ✅ Subir 6 containers Docker (PostgreSQL, Redis, RabbitMQ, PgAdmin, Backend, Frontend)
- ✅ Executar migrations do banco de dados
- ✅ Aguardar inicialização completa dos serviços

#### 1.3. Acessar a aplicação

| Serviço          | URL                      | Credenciais                                |
|------------------|--------------------------|-------------------------------------------|
| **Frontend**     | http://localhost:3001    | -                                         |
| **Backend API**  | http://localhost:3000    | -                                         |
| **RabbitMQ UI**  | http://localhost:15672   | Usuário: `admin` / Senha: `admin`        |
| **PgAdmin**      | http://localhost:5050    | Email: `admin@admin.com` / Senha: `admin` |

#### 1.4. Criar usuário de teste

Acesse http://localhost:3001/cadastro e crie uma conta.

#### 1.5. Executar testes

```bash
docker exec -it tamborete-backend npm test
```

---

## 🛠️ 2. Tecnologias Usadas

### Backend

| Tecnologia                | Versão   | Finalidade                              |
|---------------------------|----------|----------------------------------------|
| **Node.js**               | 18.x     | Runtime JavaScript                      |
| **NestJS**                | 11.0.1   | Framework backend                       |
| **TypeScript**            | 5.x      | Superset JavaScript com tipagem         |
| **TypeORM**               | 11.0.1   | ORM para PostgreSQL                     |
| **PostgreSQL**            | 15       | Banco de dados relacional               |
| **Redis (ioredis)**       | 5.10.1   | Cache distribuído                       |
| **RabbitMQ (amqplib)**    | 2.0.1    | Message broker para filas               |
| **Passport JWT**          | 4.0.1    | Autenticação com JWT                    |
| **bcrypt**                | 6.0.0    | Hash de senhas                          |
| **class-validator**       | 0.15.1   | Validação de DTOs                       |
| **class-transformer**     | 0.5.1    | Transformação de objetos                |
| **Jest**                  | 29.x     | Framework de testes                     |

### Frontend

| Tecnologia         | Versão   | Finalidade                              |
|--------------------|----------|----------------------------------------|
| **Next.js**        | 16.2.6   | Framework React com SSR                 |
| **React**          | 19.2.4   | Biblioteca UI                           |
| **TypeScript**     | 5.x      | Tipagem estática                        |
| **TailwindCSS**    | 4.x      | Framework CSS utilitário                |

### Infraestrutura

| Serviço       | Versão   | Finalidade                              |
|---------------|----------|----------------------------------------|
| **Docker**    | 20.10+   | Containerização                         |
| **PgAdmin**   | Latest   | Gerenciamento de banco de dados         |

---

## 🏗️ 3. Arquitetura e Design Patterns

### 3.1. Arquitetura Geral

```
┌─────────────┐
│   Next.js   │  (Frontend - Port 3001)
│  Frontend   │
└──────┬──────┘
       │ HTTP/REST
       ↓
┌─────────────┐
│   NestJS    │  (Backend - Port 3000)
│   Backend   │
└──────┬──────┘
       │
       ├─────→ PostgreSQL (Banco de dados - Port 5432)
       │
       ├─────→ Redis (Cache - Port 6379)
       │
       └─────→ RabbitMQ (Message Queue - Port 5672)
```

### 3.2. Design Patterns Implementados

#### **Repository Pattern**
- **Localização:** `backend/src/*/repositories`
- **Objetivo:** Abstrair lógica de acesso a dados
- **Exemplo:**
  ```typescript
  class TransactionsRepository {
    create(data) { ... }
    findById(id) { ... }
    updateStatus(id, status) { ... }
  }
  ```

#### **Service Layer Pattern**
- **Localização:** `backend/src/*/services`
- **Objetivo:** Concentrar regras de negócio
- **Exemplo:**
  ```typescript
  class TransactionsService {
    async create(senderId, dto) {
      // 1. Validação
      // 2. Verificação de saldo
      // 3. Criação no banco
      // 4. Publicação na fila
    }
  }
  ```

#### **DTO Pattern (Data Transfer Object)**
- **Localização:** `backend/src/*/dto`
- **Objetivo:** Validação e transformação de dados
- **Tecnologias:** `class-validator`, `class-transformer`
- **Exemplo:**
  ```typescript
  class CreateTransactionDto {
    @IsEmail()
    receiverEmail: string;

    @IsPositive()
    @Min(0.01)
    amount: number;
  }
  ```

#### **Dependency Injection**
- **Framework:** NestJS Modules
- **Objetivo:** Desacoplamento e testabilidade
- **Exemplo:**
  ```typescript
  @Injectable()
  class TransactionsService {
    constructor(
      private readonly repository: TransactionsRepository,
      private readonly cacheService: CacheService,
      private readonly rabbitClient: ClientProxy
    ) {}
  }
  ```

#### **Message Queue Pattern (Producer-Consumer)**
- **Tecnologia:** RabbitMQ
- **Objetivo:** Processamento assíncrono de transações
- **Fluxo:**
  1. Producer: `TransactionsService` publica evento `transaction.created`
  2. Queue: RabbitMQ armazena mensagem
  3. Consumer: `TransactionsProcessor` processa transação (~3s)
  4. Status atualizado: `PENDING → PROCESSING → COMPLETED/FAILED`

#### **Cache-Aside Pattern**
- **Tecnologia:** Redis
- **TTL:** 30-60 segundos
- **Estratégia:**
  ```typescript
  async findById(id) {
    // 1. Verificar cache
    const cached = await cache.get(`transaction:${id}`);
    if (cached) return cached;

    // 2. Buscar no banco
    const data = await repository.findById(id);

    // 3. Armazenar em cache
    await cache.set(`transaction:${id}`, data, 60);
    return data;
  }
  ```

#### **Guard Pattern (Authorization)**
- **Localização:** `backend/src/auth/guards`, `backend/src/common/guards`
- **Tipos:**
  - `JwtAuthGuard` - Valida token JWT
  - `AdminGuard` - Valida role de administrador
  - `ThrottlerBehindProxyGuard` - Rate limiting

#### **Idempotency Pattern**
- **Objetivo:** Prevenir transações duplicadas
- **Implementação:** Cache de 1 minuto com chave composta
- **Chave:** `idempotency:{userId}:{receiverId}:{amount}:{method}`

#### **Observer Pattern (Logging)**
- **Localização:** `backend/src/logs`
- **Objetivo:** Auditoria e debugging
- **Tipos de Logs:**
  - `USER_CREATED`, `USER_LOGIN`
  - `TRANSACTION_CREATED`, `TRANSACTION_COMPLETED`, `TRANSACTION_FAILED`
  - `RABBITMQ_SUCCESS`, `RABBITMQ_ERROR`
  - `ERROR` (com stack traces)

### 3.3. Estrutura de Módulos (Backend)

```
backend/src/
├── auth/              # Autenticação JWT
│   ├── guards/        # JwtAuthGuard, AdminGuard
│   ├── strategies/    # JWT Strategy
│   └── decorators/    # @CurrentUser
├── users/             # Gerenciamento de usuários
│   ├── entities/      # User entity
│   ├── dto/           # CreateUserDto, etc
│   └── repository/    # UsersRepository
├── transactions/      # Transações
│   ├── entities/      # Transaction entity
│   ├── enums/         # TransactionStatus, PaymentMethod
│   ├── processor/     # RabbitMQ consumer
│   └── repository/    # TransactionsRepository
├── logs/              # Sistema de logs
│   ├── entities/      # Log entity
│   └── enums/         # LogType
├── cache/             # Redis cache service
├── metrics/           # Métricas de performance
├── common/            # Guards, interceptors, filters
└── database/          # TypeORM config e migrations
```

### 3.4. Fluxo de uma Transação

```
1. Usuário cria transação no Frontend
   ↓
2. POST /transactions (Backend)
   ↓
3. TransactionsService valida dados
   ↓
4. Verificação de idempotência (Redis)
   ↓
5. Validação de saldo do sender
   ↓
6. Criação no banco (status: PENDING)
   ↓
7. Publicação no RabbitMQ (transaction.created)
   ↓
8. Invalidação de cache
   ↓
9. Retorna resposta imediata ao usuário
   ↓
10. [ASSÍNCRONO] TransactionsProcessor consome fila
    ↓
11. Acquire distributed lock (Redis)
    ↓
12. Status → PROCESSING
    ↓
13. Débito do sender + Crédito do receiver
    ↓
14. Status → COMPLETED
    ↓
15. Release lock + Invalidação de cache
    ↓
16. Frontend atualiza via polling (5s)
```

### 3.5. Segurança

- ✅ **Hash de senhas** com bcrypt (salt rounds: 10)
- ✅ **JWT** com expiração de 24h
- ✅ **Rate limiting** via Throttler Guard
- ✅ **Validação de inputs** com class-validator
- ✅ **CORS** habilitado apenas para origin específica
- ✅ **Permissionamento** por roles (USER/ADMIN)
- ✅ **Logs de auditoria** para todas operações críticas

---

## 📚 4. Documentação das Rotas

### 4.1. Authentication (`/auth`)

#### `POST /auth/login`
Realiza login e retorna token JWT.

**Request Body:**
```json
{
  "email": "usuario@email.com",
  "password": "senha123"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "João Silva",
    "email": "usuario@email.com",
    "role": "USER"
  }
}
```

**Erros:**
- `401`: Email ou senha incorretos

---

#### `GET /auth/me`
Retorna dados do usuário autenticado.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "id": "uuid",
  "name": "João Silva",
  "email": "usuario@email.com",
  "balance": 1000.00,
  "role": "USER",
  "createdAt": "2026-05-17T10:00:00Z"
}
```

**Erros:**
- `401`: Token inválido ou expirado

---

### 4.2. Users (`/users`)

#### `POST /users`
Cria novo usuário (registro).

**Request Body:**
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "Senha@123",
  "role": "USER"
}
```

**Validações:**
- Nome: 3-100 caracteres, apenas letras
- Email: formato válido, único no sistema
- Senha: mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número, 1 especial
- Role: "USER" ou "ADMIN" (opcional, padrão: "USER")

**Response (201):**
```json
{
  "id": "uuid",
  "name": "João Silva",
  "email": "joao@email.com",
  "balance": 0,
  "role": "USER",
  "createdAt": "2026-05-17T10:00:00Z"
}
```

**Erros:**
- `409`: Email já cadastrado
- `400`: Dados de validação inválidos

---

#### `GET /users` 🔒
Lista todos os usuários (apenas para usuários autenticados).

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
[
  {
    "id": "uuid1",
    "name": "João Silva",
    "email": "joao@email.com",
    "balance": 1000.00,
    "role": "USER"
  },
  {
    "id": "uuid2",
    "name": "Maria Santos",
    "email": "maria@email.com",
    "balance": 500.00,
    "role": "ADMIN"
  }
]
```

---

### 4.3. Transactions (`/transactions`)

#### `POST /transactions` 🔒
Cria nova transação.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "receiverEmail": "destinatario@email.com",
  "amount": 100.50,
  "paymentMethod": "PIX"
}
```

**Payment Methods:**
- `PIX`
- `CREDIT_CARD`
- `DEBIT_CARD`
- `BANK_TRANSFER`

**Validações:**
- Valor: mínimo R$ 0,01
- Email do destinatário: deve existir no sistema
- Não pode enviar para si mesmo
- Saldo suficiente

**Response (201):**
```json
{
  "id": "uuid",
  "senderId": "uuid-sender",
  "receiverId": "uuid-receiver",
  "senderName": "João Silva",
  "receiverName": "Maria Santos",
  "receiverEmail": "maria@email.com",
  "amount": 100.50,
  "paymentMethod": "PIX",
  "status": "PENDING",
  "createdAt": "2026-05-17T10:00:00Z",
  "updatedAt": "2026-05-17T10:00:00Z"
}
```

**Erros:**
- `400`: Saldo insuficiente, destinatário não existe, ou auto-transferência
- `409`: Transação duplicada (idempotência)
- `401`: Não autenticado

---

#### `GET /transactions?page=1&limit=10` 🔒
Lista transações do usuário com paginação.

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (opcional): Número da página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 10, máx: 50)

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "senderId": "uuid-sender",
      "receiverId": "uuid-receiver",
      "senderName": "João Silva",
      "receiverName": "Maria Santos",
      "receiverEmail": "maria@email.com",
      "amount": 100.50,
      "paymentMethod": "PIX",
      "status": "COMPLETED",
      "createdAt": "2026-05-17T10:00:00Z",
      "updatedAt": "2026-05-17T10:00:05Z"
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

---

#### `GET /transactions/:id` 🔒
Busca transação por ID.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "id": "uuid",
  "senderId": "uuid-sender",
  "receiverId": "uuid-receiver",
  "senderName": "João Silva",
  "receiverName": "Maria Santos",
  "receiverEmail": "maria@email.com",
  "amount": 100.50,
  "paymentMethod": "PIX",
  "status": "COMPLETED",
  "createdAt": "2026-05-17T10:00:00Z",
  "updatedAt": "2026-05-17T10:00:05Z"
}
```

**Erros:**
- `404`: Transação não encontrada ou sem permissão de acesso

---

#### `GET /transactions/admin/all?page=1&limit=10` 🔒👑
Lista todas as transações do sistema (apenas ADMIN).

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "data": [...],
  "meta": {...}
}
```

**Erros:**
- `403`: Usuário não é administrador

---

### 4.4. Logs (`/logs`) 🔒👑

#### `GET /logs?page=1&limit=10`
Lista logs do sistema (apenas ADMIN).

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (opcional): Número da página
- `limit` (opcional): Itens por página

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "typeLog": "TRANSACTION_CREATED",
      "message": "Transação criada com sucesso",
      "statusCode": 201,
      "userId": "uuid-user",
      "metadata": {
        "transactionId": "uuid-txn",
        "amount": 100.50
      },
      "createdAt": "2026-05-17T10:00:00Z"
    }
  ],
  "meta": {
    "total": 1000,
    "page": 1,
    "limit": 10,
    "totalPages": 100
  }
}
```

**Tipos de Log:**
- `USER_CREATED`, `USER_LOGIN`
- `TRANSACTION_CREATED`, `TRANSACTION_PROCESSING`, `TRANSACTION_COMPLETED`, `TRANSACTION_FAILED`
- `RABBITMQ_SUCCESS`, `RABBITMQ_ERROR`
- `ERROR`

---

#### `GET /logs/:id`
Busca log específico por ID (apenas ADMIN).

**Response (200):**
```json
{
  "id": "uuid",
  "typeLog": "ERROR",
  "message": "Erro ao processar transação",
  "statusCode": 500,
  "userId": "uuid-user",
  "metadata": {
    "error": "Database connection failed",
    "stack": "Error: Database connection failed\n    at ..."
  },
  "createdAt": "2026-05-17T10:00:00Z"
}
```

---

#### `GET /logs/transaction/:transactionId`
Lista todos os logs de uma transação específica (apenas ADMIN).

**Response (200):**
```json
[
  {
    "id": "uuid-1",
    "typeLog": "TRANSACTION_CREATED",
    "message": "Transação criada",
    "createdAt": "2026-05-17T10:00:00Z"
  },
  {
    "id": "uuid-2",
    "typeLog": "TRANSACTION_PROCESSING",
    "message": "Transação em processamento",
    "createdAt": "2026-05-17T10:00:01Z"
  },
  {
    "id": "uuid-3",
    "typeLog": "TRANSACTION_COMPLETED",
    "message": "Transação concluída com sucesso",
    "createdAt": "2026-05-17T10:00:05Z"
  }
]
```

---

### Status Codes Comuns

| Código | Significado                                      |
|--------|--------------------------------------------------|
| 200    | OK - Requisição bem-sucedida                     |
| 201    | Created - Recurso criado com sucesso             |
| 400    | Bad Request - Dados inválidos                    |
| 401    | Unauthorized - Token inválido ou ausente         |
| 403    | Forbidden - Sem permissão                        |
| 404    | Not Found - Recurso não encontrado               |
| 409    | Conflict - Conflito (ex: email duplicado)        |
| 429    | Too Many Requests - Rate limit excedido          |
| 500    | Internal Server Error - Erro no servidor         |

---

## 🔄 Fluxo Completo de Uso

1. **Registro:** `POST /users` com dados do usuário
2. **Login:** `POST /auth/login` para obter token JWT
3. **Criar Transação:** `POST /transactions` com token no header
4. **Acompanhar Status:** `GET /transactions` para ver histórico
5. **Logs (Admin):** `GET /logs` para auditoria completa

---

## 📞 Suporte

Para dúvidas ou problemas, abra uma issue no repositório.
