// ana.js — İbrahim Paşa'nın çekirdeği. Yükleyici bu dosyayı ve modülleri GitHub'dan indirip çalıştırır.
// Veri her zaman telefonda kalır: iCloud Drive > Scriptable > Asistan > veri.json
//
// Modül türleri (kod/moduller/*.js):
//   - kayıt modülü:  { ad, turler: [...], talimat }
//   - eylem modülü:  { ad, tip: "eylem", eylem, talimat, calistir(parametreler, baglam) }

const MODEL = "claude-opus-5-5"; // daha ucuz/hızlı istersen: "claude-haiku-5-5"
const KEY_NAME = "anthropic_api_key";
const GECMIS_UZUNLUK = 6; // hatırlanan son konuşma sayısı
const DERIN_KELIMELER = /(detayl[ıi]|derin|iyice d[üu]ş[üu]n|en iyi|kod yaz|analiz|kar[şs][ıi]la[şs]t[ıi]r|strateji)/i;
const HIZLI = true; // hızlı mod: yaklaşık 2 kat hızlı cevap, 2 kat fiyat. Kapatmak için false yap.

const fm = FileManager.iCloud();
const klasor = fm.joinPath(fm.documentsDirectory(), "Asistan");
if (!fm.fileExists(klasor)) fm.createDirectory(klasor);
const dosya = fm.joinPath(klasor, "veri.json");
const gecmisDosya = fm.joinPath(klasor, "gecmis.json");

// ---------- Dosya yardımcıları ----------
async function jsonOku(yol, varsayilan) {
  if (!fm.fileExists(yol)) return varsayilan;
  try {
    await fm.downloadFileFromiCloud(yol);
    return JSON.parse(fm.readString(yol));
  } catch (e) {
    return varsayilan;
  }
}
const veriOku = () => jsonOku(dosya, { kayitlar: [] });
function veriYaz(veri) {
  if (fm.fileExists(dosya)) fm.writeString(dosya + ".yedek", fm.readString(dosya));
  fm.writeString(dosya, JSON.stringify(veri, null, 2));
}
async function geriAl() {
  const yedek = dosya + ".yedek";
  if (!fm.fileExists(yedek)) return "Geri alınacak bir değişiklik yok.";
  await fm.downloadFileFromiCloud(yedek);
  fm.writeString(dosya, fm.readString(yedek));
  fm.remove(yedek);
  return "Son değişikliği geri aldım.";
}

