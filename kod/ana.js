// ana.js — Asistanın çekirdeği. Yükleyici bu dosyayı ve modülleri GitHub'dan indirip çalıştırır.
// Veri her zaman telefonda kalır: iCloud Drive > Scriptable > Asistan > veri.json

const MODEL = "claude-opus-5-5"; // daha ucuz istersen: "claude-haiku-5-5"
const KEY_NAME = "anthropic_api_key";

const fm = FileManager.iCloud();
const klasor = fm.joinPath(fm.documentsDirectory(), "Asistan");
if (!fm.fileExists(klasor)) fm.createDirectory(klasor);
const dosya = fm.joinPath(klasor, "veri.json");

// ---------- Veri ----------
async function veriOku() {
  if (!fm.fileExists(dosya)) return { kayitlar: [] };
  await fm.downloadFileFromiCloud(dosya);
  try { return JSON.parse(fm.readString(dosya)); } catch (e) { return { kayitlar: [] }; }
}
function veriYaz(veri) {
  if (fm.fileExists(dosya)) fm.writeString(dosya + ".yedek", fm.readString(dosya)); // bir önceki hal
  fm.writeString(dosya, JSON.stringify(veri, null, 2));
}

// ---------- API anahtarı (Anahtar Zinciri) ----------
async function anahtarAl() {
  if (Keychain.contains(KEY_NAME)) return Keychain.get(KEY_NAME);
  const a = new Alert();
  a.title = "Claude API anahtarı";
  a.message = "console.anthropic.com adresinden aldığın anahtarı yapıştır. Bir kez sorulur, telefonda saklanır.";
  a.addSecureTextField("sk-ant-...");
  a.addAction("Kaydet");
  a.addCancelAction("Vazgeç");
  if ((await a.present()) === -1) throw new Error("Anahtar girilmedi.");
  const k = a.textFieldValue(0).trim();
  Keychain.set(KEY_NAME, k);
  return k;
}

// ---------- Girdi ----------
async function girdiAl(args) {
  if (args.shortcutParameter) return String(args.shortcutParameter);
  if (args.plainTexts && args.plainTexts.length)
    return "Paylaşılan metin (büyük ihtimalle bir emlakçı ilanı veya müşteri mesajı, uygun türde kaydet):\n" + args.plainTexts.join("\n");
  if (args.urls && args.urls.length) return "Paylaşılan bağlantı, not olarak kaydet: " + args.urls.join(" ");
  const a = new Alert();
  a.title = "Asistan";
  a.message = "Ne yapayım? (ör. 'Kadıköy 3+1 daire, 25 bin kira, emlakçı Ahmet' veya 'bu ay giderim ne kadar?')";
  a.addTextField("Yaz...");
  a.addAction("Gönder");
  a.addCancelAction("Vazgeç");
  if ((await a.present()) === -1) return null;
  return a.textFieldValue(0);
}

// ---------- Claude ----------
function sema(turler) {
  return {
    type: "object",
    properties: {
      islem: { type: "string", enum: ["ekle", "guncelle", "sil", "cevap"] },
      tur: { type: "string", enum: [...turler, "yok"] },
      hedef_id: { type: "string" },
      alanlar: {
        type: "array",
        items: {
          type: "object",
          properties: { anahtar: { type: "string" }, deger: { type: "string" } },
          required: ["anahtar", "deger"],
          additionalProperties: false
        }
      },
      cevap: { type: "string" }
    },
    required: ["islem", "tur", "hedef_id", "alanlar", "cevap"],
    additionalProperties: false
  };
}

function sistemMetni(moduller) {
  return `Senin adın İbrahim Paşa, Ortak'ın kişisel asistanısın. Türkçe, kısa ve net konuşursun; cevabın Siri tarafından sesli okunabilir.
Görevin: kullanıcının söylediğini kayıt defterine işlemek ya da defterdeki kayıtlara bakarak soruyu cevaplamak.
Kayıt türleri ve alanları:
${moduller.map(m => m.talimat).join("\n")}
Kurallar:
- Yeni bilgi verildiyse islem="ekle", alanları doldur (anahtarlar Türkçe karaktersiz, küçük harf). Tarih verilmediyse bugünü kullan.
- Var olan bir kaydı değiştirmek için islem="guncelle" ve hedef_id ver; sadece değişen alanları yaz.
- Silme isterse islem="sil" ve hedef_id ver.
- Soru soruyorsa islem="cevap", tur="yok", hedef_id boş, alanlar boş.
- Her durumda "cevap" alanına kullanıcıya söylenecek kısa Türkçe cümleyi yaz.
- Emin olmadığın bilgiyi uydurma.`;
}

