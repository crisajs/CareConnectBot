const mongoose = require('mongoose');
require('dotenv').config();

console.log('Tentando conectar ao MongoDB...');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Conectado com sucesso!');
  return mongoose.disconnect();
})
.catch(err => {
  console.error('❌ Erro ao conectar:', err);
  process.exit(1);
});

setTimeout(() => {
  console.error('⏱ Timeout: conexão demorando demais...');
  process.exit(1);
}, 10000); // 10 segundos