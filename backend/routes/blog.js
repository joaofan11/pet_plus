// backend/routes/blog.js
const router = require('express').Router();
const db = require('../db');
const checkAuth = require('../middleware/checkAuth');
const multer = require('multer');
const path = require('path');

// Configuração do Multer (igual ao de pets)
const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, 'uploads/'); },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') { cb(null, true); } 
  else { cb(new Error('Formato de imagem não suportado (apenas JPG e PNG)'), false); }
};
const upload = multer({ storage: storage, fileFilter: fileFilter });


// GET /api/blog (Público) - CORRIGIDO com 'AS'
router.get('/', async (req, res) => {
    try {
        const postRes = await db.query(`
            SELECT p.id, p.content, p.location, 
                   p.owner_id AS "ownerId", 
                   p.photo_url AS "photoUrl", 
                   p.created_at AS "createdAt", 
                   u.name AS "ownerName" 
            FROM posts p 
            JOIN users u ON p.owner_id = u.id 
            ORDER BY p.created_at DESC
        `);
        const posts = postRes.rows;

        for (const post of posts) {
            const commentRes = await db.query(`
                SELECT c.id, c.content, 
                       c.post_id AS "postId", 
                       c.owner_id AS "ownerId", 
                       c.created_at AS "createdAt", 
                       u.name AS "ownerName" 
                FROM comments c 
                JOIN users u ON c.owner_id = u.id 
                WHERE c.post_id = $1 
                ORDER BY c.created_at ASC
            `, [post.id]);
            post.comments = commentRes.rows;

            const likeRes = await db.query(`SELECT user_id AS "userId" FROM likes WHERE post_id = $1`, [post.id]);
            post.likes = likeRes.rows.map(l => l.userId);
        }
        
        res.json(posts);
    } catch (err) { console.error(err); res.status(500).json({ message: 'Erro ao buscar posts do blog.' }); }
});

// POST /api/blog (Privado) - CORRIGIDO para UPLOAD e 'AS'
router.post('/', checkAuth, upload.single('photo'), async (req, res) => {
    const { content, location } = req.body;
    
    let photoUrl = null;
    if (req.file) {
      const serverUrl = `${req.protocol}://${req.get('host')}`;
      photoUrl = `${serverUrl}/${req.file.path.replace(/\\/g, "/")}`;
    }

    try {
        const newPost = await db.query(
            `INSERT INTO posts (owner_id, content, location, photo_url) VALUES ($1, $2, $3, $4) 
             RETURNING id, content, location, 
                       owner_id AS "ownerId", photo_url AS "photoUrl", created_at AS "createdAt"`,
            [req.userData.userId, content, location, photoUrl]
        );
        
        const finalPost = { ...newPost.rows[0], ownerName: req.userData.name, comments: [], likes: [] };
        res.status(201).json(finalPost);
    } catch (err) { console.error(err); res.status(500).json({ message: 'Erro ao criar post.' }); }
});

// PUT /api/blog/:postId (Privado) - CORRIGIDO para UPLOAD e 'AS'
router.put('/:postId', checkAuth, upload.single('photo'), async (req, res) => {
    const { postId } = req.params;
    const { content, location } = req.body;

    let photoUrl = req.body.photoUrl || null;
    if (req.file) {
      const serverUrl = `${req.protocol}://${req.get('host')}`;
      photoUrl = `${serverUrl}/${req.file.path.replace(/\\/g, "/")}`;
    }

    try {
        const updated = await db.query(
            `UPDATE posts SET content=$1, location=$2, photo_url=$3 WHERE id = $4 AND owner_id = $5 
             RETURNING id, content, location, 
                       owner_id AS "ownerId", photo_url AS "photoUrl", created_at AS "createdAt"`,
            [content, location, photoUrl, postId, req.userData.userId]
        );
        if (updated.rows.length === 0) {
            return res.status(404).json({ message: 'Post não encontrado ou permissão negada.' });
        }
        res.json(updated.rows[0]);
    } catch (err) { console.error(err); res.status(500).json({ message: 'Erro ao atualizar post.' }); }
});

// DELETE /api/blog/:postId (Privado) - (Sem alterações)
router.delete('/:postId', checkAuth, async (req, res) => {
    const { postId } = req.params;
    try {
        const deleted = await db.query("DELETE FROM posts WHERE id = $1 AND owner_id = $2", [postId, req.userData.userId]);
        if (deleted.rowCount === 0) { return res.status(404).json({ message: 'Post não encontrado ou permissão negada.' }); }
        res.status(200).json({ message: 'Post excluído com sucesso.' });
    } catch (err) { console.error(err); res.status(500).json({ message: 'Erro ao excluir post.' }); }
});

// POST /api/blog/:postId/like (Privado) - (Sem alterações)
router.post('/:postId/like', checkAuth, async (req, res) => {
    const { postId } = req.params;
    const { userId } = req.userData;
    try {
        const existingLike = await db.query("SELECT * FROM likes WHERE post_id = $1 AND user_id = $2", [postId, userId]);
        if (existingLike.rows.length > 0) {
            await db.query("DELETE FROM likes WHERE post_id = $1 AND user_id = $2", [postId, userId]);
            res.json({ message: 'Like removido' });
        } else {
            await db.query("INSERT INTO likes (post_id, user_id) VALUES ($1, $2)", [postId, userId]);
            res.json({ message: 'Like adicionado' });
        }
    } catch (err) { console.error(err); res.status(500).json({ message: 'Erro ao processar like.' }); }
});

// POST /api/blog/:postId/comment (Privado) - CORRIGIDO com 'AS'
router.post('/:postId/comment', checkAuth, async (req, res) => {
    const { postId } = req.params;
    const { content } = req.body;
    const { userId } = req.userData;

    if (!content) { return res.status(400).json({ message: 'Comentário não pode estar vazio.' }); }

    try {
        const newComment = await db.query(
            `INSERT INTO comments (post_id, owner_id, content) VALUES ($1, $2, $3) 
             RETURNING id, content, post_id AS "postId", owner_id AS "ownerId", created_at AS "createdAt"`,
            [postId, userId, content]
        );
        
        const finalComment = { ...newComment.rows[0], ownerName: req.userData.name };
        res.status(201).json(finalComment);
    } catch (err) { console.error(err); res.status(500).json({ message: 'Erro ao adicionar comentário.' }); }
});

module.exports = router;