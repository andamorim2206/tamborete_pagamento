# 📖 Documentação Completa - Módulo de Transações com RabbitMQ

## 🎯 Visão Geral do Sistema

Este módulo implementa um **sistema de transações assíncronas** usando **RabbitMQ** para processamento em background. 

### Como funciona:
1. **Cliente** faz POST /transactions com dados da transação
2. **API** salva no banco com status `PENDING` e retorna resposta imediata
3. **RabbitMQ** publica mensagem na fila `transactions_queue`
4. **Worker** escuta a fila e processa a transação
5. **Status** é atualizado: `PENDING` → `PROCESSING` → `COMPLETED` (ou `FAILED` se der erro)

---

## 📁 Estrutura de Arquivos Criados

```
backend/src/transactions/
├── entities/
│   └── transaction.entity.ts          # Modelo do banco (tabela transactions)
├── dto/
│   ├── create-transaction.dto.ts      # Validação entrada POST
│   ├── update-transaction-status.dto.ts # Validação entrada PATCH
│   └── transaction-response.dto.ts    # Formato de saída (response)
├── enums/
│   ├── payment-method.enum.ts         # Enum PIX e CARTAO_DE_CREDITO
│   └── transaction-status.enum.ts     # Enum PENDING, PROCESSING, COMPLETED, FAILED
├── transactions.controller.ts          # Endpoints REST
├── transactions.service.ts             # Lógica de negócio
├── transactions.repository.ts          # Acesso ao banco
├── transactions.processor.ts           # Worker RabbitMQ (Consumidor)
└── transactions.module.ts              # Configuração do módulo
```

---

## 🗄️ Estrutura do Banco de Dados

### Tabela: `transactions`

| Campo          | Tipo                       | Descrição                              |
|----------------|----------------------------|----------------------------------------|
| id             | uuid (PK)                  | ID único da transação                  |
| sender_id      | uuid (FK → users)          | Quem envia o dinheiro                  |
| receiver_id    | uuid (FK → users)          | Quem recebe o dinheiro                 |
| amount         | decimal(10,2)              | Valor da transação (ex: 150.50)        |
| payment_method | payment_method_enum        | PIX ou CARTAO_DE_CREDITO               |
| status         | transaction_status_enum    | PENDING, PROCESSING, COMPLETED, FAILED |
| created_at     | timestamp                  | Data/hora de criação                   |

### Foreign Keys
- `sender_id` → `users(id)` ON DELETE CASCADE
- `receiver_id` → `users(id)` ON DELETE CASCADE

### Índices (para performance)
- `idx_transactions_sender_id` - Buscar transações enviadas por um usuário
- `idx_transactions_receiver_id` - Buscar transações recebidas por um usuário
- `idx_transactions_status` - Filtrar por status

---

## 🔐 Autenticação

**TODAS as rotas de transações exigem autenticação JWT!**

Você precisa:
1. Fazer login: `POST /auth/login`
2. Pegar o token da resposta
3. Enviar em todas as requisições: `Authorization: Bearer SEU_TOKEN`

---

## 🚀 Como Testar a API

### 1️⃣ Fazer Login (obter token)

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@example.com",
    "password": "senha123"
  }'
```

**Resposta:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 86400,
  "user": {
    "id": "506f3fe6-...",
    "name": "João Silva",
    "email": "joao@example.com"
  }
}
```

⚠️ **Copie o `accessToken` para usar nas próximas requisições!**

---

### 2️⃣ Criar Transação (POST /transactions)

```bash
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "receiverEmail": "maria@example.com",
    "amount": 150.50,
    "paymentMethod": "PIX"
  }'
```

**Campos:**
- `receiverEmail`: Email do destinatário (será convertido para receiverId)
- `amount`: Valor a transferir (deve ser positivo)
- `paymentMethod`: "PIX" ou "CARTAO_DE_CREDITO"

**Resposta (201 Created):**
```json
{
  "id": "9a7c8f2e-...",
  "senderId": "506f3fe6-...",
  "senderName": "João Silva",
  "senderEmail": "joao@example.com",
  "receiverId": "7d4e9b3a-...",
  "receiverName": "Maria Santos",
  "receiverEmail": "maria@example.com",
  "amount": 150.50,
  "paymentMethod": "PIX",
  "status": "PENDING",
  "createdAt": "2026-05-15T19:58:30.123Z"
}
```

