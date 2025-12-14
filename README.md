# finansOS - Slack Entegreli Finans Yönetim Sistemi

finansOS, Slack komutları üzerinden finansal işlemlerinizi yönetmenize, bunları OpenAI ile işlemenize ve Notion, Google Sheets, WhatsApp üzerinden senkronize etmenize olanak sağlayan Node.js tabanlı bir sistemdir.

## 🎯 Özellikler

- **Slack Integration**: `/finans` komutları ile doğrudan Slack'ten işlem yönetimi
- **OpenAI Entegrasyonu**: Doğal dil işlemeyle finansal komutları otomatik ayrıştırma
- **Notion Database**: Tüm işlemleri Notion veritabanında saklama
- **Google Sheets**: Finansal logları otomatik olarak e-tabloya yazma
- **WhatsApp Alarmları**: Baileys ile WhatsApp üzerinden acil uyarı bildirimleri
- **Akıllı Alarm Sistemi**: Öncelik ve tutar bazlı otomatik alarm tetikleme

## 📋 Sistem Mimarisi

```
Slack /finans command
       ↓
  Node.js Server
       ↓
   OpenAI (NLP Parsing)
       ↓
  ├─ Notion Database
  ├─ Google Sheets
  ├─ WhatsApp (Baileys)
  └─ Slack Channels (log/alarm)
```

## 🚀 Hızlı Başlangıç

### Ön Koşullar
- Node.js v18+
- npm
- Slack hesabı ve workspace
- OpenAI API anahtarı
- Notion hesabı
- Google Cloud Project
- WhatsApp (normal numara)

### 1. Proje Kurulumu

```bash
# Projeyi klonla
git clone https://github.com/omerfarukkural/finans.git
cd finans-os

# Bağımlılıkları yükle
npm install

# .env dosyasını oluştur
cp .env.example .env
# .env dosyasını kendi değerlerin ile doldur
```

### 2. API Anahtarları Ayarlaması

#### OpenAI API Anahtarı
1. https://platform.openai.com/api-keys adresine git
2. Yeni API anahtarı oluştur
3. `.env` dosyasında `OPENAI_API_KEY` kısmına yapıştır

#### Slack Bot Kurulumu
1. https://api.slack.com/apps adresine git
2. "Create New App" → "From scratch"
3. App adı: `FinansOS`
4. Workspace seç
5. **OAuth & Permissions** → Scopes ekle:
   - `chat:write`
   - `commands`
6. **Slash Commands** → `/finans` komutunu ekle
7. Bot User OAuth Token'ı `.env`'ye kopyala (`SLACK_BOT_TOKEN`)
8. **Basic Information** → Signing Secret'ı `.env`'ye kopyala

#### Notion Entegrasyonu
1. https://www.notion.com/my-integrations adresine git
2. "Create new integration" → "Internal"
3. Token'ı `.env`'ye kopyala (`NOTION_TOKEN`)
4. Finans veritabanını oluştur (aşağıdaki özellikleri ekle):
   - Ad (Title)
   - İşlem Türü (Select)
   - Tutar (Number)
   - Etiket (Multi-select)
   - Faiz (Number)
   - Öncelik (Select)
   - Alarm (Checkbox)
   - Karar (Select)
   - Açıklama (Text)
   - Kaynak (Select)
   - Slack Kullanıcı (Text)
   - Slack Kanal (Text)
5. Veritabanı ID'sini `.env`'ye kopyala (`NOTION_FINANS_DB`)
6. Integration'ı veritabanında "Share" et

#### Google Sheets Ayarlaması
1. https://console.cloud.google.com/ adresine git
2. Yeni proje oluştur
3. **APIs & Services** → Sheets API'yi enable et
4. **Service Accounts** → Yeni service account oluştur
5. JSON anahtarı indir
6. `.env`'de `GOOGLE_SERVICE_ACCOUNT_JSON` kısmına yapıştır
7. Google Sheet oluştur ve `finans_log` adında bir sheet ekle
8. Sheet ID'sini `.env`'ye kopyala (`FINANS_SHEET_ID`)
9. Service account emailini sheet'e "Editor" yetkisiyle davet et

