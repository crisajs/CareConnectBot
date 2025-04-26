require('dotenv').config();
const conectarMongo = require('./src/database/db');
const venom = require('venom-bot');
const cron = require('node-cron');
const alunoService = require('./src/service/alunoService');
const AulaService = require('./src/service/aulaService');

const aulaService = new AulaService();
let client = null;
let isCronRunningMorning = false;
let isCronRunningEvening = false;

console.log('📆 node-cron carregado:', typeof cron);

const EMOJI = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  question: '❓',
  rocket: '🚀',
  party: '🥳',
  info: 'ℹ️',
  calendar: '📅',
  book: '📘',
  chart: '📊',
  star: '🌟',
  page: '📄'
};

function gerarMenu() {
  return [
    `MENU`,
    `1 - Iniciar curso   ${EMOJI.book}`,
    `2 - Ver progresso ${EMOJI.chart}`,
    `3 - Curiosidades ${EMOJI.star}`,
    `4 - Cancelar curso ${EMOJI.error}`
  ].join('\n');
}

async function run() {
  try {
    await conectarMongo();
    await aulaService.carregarAulas();
    
    client = await venom.create({
      session: process.env.SESSION_NAME || 'session-default',
      multidevice: process.env.MULTIDEVICE === 'true',
      disableWelcome: true,
      headless: process.env.HEADLESS === 'true' ? true : 'new',
      puppeteerOptions: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
        // ATENÇÃO: Removemos o executablePath!
      }
    });

    client.onStateChange(state => {
      console.log(`${EMOJI.info} [STATE] Sessão mudou para: ${state}`);
      if (['CONFLICT', 'UNPAIRED'].includes(state)) client.useHere();
    });

    process.on('SIGINT', async () => {
      await client.close();
      process.exit(0);
    });

    client.onMessage(async message => {
      const from = message.from;
      const texto = message.body.trim().toLowerCase();
      let aluno = await alunoService.buscarAluno(from);

      if (!aluno) {
        aluno = await alunoService.criarAluno({ numero: from, nome: '' });
        return client.sendText(from, `👋 Bem-vindo! Envie seu nome completo para começar.`);
      }

      if (!aluno.nome) {
        const nome = message.body.trim();
        if (!/^[A-Za-zÀ-ú\s]{2,}$/.test(nome))
          return client.sendText(from, `❗ Nome inválido.`);
        const primeiro = nome.split(' ')[0];
        await alunoService.atualizarAluno(from, { nome, iniciado: false, respondeuAulaAtual: false, aulaJafoiEnviada: false });
        await client.sendText(from, `👋 Olá, *${primeiro}*!`);
        return setTimeout(() => client.sendText(from, gerarMenu()), 1500);
      }

      if (['a', 'b', 'c'].includes(texto) && aluno.respondeuAulaAtual)
        return client.sendText(from, `${EMOJI.success} Você já respondeu hoje!`);

      switch (texto) {
        case '1':
        case 'iniciar curso':
          if (aluno.iniciado)
            return client.sendText(from, `${EMOJI.info} Curso já iniciado.`);

          await alunoService.atualizarAluno(from, {
            iniciado: true,
            respondeuAulaAtual: false,
            aulaJafoiEnviada: false
          });
          await client.sendText(from, `${EMOJI.book} Iniciando curso...`);
          setTimeout(() => enviarAula(from), 2000);
          return;

        case '2': {
          const alunoAtual = await alunoService.buscarAluno(from);
          const totalAulas = 30;
          const perc = totalAulas > 0 ? Math.round((alunoAtual.aulasConcluidas / totalAulas) * 100) : 0;
          const progressoMsg = [
            `📈 *Seu progresso:*`,
            `- Última aula concluída: ${alunoAtual.ultimaAulaConcluida || 'Nenhuma'}`,
            `- Aulas concluídas: ${alunoAtual.aulasConcluidas}/${totalAulas}`,
            `- Progresso: ${perc}%`,
          ].join('\n');
          return client.sendText(from, progressoMsg);
        }

        case '3':
          return client.sendText(from, `${EMOJI.star} ${aulaService.getCuriosidadeAleatoria()}`);

        case '4':
          await alunoService.atualizarAluno(from, { cancelConfirm: true });
          return client.sendText(from, `❗ Confirmar cancelamento? '*Sim*' ou '*Não*'.`);

        case 'sim':
          if (!aluno.cancelConfirm)
            return client.sendText(from, `⚠️ Nada a cancelar.`);
          await alunoService.removerAluno(from);
          return client.sendText(from, `❌ Curso cancelado.`);

        case 'não':
        case 'nao':
          await alunoService.atualizarAluno(from, { cancelConfirm: false });
          return client.sendText(from, `✅ Cancelamento abortado.`);

        case 'a':
        case 'b':
        case 'c':
          return processAnswer(from, texto, aluno);

        default:
          return client.sendText(from, `❓ Comando inválido. Use o menu.`);
      }
    });

    async function enviarAula(numero) {
      const aluno = await alunoService.buscarAluno(numero);
      if (!aluno || aluno.aulaJafoiEnviada || aluno.respondeuAulaAtual) return;

      const aula = aulaService.getAula(aluno.diaAtual);
      if (!aula)
        return client.sendText(numero, `${EMOJI.warning} Sem aulas disponíveis.`);

      await client.sendText(numero, `📚 *${aula.titulo}*\n\n${aula.conteudo}`);
      setTimeout(() => client.sendText(numero, aulaService.formatPergunta(aula)), 2000);

      await alunoService.atualizarAluno(numero, {
        respostaCorreta: aula.respostaCorreta,
        aulaJafoiEnviada: true
      });
    }

    async function processAnswer(numero, texto, aluno) {
      const correta = texto === (aluno.respostaCorreta || '').toLowerCase();
      const aula = aulaService.getAula(aluno.diaAtual);

      const feedback = correta
        ? `${EMOJI.success} *Parabéns!* Você concluiu a aula ${aluno.diaAtual}: *${aula.titulo}* 🎉`
        : `${EMOJI.warning} Resposta incorreta. A resposta certa era *${aluno.respostaCorreta}*`;

      await client.sendText(numero, feedback);
      if (aula.driveLink) await client.sendText(numero, `${EMOJI.page} PDF: ${aula.driveLink}`);
      await client.sendText(numero, `⌛ *Lembrete:* a próxima aula será enviada amanhã às 07:00.`);

      await alunoService.atualizarAluno(numero, {
        respondeuAulaAtual: true,
        aulaJafoiEnviada: false,
        aulasConcluidas: aluno.aulasConcluidas + 1,
        diaAtual: aluno.diaAtual + 1,
        ultimaAulaConcluida: aula.titulo
      });
    }

    // ✅ CRON de envio de aula às 7h
    cron.schedule('0 0 7 * * *', async () => {
      if (isCronRunningMorning) return;
      isCronRunningMorning = true;
      try {
        const alunos = await alunoService.todosAlunosAtivos();
        for (const aluno of alunos) {
          if (aluno.iniciado && !aluno.aulaJafoiEnviada && !aluno.respondeuAulaAtual) {
            await enviarAula(aluno.numero);
          }
        }
      } catch (err) {
        console.error(`❌ Cron matinal erro:`, err.message);
      } finally {
        isCronRunningMorning = false;
      }
    }, { timezone: 'America/Sao_Paulo' });

    // ✅ CRON de lembrete às 19h
    cron.schedule('0 0 19 * * *', async () => {
      if (isCronRunningEvening) return;
      isCronRunningEvening = true;
      try {
        const alunos = await alunoService.todosAlunosAtivos();
        for (const aluno of alunos) {
          if (aluno.iniciado && aluno.aulaJafoiEnviada && !aluno.respondeuAulaAtual) {
            await client.sendText(aluno.numero, `⚠️ *Lembrete:* você ainda não respondeu a aula de hoje.`);
          }
        }
      } catch (err) {
        console.error(`❌ Cron vespertino erro:`, err.message);
      } finally {
        isCronRunningEvening = false;
      }
    }, { timezone: 'America/Sao_Paulo' });

    console.log(`${EMOJI.success} ${EMOJI.rocket} Bot iniciado.`);
  } catch (err) {
    console.error(`${EMOJI.error} Falha ao iniciar:`, err.message);
    process.exit(1);
  }
}

run();