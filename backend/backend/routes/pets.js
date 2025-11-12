// backend/routes/pets.js
const router = require('express').Router();
const db = require('../db');
const checkAuth = require('../middleware/checkAuth');
const multer = require('multer');
const path = require('path');

// --- Configuração do Multer (Upload de Imagem) ---
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

// --- Rotas de Pets ---

// GET /api/pets/adoption (Público) - CORRIGIDO com 'AS'
router.get('/adoption', async (req, res) => {
    const { species, size, age, search } = req.query;
    
    // SQL CORRIGIDO: Seleciona campos como camelCase
    let query = `
        SELECT 
            p.id, p.name, p.species, p.breed, p.age, p.size, p.gender, p.type, p.status, p.description,
            p.owner_id AS "ownerId", 
            p.photo_url AS "photoUrl", 
            p.created_at AS "createdAt",
            u.name AS "ownerName", 
            u.phone AS "ownerPhone", 
            u.email AS "ownerEmail" 
        FROM pets p 
        JOIN users u ON p.owner_id = u.id 
        WHERE p.type = 'adoption' AND p.status = 'available'
    `;
    
    const params = [];
    if (species) { params.push(species); query += ` AND p.species = $${params.length}`; }
    if (size) { params.push(size); query += ` AND p.size = $${params.length}`; }
    if (age) { params.push(age); query += ` AND p.age = $${params.length}`; }
    if (search) { params.push(`%${search}%`); query += ` AND (p.name ILIKE $${params.length} OR p.breed ILIKE $${params.length})`; }
    query += " ORDER BY p.created_at DESC";

    try {
        const results = await db.query(query, params);
        const pets = results.rows;
        for (const pet of pets) {
            // CORRIGIDO: Renomeia campos das vacinas
            const vaccineRes = await db.query(
                `SELECT id, name, date, notes, vet, pet_id AS "petId", next_date AS "nextDate" 
                 FROM vaccines WHERE pet_id = $1 ORDER BY date DESC`, 
                [pet.id]
            );
            pet.vaccines = vaccineRes.rows;
        }
        res.json(pets);
    } catch (err) { console.error(err); res.status(500).json({ message: 'Erro ao buscar pets para adoção.' }); }
});

// GET /api/pets/mypets (Privado) - CORRIGIDO com 'AS'
router.get('/mypets', checkAuth, async (req, res) => {
    try {
        // SQL CORRIGIDO: Renomeia os campos para camelCase
        const petRes = await db.query(
            `SELECT id, name, species, breed, age, size, gender, type, status, description,
             owner_id AS "ownerId", 
             photo_url AS "photoUrl", 
             created_at AS "createdAt"
             FROM pets WHERE owner_id = $1 ORDER BY created_at DESC`, 
            [req.userData.userId]
        );
        
        const pets = petRes.rows;
        for (const pet of pets) {
            // CORRIGIDO: Renomeia campos das vacinas
            const vaccineRes = await db.query(
                `SELECT id, name, date, notes, vet, pet_id AS "petId", next_date AS "nextDate" 
                 FROM vaccines WHERE pet_id = $1 ORDER BY date DESC`, 
                [pet.id]
            );
            pet.vaccines = vaccineRes.rows;
        }
        
        res.json(pets);
    } catch (err) { console.error(err); res.status(500).json({ message: 'Erro ao buscar "Meus Pets".' }); }
});

// POST /api/pets (Privado) - CORRIGIDO para UPLOAD
router.post('/', checkAuth, upload.single('photo'), async (req, res) => {
    const { name, species, breed, age, size, gender, type, description } = req.body;
    
    let photoUrl = null;
    if (req.file) {
      // Cria a URL completa para o frontend
      const serverUrl = `${req.protocol}://${req.get('host')}`;
      photoUrl = `${serverUrl}/${req.file.path.replace(/\\/g, "/")}`; // Trata barras no Windows
    }

    const status = (type === 'adoption') ? 'available' : 'personal';

    try {
        const newPet = await db.query(
            `INSERT INTO pets (owner_id, name, species, breed, age, size, gender, type, status, description, photo_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
             RETURNING id, name, species, breed, age, size, gender, type, status, description,
                       owner_id AS "ownerId", photo_url AS "photoUrl", created_at AS "createdAt"`,
            [req.userData.userId, name, species, breed, age, size, gender, type, status, description, photoUrl]
        );
        newPet.rows[0].vaccines = []; // Novo pet começa sem vacinas
        res.status(201).json(newPet.rows[0]);
    } catch (err) { console.error(err); res.status(500).json({ message: 'Erro ao cadastrar pet.' }); }
});

