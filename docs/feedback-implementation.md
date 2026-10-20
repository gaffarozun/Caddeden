# Caddeden müşteri deneyimleri ve hesap silme

## Uygulanan kapsam

- Mevcut OnSpace Cloud, kullanıcı/işletme kimlik doğrulaması ve ana yönetici korunmuştur. Yönetici e-postası, mevcut rol sistemi ve `admin-api` kimlik doğrulama akışı değiştirilmemiştir.
- Gerçek işletmelerin profilinde müşteri deneyimleri ve üç otomatik öne çıkan alan; ayrı değerlendirme/öneri/özel şikâyet ekranı.
- Müşteri–işletme başına benzersiz, 1–5 yıldızlı değerlendirme. Yorum isteğe bağlıdır; kendi yorumunu düzenleme ve görünürlükten kaldırma vardır. Yorum tarihleri ve puana göre sıralama bulunur. Yorumlar 20'li sayfalarda görüntülenir.
- İlk değerlendirme ve her düzenleme `pending` olur. Yalnızca yönetici tarafından yayımlanmış değerlendirmeler ortalamaya katılır. Mevcut `businesses.rating/review_count` değerleri silinmemiştir; yeni gerçek ortalama, uygulamada sunucunun `feedback_ratings` sonucundan alınır. Feedback servisine erişilemezse eski keşif verisi korunur ve deneyim paneli hata gösterir.
- İşletme sahibi yalnızca kendi işletmesinin yayımlanmış yorum/önerilerine cevap verebilir. Cevaplar da incelemeye alınır. İşletme hesapları ve başka işletmenin sahibi olan eski müşteri hesapları müşteri değerlendirmesi oluşturamaz; kontrol yalnızca istemci rolüne dayanmaz.
- İstenen 7 işletme şikâyet kategorisi; yorum/öneri/işletme cevabı için uygunsuz içerik, spam ve kişisel bilgi bildirimleri.
- Şikâyet açıklamaları ve kimlikler public RPC'de yer almaz. Kanıt fotoğrafları özel, 5 MB sınırına sahip Storage alanına yüklenir. Yönetici görüntüleme bağlantıları 60 saniyeliktir, görüntüleyici disk önbelleği kullanmaz.
- Öneriler işletme + standart konu bazında birleştirilir. Tek kullanıcı aynı öneriye bir aktif destek verebilir veya desteğini geri çekebilir. Destek sayısı ve sıralama sunucuda hesaplanır.
- En beğenilen özellik: yayımlanmış 4–5 puanlardan konu başına en az 3 farklı müşteri. En çok bildirilen konu: açık/incelenen/sonuçlanan bildirimlerde konu başına en az 3 farklı aktif bildiren. En çok talep: yayımlanmış önerilerde en az 3 farklı aktif destekleyen. Bu üç hesap birbirinden ayrıdır. Şikâyetler doğrulanmış bulgu olarak sunulmaz.
- Yeni yönetici ekranında yorumlar, şikâyetler, öneriler, işletme özeti ve yarım kalan hesap silme işlemleri yer alır. Yayımlama/gizleme/durum değişiklikleri en az 5 karakterlik gerekçeyle, `admin_logs` kaydıyla aynı transaction içinde uygulanır.
- Eski `/admin/complaints` bağlantısı korunur ve yeni gerekçeli şikâyet ekranına yönlenir.
- Ortak FeedbackProvider değişiklikleri ekranlar arasında paylaşır. Aktif uygulamada 30 saniyelik polling ve öne gelişte yenileme kullanılır; Realtime kullanılmaz.

## Güvenlik ve veri bütünlüğü

Yeni tablolar: `business_reviews`, `business_suggestions`, `suggestion_supports`. Bunlara ek olarak yalnızca iki teknik tablo oluşturuldu: transaction-kilitli hız sayaçları için `feedback_rate_limits`, yarım kalan kalıcı hesap silmelerini takip etmek için `account_deletion_requests`.

Mevcut `complaints` tablosuna yalnızca `feedback_category`, `evidence_path`, `resolution_note`, `updated_at` eklendi. Mevcut satırlar silinmedi, şikâyet ve onay durumları sıfırlanmadı. Yeni tabloların tamamında RLS açıktır. Anonim/oturumlu istemcilerin yeni tablolara doğrudan yazma yetkisi yoktur; `feedback_write` doğrulanmış işlem yoludur.

Sunucu, doğrulanmış e-postayı, aktif hesabı, kısıtlama süresini ve işletme sahipliğini denetler. Kabul edilmiş yazma işlemlerinde saatlik 30 işlem, 10 saniyede 1 yazma, günlük 3 şikâyet ve 7 gün içinde aynı kullanıcı/hedef/kategori tekrarı sınırları vardır. Limit satırları transaction kilidiyle korunur. Yeni şikâyetlerde doğrudan tablo INSERT'i de aynı doğrulama tetikleyicisinden geçer.

