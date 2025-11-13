<<<<<<< HEAD
// backend/services/authService.js

// Módulos Nativos/Terceiros
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Módulos Locais
const authRepository = require('../repositories/authRepository');
const { uploadFile } = require('../supabaseClient');
const { BadRequestError, UnauthorizedError, NotFoundError, AppError } = require('../utils/errors');

/**
 * Registra um novo usuário.
 * @param {Object} userData - Dados do corpo da requisição (name, email, phone, password).
 * @param {import('multer').File} file - O arquivo de foto (opcional).
 * @returns {Promise<Object>} O novo usuário.
 */
const registerUser = async (userData, file) => {
  const { name, email, phone, password } = userData;

  const existingUser = await authRepository.findUserByEmail(email);
  if (existingUser) {
    throw new BadRequestError('Este email já está cadastrado.');
  }

  let photoUrl = null;
  if (file) {
    try {
      photoUrl = await uploadFile(file.buffer, file.originalname, file.mimetype);
    } catch (uploadError) {
      console.error(uploadError);
      throw new AppError('Erro ao fazer upload da foto.', 500);
    }
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const newUser = await authRepository.createUser(name, email, phone, passwordHash, photoUrl);
  return newUser;
};

/**
 * Autentica um usuário e retorna um token JWT.
 * @param {string} email - Email do usuário.
 * @param {string} password - Senha (plain text).
 * @returns {Promise<Object>} Objeto contendo o token e os dados do usuário.
 */
const loginUser = async (email, password) => {
  const user = await authRepository.findUserByEmail(email);
  if (!user) {
    throw new UnauthorizedError('Email ou senha incorretos.');
  }

  // Padronizado para camelCase (veio do repositório)
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new UnauthorizedError('Email ou senha incorretos.');
  }

  const payload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    photoUrl: user.photoUrl, // Padronizado para camelCase
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

  return {
    token,
    user: {
      userId: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      photoUrl: user.photoUrl, // Padronizado para camelCase
    },
  };
};

/**
 * Busca o perfil de um usuário pelo ID.
 * @param {number} userId - ID do usuário.
 * @returns {Promise<Object>} Os dados do perfil do usuário.
 */
const getUserProfile = async (userId) => {
  const user = await authRepository.findUserById(userId);
  if (!user) {
    throw new NotFoundError('Usuário não encontrado.');
  }
  return user;
};

/**
 * Atualiza o perfil de um usuário.
 * @param {number} userId - ID do usuário.
 * @param {Object} currentData - Dados atuais do usuário (do req.userData).
 * @param {Object} newProfileData - Novos dados (name, email, phone).
 * @param {import('multer').File} file - Novo arquivo de foto (opcional).
 * @returns {Promise<Object>} O usuário atualizado.
 */
