// arayuz.js — İbrahim Paşa'nın uygulama içi sohbet ekranı (Scriptable WebView)
// Çekirdek bu modülü "tip: arayuz" diye tanır; kayıt veya eylem modülü değildir.

const HIZLI_DUGMELER = [
  { etiket: "☀️ Günlük özet", metin: "Günlük özet", gonder: true },
  { etiket: "👤 Müşteri ekle", metin: "Yeni müşteri: ", gonder: false },
  { etiket: "🏠 İlan ekle", metin: "Yeni ilan: ", gonder: false },
  { etiket: "🔎 Uygun ilan bul", metin: "Takipteki müşterilerime uyan ilanlar hangileri?", gonder: true },
  { etiket: "💸 Gider", metin: "Gider: ", gonder: false },
  { etiket: "💰 Gelir", metin: "Gelir: ", gonder: false },
  { etiket: "📊 Bu ay", metin: "Bu ayın gelir-gider özetini çıkar", gonder: true },
  { etiket: "💵 Döviz & altın", metin: "Bugün dolar, euro ve gram altın kaç?", gonder: true },
  { etiket: "❤️ Sağlık", metin: "Bu hafta sağlık durumum nasıl?", gonder: true },
  { etiket: "↩️ Geri al", metin: "Geri al", gonder: true },
  { etiket: "🩺 Sistem testi", metin: "test", gonder: true }
];

