const API_URL = '/api/os';

// Executa ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        verificarAcesso();
    }
});

// Verifica se o token existe e é válido
async function verificarAcesso() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    carregarOS();
}

// Busca as OS do servidor
async function carregarOS() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(API_URL, {
            headers: { 'x-access-token': token }
        });

        if (res.status === 401 || res.status === 500) {
            logout();
            return;
        }

        const dados = await res.json();
        renderizarTabela(dados);
    } catch (erro) {
        console.error("Erro ao buscar dados:", erro);
    }
}

// Renderiza os dados no HTML
function renderizarTabela(dados) {
    const corpo = document.getElementById('tabelaCorpo');
    if (!corpo) return;

    corpo.innerHTML = dados.map(os => `
        <tr>
            <td>#${String(os.id).slice(-4)}</td>
            <td>${os.cliente}</td>
            <td>${os.equipamento}</td>
            <td><span class="status-badge ${os.status.toLowerCase().replace(' ', '-')}">${os.status}</span></td>
            <td>${os.data}</td>
        </tr>
    `).join('');
}

// Salva uma nova OS
async function salvarOS() {
    const token = localStorage.getItem('token');
    const btn = document.querySelector('.modal-content button');
    
    const dados = {
        cliente: document.getElementById('cliente').value,
        equipamento: document.getElementById('equipamento').value,
        status: document.getElementById('status').value,
        data: new Date().toLocaleDateString('pt-BR')
    };

    if (!dados.cliente || !dados.equipamento) {
        alert("Preencha todos os campos!");
        return;
    }

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-access-token': token 
            },
            body: JSON.stringify(dados)
        });

        if (res.ok) {
            fecharModal();
            limparFormulario();
            carregarOS();
        } else {
            alert("Erro ao salvar OS.");
        }
    } catch (erro) {
        console.error("Erro na requisição:", erro);
    }
}

// Funções de Interface
function abrirModal() { document.getElementById('modal').style.display = 'block'; }
function fecharModal() { document.getElementById('modal').style.display = 'none'; }
function limparFormulario() {
    document.getElementById('cliente').value = '';
    document.getElementById('equipamento').value = '';
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}
