# 🛡️ Middleware de Autenticação JWT - Guards

## 📋 O que foi criado?

No NestJS, não usamos "middlewares" tradicionais para autenticação. Usamos **Guards** + **Strategies**.

### Arquivos Criados:

```
backend/src/auth/
├── strategies/
│   └── jwt.strategy.ts              # Valida e decodifica o token JWT
├── guards/
│   └── jwt-auth.guard.ts            # Guard que protege as rotas
└── decorators/
    └── current-user.decorator.ts    # Extrai usuário da request
```

## 🔐 Como Funciona?

### 1️⃣ **JWT Strategy** (jwt.strategy.ts)
```typescript
// Configuração do Passport para validar JWT
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    // Extrai token do header Authorization: Bearer <token>
    // Valida a assinatura com JWT_SECRET
    // Retorna os dados do payload (sub, email, name)
}
```

### 2️⃣ **JWT Guard** (jwt-auth.guard.ts)
```typescript
// Guard que intercepta requests
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    // Chama JwtStrategy para validar
    // Se válido: permite acesso
    // Se inválido: retorna 401 Unauthorized
}
```

### 3️⃣ **Current User Decorator** (current-user.decorator.ts)
```typescript
// Extrai dados do usuário da request
@CurrentUser() user: any
// Retorna: { id, email, name }
```

## 🚀 Como Usar?

### **Proteger uma Rota**

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
    
    // ❌ Rota PÚBLICA (sem @UseGuards)
    @Post()
    async create(@Body() dto: CreateUserDto) {
        return this.usersService.create(dto);
    }

    // ✅ Rota PROTEGIDA (com @UseGuards)
    @Get()
    @UseGuards(JwtAuthGuard)
    async findAll(@CurrentUser() user: any) {
        // user = { id, email, name }
        console.log('Usuário autenticado:', user);
        return this.usersService.findAll();
    }
}
```

### **Proteger um Controller Inteiro**

```typescript
@Controller('admin')
@UseGuards(JwtAuthGuard) // 🔒 Todas as rotas protegidas
export class AdminController {
    
    @Get('dashboard')
    getDashboard(@CurrentUser() user: any) {
        return { message: 'Dashboard', user };
    }

    @Get('users')
    getUsers(@CurrentUser() user: any) {
        return { message: 'Lista de usuários', user };
    }
}
```

## 🧪 Como Testar?

### **1. Fazer Login (Obter Token)**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joao@example.com","password":"senha123"}'
```

**Resposta:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 86400,
  "user": {...}
}
```

### **2. Acessar Rota Protegida SEM Token**
```bash
curl http://localhost:3000/users
```

**Resposta:**
```json
{
  "message": "Token inválido ou expirado",
  "error": "Unauthorized",
  "statusCode": 401
}
```

### **3. Acessar Rota Protegida COM Token**
```bash
curl http://localhost:3000/users \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Resposta:**
```json
[
  {
    "id": "uuid",
    "name": "João Silva",
    "email": "joao@example.com",
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

## 📊 Fluxo Completo

```
1. Cliente envia request
   ↓
   GET /users
   Authorization: Bearer <token>

2. JwtAuthGuard intercepta
   ↓
   Chama JwtStrategy

3. JwtStrategy valida token
   ↓
   - Verifica assinatura com JWT_SECRET
   - Decodifica payload
   - Retorna: { id, email, name }

4. Guard permite acesso
   ↓
   Injeta user na request

5. Controller recebe
   ↓
   @CurrentUser() user
   { id, email, name }

