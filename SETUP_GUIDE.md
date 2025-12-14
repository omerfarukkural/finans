# finansOS - Kurulum Tamamlama Rehberi

## 🎯 Sistem Özeti

finansOS, Slack üzerinden finans işlemlerinizi yönetmenize, OpenAI NLP ile otomatik ayrıştırmanıza ve Notion + Google Sheets + WhatsApp üzerinden senkronize etmenize olanak sağlar.

**GitHub Repository**: https://github.com/omerfarukkural/finans

## 📋 Yapılması Gerekenler (CHECKLIST)

### ✅ Tamamlananlar
- [x] Node.js/Express sunucusu
- [x] OpenAI entegrasyonu (NLP parsing)
- [x] Slack slash command handler
- [x] Notion database writer
- [x] Google Sheets logger
- [x] Baileys WhatsApp client
- [x] Error handling & logging
- [x] Docker & Docker Compose desteği
- [x] GitHub repository push
- [x] .env security (sensitive data protected)
- [x] README.md documentation
- [x] Setup validation script

### ⏳ Yapılacaklar (Sırası ile)

1. **API Anahtarlarını Ayarla** (5 dakika)
   ```bash
   # 1. OpenAI: https://platform.openai.com/api-keys
   OPENAI_API_KEY=sk-proj-...
   
   # 2. Slack: https://api.slack.com/apps → FinansOS app
   SLACK_BOT_TOKEN=xoxb-...
   SLACK_SIGNING_SECRET=...
   
   # 3. Notion: https://www.notion.com/my-integrations
   NOTION_TOKEN=ntn_...
   NOTION_FINANS_DB=uuid
   
   # 4. Google: https://console.cloud.google.com/
   GOOGLE_SERVICE_ACCOUNT_JSON={...}
   FINANS_SHEET_ID=sheet-id
   
   # 5. WhatsApp
   WHATSAPP_TARGET=905316078651
   ```

2. **Slack App Ayarlaması** (10 dakika)
   - https://api.slack.com/apps → Create New App
   - App name: FinansOS
   - OAuth & Permissions → Scopes: chat:write, commands
   - Slash Commands → /finans
   - Request URL: https://YOUR_NGROK_URL/slack/finans
   - Bot çalışan numaraya invite et

3. **Notion Database Oluştur** (5 dakika)
   - https://notion.so → Database → Table
   - Alanlar: Ad, İşlem Türü, Tutar, Etiket, Faiz, Öncelik, Alarm, Karar, Açıklama, Kaynak, Slack Kullanıcı, Slack Kanal
   - Integration share et

4. **Google Sheets Ayarla** (10 dakika)
   - https://console.cloud.google.com → New Project
   - Sheets API enable
   - Service Account → JSON key → GOOGLE_SERVICE_ACCOUNT_JSON
   - Sheet oluştur → finans_log sheet ekle
   - Service account email'ini share et

5. **Sunucuyu Başlat** (2 dakika)
   ```bash
   cd ~/finans-os
   npm install
   npm start
   # QR kodu WhatsApp'ta tara
   ```

6. **Ngrok Tunnel Aç** (2 dakika)
   ```bash
   ngrok http 3000
   # HTTPS URL'sini Slack Request URL'sine kopyala
   ```

7. **Test Et** (3 dakika)
   Slack #finans kanalında:
   ```
   /finans
   islem: borc_ekle
   ad: X Bankası
   tutar: 12000
   etiket: banka
   faiz: 3.5
   oncelik: ACIL
   aciklama: test
   ```

## 🚀 Hızlı Başlangıç

### Seçenek 1: Local Node.js

```bash
# 1. Klonla
git clone https://github.com/omerfarukkural/finans.git
cd finans-os

# 2. Kontrol et
bash setup.sh

# 3. .env doldur
nano .env

# 4. Başlat
npm start
```

### Seçenek 2: Docker Compose

```bash
# 1. Klonla & dizine gir
git clone https://github.com/omerfarukkural/finans.git
cd finans-os

# 2. .env doldur
cp .env.example .env
nano .env

# 3. Başlat
docker-compose up -d

# 4. Logları izle
docker-compose logs -f finans-os
```

### Seçenek 3: Docker

```bash
docker build -t finans-os .
docker run --env-file .env -p 3000:3000 -v $(pwd)/wa_auth:/app/wa_auth finans-os
```

## 🔐 Güvenlik Notları

⚠️ **ÖNEMLİ**: Asla `.env` dosyasını GitHub'a push etmeyin!

- `.env` zaten `.gitignore`'da
- GitHub Secrets kullanarak CI/CD'de sensitive data yönet
- API anahtarlarını değişdir
- Rate limits kontrol et

## 📊 Beklenen Akış

```
Slack Kullanıcı
    ↓
/finans komutu
    ↓
Express Endpoint
    ↓
OpenAI NLP Parser
    ↓
├─ Notion Database (saklı)
├─ Google Sheets (log)
├─ WhatsApp (alarm)
├─ Slack Log Channel
└─ Slack Alarm Channel (ACIL için)
```

## 🆘 Sorun Giderme

### "Port 3000 zaten kullanımda"
```bash
lsof -i :3000
kill -9 PID
```

### "WhatsApp bağlantısı başlamıyor"
```bash
rm -rf wa_auth
npm start  # Yeni QR kodu tara
```

### "Slack mesajı gönderilmiyor"
- Bot token doğru mu?
- Kanal ID'leri doğru mu?
- Bot kanalına davetli mi?

### "Notion/Sheets yazma başarısız"
- JSON yapısı doğru mu?
- Permissions paylaşılmış mı?
- Veritabanı/Sheet ID doğru mu?

## 📞 İletişim

**Geliştirici**: Ömer Faruk Kural
- GitHub: @omerfarukkural
- Email: omerfarukkural@gmail.com
- Web: www.bitebimuv.org

## 📚 Faydalı Bağlantılar

- [Node.js Docs](https://nodejs.org/docs/)
- [Express.js](https://expressjs.com/)
- [OpenAI API](https://platform.openai.com/docs)
- [Slack API](https://api.slack.com/)
- [Notion API](https://developers.notion.com/)
- [Google Sheets API](https://developers.google.com/sheets)
- [Baileys Docs](https://github.com/WhiskeySockets/Baileys)

## 💡 Gelecek Planlar

- PostgreSQL database
- İstatistik dashboard
- Telegram bot
- Discord entegrasyonu
- Cron jobs (periyodik reportlar)
- Multi-user support
- Email notifications
- SMS support

---

**Başarılar!** 🎉

Herhangi bir soru için GitHub Issues'i açın.