// ---------- Tarih (yerel saatle) ----------
function yerelISO(d) {
  const p = n => String(n).padStart(2, "0");
  const ofs = -d.getTimezoneOffset();
  const isaret = ofs >= 0 ? "+" : "-";
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}` +
    `${isaret}${p(Math.floor(Math.abs(ofs) / 60))}:${p(Math.abs(ofs) % 60)}`;
}
const GUNLER = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

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
    return "Paylaşılan metin. Emlakçı ilanıysa emlak olarak kaydet. Bir müşterinin mesajıysa müşteriyi kaydet/güncelle, " +
      "Ortak'ın ağzından kısa ve profesyonel bir cevap taslağı yaz, defterde uygun ilan varsa öner ve taslağı 'kopyala' eylemiyle panoya koy:\n" +
      args.plainTexts.join("\n");
  if (args.urls && args.urls.length) return "Paylaşılan bağlantı, not olarak kaydet: " + args.urls.join(" ");
  const a = new Alert();
  a.title = "İbrahim Paşa";
  a.message = "Ne yapayım?";
  a.addTextField("ör. Mehmet Bey'e yarın 10'da görüşelim diye mesaj at");
  a.addAction("Gönder");
  a.addCancelAction("Vazgeç");
  if ((await a.present()) === -1) return null;
  return a.textFieldValue(0);
}

// ---------- Rehber ----------
let rehberOnbellek = null;
async function rehber() {
  if (rehberOnbellek) return rehberOnbellek;
  try {
    const kap = await ContactsContainer.default();
    rehberOnbellek = await Contact.all([kap]);
  } catch (e) {
    rehberOnbellek = [];
  }
  return rehberOnbellek;
}
const kucuk = s => (s || "").toLocaleLowerCase("tr-TR").trim();
async function kisiBul(ad) {
  const aranan = kucuk(ad).replace(/\b(bey|hanım|hanim|abi|abla)\b/g, "").trim();
  if (!aranan) return null;
  const kisiler = await rehber();
  const tamAd = k => kucuk(`${k.givenName || ""} ${k.familyName || ""}`);
  const eslesen = kisiler.filter(k => tamAd(k).includes(aranan) || kucuk(k.nickname).includes(aranan));
  if (eslesen.length === 0) return null;
  let k = eslesen[0];
  if (eslesen.length > 1) {
    const a = new Alert();
    a.title = "Hangisi?";
    a.message = `"${ad}" için birden fazla kişi var.`;
    for (const e of eslesen.slice(0, 8)) a.addAction(`${e.givenName || ""} ${e.familyName || ""}`.trim());
    a.addCancelAction("Vazgeç");
    const i = await a.present();
    if (i === -1) return null;
    k = eslesen[i];
  }
  return {
    ad: `${k.givenName || ""} ${k.familyName || ""}`.trim(),
    telefon: (k.phoneNumbers && k.phoneNumbers[0] && k.phoneNumbers[0].value) || "",
    eposta: (k.emailAddresses && k.emailAddresses[0] && k.emailAddresses[0].value) || ""
  };
}

// ---------- Ajanda (takvim + hatırlatıcılar) ----------
async function ajanda() {
  const satirlar = [];
  try {
    const bas = new Date();
    const bit = new Date(bas.getTime() + 7 * 864e5);
    const etkinlikler = await CalendarEvent.between(bas, bit, []);
    for (const e of etkinlikler.slice(0, 30))
      satirlar.push(`takvim: ${yerelISO(e.startDate)} ${e.title}${e.location ? " @ " + e.location : ""}`);
  } catch (e) { /* takvim izni yok */ }
  try {
    const hat = await Reminder.allIncomplete([]);
    for (const r of hat.slice(0, 30))
      satirlar.push(`hatırlatıcı: ${r.dueDate ? yerelISO(r.dueDate) : "tarihsiz"} ${r.title}`);
  } catch (e) { /* hatırlatıcı izni yok */ }
  return satirlar.length ? satirlar.join("\n") : "(boş veya izin verilmedi)";
}

// ---------- Claude ----------
const ANAHTAR_DEGER = {
  type: "array",
  items: {
    type: "object",
    properties: { anahtar: { type: "string" }, deger: { type: "string" } },
    required: ["anahtar", "deger"],
    additionalProperties: false
  }
};

function sema(turler, eylemAdlari) {
  return {
    type: "object",
    properties: {
      islemler: {
        type: "array",
        items: {
          type: "object",
          properties: {
            islem: { type: "string", enum: ["ekle", "guncelle", "sil", "eylem"] },
            tur: { type: "string", enum: [...turler, "yok"] },
            hedef_id: { type: "string" },
            alanlar: ANAHTAR_DEGER,
            eylem: { type: "string", enum: [...eylemAdlari, "yok"] },
            parametreler: ANAHTAR_DEGER
          },
          required: ["islem", "tur", "hedef_id", "alanlar", "eylem", "parametreler"],
          additionalProperties: false
        }
      },
      cevap: { type: "string" }
    },
    required: ["islemler", "cevap"],
    additionalProperties: false
  };
}

function sistemMetni(kayitModulleri, eylemModulleri) {
  return `Senin adın İbrahim Paşa, Ortak'ın kişisel asistanısın. Ortak emlak işiyle uğraşıyor. Türkçe, kısa ve net konuşursun; cevabın Siri tarafından sesli okunabilir.
Görevin: kullanıcının söylediğini kayıt defterine işlemek, istediği eylemleri hazırlamak ve sorularını defter, ajanda ve konuşma geçmişine bakarak cevaplamak.

Kayıt türleri ve alanları:
${kayitModulleri.map(m => m.talimat).join("\n")}

Eylemler (islem="eylem", eylem=<ad>, parametreler doldurulur):
${eylemModulleri.map(m => `- ${m.eylem}: ${m.talimat}`).join("\n")}
- geri_al: son kayıt değişikliğini geri alır. Parametre yok.

