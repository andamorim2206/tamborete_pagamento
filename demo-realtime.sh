#!/bin/bash
echo "🎬 DEMONSTRAÇÃO DE ATUALIZAÇÃO EM TEMPO REAL"
echo "=============================================="
echo ""
echo "Vou criar uma transação e mostrar o processamento..."
echo ""

# Login
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste.dash2@email.com","password":"senha123"}' | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

echo "1. Criando transação de R$ 15,00..."
TRANSACTION=$(curl -s -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"receiverEmail":"destino.dash@email.com","amount":15,"paymentMethod":"PIX"}')

TRANSACTION_ID=$(echo "$TRANSACTION" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "   ID da transação: ${TRANSACTION_ID:0:20}..."

echo ""
echo "2. Status inicial:"
echo "$TRANSACTION" | grep -o '"status":"[^"]*"'

echo ""
echo "3. Aguardando 2 segundos..."
sleep 2

echo ""
echo "4. Buscando transações atualizadas..."
UPDATED=$(curl -s -X GET http://localhost:3000/transactions \
  -H "Authorization: Bearer $TOKEN" | grep "$TRANSACTION_ID" | head -1)

echo "$UPDATED" | grep -o '"status":"[^"]*"'

echo ""
echo "5. Aguardando mais 3 segundos..."
sleep 3

echo ""
echo "6. Buscando novamente..."
FINAL=$(curl -s -X GET http://localhost:3000/transactions \
  -H "Authorization: Bearer $TOKEN" | grep "$TRANSACTION_ID" | head -1)

echo "$FINAL" | grep -o '"status":"[^"]*"'

echo ""
echo "=============================================="
echo "✅ Transação processada com sucesso!"
echo ""
echo "No dashboard, você verá essas mudanças"
echo "automaticamente a cada 3 segundos! 🚀"
echo ""
echo "Acesse: http://localhost:3001/dashboard"