**O que acontece nos bastidores:**
1. ✅ API valida os dados (email válido, valor positivo, método válido)
2. ✅ Busca o receiver pelo email
3. ✅ Salva transação no banco com status `PENDING`
4. ✅ Publica mensagem no RabbitMQ (`transaction.created`)
5. ✅ Retorna resposta imediata para o cliente
6. 🐰 Worker do RabbitMQ pega a mensagem e começa a processar
7. 🔄 Status muda para `PROCESSING`
8. ⏳ Simula processamento de 3 segundos
9. ✅ Status muda para `COMPLETED`

---

### 3️⃣ Listar Todas as Transações (GET /transactions)

```bash
curl -X GET http://localhost:3000/transactions \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta (200 OK):**
```json
[
  {
    "id": "9a7c8f2e-...",
    "senderId": "506f3fe6-...",
    "senderName": "João Silva",
    "senderEmail": "joao@example.com",
    "receiverId": "7d4e9b3a-...",
    "receiverName": "Maria Santos",
    "receiverEmail": "maria@example.com",
    "amount": 150.50,
    "paymentMethod": "PIX",
    "status": "COMPLETED",
    "createdAt": "2026-05-15T19:58:30.123Z"
  },
  {
    "id": "8b6d7c1f-...",
    "senderId": "7d4e9b3a-...",
    "senderName": "Maria Santos",
    "senderEmail": "maria@example.com",
    "receiverId": "506f3fe6-...",
    "receiverName": "João Silva",
    "receiverEmail": "joao@example.com",
    "amount": 200.00,
    "paymentMethod": "CARTAO_DE_CREDITO",
    "status": "PROCESSING",
    "createdAt": "2026-05-15T19:59:00.456Z"
  }
]
```

---

### 4️⃣ Buscar Transação Específica (GET /transactions/:id)

```bash
curl -X GET http://localhost:3000/transactions/9a7c8f2e-... \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta (200 OK):** Mesmo formato do POST

**Erro (404 Not Found):**
```json
{
  "statusCode": 404,
  "message": "Transação não encontrada"
}
```

---

### 5️⃣ Atualizar Status Manualmente (PATCH /transactions/:id/status)

```bash
curl -X PATCH http://localhost:3000/transactions/9a7c8f2e-.../status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "status": "FAILED"
  }'
```

**Campos:**
- `status`: "PENDING", "PROCESSING", "COMPLETED" ou "FAILED"

⚠️ **Normalmente você não precisa usar essa rota, o Worker atualiza automaticamente!**  
Ela existe para casos especiais (debug, correções manuais, etc).

---

## 🐰 Como o RabbitMQ Funciona

### Arquitetura

```
┌─────────────┐      ┌─────────────┐      ┌──────────────────┐
│   Cliente   │─────▶│  API REST   │─────▶│   PostgreSQL     │
│  (curl/app) │      │  (NestJS)   │      │   (transactions) │
└─────────────┘      └─────────────┘      └──────────────────┘
                            │
                            │ emit('transaction.created')
                            ▼
                     ┌─────────────┐
                     │  RabbitMQ   │
                     │    Queue    │
                     └─────────────┘
                            │
                            │ consume message
                            ▼
                     ┌─────────────┐      ┌──────────────────┐
                     │   Worker    │─────▶│   PostgreSQL     │
                     │ (Processor) │      │ (update status)  │
                     └─────────────┘      └──────────────────┘
```

### Fluxo Detalhado

1. **POST /transactions**
   - Service cria transação com status `PENDING`
   - `this.rabbitClient.emit('transaction.created', {...})` publica na fila

2. **RabbitMQ Queue**
   - Fila: `transactions_queue`
   - Durable: `true` (mensagens persistem se RabbitMQ cair)
   - URL: `amqp://admin:admin@localhost:5672`

3. **Processor (Worker)**
   - `@EventPattern('transaction.created')` escuta a fila
   - Recebe mensagem com: `{transactionId, senderId, receiverId, amount, paymentMethod}`
   - Atualiza status: `PENDING` → `PROCESSING`
   - Processa (simula 3 segundos)
   - Atualiza status: `PROCESSING` → `COMPLETED` (ou `FAILED` se erro)

### Por que usar RabbitMQ?

✅ **Resposta rápida**: API retorna imediatamente, não trava esperando processamento  
✅ **Escalabilidade**: Múltiplos workers podem processar mensagens em paralelo  
✅ **Confiabilidade**: Se o servidor cair, mensagens não são perdidas (durable queue)  
✅ **Desacoplamento**: API e processamento são independentes  
✅ **Retry automático**: Se worker falhar, mensagem volta para a fila

---

## 📊 Logs do Backend

Quando você criar uma transação, verá logs assim no terminal:

