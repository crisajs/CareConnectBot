require('dotenv').config();
const conectarMongo  = require('./src/database/db');
const venom          = require('venom-bot');
const cron           = require('node-cron');
const alunoService   = require('./src/service/alunoService');
const AulaService    = require('./src/service/aulaService');
const http           = require('http');

const aulaService = new AulaService();
let client;
let isCronRunningMorning = false;
let isCronRunningEvening = false;

const EMOJI = {
  success: '✅',
  error:   '❌',
  warning: '⚠️',
  info:    'ℹ️',
  book:    '📘',
  chart:   '📊',
  star:    '🌟',
  page:    '📄'
};

async function run() {
  try {
    await conectarMongo();
    await aulaService.carregarAulas();

    // 💡 HEADLESS CORREÇÃO IMPORTANTE
    const headlessEnv = process.env.HEADLESS;
    const headless = headlessEnv === 'false' ? false : headlessEnv;

    console.log(`Caminho para o Puppeteer: ${process.env.PUPPETEER_EXECUTABLE_PATH}`);

    client = await venom.create({
      session: process.env.SESSION_NAME || 'session-default',
      multidevice: process.env.MULTIDEVICE === 'true',
      disableWelcome: true,
      headless: headless, // ← Corrigido
      puppeteerOptions: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH 
          || '/Applications/Chromium.app/Contents/MacOS/Chromium'
      }
    });

    // Envia aulas pendentes ao iniciar
    const todos = await alunoService.todosAlunosAtivos();
    for (const aluno of todos) {
      if (!aluno.aulaJafoiEnviada && !aluno.respondeuAulaAtual) {
        await enviarAula(aluno.numero);
      }
    }

    client.onStateChange(state => {
      console.log(`${EMOJI.info} [STATE] ${state}`);
      if (['CONFLICT','UNPAIRED'].includes(state)) client.useHere();
    });

    process.on('SIGINT', async () => {
      await client.close();
      process.exit(0);
    });

    client.onMessage(async msg => {
      const from  = msg.from;
      const texto = msg.body?.trim().toLowerCase();
      if (!texto) return;

      let aluno = await alunoService.buscarAluno(from);
      if (!aluno) {
        await alunoService.criarAluno({ numero: from, nome: '' });
        return client.sendText(from,'👋 Bem-vindo! Envie seu nome completo.');
      }

      if (!aluno.nome) {
        const nome = msg.body.trim();
        await alunoService.atualizarAluno(from, {
          nome,
          iniciado: false,
          respondeuAulaAtual: false,
          aulaJafoiEnviada: false
        });
        const primeiro = nome.split(' ')[0];
        await client.sendText(from,`👋 Olá, *${primeiro}*!`);
        return setTimeout(()=> client.sendText(from, gerarMenu()),1500);
      }

      if (['a','b','c'].includes(texto) && aluno.respondeuAulaAtual) {
        return client.sendText(from,`${EMOJI.success} Você já respondeu hoje!`);
      }

      switch (texto) {
        case '1':
        case 'iniciar curso':
          if (aluno.iniciado) {
            return client.sendText(from,`${EMOJI.info} Curso já iniciado.`);
          }
          await alunoService.atualizarAluno(from,{
            iniciado: true,
            respondeuAulaAtual: false,
            aulaJafoiEnviada: false
          });
          await client.sendText(from,`${EMOJI.book} Iniciando curso...`);
          setTimeout(()=> enviarAula(from),2000);
          break;

        case '2':
          const atualizado = await alunoService.buscarAluno(from);
          return client.sendText(from,alunoService.getProgresso(atualizado));

        case '3':
          return client.sendText(from,`${EMOJI.star} ${aulaService.getCuriosidadeAleatoria()}`);

        case '4':
          await alunoService.atualizarAluno(from,{ cancelConfirm: true });
          return client.sendText(from,`❗ Confirmar cancelamento? 'sim' ou 'não'.`);

        case 'sim':
          if (aluno.cancelConfirm) {
            await alunoService.removerAluno(from);
            return client.sendText(from,'❌ Curso cancelado.');
          }
          break;

        case 'não':
        case 'nao':
          if (aluno.cancelConfirm) {
            await alunoService.atualizarAluno(from,{ cancelConfirm: false });
            return client.sendText(from,'✅ Cancelamento abortado.');
          }
          break;

        case 'a':
        case 'b':
        case 'c':
          return processAnswer(from, texto, aluno);

        default:
          return client.sendText(from,`❓ Comando inválido. Use o menu.`);
      }
    });

    // CRON - envio de aula às 07:00
    cron.schedule('0 0 7 * * *', async () => {
      if (isCronRunningMorning) return;
      isCronRunningMorning = true;
      try {
        const list = await alunoService.todosAlunosAtivos();
        for (const a of list) {
          if (!a.aulaJafoiEnviada && !a.respondeuAulaAtual) {
            await enviarAula(a.numero);
          }
        }
      } finally {
        isCronRunningMorning = false;
      }
    }, { timezone:'America/Sao_Paulo' });

    // CRON - lembrete às 19:00
    cron.schedule('0 0 19 * * *', async () => {
      if (isCronRunningEvening) return;
      isCronRunningEvening = true;
      try {
        const list = await alunoService.todosAlunosAtivos();
        for (const a of list) {
          if (a.aulaJafoiEnviada && !a.respondeuAulaAtual) {
            await client.sendText(a.numero,`⚠️ *Lembrete:* responda a aula de hoje.`);
          }
        }
      } finally {
        isCronRunningEvening = false;
      }
    }, { timezone:'America/Sao_Paulo' });

    console.log(`${EMOJI.success} Bot iniciado.`);
  }
  catch(err) {
    console.error(`${EMOJI.error} Falha ao iniciar:`, err);
    process.exit(1);
  }
}

