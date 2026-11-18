// Emlak modülü: emlakçıların gönderdiği daire / arsa / iş yeri kayıtları
module.exports = {
  ad: "emlak",
  turler: ["emlak"],
  talimat: `- emlak: tip (daire/arsa/iş yeri/tarla/villa), satilik_kiralik, fiyat (sayı, TL), il, ilce, mahalle, adres, m2, oda, kat, ada, parsel, imar_durumu, tapu_durumu, emlakci_adi, emlakci_tel, ilan_linki, durum (aktif/satıldı/kiralandı), notlar.
  Paylaşılan emlakçı mesajlarından bu alanları çıkar. Aynı ilan zaten varsa yeni kayıt açma, "guncelle" kullan.
  Arsa ve tarlalarda ada/parsel bilgisini mutlaka sor veya kaydet; m2 fiyatını hesaplayıp cevapta söyle.
  Yeni bir emlak kaydı bir müşterinin aradığına uyuyorsa cevapta o müşteriyi söyle.`
};
