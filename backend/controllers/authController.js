// backend/controllers/authController.js
const authService = require('../services/authService');
const authRepository = require('../repositories/authRepository');
const { sendResponse } = require('../utils/responseHandler');
const { NotFoundError } = require('../utils/errors');

// Wrapper para capturar erros em funções assíncronas automaticamente
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 1. Registro de Usuário (Sincronização com Supabase)
const register = catchAsync(async (req, res, next) => {
  // O middleware 'validateRequest' já garantiu que temos os dados necessários.
  // O 'authId' vem do body, enviado pelo frontend após o cadastro no Supabase.
  const user = await authService.registerUser(req.body, req.file);
  
  sendResponse(res, 201, 'Perfil criado com sucesso!', user);
});

// 2. Obter Perfil do Usuário Logado
const getMe = catchAsync(async (req, res, next) => {
  // 'req.userData.userId' é injetado pelo middleware 'checkAuth'
  const user = await authService.getUserProfile(req.userData.userId);
  
  sendResponse(res, 200, 'Perfil recuperado com sucesso.', user);
});

// 3. Atualizar Perfil
const updateMe = catchAsync(async (req, res, next) => {
    const { userId } = req.userData;
    
    // Verifica se o usuário existe antes de tentar atualizar
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