function gerarMenu(){
  return [
    'MENU',
    `1️⃣ - Iniciar curso ${EMOJI.book}`,
    `2️⃣ - Ver progresso ${EMOJI.chart}`,
    `3️⃣ - Curiosidades ${EMOJI.star}`,
    `4️⃣ - Cancelar curso ${EMOJI.error}`
  ].join('\n');
}

async function enviarAula(numero){
  const aluno = await alunoService.buscarAluno(numero);
  if (!aluno || aluno.aulaJafoiEnviada || aluno.respondeuAulaAtual) return;
  const aula = aulaService.getAula(aluno.diaAtual);
  if (!aula) return;

  const primeiro = aluno.nome.split(' ')[0];
  await client.sendText(
    numero,
    `🌅 Bom dia, ${primeiro}!\n📚 *${aula.titulo}*\n\n${aula.conteudo}`
  );
  setTimeout(()=> client.sendText(numero, aulaService.formatPergunta(aula)),2000);

  await alunoService.atualizarAluno(numero, {
    respostaCorreta: aula.respostaCorreta,
    aulaJafoiEnviada: true
  });
}

async function processAnswer(numero, texto, aluno){
  const correta = texto === (aluno.respostaCorreta || '').toLowerCase();
  const aula = aulaService.getAula(aluno.diaAtual);

  const feedback = correta
    ? `${EMOJI.success} Parabéns! Concluiu a aula ${aluno.diaAtual}: *${aula.titulo}* 🎉`
    : `${EMOJI.warning} Incorreto. Resposta certa: *${aluno.respostaCorreta}*`;

  await client.sendText(numero, feedback);
  if (aula.driveLink) {
    await client.sendText(numero, `${EMOJI.page} PDF: ${aula.driveLink}`);
  }
  await client.sendText(numero, `⌛ A próxima aula será enviada amanhã às 07:00.`);
  await alunoService.registrarResposta(aluno, correta, aula.titulo);
}

run();

// Healthcheck simples
const PORT = process.env.PORT || 3000;
http.createServer((_, res) => {
  res.writeHead(200);
  res.end('OK');
}).listen(PORT, () => console.log(`Healthcheck em :${PORT}`));