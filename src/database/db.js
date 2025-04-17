const mongoose = require('mongoose');
require('dotenv').config();

async function conectarMongo() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[MONGO] Conectado com sucesso!');
  } catch (error) {
    console.error('[MONGO] Erro ao conectar:', error);
  }
}

module.exports = conectarMongo;