6. Resposta enviada
```

## ✅ Testes Realizados

### ✓ Sem Token → 401 Unauthorized
```bash
curl http://localhost:3000/users
# {"message":"Token inválido ou expirado","error":"Unauthorized","statusCode":401}
```

### ✓ Token Válido → 200 OK
```bash
curl http://localhost:3000/users -H "Authorization: Bearer <token>"
# [{"id":"...","name":"João Silva",...}]
```

### ✓ Token Inválido → 401 Unauthorized
```bash
curl http://localhost:3000/users -H "Authorization: Bearer token-falso"
# {"message":"Token inválido ou expirado","error":"Unauthorized","statusCode":401}
```

### ✓ @CurrentUser() Funciona
```
Console do backend:
Usuário autenticado: {
  id: '506f3fe6-117c-4061-93eb-8b875022dda3',
  email: 'joao@example.com',
  name: 'João Silva'
}
```

### ✓ Rotas Públicas Funcionam
```bash
# POST /users continua público (sem @UseGuards)
curl -X POST http://localhost:3000/users \
  -d '{"name":"Teste","email":"teste@example.com","password":"123456"}'
# ✅ Funciona sem token
```

## 🎯 Diferenças: Guard vs Middleware

| Aspecto | Middleware | Guard (NestJS) |
|---------|-----------|----------------|
| **Quando executa** | Antes de tudo | Depois dos middlewares, antes do handler |
| **Acesso ao handler** | ❌ Não sabe qual rota | ✅ Sabe qual handler será chamado |
| **Return** | void (next()) | boolean (permite/bloqueia) |
| **Uso para auth** | ❌ Não recomendado | ✅ Recomendado |

## 🔒 Por que Guards são Melhores?

1. **Contexto da rota**: Guard sabe qual controller/handler será executado
2. **Integração com Passport**: Usa strategies já testadas
3. **Melhor DX**: Decorators limpos (`@UseGuards()`)
4. **Type-safe**: TypeScript completo
5. **Testável**: Fácil de mockar em testes

## 📦 Estrutura da Autenticação Completa

```
auth/
├── strategies/
│   └── jwt.strategy.ts           # Valida JWT
├── guards/
│   └── jwt-auth.guard.ts         # Protege rotas
├── decorators/
│   └── current-user.decorator.ts # Extrai user da request
├── dto/
│   ├── login.dto.ts              # Validação login
│   └── login-response.dto.ts     # Resposta padronizada
├── entities/
│   └── user-token.entity.ts      # Tabela user_tokens
├── auth.controller.ts            # POST /auth/login
├── auth.service.ts               # Lógica de autenticação
├── auth.repository.ts            # Gerencia tokens no banco
└── auth.module.ts                # Module (exporta JwtAuthGuard)
```

## 🚀 Próximos Passos Sugeridos

1. **Proteger mais rotas** com `@UseGuards(JwtAuthGuard)`
2. **Criar roles** (admin, user) com Guard customizado
3. **Implementar refresh token** para renovar tokens
4. **Adicionar Rate Limiting** para prevenir abuso
5. **Criar decorator @Roles()** para controle de acesso
6. **Validar token no banco** (verificar se está ativo)

## 💡 Dicas de Uso

### **Extrair apenas o ID do usuário**
```typescript
@Get()
@UseGuards(JwtAuthGuard)
async findAll(@CurrentUser() user: { id: string }) {
    // Só o ID será tipado
    return this.usersService.findByUserId(user.id);
}
```

### **Proteger globalmente (todas as rotas)**
```typescript
// main.ts
app.useGlobalGuards(new JwtAuthGuard());

// Para rotas públicas, use decorator @Public()
```

### **Usar Guard em GraphQL**
```typescript
@Query()
@UseGuards(JwtAuthGuard)
users(@CurrentUser() user: any) {
    return this.usersService.findAll();
}
```

## ✨ Conclusão

Sistema de autenticação completo com Guards:

- ✅ JWT Strategy para validar tokens
- ✅ JWT Guard para proteger rotas
- ✅ @CurrentUser() decorator para extrair dados do usuário
- ✅ Aplicado em GET /users como exemplo
- ✅ Rotas públicas continuam funcionando
- ✅ Totalmente testado e funcionando! 🎉

**Guard é muito mais poderoso que middleware tradicional no NestJS!** 🛡️
