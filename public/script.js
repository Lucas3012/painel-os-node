const API_URL = '/api/os';

// Verifica login e carrega dados
window.onload = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
    } else {
        carregarOS();
    }
};

function abrirModal() {
    console.log("Abrindo modal..."); // Debug no console (F12)
    document.getElementById('modal').style.display = 'flex';
}

function fecharModal() {
    document.getElementById('modal').style.display = 'none';
}

async function carregarOS() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(API_URL, {
            headers: { 'x-access-token': token }
        });
        if (res.status === 401) return logout();

        const dados = await res.json();
        const corpo = document.getElementById('tabelaCorpo');
        corpo.innerHTML = dados.map(os => `
            <tr>
                <td>#${String(os.id).slice(-4)}</td>
                <td>${os.cliente}</td>
                <td>${os.equipamento}</td>
                <td><span class="badge ${os.status.toLowerCase()}">${os.status}</span></td>
                <td>${os.data}</td>
            </tr>
        `).join('');
    } catch (err) {
        console.error("Erro:", err);
    }
}

async function salvarOS() {
    const token = localStorage.getItem('token');
    const cliente = document.getElementById('cliente').value;
    const equipamento = document.getElementById('equipamento').value;
    const status = document.getElementById('status').value;

    if (!cliente || !equipamento) {
        return Swal.fire('Atenção', 'Preencha os campos!', 'warning');
    }

    const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-access-token': token },
        body: JSON.stringify({ cliente, equipamento, status, data: new Date().toLocaleDateString('pt-BR') })
    });

    if (res.ok) {
        fecharModal();
        Swal.fire('Sucesso!', 'OS cadastrada.', 'success');
        carregarOS();
        document.getElementById('cliente').value = '';
        document.getElementById('equipamento').value = '';
    }
}

function logout() {
    Swal.fire({
        title: 'Sair?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sim'
    }).then(r => {
        if (r.isConfirmed) {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        }
    });
}
