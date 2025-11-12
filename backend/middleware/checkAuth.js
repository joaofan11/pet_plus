// backend/middleware/checkAuth.js
const { createClient } = require('@supabase/supabase-js');
const db = require('../db');

// 1. Inicializa o cliente ADMIN do Supabase (para validar tokens no backend)
// Note que usamos a SERVICE_KEY (secreta), não a ANON_KEY
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; 

if (!supabaseUrl || !supabaseKey) {
  console.error("ERRO: SUPABASE_URL ou SUPABASE_SERVICE_KEY não definidas no backend.");
}
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: 'Autenticação falhou: Nenhum token fornecido.' });
    }

    // 2. (Req 9) Valida o token JWT contra o serviço Supabase Auth
    const { data: { user: authUser }, error } = await supabase.auth.getUser(token);

    if (error || !authUser) {
      console.warn('Falha na validação do token Supabase:', error?.message);
      return res.status(401).json({ message: 'Autenticação falhou: Token inválido ou expirado.' });
    }

    // 3. O token é válido. Agora, encontre o perfil de usuário no *nosso* banco de dados.
    // authUser.id é o 'auth_id' (UUID) que deve estar na nossa tabela 'users'.
    const profileRes = await db.query(
      'SELECT * FROM users WHERE auth_id = $1', // Busca pelo UUID do Supabase
      [authUser.id]
    );

    if (profileRes.rows.length === 0) {
      // O usuário existe no Supabase Auth, mas não no nosso banco 'users'.
      return res.status(401).json({ message: 'Autenticação falhou: Perfil de usuário não encontrado.' });
    }

    const profile = profileRes.rows[0];

    // 4. Anexa os dados do *nosso* perfil (incluindo o ID interno) à requisição.
    // As rotas (como /me) esperam 'req.userData.userId'
    req.userData = {
      userId: profile.id,       // O ID (int/pk) da nossa tabela 'users'
      authId: authUser.id,      // O ID (uuid) do Supabase Auth
      name: profile.name,
      email: profile.email,
      photoUrl: profile.photo_url,
      role: profile.role         // (Req 7)
    };
    
    next(); // Continua para a rota protegida (ex: GET /me ou PUT /me)

  } catch (error) {
    console.error('Erro no middleware checkAuth:', error);
    return res.status(500).json({ message: 'Erro interno no servidor durante a autenticação.' });
  }
};