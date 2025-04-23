// src/models/Aluno.js
const mongoose = require('mongoose');

const AlunoSchema = new mongoose.Schema({
  nome: String,
  numero: { type: String, required: true, unique: true }, // ✅ Aqui já define o índice
  estado: { 
    type: String, 
    enum: ['NOVO', 'MENU', 'CURSO', 'CANCEL_CONFIRM', 'FINISHED'], 
    default: 'NOVO' 
  },
  aguardandoNome: { type: Boolean, default: false },
  diaAtual: { type: Number, default: 1 },
  porcentagemConcluida: { type: Number, default: 0 },
  iniciado: { type: Boolean, default: false },
  menuExibido: { type: Boolean, default: true },
  pontuacao: { type: Number, default: 0 },
  cancelConfirm: { type: Boolean, default: false },
  respondeuAulaAtual: { type: Boolean, default: false },
  aulasConcluidas: { type: Number, default: 0 },
  ultimaAulaConcluida: { type: String, default: null },
  respostaCorreta: { type: String, default: null },
  aulaJafoiEnviada: { type: Boolean, default: false }
});

module.exports = mongoose.model('Aluno', AlunoSchema);