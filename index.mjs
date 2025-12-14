import 'dotenv/config';
import express from 'express';
import { google } from 'googleapis';
import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers
} from '@whiskeysockets/baileys';
import crypto from 'crypto';
import fetch from 'node-fetch';

if (!globalThis.fetch) {
  globalThis.fetch = fetch;
}

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  if (
    req.method === 'POST' &&
    req.headers['content-type']?.includes('application/x-www-form-urlencoded')
  ) {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      req.rawBody = data;
      next();
    });
  } else {
    next();
  }
});

let waSock = null;
async function initWhatsApp() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState('./wa_auth');
    const { version } = await fetchLatestBaileysVersion();
    waSock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      version,
      browser: Browsers.macOS('Chrome')
    });
    waSock.ev.on('creds.update', saveCreds);
    waSock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect } = update;
      if (connection === 'open') {
        console.log('✅ WhatsApp bağlantısı açık');
      } else if (connection === 'close') {
        console.log('❌ WhatsApp bağlantısı kapandı, yeniden deneniyor...');
        initWhatsApp().catch(err => console.error('WA reconnect error', err));
      }
    });
  } catch (err) {
    console.error('WhatsApp init error:', err);
  }
}

async function sendWhatsAppAlarm(message) {
  try {
    if (!waSock) {
      console.log('WhatsApp soketi hazır değil, mesaj atlanıyor.');
      return;
    }
    const target = process.env.WHATSAPP_TARGET;
    if (!target) {
      console.log('WHATSAPP_TARGET tanımlı değil.');
      return;
    }
    const jid = `${target}@s.whatsapp.net`;
    await waSock.sendMessage(jid, { text: message });
    console.log('WhatsApp alarm mesajı gönderildi.');
  } catch (err) {
    console.error('WhatsApp alarm hatası:', err);
  }
}

function verifySlackSignature(req) {
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  if (!signingSecret) return true;
  const timestamp = req.headers['x-slack-request-timestamp'];
  const signature = req.headers['x-slack-signature'];
  if (!timestamp || !signature) return false;
  const fiveMinutesAgo = Math.floor(Date.now() / 1000) - (60 * 5);
  if (Number(timestamp) < fiveMinutesAgo) return false;
  const sigBaseString = `v0:${timestamp}:${req.rawBody}`;
  const mySig = 'v0=' + crypto
    .createHmac('sha256', signingSecret)
    .update(sigBaseString)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(
      Buffer.from(mySig, 'utf8'),
      Buffer.from(signature, 'utf8')
    );
  } catch {
    return false;
  }
}

