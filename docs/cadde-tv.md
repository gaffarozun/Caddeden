# Cadde TV

## Güncel sahne
- Arka plan kullanıcı tarafından sağlanan neon oda görselidir: `assets/images/cadde-tv-neon-room.png`. Yerel görsel kullanılır; Unsplash veya uzaktan görsel yüklenmesine bağımlılık yoktur. Görselin özgün renkleri korunur.
- Sahne, kaynak görselin 941 × 1672 oranını korur. Oda ve TV birlikte %34 yakınlaştırılır; cam alanı sahne genişliğinin yaklaşık %94’ünü kaplar. Dış oda/kasa kenarları kırpılır, canlı camın tamamı görünür kalır. TV kasası arka planla aynı konum ve ölçekte yerleştirilir; ikinci bir TV veya farklı oda katmanı oluşmaz. Cam alanı (137, 432, 660, 376), LED alanı (56, 817, 848, 63) kaynak piksel koordinatlarına göre hesaplanır. İşletme ön izlemesi de aynı yeni kasayı kullanır.
- Pembe, camgöbeği, altın ve mor parlayan öğrenci yazıları, çok renkli ince ışık rayları ve LED noktaları korunur. Fotoğraftaki örnek reklamın ve örnek altyazının üzerine gerçek yayın/boş durum ve onaylı öğrenci yazıları yerleştirilir.
- Fiziksel kumanda arayüzü, beğenme, kaydetme, paylaşma ve işletme açıklaması Cadde TV ekranından kaldırıldı. Eski kayıtlı içerikler ve diğer Gönderiler özellikleri silinmedi.
- Ekran `overflow: hidden` ve `expo-image contentFit="contain"` ile sınırlandırılır. Yeni oda görselinin cam geometrisi mevcut gönderim oranını değiştirmez; eski ve yeni fotoğraflar esnetilmeden, gerektiğinde kenar boşluklarıyla gösterilir.

## Fotoğraf akışı
- İki veya daha fazla yayında dört saniye sonra otomatik sonraki görsele geçilir. Son görselden sonra ilk görselle döngü devam eder.
- TV ekranına dokunmak veya sağ ok sonraki görsele anında geçer; sol ok önceki görsele döner. Her manuel işlem yeni bir dört saniyelik süre başlatır. Hızlı art arda dokunuşlarda güncel liste üzerinden seçim yapılır.
- Görseller yönüne uygun, 260 ms süren yatay bant geçişiyle değişir. Azaltılmış hareket tercihinde geçiş animasyonu uygulanmaz.
- Sekme odağı kaybolunca veya uygulama arka plana gidince otomatik geçiş durur; odak/ön plan geri geldiğinde yeni süre başlar. Zamanlayıcılar ve abonelikler temizlenir.
- 30 saniyelik sunucu sorgulaması aynı listeyi getirirse otomatik geçiş zamanlayıcısı sıfırlanmaz. Kategori filtreleri görünür yayın listesini değiştirir. Tek yayında önceki/sonraki oklar pasiftir.
- Görselin ait olduğu işletmenin adı doğrudan `/business/{businessId}` profilini açar. Profil erişimi o anda gösterilen yayınla eşleşir. Profil bağlantısı ve ileri/geri okları, sayfanın altına sabitlenmiş çok saydam bir yüzeydedir; oda arkadan görünür ve bağlantı kaydırma sırasında da erişilebilir kalır.

## Öğrenci yazıları
- Sadece mevcut yönetici onaylı yazılar LED kanalında gösterilir; Üniversiteden başlığı yoktur.
- İki aynı ölçülen döngü ile kesintisiz sola kayan renkli yazılar kullanılır. Azaltılmış hareket tercihinde metin elle yatay kaydırılabilir.
- Yazı akışına dokunmak metni duraklatır/devam ettirir; bu, fotoğrafların dört saniyelik akışından bağımsızdır.
- Altyazı içindeki kalem mevcut `/university` gönderim ekranını açar. Yazı yükleme hatasında kalem yerine yeniden yükleme görünür. Yönetici onayı, kullanıcı kontrolü ve gönderim sınırları korunur.

## İşletme gönderimi ve veri koruması
- Cadde TV paylaşımı ve sponsorlu TV reklamında açıklama/reklam metni alanı gösterilmez ve zorunlu değildir. Hizmet katmanı TV içeriklerinde yeni `caption`/`title` değerini `null` gönderir.
- Normal Gönderiler ve diğer reklam türlerinin açıklama/metin akışları değişmez. Eski TV açıklamaları veritabanından silinmez; TV görüntüsünde okunmaz/gösterilmez.
- Fotoğraf kırpıcıda aynı zorunlu TV oranı korunur; önerilen ölçü 1584 × 1008 px. Ön izleme aynı TV kasasını ve cam geometri hesabını kullanır.
- Paketler, ücret hesapları, yönetici onayı ve ödeme doğrulaması değişmedi. Mevcut `public_cadde_tv_channels()` ve öğrenci RPC'leri kullanılır; kayıt, hesap, RLS, veri veya yetki silinmez.

## Doğrulama sınırları
- Canlı şema salt okunur kontrol edildi: TV açıklama/reklam başlığı alanları nullable, mevcut ekleme tetikleyicileri onay/ücret durumunu yönetir.
- Çağrı noktaları kontrol edildi: TV görüntüsü ve işletme ön izlemesi yeni kasa geometrisini kullanır; otomatik akış eski beğeni/kayıt/paylaşım aksiyonlarına bağlı değildir.
- Bu oturumda native cihaz veya derleme testi çalıştırılmadı. Cihaz kontrol listesi: 320/375/414 px ve tablet/yatay yön; 4 saniye döngü; hızlı ileri/geri dokunuş; manuel geçişten sonra yeni süre; ilk/son yayın sarmalama; sekme/arka plan temizliği; boş/tek yayın; doğru işletme profili; açıklamasız TV gönderimi; normal Gönderi açıklamasının korunması; LED ve azaltılmış hareket.
