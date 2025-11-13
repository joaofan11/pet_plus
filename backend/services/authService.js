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
      throw new AppError('Erro ao fazer upload da foto.', 500);
    }
  }

  const newUser = await authRepository.createUser(name, email, phone, passwordHash, photoUrl);
  return newUser;
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
    let photoUrl = currentData.photoUrl; 
    
      if (file) {
        try {
            photoUrl = await uploadFile(file.buffer, file.originalname, file.mimetype);
        } catch (uploadError) {
            console.error(uploadError);
            throw new AppError('Erro ao fazer upload da nova foto.', 500);
        }
    }

 
    const newName = name || currentData.name;
    const newEmail = email || currentData.email;
    const newPhone = phone || currentData.phone;

      if (newEmail !== currentData.email) {
        const existingUser = await authRepository.findUserByEmail(newEmail);
        if (existingUser && existingUser.id !== userId) {
            throw new BadRequestError('Este email já está em uso.');
        }
    }

      const updatedUser = await authRepository.updateUser(
        userId, newName, newEmail, newPhone, photoUrl
    );
    
    return updatedUser;
};

module.exports = {
  registerUser,
  getUserProfile,
  updateUserProfile
};
