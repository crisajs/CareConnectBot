const fs = require('fs').promises;

class AulaService {
  constructor() {
    this.aulas = [];
    this.curiosidades = [
      "👴 Você sabia? O cuidador mais velho registrado tinha 92 anos e ainda estava ativo!",
      "💙 Os cuidadores muitas vezes reduzem o estresse dos idosos apenas segurando suas mãos.",
      "🌿 Alguns cuidadores usam aromaterapia para ajudar os idosos a relaxar e dormir melhor.",
      "📚 Os primeiros cuidadores profissionais surgiram no século 19 na Europa.",
      "😊 Um sorriso de um cuidador pode melhorar instantaneamente o humor de um idoso.",
      "🏃‍♂️ Caminhadas regulares com um cuidador podem adicionar anos à vida de um idoso.",
      "🎶 A terapia com música, guiada por cuidadores, ajuda na memória de pacientes com Alzheimer.",
      "🤝 Muitos cuidadores se tornam como família para os idosos que cuidam.",
      "🌞 A exposição ao sol, incentivada por cuidadores, aumenta os níveis de vitamina D nos idosos.",
      "📅 O cuidador médio trabalha mais de 20 horas por semana para seus idosos.",
      "❤️ O risco de doenças cardíacas diminui quando os idosos recebem apoio constante de cuidadores.",
      "🐶 Animais de estimação, com ajuda de cuidadores, reduzem a solidão nos idosos.",
      "🎨 Atividades de arte lideradas por cuidadores melhoram as habilidades cognitivas dos idosos.",
      "🌱 Jardinar com um cuidador pode melhorar a mobilidade e a saúde mental.",
      "📞 Os cuidadores frequentemente fazem ligações diárias para verificar seus idosos.",
      "💪 Treinos de força, guiados por cuidadores, ajudam a prevenir quedas em idosos.",
      "😴 Boa higiene do sono, ensinada por cuidadores, é essencial para a saúde dos idosos.",
      "🌺 Flores trazidas por cuidadores podem alegrar o dia dos idosos.",
      "📖 Ler em voz alta por cuidadores estimula a memória e o engajamento.",
      "🚶‍♀️ Cuidadores incentivam exercícios leves para manter a flexibilidade.",
      "🎉 Celebrar pequenas conquistas com um cuidador aumenta a moral dos idosos.",
      "🍎 Uma dieta equilibrada, planejada por cuidadores, apoia a saúde a longo prazo.",
      "🤸 Rotinas de alongamento lideradas por cuidadores reduzem a rigidez nos idosos.",
      "🌧️ Jogos internos organizados por cuidadores mantêm os idosos ativos em dias chuvosos.",
      "💬 Conversas com cuidadores podem atrasar o declínio cognitivo.",
      "🏡 Muitos cuidadores ajudam os idosos a envelhecerem com segurança em casa.",
      "🎬 Assistir a filmes antigos com um cuidador pode evocar memórias felizes.",
      "🌊 Nadar, com supervisão de cuidadores, beneficia as articulações dos idosos.",
      "📅 Cuidadores frequentemente ajudam os idosos a acompanhar horários de medicação.",
      "😇 A gentileza de um cuidador pode transformar o dia de um idoso!"
    ];
  }

  async carregarAulas() {
    try {
      const data = await fs.readFile('./aulas.json', 'utf-8');
      this.aulas = JSON.parse(data);
      console.log('[INFO] Aulas carregadas com sucesso.');
    } catch (error) {
      console.error('[ERROR] Erro ao carregar aulas:', error);
    }
  }

  getAula(dia) {
    return this.aulas[Math.min(dia - 1, this.aulas.length - 1)];
  }

  getCuriosidadeAleatoria() {
    return this.curiosidades[Math.floor(Math.random() * this.curiosidades.length)];
  }

  formatPergunta(aula) {
    if (!aula || !aula.alternativas) {
      return '❓ Pergunta indisponível.';
    }

    const { a, b, c } = aula.alternativas;
    return [
      '*❓ Qual a resposta correta?*',
      `A) ${a}`,
      `B) ${b}`,
      `C) ${c}`
    ].join('\n');
  }
}

module.exports = AulaService;