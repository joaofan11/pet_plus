// backend/supabaseClient.js
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const sharp = require('sharp'); // Adicionado Sharp para compressão

// 1. Puxa as "chaves secretas" que você definiu no Render
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // A chave secreta!

// 2. Conecta-se à sua conta Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET_NAME = 'petplus-uploads'; // O nome do Bucket que você criou

// 3. A função principal (agora com compressão)
const uploadFile = async (buffer, originalname, mimetype) => {
  try {
    // 3a. Compactar, redimensionar e converter a imagem para WebP
    const compressedBuffer = await sharp(buffer)
        .resize({ width: 1080, withoutEnlargement: true }) // Redimensiona max 1080px (sem aumentar)
        .webp({ quality: 80 }) // Converte para WebP com 80% de qualidade
        .toBuffer();

    // 3b. Cria um nome de ficheiro único com a nova extensão .webp
    const originalNameWithoutExt = path.parse(originalname).name;
    const fileName = `${Date.now()}-${originalNameWithoutExt}.webp`;
    const newMimeType = 'image/webp'; // Define o mimetype correto

    // 4. Faz o upload do *buffer compactado* para o Supabase
    const { data, error } = await supabase
      .storage
      .from(BUCKET_NAME)
      .upload(fileName, compressedBuffer, { // Usa o buffer compactado
        contentType: newMimeType, // Usa o mimetype atualizado
      });

    if (error) { throw error; }

    // 5. Se o upload funcionou, pede ao Supabase a URL pública
    const { data: publicUrlData } = supabase
      .storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    // 6. Devolve a URL (ex: "https://..../minha-foto.webp")
    return publicUrlData.publicUrl;

  } catch (err) {
    console.error('Erro no upload para Supabase:', err);
    throw new Error('Erro ao fazer upload da imagem.');
  }
};

module.exports = { uploadFile };