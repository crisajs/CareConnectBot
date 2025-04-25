const mongoose = require('mongoose');
require('dotenv').config();

async function conectarMongo() {
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    console.error('❌ MONGO_URI não definida no .env ou nas variáveis de ambiente do Render.');
    process.exit(1);
  }

  const isAtlas = mongoURI.startsWith('mongodb+srv://') || mongoURI.startsWith('mongodb://');

  if (!isAtlas) {
    console.error('❌ [MONGO] URI inválida. Certifique-se que começa com "mongodb://" ou "mongodb+srv://".');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ [MONGO] Conectado com sucesso!');
  } catch (error) {
    console.error(`❌ [MONGO] Erro ao conectar:\n${error.message}`);
    process.exit(1);
  }
}

module.exports = conectarMongo;