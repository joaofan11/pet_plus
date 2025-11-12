// backend/routes/auth.js
const router = require('express').Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const checkAuth = require('../middleware/checkAuth');
const multer = require('multer');
// 1. IMPORTAR O HELPER DO SUPABASE
const { uploadFile } = require('../supabaseClient'); 
const storage = multer.memoryStorage(); 

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/webp') {
    cb(null, true);
  } else {
    cb(new Error('Formato de imagem não suportado (apenas JPG, PNG, WebP)'), false);
  }
};

const upload = multer({ 
    storage: storage, 
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Limite de 5MB
});

// POST /api/auth/register (COM UPLOAD NO SUPABASE)
router.post('/register', upload.single('photo'), async (req, res) => {
    const { name, email, phone, password, confirmPassword } = req.body;

    // Validações
    if (!name || !email || !phone || !password || !confirmPassword) {
        return res.status(400).json({ message: 'Por favor, preencha todos os campos.' });
    }

    // 3. ✨ CORREÇÃO DE VALIDAÇÃO
    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'As senhas não coincidem.' });
    }
    // (Pode adicionar mais validações de senha forte aqui)

    // --- Lógica da Foto (Upload para Supabase) ---
    let photoUrl = null;
    if (req.file) {
      try {
        // 4. CHAMA O HELPER
        // Envia o ficheiro da RAM (buffer) para o Supabase
        photoUrl = await uploadFile(
            req.file.buffer, 
            req.file.originalname, 
            req.file.mimetype
        );
        // Recebe de volta a URL pública (ex: https://.../foto.png)

      } catch (uploadError) {
        console.error(uploadError);
        return res.status(500).json({ message: "Erro ao fazer upload da foto." });
      }
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
            // 5. Guarda a URL do Supabase no banco
            `INSERT INTO users (name, email, phone, password_hash, photo_url) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING id, name, email, phone, photo_url AS "photoUrl"`,
            [name, email, phone, password_hash, photoUrl] // photoUrl é a URL do Supabase
        );
        
        res.status(201).json({ message: 'Cadastro realizado com sucesso!', user: newUser.rows[0] });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erro no servidor ao tentar registrar." });
    }
});

// POST /api/auth/login (Sem alteração, está correto)
// (Ele vai ler a URL do Supabase que o /register guardou)
router.post('/login', async (req, res) => {
    // ... (O seu código aqui estava correto)
    // ...
    // A 'user.photo_url' que ele retorna será a URL do Supabase.
    // ...
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Por favor, preencha todos os campos.' });
    }

    try {
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
        // (Recomendação: Mantenha o payload do token pequeno,
        // apenas com o userId, mas o seu código funciona)
        const payload = { 
            userId: user.id, 
            name: user.name, 
            email: user.email, 
            photoUrl: user.photo_url
        };
        
        const token = jwt.sign(
            payload, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' } 
        );
        
        res.json({ 
            message: `Bem-vindo(a), ${user.name}!`,
            token, 
            user: {
                userId: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                photoUrl: user.photo_url
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erro no servidor ao tentar logar." });
    }
});

// -------------------------------------------------------------------
// ROTA: ATUALIZAR PERFIL DO USUÁRIO (COM UPLOAD NO SUPABASE)
// -------------------------------------------------------------------
router.put('/me', checkAuth, upload.single('photo'), async (req, res) => {
    const { userId } = req.userData;
    const { name, email, phone } = req.body;

    try {
        const currentUserData = await db.query("SELECT * FROM users WHERE id = $1", [userId]);
        if (currentUserData.rows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        const user = currentUserData.rows[0];

        // 2. Lida com a foto (Upload para Supabase)
        let photoUrl = user.photo_url; // Default: foto antiga
        
        if (req.file) {
          try {
            // Se uma nova foto foi enviada, faz o upload para o Supabase
            photoUrl = await uploadFile(
                req.file.buffer, 
                req.file.originalname, 
                req.file.mimetype
            );
            // (Opcional: você pode adicionar lógica para apagar a foto antiga do Supabase)
          } catch (uploadError) {
             console.error(uploadError);
             return res.status(500).json({ message: "Erro ao fazer upload da nova foto." });
          }
        }

        // 3. Define os novos valores
        const newName = name || user.name;
        const newEmail = email || user.email;
        const newPhone = phone || user.phone;

        // 4. Atualiza o banco de dados
        const updatedUser = await db.query(
            `UPDATE users 
             SET name = $1, email = $2, phone = $3, photo_url = $4 
             WHERE id = $5
             RETURNING id, name, email, phone, photo_url AS "photoUrl"`,
            [newName, newEmail, newPhone, photoUrl, userId] // photoUrl é a nova URL do Supabase
        );

        // 5. Retorna os dados atualizados
        res.json({ 
            message: 'Perfil atualizado com sucesso!', 
            user: updatedUser.rows[0] 
        });

    } catch (err) {
        console.error(err);
        if (err.code === '23505' && err.constraint === 'users_email_key') {
            return res.status(400).json({ message: 'Este email já está em uso.' });
        }
        res.status(500).json({ message: 'Erro no servidor ao atualizar o perfil.' });
    }
});

// (Opcional: Adicione a rota /me para buscar o perfil)
router.get('/me', checkAuth, async (req, res) => {
    try {
        const user = await db.query(
            'SELECT id, name, email, phone, photo_url AS "photoUrl" FROM users WHERE id = $1',
            [req.userData.userId]
        );
        if (user.rows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        res.json(user.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});

module.exports = router;