#### WhatsApp Kurulumu
1. WhatsApp Bağlı Cihazları aç
2. Sunucu başlatıldığında QR kodunu tara
3. Hedef numara: `.env`'de `WHATSAPP_TARGET` (90 ile başlayan, 0 olmayan)

### 3. Sunucuyu Başlat

```bash
npm start
```

WhatsApp QR kodunu taradıktan sonra sistem hazır olacaktır.

### 4. Ngrok ile Dış Erişim (Slack webhook'u için)

```bash
# Başka bir terminalde
ngrok http 3000

# Çıkan HTTPS URL'sini kopyala
# Slack App Settings → Slash Commands → /finans → Request URL:
# https://YOUR_NGROK_URL/slack/finans
```

## 💬 Kullanım Örneği

Slack'te `#finans` kanalında:

```
/finans
islem: borc_ekle
ad: X Bankası kredi kartı
tutar: 12000
etiket: banka
faiz: 3.5
oncelik: ACIL
aciklama: temassız alışverişler
```

### Beklenen Sonuçlar

✅ **Slack**: İşlem kaydedildi mesajı (ephemeral)
📋 **#finans-log**: Detay log mesajı
🚨 **#finans-alarm**: ACİL uyarısı (oncelik=ACIL veya tutar>5000 ise)
📊 **Notion**: Finans DB'ye yeni kayıt
📈 **Google Sheets**: finans_log sayfasına satır eklenmesi
📱 **WhatsApp**: Alarm mesajı (Baileys üzerinden)

## 🔐 Güvenlik Notları

⚠️ **Asla `.env` dosyasını GitHub'a push etme!**
- `.gitignore` zaten `.env` dosyasını ignore ediyor
- Sadece `.env.example` version kontrol altında
- GitHub Secrets kullanarak sensitive değerleri yönet

## 🐳 Docker ile Çalıştırma

```bash
docker build -t finans-os .
docker run --env-file .env -p 3000:3000 finans-os
```

## 📦 Bağımlılıklar

- **express**: Web sunucusu
- **dotenv**: Çevre değişkenleri
- **@whiskeysockets/baileys**: WhatsApp client
- **googleapis**: Google Sheets API
- **node-fetch**: HTTP istekleri

## 🆘 Sorun Giderme

### WhatsApp bağlantısı başlamıyor
- QR kodu yanlış tarıldı mı kontrol et
- `wa_auth/` klasörünü sil ve yeniden başlat
- WhatsApp'ın bağlı cihazlarında en fazla 5 cihaz olabilir

### Slack mesajları gönderilmiyor
- Bot token'ını kontrol et
- Kanalların bot'a invite edildiğini kontrol et
- Ngrok URL'sini güncellediyseniz Slack'te Request URL'yi güncelle

### Notion/Sheets yazma başarısız
- API tokenlerini kontrol et
- Integration'ı veritabanında/sheet'te share ettiğini kontrol et
- JSON yapısını valide et

## 📚 API Endpoints

### POST `/slack/finans`
Slack slash command webhook endpoint'i

**Request Body (x-www-form-urlencoded)**:
```
text: islem: borc_ekle...
user_name: username
channel_id: C0XXXXXXX
```

**Response**:
```json
{
  "response_type": "ephemeral",
  "text": "✅ İşlem kaydedildi..."
}
```

## 🤝 Katkı Yapma

1. Fork et
2. Feature branch oluştur (`git checkout -b feature/amazing-feature`)
3. Commit et (`git commit -m 'Add amazing feature'`)
4. Push et (`git push origin feature/amazing-feature`)
5. Pull Request aç

## 📄 Lisans

MIT

## 👤 Geliştirici

**Ömer Faruk Kural**
- GitHub: [@omerfarukkural](https://github.com/omerfarukkural)
- Web: www.bitebimuv.org

## 💡 Roadmap

- [ ] Docker Compose yapılandırması
- [ ] Kubernetes deployment
- [ ] PostgreSQL veritabanı entegrasyonu
- [ ] İstatistik dashboard
- [ ] Telegram bot desteği
- [ ] Discord entegrasyonu
- [ ] Cron jobs (periyodik reportlar)
- [ ] Multi-user support

---

**Not**: Bu sistem aktif geliştirme aşamasındadır. Hatalar veya öneriler için issue açınız.
