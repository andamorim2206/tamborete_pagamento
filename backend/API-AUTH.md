# 🔐 Sistema de Autenticação JWT - Backend NestJS

## 📋 Estrutura Criada

```
backend/src/
├── auth/                                    # Módulo de Autenticação (SEPARADO)
│   ├── dto/
│   │   ├── login.dto.ts                     # DTO para login (validação)
│   │   └── login-response.dto.ts            # DTO de resposta do login
│   ├── entities/
│   │   └── user-token.entity.ts             # Entidade da tabela user_tokens
│   ├── auth.controller.ts                   # Controller (Endpoint /auth/login)
│   ├── auth.service.ts                      # Service (Lógica de autenticação)
│   ├── auth.repository.ts                   # Repository (Gerenciamento de tokens)
│   └── auth.module.ts                       # Módulo de autenticação
├── database/
│   └── migrations/
│       └── 1715794000000-CreateUserTokensTable.ts  # Migration da tabela user_tokens
└── users/                                   # Módulo de Usuários (SEPARADO)
```

## 🗄️ Tabela user_tokens

Estrutura da tabela criada pela migration:

```sql
CREATE TABLE user_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_user_tokens_user_id ON user_tokens(user_id);
CREATE INDEX idx_user_tokens_active ON user_tokens(active);
```

## 🔑 Configuração JWT

Adicionado no `.env`:
```env
JWT_SECRET=tamborete-super-secret-key-change-in-production-2026
```

**⚠️ IMPORTANTE**: Em produção, use uma chave forte e única!

## 📡 Endpoint de Login

### POST /auth/login

**Request:**
```json
{
  "email": "joao@example.com",
  "password": "senha123"
}
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 86400,
  "user": {
    "id": "506f3fe6-117c-4061-93eb-8b875022dda3",
    "name": "João Silva",
    "email": "joao@example.com"
  }
}
```

## ✅ Validações Implementadas

### 1. Validação de Campos
```json
// Campos vazios
{
  "message": [
    "Email inválido",
    "O email é obrigatório",
    "A senha é obrigatória"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

### 2. Email ou Senha Incorretos
```json
{
  "message": "Email ou senha incorretos",
  "error": "Unauthorized",
  "statusCode": 401
}
```

**🔒 Segurança**: A mensagem é genérica para não revelar se o email existe ou não.

## 🔐 Fluxo de Autenticação

1. **Recebe credenciais** (email + senha)
2. **Busca usuário** por email no banco
3. **Valida senha** usando bcrypt.compare()
4. **Desativa tokens antigos** do usuário
5. **Gera novo JWT** com payload:
   ```javascript
   {
     sub: userId,
     email: userEmail,
     name: userName
   }
   ```
6. **Calcula data de expiração** (24 horas)
7. **Salva token** na tabela `user_tokens`
8. **Retorna resposta** com token e dados do usuário

## 🏗️ Arquitetura (Padrão Repository)

```
Request → Controller → Service → Repository → Database
                 ↓
              DTO de entrada
                 ↓
         Validação automática
                 ↓
         Lógica de negócio
                 ↓
        Acesso ao banco
                 ↓
              DTO de saída
```

### **AuthController** (auth.controller.ts)
- Define o endpoint POST /auth/login
- Valida DTOs automaticamente
- Retorna resposta HTTP

### **AuthService** (auth.service.ts)
- Valida credenciais do usuário
- Compara senha com hash bcrypt
- Gera token JWT
- Gerencia ciclo de vida dos tokens
- Contém toda a lógica de negócio

### **AuthRepository** (auth.repository.ts)
- Cria novos tokens no banco
- Busca tokens ativos
- Desativa tokens expirados
- Desativa todos os tokens de um usuário

### **DTOs**
- **LoginDto**: Validação de entrada (email + senha)
- **LoginResponseDto**: Formato padronizado de resposta

## 🛡️ Segurança Implementada

✅ Senha comparada com bcrypt (nunca em texto plano)  
✅ Token JWT assinado com secret  
✅ Token salvo no banco (permite invalidação)  
✅ Tokens antigos desativados automaticamente  
✅ Expiração de 24 horas  
✅ Validação automática de DTOs  
✅ Mensagens de erro genéricas (não revela info sensível)  
✅ Foreign key com CASCADE (limpa tokens ao deletar usuário)  
✅ Índices para otimizar buscas  

## 🔧 Comandos Úteis

```bash
# Rodar migrations
npm run migration:run

# Reverter migration
npm run migration:revert

# Testar login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joao@example.com","password":"senha123"}'
```

## 🧪 Testes Realizados

✅ **Login com sucesso** → Token JWT gerado  
✅ **Email incorreto** → 401 Unauthorized  
✅ **Senha incorreta** → 401 Unauthorized  
✅ **Campos vazios** → 400 Bad Request com mensagens de validação  
✅ **Token salvo no banco** → Verificado no PostgreSQL  
✅ **Tokens antigos desativados** → Campo `active = false`  

## 📦 Dependências Instaladas

```json
{
  "@nestjs/jwt": "^latest",
  "@nestjs/passport": "^latest",
  "passport": "^latest",
  "passport-jwt": "^latest",
  "passport-local": "^latest",
  "@types/passport-jwt": "^latest",
  "@types/passport-local": "^latest"
}
```

## 🚀 Próximos Passos Sugeridos

1. **Criar Guard JWT** para proteger rotas privadas
2. **Implementar Refresh Token** para renovar token expirado
3. **Criar endpoint de Logout** para desativar token atual
4. **Adicionar Rate Limiting** para prevenir força bruta
5. **Implementar 2FA** (Two-Factor Authentication)
6. **Criar middleware de extração** do usuário autenticado

## 📝 Exemplo de Uso no Insomnia/Postman

### 1. Login
```
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "joao@example.com",
  "password": "senha123"
}
```

### 2. Usar Token (para próximas implementações)
```
GET http://localhost:3000/alguma-rota-protegida
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🎯 Diferenças do Módulo Users

- **Pasta separada** (`auth/` vs `users/`)
- **Repositório próprio** (AuthRepository vs UsersRepository)
- **Foco diferente**: autenticação vs cadastro
- **Tabela própria**: `user_tokens` para armazenar tokens
- **Não mistura responsabilidades**: princípio Single Responsibility

## ✨ Conclusão

Sistema de autenticação JWT completo, seguro e seguindo as melhores práticas:

- ✅ Arquitetura em camadas bem definida
- ✅ Validações robustas
- ✅ Segurança com bcrypt + JWT
- ✅ Tokens persistidos no banco
- ✅ Gerenciamento de ciclo de vida dos tokens
- ✅ Mensagens de erro apropriadas
- ✅ Código limpo e organizado
- ✅ Migration versionada
- ✅ Totalmente testado e funcionando! 🎉
