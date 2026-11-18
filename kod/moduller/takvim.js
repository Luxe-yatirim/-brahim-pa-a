// Apple Takvim'e etkinlik ekler (iPhone'a bağlı Google Takvim de olur)
module.exports = {
  ad: "takvim",
  tip: "eylem",
  eylem: "takvim",
  talimat: `Takvime etkinlik ekler (ör. daire gösterimi, müşteri görüşmesi). parametreler: baslik, baslangic (ISO), sure_dakika (varsayılan 60), konum, not.`,
  async calistir(p, baglam) {
    const { tarihCoz } = baglam;
    const bas = tarihCoz(p.baslangic);
    if (!bas) throw new Error("saati anlayamadım");
    const e = new CalendarEvent();
    e.title = p.baslik || "Görüşme";
    e.startDate = bas;
    e.endDate = new Date(bas.getTime() + (parseInt(p.sure_dakika, 10) || 60) * 60000);
    if (p.konum) e.location = p.konum;
    if (p.not) e.notes = p.not;
    e.calendar = await Calendar.defaultForEvents();
    e.save();
    return null;
  }
};
