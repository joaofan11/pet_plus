const authService = require('../services/authService');
const authRepository = require('../repositories/authRepository');
const { NotFoundError } = require('../utils/errors');


const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const register = catchAsync(async (req, res, next) => {
  
  const user = await authService.registerUser(req.body, req.file);
  sendResponse(res, 201, 'Cadastro realizado com sucesso!', user);
});

const getMe = catchAsync(async (req, res, next) => {
  const user = await authService.getUserProfile(req.userData.userId);
  sendResponse(res, 200, 'Perfil recuperado com sucesso.', user);
});

const updateMe = catchAsync(async (req, res, next) => {
    const { userId } = req.userData;
    const currentUser = await authRepository.findUserById(userId);
    if (!currentUser) {
        throw new NotFoundError('Usuário não encontrado.');
    }

    const updatedUser = await authService.updateUserProfile(
        userId,
        currentUser, 
        req.body, 
        req.file
    );
    
    sendResponse(res, 200, 'Perfil atualizado com sucesso!', updatedUser);
});

module.exports = {
  register,
  getMe,
  updateMe
};
