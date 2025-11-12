// backend/services/authService.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authRepository = require('../repositories/authRepository');
const { uploadFile } = require('../supabaseClient');
const { BadRequestError, UnauthorizedError, NotFoundError, AppError } = require('../utils/errors');

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
      // Lança um erro genérico que o errorHandler tratará como 500
      throw new AppError('Erro ao fazer upload da foto.', 500);
    }
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const newUser = await authRepository.createUser(name, email, phone, passwordHash, photoUrl);
  return newUser;
};

const loginUser = async (email, password) => {
  const user = await authRepository.findUserByEmail(email);
  if (!user) {
    throw new UnauthorizedError('Email ou senha incorretos.');
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new UnauthorizedError('Email ou senha incorretos.');
  }

  // O payload do token deve ser enxuto, mas o seu funciona.
  const payload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    photoUrl: user.photo_url,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

  return {
    token,
    user: {
      userId: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      photoUrl: user.photo_url,
    },
  };
};

const getUserProfile = async (userId) => {
  const user = await authRepository.findUserById(userId);
  if (!user) {
    throw new NotFoundError('Usuário não encontrado.');
  }
  return user;
};

const updateUserProfile = async (userId, currentData, newProfileData, file) => {
    let { name, email, phone } = newProfileData;
    let photoUrl = currentData.photo_url; // Mantém a foto antiga por padrão
    
    // 1. Lida com o upload de nova foto
    if (file) {
        try {
            photoUrl = await uploadFile(file.buffer, file.originalname, file.mimetype);
            // TODO: Adicionar lógica para deletar a foto antiga do Supabase se desejar
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
};