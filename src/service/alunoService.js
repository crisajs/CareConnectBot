// src/service/alunoService.js
const Aluno = require('../models/Aluno');

/**
 * Cria um novo aluno, verificando se já existe.
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
      ultimaAulaConcluida: null
    });
    await novoAluno.save();
    return novoAluno;
  } catch (error) {
    throw new Error('Erro ao criar aluno: ' + error.message);
  }
}

/**
 * Busca um aluno pelo número do WhatsApp
 */
async function buscarAluno(numero) {
  try {
    return await Aluno.findOne({ numero });
  } catch (error) {
    throw new Error('Erro ao buscar aluno: ' + error.message);
  }
}

/**
 * Atualiza dados do aluno com base no número
 */
async function atualizarAluno(numero, novosDados) {
  try {
    return await Aluno.findOneAndUpdate({ numero }, novosDados, { new: true });
  } catch (error) {
    throw new Error('Erro ao atualizar aluno: ' + error.message);
  }
}

/**
 * Remove um aluno do banco
 */
async function removerAluno(numero) {
  try {
    return await Aluno.deleteOne({ numero });
  } catch (error) {
    throw new Error('Erro ao remover aluno: ' + error.message);
  }
}

/**
 * Atualiza o progresso com base na resposta do aluno
 */
async function registrarResposta(aluno, correta, aulaTitulo) {
  try {
    if (correta) aluno.pontuacao += 10;
    aluno.respondeuAulaAtual = true;
    aluno.ultimaAulaConcluida = aulaTitulo;
    aluno.aulasConcluidas = aluno.aulasConcluidas + 1;
    aluno.porcentagemConcluida = Math.round((aluno.aulasConcluidas / 30) * 100);
    await aluno.save();
  } catch (error) {
    throw new Error('Erro ao registrar resposta: ' + error.message);
  }
}

/**
 * Formata e retorna o progresso do aluno para exibição no WhatsApp
 */
function getProgresso(aluno) {
  return `📈 *Seu progresso*:\nÚltima aula concluída: ${aluno.ultimaAulaConcluida || 'Nenhuma'}\nConcluído: ${aluno.porcentagemConcluida}% (${aluno.aulasConcluidas}/30 aulas)\nPontuação: ${aluno.pontuacao} pontos`;
}

/**
 * Retorna lista de alunos ativos que iniciaram o curso
 */
async function todosAlunosAtivos() {
  return await Aluno.find({ iniciado: true });
}

module.exports = {
  criarAluno,
  buscarAluno,
  atualizarAluno,
  removerAluno,
  registrarResposta,
  getProgresso,
  todosAlunosAtivos,
};
