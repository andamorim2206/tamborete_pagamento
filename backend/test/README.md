# 📁 Estrutura de Testes

Este diretório contém todos os testes automatizados do projeto, organizados por módulo e tipo.

## 📂 Estrutura de Pastas

```
test/
├── unit/                           # Testes unitários
│   ├── cache/                      # Testes do módulo de cache (Redis)
│   │   └── cache.service.spec.ts   # 13 testes do CacheService
│   ├── transactions/               # Testes do módulo de transações
│   │   ├── transactions.service.spec.ts      # 9 testes do TransactionsService
│   │   ├── transactions.processor.spec.ts    # 6 testes do RabbitMQ Worker
│   │   └── transactions.controller.spec.ts   # 8 testes do TransactionsController
│   ├── users/                      # Testes do módulo de usuários
│   │   └── users.service.spec.ts   # 7 testes do UsersService
│   └── auth/                       # Testes do módulo de autenticação
│       └── auth.service.spec.ts    # 11 testes do AuthService
├── e2e/                            # Testes End-to-End (integração completa)
│   └── transactions/               # Testes E2E de transações
│       └── transactions.e2e-spec.ts # 11 testes E2E completos
├── app.e2e-spec.ts                 # Teste E2E da aplicação (NestJS padrão)
└── jest-e2e.json                   # Configuração do Jest para testes E2E
```

## 📊 Total de Testes

| Módulo | Tipo | Arquivo | Testes |
|--------|------|---------|--------|
| **Cache** | Unit | `cache.service.spec.ts` | 13 |
| **Transactions** | Unit | `transactions.service.spec.ts` | 9 |
| **Transactions** | Unit | `transactions.processor.spec.ts` | 6 |
| **Transactions** | Unit | `transactions.controller.spec.ts` | 8 |
| **Users** | Unit | `users.service.spec.ts` | 7 |
| **Auth** | Unit | `auth.service.spec.ts` | 11 |
| **Transactions** | E2E | `transactions.e2e-spec.ts` | 11 |
| **TOTAL** | - | - | **65+** |

## 🚀 Como Executar

### Todos os testes
```bash
npm test
```

### Apenas testes unitários
```bash
npm test -- test/unit
```

### Apenas testes E2E
```bash
npm run test:e2e
```

### Testes de um módulo específico
```bash
# Cache
npm test -- test/unit/cache

# Transactions
npm test -- test/unit/transactions

# Users
npm test -- test/unit/users

# Auth
npm test -- test/unit/auth

# E2E Transactions
npm test -- test/e2e/transactions
```

### Teste específico
```bash
npm test -- cache.service.spec.ts
npm test -- transactions.processor.spec.ts
```

### Com cobertura de código
```bash
npm run test:cov
```

### Modo watch (desenvolvimento)
```bash
npm run test:watch
```

## 📝 Convenções

### Nomenclatura de Arquivos
- Testes unitários: `*.spec.ts`
- Testes E2E: `*.e2e-spec.ts`

### Organização
- **unit/**: Testes isolados de classes individuais (services, controllers, etc)
- **e2e/**: Testes de fluxo completo (HTTP → banco de dados)

### Imports
- Todos os imports de código-fonte usam caminhos absolutos a partir de `src/`:
  ```typescript
  import { CacheService } from '../../../src/cache/cache.service';
  ```

## 🧪 O Que Cada Módulo Testa

### 🔴 Cache (Redis)
- ✅ Operações básicas (get, set, del)
- ✅ TTL (expiração automática)
- ✅ Idempotência (detectar duplicatas)
- ✅ Distributed locks (controle de concorrência)

### 💰 Transactions
- ✅ CRUD de transações
- ✅ Validações de negócio
- ✅ Cache de consultas
- ✅ Processamento assíncrono (RabbitMQ)
- ✅ Controle de concorrência entre workers

### 👤 Users
- ✅ Registro de usuários
- ✅ Hash de senhas (bcrypt)
- ✅ Validação de email único

### 🔐 Auth
- ✅ Login com JWT
- ✅ Validação de token (dupla: JWT + banco)
- ✅ Desativação de tokens antigos

### 🌐 E2E
- ✅ Fluxo completo de criação de transação
- ✅ Idempotência end-to-end
- ✅ Cache em cenário real
- ✅ Rate limiting
- ✅ Validações HTTP

## 📚 Documentação Completa

Para explicações detalhadas de cada teste, consulte:
- [`../DOCUMENTACAO_TESTES.md`](../DOCUMENTACAO_TESTES.md)