const updateUserProfile = async (userId, currentData, newProfileData, file) => {
    let { name, email, phone } = newProfileData;
    // Padronizado para camelCase (veio do req.userData)
    let photoUrl = currentData.photoUrl; 
    
    // 1. Lida com o upload de nova foto
    if (file) {
        try {
            photoUrl = await uploadFile(file.buffer, file.originalname, file.mimetype);
            // TODO: Adicionar lógica para deletar a foto antiga do Supabase
        } catch (uploadError) {
            console.error(uploadError);
            throw new AppError('Erro ao fazer upload da nova foto.', 500);
        }
    }

    // 2. Define os novos valores, mantendo os antigos se não forem fornecidos
    const newName = name || currentData.name;
    const newEmail = email || currentData.email;
    const newPhone = phone || currentData.phone;

    // 3. Verifica se o email já está em uso por *outro* usuário
    if (newEmail !== currentData.email) {
        const existingUser = await authRepository.findUserByEmail(newEmail);
        if (existingUser && existingUser.id !== userId) {
            throw new BadRequestError('Este email já está em uso.');
        }
    }

    // 4. Atualiza no repositório
    const updatedUser = await authRepository.updateUser(
        userId, newName, newEmail, newPhone, photoUrl
    );
    
    return updatedUser;
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile
=======
// backend/services/authService.js

// Módulos Nativos/Terceiros
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Módulos Locais
const authRepository = require('../repositories/authRepository');
const { uploadFile } = require('../supabaseClient');
const { BadRequestError, UnauthorizedError, NotFoundError, AppError } = require('../utils/errors');

/**
 * Registra um novo usuário.
 * @param {Object} userData - Dados do corpo da requisição (name, email, phone, password).
 * @param {import('multer').File} file - O arquivo de foto (opcional).
 * @returns {Promise<Object>} O novo usuário.
 */
const registerUser = async (userData, file) => {
  const { name, email, phone, password } = userData;

  const existingUser = await authRepository.findUserByEmail(email);
  if (existingUser) {
    throw new BadRequestError('Este email já está cadastrado.');
  }

  let photoUrl = null;
  if (file) {
    try {
      photoUrl = await uploadFile(file.buffer, file.originalname, file.mimetype);
    } catch (uploadError) {
      console.error(uploadError);
      throw new AppError('Erro ao fazer upload da foto.', 500);
    }
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const newUser = await authRepository.createUser(name, email, phone, passwordHash, photoUrl);
  return newUser;
};

/**
 * Autentica um usuário e retorna um token JWT.
 * @param {string} email - Email do usuário.
 * @param {string} password - Senha (plain text).
 * @returns {Promise<Object>} Objeto contendo o token e os dados do usuário.
 */
const loginUser = async (email, password) => {
  const user = await authRepository.findUserByEmail(email);
  if (!user) {
    throw new UnauthorizedError('Email ou senha incorretos.');
  }

  // Padronizado para camelCase (veio do repositório)
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new UnauthorizedError('Email ou senha incorretos.');
  }

  const payload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    photoUrl: user.photoUrl, // Padronizado para camelCase
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

  return {
    token,
    user: {
      userId: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      photoUrl: user.photoUrl, // Padronizado para camelCase
    },
  };
};

/**
 * Busca o perfil de um usuário pelo ID.
 * @param {number} userId - ID do usuário.
 * @returns {Promise<Object>} Os dados do perfil do usuário.
 */
const getUserProfile = async (userId) => {
  const user = await authRepository.findUserById(userId);
  if (!user) {
    throw new NotFoundError('Usuário não encontrado.');
  }
  return user;
};

/**
 * Atualiza o perfil de um usuário.
 * @param {number} userId - ID do usuário.
 * @param {Object} currentData - Dados atuais do usuário (do req.userData).
 * @param {Object} newProfileData - Novos dados (name, email, phone).
 * @param {import('multer').File} file - Novo arquivo de foto (opcional).
 * @returns {Promise<Object>} O usuário atualizado.
 */
const updateUserProfile = async (userId, currentData, newProfileData, file) => {
    let { name, email, phone } = newProfileData;
    // Padronizado para camelCase (veio do req.userData)
    let photoUrl = currentData.photoUrl; 
    
    // 1. Lida com o upload de nova foto
    if (file) {
        try {
            photoUrl = await uploadFile(file.buffer, file.originalname, file.mimetype);
            // TODO: Adicionar lógica para deletar a foto antiga do Supabase
        } catch (uploadError) {
            console.error(uploadError);
            throw new AppError('Erro ao fazer upload da nova foto.', 500);
        }
    }

    // 2. Define os novos valores, mantendo os antigos se não forem fornecidos
    const newName = name || currentData.name;
    const newEmail = email || currentData.email;
    const newPhone = phone || currentData.phone;

    // 3. Verifica se o email já está em uso por *outro* usuário
    if (newEmail !== currentData.email) {
        const existingUser = await authRepository.findUserByEmail(newEmail);
        if (existingUser && existingUser.id !== userId) {
            throw new BadRequestError('Este email já está em uso.');
        }
    }

    // 4. Atualiza no repositório
    const updatedUser = await authRepository.updateUser(
        userId, newName, newEmail, newPhone, photoUrl
    );
    
    return updatedUser;
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile
>>>>>>> 73648275ee276a934c4f8b0edab4cbc725c86f10
};