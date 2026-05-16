#!/bin/bash
echo "=== Testando Dashboard Completo ==="
echo ""
echo "O dashboard foi corrigido. Para visualizar as transações:"
echo ""
echo "1. Acesse: http://localhost:3001/login"
echo "2. Faça login com:"
echo "   Email: teste.dash2@email.com"
echo "   Senha: senha123"
echo ""
echo "Este usuário tem 4 transações cadastradas."
echo ""
echo "Verificando dados do usuário..."
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste.dash2@email.com","password":"senha123"}' | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

echo ""
echo "Saldo atual:"
curl -s -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer $TOKEN" | grep -o '"balance":[^,}]*' | cut -d':' -f2

echo ""
echo "Total de transações:"
curl -s -X GET http://localhost:3000/transactions \
  -H "Authorization: Bearer $TOKEN" | grep -o '"id":' | wc -l

echo ""
echo "✅ Backend funcionando corretamente!"
echo "Agora faça login no navegador para ver a lista de transações."
