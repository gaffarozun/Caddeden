# Canlı mekân katılımı ve herkese açık doluluk

- Konumu kayıtlı, onaylı ve yayındaki tüm işletmelerde katılım otomatik açıktır. İşletme kullanıcı erişimini kapatamaz; her müşteri kendi ad/fotoğraf görünürlüğünü seçer.
- Giriş açık bir onayla yapılır: 40 metreden yakınlık, en fazla 20 m GPS hassasiyeti ve güncel ölçüm gerekir. Yakınlık bulutu veya işletme → Doluluk ve Mekândakiler → Konumla doğrula aynı sunucu sözleşmesini kullanır.
- Uygulama ön plandayken mevcut katılım yaklaşık 10 saniyede bir güncel GPS ile kontrol edilir. Mesafe 40 m üstüne çıktığında sunucu katılımı sonlandırır; kişi doluluktan ve profil listesinden çıkar. GPS koordinatları kalıcı olarak saklanmaz.
- Kalp atışı yalnızca mevcut, süresi dolmamış bir katılımı 90 saniye uzatır; biten katılımı otomatik başlatmaz. Konum/bağlantı kaybında yenileme yapılmaz ve süre dolar. Arka planda veya uygulama kapalıyken GPS takibi yoktur: anlık çıkış garanti edilemez; son başarılı doğrulamadan en geç 90 saniye sonra sunucu sayımları ve erişimden düşer. Yeniden giriş için onay gerekir.
- Doluluk yüzdesi ve anonim kadın/erkek/eğitim oranları uzaktaki kullanıcılar dahil herkese açıktır. Profil listesi ve fotoğraf indirmeleri yalnızca aynı mekânda geçerli katılımı olan ve Instagram kullanıcı adını eklemiş müşteri için açılır. İşletme sahibi olmak uzaktan kullanıcı profillerine erişim sağlamaz.
- Doluluk = aktif konumla katılan müşteri / kaydedilmiş masa kapasitesi, en fazla yüzde 100. Kapasite/doluluk ayarı yoksa yüzde uydurulmaz. Gerçek fiziksel ziyaretçi sayısı değildir. Gizli profiller de sayılır; masa çizimi müşterilere gösterilmez.
- Kadın, erkek ve cinsiyet belirtilmemiş oranlarının paydası tüm aktif katılımcılardır. Aktif öğrenci, üniversite öğrencisi, mezun/okumuyor ve eğitim belirtilmemiş oranları beyana dayanır; üniversite oranı aktif öğrenci oranının alt kümesidir. Sıfır katılımcıda oran gösterilmez.
- Profil → Hesap Bilgilerim → Eğitim bilgilerim: lise, ön lisans, lisans, yüksek lisans, doktora, mezun veya okumuyorum; aktif öğrenci okulunu girer. Okul adı yalnızca görünür yerel profilde paylaşılır. Gizli/ret nedeniyle anonim kişilerde ad, fotoğraf ve eğitim bilgileri yoktur.
- Yerel görünür profilde ad + soyad baş harfi ve yıldızlar kullanılır. Fotoğraf/ad alanına basıldığında fotoğraf büyür; erişim sonlanınca modal ve fotoğraf temizlenir. Fotoğraflar özel Storage üzerinden izin denetimli indirilir, yeniden kullanılabilir açık URL oluşturulmaz.
- Instagram göndermek/onaylamak için iki tarafın da kullanıcı adı gerekir. Bir kabul iki tarafa da erişim verir. İki taraf da İzni kaldır ile erişimi sonlandırabilir; ret sonrası bir hafta anonimlik korunur. Gönderilen farklı kişi sayısı gönderende ve alıcının gelen isteğinde görünür.

## Bildirimler ve siparişler
- Keşfet başlığının sağındaki yuvarlak zil, okunmamış sipariş ve Instagram bildirimlerini gösterir. Sipariş mesajları ve Instagram olayları bildirim geçmişinde kalır; okumak silmez. Bulutu kapatmak Instagram kutusu bildirimini otomatik okundu yapmaz.
- Sipariş durum bulutları mevcut akışta korunur. Instagram bulutu, sipariş/değerlendirme/yakınlık bulutu yokken görünür. Kutudaki kartı açmak okundu olarak işaretler; Instagram erişimi hâlâ yerel konum ve izin kontrolüne tabidir.
- Yeni siparişler sunucudaki Istanbul çalışma saatleri ve manuel açık/kapalı durumuyla denetlenir. Kapalı işletmede doğrudan API çağrısı da reddedilir; mevcut siparişin durumunu ilerletmek engellenmez.

## Doğrulama
Salt okunur SQL kontrolleri: uzaktan anonim doluluk, yerel olmayan/Instagram eklemeyen kullanıcıya boş profil listesi, anonim eğitim/fotoğraf maskesi, inbox RLS/işlem yetkileri ve RPC yüklenmesi. Gerçek cihazda GPS hassasiyeti, 39/40/41 m, arka plana geçiş, iki taraflı izin kaldırma, fotoğraf temizlenmesi, bildirim geçişleri ve kapanış saatleri ayrıca test edilmelidir.
