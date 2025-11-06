const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const bcrypt = require('bcrypt');
const multer = require('multer');
const jwt = require('jsonwebtoken'); // <-- ALTERAÇÃO: Importar JWT

const app = express();
const PORT = 3000;

const TOKEN_SECRET = process.env.TOKEN_SECRET;

// --- Configuração do Multer --- (Sem alterações)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/'); 
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- Middlewares --- (Sem alterações)
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); 
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// ==================== MIDDLEWARE DE AUTENTICAÇÃO ====================

// ALTERAÇÃO: Middleware para verificar o Token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato "Bearer TOKEN"

    if (token == null) {
        return res.status(401).json({ message: 'Acesso negado. Token não fornecido.' });
    }

    jwt.verify(token, TOKEN_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token inválido.' });
        }
        req.user = user; // Adiciona os dados do utilizador (ex: { id: 1, name: '...'}) ao request
        next();
    });
}

// ==================== ROTAS DA API ====================

// --- Autenticação ---
app.post('/api/register', async (req, res) => {
    // ... (Lógica de registo sem alterações) ...
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
        if (err.code === '23505') { 
            return res.status(409).json({ message: 'Este email já está cadastrado.' });
        }
        res.status(500).json({ message: 'Erro no servidor ao tentar registrar.' });
    }
});

// ALTERAÇÃO: Login agora gera um token JWT
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
            delete user.password_hash; 

            // Criar o token JWT
            const userData = { id: user.id, name: user.name, email: user.email };
            const accessToken = jwt.sign(userData, TOKEN_SECRET, { expiresIn: '24h' }); // Token válido por 24 horas

            res.json({ 
                message: `Bem-vindo(a), ${user.name}!`, 
                user: userData,
                token: accessToken // Envia o token para o cliente
            });
        } else {
            res.status(401).json({ message: 'Email ou senha incorretos.' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});


// --- Pets ---

// ALTERAÇÃO: Esta rota agora é PROTEGIDA
// Apenas utilizadores logados podem registar pets para adoção
app.post('/api/pets', authenticateToken, upload.single('photo'), async (req, res) => {
    const { name, species, breed, age, size, gender, type, description, latitude, longitude } = req.body;
    const ownerId = req.user.id; // ID do utilizador vem do token verificado
    
    const photoPath = req.file ? `/uploads/${req.file.filename}` : null;
    const status = type === 'adoption' ? 'available' : 'personal';

    // Pets pessoais (type === 'personal') são tratados localmente (SQLite)
    if (type === 'personal') {
         return res.status(400).json({ message: 'Pets pessoais devem ser salvos localmente.' });
    }

    try {
        const result = await db.query(
            `INSERT INTO pets (owner_id, name, species, breed, age, size, gender, pet_type, status, description, photo_path, latitude, longitude)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
            [ownerId, name, species, breed, age, size, gender, type, status, description, photoPath, latitude || null, longitude || null]
        );
        res.status(201).json({ message: `${name} foi cadastrado com sucesso!`, pet: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao cadastrar o pet.' });
    }
});

// ALTERAÇÃO: Esta rota agora é PÚBLICA e SEGURA (sem dados sensíveis)
app.get('/api/pets/adoption', async (req, res) => {
    const { lat, lon } = req.query; 

    try {
        let query;
        let params = [];
        
        // Colunas selecionadas removem dados do dono (email, phone) e localização exata (lat/lon)
        const selectPublic = `
            SELECT 
                p.id, p.name, p.species, p.breed, p.age, p.size, p.gender, 
                p.pet_type, p.status, p.description, p.photo_path, p.owner_id
        `;

        if (lat && lon) {
            query = `
                ${selectPublic},
                       (6371 * acos(
                           cos(radians($1)) * cos(radians(p.latitude)) *
                           cos(radians(p.longitude) - radians($2)) +
                           sin(radians($1)) * sin(radians(p.latitude))
                       )) AS distance
                FROM pets p
                WHERE p.pet_type = 'adoption' AND p.status = 'available' AND p.latitude IS NOT NULL
                ORDER BY distance;
            `;
            params = [lat, lon];
        } else {
            query = `
                ${selectPublic}
                FROM pets p
                WHERE p.pet_type = 'adoption' AND p.status = 'available'
                ORDER BY p.created_at DESC;
            `;
        }

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error("Erro ao buscar pets:", err);
        res.status(500).json({ message: 'Erro ao buscar pets para adoção.' });
    }
});

// ALTERAÇÃO: NOVA ROTA PROTEGIDA para dados sensíveis (Contacto e Mapa)
app.get('/api/pets/:id/secure', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        // Esta rota busca os dados sensíveis (contacto do dono e localização exata)
        const result = await db.query(
            `SELECT p.latitude, p.longitude, u.name as owner_name, u.email as owner_email, u.phone as owner_phone
             FROM pets p
             JOIN users u ON p.owner_id = u.id
             WHERE p.id = $1 AND p.pet_type = 'adoption'`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Pet não encontrado ou não é para adoção.' });
        }

        res.json(result.rows[0]); // Envia os dados seguros

    } catch (err) {
        console.error("Erro ao buscar dados seguros:", err);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});


// ALTERAÇÃO: Rota protegida, apenas o dono do pet (ou admin) pode ver seus pets de adoção
app.get('/api/pets/my-pets', authenticateToken, async (req, res) => {
    const userId = req.user.id; // ID vem do token
    try {
        const result = await db.query(
            "SELECT * FROM pets WHERE owner_id = $1 AND pet_type = 'adoption' ORDER BY created_at DESC",
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao buscar seus pets de adoção.' });
    }
});

// ALTERAÇÃO: Rota protegida, apenas o dono pode marcar como adotado
app.put('/api/pets/:petId/adopt', authenticateToken, async (req, res) => {
    const { petId } = req.params;
    const userId = req.user.id;

    try {
        // Verifica se o utilizador logado é o dono do pet
        const petCheck = await db.query("SELECT owner_id FROM pets WHERE id = $1", [petId]);
        if (petCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Pet não encontrado.' });
        }
        if (petCheck.rows[0].owner_id !== userId) {
            return res.status(403).json({ message: 'Ação não autorizada. Você não é o dono deste pet.' });
        }

        const result = await db.query(
            "UPDATE pets SET status = 'adopted' WHERE id = $1 RETURNING *",
            [petId]
        );
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