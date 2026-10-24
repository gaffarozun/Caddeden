# 20 metreden yakın kafeye katılım bulutu

- Uygulama ön planda açıkken, aktif müşteri hesabında, önceden verilmiş konum izni varsa 20 saniyede bir güncel GPS ölçümü kontrol edilir. Pasif kontrol konum izni istemez; arka plan konumu/geofence/push bildirimi değildir.
- İşletmenin kayıtlı noktasına mesafe kesin olarak 20 metreden az, GPS hassasiyeti en fazla 20 m olmalıdır. Ölçüm en fazla 60 saniyelik olabilir. GPS bina içinde hassas olmayabilir; bulutun mutlaka gelmesi garanti edilemez.
- Yalnızca onaylı/yayında ve sosyal katılım veya masa/doluluk gösterimini açmış kafeler önerilir. Yakındaki uygun kafeler arasından en yakın önerilir. Açılış animasyonu, giriş/şifre yenileme ve hesap engeli sırasında bulut gizlenir. Sipariş bulutları kaybolmaz; kafe bulutu açıkken beklerler.
- “Bu kafede misiniz?” bulutu yalnızca öneridir. Evet denmeden cafe_visits kaydı yazılmaz ve doluluk artmaz. “Evet, buradayım” yeni GPS ölçümüyle cafe_join çağırır; başarılı olunca işletme sayfasına geçilir ve masa düzeni/görünür profiller açılır.
- Her yeni bulut fotoğrafı gizli başlatır. Göster/Gizle seçimi katılım onayına eklenir. Gizli katılımcı da dolulukta sayılır ve görünür profilleri görebilir. Instagram izinleri ve 72 saatlik reddetme gizliliği değiştirilmez. Sosyal katılım kapalıysa hiçbir fotoğraf paylaşılmaz.
- Hayır, kapat veya sayfayı aç seçimi otomatik öneriyi 30 dakika bu uygulama oturumunda erteler. Yakınlık kontrolünden uzaklaşılırsa veya GPS izni/bağlantı yoksa eski öneri kaldırılır. Reddetmek işletme sayfasından doğrulamayı engellemez.
- İşletme sayfasında “Buradayım · Konumla doğrula” her zaman alternatif giriş yoludur; yeni konum izni istenebilir. Aynı 20 m sunucu sınırı uygulanır. Başka kafede aktif katılım varsa sayfada bu katılımın değişeceği belirtilir; otomatik öneriler mevcut katılımı kendiliğinden değiştirmez.
- Önceki 5 dakikalık katılım süresi korunur. Kullanıcı mekândaysa sayfadan konumla yeniler; arka planda sürekli katılım yenileme yoktur. Uygulamayı kullanmayanlar sayılmaz; gerçek doluluk değil katılımcı tahminidir.
- Ham müşteri koordinatları yalnızca yakınlık hesabı sırasında kullanılır; veritabanına veya yerel depoya kaydedilmez, loglanmaz. cafe_nearby salt okunur RPC'dir, anon rolüne açık değildir. cafe_join onaylı girişte yazan tek yoldur. Eski veriler veya görünürlük tercihleri değiştirilmedi.

## Doğrulama
- supabase/tests/cafe_arrival_read_only.sql: mevcut RPC tanımları ve yetkileri için salt okunur kontroller.
- tests/cafeArrivalChecks.ts: 20 m sınırı, GPS hassasiyeti/tazeliği ve geçersiz koordinatlar için çalıştırılabilir kontroller.
- Gerçek GPS ve yerel konum izinleri Live Preview ile doğrulanmış sayılmaz. iOS/Android cihazda 19 m / 20 m / 21 m, konum kapalı/izin reddi, hassas konum kapalı, bulutu reddettikten sonra sayfadan katılma, gizli/görünür fotoğraf, mevcut katılım, uygulama arka planı ve hesap değişimi test edilmelidir.
