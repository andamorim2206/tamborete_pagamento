#!/bin/bash
echo "=== Testando fluxo completo do dashboard ==="
echo ""
echo "1. Criando usuário de teste..."
curl -s -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Usuario Teste","email":"teste.dash2@email.com","password":"senha123"}'

echo ""
echo ""
echo "2. Fazendo login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste.dash2@email.com","password":"senha123"}')
echo "$LOGIN_RESPONSE"

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
echo ""
echo "Token extraído: ${TOKEN:0:30}..."

echo ""
echo "3. Testando GET /auth/me..."
curl -s -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer $TOKEN"

echo ""
echo ""
echo "4. Testando GET /transactions (primeiras 2)..."
curl -s -X GET http://localhost:3000/transactions \
  -H "Authorization: Bearer $TOKEN"

echo ""
echo ""
echo "✅ Teste concluído - Acesse http://localhost:3001/login com:"
echo "   Email: teste.dash2@email.com"
echo "   Senha: senha123"
