// Emlak modülü: emlakçıların gönderdiği daire / arsa / iş yeri kayıtları
module.exports = {
  ad: "emlak",
  turler: ["emlak"],
  talimat: `- emlak: tip (daire/arsa/iş yeri), satilik_kiralik, fiyat (sayı, TL), konum, m2, oda, kat, emlakci_adi, emlakci_tel, ilan_linki, durum (aktif/satıldı/kiralandı), notlar.
  Paylaşılan emlakçı mesajlarından bu alanları çıkar. Aynı ilan zaten varsa yeni kayıt açma, "guncelle" kullan.
  Yeni bir emlak kaydı bir müşterinin aradığına uyuyorsa cevapta o müşteriyi söyle.`
};
