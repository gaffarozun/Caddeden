# Kafe oturma düzeni ve Instagram gizliliği

## Kullanım
- İşletme Sayfam → İsteğe bağlı kafe katılımı: konumla katılımı aç/kapat. Önce kafe kategorisi ve işletme konumu kaydedilmelidir.
- İşletme Sayfam → Masa planı: masa ekle, adını ve 1–12 kişilik kapasitesini belirle, oklarla 6×10 plan içinde konumlandır, gösterim tercihiyle birlikte kaydet. En fazla 60 masa. Plan ve doluluk gösterimi ayrıca kapatılabilir; kapalıyken ziyaretçilere masa planı verilmez.
- Mekânın sayfasında kimlik/iletişim düğmelerinin hemen altında **Mekândakiler** alanı bulunur: tahmini doluluk, konumla katılım, masa düzeni ve görünür profiller burada toplanır. İşletme gösterimi açtıysa doluluk özeti uzaktan da görünür; masa düzeni sunucuda yalnızca aynı mekâna konumla katılmış müşterilere ve işletmenin yetkili yöneticisine verilir. Aktif katılımcı sayısı / kaydedilen kapasite 0–100 olarak gösterilir; gizli fotoğraflı kişiler de sayılır. İşletme konumu veya kapasite eksikse oran gösterilmez.
- Masa planı açık, sosyal katılım kapalı olabilir: konumla katılım masa düzenini açar, hiçbir profil veya Instagram erişimi paylaşılmaz. Profil fotoğrafları ve istekler işletmenin sosyal katılım ayarına bağlı kalır. Konumla katılım sona erdiğinde masa düzeni ve diğer kişilerin fotoğrafları temizlenir; tekrar konumla katılım gerekir.
- Profil → Hesap Bilgilerim: profil fotoğrafı ekle, isteğe bağlı Instagram kullanıcı adını özel olarak kaydet. Bu kullanıcı adının sahipliği Instagram OAuth ile doğrulanmaz; Instagram API veya giriş entegrasyonu değildir.
- Kafeye katılırken her girişte fotoğrafını Göster/Gizle seç. Konum 20 metreden az mesafe ve en fazla 20 metre hassasiyet sınırlarıyla mevcut katılım RPC'sinde kontrol edilir; müşteri koordinatları saklanmaz. Katılım 5 dakika sürer, kullanıcı konumla yeniler.
- Konum izni önceden verilmişse uygulama açıkken 20 metreden yakın kafe için katılım bulutu gelir. Evet denmeden doluluk artmaz. Fotoğraf gizli başlar; gösterme tercihi onayla uygulanır. Bulutu reddeden veya almayan müşteri işletme sayfasından konumla doğrulayabilir. Ayrıntılar: docs/cafe-arrival-prompt.md.
- Aynı kafeye katılmış kullanıcılar görünür profil fotoğraflarından Instagram görme isteği gönderir. Bekleyen istekte bağlantı verilmez. İstekler kafe katılım bölümünde ve Profil bölümünde gösterilir.
- Alıcı İzin ver veya Reddet seçer. Instagram bağlantısı yalnızca isteği gönderen kişiye, onaydan sonra ve iki kullanıcı da aynı kafede aktif katılımcıyken sunulur. Başka kullanıcının isteğiyle açılamaz.
- Reddet veya İzni kaldır: alıcının profil fotoğrafı, isteği gönderen kişiye tam 72 saat gösterilmez; aynı kişiye bu süre boyunca yeniden istek gönderilemez. Bu engel tüm kafelerde ve fotoğraf değişse bile geçerlidir. Diğer katılımcılar etkilenmez. Önceki görülmüş fotoğraf, ekran görüntüsü veya Instagram adresi geri alınamaz.

## Güvenlik ve sınırlar
- Instagram kullanıcı adları özel bir tabloya kaydedilir; public user_profiles/metadata/avatar URL'lerine eklenmez. İstek listeleri hiçbir karşı tarafın kullanıcı adını döndürmez.
- Fotoğraflar mevcut private cafe-profile-photos bucket'ında kalır. Storage download yetkisi aynı kafe, aktif katılım, fotoğraf görünürlüğü ve 3 günlük reddetme engelini her istekte kontrol eder. Public/signed URL oluşturulmaz, expo-image cachePolicy none kullanılır.
- Üyeler, istekler ve fotoğraf yetkileri uygulama aktifken 10 saniyelik polling ile yeniden doğrulanır. Mevcut bellek görüntüsünün diğer cihazda kaybolması bu aralık kadar gecikebilir; yeni indirmeler sunucuda hemen engellenir. Arka plana geçildiğinde diğer kullanıcı görüntüleri temizlenir.
- GPS gerçek doluluk veya hangi masanın dolu olduğunu ölçemez. Uygulamayı kullanmayanlar sayılmaz. Masa planı gerçek dolu/boş masa göstergesi değildir; kullanıcıya açıkça tahmin olarak gösterilir. Konum ölçümleri cihazdan geldiği için sahteciliğe karşı fiziksel kanıt değildir.
- İstek gönderme sınırı saatte 10 kişi, kişinin kendisine istek yasak. Aynı çiftin bekleyen/onaylı isteği tekrar oluşturulmaz. Onay/ret yalnızca alıcı RPC'siyle işlenir. Yetki, hesap durumu, yakınlık/katılım ve izin sunucuda doğrulanır.
- Migration mevcut roller, siparişler, hesap izinleri veya katılım görünürlük seçimlerini değiştirmez. Tablo planı değişimi yalnızca işletmenin Kaydet eyleminde atomik olarak yapılır.

## Kontrol
- supabase/tests/cafe_venue_page_read_only.sql ve tests/cafeVenuePageChecks.ts: anonim/uzaktaki kullanıcıya masa planının verilmemesi, aktif sunucu/yerel katılım eşleşmesi, süre dolumu ve sosyal katılım kapalıyken profil gizliliği.
- supabase/tests/cafe_seating_social_read_only.sql: RLS/privilege, alıcı/gönderen kapsamı, onay/co-presence, 72 saat ve fotoğraf indirme korumaları. Kullanıcı verisi değiştirmez.
- tests/cafeSeatingSocialChecks.ts: kapasite, yüzdelik sınırları, kullanıcı adı ve cooldown bitiş sınırı için çalıştırılabilir kontroller.
- Gerçek cihazda iki müşteriyle aynı kafe, ayrı kafe, konum izni reddi, gizli fotoğraf, istek/onay/ret, uygulama arka planı, 5 dakika dolumu ve 72 saat sonu ayrıca kontrol edilmelidir.
