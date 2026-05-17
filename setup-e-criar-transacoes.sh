#!/bin/bash

# Script para configurar usuários de teste e criar transações
# Cria os usuários se ainda não existirem, e depois roda as transações

API_URL="http://localhost:3000"

echo "🔧 Configurando usuários de teste..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Criar usuário DAVI (remetente)
echo "👤 Criando usuário: Davi Santos (davi@example.com)..."
DAVI_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/users" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Davi Santos",
    "email": "davi@example.com",
    "password": "Senha@123"
  }')

DAVI_HTTP_CODE=$(echo "$DAVI_RESPONSE" | tail -n1)
if [ "$DAVI_HTTP_CODE" == "201" ]; then
  echo "   ✅ Davi criado com sucesso!"
elif [ "$DAVI_HTTP_CODE" == "409" ] || [ "$DAVI_HTTP_CODE" == "400" ]; then
  echo "   ⚠️  Davi já existe (ok)"
else
  echo "   ❌ Erro ao criar Davi. HTTP $DAVI_HTTP_CODE"
fi

# Criar usuário JOSÉ (destinatário)
echo "👤 Criando usuário: José Silva (jose@example.com)..."
JOSE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/users" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "José Silva",
    "email": "jose@example.com",
    "password": "Senha@123"
  }')

JOSE_HTTP_CODE=$(echo "$JOSE_RESPONSE" | tail -n1)
if [ "$JOSE_HTTP_CODE" == "201" ]; then
  echo "   ✅ José criado com sucesso!"
elif [ "$JOSE_HTTP_CODE" == "409" ] || [ "$JOSE_HTTP_CODE" == "400" ]; then
  echo "   ⚠️  José já existe (ok)"
else
  echo "   ❌ Erro ao criar José. HTTP $JOSE_HTTP_CODE"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🚀 Agora criando as transações..."
echo ""

# Executar script de transações
./criar-transacoes-teste.sh