Kurallar:
- Bir komutta birden çok iş olabilir; her biri için "islemler" listesine ayrı bir öğe ekle. Hiçbir iş yoksa liste boş olsun.
- Kullanılmayan alanları boş bırak: tur="yok", eylem="yok", hedef_id="", alanlar=[], parametreler=[].
- Yeni bilgi verildiyse islem="ekle" (alan anahtarları Türkçe karaktersiz, küçük harf). Tarih verilmediyse bugünü kullan.
- Var olan kaydı değiştirmek için islem="guncelle" ve hedef_id ver; sadece değişen alanları yaz. Silmek için islem="sil".
- Mesaj/arama gibi eylemlerde kişinin telefonu defterde varsa "telefon" parametresine yaz; yoksa sadece "kisi" adını yaz, rehberden bulunur.
- Mesaj metinlerini Ortak'ın ağzından, kibar ve doğal yaz. Kullanıcı açıkça istemedikçe mesaj atma.
- Tarih/saatleri yerel saatle ISO biçiminde ver (ör. 2026-11-18T10:00+03:00). "Yarın", "cuma" gibi ifadeleri bugüne göre hesapla.
- Bir müşteriye uyan emlak kaydı varsa (veya tersi) cevapta söyle.
- "Günlük özet" istenirse: bugünün takvimi, yaklaşan hatırlatıcılar, takipte bekleyen müşteriler ve bu ayın gelir-gider durumu.
- "cevap" alanına kullanıcıya söylenecek kısa Türkçe cümleyi yaz. Mesajlar ekranda açılacak, gönder tuşuna kullanıcı basacak; "gönderdim" deme, "hazırladım" de.
- Kod, Excel formülü, ilan metni, sözleşme maddesi gibi istekleri eksiksiz yaz ve "kopyala" eylemiyle panoya koy; cevapta kısaca ne yaptığını söyle.
- Müşteriye cevap yazarken: kibar, güven veren, kısa; fiyat/pazarlık konusunda Ortak'ın onayı olmadan söz verme.
- Genel kültür, güncel bilgi, hava durumu, döviz/altın, emlak piyasası, mevzuat (tapu harcı, kira artış oranı vb.) gibi sorularda gerekirse web_search ile internette ara; kısa ve kaynaklı cevap ver.
- Emin olmadığın bilgiyi uydurma. Soru sorman gerekiyorsa cevapta sor.`;
}

async function claudeSor(anahtar, metin, veri, gecmis, ajandaMetni, kayitModulleri, eylemModulleri) {
  const turler = kayitModulleri.flatMap(m => m.turler);
  const eylemAdlari = [...eylemModulleri.map(m => m.eylem), "geri_al"];
  const simdi = new Date();
  const derin = DERIN_KELIMELER.test(metin); // "detaylı düşün", "analiz et", "kod yaz"... -> en üst düzey mod
  const gecmisMetni = gecmis.length
    ? gecmis.map(g => `Kullanıcı: ${g.k}\nSen: ${g.a}`).join("\n")
    : "(yok)";
  const govde = {
    model: MODEL,
    max_tokens: 16000,
    fallbacks: "default",
    output_config: { effort: derin ? "xhigh" : "medium", format: { type: "json_schema", schema: sema(turler, eylemAdlari) } },
    tools: [{ type: "web_search_20260209", name: "web_search", max_uses: derin ? 8 : 3, user_location: { type: "approximate", country: "TR", timezone: "Europe/Istanbul" } }],
    system: sistemMetni(kayitModulleri, eylemModulleri),
    messages: [{
      role: "user",
      content:
        `Şu an: ${yerelISO(simdi)} (${GUNLER[simdi.getDay()]})\n\n` +
        `Kayıt defteri (JSON):\n${JSON.stringify(veri.kayitlar)}\n\n` +
        `Ajanda (önümüzdeki 7 gün):\n${ajandaMetni}\n\n` +
        `Son konuşmalar:\n${gecmisMetni}\n\n` +
        `Kullanıcı: ${metin}`
    }]
  };
  if (HIZLI) govde.speed = "fast";

  let yanit;
  for (let tur = 0; tur < 4; tur++) {
    yanit = await istekGonder(anahtar, govde);
    // Telefonda en az hatayla çalışsın diye kademeli geri çekilme:
    const kaliciHata = e => /authentication|permission|billing/i.test((e && e.error && e.error.type) || "");
    if (yanit.type === "error" && govde.speed && !kaliciHata(yanit)) {
      delete govde.speed; // hızlı mod yoğun/kapalıysa normal hızla dene
      yanit = await istekGonder(anahtar, govde);
    }
    if (yanit.type === "error" && /fallback/i.test(yanit.error.message || "")) {
      delete govde.fallbacks;
      yanit = await istekGonder(anahtar, govde);
    }
    if (yanit.type === "error") {
      if (kaliciHata(yanit)) throw new Error("API anahtarı veya bakiye sorunu: " + yanit.error.message);
      throw new Error("API hatası: " + yanit.error.message);
    }
    if (yanit.stop_reason !== "pause_turn") break;
    // uzun internet aramasında model ara verdi: kaldığı yerden devam
    govde.messages = [...govde.messages, { role: "assistant", content: yanit.content }];
  }
  if (yanit.stop_reason === "refusal") throw new Error("Model bu isteği yanıtlamadı.");
  if (yanit.stop_reason === "max_tokens") throw new Error("Yanıt yarıda kesildi, tekrar dene.");
  const metinler = (yanit.content || []).filter(b => b.type === "text");
  if (!metinler.length) throw new Error("Boş yanıt geldi.");
  return JSON.parse(metinler[metinler.length - 1].text);
}

async function istekGonder(anahtar, govde) {
  const r = new Request("https://api.anthropic.com/v1/messages");
  r.method = "POST";
  r.timeoutInterval = 120;
  r.headers = {
    "content-type": "application/json",
    "x-api-key": anahtar,
    "anthropic-version": "2026-10-21",
  };
  if (govde.fallbacks) r.headers["anthropic-beta"] = "server-side-fallback-2026-07-01";
  r.body = JSON.stringify(govde);
  return await r.loadJSON();
}

// ---------- Eylem yardımcıları (eylem modüllerine baglam ile verilir) ----------
function telefonTemizle(t) {
  let d = String(t || "").replace(/[^\d+]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("0")) d = "90" + d.slice(1);         // 0532... -> 90532...
  else if (d.length === 10 && d.startsWith("5")) d = "90" + d; // 532... -> 90532...
  return d;
}

// "telefon" verilmediyse "kisi" adını rehberde arar
async function aliciBul(p, baglam, alan) {
  if (alan === "eposta" && p.eposta) return { ad: p.kisi || p.eposta, eposta: p.eposta };
  if (alan === "telefon" && p.telefon) return { ad: p.kisi || p.telefon, telefon: p.telefon };
  if (!p.kisi) throw new Error("kime olduğunu anlayamadım");
  const k = await baglam.kisiBul(p.kisi);
  if (!k) throw new Error(`"${p.kisi}" rehberde yok`);
  if (!k[alan]) throw new Error(`${k.ad} için ${alan === "eposta" ? "e-posta adresi" : "telefon"} kayıtlı değil`);
  return k;
}

function tarihCoz(s) {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

// ---------- Uygula ----------
function alanObjesi(alanlar) {
  const o = {};
  for (const a of alanlar || []) if (a.anahtar) o[a.anahtar] = a.deger;
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

async function kayitIslemi(is, veri, notlar) {
  const simdi = new Date().toISOString();
  if (is.islem === "ekle" && is.tur !== "yok") {
    veri.kayitlar.push({ id: String(Date.now()) + String(veri.kayitlar.length), tur: is.tur, eklendi: simdi, ...alanObjesi(is.alanlar) });
    return true;
  }
  if (is.islem === "guncelle") {
    const k = veri.kayitlar.find(x => x.id === is.hedef_id);
    if (!k) { notlar.push("Güncellenecek kaydı bulamadım."); return false; }
    Object.assign(k, alanObjesi(is.alanlar), { guncellendi: simdi });
    return true;
  }
  if (is.islem === "sil") {
    const i = veri.kayitlar.findIndex(x => x.id === is.hedef_id);
    if (i === -1) { notlar.push("Silinecek kaydı bulamadım."); return false; }
    if (!(await onayla("Bu kayıt silinsin mi?\n" + JSON.stringify(veri.kayitlar[i])))) {
      notlar.push("Silmedim.");
      return false;
    }
    veri.kayitlar.splice(i, 1);
    return true;
  }
  return false;
}

async function uygula(sonuc, veri, eylemModulleri) {
  const notlar = [];
  const islemler = sonuc.islemler || [];
  let degisti = false;

  // 1) Kayıtlar: hepsi bitince tek seferde yazılır (tek yedek, "geri al" hepsini geri alır)
  for (const is of islemler.filter(x => x.islem !== "eylem")) {
    if (await kayitIslemi(is, veri, notlar)) degisti = true;
  }
  if (degisti) veriYaz(veri);

  // 2) Eylemler: sırayla, her biri ekranda onaya sunulur
  const baglam = { kisiBul, onayla, yerelISO, telefonTemizle, aliciBul, tarihCoz };
  for (const is of islemler.filter(x => x.islem === "eylem")) {
    try {
      if (is.eylem === "geri_al") { notlar.push(await geriAl()); continue; }
      const m = eylemModulleri.find(x => x.eylem === is.eylem);
      if (!m) { notlar.push(`"${is.eylem}" eylemini bilmiyorum.`); continue; }
      const sonucMetni = await m.calistir(alanObjesi(is.parametreler), baglam);
      if (sonucMetni) notlar.push(sonucMetni);
    } catch (e) {
      notlar.push(`${is.eylem} yapılamadı: ${e.message}`);
    }
  }
  return [sonuc.cevap, ...notlar].filter(Boolean).join(" ");
}

// ---------- Widget (API'ye gitmeden, telefondaki veriden) ----------
function ayToplami(kayitlar, tur) {
  const ay = new Date().toISOString().slice(0, 7);
  return kayitlar
    .filter(k => k.tur === tur && String(k.tarih || k.eklendi || "").slice(0, 7) === ay)
    .reduce((t, k) => t + (parseFloat(String(k.tutar || "0").replace(/\./g, "").replace(",", ".")) || 0), 0);
}
const tl = n => Math.round(n).toLocaleString("tr-TR") + " ₺";

async function widgetYap() {
  const veri = await veriOku();
  const k = veri.kayitlar;
  const w = new ListWidget();
  w.backgroundColor = new Color("#1c1c1e");
  w.url = "scriptable:///run/Asistan";
  const baslik = w.addText("İbrahim Paşa");
  baslik.font = Font.boldSystemFont(14);
  baslik.textColor = Color.white();
  w.addSpacer(6);
  const satir = (metin, renk) => {
    const t = w.addText(metin);
    t.font = Font.systemFont(12);
    t.textColor = new Color(renk || "#d1d1d6");
  };
  const aktifMusteri = k.filter(x => x.tur === "musteri" && !/kapand/i.test(x.durum || "")).length;
  const aktifEmlak = k.filter(x => x.tur === "emlak" && !/(satıld|kiraland)/i.test(x.durum || "")).length;
  satir(`👤 ${aktifMusteri} müşteri  🏠 ${aktifEmlak} ilan`);
  satir(`⬆︎ ${tl(ayToplami(k, "gelir"))}`, "#30d158");
  satir(`⬇︎ ${tl(ayToplami(k, "gider"))}`, "#ff453a");
  try {
    const bugunBit = new Date(); bugunBit.setHours(23, 59, 59);
    const etk = await CalendarEvent.between(new Date(), bugunBit, []);
    if (etk.length) {
      w.addSpacer(4);
      const p = n => String(n).padStart(2, "0");
      for (const e of etk.slice(0, 2)) satir(`📅 ${p(e.startDate.getHours())}:${p(e.startDate.getMinutes())} ${e.title}`, "#ffffff");
    }
  } catch (e) { /* izin yok */ }
  return w;
}

// ---------- Giriş noktası (yükleyici çağırır) ----------
module.exports.calistir = async function (args, config, moduller, surum) {
  if (config.runsInWidget) {
    Script.setWidget(await widgetYap());
    return null;
  }
  const kayitModulleri = moduller.filter(m => m && m.tip !== "eylem" && Array.isArray(m.turler));
  const eylemModulleri = moduller.filter(m => m && m.tip === "eylem" && typeof m.calistir === "function");
  let cikti;
  let metin = null;
  try {
    metin = await girdiAl(args);
    if (!metin) return null;
    const anahtar = await anahtarAl();
    const [veri, gecmis, ajandaMetni] = await Promise.all([veriOku(), jsonOku(gecmisDosya, []), ajanda()]);
    const sonuc = await claudeSor(anahtar, metin, veri, gecmis, ajandaMetni, kayitModulleri, eylemModulleri);
    cikti = await uygula(sonuc, veri, eylemModulleri);
    gecmis.push({ k: metin.slice(0, 500), a: cikti.slice(0, 500) });
    fm.writeString(gecmisDosya, JSON.stringify(gecmis.slice(-GECMIS_UZUNLUK)));
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
