const express = require('express');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');

const app = express();
const SECRET_KEY = "bombinha_secret_key_123"; // Você pode alterar essa chave
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'db.json');

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());

// Serve arquivos estáticos diretamente da raiz
app.use(express.static(__dirname));

// --- FUNÇÕES DO BANCO DE DATA (JSON) ---
const readDB = () => {
    if (!fs.existsSync(DB_FILE)) {
        // Se o arquivo não existir, cria um modelo inicial vazio
        fs.writeFileSync(DB_FILE, JSON.stringify({ usuarios: [], ordens: [] }, null, 2));
    }
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content || '{"usuarios": [], "ordens": []}');
};

const writeDB = (data) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// --- ROTAS DE AUTENTICAÇÃO ---

// Rota de Registro (Para criar seu usuário inicial ou novos usuários)
app.post('/api/auth/register', async (req, res) => {
    try {
        const db = readDB();
        const { username, password } = req.body;

        if (db.usuarios.find(u => u.username === username)) {
            return res.status(400).json({ message: "Usuário já existe!" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        db.usuarios.push({ username, password: hashedPassword });
        writeDB(db);

        res.status(201).json({ message: "Usuário criado com sucesso!" });
    } catch (err) {
        res.status(500).json({ message: "Erro ao registrar usuário." });
    }
});

// Rota de Login
app.post('/api/auth/login', async (req, res) => {
    const db = readDB();
    const { username, password } = req.body;
    
    const user = db.usuarios.find(u => u.username === username);

    if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '24h' });
        return res.json({ auth: true, token });
    }
    
    res.status(401).json({ auth: false, message: "Usuário ou senha inválidos!" });
});

// Middleware de Proteção de Rotas (Verifica se está logado)
function verificarJWT(req, res, next) {
    const token = req.headers['x-access-token'];
    if (!token) return res.status(401).json({ message: "Token não fornecido." });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(500).json({ message: "Falha na autenticação do token." });
        req.userId = decoded.username;
        next();
    });
}

// --- ROTAS DAS ORDENS DE SERVIÇO (CRUD) ---

// Listar todas as OS
app.get('/api/os', verificarJWT, (req, res) => {
    const db = readDB();
    res.json(db.ordens);
});

// Criar nova OS
app.post('/api/os', verificarJWT, (req, res) => {
    const db = readDB();
    const novaOS = {
        id: Date.now(),
        cliente: req.body.cliente,
        equipamento: req.body.equipamento,
        status: req.body.status || 'Aberto',
        data: req.body.data || new Date().toLocaleDateString('pt-BR')
    };

    db.ordens.push(novaOS);
    writeDB(db);
    res.status(201).json(novaOS);
});

// Rota Principal (Entrega o HTML de Login)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Inicia o Servidor
app.listen(PORT, () => {
    console.log(`
    ==========================================
    🚀 BOMBINHA OS ONLINE
    📡 Porta: ${PORT}
    🔗 URL: http://localhost:${PORT}
    ==========================================
    `);
});
