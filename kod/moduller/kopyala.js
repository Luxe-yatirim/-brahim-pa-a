// Panoya kopyala: müşteriye cevap, ilan metni, kod parçası vb. hazır metni panoya koyar
module.exports = {
  ad: "kopyala",
  tip: "eylem",
  eylem: "kopyala",
  talimat: `Hazırladığın uzun bir metni panoya kopyalar; kullanıcı istediği yere yapıştırır. parametreler: metin.
  Kullan: paylaşılan bir müşteri mesajına cevap taslağı, ilan metni (sahibinden/emlakjet için), sözleşme maddesi, e-posta taslağı, istenen kod veya Excel formülü.`,
  async calistir(p) {
    if (!p.metin) throw new Error("kopyalanacak metin yok");
    Pasteboard.copy(p.metin);
    return null;
  }
};