async function claudeSor(anahtar, metin, veri, moduller) {
  const turler = moduller.flatMap(m => m.turler);
  const bugun = new Date().toISOString().slice(0, 10);
  const r = new Request("https://api.anthropic.com/v1/messages");
  r.method = "POST";
  r.timeoutInterval = 90;
  r.headers = {
    "content-type": "application/json",
    "x-api-key": anahtar,
    "anthropic-version": "2026-10-21",
    "anthropic-beta": "server-side-fallback-2026-07-01"
  };
  r.body = JSON.stringify({
    model: MODEL,
    max_tokens: 16000,
    fallbacks: "default",
    output_config: { effort: "low", format: { type: "json_schema", schema: sema(turler) } },
    system: sistemMetni(moduller),
    messages: [{
      role: "user",
      content: `Bugün: ${bugun}\n\nKayıt defteri (JSON):\n${JSON.stringify(veri.kayitlar)}\n\nKullanıcı: ${metin}`
    }]
  });
  const yanit = await r.loadJSON();
  if (yanit.type === "error") throw new Error("API hatası: " + yanit.error.message);
  if (yanit.stop_reason === "refusal") throw new Error("Model bu isteği yanıtlamadı.");
  if (yanit.stop_reason === "max_tokens") throw new Error("Yanıt yarıda kesildi, tekrar dene.");
  const blok = (yanit.content || []).find(b => b.type === "text");
  if (!blok) throw new Error("Boş yanıt geldi.");
  return JSON.parse(blok.text);
}

// ---------- Uygula ----------
function alanObjesi(alanlar) {
  const o = {};
  for (const a of alanlar) o[a.anahtar] = a.deger;
  return o;
}

async function onayla(soru) {
  const a = new Alert();
  a.title = "Onay";
  a.message = soru;
  a.addAction("Evet");
  a.addCancelAction("Hayır");
  return (await a.present()) !== -1;
}

async function uygula(sonuc, veri) {
  const simdi = new Date().toISOString();
  if (sonuc.islem === "ekle" && sonuc.tur !== "yok") {
    veri.kayitlar.push({ id: String(Date.now()), tur: sonuc.tur, eklendi: simdi, ...alanObjesi(sonuc.alanlar) });
    veriYaz(veri);
  } else if (sonuc.islem === "guncelle") {
    const k = veri.kayitlar.find(x => x.id === sonuc.hedef_id);
    if (!k) return "Güncellenecek kaydı bulamadım.";
    Object.assign(k, alanObjesi(sonuc.alanlar), { guncellendi: simdi });
    veriYaz(veri);
  } else if (sonuc.islem === "sil") {
    const i = veri.kayitlar.findIndex(x => x.id === sonuc.hedef_id);
    if (i === -1) return "Silinecek kaydı bulamadım.";
    if (!(await onayla("Bu kayıt silinsin mi?\n" + JSON.stringify(veri.kayitlar[i])))) return "Tamam, silmedim.";
    veri.kayitlar.splice(i, 1);
    veriYaz(veri);
  }
  return sonuc.cevap;
}

// ---------- Giriş noktası (yükleyici çağırır) ----------
module.exports.calistir = async function (args, config, moduller, surum) {
  let cikti;
  try {
    const metin = await girdiAl(args);
    if (!metin) return null;
    const anahtar = await anahtarAl();
    const veri = await veriOku();
    const sonuc = await claudeSor(anahtar, metin, veri, moduller);
    cikti = await uygula(sonuc, veri);
  } catch (e) {
    cikti = "Bir sorun oldu: " + e.message;
  }
  if (!config.runsWithSiri && !args.shortcutParameter) {
    const a = new Alert();
    a.title = "İbrahim Paşa (v" + surum + ")";
    a.message = cikti;
    a.addAction("Tamam");
    await a.present();
  }
  return cikti;
};
