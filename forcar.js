// forcar.js - script para forçar envio de aulas pendentes no WhatsApp
require('dotenv').config();
const conectarMongo = require('./src/database/db');
const venom = require('venom-bot');
const AulaService = require('./src/service/aulaService');
const { forcarEnvioAulaAgora } = require('./src/service/alunoService');

async function main() {
  let client;
  try {
    console.log('🔗 Conectando ao MongoDB...');
    await conectarMongo();
    console.log('✅ Conectado ao MongoDB');

    console.log('[INFO] Carregando aulas...');
    const aulaService = new AulaService();
    await aulaService.carregarAulas();
    console.log('[INFO] Aulas carregadas com sucesso.');

    console.log('🔄 Inicializando WhatsApp via Venom...');
    client = await venom.create({
      session: process.env.SESSION_NAME || 'forcar-session',
      multidevice: process.env.MULTIDEVICE === 'true',
      disableWelcome: true,
      headless: process.env.HEADLESS === 'true',
      puppeteerOptions: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
      }
    });
    console.log('✓ WhatsApp conectado!');

    console.log('🔔 Forçando envio de aulas pendentes...');
    await forcarEnvioAulaAgora(client, aulaService);
    console.log('✅ Envio de aulas pendentes concluído.');
  } catch (error) {
    console.error('❌ Erro no script forcar.js:', error);
  } finally {
    if (client) {
      console.log('🔒 Fechando conexão do WhatsApp...');
      try {
        await client.close();
        console.log('🔒 Conexão do WhatsApp fechada.');
      } catch (closeErr) {
        console.warn('⚠️ Erro ao fechar conexão do WhatsApp:', closeErr.message);
      }
    }
    process.exit(0);
  }
}

main();
