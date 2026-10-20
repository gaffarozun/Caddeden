# İşletme profili ve menü tasarımı

## Tasarım
Caddeden müşterileri işletmenin görünümünü, konumunu ve fiyatlarını tek bakışta inceleyip güvenle sipariş veya rezervasyon talebi oluşturur. Görsel dil: koyu, pürüzsüz ve katmanlı sahne; sıcak altın vurgu, solda ürün fotoğrafı, sağda fiyat.

Görsel referans arayüz olarak kullanılır, uygulamada ekran görüntüsü gösterilmez. Dokunulabilir ve erişilebilir React Native bileşenleriyle uygulanmıştır. Mobil ölçüler `constants/theme.ts` içindeki `businessProfileLayout` üzerinden, ortak stiller `constants/businessProfileStyles.ts` üzerinden yönetilir. Ekran genişlikleri ve işletmenin metin uzunluğuna göre düzen uyarlanır; bütün cihazlarda piksel eşitliği iddia edilmez.

## Sayfalar
- `/business/[id]`: kapak, logo, işletme adı (onay rozeti olmadan), bağımsız yıldız ortalaması, kategori, uzaklık ve açık/kapalı durumu; Ara/Konum/Kaydet/Paylaş; Menü & Fiyatlar ve ayrı rezervasyon bağlantısı.
- `/business/menu/[id]`: işletmenin oluşturduğu kategori başlıkları, ortak veya kategoriye özel üst fotoğrafı, solda fotoğraf ve ürün açıklaması, sağda fiyat. Siparişe açık işletmelerde fiyatın solunda küçük artı; seçilmiş ürün altında azaltma kontrolü.
- `/business/reserve/[id]`: tarih, saat, kişi/hizmet ve telefon ile mevcut gerçek rezervasyon tablosuna talep gönderimi.
- `/business/rate/[id]`: yorum listesi yerine mevcut bağımsız yarım yıldız puanlama. Müşteri deneyimleri yönetici anahtarı ve moderasyon sistemi değiştirilmedi.
- `/history?businessId=...&mode=active|past`: seçili işletmenin aktif veya tamamlanmış/reddedilmiş siparişleri. Rezervasyonlar ayrı seçilebilir. Ekran açıkken 15 saniyelik sorgulama ve elle yenileme ile durum takibi.

## Veri ve izinler
Mevcut `businesses.maps_url`, `menu_cover_url`, `menu_group_covers`, `profile_tags` alanları kullanılır. Yeni tablo oluşturulmadı ve mevcut kullanıcı/sipariş verileri değiştirilmedi. İşletme sahibi düzenlemeleri mevcut RLS ile yetkilendirilir. Kapak/kategori fotoğrafları `business-media` altında saklanır; yalnızca URL'ler profil kaydında tutulur. Bu değişikliklerde yönetici onayı gerekmez; işletmenin yayın onayı, kampanya onayı ve korunan profil alanları korunur.

İşletme Sayfam ekranındaki Profil ve menü görünümü alanından Google Haritalar bağlantısı, etiketler, üst menü fotoğrafı ve kategori kapakları düzenlenebilir. Fotoğraf seçimi zorunlu kırpma yapmaz. Kategoriler ürün eklerken Grup / Başlık ile oluşturulur ve topluca yeniden adlandırılabilir. Ürün eklerken kısa açıklama/ürün içeriği girilebilir.

Ara, numarayı onay kutusunda gösterir ve `tel:` ile telefon uygulamasına geçer. Konum, kaydedilmiş Google Haritalar bağlantısını, yoksa koordinat/adres aramasını açar. Paylaş, işletmenin uygulama içi bağlantısını ve Haritalar bağlantısını sistem paylaşım akışına verir. Keşfet kampanyaları fotoğrafsız, kompakt metin kartlarıdır.

## Sipariş akışı
Sepet `BusinessCartProvider` ile sayfalar arasında paylaşılır, hesap değişince temizlenir; henüz uygulama kapanışına karşı kalıcı saklama uygulanmaz. Telefon/adres/konum profilden doldurulur. Sipariş öncesinde güncel ürünlerin varlığı, fiyatı, minimum tutar, sahiplik ve açık/kapalı durumu istemcide tekrar kontrol edilir. Mevcut konum 100 m şartı korunur. Talep mevcut `orders` tablosuna aynı servis üzerinden yazılır ve Aktif siparişler sayfası açılır. Bu sürüm mevcut RLS'yi değiştirmez; istemci fiyat denetimi sunucu taraflı fiyat doğrulamasının yerine geçmez.

## Doğrulama sınırı ve cihaz kontrol listesi
Derleme/gerçek cihaz testi bu oturumda çalıştırılmadı. Yayınlamadan önce:
1. 320–414 px telefon, tablet ve yatay yönlerde profil/menü boyutlarını inceleyin.
2. İşletme hesabıyla ortak ve kategoriye özel kapak ekleyin; müşteri hesabında yeniden açıp göründüğünü doğrulayın.
3. Kategori adı değiştirme, yeni ürün/grup ekleme ve açıklama kaydını kontrol edin.
4. Ara numara gösterimi ve telefon uygulaması, kaydedilmiş Haritalar bağlantısı, kaydet ve native paylaşım akışlarını cihazda test edin.
5. Siparişe kapalı işletmede artı/sepet görünmemesini; açık işletmede kategoriler arasında sepetin korunmasını doğrulayın.
6. Minimum altında gönderimin engellenmesini, telefon/konum eksikliğini, konum izni reddini ve 100 m dışındaki hata durumlarını test edin.
7. Gerçek müşteri talebini işletme hesabından onaylayıp teslim edildi olarak işaretleyin; müşterinin aktif/geçmiş listesine yansımasını kontrol edin.
8. Rezervasyon/randevu talebi ve işletme onayını kontrol edin.
9. Demo işletmelerde gerçek sipariş/rezervasyon/puan yazımı olmamasını ve işletme/yönetici hesaplarının puan verememesini doğrulayın.
