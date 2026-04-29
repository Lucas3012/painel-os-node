const express = require('express');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');

const app = express();
const SECRET_KEY = "bombinha_local_2026";
const PORT = 3000;

const DB_FILE = path.join(__dirname, 'db.json');
const TXT_FOLDER = path.join(__dirname, 'ordens_txt');

// --- CONFIGURAÇÃO ---
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Garantir que a pasta de TXTs exista
if (!fs.existsSync(TXT_FOLDER)) {
    fs.mkdirSync(TXT_FOLDER, { recursive: true });
}

// Inicializar banco de dados com admin:123
const inicializarBanco = () => {
    if (!fs.existsSync(DB_FILE) || fs.readFileSync(DB_FILE, 'utf-8').trim().length < 5) {
        const adminData = {
            usuarios: [{
                username: "admin",
                password: bcrypt.hashSync("123", 10)
            }],
            ordens: []
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(adminData, null, 2));
        console.log("✅ BANCO CRIADO: Usuário 'admin' e senha '123' configurados.");
    }
};

const lerDB = () => JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
const salvarDB = (dados) => fs.writeFileSync(DB_FILE, JSON.stringify(dados, null, 2));

inicializarBanco();

// --- ROTAS ---

// Rota de Login (CORRIGIDA)
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const db = lerDB();
    
    const user = db.usuarios.find(u => u.username === username);

    // Usando compareSync para evitar erros de promessa no Termux
    if (user && bcrypt.compareSync(password, user.password)) {
        const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '24h' });
        console.log(`Logado com sucesso: ${username}`);
        return res.json({ auth: true, token });
    }
    
    console.log(`Tentativa de login falhou para: ${username}`);
    res.status(401).json({ auth: false, message: "Usuário ou senha incorretos" });
});

// Criar Ordem de Serviço
app.post('/api/os', (req, res) => {
    const token = req.headers['x-access-token'];
    if (!token) return res.status(401).json({ message: "Não autorizado" });

    const db = lerDB();
    const novaOS = {
        id: Date.now(),
        cliente: req.body.cliente,
        equipamento: req.body.equipamento,
        status: req.body.status || 'Aberto',
        data: new Date().toLocaleString('pt-BR')
    };

    db.ordens.push(novaOS);
    salvarDB(db);

    // Gerar arquivo TXT
    const conteudo = `
=================================
      ORDEM DE SERVIÇO: #${novaOS.id}
=================================
CLIENTE:     ${novaOS.cliente}
EQUIPAMENTO: ${novaOS.equipamento}
STATUS:      ${novaOS.status}
DATA:        ${novaOS.data}
=================================
    `;
    
    fs.writeFileSync(path.join(TXT_FOLDER, `OS_${novaOS.id}.txt`), conteudo);
    res.status(201).json(novaOS);
});

// Listar Ordens
app.get('/api/os', (req, res) => {
    const db = lerDB();
    res.json(db.ordens);
});

// Rota inicial
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.listen(PORT, () => {
    console.log(`
    ======================================
    🚀 SERVIDOR ATIVO NA PORTA ${PORT}
    🏠 ACESSE: http://localhost:${PORT}
    🔑 LOGIN: admin | SENHA: 123
    ======================================
    `);
});
