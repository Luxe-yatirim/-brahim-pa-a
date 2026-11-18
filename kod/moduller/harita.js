// Haritalar'da konum açar / yol tarifi verir
module.exports = {
  ad: "harita",
  tip: "eylem",
  eylem: "harita",
  talimat: `Apple Haritalar'da adresi açar ve yol tarifi verir (ör. "ilanın konumuna götür"). parametreler: adres.`,
  async calistir(p) {
    if (!p.adres) throw new Error("adres yok");
    Safari.open("maps://?daddr=" + encodeURIComponent(p.adres));
    return null;
  }
};
