#!/bin/bash
echo "=== Debug Transações ==="

# Login
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste.dash2@email.com","password":"senha123"}' | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

echo "Token obtido: ${TOKEN:0:30}..."
echo ""

# Buscar transações
echo "Transações do usuário:"
RESPONSE=$(curl -s -X GET http://localhost:3000/transactions \
  -H "Authorization: Bearer $TOKEN")

echo "$RESPONSE" | head -c 500
echo ""
echo ""
echo "Total de caracteres na resposta: $(echo "$RESPONSE" | wc -c)"
echo "Número de transações: $(echo "$RESPONSE" | grep -o '"id":' | wc -l)"
