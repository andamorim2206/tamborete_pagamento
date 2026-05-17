#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "========================================"
echo "  TAMBORETE PAGAMENTOS - SETUP"
echo "========================================"
echo ""

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}[ERRO]${NC} Docker não está instalado!"
    echo "Por favor, instale o Docker: https://docs.docker.com/get-docker/"
    exit 1
fi
echo -e "${GREEN}[OK]${NC} Docker está instalado"

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}[ERRO]${NC} Docker Compose não está instalado!"
    exit 1
fi
echo -e "${GREEN}[OK]${NC} Docker Compose está instalado"
echo ""

# Verificar se arquivo .env existe no backend
if [ ! -f "backend/.env" ]; then
    echo -e "${BLUE}[INFO]${NC} Criando arquivo .env do backend..."
    cat > backend/.env << 'EOF'
NODE_ENV=development
PORT=3000

# Database
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=tamborete_pagamentos

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# RabbitMQ
RABBITMQ_URL=amqp://admin:admin@rabbitmq:5672

# JWT - Será gerado automaticamente
JWT_SECRET=PLACEHOLDER
EOF
    echo -e "${GREEN}[OK]${NC} Arquivo .env criado"
else
    echo -e "${GREEN}[OK]${NC} Arquivo .env já existe"
fi

# Gerar chave JWT se necessário
if grep -q "JWT_SECRET=PLACEHOLDER" backend/.env; then
    echo -e "${BLUE}[INFO]${NC} Gerando chave JWT segura..."
    
    # Gerar string aleatória de 64 caracteres para JWT_SECRET
    JWT_SECRET=$(openssl rand -base64 48 | tr -d "=+/" | cut -c1-64)
    
    # Se openssl não estiver disponível, usar /dev/urandom
    if [ -z "$JWT_SECRET" ]; then
        JWT_SECRET=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 64 | head -n 1)
    fi
    
    # Substituir no arquivo .env
    sed -i.bak "s/JWT_SECRET=PLACEHOLDER/JWT_SECRET=$JWT_SECRET/" backend/.env
    rm -f backend/.env.bak
    
    echo -e "${GREEN}[OK]${NC} Chave JWT gerada com sucesso"
else
    echo -e "${GREEN}[OK]${NC} Chave JWT já está configurada"
fi

# Verificar se arquivo .env existe no frontend
if [ ! -f "frontend/.env.local" ]; then
    echo -e "${BLUE}[INFO]${NC} Criando arquivo .env.local do frontend..."
    cat > frontend/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:3000
EOF
    echo -e "${GREEN}[OK]${NC} Arquivo .env.local criado"
else
    echo -e "${GREEN}[OK]${NC} Arquivo .env.local já existe"
fi

echo ""
echo "========================================"
echo "  INICIANDO CONTAINERS"
echo "========================================"
echo ""

# Verificar se containers já estão rodando
if docker-compose ps | grep -q "Up"; then
    echo -e "${BLUE}[INFO]${NC} Containers já estão rodando"
    echo ""
    read -p "Deseja reiniciar os containers? (s/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        echo -e "${BLUE}[INFO]${NC} Reiniciando containers..."
        docker-compose restart
    else
        echo -e "${YELLOW}[INFO]${NC} Mantendo containers atuais"
    fi
else
    echo -e "${BLUE}[INFO]${NC} Iniciando containers pela primeira vez..."
    docker-compose up -d --build
fi

echo ""
echo -e "${BLUE}[INFO]${NC} Aguardando serviços iniciarem..."
sleep 15

echo ""
echo "========================================"
echo "  EXECUTANDO MIGRATIONS"
echo "========================================"
echo ""

# Executar migrations no backend
if docker-compose exec -T backend npm run migration:run 2>/dev/null; then
    echo -e "${GREEN}[OK]${NC} Migrations executadas com sucesso"
else
    echo -e "${YELLOW}[AVISO]${NC} Migrations podem já estar aplicadas ou aguardando banco de dados"
fi

echo ""
echo "========================================"
echo "  CRIANDO USUÁRIOS DE TESTE"
echo "========================================"
echo ""

# Aguardar um pouco mais para garantir que o banco está pronto após migrations
echo -e "${BLUE}[INFO]${NC} Aguardando banco de dados estar completamente pronto..."
sleep 5

# Executar seed de usuários
echo -e "${BLUE}[INFO]${NC} Executando seed de usuários..."
docker-compose exec -T backend npm run seed

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}[OK]${NC} Seed executado com sucesso"
else
    echo ""
    echo -e "${RED}[ERRO]${NC} Falha ao executar seed"
    echo -e "${YELLOW}[INFO]${NC} Você pode executar manualmente: docker-compose exec backend npm run seed"
fi

echo ""
echo "========================================"
echo "  INSTALAÇÃO CONCLUÍDA!"
echo "========================================"
echo ""
echo "Serviços disponíveis:"
echo ""
echo -e "  ${GREEN}Frontend:${NC}  http://localhost:3001"
echo -e "  ${GREEN}Backend:${NC}   http://localhost:3000"
echo -e "  ${GREEN}PgAdmin:${NC}   http://localhost:5050"
echo -e "  ${GREEN}RabbitMQ:${NC}  http://localhost:15672"
echo ""
echo "========================================"
echo ""
echo "Usuários de teste criados:"
echo ""
echo -e "  ${GREEN}Admin:${NC}"
echo "    Email: admin@teste.com"
echo "    Senha: Senha@123"
echo ""
echo -e "  ${GREEN}Usuário:${NC}"
echo "    Email: usuario@teste.com"
echo "    Senha: Senha@123"
echo ""
echo "========================================"
echo ""
echo "Para ver os logs:"
echo "  docker-compose logs -f"
echo ""
echo "Para parar os containers:"
echo "  docker-compose down"
echo ""
echo "========================================"
echo ""