app.post('/slack/finans', async (req, res) => {
  try {
    if (!verifySlackSignature(req)) {
      return res.status(401).send('Invalid Slack signature');
    }

    const text = req.body.text || '';
    const userName = req.body.user_name || '';
    const channelId = req.body.channel_id || '';

    if (!text.trim()) {
      return res.json({ text: 'Komut gövdesi boş. Lütfen /finans formatını kullan.' });
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return res.json({ text: 'OPENAI_API_KEY tanımlı değil.' });
    }

    const prompt = `Sen bir Finans OS komut ayrıştırıcısın. Kullanıcı sana Slack /finans komutunun gövdesini verecek.
Görevlerin:
- Metindeki alanları yakala: islem, ad, tutar, etiket, faiz, oncelik, aciklama
- Eksik alan varsa "valid": false ve "hata" mesajı üret.
- Her şey uygunsa "valid": true ve alanları doldur.

Kurallar:
- "tutar" sayıya dönüştür (virgüllü ise noktaya çevir).
- "faiz" yoksa null yaz.
- "oncelik" sadece: "ACIL", "YUKSEK", "NORMAL".
- "alarm" alanı:
  - oncelik == "ACIL" ise alarm = true
  - VEYA islem == "borc_ekle" ve tutar > 5000 ise alarm = true
  - aksi halde alarm = false.
- islem == "yatirim_ekle" ise: "karar": "BASLA" | "IZLE" | "DUR"
- Diğer tüm işlemlerde "karar": "IZLE".

Sadece JSON döndür (ekstra açıklama yazma):
{
  "valid": true/false,
  "islem": "...",
  "ad": "...",
  "tutar": 0,
  "etiket": "...",
  "faiz": null,
  "oncelik": "ACIL" | "YUKSEK" | "NORMAL",
  "aciklama": "...",
  "alarm": true/false,
  "karar": "BASLA" | "IZLE" | "DUR",
  "hata": "..."
}

KOMUT METNİ:
${text}`;

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'JSON üreten bir finans komut ayrıştırıcısın.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0
      })
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error('OpenAI error:', errText);
      return res.json({ text: 'Komut ayrıştırılırken OpenAI hatası oluştu.' });
    }

    const openaiJson = await openaiRes.json();
    const content = openaiJson.choices?.[0]?.message?.content ?? '';
    let payload;
    try {
      payload = JSON.parse(content);
    } catch (e) {
      console.error('OpenAI JSON parse error. Content:', content);
      return res.json({ text: 'OpenAI yanıtı geçersiz JSON üretti.' });
    }

    if (!payload.valid) {
      const hata = payload.hata || 'Geçersiz komut.';
      return res.json({ text: `❌ Komut hatalı: ${hata}` });
    }

    let notionUrl = '';
    if (process.env.NOTION_TOKEN && process.env.NOTION_FINANS_DB) {
      try {
        const notionRes = await fetch('https://api.notion.com/v1/pages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            parent: { database_id: process.env.NOTION_FINANS_DB },
            properties: {
              'Ad': { title: [{ text: { content: payload.ad } }] },
              'İşlem Türü': { select: { name: payload.islem } },
              'Tutar': { number: payload.tutar },
              'Etiket': { multi_select: [{ name: payload.etiket }] },
              'Faiz': { number: payload.faiz ?? null },
              'Öncelik': { select: { name: payload.oncelik } },
              'Alarm': { checkbox: !!payload.alarm },
              'Karar': { select: { name: payload.karar } },
              'Açıklama': {
                rich_text: [{ text: { content: payload.aciklama ?? '' } }]
              },
              'Kaynak': { select: { name: 'Slack' } },
              'Slack Kullanıcı': {
                rich_text: [{ text: { content: userName } }]
              },
              'Slack Kanal': {
                rich_text: [{ text: { content: channelId } }]
              }
            }
          })
        });
        if (notionRes.ok) {
          const notionData = await notionRes.json();
          notionUrl = notionData?.url || '';
        } else {
          console.error("Notion API Error:", await notionRes.text());
        }
      } catch (err) {
        console.error("Notion Error:", err);
      }
    }

    try {
      const saJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
      if (saJson && process.env.FINANS_SHEET_ID && process.env.FINANS_SHEET_ID !== 'YOUR_GOOGLE_SHEET_ID_HERE') {
        const auth = new google.auth.GoogleAuth({
          credentials: JSON.parse(saJson),
          scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        const sheets = google.sheets({ version: 'v4', auth });
        await sheets.spreadsheets.values.append({
          spreadsheetId: process.env.FINANS_SHEET_ID,
          range: 'finans_log!A:Z',
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[
              new Date().toISOString(),
              payload.islem,
              payload.ad,
              payload.tutar,
              payload.etiket,
              payload.faiz ?? '',
              payload.oncelik,
              payload.aciklama ?? '',
              payload.alarm ? 'EVET' : 'HAYIR',
              payload.karar,
              notionUrl,
              userName,
              channelId
            ]]
          }
        });
      }
    } catch (err) {
      console.error('Sheets error:', err);
    }

    if (payload.alarm) {
      const alarmText = `[Finans Alarm]
İşlem: ${payload.islem}
Ad: ${payload.ad}
Tutar: ${payload.tutar}₺
Öncelik: ${payload.oncelik}
Karar: ${payload.karar}
${notionUrl ? `Notion: ${notionUrl}` : ''}`;
      await sendWhatsAppAlarm(alarmText);
    }

    const slackBotToken = process.env.SLACK_BOT_TOKEN;
    if (slackBotToken) {
      const logText = `Yeni finans işlemi: ${payload.ad} (${payload.tutar}₺, ${payload.islem}, öncelik: ${payload.oncelik}, alarm: ${payload.alarm ? 'EVET' : 'HAYIR'}) ${notionUrl ? `\nNotion: ${notionUrl}` : ''}`;

      if (process.env.SLACK_LOG_CHANNEL) {
        await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${slackBotToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            channel: process.env.SLACK_LOG_CHANNEL,
            text: logText
          })
        });
      }

      if (payload.alarm && process.env.SLACK_ALARM_CHANNEL) {
        const alarmText = `:rotating_light: ACİL FİNANS UYARISI :rotating_light:
İşlem: ${payload.islem}
Ad: ${payload.ad}
Tutar: ${payload.tutar}₺
Öncelik: ${payload.oncelik}
Karar: ${payload.karar}${notionUrl ? `\nNotion: ${notionUrl}` : ''}`;

        await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${slackBotToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            channel: process.env.SLACK_ALARM_CHANNEL,
            text: alarmText
          })
        });
      }
    }

    return res.json({
      response_type: 'ephemeral',
      text: `✅ İşlem kaydedildi: *${payload.ad}* (${payload.tutar}₺)\nAlarm: ${payload.alarm ? 'EVET' : 'HAYIR'}`
    });
  } catch (err) {
    console.error('Genel hata:', err);
    return res.json({ text: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Finans OS server http://localhost:${port} üzerinde çalışıyor`);
  console.log('📱 WhatsApp için QR kodu bekleniyor...');
  initWhatsApp().catch(err => console.error('WhatsApp init error:', err));
});
