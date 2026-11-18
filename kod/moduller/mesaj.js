// SMS / iMessage: mesaj ekranı hazır açılır, gönder tuşuna kullanıcı basar (Apple kuralı)
module.exports = {
  ad: "mesaj",
  tip: "eylem",
  eylem: "mesaj",
  talimat: `SMS/iMessage hazırlar. parametreler: kisi (ad), telefon (biliniyorsa), metin.`,
  async calistir(p, baglam) {
    const { aliciBul } = baglam;
    const k = await aliciBul(p, baglam, "telefon");
    const m = new Message();
    m.recipients = [k.telefon];
    m.body = p.metin || "";
    await m.send();
    return null;
  }
};
