// Yukleyici.js — Telefona BİR KEZ kurulur (Scriptable'da adı "Asistan" olsun).
// Her çalışmada GitHub'daki manifest.json'a bakar; yeni sürüm varsa modülleri indirir,
// internet yoksa telefondaki son sürümle çalışır. Senin verine dokunmaz.

const REPO = "Luxe-yatirim/-brahim-pa-a";
const DAL = "main";
const KAYNAK = `https://raw.githubusercontent.com/${REPO}/${DAL}/kod/`;

const fm = FileManager.iCloud();
const kodKlasoru = fm.joinPath(fm.joinPath(fm.documentsDirectory(), "Asistan"), "kod");
if (!fm.fileExists(kodKlasoru)) fm.createDirectory(kodKlasoru, true);
const yerelManifest = fm.joinPath(kodKlasoru, "manifest.json");

async function indir(ad) {
  const r = new Request(KAYNAK + ad + "?t=" + Date.now());
  r.timeoutInterval = 15;
  const metin = await r.loadString();
  if (r.response.statusCode !== 200) throw new Error(ad + " indirilemedi (" + r.response.statusCode + ")");
  return metin;
}

async function guncelle() {
  let yerel = null;
  if (fm.fileExists(yerelManifest)) {
    await fm.downloadFileFromiCloud(yerelManifest);
    yerel = JSON.parse(fm.readString(yerelManifest));
  }
  try {
    const uzakMetin = await indir("manifest.json");
    const uzak = JSON.parse(uzakMetin);
    if (!yerel || yerel.surum !== uzak.surum) {
      // Önce hepsini indir, sonra yaz: yarım güncelleme olmasın
      const dosyalar = {};
      dosyalar[uzak.ana] = await indir(uzak.ana);
      for (const m of uzak.moduller) dosyalar[m] = await indir("moduller/" + m);
      const modKlasoru = fm.joinPath(kodKlasoru, "moduller");
      if (!fm.fileExists(modKlasoru)) fm.createDirectory(modKlasoru, true);
      fm.writeString(fm.joinPath(kodKlasoru, uzak.ana), dosyalar[uzak.ana]);
      for (const m of uzak.moduller) fm.writeString(fm.joinPath(modKlasoru, m), dosyalar[m]);
      fm.writeString(yerelManifest, uzakMetin);
      return uzak;
    }
  } catch (e) {
    if (!yerel) throw new Error("İlk kurulum için internet gerekli: " + e.message);
    // internet yok veya GitHub'a ulaşılamadı: yerel sürümle devam
  }
  return yerel;
}

const manifest = await guncelle();
const moduller = manifest.moduller.map(m => importModule("Asistan/kod/moduller/" + m));
const ana = importModule("Asistan/kod/" + manifest.ana);
const cikti = await ana.calistir(args, config, moduller, manifest.surum);
if (cikti) Script.setShortcutOutput(cikti); // Kestirme bunu Siri ile sesli okur
Script.complete();
