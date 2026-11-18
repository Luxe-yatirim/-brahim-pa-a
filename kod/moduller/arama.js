// Telefon araması: iOS aramadan önce kendisi onay sorar
module.exports = {
  ad: "arama",
  tip: "eylem",
  eylem: "ara",
  talimat: `Telefonla arar. parametreler: kisi, telefon (biliniyorsa).`,
  async calistir(p, baglam) {
    const { aliciBul } = baglam;
    const k = await aliciBul(p, baglam, "telefon");
    Safari.open("tel:" + String(k.telefon).replace(/[^\d+]/g, ""));
    return null;
  }
};
