const express = require('express');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');

const app = express();
const SECRET_KEY = "bombinha_local_key";
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'db.json');
const TXT_FOLDER = path.join(__dirname, 'ordens_txt'); // Nome da nova pasta

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// CRIA A PASTA SE ELA NÃO EXISTIR
if (!fs.existsSync(TXT_FOLDER)) {
    fs.mkdirSync(TXT_FOLDER);
}

// Inicializa o banco com admin/123
const inicializarBanco = () => {
    if (!fs.existsSync(DB_FILE)) {
        const adminInicial = {
            usuarios: [{
                username: "admin",
                password: bcrypt.hashSync("123", 10)
            }],
            ordens: []
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(adminInicial, null, 2));
    }
};

const lerDB = () => JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
const salvarDB = (dados) => fs.writeFileSync(DB_FILE, JSON.stringify(dados, null, 2));

inicializarBanco();

// Rota de Login
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const db = lerDB();
    const user = db.usuarios.find(u => u.username === username);

    if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '24h' });
        return res.json({ auth: true, token });
    }
    res.status(401).json({ auth: false });
});

// Salvar OS e Criar Arquivo Local dentro da pasta
app.post('/api/os', (req, res) => {
    const token = req.headers['x-access-token'];
    if (!token) return res.status(401).send("Acesso negado");

    const db = lerDB();
    const novaOS = {
        id: Date.now(),
        cliente: req.body.cliente,
        equipamento: req.body.equipamento,
        status: req.body.status,
        data: new Date().toLocaleString('pt-BR')
    };

    db.ordens.push(novaOS);
    salvarDB(db);

    // SALVANDO O TXT DENTRO DA PASTA 'ordens_txt'
    const nomeArquivo = `OS_${novaOS.id}.txt`;
    const conteudoArquivo = `
        ORDEM DE SERVIÇO: #${novaOS.id}
        ---------------------------
        CLIENTE: ${novaOS.cliente}
        EQUIPAMENTO: ${novaOS.equipamento}
        STATUS: ${novaOS.status}
        DATA: ${novaOS.data}
        ---------------------------
    `;
    
    // path.join coloca o arquivo dentro da pasta definida em TXT_FOLDER
    fs.writeFileSync(path.join(TXT_FOLDER, nomeArquivo), conteudoArquivo);

    res.status(201).json(novaOS);
});

app.get('/api/os', (req, res) => {
    const db = lerDB();
    res.json(db.ordens);
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));

app.listen(PORT, () => console.log(`🚀 Bombinha OS local em: http://localhost:${PORT}`));
