// backend/routes/services.js
const router = require('express').Router();
const db = require('../db');
const checkAuth = require('../middleware/checkAuth');

// GET /api/services (Público) - CORRIGIDO com 'AS'
router.get('/', async (req, res) => {
    const { category, search } = req.query;
    // SQL CORRIGIDO
    let query = `
        SELECT 
            s.id, s.category, s.name, s.professional, s.phone, s.address, s.description, s.latitude, s.longitude,
            s.owner_id AS "ownerId", 
            s.created_at AS "createdAt", 
            u.name AS "ownerName" 
        FROM services s 
        JOIN users u ON s.owner_id = u.id 
        WHERE 1=1
    `;
    const params = [];

    if (category) { params.push(category); query += ` AND s.category = $${params.length}`; }
    if (search) { params.push(`%${search}%`); query += ` AND (s.name ILIKE $${params.length} OR s.professional ILIKE $${params.length} OR s.address ILIKE $${params.length})`; }
    query += " ORDER BY s.created_at DESC";

    try {
        const results = await db.query(query, params);
        
        const token = req.headers.authorization;
        const isAuth = token && token.startsWith('Bearer ');

        const services = results.rows.map(service => {
            if (isAuth) {
                return service;
            } else {
                return {
                    ...service,
                    phone: "Faça login para ver",
                    address: "Faça login para ver",
                    latitude: null,
                    longitude: null
                };
            }
        });
        
        res.json(services);
    } catch (err) { console.error(err); res.status(500).json({ message: 'Erro ao buscar serviços.' }); }
});

// POST /api/services (Privado) - CORRIGIDO com 'AS'
router.post('/', checkAuth, async (req, res) => {
    const { category, name, professional, phone, address, description, latitude, longitude } = req.body;
    try {
        const newService = await db.query(
            `INSERT INTO services (owner_id, category, name, professional, phone, address, description, latitude, longitude)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
             RETURNING id, category, name, professional, phone, address, description, latitude, longitude,
                       owner_id AS "ownerId", created_at AS "createdAt"`,
            [req.userData.userId, category, name, professional, phone, address, description, latitude || null, longitude || null]
        );
        res.status(201).json(newService.rows[0]);
    } catch (err) { console.error(err); res.status(500).json({ message: 'Erro ao cadastrar serviço.' }); }
});

// PUT /api/services/:serviceId (Privado) - CORRIGIDO com 'AS'
router.put('/:serviceId', checkAuth, async (req, res) => {
    const { serviceId } = req.params;
    const { category, name, professional, phone, address, description, latitude, longitude } = req.body;

    try {
        const updated = await db.query(
            `UPDATE services SET category=$1, name=$2, professional=$3, phone=$4, address=$5, description=$6, latitude=$7, longitude=$8
             WHERE id = $9 AND owner_id = $10 
             RETURNING id, category, name, professional, phone, address, description, latitude, longitude,
                       owner_id AS "ownerId", created_at AS "createdAt"`,
            [category, name, professional, phone, address, description, latitude || null, longitude || null, serviceId, req.userData.userId]
        );
        if (updated.rows.length === 0) {
            return res.status(404).json({ message: 'Serviço não encontrado ou permissão negada.' });
        }
        res.json(updated.rows[0]);
    } catch (err) { console.error(err); res.status(500).json({ message: 'Erro ao atualizar serviço.' }); }
});

// DELETE /api/services/:serviceId (Privado) - (Sem alterações)
router.delete('/:serviceId', checkAuth, async (req, res) => {
    const { serviceId } = req.params;
    try {
        const deleted = await db.query("DELETE FROM services WHERE id = $1 AND owner_id = $2", [serviceId, req.userData.userId]);
        if (deleted.rowCount === 0) { return res.status(404).json({ message: 'Serviço não encontrado ou permissão negada.' }); }
        res.status(200).json({ message: 'Serviço excluído com sucesso.' });
    } catch (err) { console.error(err); res.status(500).json({ message: 'Erro ao excluir serviço.' }); }
});

module.exports = router;