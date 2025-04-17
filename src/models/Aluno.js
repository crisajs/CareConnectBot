// src/models/Aluno.js
const mongoose = require('mongoose');

const AlunoSchema = new mongoose.Schema({
  nome: String,
  numero: String,
  diaAtual: { type: Number, default: 1 },
  porcentagemConcluida: { type: Number, default: 0 },
  iniciado: { type: Boolean, default: false },
  menuExibido: { type: Boolean, default: true },
  pontuacao: { type: Number, default: 0 },
  cancelConfirm: { type: Boolean, default: false },
  respondeuAulaAtual: { type: Boolean, default: false },
  aulasConcluidas: { type: Number, default: 0 },
  ultimaAulaConcluida: { type: String, default: null },
  respostaCorreta: { type: String, default: null }
});

module.exports = mongoose.model('Aluno', AlunoSchema);