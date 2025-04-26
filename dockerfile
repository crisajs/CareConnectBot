# Escolhe uma imagem Node.js oficial e enxuta
FROM node:22.1-slim

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Instala Chromium + bibliotecas obrigatórias
RUN apt-get update && apt-get install -y \
  chromium \
  libx11-xcb1 libxcomposite1 libxdamage1 libxi6 libxtst6 libnss3 libxss1 \
  libxkbcommon0 libasound2 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
  libgbm1 libpango-1.0-0 libgtk-3-0 ca-certificates fonts-liberation \
  libappindicator3-1 lsb-release xdg-utils \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# Copia package.json e yarn.lock primeiro para cache de dependências
COPY package.json yarn.lock ./

# Instala dependências
RUN yarn install --frozen-lockfile

# Copia o restante do projeto
COPY . .

# Define variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Comando de inicialização
CMD ["node", "index.js"]