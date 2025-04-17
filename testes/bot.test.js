// testes/bot.test.js
require('dotenv').config();
const conectarMongo = require('../src/database/db');
const alunoService = require('../src/service/alunoService');
const mongoose = require('mongoose');

beforeAll(async () => {
  await conectarMongo();
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('AlunoService Testes', () => {
  const numeroTeste = '5511999999999';

  it('Deve criar um aluno', async () => {
    const aluno = await alunoService.criarAluno({ nome: 'Teste Aluno', numero: numeroTeste });
    expect(aluno.nome).toBe('Teste Aluno');
    expect(aluno.numero).toBe(numeroTeste);
  });

  it('Deve buscar o aluno criado', async () => {
    const aluno = await alunoService.buscarAluno(numeroTeste);
    expect(aluno).toBeTruthy();
    expect(aluno.nome).toBe('Teste Aluno');
  });

  it('Deve atualizar o nome do aluno', async () => {
    await alunoService.atualizarAluno(numeroTeste, { nome: 'Atualizado' });
    const aluno = await alunoService.buscarAluno(numeroTeste);
    expect(aluno.nome).toBe('Atualizado');
  });

  it('Deve deletar o aluno', async () => {
    await alunoService.removerAluno(numeroTeste);
    const aluno = await alunoService.buscarAluno(numeroTeste);
    expect(aluno).toBeNull();
  });
});