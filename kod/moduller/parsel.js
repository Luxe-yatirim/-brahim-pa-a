// Parsel sorgu: TKGM'nin resmi Parsel Sorgu sayfasını açar.
// Bilgiler panoya kopyalanır, sayfada il/ilçe/mahalle/ada/parsel seçilir.
// (TKGM'nin herkese açık resmi bir API'si olmadığı için sayfayı otomatik kazımıyoruz.)
module.exports = {
  ad: "parsel",
  tip: "eylem",
  eylem: "parsel",
  talimat: `TKGM Parsel Sorgu'yu açar (arsa/tarla için ada-parsel, alan, nitelik, haritada konum). parametreler: il, ilce, mahalle, ada, parsel.
  Bilgiler bir emlak kaydında varsa oradan al. Cevapta "Parsel sorgu sayfasını açtım, bilgileri panoya kopyaladım" de.`,
  async calistir(p) {
    const ozet = [p.il, p.ilce, p.mahalle].filter(Boolean).join(" / ") +
      (p.ada || p.parsel ? `  Ada: ${p.ada || "-"}  Parsel: ${p.parsel || "-"}` : "");
    if (ozet.trim()) Pasteboard.copy(ozet.trim());
    Safari.open("https://parselsorgu.tkgm.gov.tr/");
    return null;
  }
};