function html(durum) {
  const veri = JSON.stringify({ ...durum, dugmeler: HIZLI_DUGMELER }).replace(/</g, "\\u003c");
  return `<!DOCTYPE html><html lang="tr"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,viewport-fit=cover">
<style>
  :root { --bg:#0b0b0f; --kart:#17171d; --kart2:#202029; --yazi:#f2f2f7; --soluk:#8e8e99; --vurgu:#d4a84b; --mavi:#0a84ff; --yesil:#30d158; --kirmizi:#ff453a; }
  * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
  html,body { margin:0; height:100%; background:var(--bg); color:var(--yazi); font:16px -apple-system, system-ui, sans-serif; }
  body { display:flex; flex-direction:column; padding-top:env(safe-area-inset-top); }
  header { padding:14px 18px 8px; display:flex; align-items:center; gap:12px; }
  .logo { width:42px; height:42px; border-radius:12px; background:linear-gradient(135deg,#d4a84b,#8a6a22); display:grid; place-items:center; font-size:22px; }
  h1 { margin:0; font-size:20px; letter-spacing:.2px; }
  .alt { color:var(--soluk); font-size:13px; margin-top:2px; }
  .surum { margin-left:auto; color:var(--soluk); font-size:11px; }
  .kartlar { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; padding:6px 14px 4px; }
  .kart { background:var(--kart); border-radius:14px; padding:10px 8px; text-align:center; }
  .kart b { display:block; font-size:16px; } .kart span { color:var(--soluk); font-size:11px; }
  .gelir b { color:var(--yesil); } .gider b { color:var(--kirmizi); }
  .dugmeler { display:flex; gap:8px; overflow-x:auto; padding:10px 14px; scrollbar-width:none; }
  .dugmeler::-webkit-scrollbar { display:none; }
  .dugmeler button { flex:none; background:var(--kart2); color:var(--yazi); border:0; border-radius:18px; padding:9px 13px; font-size:14px; }
  .dugmeler button:active { background:#2c2c38; }
  #sohbet { flex:1; overflow-y:auto; padding:8px 14px 12px; display:flex; flex-direction:column; gap:8px; }
  .balon { max-width:84%; padding:10px 13px; border-radius:18px; line-height:1.38; white-space:pre-wrap; word-wrap:break-word; font-size:15.5px; animation:gir .18s ease-out; }
  .ben { align-self:flex-end; background:var(--mavi); border-bottom-right-radius:6px; }
  .o { align-self:flex-start; background:var(--kart2); border-bottom-left-radius:6px; }
  .o.hata { background:#3a1d1f; }
  .bos { color:var(--soluk); text-align:center; margin:auto; font-size:14px; line-height:1.6; }
  .yaziyor span { display:inline-block; width:7px; height:7px; margin:0 2px; border-radius:50%; background:var(--soluk); animation:zipla 1s infinite; }
  .yaziyor span:nth-child(2){animation-delay:.15s} .yaziyor span:nth-child(3){animation-delay:.3s}
  @keyframes zipla { 0%,60%,100%{transform:translateY(0);opacity:.5} 30%{transform:translateY(-5px);opacity:1} }
  @keyframes gir { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
  footer { display:flex; gap:8px; align-items:flex-end; padding:8px 12px calc(10px + env(safe-area-inset-bottom)); background:var(--bg); border-top:1px solid #1f1f27; }
  textarea { flex:1; resize:none; max-height:120px; min-height:42px; background:var(--kart); color:var(--yazi); border:1px solid #2a2a35; border-radius:21px; padding:10px 15px; font:16px -apple-system, system-ui; outline:none; }
  #gonder { width:42px; height:42px; border-radius:50%; border:0; background:var(--vurgu); color:#111; font-size:20px; font-weight:700; }
  #gonder:disabled { opacity:.35; }
</style></head><body>
<header>
  <div class="logo">🎩</div>
  <div><h1>İbrahim Paşa</h1><div class="alt" id="tarih"></div></div>
  <div class="surum" id="surum"></div>
</header>
<div class="kartlar">
  <div class="kart"><b id="k-musteri">0</b><span>müşteri</span></div>
  <div class="kart"><b id="k-ilan">0</b><span>ilan</span></div>
  <div class="kart gelir"><b id="k-gelir">0</b><span>bu ay gelir</span></div>
  <div class="kart gider"><b id="k-gider">0</b><span>bu ay gider</span></div>
</div>
<div class="dugmeler" id="dugmeler"></div>
<div id="sohbet"></div>
<footer>
  <textarea id="girdi" rows="1" placeholder="Yaz ya da klavyedeki 🎤 ile konuş…"></textarea>
  <button id="gonder" aria-label="Gönder">↑</button>
</footer>
<script>
  const D = ${veri};
  const $ = id => document.getElementById(id);
  const sohbet = $("sohbet"), girdi = $("girdi"), gonderBtn = $("gonder");
  let bekleyen = null, kuyruk = [], mesgul = false, yaziyorEl = null;

  $("tarih").textContent = D.tarih; $("surum").textContent = "v" + D.surum;
  function istatistik(s) {
    $("k-musteri").textContent = s.musteri; $("k-ilan").textContent = s.ilan;
    $("k-gelir").textContent = s.gelir; $("k-gider").textContent = s.gider;
  }
  istatistik(D.istatistik);

  function balon(metin, sinif) {
    const bos = sohbet.querySelector(".bos"); if (bos) bos.remove();
    const b = document.createElement("div");
    b.className = "balon " + sinif; b.textContent = metin;
    sohbet.appendChild(b); sohbet.scrollTop = sohbet.scrollHeight;
    return b;
  }
  if (D.gecmis.length) D.gecmis.forEach(g => { balon(g.k, "ben"); balon(g.a, "o"); });
  else sohbet.innerHTML = '<div class="bos">Merhaba Ortak 👋<br>Müşteri, ilan, gider, mesaj, hatırlatma…<br>Ne istersen yaz ya da yukarıdan seç.</div>';

  D.dugmeler.forEach(d => {
    const b = document.createElement("button"); b.textContent = d.etiket;
    b.onclick = () => { if (d.gonder) gonder(d.metin); else { girdi.value = d.metin; girdi.focus(); boyutla(); } };
    $("dugmeler").appendChild(b);
  });

  function boyutla() { girdi.style.height = "auto"; girdi.style.height = Math.min(girdi.scrollHeight, 120) + "px"; gonderBtn.disabled = mesgul || !girdi.value.trim(); }
  girdi.addEventListener("input", boyutla); boyutla();
  girdi.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); gonder(girdi.value); } });
  gonderBtn.onclick = () => gonder(girdi.value);

  function gonder(metin, gosterim) {
    metin = (metin || "").trim(); if (!metin || mesgul) return;
    girdi.value = ""; girdi.blur(); boyutla();
    balon(gosterim || metin, "ben"); mesgul = true; boyutla();
    yaziyorEl = balon("", "o yaziyor"); yaziyorEl.innerHTML = "<span></span><span></span><span></span>";
    if (bekleyen) { const f = bekleyen; bekleyen = null; f(metin); } else kuyruk.push(metin);
  }
  // Scriptable tarafı çağırır: kullanıcının bir sonraki mesajını bekler
  window.mesajBekle = function (tamam) {
    if (kuyruk.length) tamam(kuyruk.shift()); else bekleyen = tamam;
  };
  // Scriptable tarafı çağırır: cevabı gösterir
  window.cevapGoster = function (metin, hata, ist) {
    if (yaziyorEl) { yaziyorEl.remove(); yaziyorEl = null; }
    balon(metin, "o" + (hata ? " hata" : "")); if (ist) istatistik(ist);
    mesgul = false; boyutla();
  };
  if (D.ilkMesaj) setTimeout(() => gonder(D.ilkMesaj, "📎 " + D.ilkGosterim), 150);
</script></body></html>`;
}

module.exports = {
  ad: "arayuz",
  tip: "arayuz",
  // isle(metin) -> Promise<{ metin, hata }>, ist() -> istatistik objesi
  async ac({ surum, gecmis, istatistik, isle, ist, ilkMesaj, ilkGosterim }) {
    const tarih = new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" });
    const wv = new WebView();
    await wv.loadHTML(html({ surum, gecmis, istatistik, tarih, ilkMesaj: ilkMesaj || "", ilkGosterim: ilkGosterim || "Paylaşılan içerik" }));
    let kapandi = false;
    const sunum = wv.present(true).then(() => { kapandi = true; return null; });
    while (!kapandi) {
      const metin = await Promise.race([wv.evaluateJavaScript("mesajBekle(completion)", true), sunum]);
      if (!metin || kapandi) break;
      const sonuc = await isle(metin);
      if (kapandi) break;
      await wv.evaluateJavaScript(
        `cevapGoster(${JSON.stringify(sonuc.metin)}, ${sonuc.hata ? "true" : "false"}, ${JSON.stringify(await ist())})`
      );
    }
  }
};
