FROM node:20-slim

WORKDIR /app

# Bağımlılıkları kopyala
COPY package*.json ./

# Bağımlılıkları yükle
RUN npm ci --only=production

# Uygulama kodunu kopyala
COPY index.mjs .

# WhatsApp auth dizini
RUN mkdir -p wa_auth

# Port 3000'i expose et
EXPOSE 3000

# Sunucuyu başlat
CMD ["node", "index.mjs"]
