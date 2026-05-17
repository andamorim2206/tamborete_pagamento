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
chmod +x setup.sh && ./setup.sh
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
- **Node.js** 18.x + **TypeScript** 5.x
- **NestJS** 11.0.1 (Framework)
- **TypeORM** 11.0.1 + **PostgreSQL** 15
- **Redis** 5.10.1 (Cache)
- **RabbitMQ** (Message Queue)
- **Passport JWT** (Autenticação)
- **Jest** (Testes)

### Frontend
- **Next.js** 16.2.6
- **React** 19.2.4
- **TypeScript** 5.x
- **TailwindCSS** 4.x

### Infraestrutura
- **Docker** + **Docker Compose**
- **PgAdmin** (Gerenciamento DB)

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

- **Repository Pattern** - Abstração de acesso a dados
- **Service Layer Pattern** - Regras de negócio centralizadas
- **DTO Pattern** - Validação e transformação com `class-validator`
- **Dependency Injection** - Desacoplamento via NestJS modules
- **Message Queue (Producer-Consumer)** - Processamento assíncrono com RabbitMQ
- **Cache-Aside Pattern** - Redis com TTL 30-60s
- **Guard Pattern** - JwtAuthGuard, AdminGuard, ThrottlerGuard
- **Idempotency Pattern** - Prevenção de duplicatas
- **Observer Pattern** - Sistema de logs e auditoria

### 3.3. Estrutura de Módulos (Backend)

```
backend/src/
├── auth/              # Autenticação JWT + Guards
├── users/             # Gerenciamento de usuários
├── transactions/      # Transações + RabbitMQ consumer
├── logs/              # Sistema de auditoria
├── cache/             # Redis service
├── metrics/           # Métricas de performance
└── database/          # TypeORM config e migrations
```

### 3.4. Fluxo de uma Transação

```
1. POST /transactions → Validação e criação (PENDING)
2. Publicação no RabbitMQ
3. Consumer processa assincronamente (~3s)
4. Débito + Crédito de saldos
5. Status → COMPLETED
6. Invalidação de cache
7. Frontend atualiza via polling (5s)
```

### 3.5. Segurança

- ✅ **Hash de senhas** com bcrypt (salt rounds: 10)
- ✅ **JWT** com expiração de 24h
- ✅ **Rate limiting** via Throttler Guard
- ✅ **Validação de inputs** com class-validator
- ✅ **CORS** configurado
- ✅ **RBAC** - Roles USER/ADMIN
- ✅ **Logs de auditoria** completos

---

## 📚 4. Documentação das Rotas

### Principais Endpoints

#### Autenticação
- `POST /auth/login` - Login e geração de token JWT
- `GET /auth/me` - Dados do usuário autenticado

#### Usuários
- `POST /users` - Cadastro de novo usuário
- `GET /users` 🔒 - Listar usuários

#### Transações
- `POST /transactions` 🔒 - Criar transação
- `GET /transactions?page=1&limit=10` 🔒 - Listar com paginação
- `GET /transactions/:id` 🔒 - Buscar por ID
- `GET /transactions/admin/all` 🔒👑 - Todas transações (Admin)

#### Logs
- `GET /logs?page=1&limit=10` 🔒👑 - Listar logs (Admin)
- `GET /logs/:id` 🔒👑 - Buscar log específico (Admin)
- `GET /logs/transaction/:transactionId` 🔒👑 - Logs de transação (Admin)

**Legenda:** 🔒 = Requer autenticação | 👑 = Requer role ADMIN

---

## 🔄 Como Usar

1. Acesse http://localhost:3001/cadastro e crie uma conta
2. Faça login em http://localhost:3001/login
3. Crie transações enviando para outros usuários
4. Acompanhe o status em tempo real no dashboard
5. (Admin) Acesse logs em /admin/logs

---
O insomnia das rotas estao dentro do projeto .yml
