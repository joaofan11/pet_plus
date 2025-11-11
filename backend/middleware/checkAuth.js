// backend/middleware/checkAuth.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    
    // Passa *todos* os dados do payload do token para req.userData
    // Em vez de: { userId: decodedToken.userId, name: decodedToken.name }
    // Fazemos:
    req.userData = { 
        userId: decodedToken.userId, 
        name: decodedToken.name,
        email: decodedToken.email,
        photoUrl: decodedToken.photoUrl
    };
    
    next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({ message: 'Autenticação falhou' });
  }
};
