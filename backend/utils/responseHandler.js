<<<<<<< HEAD
// backend/utils/responseHandler.js

/**
 * Envia uma resposta JSON padronizada.
 * @param {object} res - O objeto de resposta do Express.
 * @param {number} statusCode - O código de status HTTP.
 * @param {string} message - Uma mensagem descritiva.
 * @param {object | null} data - Os dados a serem enviados (opcional).
 */
const sendResponse = (res, statusCode, message, data = null) => {
  res.status(statusCode).json({
    success: true,
    message: message,
    data: data,
  });
};

=======
// backend/utils/responseHandler.js

/**
 * Envia uma resposta JSON padronizada.
 * @param {object} res - O objeto de resposta do Express.
 * @param {number} statusCode - O código de status HTTP.
 * @param {string} message - Uma mensagem descritiva.
 * @param {object | null} data - Os dados a serem enviados (opcional).
 */
const sendResponse = (res, statusCode, message, data = null) => {
  res.status(statusCode).json({
    success: true,
    message: message,
    data: data,
  });
};

>>>>>>> 73648275ee276a934c4f8b0edab4cbc725c86f10
module.exports = { sendResponse };