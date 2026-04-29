const API_URL = '/api/os';

document.addEventListener('DOMContentLoaded', () => {
    verificarAcesso();
});

async function verificarAcesso() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    carregarOS();
}

async function carregarOS() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(API_URL, {
            headers: { 'x-access-token': token }
        });

        if (res.status === 401) {
            logoutForçado();
            return;
        }

        const dados = await res.json();
        const corpo = document.getElementById('tabelaCorpo');
        corpo.innerHTML = dados.map(os => `
            <tr>
                <td>#${String(os.id).slice(-4)}</td>
                <td>${os.cliente}</td>
                <td>${os.equipamento}</td>
                <td><span class="badge ${os.status.toLowerCase().replace(' ', '-')}">${os.status}</span></td>
                <td>${os.data}</td>
            </tr>
        `).join('');
    } catch (err) {
        console.error("Erro ao carregar:", err);
    }
}

async function salvarOS() {
    const token = localStorage.getItem('token');
    const cliente = document.getElementById('cliente').value;
    const equipamento = document.getElementById('equipamento').value;
    const status = document.getElementById('status').value;

    if (!cliente || !equipamento) {
        Swal.fire('Erro!', 'Por favor, preencha todos os campos.', 'error');
        return;
    }

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-access-token': token 
            },
            body: JSON.stringify({ cliente, equipamento, status, data: new Date().toLocaleDateString('pt-BR') })
        });

        if (res.ok) {
            fecharModal();
            document.getElementById('cliente').value = '';
            document.getElementById('equipamento').value = '';
            carregarOS();
            Swal.fire({
                icon: 'success',
                title: 'OS Criada!',
                showConfirmButton: false,
                timer: 1500
            });
        }
    } catch (err) {
        Swal.fire('Erro!', 'Não foi possível salvar.', 'error');
    }
}

function abrirModal() { document.getElementById('modal').style.display = 'block'; }
function fecharModal() { document.getElementById('modal').style.display = 'none'; }

function logout() {
    Swal.fire({
        title: 'Deseja sair?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sim',
        cancelButtonText: 'Não'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        }
    });
}

function logoutForçado() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}
