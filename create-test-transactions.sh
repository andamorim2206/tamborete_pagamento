#!/bin/bash
echo "=== Criando transações de teste ==="
echo ""

# Login usuario1
echo "1. Login usuário 1 (teste.dash2@email.com)..."
TOKEN1=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste.dash2@email.com","password":"senha123"}' | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
echo "Token 1: ${TOKEN1:0:30}..."

# Criar usuario2
echo ""
echo "2. Criando usuário 2..."
curl -s -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Usuario Destino","email":"destino.dash@email.com","password":"senha123"}'

# Login usuario2
echo ""
echo ""
echo "3. Login usuário 2..."
TOKEN2=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"destino.dash@email.com","password":"senha123"}' | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
echo "Token 2: ${TOKEN2:0:30}..."

# Criar transações: usuario1 envia para usuario2
echo ""
echo "4. Criando transação 1: Usuario1 -> Usuario2 (R$ 100)..."
curl -s -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN1" \
  -d '{"receiverEmail":"destino.dash@email.com","amount":100,"paymentMethod":"PIX"}'

sleep 2

echo ""
echo "5. Criando transação 2: Usuario1 -> Usuario2 (R$ 50)..."
curl -s -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN1" \
  -d '{"receiverEmail":"destino.dash@email.com","amount":50,"paymentMethod":"CREDIT_CARD"}'

sleep 2

# Criar transação: usuario2 envia para usuario1
echo ""
echo "6. Criando transação 3: Usuario2 -> Usuario1 (R$ 25)..."
curl -s -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN2" \
  -d '{"receiverEmail":"teste.dash2@email.com","amount":25,"paymentMethod":"DEBIT_CARD"}'

sleep 2

echo ""
echo ""
echo "7. Aguardando processamento..."
sleep 3

echo ""
echo "8. Verificando transações do Usuario1..."
curl -s -X GET http://localhost:3000/transactions \
  -H "Authorization: Bearer $TOKEN1"

echo ""
echo ""
echo "✅ Transações criadas! Acesse http://localhost:3001/login com:"
echo "   Email: teste.dash2@email.com"
echo "   Senha: senha123"
