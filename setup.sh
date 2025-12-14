#!/bin/bash

# finansOS - Kurulum ve Başlangıç Rehberi
# Bu script, finansOS sistemini başlatmak için gereken tüm adımları kontrol eder

set -e

echo "================================"
echo "finansOS - Kurulum Kontrol Paneli"
echo "================================"
echo ""

# 1. Node.js kontrolü
echo "📋 1. Node.js Kontrolü..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "✅ Node.js kurulu: $NODE_VERSION"
else
    echo "❌ Node.js bulunamadı. Lütfen Node.js v18+ kurun."
    exit 1
fi

# 2. npm kontrol
echo ""
echo "📋 2. npm Kontrolü..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo "✅ npm kurulu: $NPM_VERSION"
else
    echo "❌ npm bulunamadı."
    exit 1
fi

# 3. Bağımlılıklar
echo ""
echo "📋 3. Bağımlılıkları Yükleme..."
if [ ! -d "node_modules" ]; then
    echo "📦 node_modules bulunamadı, yükleniyor..."
    npm install
else
    echo "✅ Bağımlılıklar zaten yüklü"
fi

# 4. .env kontrolü
echo ""
echo "📋 4. Çevre Dosyası (.env) Kontrolü..."
if [ ! -f ".env" ]; then
    echo "⚠️  .env dosyası bulunamadı!"
    echo "📄 .env.example dosyasından kopyalanıyor..."
    cp .env.example .env
    echo "❌ Lütfen .env dosyasını kendi API anahtarlarınız ile doldurun:"
    echo "   - OPENAI_API_KEY"
    echo "   - SLACK_BOT_TOKEN"
    echo "   - SLACK_SIGNING_SECRET"
    echo "   - NOTION_TOKEN"
    echo "   - NOTION_FINANS_DB"
    echo "   - GOOGLE_SERVICE_ACCOUNT_JSON"
    echo "   - FINANS_SHEET_ID"
    echo "   - WHATSAPP_TARGET"
    exit 1
else
    echo "✅ .env dosyası mevcut"
fi

# 5. Temel API anahtarları kontrol
echo ""
echo "📋 5. API Anahtarları Kontrolü..."
if grep -q "BURAYA_KENDI" .env; then
    echo "⚠️  UYARI: .env dosyasında eksik API anahtarları var!"
    echo "Lütfen tüm BURAYA_KENDI_... satırlarını doldurun"
    exit 1
else
    echo "✅ API anahtarları görünüşte set edilmiş"
fi

# 6. Port kontrol
echo ""
echo "📋 6. Port (3000) Kontrolü..."
if lsof -i :3000 &> /dev/null; then
    echo "⚠️  Port 3000 zaten kullanımda"
    PID=$(lsof -ti :3000)
    echo "   PID: $PID"
    read -p "   Öldürmek ister misiniz? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill -9 $PID
        echo "✅ İşlem sonlandırıldı"
    fi
else
    echo "✅ Port 3000 boş"
fi

# 7. WhatsApp auth dizini
echo ""
echo "📋 7. WhatsApp Auth Dizini Kontrolü..."
if [ ! -d "wa_auth" ]; then
    mkdir -p wa_auth
    echo "✅ wa_auth dizini oluşturuldu"
else
    echo "✅ wa_auth dizini mevcut"
fi

echo ""
echo "================================"
echo "✅ Tüm Kontroller Başarılı!"
echo "================================"
echo ""
echo "Sunucuyu başlatmak için çalıştırın:"
echo "  npm start"
echo ""
echo "Docker ile çalıştırmak için:"
echo "  docker-compose up -d"
echo ""
