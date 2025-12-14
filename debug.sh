#!/bin/bash

# finansOS - Test ve Hata Ayıklama Aracı

echo "================================"
echo "finansOS - Hata Ayıklama Aracı"
echo "================================"
echo ""

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Sunucu durumu
echo -e "${YELLOW}📊 Sunucu Durumu${NC}"
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Sunucu aktif (http://localhost:3000)${NC}"
else
    echo -e "${RED}❌ Sunucu yanıt vermiyor${NC}"
fi

echo ""

# 2. WhatsApp bağlantısı
echo -e "${YELLOW}📱 WhatsApp Durumu${NC}"
if [ -d "wa_auth" ] && [ "$(ls -A wa_auth)" ]; then
    echo -e "${GREEN}✅ WhatsApp auth dosyaları mevcut${NC}"
else
    echo -e "${YELLOW}⚠️  WhatsApp henüz bağlanmamış - QR kodu tarayın${NC}"
fi

echo ""

# 3. Ortam değişkenleri
echo -e "${YELLOW}🔑 Ortam Değişkenleri${NC}"
REQUIRED_VARS=(
    "OPENAI_API_KEY"
    "SLACK_BOT_TOKEN"
    "NOTION_TOKEN"
    "WHATSAPP_TARGET"
)

for var in "${REQUIRED_VARS[@]}"; do
    if grep -q "^$var=" .env 2>/dev/null; then
        VAL=$(grep "^$var=" .env | cut -d'=' -f2 | cut -c1-20)...
        echo -e "${GREEN}✅ $var (değer: $VAL)${NC}"
    else
        echo -e "${RED}❌ $var ayarlanmamış${NC}"
    fi
done

echo ""

# 4. Bağımlılıklar
echo -e "${YELLOW}📦 Bağımlılıklar${NC}"
for pkg in "express" "dotenv" "@whiskeysockets/baileys" "googleapis"; do
    if npm list "$pkg" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $pkg${NC}"
    else
        echo -e "${RED}❌ $pkg${NC}"
    fi
done

echo ""

# 5. Log dosyaları (varsa)
echo -e "${YELLOW}📝 Son Log Satırları${NC}"
if [ -f "*.log" ]; then
    echo "$(ls *.log 2>/dev/null | head -1 | xargs tail -5)"
else
    echo "Log dosyası bulunamadı"
fi

echo ""
echo "================================"