Sahte hesapları tamamen engelleme garantisi yoktur. Benzersiz değerlendirme/destek, doğrulanmış e-posta, moderasyon ve hız sınırları kötüye kullanımı azaltır; koordineli gerçek kişi/sahte hesap saldırıları için operasyonel inceleme hâlâ gerekir. Başarısız/geri alınmış transaction'lar hız sayaçlarını artırmaz; ağ seviyesindeki kötü niyetli trafik ayrıca platform katmanında kontrol edilmelidir.

Tüm security-definer fonksiyonların search_path'i sabittir; anonim public erişim yalnızca kişisel alanları içermeyen okuma projeksiyonlarına verilir. Silme/temizleme RPC'leri yalnızca service_role tarafından çalıştırılır. Service rolü istemciye taşınmamıştır.

## Hesap silme politikasının gerçek kapsamı

Kullanıcı Profil → Ayarlar → Hesabımı Sil üzerinden mevcut şifre + `HESABIMI SİL` + son onayla kendi hesabını silebilir. Ana yönetici bu akış dışında tutulur. Son onay verilmeden mevcut hesaplarda veri değişikliği gerçekleşmez.

1. Sunucuda şifre yeniden doğrulanır. Hedef id istemciden alınmaz; oturumdan türetilir.
2. İşlem isteği kilitlenir. Aynı anda ikinci silme başlamaz. Hatalı işlem yeniden devam ettirilebilir; işlemde görünen istekler en az 15 dakika sonra devam ettirilebilir.
3. Kullanıcının özel şikâyet kanıt dosyaları kaldırılır.
4. Kişisel profil alanları, kendi müşteri sipariş/rezervasyon iletişim alanları ve sipariş notları temizlenir. Kendi yorumları görünürlükten çıkarılır ve metinleri temizlenir; destekleri pasifleştirilir; şikâyet açıklamaları temizlenir. Kendi işletme cevapları kaldırılır.
5. Sahip olunan işletmeler yayından kaldırılır; telefon/e-posta temizlenir. İşletme, reklam, ödeme ve onay kayıtları korunur.
6. Auth `deleteUser(id, true)` ile **soft deletion** kullanılır. Hard delete/FK cascade kullanılmaz. Metadata-sync tetikleyicisi sonrasında kişisel alanlar tekrar aynı idempotent temizlemeden geçer.
7. İstek ancak tüm adımlar başarılıysa completed olur. Hata olduğunda failed görünür; yönetici yalnızca daha önce sahibi tarafından doğrulanmış isteği devam ettirebilir.
8. Cihaz oturumu ve yerel kayıtlar temizlenir.

Teknik id/ilişkiler korunur. Bu nedenle uygulanan işlem, giriş hesabının kalıcı kapanması ve bilinen kişisel alanların temizlenmesidir; bütün geçmişin geri döndürülemez anonimleştirildiği iddiası değildir. İşletme adı/adresi/medyası, kuponlar, işlem kalemleri ve hukuken gerekli tarih/tutar/durum kayıtları korunabilir. Önceki serbest metinler ve üçüncü taraf kayıtları için daha geniş bir hukuki/operasyonel veri envanteri gerekebilir. Saklama süresi henüz kullanıcı tarafından belirlenmediği için otomatik toplu veri imhası veya süreli silme görevi eklenmemiştir.

Aktif ya da eski JWT ile silinmiş hesabın tablo yazımlarını sürdürmesini önlemek için yeni kapalı-hesap tetikleyicileri eklendi. `user_profiles` ve `businesses` için istemciden doğrudan DELETE, ilişkili işlem kayıtlarını cascade ile yok etmemesi için engellenir. Hesap silme yalnızca güvenli akışta gerçekleşir. Hiçbir mevcut yönetici hesabı silinmedi/kısıtlanmadı veya rolü değiştirilmedi.

## Gerçekten gerçekleştirilen kontroller

- Salt okunur başlangıç ve son karşılaştırması: **4 profil, 11 işletme, 2 şikâyet, 1 yönetici** korundu. Yeni değerlendirme/öneri/silme isteği sayıları sıfırdır; gerçek hesap üzerinde silme veya moderasyon testi yapılmadı.
- Yeni 5 tabloda RLS etkinliği kontrol edildi.
- Anonim rolün yazma RPC'si yetkisi olmadığı; authenticated rolün doğrudan review INSERT ve hesap temizleme RPC'si yetkisi olmadığı doğrulandı.
- Benzersiz değerlendirme ve destek kısıtları, yeni şikâyet guard'ı ve kapalı-hesap guard'ı katalogdan doğrulandı.
- Kimliksiz actor/admin çağrısı ve erişilemez işletmenin public okuması 42501 ile reddedildi. Bu testler gerçek kullanıcı verisi değiştirmeyen okuma yardımcılarını kullandı.
- SQL fixture hesaplaması: 5,3,4 → ortalama 4; 3 değerlendirme; tekrar eden 1,1,2,3 destekleri → 3 farklı kişi; 2 kişinin 3 kişilik eşiğin altında olması doğrulandı.
- Kontrol anında PostgreSQL hata kayıtlarında hata görülmedi. Bu, cihaz veya uçtan uca test yapıldığı anlamına gelmez.
- Test/yeniden kontrol sorguları `supabase/tests/feedback_read_only_checks.sql` dosyasındadır.