```
[Nest] 109631  - LOG [TransactionsProcessor] 📨 Recebendo transação para processar: 9a7c8f2e-...
[Nest] 109631  - LOG [TransactionsProcessor] ⏳ Transação 9a7c8f2e-... em processamento...
[Nest] 109631  - LOG [TransactionsProcessor] ✅ Transação 9a7c8f2e-... completada com sucesso!
```

Se der erro:
```
[Nest] 109631  - ERROR [TransactionsProcessor] ❌ Erro ao processar transação 9a7c8f2e-...: Error message
```

---

## ❌ Tratamento de Erros

### Erro 400: Dados inválidos

```bash
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "receiverEmail": "email-invalido",
    "amount": -10,
    "paymentMethod": "BOLETO"
  }'
```

**Resposta:**
```json
{
  "statusCode": 400,
  "message": [
    "Email do destinatário inválido",
    "O valor deve ser positivo",
    "Método de pagamento inválido. Use: PIX ou CARTAO_DE_CREDITO"
  ],
  "error": "Bad Request"
}
```

### Erro 400: Receiver não encontrado

```bash
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "receiverEmail": "naoexiste@example.com",
    "amount": 100,
    "paymentMethod": "PIX"
  }'
```

**Resposta:**
```json
{
  "statusCode": 400,
  "message": "Usuário destinatário não encontrado"
}
```

### Erro 400: Enviar para si mesmo

```bash
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "receiverEmail": "joao@example.com",  # Seu próprio email!
    "amount": 100,
    "paymentMethod": "PIX"
  }'
```

**Resposta:**
```json
{
  "statusCode": 400,
  "message": "Não é possível enviar transação para si mesmo"
}
```

### Erro 401: Sem autenticação

```bash
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "receiverEmail": "maria@example.com",
    "amount": 100,
    "paymentMethod": "PIX"
  }'
```

**Resposta:**
```json
{
  "statusCode": 401,
  "message": "Token inválido ou expirado"
}
```

### Erro 404: Transação não encontrada

```bash
curl -X GET http://localhost:3000/transactions/id-inexistente \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Resposta:**
```json
{
  "statusCode": 404,
  "message": "Transação não encontrada"
}
```

---

## 🔍 Consultar no Banco de Dados

### Via pgAdmin (http://localhost:5050)

1. Login: `admin@admin.com` / `admin`
2. Conectar ao servidor PostgreSQL:
   - Host: `postgres` (nome do container)
   - Port: `5432`
   - User: `postgres`
   - Password: `postgres`
3. Database: `tamborete_db`
4. Query:

```sql
-- Listar todas as transações com nomes dos usuários
SELECT 
  t.id,
  s.name as sender_name,
  s.email as sender_email,
  r.name as receiver_name,
  r.email as receiver_email,
  t.amount,
  t.payment_method,
  t.status,
  t.created_at
FROM transactions t
JOIN users s ON t.sender_id = s.id
JOIN users r ON t.receiver_id = r.id
ORDER BY t.created_at DESC;

-- Contar transações por status
SELECT status, COUNT(*) as total
FROM transactions
GROUP BY status;

-- Transações de um usuário específico (enviadas)
SELECT * FROM transactions
WHERE sender_id = 'SEU_USER_ID'
ORDER BY created_at DESC;

