const mongoose = require('mongoose');
require('dotenv').config();

async function conectarMongo() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('❌ MONGO_URI não definida no .env ou nas variáveis de ambiente do Render.');
    process.exit(1);
  }

  // Exibe apenas o host da URI no log (sem user/senha)
  const safeHost = uri.replace(/\/\/.*:.*@/, '//<hidden>@');

  console.log('[MONGO_URI]', safeHost);

  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ [MONGO] Conectado com sucesso!');
  } catch (error) {
    console.error('❌ [MONGO] Erro ao conectar:', error.message);
    process.exit(1); // Importante no Render para parar o processo
  }
}

module.exports = conectarMongo;