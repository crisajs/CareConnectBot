const mongoose = require('mongoose');
require('dotenv').config();

async function conectarMongo() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('❌ [MONGO_URI] não definido no .env!');
    process.exit(1);
  }

  if (!/^mongodb(\+srv)?:\/\//.test(uri)) {
    console.error('❌ [MONGO_URI] inválido. Deve começar com mongodb:// ou mongodb+srv://');
    process.exit(1);
  }

  try {
    console.log(`🔗 Conectando ao MongoDB: ${uri}`);
    await mongoose.connect(uri);
    console.log('✅ [MONGO] Conectado com sucesso!');
  } catch (error) {
    console.error('❌ [MONGO] Erro ao conectar:\n', error.message);
    process.exit(1);
  }
}

module.exports = conectarMongo;