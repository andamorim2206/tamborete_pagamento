# API de Usuários - Backend NestJS

## 📋 Estrutura Criada

```
backend/src/
├── users/
│   ├── dto/
│   │   ├── create-user.dto.ts          # DTO para criação
│   │   └── user-response.dto.ts         # DTO para resposta (sem senha)
│   ├── entities/
│   │   └── user.entity.ts               # Entidade TypeORM
│   ├── users.controller.ts              # Controller (Endpoints)
│   ├── users.service.ts                 # Service (UseCase/Regras de Negócio)
│   ├── users.repository.ts              # Repository (Acesso ao Banco)
│   └── users.module.ts                  # Módulo NestJS
├── database/
│   ├── data-source.ts                   # Configuração TypeORM para Migrations
│   └── migrations/
│       └── 1715793600000-CreateUsersTable.ts  # Migration da tabela users
└── main.ts                              # Configuração global (CORS, Validação)
```

## 🚀 Como Rodar

### 1. Iniciar o Banco de Dados (Docker)
```bash
docker-compose up -d postgres pgadmin redis rabbitmq
```

### 2. Rodar a Migration (já foi executada)
```bash
cd backend
npm run migration:run
```

### 3. Iniciar o Backend
```bash
npm run start:dev
```

A API estará rodando em: **http://localhost:3000**

## 📡 Endpoints

### POST /users - Criar Usuário
```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "senha123"
}
```

**Resposta (201 Created):**
```json
{
  "id": "uuid-gerado",
  "name": "João Silva",
  "email": "joao@example.com",
  "createdAt": "2026-05-15T...",
  "updatedAt": "2026-05-15T..."
}
```

### GET /users - Listar Todos os Usuários
**Resposta (200 OK):**
```json
[
  {
    "id": "uuid",
    "name": "João Silva",
    "email": "joao@example.com",
    "createdAt": "2026-05-15T...",
    "updatedAt": "2026-05-15T..."
  }
]
```

### GET /users/:id - Buscar Usuário por ID
**Resposta (200 OK):**
```json
{
  "id": "uuid",
  "name": "João Silva",
  "email": "joao@example.com",
  "createdAt": "2026-05-15T...",
  "updatedAt": "2026-05-15T..."
}
```

## ✅ Validações Implementadas

- **Nome**: Obrigatório e deve ser texto
- **Email**: Obrigatório, deve ser email válido e único
- **Senha**: Obrigatória, mínimo 6 caracteres, criptografada com bcrypt

## 🔒 Segurança

- Senha criptografada com **bcrypt** (salt rounds: 10)
- Senha **nunca é retornada** nas respostas da API
- Validação automática de DTOs com **class-validator**
- Email único no banco de dados

## 🧪 Testar a API

### Usando REST Client (VS Code Extension)
Abra o arquivo `test-api.http` e clique em "Send Request" acima de cada request.

### Usando cURL
```bash
# Criar usuário
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "password": "senha123"
  }'

# Listar usuários
curl http://localhost:3000/users

# Buscar por ID
curl http://localhost:3000/users/SEU_ID_AQUI
```

## 🗃️ Comandos de Migration

```bash
# Rodar migrations pendentes
npm run migration:run

# Reverter última migration
npm run migration:revert

# Gerar nova migration (após alterar entities)
npm run migration:generate src/database/migrations/NomeDaMigration
```

## 🏗️ Arquitetura

A aplicação segue uma arquitetura em camadas:

1. **Controller** → Recebe as requisições HTTP
2. **Service (UseCase)** → Contém a lógica de negócio
3. **Repository** → Acessa o banco de dados
4. **Entity** → Representa a estrutura da tabela

## 📦 Tecnologias

- **NestJS** - Framework Node.js
- **TypeORM** - ORM para PostgreSQL
- **PostgreSQL** - Banco de dados
- **bcrypt** - Criptografia de senhas
- **class-validator** - Validação de DTOs
- **class-transformer** - Transformação de dados
