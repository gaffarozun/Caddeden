# Kafe katılımında fotoğraf gizliliği

## Kullanım
- Kafe sahibi İşletme Sayfam bölümünden kafe katılımını isteğe bağlı açar. Kafe kategorisi ve kayıtlı konum gerekir; müşterilere yalnızca onaylı/yayındaki kafelerde görünür.
- Müşteri işletme profilindeki Kafedeyim kartında her yeni katılımda Göster veya Gizle seçmeden katılamaz. Önceden verilen görünürlük izni yeni katılım için otomatik kullanılmaz.
- Katılan kişi kendi profilinden veya işletme sayfasından fotoğrafını gizleyebilir/gösterebilir ve kafeden ayrılabilir. Gizli katılımcılar sayıya dahildir, fotoğraf listesine dahil değildir.
- Hesap Bilgilerim bölümünden kare profil fotoğrafı yüklenir. Kendi profilinde gizliyken de görünür.
- Konum izni önceden verilmişse uygulama ön plandayken 20 metreden yakın uygun kafe için onay bulutu gelebilir. Fotoğraf varsayılan olarak gizlidir, Göster/Gizle tercihi onayla uygulanır. Reddetmek işletme sayfasından konumla katılmayı engellemez. Ayrıntılar: docs/cafe-arrival-prompt.md.
- Katılım 5 dakikalık bir süredir; devam etmek isteyen müşteri konumuyla açıkça yeniler. Arka plan konumu kullanılmaz, otomatik katılım yoktur.

## Sunucu ve gizlilik
- Yeni tablolar: cafe_rooms, cafe_visits, cafe_profile_photos. Eski user_profiles/avatar_url verileri ve mevcut hesap/işletme yetkileri değiştirilmedi.
- Konumun tazeliği (60 sn), hassasiyeti (en fazla 20 m) ve işletmeye mesafesi (20 metreden az) RPC içinde doğrulanır. Ham müşteri koordinatları saklanmaz. Cihazın bildirdiği GPS koordinatı kriptografik bulunma kanıtı değildir; yanlış GPS veya komşu işletme riski vardır.
- Fotoğraflar 512x512 JPEG, en fazla 1 MB, özel cafe-profile-photos bucket içinde saklanır. Doğrudan herkese açık URL veya imzalı fotoğraf bağlantısı üretilmez.
- Storage SELECT kuralı her indirmede iki kişinin aynı aktif kafede bulunmasını, hedefin fotoğraf gösterme iznini, hesapların aktif olmasını ve kafenin açık katılımını denetler. İşletme/yönetici rolü katılımcı fotoğraflarına ek erişim sağlamaz.
- Fotoğraf meta tablosu doğrudan yalnızca sahibine okunur. Gösterilmeyen fotoğraf yolu katılımcı API yanıtına konmaz; e-posta, soyad, telefon, kesin konum veya Instagram bilgisi sunulmaz.
- Katılım ve diğer katılımcılar 10 saniyelik polling ile güncellenir. Ayrılma ve yerel süre dolması kendi ekranında listeyi temizler. Yetki/indirme hatasında fotoğraf gösterilmez. expo-image cachePolicy="none"; indirilen fotoğraf verisi yalnızca bellekte tutulur.
- Gizleme yeni indirmeleri hemen engeller. Daha önce indirilmiş/görülmüş görüntüyü veya ekran görüntüsünü geri almak mümkün değildir. Diğer cihazdaki mevcut görüntü sonraki başarılı polling turunda kaldırılır; kesintili bağlantıda garanti edilen anlık geri çekme yoktur.

## Kapsam
Bu değişiklik per-katılım fotoğraf görünürlüğü, özel profil fotoğrafı yükleme ve bunu kullanmak için temel isteğe bağlı kafe katılımını içerir. Masa planı ve Instagram erişim istekleri bu değişikliğin parçası değildir. Katılımcı sayısı gerçek kafe doluluğu olarak sunulmaz.

## Doğrulama
- supabase/tests/cafe_photo_privacy_read_only.sql: salt-okunur yetki/RLS kontrolü.
- tests/cafePhotoPrivacyChecks.ts: süre ve veri modeli kontrolü (bir test yürütücüsünden çağrılabilir).
- İki gerçek müşteri hesabıyla aynı kafeye katılım, Gizle/Göster, ayrılma, 5 dk sona erme, kafe sahibi kapatma, farklı kafedeki kullanıcıdan indirme reddi ve yeniden girişte seçimin boş kalması cihazda test edilmelidir.
