# İbrahim Paşa — Scriptable ile kişisel asistan

Müşteri, emlak (daire/arsa/iş yeri), gelir-gider, sağlıklı yaşam ve notları tek bir kayıt defterinde tutan, Siri ve Paylaş menüsüyle çalışan asistan. Mesaj/WhatsApp/e-posta hazırlar, arar, hatırlatıcı ve takvim ekler, internette arar, parsel sorgusu açar, müşteriye cevap ve kod yazar.

## Neler yapabilir (v1.1)

| Ne | Örnek komut |
|---|---|
| Müşteri / emlak kaydı | "Mehmet Bey 3+1 satılık arıyor, Ataşehir, bütçe 6 milyon" |
| Emlakçı ilanı | WhatsApp'ta mesajı uzun bas > Paylaş > Scriptable > Asistan |
| Müşteriye cevap | Müşterinin mesajını paylaş: kaydeder, cevap taslağını panoya kopyalar, sohbete yapıştırırsın |
| SMS / iMessage | "Mehmet Bey'e yarın 10'da görüşelim diye mesaj at" |
| WhatsApp | "Ahmet emlakçıya WhatsApp'tan Çatalca arsası hâlâ satılık mı diye yaz" |
| E-posta, arama | "Ayşe Hanım'a sözleşmeyi mail at", "Mehmet Bey'i ara" |
| Hatırlatıcı, takvim | "Cuma 14'te Kadıköy daire gösterimi ekle", "yarın tapuyu hatırlat" |
| Gelir-gider | "Bugün 1.500 lira yakıt", "bu ay ne kadar komisyon aldım?" |
| Sağlık | "8 bin adım attım, kilom 84", "bu hafta nasıl gidiyorum?" |
| Harita, parsel | "Çatalca arsasının parselini aç", "ilanın konumuna götür" |
| Bilgi, kültür, piyasa | "Bugün dolar kaç?", "2026 tapu harcı oranı ne?", "Kadıköy'de m2 kira ortalaması" |
| Kod, metin | "Sahibinden için bu daireye ilan metni yaz", "Excel'de komisyon formülü yaz" |
| Geri al | "Geri al" (son kayıt değişikliğini geri alır) |
| Günlük özet | "Günlük özet" (takvim, hatırlatıcılar, takipteki müşteriler, ay durumu) |
| Sorun giderme | "test" (internet, API anahtarı, izinler ve son kayıtları gösterir) |

**Derin mod:** Komutta "detaylı", "analiz et", "karşılaştır", "kod yaz", "strateji" gibi kelimeler geçerse en üst düzey düşünme ve daha fazla internet araması açılır. Normal komutlar hızlı modda çalışır.

**Önemli (Apple kuralı):** iPhone hiçbir uygulamanın senin yerine habersiz SMS/WhatsApp/e-posta göndermesine izin vermez. İbrahim Paşa mesajı yazıp hazır açar, **gönder tuşuna sen basarsın**. Kayıt silmeden önce de her zaman onay sorar.

## Nasıl çalışır

- **Yükleyici** (`Yukleyici.js`): Telefona bir kez kurulur. Her çalışmada bu repodaki `kod/manifest.json` sürümüne bakar, değiştiyse yeni kodu indirir. İnternet yoksa telefondaki son sürümle çalışır.
- **Çekirdek** (`kod/ana.js`): Veriyi, ajandayı ve son 6 konuşmayı okur, Claude'a sorar, kayıtları ve eylemleri uygular. Ana ekran widget'ını da çizer.
- **Modüller** (`kod/moduller/*.js`): Kayıt modülleri (müşteri, emlak, finans, sağlık, not) ve eylem modülleri (mesaj, whatsapp, eposta, arama, hatırlatıcı, takvim, harita, parsel, kopyala).
- **Veri**: Sadece telefonda: `iCloud Drive > Scriptable > Asistan > veri.json` (+ `veri.json.yedek`, `gecmis.json`). Repoya hiç gelmez.
- **API anahtarı**: Telefonun Anahtar Zinciri'nde. Repoya hiç gelmez.

## Telefona kurulum (bir kez)

1. App Store'dan **Scriptable** uygulamasını kur.
2. console.anthropic.com adresinde hesap aç, kredi yükle, bir API anahtarı oluştur.
3. Scriptable'da **+** ile yeni betik aç, `Yukleyici.js` içeriğini yapıştır, betiğin adını **Asistan** yap.
4. Betiği bir kez çalıştır: API anahtarını yapıştır. Rehber, Takvim ve Hatırlatıcılar izni isterse **İzin Ver**.
5. **Siri (sesli konuşma):** Kestirmeler'de yeni kestirme, sadece 2 adım:
   - **Dikte Et** (Dictate Text): Dil Türkçe, "Dinlemeyi Durdur: Duraklamadan Sonra",
   - Scriptable **Run Script**: Script = *Asistan*, Parameter = *Dikte Edilen Metin*, **Run In App açık**.
   - "Konuş" eylemi EKLEME: İbrahim Paşa cevabı kendisi sesli okur.
   - Adı **İbrahim Paşa** olsun. "Hey Siri, İbrahim Paşa" de, sorunu söyle, cevabı sesli dinle.
6. **Paylaş menüsü:** Scriptable'da betiğin ayarlarında (⚙︎) Share Sheet Inputs: **Text** ve **URL** aç.
7. **Widget:** Ana ekranda boş yere basılı tut > + > Scriptable > küçük ya da orta widget > widget'a dokun > Script: **Asistan**.
8. **Her sabah özet (isteğe bağlı):** Kestirmeler > Otomasyon > Günün Saati 08:00 > Run Script (Asistan, Parametre: "günlük özet", Run In App açık). "Hemen Çalıştır" seç.

## Güncelleme

Kodu değiştirip `kod/manifest.json` içindeki `surum` değerini artırmak yeterli. Telefon bir sonraki çalışmada yeni sürümü kendisi alır.

## Ayarlar (`kod/ana.js` başı)

- `MODEL`: varsayılan `claude-opus-5-5`. Daha ucuz için `claude-haiku-5-5`.
- `HIZLI`: hızlı mod (yaklaşık 2 kat hızlı, 2 kat fiyat). Kapatmak için `false`.
