#!/bin/bash
echo "=== Adicionando mais transações de teste ==="

TOKEN1=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste.dash2@email.com","password":"senha123"}' | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

TOKEN2=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"destino.dash@email.com","password":"senha123"}' | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

echo "1. Usuario1 -> Usuario2 (R$ 50 - Cartão)..."
curl -s -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN1" \
  -d '{"receiverEmail":"destino.dash@email.com","amount":50,"paymentMethod":"CARTAO_DE_CREDITO"}' | grep -o '"status":"[^"]*"'

sleep 2

echo ""
echo "2. Usuario2 -> Usuario1 (R$ 25 - PIX)..."
curl -s -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN2" \
  -d '{"receiverEmail":"teste.dash2@email.com","amount":25,"paymentMethod":"PIX"}' | grep -o '"status":"[^"]*"'

sleep 2

echo ""
echo "3. Usuario1 -> Usuario2 (R$ 150 - PIX)..."
curl -s -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN1" \
  -d '{"receiverEmail":"destino.dash@email.com","amount":150,"paymentMethod":"PIX"}' | grep -o '"status":"[^"]*"'

sleep 3

echo ""
echo ""
echo "Aguardando processamento..."
sleep 3

echo ""
echo "Total de transações do Usuario1:"
curl -s -X GET http://localhost:3000/transactions \
  -H "Authorization: Bearer $TOKEN1" | grep -o '"id"' | wc -l

echo ""
echo "✅ Concluído!"
