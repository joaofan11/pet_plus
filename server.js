const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db'); // Nosso novo módulo de banco de dados
const bcrypt = require('bcrypt');
const multer = require('multer');

const app = express();
const PORT = 3000;

// --- Configuração do Multer para Upload de Arquivos ---
// Define onde os arquivos serão salvos e como serão nomeados
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/'); // Salva na pasta 'public/uploads'
    },
    filename: function (req, file, cb) {
        // Cria um nome de arquivo único para evitar conflitos
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// --- Middlewares ---
app.use(cors());
app.use(express.json());
// Serve os arquivos estáticos da pasta 'public', incluindo a pasta 'uploads'
app.use(express.static(path.join(__dirname, 'public'))); 
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));


// ==================== ROTAS DA API COM BANCO DE DADOS ====================

// --- Autenticação ---
app.post('/api/register', async (req, res) => {
    const { name, email, phone, password } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        
        const result = await db.query(
            'INSERT INTO users (name, email, phone, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, name, email, phone',
            [name, email, phone, passwordHash]
        );
        res.status(201).json({ message: 'Cadastro realizado com sucesso!', user: result.rows[0] });
    } catch (err) {
        if (err.code === '23505') { // Código de erro para violação de constraint 'unique'
            return res.status(409).json({ message: 'Este email já está cadastrado.' });
        }
        res.status(500).json({ message: 'Erro no servidor ao tentar registrar.' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Email ou senha incorretos.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (isMatch) {
            // Não envie o hash da senha de volta para o cliente
            delete user.password_hash; 
            res.json({ message: `Bem-vindo(a), ${user.name}!`, user });
        } else {
            res.status(401).json({ message: 'Email ou senha incorretos.' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});


// --- Pets ---
// Rota para cadastrar um pet, agora com upload de foto
app.post('/api/pets', upload.single('photo'), async (req, res) => {
    const { ownerId, name, species, breed, age, size, gender, type, description } = req.body;
    // O caminho do arquivo é disponibilizado pelo multer em req.file
    const photoPath = req.file ? `/uploads/${req.file.filename}` : null;
    const status = type === 'adoption' ? 'available' : 'personal';

    try {
        const result = await db.query(
            `INSERT INTO pets (owner_id, name, species, breed, age, size, gender, pet_type, status, description, photo_path)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
            [ownerId, name, species, breed, age, size, gender, type, status, description, photoPath]
        );
        res.status(201).json({ message: `${name} foi cadastrado com sucesso!`, pet: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao cadastrar o pet.' });
    }
});

app.get('/api/pets/adoption', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT p.*, u.name as owner_name, u.email as owner_email, u.phone as owner_phone
             FROM pets p
             JOIN users u ON p.owner_id = u.id
             WHERE p.pet_type = 'adoption' AND p.status = 'available'
             ORDER BY p.created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao buscar pets para adoção.' });
    }
});


app.get('/api/pets/my-pets/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await db.query(
            'SELECT * FROM pets WHERE owner_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao buscar seus pets.' });
    }
});

app.put('/api/pets/:petId/adopt', async (req, res) => {
    const { petId } = req.params;
    try {
        const result = await db.query(
            "UPDATE pets SET status = 'adopted' WHERE id = $1 RETURNING *",
            [petId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Pet não encontrado.' });
        }
        res.json({ message: 'Pet marcado como adotado!', pet: result.rows[0] });
    } catch (err) {
        res.status(500).json({ message: 'Erro ao atualizar o pet.' });
    }
});

// --- Rota para servir o frontend ---
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});