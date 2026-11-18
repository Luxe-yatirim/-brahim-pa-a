// Apple Hatırlatıcılar'a ekler
module.exports = {
  ad: "hatirlatici",
  tip: "eylem",
  eylem: "hatirlatici",
  talimat: `Hatırlatıcılar uygulamasına ekler (ör. müşteriyi geri ara, tapu randevusu). parametreler: baslik, zaman (ISO, isteğe bağlı), not.
  Kullanıcı "hatırlat" derse veya bir müşteriyle "sonra görüşeceğiz" gibi bir takip gerekiyorsa öner, istenirse ekle.`,
  async calistir(p, baglam) {
    const { tarihCoz } = baglam;
    const r = new Reminder();
    r.title = p.baslik || "Hatırlatma";
    if (p.not) r.notes = p.not;
    const z = tarihCoz(p.zaman);
    if (z) { r.dueDate = z; r.dueDateIncludesTime = true; }
    r.save();
    return null;
  }
};
