# Use a imagem Node.js oficial como base (ela será ARM64 no seu Mac M1/M2/M3)
FROM node:20

# (Opcional, mas recomendado) Instalar dependências do Puppeteer/Chromium para Debian/Ubuntu
# Referência: https://pptr.dev/troubleshooting#running-puppeteer-on-debian-or-ubuntu
# Precisamos rodar como root para instalar pacotes
USER root
RUN apt-get update && apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils \
    # Instalar o Chromium
    chromium \
    # Limpar o cache do apt para reduzir o tamanho da imagem
    && rm -rf /var/lib/apt/lists/*

# Define o diretório de trabalho no container
WORKDIR /app

# Copia os arquivos de dependência
COPY package*.json ./
COPY yarn.lock ./

# Instala as dependências do projeto (sem baixar o Chromium do Puppeteer)
# A variável de ambiente será definida no docker run ou docker-compose
RUN yarn install --frozen-lockfile

# Copia o restante do código da aplicação para o diretório de trabalho
COPY . .

# (Opcional) Muda de volta para o usuário node se necessário/desejado
# USER node

# Expõe a porta que a aplicação usa (se aplicável, ajuste se for diferente)
EXPOSE 3000

# Comando para iniciar a aplicação quando o container iniciar
CMD [ "yarn", "start" ] # Assumindo que você tem um script "start" no package.json: "start": "node src/server.js"
# Ou diretamente:
# CMD [ "node", "src/server.js" ]