-- Transações recebidas por um usuário
SELECT * FROM transactions
WHERE receiver_id = 'SEU_USER_ID'
ORDER BY created_at DESC;
```

---

## 🐰 Interface do RabbitMQ (http://localhost:15672)

1. Login: `admin` / `admin`
2. Vá em **Queues** → `transactions_queue`
3. Você verá:
   - **Ready**: Mensagens aguardando processamento
   - **Unacked**: Mensagens sendo processadas
   - **Total**: Total de mensagens

### Monitorar mensagens

- **Get messages**: Ver mensagens na fila (não remove)
- **Message rates**: Gráfico de publicação/consumo
- **Connections**: Verificar se o app está conectado

---

## 🧪 Cenários de Teste

### Cenário 1: Transação Bem-Sucedida

1. Criar 2 usuários (POST /users)
2. Fazer login com usuário 1
3. Criar transação para usuário 2
4. Esperar 3 segundos
5. Buscar transação novamente (GET /transactions/:id)
6. Status deve estar `COMPLETED`

### Cenário 2: Múltiplas Transações Simultâneas

1. Criar 5 transações rapidamente
2. Todas começam com `PENDING`
3. Worker processa uma por vez (ou em paralelo se tiver múltiplos workers)
4. Após ~15 segundos (5 × 3s), todas devem estar `COMPLETED`

### Cenário 3: RabbitMQ Offline

1. Parar RabbitMQ: `docker stop tamborete-rabbitmq`
2. Tentar criar transação
3. **Vai funcionar!** (salva no banco com `PENDING`)
4. Iniciar RabbitMQ: `docker start tamborete-rabbitmq`
5. Worker processa automaticamente quando reconectar

### Cenário 4: Processamento com Erro

1. Modificar `transactions.processor.ts`:
   ```typescript
   private async simulateProcessing(): Promise<void> {
       throw new Error('Simulando erro no processamento');
   }
   ```
2. Criar transação
3. Status deve mudar para `FAILED`
4. Ver log de erro no terminal

---

## 🚀 Melhorias Futuras (Produção)

No código atual, o processamento é **simulado** com `setTimeout(3000)`. Em produção, você faria:

### 1. Validação de Saldo
```typescript
// No processor
const sender = await this.usersRepository.findById(data.senderId);
if (sender.balance < data.amount) {
    throw new Error('Saldo insuficiente');
}
```

### 2. Integração com APIs de Pagamento
```typescript
if (data.paymentMethod === PaymentMethod.PIX) {
    // Chamar API do banco para criar chave PIX
    const pixKey = await this.pixService.generateKey(data);
    // Enviar para destinatário
    await this.pixService.transfer(pixKey, data.amount);
} else if (data.paymentMethod === PaymentMethod.CREDIT_CARD) {
    // Integrar com gateway de pagamento (Stripe, PayPal, etc)
    await this.paymentGateway.charge(data);
}
```

### 3. Webhooks / Notificações
```typescript
// Notificar usuários por email ou push notification
await this.notificationService.send({
    to: sender.email,
    subject: 'Transação realizada',
    body: `Você enviou R$ ${data.amount} para ${receiver.name}`,
});
```

### 4. Retry com Backoff
```typescript
// No módulo RabbitMQ
queueOptions: {
    durable: true,
    arguments: {
        'x-message-ttl': 60000, // Mensagem expira em 60s
        'x-max-retries': 3,     // Tentar 3 vezes antes de ir para DLQ
    },
},
```

### 5. Dead Letter Queue (DLQ)
```typescript
// Para mensagens que falharam após múltiplas tentativas
queueOptions: {
    deadLetterExchange: 'transactions_dlx',
    deadLetterRoutingKey: 'transactions_failed',
},
```

---

## 📝 Checklist de Implementação

✅ Entity criada (`transaction.entity.ts`)  
✅ Migration executada (tabela + enums + foreign keys + índices)  
✅ DTOs criados (validação de entrada e saída)  
✅ Repository criado (acesso ao banco)  
✅ Service criado (lógica de negócio + publicar no RabbitMQ)  
✅ Controller criado (4 endpoints REST)  
✅ Processor criado (worker assíncrono)  
✅ Module configurado (RabbitMQ client registrado)  
✅ App.module atualizado (imports TransactionsModule)  
✅ main.ts atualizado (microservice conectado)  
✅ Dependências instaladas (`@nestjs/microservices`, `amqplib`)  
✅ Backend rodando com RabbitMQ ativo  

---

## 🎉 Conclusão

Você agora tem um **sistema completo de transações com processamento assíncrono**!

**Características:**
- ✅ REST API com 4 endpoints
- ✅ Autenticação JWT obrigatória
- ✅ Validação robusta de dados
- ✅ RabbitMQ para processamento assíncrono
- ✅ Status da transação em tempo real
- ✅ Logs detalhados
- ✅ Tratamento de erros
- ✅ Escalável e confiável

**Próximos passos sugeridos:**
1. Testar todos os endpoints com curl
2. Ver logs do Worker no terminal
3. Monitorar fila no RabbitMQ UI
4. Consultar dados no pgAdmin
5. Implementar melhorias para produção (validação de saldo, APIs de pagamento, etc)

---

## 📞 Comandos Úteis

```bash
# Ver logs do backend
cd backend && npm run start:dev

# Rodar migration
npm run migration:run

# Reverter migration
npm run migration:revert

# Ver containers rodando
docker ps

# Logs do RabbitMQ
docker logs tamborete-rabbitmq

# Parar RabbitMQ
docker stop tamborete-rabbitmq

# Iniciar RabbitMQ
docker start tamborete-rabbitmq

# Conectar ao PostgreSQL (terminal)
docker exec -it tamborete-postgres psql -U postgres -d tamborete_db

# Query direto no PostgreSQL
docker exec -it tamborete-postgres psql -U postgres -d tamborete_db -c "SELECT * FROM transactions;"
```

---

**Data de criação:** 15/05/2026  
**Versão do NestJS:** 11.0.1  
**Versão do RabbitMQ:** 3-management-alpine  
**Autor:** Sistema de Pagamentos Tamborete