// PUT /api/pets/:petId (Privado) - CORRIGIDO para UPLOAD
router.put('/:petId', checkAuth, upload.single('photo'), async (req, res) => {
    const { petId } = req.params;
    const { name, species, breed, age, size, gender, type, description } = req.body;
    const status = (type === 'adoption') ? 'available' : 'personal';

    // Manter a foto antiga se nenhuma nova for enviada
    let photoUrl = req.body.photoUrl || null; 
    if (req.file) {
      const serverUrl = `${req.protocol}://${req.get('host')}`;
      photoUrl = `${serverUrl}/${req.file.path.replace(/\\/g, "/")}`;
    }

    try {
        const updatedPet = await db.query(
            `UPDATE pets SET name=$1, species=$2, breed=$3, age=$4, size=$5, gender=$6, type=$7, status=$8, description=$9, photo_url=$10
             WHERE id = $11 AND owner_id = $12 
             RETURNING id, name, species, breed, age, size, gender, type, status, description,
                       owner_id AS "ownerId", photo_url AS "photoUrl", created_at AS "createdAt"`,
            [name, species, breed, age, size, gender, type, status, description, photoUrl, petId, req.userData.userId]
        );
        
        if (updatedPet.rows.length === 0) {
            return res.status(404).json({ message: 'Pet não encontrado ou você não tem permissão.' });
        }
        res.json(updatedPet.rows[0]);
    } catch (err) { console.error(err); res.status(500).json({ message: 'Erro ao atualizar pet.' }); }
});

// DELETE /api/pets/:petId (Privado) - (Sem alterações)
router.delete('/:petId', checkAuth, async (req, res) => {
    const { petId } = req.params;
    try {
        const result = await db.query("DELETE FROM pets WHERE id = $1 AND owner_id = $2", [petId, req.userData.userId]);
        if (result.rowCount === 0) { return res.status(404).json({ message: 'Pet não encontrado ou permissão negada.' }); }
        res.status(200).json({ message: 'Pet excluído com sucesso.' });
    } catch (err) { console.error(err); res.status(500).json({ message: 'Erro ao excluir pet.' }); }
});

// PUT /api/pets/:petId/adopt (Privado) - (Sem alterações)
router.put('/:petId/adopt', checkAuth, async (req, res) => {
    const { petId } = req.params;
    try {
        const result = await db.query(
            `UPDATE pets SET status = 'adopted' WHERE id = $1 AND owner_id = $2 
             RETURNING id, owner_id AS "ownerId", status`,
            [petId, req.userData.userId]
        );
        if (result.rows.length === 0) { return res.status(404).json({ message: 'Pet não encontrado ou permissão negada.' }); }
        res.json({ message: 'Pet marcado como adotado!', pet: result.rows[0] });
    } catch (err) { console.error(err); res.status(500).json({ message: 'Erro ao marcar como adotado.' }); }
});

// POST /api/pets/:petId/vaccines (Privado) - CORRIGIDO com 'AS'
router.post('/:petId/vaccines', checkAuth, async (req, res) => {
    const { petId } = req.params;
    const { name, date, nextDate, vet, notes } = req.body;

    const petCheck = await db.query("SELECT * FROM pets WHERE id = $1 AND owner_id = $2", [petId, req.userData.userId]);
    if (petCheck.rows.length === 0) {
        return res.status(403).json({ message: 'Você não tem permissão para adicionar vacinas a este pet.' });
    }

    try {
        const newVaccine = await db.query(
            `INSERT INTO vaccines (pet_id, name, date, next_date, vet, notes)
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING id, name, date, notes, vet, pet_id AS "petId", next_date AS "nextDate"`,
            [petId, name, date, nextDate || null, vet, notes]
        );
        res.status(201).json(newVaccine.rows[0]);
    } catch (err) { console.error(err); res.status(500).json({ message: 'Erro ao adicionar vacina.' }); }
});

module.exports = router;