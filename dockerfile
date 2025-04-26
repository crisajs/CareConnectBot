# 🚀 Build stage (apenas para instalar dependências)
FROM node:20-slim AS builder

WORKDIR /app

# 🔥 Copia apenas arquivos essenciais primeiro para cache
COPY package*.json ./

# 🛠️ Instala dependências de forma limpa e rápida
RUN npm ci --omit=dev

# 🔥 Copia todo o restante do projeto
COPY . .

# ✅ Production stage (imagem final enxuta)
FROM node:20-slim

WORKDIR /app

# 🔽 Instala apenas o Chromium e libs necessárias
RUN echo "🚀 Instalando Chromium e dependências..." && \
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

# 🧹 Copia só o que precisamos da stage anterior
COPY --from=builder /app /app

# 🧠 Variáveis de ambiente
ENV NODE_ENV=production
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# 🌐 Expor porta (caso necessário)
EXPOSE 3000

# ❤️ Adiciona HEALTHCHECK (ping no servidor)
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# 🟢 Comando principal
CMD ["node", "index.js"]