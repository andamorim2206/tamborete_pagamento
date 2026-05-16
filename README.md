# 🏦 Tamborete Pagamentos

Sistema completo de pagamentos com backend NestJS, frontend Next.js, PostgreSQL, Redis e RabbitMQ.

## 🚀 Instalação Rápida

### Windows

```bash
setup.bat
```

### Linux/Mac

```bash
chmod +x setup.sh
./setup.sh
```

Pronto! O script vai:
- ✅ Verificar Docker e Docker Compose
- ✅ Criar arquivos `.env` se não existirem
- ✅ **Gerar chave JWT segura automaticamente**
- ✅ Construir e iniciar todos os containers
- ✅ Executar migrations do banco de dados
- ✅ Configurar todo o ambiente

## 📋 Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) (versão 20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (versão 2.0+)

## 🎯 Serviços Disponíveis

Após a instalação, os seguintes serviços estarão disponíveis:

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Frontend** | http://localhost:3001 | Interface do usuário (Next.js) |
| **Backend** | http://localhost:3000 | API REST (NestJS) |
| **PgAdmin** | http://localhost:5050 | Gerenciador PostgreSQL |
| **RabbitMQ** | http://localhost:15672 | Gerenciador de filas |

### Credenciais Padrão

**Usuário de Teste:**
- Email: `teste.dash2@email.com`
- Senha: `senha123`

**PgAdmin:**
- Email: `admin@admin.com`
- Senha: `admin`

**RabbitMQ:**
- Usuário: `admin`
- Senha: `admin`

## 🏗️ Arquitetura

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Next.js   │─────▶│   NestJS    │─────▶│ PostgreSQL  │
│  (Frontend) │      │  (Backend)  │      │  (Banco)    │
└─────────────┘      └─────────────┘      └─────────────┘
                            │
                     ┌──────┴──────┐
                     │             │
                ┌────▼────┐   ┌───▼────┐
                │  Redis  │   │RabbitMQ│
                │ (Cache) │   │ (Fila) │
                └─────────┘   └────────┘
```

## 🔧 Tecnologias

### Backend
- **NestJS** 11.0.1 - Framework Node.js
- **TypeORM** 0.3.29 - ORM para banco de dados
- **PostgreSQL** 15 - Banco de dados relacional
- **Redis** 7 - Cache e armazenamento em memória
- **RabbitMQ** 3 - Mensageria e processamento assíncrono
- **JWT** - Autenticação com tokens
- **bcrypt** - Hash de senhas

### Frontend
- **Next.js** 16.2.6 - Framework React
- **React** 19.2.4 - Biblioteca UI
- **Tailwind CSS** 4.0.0 - Framework CSS
- **TypeScript** - Tipagem estática

## 📂 Estrutura do Projeto

```
tamborete-pagamentos/
├── backend/               # API NestJS
│   ├── src/
│   │   ├── auth/         # Módulo de autenticação
│   │   ├── users/        # Módulo de usuários
│   │   ├── transactions/ # Módulo de transações
│   │   ├── cache/        # Módulo de cache Redis
│   │   └── metrics/      # Módulo de métricas
│   └── test/             # Testes automatizados (69 testes)
├── frontend/             # Interface Next.js
│   ├── app/
│   │   ├── login/        # Página de login
│   │   ├── cadastro/     # Página de cadastro
│   │   ├── dashboard/    # Dashboard principal
│   │   └── nova-transacao/ # Criar transação
│   └── lib/              # Utilitários e API
├── docker-compose.yml    # Configuração Docker
├── setup.bat             # Script instalação Windows
└── setup.sh              # Script instalação Linux/Mac
```

## 💡 Funcionalidades

### ✅ Já Implementado

- **Autenticação JWT** com tokens persistidos no banco
- **Sistema de Usuários** com saldo inicial de R$ 1.000,00
- **Transações** com processamento assíncrono via RabbitMQ
- **Idempotência** nas transações (60s TTL)
- **Cache Redis** com 5 contextos diferentes
- **Rate Limiting** para proteção da API
- **Métricas** de performance (Redis, RabbitMQ, API)
- **Validação de Saldo** antes de criar transação
- **Atualização em Tempo Real** do dashboard (polling 3s)
- **Privacy** - usuário vê apenas suas transações
- **Histórico** ordenado por data decrescente
- **Status em Tempo Real**: PENDING → PROCESSING → COMPLETED
- **66 Testes Automatizados** (unit + e2e)
- **Docker Compose** com 6 serviços

## 🎮 Como Usar

### 1. Criar uma conta

```bash
# Acessar frontend
http://localhost:3001/cadastro

