#!/bin/bash

# Limpa a tela
clear

echo "=========================================="
echo "      INICIALIZADOR BOMBINHA OS           "
echo "=========================================="

# 1. Backup Automático (PUSH) antes de iniciar
echo "🔄 Sincronizando com GitHub antes de iniciar..."

# Adiciona arquivos (incluindo db.json e pasta ordens_txt)
git add .

# Mensagem de commit com data e hora
DATA_ATUAL=$(date +"%d-%m-%Y %H:%M:%S")
git commit -m "Sincronização pré-boot: $DATA_ATUAL"

# Tenta fazer o push
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ Sincronização concluída com sucesso!"
else
    echo "⚠️  Aviso: Não foi possível sincronizar com o GitHub."
    echo "Verifique sua internet ou token. O servidor iniciará mesmo assim..."
fi

echo "------------------------------------------"

# 2. Verifica dependências
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências necessárias..."
    npm install express fs jsonwebtoken bcryptjs cors path
fi

# 3. Inicia o servidor
echo "🚀 Servidor rodando em: http://localhost:3000"
echo "👤 Login: admin | Senha: 123"
echo "------------------------------------------"
echo "Pressione CTRL+C para encerrar o sistema."
echo "------------------------------------------"

node server.js
