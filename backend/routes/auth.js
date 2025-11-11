// backend/routes/auth.js
const router = require('express').Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const checkAuth = require('../middleware/checkAuth'); // 👈 Importar checkAuth
const multer = require('multer'); // 👈 Importar multer
const path = require('path'); // 👈 Importar path

// --- Configuração do Multer (Upload de Imagem) ---
// (Pode copiar esta configuração de pets.js ou blog.js)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(new Error('Formato de imagem não suportado (apenas JPG e PNG)'), false);
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

// POST /api/auth/register (AGORA COM UPLOAD DE FOTO)
router.post('/register', upload.single('photo'), async (req, res) => {
    const { name, email, phone, password, confirmPassword } = req.body;

    // Validações
    if (!name || !email || !phone || !password || !confirmPassword) {
        return res.status(400).json({ message: 'Por favor, preencha todos os campos.' });
    }
    // ... (outras validações)

    // --- Lógica da Foto ---
    let photoUrl = null;
    if (req.file) {
      // Cria a URL completa para o frontend
      const serverUrl = `${req.protocol}://${req.get('host')}`;
      photoUrl = `${serverUrl}/${req.file.path.replace(/\\/g, "/")}`; // Trata barras no Windows
    }
    // --- Fim da Lógica da Foto ---

    try {
        const userExists = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'Este email já está cadastrado.' });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const newUser = await db.query(
            // Adiciona photo_url ao INSERT
            `INSERT INTO users (name, email, phone, password_hash, photo_url) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING id, name, email, phone, photo_url AS "photoUrl"`,
            [name, email, phone, password_hash, photoUrl]
        );
        
        res.status(201).json({ message: 'Cadastro realizado com sucesso!', user: newUser.rows[0] });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erro no servidor ao tentar registrar." });
    }
});

// POST /api/auth/login (AGORA RETORNA A FOTO)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Por favor, preencha todos os campos.' });
    }

    try {
        // Pede explicitamente a photo_url
        const userResult = await db.query(
            `SELECT id, name, email, phone, password_hash, photo_url 
             FROM users WHERE email = $1`, 
            [email]
        );
        
        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: 'Email ou senha incorretos.' });
        }

        const user = userResult.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Email ou senha incorretos.' });
        }

        // Adiciona photo_url ao payload do token
        const payload = { 
            userId: user.id, 
            name: user.name, 
            email: user.email, 
            photoUrl: user.photo_url // 👈 Adicionado
        };
        
        const token = jwt.sign(
            payload, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' } 
        );
        
        // Retorna o usuário com a photoUrl (para o frontend)
        res.json({ 
            message: `Bem-vindo(a), ${user.name}!`,
            token, 
            user: {
                userId: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                photoUrl: user.photo_url // 👈 Adicionado
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erro no servidor ao tentar logar." });
    }
});

// -------------------------------------------------------------------
// ✨ NOVA ROTA: ATUALIZAR PERFIL DO USUÁRIO
// -------------------------------------------------------------------
router.put('/me', checkAuth, upload.single('photo'), async (req, res) => {
    const { userId } = req.userData;
    const { name, email, phone } = req.body;

    try {
        // 1. Busca os dados atuais do usuário
        const currentUserData = await db.query("SELECT * FROM users WHERE id = $1", [userId]);
        if (currentUserData.rows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        const user = currentUserData.rows[0];

        // 2. Lida com a foto (mantém a antiga se nenhuma nova for enviada)
        let photoUrl = user.photo_url; // Default: foto antiga
        if (req.file) {
            const serverUrl = `${req.protocol}://${req.get('host')}`;
            photoUrl = `${serverUrl}/${req.file.path.replace(/\\/g, "/")}`;
        }

        // 3. Define os novos valores (usando os antigos como fallback)
        const newName = name || user.name;
        const newEmail = email || user.email;
        const newPhone = phone || user.phone;

        // 4. Atualiza o banco de dados
        const updatedUser = await db.query(
            `UPDATE users 
             SET name = $1, email = $2, phone = $3, photo_url = $4 
             WHERE id = $5
             RETURNING id, name, email, phone, photo_url AS "photoUrl"`,
            [newName, newEmail, newPhone, photoUrl, userId]
        );

        // 5. Retorna os dados atualizados
        res.json({ 
            message: 'Perfil atualizado com sucesso!', 
            user: updatedUser.rows[0] 
        });

    } catch (err) {
        console.error(err);
        // Trata erro de email duplicado
        if (err.code === '23505' && err.constraint === 'users_email_key') {
            return res.status(400).json({ message: 'Este email já está em uso.' });
        }
        res.status(500).json({ message: 'Erro no servidor ao atualizar o perfil.' });
    }
});


module.exports = router;
