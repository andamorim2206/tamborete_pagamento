# 🏦 Tamborete Pagamentos

Sistema de pagamentos desenvolvido com NestJS, Next.js, PostgreSQL, Redis e RabbitMQ.

---

# 🚀 Como executar o projeto

## Pré-requisitos

* Docker
* Docker Compose
* Git

---

## 1. Clonar o repositório

```bash
git clone git@github.com:andamorim2206/tamborete_pagamento.git
cd tamborete-pagamentos
```

---

## 2. Subir os containers

```bash
chmod +x setup.sh
./setup.sh
```

---

## 3. Acessar a aplicação

| Serviço  | URL                    |
| -------- | ---------------------- |
| Frontend | http://localhost:3001  |
| Backend  | http://localhost:3000  |
| RabbitMQ | http://localhost:15672 |
| PgAdmin  | http://localhost:5050  |

---

# 🔐 Credenciais de teste


## RabbitMQ

* Usuário: `admin`
* Senha: `admin`

## PgAdmin

* Email: `admin@admin.com`
* Senha: `admin`

---

# 💡 Funcionalidades

* Autenticação JWT
* Cadastro e login de usuários
* Criação de transações
* Processamento assíncrono com RabbitMQ
* Cache com Redis
* Idempotência de transações
* Rate limiting
* Atualização de status em tempo real
* Histórico de transações
* Testes automatizados com Jest

---

# 🔄 Fluxo da Transação

```text
Usuário cria transação
        ↓
Status: PENDING
        ↓
RabbitMQ recebe mensagem
        ↓
Consumer processa pagamento
        ↓
Status atualizado para COMPLETED
```

---

# 🧪 Executar testes

```bash
docker exec -it tamborete-backend sh

npm test
```

---

# 🚀 Tecnologias

## Backend

* NestJS
* TypeORM
* PostgreSQL
* Redis
* RabbitMQ
* JWT
* Jest

## Frontend

* Next.js
* React
* TailwindCSS
* TypeScript

---

# 📁 Estrutura do projeto

```text
backend/
frontend/
docker-compose.yml
```

---

# 📊 Arquitetura

```text
Next.js → NestJS → PostgreSQL
                  ↓
             Redis Cache
                  ↓
               RabbitMQ
```
