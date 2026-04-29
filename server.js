const express = require('express');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const SECRET_KEY = "sua_chave_secreta_aqui"; // Em produção, altere isso
const DB_FILE = path.join(__dirname, 'db.json');
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// --- GERENCIAMENTO DO BANCO JSON ---

const readDB = () => {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify({ usuarios: [], ordens: [] }, null, 2));
    }
    return JSON.parse(fs.readFileSync(DB_FILE));
};

const writeDB = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

// --- ROTAS DE AUTENTICAÇÃO ---

app.post('/api/auth/register', async (req, res) => {
    try {
        const db = readDB();
        const { username, password } = req.body;
        
        if (db.usuarios.find(u => u.username === username)) {
            return res.status(400).send("Usuário já existe");
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        db.usuarios.push({ username, password: hashedPassword });
        writeDB(db);
        res.status(201).send("Usuário criado com sucesso!");
    } catch (e) {
        res.status(500).send("Erro no servidor.");
    }
});

app.post('/api/auth/login', async (req, res) => {
    const db = readDB();
    const { username, password } = req.body;
    const user = db.usuarios.find(u => u.username === username);

    if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '24h' });
        return res.json({ auth: true, token });
    }
    res.status(401).json({ auth: false, message: "Credenciais inválidas" });
});

// --- MIDDLEWARE DE PROTEÇÃO ---

function verificarJWT(req, res, next) {
    const token = req.headers['x-access-token'];
    if (!token) return res.status(401).json({ auth: false, message: 'Acesso negado.' });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(500).json({ auth: false, message: 'Sessão expirada.' });
        req.userId = decoded.username;
        next();
    });
}

// --- ROTAS DE ORDENS DE SERVIÇO ---

app.get('/api/os', verificarJWT, (req, res) => {
    const db = readDB();
    res.json(db.ordens);
});

app.post('/api/os', verificarJWT, (req, res) => {
    const db = readDB();
    const novaOS = { 
        id: Date.now(), 
        ...req.body,
        criadoPor: req.userId 
    };
    db.ordens.push(novaOS);
    writeDB(db);
    res.status(201).json(novaOS);
});

app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
