# Asistan — Scriptable ile kişisel, modüler asistan

Müşteri, emlak (daire/arsa/iş yeri), gelir-gider, sağlıklı yaşam ve notları tek bir kayıt defterinde tutan, Siri ve Paylaş menüsüyle çalışan asistan.

## Nasıl çalışır

- **Yükleyici** (`Yukleyici.js`): Telefona bir kez kurulur. Her çalışmada bu repodaki `kod/manifest.json` dosyasına bakar. Sürüm değiştiyse yeni kodu indirir. İnternet yoksa telefondaki son sürümle çalışır.
- **Çekirdek** (`kod/ana.js`): Veriyi okur, Claude'a sorar, sonucu kaydeder.
- **Modüller** (`kod/moduller/*.js`): Her alan için ayrı bir dosya. Yeni modül eklemek için dosyayı koyup `manifest.json` içine yazmak ve `surum` numarasını artırmak yeterli.
- **Veri**: Sadece telefonda, `iCloud Drive > Scriptable > Asistan > veri.json` dosyasında durur. Her kayıttan önce `veri.json.yedek` olarak bir önceki hali saklanır. Veri bu repoya hiç gelmez.
- **API anahtarı**: Telefonun Anahtar Zinciri'nde saklanır. Repoya hiç gelmez.

## Telefona kurulum (bir kez)

1. App Store'dan **Scriptable** uygulamasını kur.
2. console.anthropic.com adresinde hesap aç, biraz kredi yükle ve bir API anahtarı oluştur.
3. Scriptable'da sağ üstteki **+** ile yeni betik aç. `Yukleyici.js` dosyasının içeriğini yapıştır ve betiğin adını **Asistan** yap.
4. Betiği bir kez çalıştır. API anahtarını sorar, yapıştır. Sonra bir deneme cümlesi yaz.
5. **Siri için:** Kestirmeler uygulamasında yeni kestirme oluştur:
   - "Metin İste" (veya "Dikte Et") eylemini ekle,
   - Scriptable'ın **Run Script** eylemini ekle: betik *Asistan*, Parametre olarak bir önceki eylemin metnini ver, "Show When Run" kapalı olsun,
   - "Konuş" (Metni Seslendir) eylemiyle Run Script'in çıktısını okut,
   - Kestirmenin adını **Asistan** koy. Artık "Hey Siri, Asistan" diyebilirsin.
6. **Paylaş menüsü için:** Scriptable'da betiğin ayarlarında (⚙︎) "Share Sheet Inputs" kısmından **Text** ve **URL** seçeneklerini aç. WhatsApp'ta bir emlakçı mesajını uzun basıp Paylaş > Scriptable > Asistan dediğinde kayıt açılır.

## Örnek kullanım

- "Emlakçı Ahmet'ten Kadıköy'de 3+1 kiralık daire, 25 bin, 120 metrekare"
- "Mehmet Bey müşteri, Ataşehir'de 2+1 satılık arıyor, bütçe 6 milyon, telefonu 0532…"
- "Bugün 1.500 lira yakıt gideri"
- "Bu ay toplam gelirim ve giderim ne?"
- "Mehmet Bey'e uyan daire var mı?"
- "Bugün 8 bin adım attım, kilom 84"

## Güncelleme

Kodu değiştirmek için bu repoda dosyaları düzenleyip `kod/manifest.json` içindeki `surum` değerini artırmak yeterli. Telefon bir sonraki çalışmada yeni sürümü kendisi alır.