# Preencher dados:
Nome: Seu Nome
Email: seu@email.com
Senha: sua_senha
```

### 2. Fazer login

```bash
http://localhost:3001/login
```

### 3. Visualizar dashboard

- Veja seu saldo atual (R$ 1.000,00 inicial)
- Histórico de transações atualiza automaticamente
- Status das transações muda em tempo real

### 4. Criar transação

```bash
# Clicar em "Nova Transação"
Email destinatário: destino@email.com
Valor: 100.00
Método: PIX ou Cartão de Crédito
```

### 5. Acompanhar processamento

- Transação criada: **PENDING**
- Backend processando: **PROCESSING** (1-2s)
- Concluída: **COMPLETED** (2-4s)
- Saldo atualizado automaticamente!

## 🔄 Comandos Úteis

### Visualizar logs

```bash
# Todos os serviços
docker-compose logs -f

# Apenas backend
docker-compose logs -f backend

# Apenas frontend
docker-compose logs -f frontend
```

### Reiniciar serviços

```bash
# Todos
docker-compose restart

# Específico
docker-compose restart backend
```

### Parar containers

```bash
docker-compose down
```

### Limpar tudo (incluindo volumes)

```bash
docker-compose down -v
```

### Rodar testes

```bash
# Entrar no container do backend
docker exec -it tamborete-backend sh

# Rodar todos os testes
npm test

# Testes com coverage
npm run test:cov
```

## 🧪 Testes

O projeto possui **69 testes automatizados** (66 passando, 3 skipped):

- **Unit Tests**: Testam cada módulo isoladamente
- **E2E Tests**: Testam fluxos completos da aplicação

```bash
# Rodar testes
cd backend
npm test

# Com coverage
npm run test:cov
```

## 🐛 Troubleshooting

### Porta já em uso

```bash
# Verificar processos nas portas
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Linux/Mac
lsof -i :3000
lsof -i :3001

# Matar processo
# Windows
taskkill /PID <PID> /F

# Linux/Mac
kill -9 <PID>
```

### Containers não iniciam

```bash
# Limpar tudo e reiniciar
docker-compose down -v
docker-compose up -d --build
```

### Migrations não executam

```bash
# Executar manualmente
docker exec -it tamborete-backend npm run migration:run
```

### JWT_SECRET não foi gerado

```bash
# Editar backend/.env e adicionar:
JWT_SECRET=sua_chave_secreta_muito_longa_e_segura_aqui_com_no_minimo_32_caracteres
```

## 📊 Métricas e Observabilidade

O sistema registra métricas de:

- **Redis**: Hit/Miss rate, latência
- **RabbitMQ**: Mensagens publicadas/consumidas, tempo de processamento
- **API**: Requisições por endpoint

## 🔐 Segurança

- Senhas hasheadas com **bcrypt** (10 salt rounds)
- **JWT** para autenticação stateless
- Tokens armazenados no banco com flag `active`
- Validação de dados com **class-validator**
- **Rate limiting** para proteção contra abuso
- Transações isoladas por usuário

## 🚀 Performance

- **Cache Redis** reduz latência em ~80%
- **RabbitMQ** processa transações de forma assíncrona
- **Idempotência** previne duplicação de transações
- **Connection pooling** no PostgreSQL
- **Polling inteligente** no frontend (3s)

## 📝 Licença

Este projeto é de código aberto para fins educacionais.

## 👨‍💻 Desenvolvimento

Para contribuir ou desenvolver:

1. Clone o repositório
2. Execute `setup.bat` (Windows) ou `./setup.sh` (Linux/Mac)
3. Faça suas alterações
4. Execute os testes: `npm test`
5. Submeta um Pull Request

---

**Desenvolvido com ❤️ usando NestJS + Next.js + Docker**