**Doğrulanmamış:** Bu oturumda Expo/TypeScript build komutu, iOS/Android cihaz testi, gerçek müşteri/işletme/yönetici oturumlarıyla uçtan uca RPC testi, Storage yükleme testi veya `feedback-api` dağıtımı sonrası invocation testi çalıştırılmadı. Bunlar tamamlandı olarak raporlanmaz. Veritabanı yedeği alındığı iddia edilmez; mevcut verileri temizleyen migration veya gerçek hesap silme işlemi uygulanmadı.

## Zorunlu kabul testi senaryoları

Gerçek üretim hesaplarını test verisi olarak silmeyin. Ayrı kontrollü test hesaplarıyla:

| Senaryo | Beklenen sonuç | Durum |
|---|---|---|
| Mevcut kullanıcı/işletme/ana yönetici giriş ve OTP kayıt | Mevcut akışlar çalışır, rol değişmez | Cihazda bekliyor |
| Müşteri 1–5 puan gönderir/günceller | Tek kayıt; pending; admin yayımlayınca ortalama/sayı güncellenir | Uçtan uca bekliyor |
| 0/6 puan veya başka kullanıcı adına doğrudan yazma | Reddedilir, veri değişmez | Rol izinleri doğrulandı; gerçek JWT bekliyor |
| Kullanıcı kendi yorumunu siler | Yorum ve puan public ortalamadan çıkar | Test hesabıyla bekliyor |
| İşletme başka işletmeye cevap yazar / puan verir | Sunucuda reddedilir | Gerçek JWT bekliyor |
| İşletme kendi yorumuna cevap verir | Pending cevap; yönetici yayımlayana kadar public değildir | Bekliyor |
| Anonim/normal kullanıcı moderasyon | 42501/403; kayıt değişmez | Kimliksiz okuma denetimi doğrulandı; normal JWT bekliyor |
| Aynı öneriye tekrar destek/geri çekme | Tek benzersiz destek, gerçek sayı/sıra | Constraint doğrulandı; uçtan uca bekliyor |
| Aynı şikâyeti 7 günde tekrar / günlük dördüncü | Sunucuda reddedilir | Bekliyor |
| Şikâyet kimlik/kanıt public sorgusu | Public projeksiyonda kişisel alan yok; özel kanıt yetkisiz erişilemez | RLS/izin doğrulandı; Storage bekliyor |
| Admin şikâyet sonucu/gizleme | Gerekçe + tarih/işlem türü logu aynı transaction | Bekliyor |
| 2 vs 3 farklı katılımcı ve eşit destek | Eşik doğru, sıralama deterministik, şikâyet iddia olarak gösterilir | SQL fixture doğrulandı; çok hesap bekliyor |
| Test hesabı silme, aynı anda iki istek, hata/tekrar | Profil/işlem kişisel alanları temizlenir; işlem satırları korunur; job tamamlanır veya failed | Yıkıcı test yapılmadı |
| Yönetici hesabını silme | Hem UI hem sunucuda reddedilir | Kod/rol denetimi; gerçek JWT bekliyor |
| Sipariş/minimum tutar/randevu/menu/reklam/onay akışları | Eski çalışan özellikler korunur | Regression cihaz testi bekliyor |
| 320px, tablet ve yatay görünüm, klavye | Ekranlar kayar; eylemler ve geri dönüş erişilebilir | Cihaz testi bekliyor |

## Değişen/eklenen dosyalar

- `app/_layout.tsx`, `app/index.tsx`
- `app/(tabs)/profile.tsx`
- `app/business/[id].tsx`, `app/business/manage/[id].tsx`, `app/business/feedback/[id].tsx`
- `app/account-delete.tsx`
- `app/admin/_layout.tsx`, `app/admin/index.tsx`, `app/admin/complaints.tsx`, `app/admin/feedback.tsx`
- `contexts/AppContext.tsx`, `contexts/FeedbackContext.tsx`
- `hooks/useFeedback.ts`, `hooks/useBusinessFeedback.ts`, `hooks/useFeedbackReply.ts`, `hooks/useFeedbackAdmin.ts`, `hooks/useAccountDeletion.ts`
- `services/feedbackService.ts`, `services/businessService.ts`
- `constants/feedbackStyles.ts`
- `components/feature/FeedbackControls.tsx`, `BusinessFeedbackSummary.tsx`, `FeedbackReply.tsx`, `FeedbackForm.tsx`
- `supabase/functions/feedback-api/index.ts`
- `supabase/tests/feedback_read_only_checks.sql`, bu rapor

## Güvenli geri çekme

Özellikleri geri çekmek gerekirse önce yeni ekran bağlantılarını/FeedbackProvider'ı kaldırın ve yeni RPC execute izinlerini kapatın. Tablo DROP, kayıt DELETE, mevcut rol değiştirme veya toplu puan sıfırlama kullanmayın. Yeni veriler oluştuğunda şema/tetikleyici geri alma ancak yedek ve ayrı onayla planlanmalıdır. Yedek, saklama süresi ve hukuki gereklilikler netleşmeden korunan işlem kayıtlarına toplu imha uygulanmamalıdır.
