# Kafe özellikleri demo önizlemesi

Keşfet ekranındaki **Kafe özelliklerini dene** bölümünden **Fincan Kahve** veya **Meydan Kahvecisi** açılır. Mevcut demo işletmelerin sayfalarında masa planı, örnek doluluk, kurgusal katılımcılar ve Instagram istekleri görünür.

- Fincan Kahve: 24 kişilik kapasite, 15 örnek katılımcı (%63).
- Meydan Kahvecisi: 32 kişilik kapasite, 24 örnek katılımcı (%75).
- Başlangıçta konumla katılmanın sonrasını gösteren açıkça etiketlenmiş bir önizleme açılır. Demo kullanıcı fotoğrafı varsayılan olarak gizlidir.
- İstek gönderme, karşı tarafın kabulünü/reddini canlandırma, gelen isteğe izin verme/reddetme, fotoğraf görünürlüğünü değiştirme ve demo katılımından ayrılma denenebilir.
- Reddedilen örnek kişinin fotoğrafı 72 saatlik yerel süreyle gizlenir. **Demoyu sıfırla** tüm örnek seçimleri geri alır.
- İzinli profil yalnızca uygulama içi örnek penceresi açar. Gerçek bir Instagram hesabına yönlendirme veya mesaj gönderimi yapılmaz.
- Veriler uygulama oturumu boyunca ayrı `CafeDemoProvider` içinde tutulur; cihaz depolamasına, veritabanına veya özel fotoğraf deposuna yazılmaz.
- Demo konum izni istemez. Gerçek kafelerin konum doğrulaması, gizlilik tercihleri, istekleri ve 3 günlük kısıtları değişmez. Demo hiçbir cafe RPC'sini çağırmaz.

Saf veri/işlem kontrolleri: `tests/cafeDemoChecks.ts` → `checkCafeDemos()`. Bu geliştirme ortamında TypeScript test çalıştırıcısı bulunmadığından bu kontroller burada çalıştırılmamıştır.
