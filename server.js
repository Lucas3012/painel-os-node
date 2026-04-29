const express = require('express');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');

const app = express();
const SECRET_KEY = "bombinha_local_key_2026";
const PORT = 3000;

// Caminhos dos arquivos e pastas
const DB_FILE = path.join(__dirname, 'db.json');
const TXT_FOLDER = path.join(__dirname, 'ordens_txt');

// --- CONFIGURAÇÃO INICIAL ---
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve HTML, CSS e JS da raiz

// Garante que a pasta de TXTs exista
if (!fs.existsSync(TXT_FOLDER)) {
    fs.mkdirSync(TXT_FOLDER);
    console.log("📁 Pasta 'ordens_txt' criada.");
}

// Função para garantir que o banco exista e tenha o admin padrão
const inicializarBanco = () => {
    let criarNovo = false;

    if (!fs.existsSync(DB_FILE)) {
        criarNovo = true;
    } else {
        const conteudo = fs.readFileSync(DB_FILE, 'utf-8');
        if (conteudo.trim().length < 5) criarNovo = true;
    }

    if (criarNovo) {
        const salt = bcrypt.genSaltSync(10);
        const adminInicial = {
            usuarios: [{
                username: "admin",
                password: bcrypt.hashSync("123", salt)
            }],
            ordens: []
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(adminInicial, null, 2));
        console.log("✅ Banco de dados resetado: Usuário 'admin' com senha '123' pronto.");
    }
};

const lerDB = () => JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
const salvarDB = (dados) => fs.writeFileSync(DB_FILE, JSON.stringify(dados, null, 2));

// Executa a inicialização ao ligar o servidor
inicializarBanco();

// --- ROTAS DE AUTENTICAÇÃO ---

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const db = lerDB();
        const user = db.usuarios.find(u => u.username === username);

        if (user && await bcrypt.compare(password, user.password)) {
            const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '24h' });
            return res.json({ auth: true, token });
        }
        
        res.status(401).json({ auth: false, message: "Credenciais inválidas" });
    } catch (error) {
        res.status(500).json({ message: "Erro interno no servidor" });
    }
});

// --- ROTAS DE ORDENS DE SERVIÇO ---

app.post('/api/os', (req, res) => {
    const token = req.headers['x-access-token'];
    if (!token) return res.status(401).json({ message: "Não autorizado" });

    try {
        const db = lerDB();
        const novaOS = {
            id: Date.now(),
            cliente: req.body.cliente,
            equipamento: req.body.equipamento,
            status: req.body.status || 'Aberto',
            data: new Date().toLocaleString('pt-BR')
        };

        // 1. Salva no banco de dados JSON
        db.ordens.push(novaOS);
        salvarDB(db);

        // 2. Gera o arquivo TXT na pasta específica
        const nomeArquivo = `OS_${novaOS.id}.txt`;
        const conteudoArquivo = `
==========================================
        ORDEM DE SERVIÇO: #${novaOS.id}
==========================================
CLIENTE:     ${novaOS.cliente}
EQUIPAMENTO: ${novaOS.equipamento}
STATUS:      ${novaOS.status}
DATA:        ${novaOS.data}
==========================================
        `;
        
        fs.writeFileSync(path.join(TXT_FOLDER, nomeArquivo), conteudoArquivo);

        res.status(201).json(novaOS);
    } catch (error) {
        res.status(500).json({ message: "Erro ao salvar Ordem de Serviço" });
    }
});

app.get('/api/os', (req, res) => {
    const db = lerDB();
    res.json(db.ordens);
});

// Rota para a página inicial
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// --- INICIALIZAÇÃO ---
app.listen(PORT, () => {
    console.log(`
    -------------------------------------------
    🚀 BOMBINHA OS - SISTEMA LOCAL ATIVO
    🌐 Endereço: http://localhost:${PORT}
    👤 Login: admin | Senha: 123
    -------------------------------------------
    `);
});
