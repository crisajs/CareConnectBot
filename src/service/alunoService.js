// src/service/alunoService.js
const Aluno = require('../models/Aluno');

/**
 * Cria um novo aluno se não existir.
 */
async function criarAluno(dados) {
  try {
    const existente = await Aluno.findOne({ numero: dados.numero });
    if (existente) return existente;

    const novoAluno = new Aluno({
      nome: dados.nome,
      numero: dados.numero,
      diaAtual: 1,
      iniciado: false,
      menuExibido: true,
      pontuacao: 0,
      cancelConfirm: false,
      respondeuAulaAtual: false,
      aulasConcluidas: 0,
      porcentagemConcluida: 0,
      ultimaAulaConcluida: null,
      respostaCorreta: null,
      aulaJafoiEnviada: false,
    });
    await novoAluno.save();
    return novoAluno;
  } catch (err) {
    throw new Error('Erro ao criar aluno: ' + err.message);
  }
}

/**
 * Busca um aluno pelo número do WhatsApp.
 */
async function buscarAluno(numero) {
  try {
    return await Aluno.findOne({ numero });
  } catch (err) {
    throw new Error('Erro ao buscar aluno: ' + err.message);
  }
}

/**
 * Atualiza os dados do aluno.
 */
async function atualizarAluno(numero, novosDados) {
  try {
    return await Aluno.findOneAndUpdate({ numero }, novosDados, { new: true });
  } catch (err) {
    throw new Error('Erro ao atualizar aluno: ' + err.message);
  }
}

/**
 * Remove o aluno.
 */
async function removerAluno(numero) {
  try {
    return await Aluno.deleteOne({ numero });
  } catch (err) {
    throw new Error('Erro ao remover aluno: ' + err.message);
  }
}

/**
 * Registra a resposta do aluno após ele responder,
 * incrementa diaAtual e aulasConcluidas.
 */
async function registrarResposta(aluno, correta, aulaTitulo) {
  try {
    if (correta) aluno.pontuacao += 10;
    aluno.respondeuAulaAtual = true;
    aluno.ultimaAulaConcluida = aulaTitulo;
    aluno.aulasConcluidas += 1;
    aluno.diaAtual += 1;
    aluno.porcentagemConcluida = Math.round((aluno.aulasConcluidas / 30) * 100);
    aluno.aulaJafoiEnviada = false;
    await aluno.save();
  } catch (err) {
    throw new Error('Erro ao registrar resposta: ' + err.message);
  }
}

/**
 * Gera a string de progresso para exibir no WhatsApp.
 */
function getProgresso(aluno) {
  return `📈 *Seu progresso:*\n` +
         `- Última aula: ${aluno.ultimaAulaConcluida || 'Nenhuma'}\n` +
         `- Aulas concluídas: ${aluno.aulasConcluidas}/30\n` +
         `- Progresso: ${aluno.porcentagemConcluida}%\n` +
         `- Pontos: ${aluno.pontuacao}`;
}

/**
 * Retorna todos os alunos que já iniciaram o curso.
 */
async function todosAlunosAtivos() {
  try {
    return await Aluno.find({ iniciado: true });
  } catch (err) {
    throw new Error('Erro ao buscar alunos ativos: ' + err.message);
  }
}

/**
 * Força o envio da próxima aula para todos os alunos ativos
 * que ainda não receberam/enviaram a pergunta.
 */
async function forcarEnvioAulaAgora(client, aulaService) {
  const alunos = await Aluno.find({
    iniciado: true,
    aulasConcluídas: { $gt: 0 },       // já responderam ao menos 1 aula
    respondeuAulaAtual: false,
    aulaJafoiEnviada: false
  });

  for (const aluno of alunos) {
    const aula = aulaService.getAula(aluno.diaAtual);
    if (!aula) continue;

    const primeiroNome = aluno.nome.split(' ')[0] || 'aluno';
    console.log(`→ Enviando aula ${aluno.diaAtual} para ${aluno.numero}`);
    await client.sendText(aluno.numero, `🌅 Bom dia, ${primeiroNome}!`);
    await client.sendText(aluno.numero, `📚 *${aula.titulo}*\n\n${aula.conteudo}`);
    await client.sendText(aluno.numero, aulaService.formatPergunta(aula));

    // Marca como enviada
    await Aluno.findOneAndUpdate(
      { numero: aluno.numero },
      { respostaCorreta: aula.respostaCorreta, aulaJafoiEnviada: true }
    );
  }
}

module.exports = {
  criarAluno,
  buscarAluno,
  atualizarAluno,
  removerAluno,
  registrarResposta,
  getProgresso,
  todosAlunosAtivos,
  forcarEnvioAulaAgora
};