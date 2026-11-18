// E-posta: Mail ekranı hazır açılır, gönder tuşuna kullanıcı basar
module.exports = {
  ad: "eposta",
  tip: "eylem",
  eylem: "eposta",
  talimat: `E-posta hazırlar. parametreler: kisi, eposta (biliniyorsa), konu, metin.`,
  async calistir(p, baglam) {
    const { aliciBul } = baglam;
    const k = await aliciBul(p, baglam, "eposta");
    const m = new Mail();
    m.toRecipients = [k.eposta];
    m.subject = p.konu || "";
    m.body = p.metin || "";
    await m.send();
    return null;
  }
};
