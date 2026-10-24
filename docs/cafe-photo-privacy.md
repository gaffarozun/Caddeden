# Mekân katılımında fotoğraf gizliliği

- Tüm işletme kategorileri desteklenir. İşletme sahibi İsteğe bağlı mekân katılımı ayarıyla profilleri açar/kapatır; hiçbir işletme otomatik etkinleştirilmez. Onaylı/yayında işletme ve kayıtlı konum gerekir.
- 20 metreden yakın müşteri buluttan veya işletme → Mekândakiler bölümünden konumla onay verir. Fotoğraf her yeni girişte varsayılan gizlidir; gösterme kullanıcı tercihidir. Gizliyken de katılım ve görünür profillere erişim mümkündür.
- Hesap Bilgilerim bölümünden kare fotoğraf yüklenir. Fotoğraf gizliyken kendi hesabında görünür; diğer katılımcılara görünmez. Göster/Gizle, katılımı yenile ve Mekândan ayrıl aynı bölümde kullanılabilir.
- Katılım 5 dakika sürer. Güncel GPS hassasiyeti en fazla 20 m ve ölçüm yaşı en fazla 60 sn olmalıdır. Arka plan konumu ve otomatik katılım yoktur; ham müşteri koordinatları kaydedilmez.
- 512x512 JPEG fotoğraflar en fazla 1 MB olarak özel cafe-profile-photos bucket'ında kalır. Public veya signed URL oluşturulmaz. Storage indirmelerinde aktif hesaplar, aynı mekânda aktif katılım, açık işletme tercihi, fotoğraf görünürlüğü ve 72 saatlik ret engeli kontrol edilir.
- İşletme/yönetici rolü müşterilerin özel fotoğraflarına ek erişim vermez. E-posta, soyad, telefon, kesin müşteri konumu veya Instagram kullanıcı adı katılımcı listesinde sunulmaz.
- Görünür profiller uygulama aktifken 10 saniyelik polling ile doğrulanır. Ayrılma, süre bitimi veya indirme hatası fotoğrafları temizler. expo-image cachePolicy none kullanılır; fotoğraf yalnızca bellekte tutulur.
- Gizleme yeni indirmeleri engeller; daha önce görülen fotoğraf veya ekran görüntüsü geri alınamaz. Diğer cihazda mevcut görüntünün kaldırılması polling/bağlantı süresine bağlıdır.
- Doluluk yüzdesi gösterilmez; aktif katılımcı sayısı fiziksel doluluk değildir. Ayrıntılar: docs/cafe-arrival-prompt.md ve docs/cafe-seating-and-instagram.md.

## Doğrulama
- supabase/tests/all_business_participation_read_only.sql: tüm kategorilerde işletme tercihi ve uzaktan gizlilik sınırları.
- supabase/tests/cafe_photo_privacy_read_only.sql ve tests/cafePhotoPrivacyChecks.ts: mevcut özel fotoğraf erişimi ve süre modeli kontrolleri.
- Gerçek cihazda iki müşteriyle aynı/farklı mekân, gizli/görünür fotoğraf, ayrılma, 5 dakika sona erme ve işletme tarafından kapatma ayrıca test edilmelidir.
