#!/bin/bash

# Script de automação para o Painel OS
# Este script faz o commit/push e inicia o servidor automaticamente

echo "--- 🛠️ Iniciando Automação do Projeto OS ---"

# 1. Verificar se o Git está inicializado
if [ -d ".git" ]; then
    echo "📦 Verificando alterações no Git..."
    git add .
    
    # Verifica se há algo novo (evita erro de commit vazio)
    if git diff-index --quiet HEAD --; then
        echo "✅ Nenhuma alteração nova para o GitHub."
    else
        echo "📝 Alterações detectadas!"
        read -p "Digite a mensagem do commit: " mensagem
        if [ -z "$mensagem" ]; then
            mensagem="Atualização automática $(date +'%d/%m/%Y %H:%M')"
        fi
        git commit -m "$mensagem"
        echo "🚀 Enviando para o GitHub..."
        git push origin main
    fi
else
    echo "⚠️ Repositório Git não encontrado neste diretório."
fi

# 2. Verificar dependências
if [ ! -d "node_modules" ]; then
    echo "📥 Pasta node_modules não encontrada. Instalando dependências..."
    npm install
fi

# 3. Iniciar o servidor
echo "🌐 Iniciando servidor Node.js..."
echo "💡 Para acessar: http://localhost:3000"
echo "--- Pressione CTRL+C para encerrar ---"

node server.js
