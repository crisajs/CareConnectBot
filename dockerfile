# ✅ Base mais estável e compatível com Puppeteer
FROM node:20-slim

# 🔧 Diretório de trabalho
WORKDIR /app

# 🔽 Instala Chromium e dependências
RUN echo "🚀 Instalando dependências do Chromium..." && \
  apt-get update && apt-get install -y \
  chromium \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdbus-1-3 \
  libgdk-pixbuf2.0-0 \
  libnspr4 \
  libnss3 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  xdg-utils \
  --no-install-recommends && \
  apt-get clean && rm -rf /var/lib/apt/lists/* && \
  echo "✅ Chromium instalado com sucesso!"

# 🔽 Copia arquivos de dependência
COPY package*.json ./

# 🧶 Instala dependências do Node.js
RUN echo "📦 Instalando dependências do Node..." && npm install

# 🔽 Copia o restante do projeto
COPY . .

# 🧠 Variáveis de ambiente
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# 🌐 Expõe a porta (caso necessário)
EXPOSE 3000

# 🟢 Comando principal
CMD ["node", "index.js"]