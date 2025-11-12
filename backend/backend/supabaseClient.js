// backend/supabaseClient.js
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// 1. Puxa as "chaves secretas" que você definiu no Render
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // A chave secreta!

// 2. Conecta-se à sua conta Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET_NAME = 'petplus-uploads'; // O nome do Bucket que você criou

// 3. A função principal
const uploadFile = async (buffer, originalname, mimetype) => {
  try {
    // Cria um nome de ficheiro único (para evitar sobrepor)
    const fileName = `${Date.now()}-${originalname}`;

    // 4. Faz o upload para o Supabase
    const { data, error } = await supabase
      .storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, { // "buffer" é a imagem que estava na RAM
        contentType: mimetype,
      });

    if (error) { throw error; }

    // 5. Se o upload funcionou, pede ao Supabase a URL pública
    const { data: publicUrlData } = supabase
      .storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    // 6. Devolve a URL (ex: "https://..../minha-foto.png")
    return publicUrlData.publicUrl;

  } catch (err) {
    console.error('Erro no upload para Supabase:', err);
    throw new Error('Erro ao fazer upload da imagem.');
  }
};

module.exports = { uploadFile };