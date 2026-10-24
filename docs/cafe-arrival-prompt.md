# Tüm işletmelerde 40 m konum onayı

- Varsayılan uygulama teması Açık; hesabın açıkça seçtiği diğer tema korunur. Kampanya bandı ve işletme başvuru ekranı seçili paletin surface/primary/text tokenlarını kullanır. İşletme → Paylaşımlar → Kampanyalar veya işletme sayfası yönetiminden başvuru yapılır.
- Kampanyalar mevcut ücretli paket, manuel ödeme doğrulaması ve yönetici onayıyla yayınlanır. Bu geliştirme tarihinde aktif content_campaign paketi yoktu: yönetici Reklam Paketleri bölümünden pozitif fiyatlı, süreli paket oluşturmalıdır. Rastgele fiyat veya ücretsiz yayın eklenmedi.
- Tüm işletme kategorileri desteklenir. Mevcut işletme tercihi otomatik açılmaz. Yetkili işletme sahibi sosyal katılımı ve masa planı/tahmini doluluğu ayrı ayrı açar.
- Uygulama ön planda, aktif müşteri hesabı ve uygulamaya verilmiş konum izniyle 20 saniyede bir yakınlık kontrolü yapar. Cihaz GPS'inin açık olması uygulama izninin verildiği anlamına gelmez. Profil → Konumu kontrol et izni ister ve bulutu yeniden gösterir.
- İşletme onaylı/yayında, kayıtlı koordinatları bulunmalı ve katılım seçeneklerinden en az biri açık olmalıdır. Mesafe **40 metreden az** olmalı; GPS hassasiyeti bağımsız olarak en fazla 20 m, ölçüm yaşı en fazla 60 saniyedir. 40 m sınırının kendisi kabul edilmez.
- “Bu işletmede misiniz?” bulutu yalnızca öneridir. Evet, buradayım ile yeni GPS ölçümü alınır ve aynı sunucu kuralıyla katılım doğrulanır. Hayır seçilirse bu oturumda 30 dakika ertelenir; manuel konum kontrolü ertelemeyi temizler.
- Bulut gelmezse veya reddedilirse işletme sayfası → Doluluk ve Mekândakiler → Buradayım · Konumla doğrula kullanılabilir. Aktif katılımda bölüm otomatik açılır; masa planı, tahmini doluluk, kişiler ve istekler birlikte görünür.
- Tahmini doluluk = onaylı aktif katılımcılar / işletmenin kaydettiği masa kapasitesi; yüzde 100 ile sınırlanır. Fiziksel doluluğun kesin ölçümü değildir. Gizli profiller de sayılır. Kapasite yoksa yüzde uydurulmaz. Yüzde ve masa düzeni müşteri katılımını onaylamadan açılmaz; yetkili işletme planını önizleyebilir.
- Katılım 5 dakika sürer; güncel konumla kullanıcı yeniler. Uygulama arka planda GPS toplamaz, müşteri koordinatları veritabanına veya loglara kaydedilmez. Cihaz GPS'i kriptografik fiziksel bulunma kanıtı değildir; iç mekânda hassasiyet yetersiz olabilir.

## Gizlilik
- Profil → Hesap Bilgilerim veya Mekândakiler bölümünden genel profil paylaşımı kapatılabilir. Kapalıysa isim ve fotoğraf hiçbir mekânda paylaşılmaz; kişi yalnızca Kullanıcı olarak kalır. Tekrar açmak bu girişteki görünürlüğü otomatik açmaz; ayrıca Göster seçilir.
- Her yeni girişte görünürlük gizli başlar. Göster seçilirse ilk ad, soyad baş harfi ve *** (ör. Ayşe Y***) ile özel profil fotoğrafı aynı mekândaki katılımcılara sunulur. Gizli kişiler de diğer kullanıcıları görebilir.
- Instagram izni reddedilince alıcı, istek gönderen kişiye 7 gün boyunca yalnızca Kullanıcı olarak görünür: ad, fotoğraf ve Instagram düğmesi yoktur. Yeni istek de engellenir. Diğer kişiler etkilenmez. Önceki ret kayıtlarına da karar tarihinden 7 gün hesabı uygulanır; veri geçmişi yeniden yazılmaz.
- Gönderilen farklı kişi sayısı gönderenin Instagram görme istekleri bölümünde ve alıcıya gelen istekte gösterilir. Aynı kişiye tekrarlanan gönderim farklı kişi sayısını artırmaz. Sayı sunucudaki mevcut istek geçmişinden hesaplanır; diğer alıcıların isimleri/ağ bilgileri paylaşılmaz.

## Doğrulama
- Sunucuda salt okunur regresyon: 40 m/20 m hassasiyet sözleşmesi, 7 gün ret, soyad sansürü, anonim çıktı, uzaktan erişim, RLS, masa JSON taşıma ve farklı alıcı sayıları kontrol edildi.
- Gerçek cihazda izin reddi, 39/40/41 m, bulut reddinden sonra sayfadan doğrulama, masa ekle/kaydet/aç/kapat, iki müşteriyle gizli/görünür isim-fotoğraf, ret ve bir hafta sonu ayrıca test edilmelidir. Live Preview gerçek GPS ve cihaz izinlerini doğrulamış sayılmaz.
