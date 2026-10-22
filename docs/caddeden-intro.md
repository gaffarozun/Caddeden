# Caddeden açılışı

- Turuncu–hardal paletinde, iki yanında kafeler olan yokuş aşağı bir cadde; bir geliş ve bir gidiş şeridi.
- Yerel `assets/images/caddeden-intro-street.webp` illüstrasyonu `expo-image` ile gösterilir. Hafif kamera yaklaşması, yükselerek beliren Caddeden adı ve kısa kapanış geçişi vardır.
- Toplam süre 1.700 ms; çıkış geçişi 240 ms. Fotoğraf yüklenmesi, tema tercihi veya ağ yanıtı bu süreyi uzatmaz.
- Animasyon kök navigatörün üzerinde çalışır. Oturum, roller, işletme onayı ve yönlendirmeler altta yüklenmeye devam eder; rotalar değiştirilmez.
- Sekme değişimi, giriş/çıkış ve uygulamayı arka plandan öne getirme tekrar oynatmaz. Yeni kök uygulama oturumunda yeniden gösterilir.
- Hareketi azalt erişilebilirlik ayarı açıksa sabit görsel ve başlık gösterilir; kamera ve giriş/çıkış hareketleri kullanılmaz.
- Çentik güvenli alanları, yatay ekran ve 960 px içerik sınırından bağımsız tam ekran açılış desteklenir. Animasyon bitince zamanlayıcılar ve dinleyiciler temizlenir.
- Uygulamanın Expo görünen adı Caddeden, yerel başlangıç arka planı aynı hardal rengi yapılmıştır. Bu yerel yapılandırma değişiklikleri yeni iOS/Android derlemesinde görünür.

## Manuel kontrol

1. Soğuk açılış: cadde, iki yönlü yol, kafeler ve Caddeden başlığını kontrol et; yaklaşık 1,7 saniyede normal ekran açılmalı.
2. Giriş yapmış kullanıcı, işletme ve onay bekleyen işletmede mevcut hedef ekran korunmalı.
3. Sekmeler arasında gez; arka plana alıp geri dön. Açılış tekrarlanmamalı.
4. Hareketi azalt açıkken sabit açılış gösterilmeli.
5. 320 px telefon, yatay telefon ve tablette başlık kesilmemeli, güvenli alanlar korunmalı.
6. Yavaş veya kapalı ağda açılış uzamamalı; mevcut oturum/tema yükleme durumu kendi normal akışında sürmeli.

Gerçek cihaz kontrolleri bu geliştirme turunda çalıştırılmadı.
