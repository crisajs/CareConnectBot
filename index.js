/*************
 * CONFIGURAÇÃO INICIAL
 *************/
require('dotenv').config();
const conectarMongo = require('./src/database/db');
const venom = require('venom-bot');
const cron = require('node-cron');
const alunoService = require('./src/service/alunoService');
const AulaService = require('./src/service/aulaService');
const aulaService = new AulaService();

console.log('Caminho para o Puppeteer:', process.env.PUPPETEER_EXECUTABLE_PATH);

async function inicializarBot() {
  await conectarMongo();
  await aulaService.carregarAulas();

  const client = await venom.create({
    session: process.env.SESSION_NAME,
    multidevice: process.env.MULTIDEVICE === 'true',
    disableWelcome: true,
    headless: process.env.HEADLESS || 'new',
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    puppeteerOptions: {
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  });

  client.onMessage(async (message) => {
    try {
      const numero = message.from;
      const texto = message.body.trim();

      let aluno = await alunoService.buscarAluno(numero);

      if (!aluno) {
        aluno = await alunoService.criarAluno({ nome: '', numero });
        await client.sendText(
          numero,
          `👋 Seja bem-vindo ao curso de *Cuidadores de Idosos* da *Carmem Concierge de Cuidados*! Por favor, envie seu *nome completo* para darmos início.`
        );
        return;
      }

      // Se aluno ainda não enviou o nome
      if (!aluno.nome || aluno.nome === '') {
        const nomeCompleto = texto;
        const primeiroNome = nomeCompleto.split(' ')[0];
        await alunoService.atualizarAluno(numero, { nome: nomeCompleto, iniciado: true, menuExibido: false });
        await client.sendText(
          numero,
          `👋 Olá, *${primeiroNome}*! Que bom ter você aqui! Vamos começar com a primeira aula.`
        );
        await enviarAula(client, numero);
        return;
      }

      // Comandos
      switch (texto.toLowerCase()) {
        case 'iniciar curso':
          if (aluno.iniciado) {
            await client.sendText(
              numero,
              `✅ Curso já iniciado, ${aluno.nome.split(' ')[0]}. A próxima aula será enviada às 7h.`
            );
          } else {
            await exibirMenu(client, numero);
          }
          break;
        case '1':
          if (!aluno.iniciado) {
            await client.sendText(numero, '📘 Para começar, por favor envie seu nome completo.');
          } else {
            await client.sendText(numero, '✅ Curso já iniciado! Aguarde a próxima aula.');
          }
          break;
        case '2':
          await client.sendText(numero, alunoService.getProgresso(aluno));
          break;
        case '3':
          await client.sendText(numero, `🌟 ${aulaService.getCuriosidadeAleatoria()}`);
          break;
        case '4':
          if (!aluno.iniciado) {
            await client.sendText(numero, '🚫 O curso ainda não foi iniciado para ser cancelado.');
          } else {
            await alunoService.atualizarAluno(numero, { cancelConfirm: true });
            await client.sendText(numero, "Tem certeza que deseja cancelar o curso? Digite 'sim' ou 'não'.");
          }
          break;
        case 'sim':
          if (aluno.cancelConfirm) {
            await alunoService.removerAluno(numero);
            await client.sendText(numero, '❌ Curso cancelado. Esperamos vê-lo novamente!');
          }
          break;
        case 'não':
        case 'nao':
          if (aluno.cancelConfirm) {
            await alunoService.atualizarAluno(numero, { cancelConfirm: false });
            await client.sendText(numero, '✅ Cancelamento abortado.');
          }
          break;
        case 'a':
        case 'b':
        case 'c':
          if (!aluno.respostaCorreta) {
            await client.sendText(numero, '❓ Aguarde a próxima aula.');
            return;
          }
          const aulaAtual = aulaService.getAula(aluno.diaAtual);
          const correta = texto.toLowerCase() === aluno.respostaCorreta.toLowerCase();
          alunoService.registrarResposta(aluno, correta, aulaAtual.titulo);
          await alunoService.atualizarAluno(numero, aluno);
          await client.sendText(numero, correta ? aulaAtual.mensagemAcerto : aulaAtual.mensagemErro);
          if (aulaAtual.driveLink) {
            await client.sendText(numero, `🔗 PDF da aula: ${aulaAtual.driveLink}`);
            await client.sendText(numero, '📅 Lembrete: A próxima aula será enviada amanhã às 7h.');
          }
          break;
        default:
          await exibirMenu(client, numero);
          break;
      }
    } catch (err) {
      console.error('[ERROR] Handler de mensagem falhou:', err);
    }
  });

  // Enviar aula às 7h BRT todos os dias
  cron.schedule(
    '0 7 * * *',
    async () => {
      const alunos = await alunoService.todosAlunosAtivos();
      for (const aluno of alunos) {
        if (!aluno.iniciado || aluno.respondeuAulaAtual) continue;
        await enviarAula(client, aluno.numero);
      }
    },
    {
      scheduled: true,
      timezone: 'America/Sao_Paulo',
    }
  );

  // Lembrete às 19h BRT para quem não respondeu
  cron.schedule(
    '0 19 * * *',
    async () => {
      const alunos = await alunoService.todosAlunosAtivos();
      for (const aluno of alunos) {
        if (aluno.iniciado && !aluno.respondeuAulaAtual) {
          await client.sendText(
            aluno.numero,
            '⏰ Olá! Ainda aguardamos sua resposta da aula de hoje. Responda para continuar seu progresso.'
          );
        }
      }
    },
    {
      scheduled: true,
      timezone: 'America/Sao_Paulo',
    }
  );
}

async function exibirMenu(client, numero) {
  const menu = `MENU
1 - Iniciar curso 📘
2 - Ver progresso 📊
3 - Curiosidades 🌟
4 - Cancelar curso 🚫`;
  await client.sendText(numero, menu);
}

async function enviarAula(client, numero) {
  const aluno = await alunoService.buscarAluno(numero);
  if (!aluno || aluno.respondeuAulaAtual) return;

  const aula = aulaService.getAula(aluno.diaAtual);
  if (!aula) return;

  await client.sendText(numero, `📚 *${aula.titulo}*

${aula.conteudo}`);
await client.sendText(
  numero,
  `❓ *Pergunta:* ${aula.pergunta}\n${aula.opcoes.join('\n')}`
);
  aluno.respostaCorreta = aula.respostaCorreta;
  await alunoService.atualizarAluno(numero, aluno);
}

inicializarBot().catch((error) => {
  console.error('[ERROR] Falha na inicialização do bot:', error);
  process.exit(1);
});
