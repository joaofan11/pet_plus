/**
 * @fileoverview Configuração centralizada do Multer para upload de imagens.
 * Utiliza memoryStorage para integração com serviços de armazenamento em nuvem (ex: Supabase).
 */

const multer = require('multer');
const { BadRequestError } = require('../utils/errors');

/**
 * Filtro de arquivo para aceitar apenas imagens (JPG, PNG, WebP).
 *
 * @param {import('express').Request} req - A requisição Express.
 * @param {import('multer').File} file - O arquivo enviado.
 * @param {import('multer').FileFilterCallback} cb - O callback.
 */
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // Rejeita o arquivo com um erro que o errorHandler pode capturar
    cb(new BadRequestError('Formato de imagem não suportado (apenas JPG, PNG, WebP)'), false);
  }
};

// Configuração do storage em memória
const storage = multer.memoryStorage();

/**
 * Instância do Multer configurada para upload de imagens.
 * Limite de 5MB por arquivo.
 */
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB
});

module.exports = upload;