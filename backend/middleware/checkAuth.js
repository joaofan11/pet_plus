// backend/middleware/checkAuth.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    // Espera "Bearer TOKEN"
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    
    // Adiciona os dados do usuário (ex: id) ao objeto 'req'
    // para que as rotas subsequentes possam usá-lo
    req.userData = { 
        userId: decodedToken.userId, 
        name: decodedToken.name 
    };
    next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({ message: 'Autenticação falhou' });
  }
};