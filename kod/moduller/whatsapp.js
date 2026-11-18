// WhatsApp: sohbet, mesaj yazılmış halde açılır; gönder tuşuna kullanıcı basar
module.exports = {
  ad: "whatsapp",
  tip: "eylem",
  eylem: "whatsapp",
  talimat: `WhatsApp mesajı hazırlar. Kullanıcı "WhatsApp'tan" derse veya emlakçılara yazarken bunu kullan. parametreler: kisi, telefon (biliniyorsa), metin.`,
  async calistir(p, baglam) {
    const { aliciBul, telefonTemizle } = baglam;
    const k = await aliciBul(p, baglam, "telefon");
    const no = telefonTemizle(k.telefon);
    Safari.open(`whatsapp://send?phone=${no}&text=${encodeURIComponent(p.metin || "")}`);
    return null;
  }
};
