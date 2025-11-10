// backend/routes/auth.js
const router = require('express').Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { name, email, phone, password, confirmPassword } = req.body;

    // Validações
    if (!name || !email || !phone || !password || !confirmPassword) {
        return res.status(400).json({ message: 'Por favor, preencha todos os campos.' });
    }
    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'As senhas não coincidem.' });
    }
    if (password.length < 6) {
        return res.status(400).json({ message: 'A senha deve ter pelo menos 6 caracteres.' });
    }

    try {
        const userExists = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'Este email já está cadastrado.' });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const newUser = await db.query(
            "INSERT INTO users (name, email, phone, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, name, email, phone",
            [name, email, phone, password_hash]
        );
        
        res.status(201).json({ message: 'Cadastro realizado com sucesso!', user: newUser.rows[0] });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erro no servidor ao tentar registrar." });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Por favor, preencha todos os campos.' });
    }

    try {
        const userResult = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: 'Email ou senha incorretos.' });
        }

        const user = userResult.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Email ou senha incorretos.' });
        }

        const payload = { userId: user.id, name: user.name, email: user.email };
        const token = jwt.sign(
            payload, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' } // Token expira em 1 dia
        );

        res.json({ 
            message: `Bem-vindo(a), ${user.name}!`,
            token, 
            user: payload
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erro no servidor ao tentar logar." });
    }
});

module.exports = router;