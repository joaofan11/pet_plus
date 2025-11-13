// backend/middleware/checkAuth.js
const { createClient } = require('@supabase/supabase-js');
const db = require('../db');

// Inicializa o cliente ADMIN do Supabase (para validar tokens no backend)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; 

if (!supabaseUrl || !supabaseKey) {
  console.error("ERRO: SUPABASE_URL ou SUPABASE_SERVICE_KEY não definidas no backend.");
}
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * @typedef {Object} UserData
 * @property {number} userId - O ID (int/pk) da nossa tabela 'users'.
 * @property {string} authId - O ID (uuid) do Supabase Auth.
 * @property {string} name - Nome do usuário.
 * @property {string} email - Email do usuário.
 * @property {string} photoUrl - URL da foto do usuário (camelCase).
 * @property {string} role - Role (ex: 'admin' ou 'user').
 */

/**
 * Middleware de autenticação.
 * Valida o token JWT com o Supabase Auth e anexa os dados do perfil local
 * (em camelCase) ao objeto `req.userData`.
 *
 * @param {import('express').Request & { userData?: UserData }} req - Objeto da requisição.
 * @param {import('express').Response} res - Objeto da resposta.
 * @param {import('express').NextFunction} next - Próxima função de middleware.
 */
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

    // 3. O token é válido. Encontra o perfil no *nosso* banco de dados.
    const profileRes = await db.query(
      'SELECT * FROM users WHERE auth_id = $1', // Busca pelo UUID do Supabase
      [authUser.id]
    );

    if (profileRes.rows.length === 0) {
      return res.status(401).json({ message: 'Autenticação falhou: Perfil de usuário não encontrado.' });
    }

    const profile = profileRes.rows[0];

    // 4. Anexa os dados do *nosso* perfil (em camelCase) à requisição.
    req.userData = {
      userId: profile.id,       
      authId: authUser.id,      
      name: profile.name,
      email: profile.email,
      photoUrl: profile.photo_url, // Conversão de snake_case para camelCase
      role: profile.role         
    };
    
    next(); // Continua para a rota protegida

  } catch (error) {
    console.error('Erro no middleware checkAuth:', error);
    return res.status(500).json({ message: 'Erro interno no servidor durante a autenticação.' });
  }
};