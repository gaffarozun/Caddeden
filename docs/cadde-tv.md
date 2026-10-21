# Cadde TV

## Görünüm ve kullanım
- Reels sekmesinin görünen adı, işletme paylaşım/reklam formları, kayıtlı içerikler ve yönetici içerik etiketleri Cadde TV oldu.
- Kullanıcının yüklediği oda/TV fotoğrafı yerel varlık olarak kullanılır. Fotoğraf kırpılmaz; ekran ve altyazı koordinatları aynı referans tuvaline göre ölçeklenir.
- TV camı yuvarlatılmış ve `overflow: hidden` ile sınırlandırılmıştır. İşletme görselleri `expo-image` ve `contentFit="contain"` ile gösterilir: esneme, yakınlaştırarak içerik kaybı veya kasadan taşma olmaz. Eski dikey görseller kenar boşluğu ile korunur.
- TV ekranına dokunmak sonraki işletme yayınına geçer. Son yayından sonra başa döner. Kategori filtreleri gerçek yayın listesini değiştirir; tek yayında kanal değiştirme düğmeleri pasiftir.
- İşletme profilini açma, kaydetme, beğenme ve paylaşma korunmuştur. Kayıtlar mevcut AppProvider üzerinden güncellenir.
- Oda altında küçük kumanda önceki/sonraki yayın, yazı akışını durdur/devam ettir ve yazı gönder düğmelerini içerir. Yükleme hatasında son düğme yeniden yüklemeye dönüşür.

## Yazı akışı
- Keşfet ekranındaki Üniversiteden alanı kaldırıldı; mevcut onaylı öğrenci yazıları TV'nin altındaki amber altyazı kanalına taşındı.
- Altyazıda Üniversiteden başlığı yoktur; sadece mesaj simgesi ve yazı akışı vardır.
- Kumandadaki kalem mevcut `/university` yazı istek ekranını açar; ekranın görünen adı Cadde TV'dir.
- Gerçek `submit_university_message` RPC, kullanıcı hesabı kontrolü, yönetici onayı, bekleyen istek sınırı ve hız sınırı korunur. Yönetici ekranındaki yazı onayları aynı kayıtlardır.
- Onaylanmamış yazılar gösterilmez. İki aynı ölçülen döngüyle kesintisiz sola akış; duraklatma, hareket azaltma, arka plan ve sekme odağı desteklenir.

## İşletme görselleri
- Cadde TV paylaşımı ve sponsorlu TV reklamında tek zorunlu kırpma oranı gerçek TV ekran oranıdır. Önerilen üretim ölçüsü yaklaşık 1584 × 1008 px.
- Kullanıcı kırpma alanını kaydırıp yakınlaştırabilir; oran serbest bırakılamaz. Onaylanan kırpma bir kere uygulanır ve fotoğraf TV kasasında ön izlenir.
- Seçilen çıktı genişlik/yüksekliği hizmet katmanında doğrulanır. İçerik türü veya reklam türü değiştirilince eski görsel temizlenir.
- Fotoğraf kırpıcı geometri state üzerinden güncellenir; son kırpma koordinatları fotoğraf sınırlarında tutulur. Hatalar görünür gösterilir.

## Backend ve veri koruması
- Yeni `public_cadde_tv_channels()` yalnızca yayındaki onaylı işletmelerin onaylı, tarih aralığı geçerli `kind='reel'` içeriklerini ve ödemesi doğrulanmış aktif `type='reels_sponsored'` reklamlarını yayınlar.
- Kişisel hesap, sahiplik ve ödeme ayrıntıları RPC çıktısında yoktur. Mevcut RLS politikaları ve yazma/onay izinleri değiştirilmedi.
- Mevcut içerik ID'leri, paket tipleri, rota yolu `/reels`, kayıtlı içerikler ve ücretlendirme korunmuştur. Veritabanındaki eski paket isimleri silinmez; ekranda Cadde TV olarak gösterilir.
- 30 saniye aralıklı sorgulama ve uygulama/sekme odağıyla yenileme kullanılır. Backend Realtime gerektirmez.
- TV akışında sahte/demo işletme yayını eklenmez. Yayın yoksa gerçek boş durum gösterilir.

## Doğrulama
- Canlı veritabanında salt-okunur kontroller geçti: anonim/oturumlu TV okuma, onay ve tarih filtreleri, öğrenci gönderme yetkisi, anonim gönderimin engellenmesi ve mevcut RLS.
- Native cihaz ve görsel piksel karşılaştırması bu oturumda çalıştırılmadı. Kontrol listesi: 320/375/414 px, tablet ve yatay yön; tam TV sınırları; farklı en-boy oranlı eski görseller; iki yayın arasında dokunarak geçiş; kumanda durdur/devam; öğrenci isteği ve yönetici onayı; galeri kırpma/ön izleme/yükleme.
