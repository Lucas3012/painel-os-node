const express = require('express');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');

const app = express();
const SECRET_KEY = "sua_chave_secreta_aqui";
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'db.json');

// Middlewares
app.use(cors());
app.use(express.json());

// CONFIGURAÇÃO PARA RODAR NA RAIZ:
// Agora o servidor serve os arquivos da pasta onde ele próprio está
app.use(express.static(__dirname));

// Banco de dados JSON
const readDB = () => {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify({ usuarios: [], ordens: [] }, null, 2));
    }
    return JSON.parse(fs.readFileSync(DB_FILE));
};
const writeDB = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

// Rota principal: Entrega o login.html ao acessar o endereço
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// --- ROTAS DE AUTENTICAÇÃO ---
app.post('/api/auth/login', async (req, res) => {
    const db = readDB();
    const { username, password } = req.body;
    const user = db.usuarios.find(u => u.username === username);

    if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '24h' });
        return res.json({ auth: true, token });
    }
    res.status(401).json({ auth: false, message: "Login inválido" });
});

// Middleware de Proteção
function verificarJWT(req, res, next) {
    const token = req.headers['x-access-token'];
    if (!token) return res.status(401).send("Acesso negado");
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(500).send("Sessão expirada");
        req.userId = decoded.username;
        next();
    });
}

// --- ROTAS DE OS ---
app.get('/api/os', verificarJWT, (req, res) => {
    const db = readDB();
    res.json(db.ordens);
});

app.post('/api/os', verificarJWT, (req, res) => {
    const db = readDB();
    const novaOS = { id: Date.now(), ...req.body };
    db.ordens.push(novaOS);
    writeDB(db);
    res.status(201).json(novaOS);
});

app.listen(PORT, () => console.log(`🚀 Servidor pronto em http://localhost:${PORT}`));
