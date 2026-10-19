// Powered by OnSpace.AI
// Public business page.
// - Ordering is available ONLY for restaurants & markets that have opted in
//   (allow_order). Customers add items to a cart; the order can only be sent
//   once the cart total reaches the business-defined minimum (min_order).
// - Every other business (and opted-out restaurants/markets) shows a clean,
//   minimal product + price list with no ordering controls.
// Orders still require phone + a location within 100 m of the delivery point.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Badge, Button } from '@/components';
import { PhotoViewer } from '@/components/feature/PhotoViewer';
import { fetchBusinessDetail, getBusinessById } from '@/services/businessService';
import { categoryLabel, getSubCategory } from '@/services/categories';
import { getOpenStatus } from '@/services/businessStatus';
import { distanceMeters } from '@/services/geo';
import { Business, MenuItem } from '@/services/types';
import { useTheme } from '@/hooks/useTheme';
import { createReservation, getBusinessOwnerId, placeOrder } from '@/services/businessRequestService';
import { maskFullName } from '@/services/authService';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/hooks/useAuth';
import { useAlert } from '@/template';
import { fontSize, fontWeight, radius, shadow, spacing, ThemeColors } from '@/constants/theme';

const TIMES = ['18:00', '19:00', '20:00', '21:00'];

// Group menu items under the business-defined headings (group_name). Items with
// no group fall under a generic "Menü" heading. Order of first appearance kept.
function groupMenu(items: MenuItem[]): { name: string; items: MenuItem[] }[] {
  const order: string[] = [];
  const map: Record<string, MenuItem[]> = {};
  for (const it of items) {
    const key = (it.group && it.group.trim()) || 'Menü';
    if (!map[key]) {
      map[key] = [];
      order.push(key);
    }
    map[key].push(it);
  }
  return order.map((name) => ({ name, items: map[name] }));
}

export default function BusinessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const mockBusiness = getBusinessById(id);
  const isMock = !!mockBusiness;
  const [dbBusiness, setDbBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(!mockBusiness);
  const { user, savedBusinessIds, toggleSaveBusiness } = useApp();
  const { authUser } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isBusinessAccount = authUser?.role === 'business';

  const [guests, setGuests] = useState(2);
  const [time, setTime] = useState(TIMES[1]);
  const [phone, setPhone] = useState('');
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);

  const [isOwner, setIsOwner] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Cart: menuItemId -> quantity.
  const [cart, setCart] = useState<Record<string, number>>({});

  // Order contact modal
  const [contactVisible, setContactVisible] = useState(false);
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [note, setNote] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoCaption, setPhotoCaption] = useState<string | undefined>(undefined);
  const openPhoto = (uri: string, caption?: string) => {
    setPhotoCaption(caption);
    setPhotoUri(uri);
  };

  const tomorrowDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  }, []);
  const tomorrowIso = tomorrowDate.toISOString().slice(0, 10);
  const tomorrowLabel = tomorrowDate.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  useEffect(() => {
    let active = true;
    if (mockBusiness) {
      setLoading(false);
      return;
    }
    (async () => {
      const b = await fetchBusinessDetail(id);
      if (active) {
        setDbBusiness(b);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, mockBusiness]);

  const reload = useCallback(async () => {
    if (mockBusiness || !id) return;
    const b = await fetchBusinessDetail(id);
    if (b) setDbBusiness(b);
  }, [mockBusiness, id]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authUser || isMock || !id) {
        setIsOwner(false);
        return;
      }
      const owner = await getBusinessOwnerId(id);
      if (active) setIsOwner(owner === authUser.id);
    })();
    return () => {
      active = false;
    };
  }, [authUser, isMock, id]);

  // Pre-fill contact & delivery location from the saved profile so the customer
  // does not re-enter them on every order or reservation.
  useEffect(() => {
    if (!authUser) return;
    setPhone((p) => p || authUser.phone || '');
    setAddress((a) => a || authUser.address || '');
    setLat((v) => (v == null && authUser.lat != null ? authUser.lat : v));
    setLng((v) => (v == null && authUser.lng != null ? authUser.lng : v));
  }, [authUser]);

  const business = mockBusiness ?? dbBusiness;

  if (loading) {
    return (
      <View style={styles.missing}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!business) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>İşletme bulunamadı.</Text>
      </View>
    );
  }

  const saved = savedBusinessIds.includes(business.id);
  const sub = getSubCategory(business.category);
  const status = getOpenStatus(business);
  const isService = !!sub?.hasAppointment;
  const showMenu = business.allowMenu ?? !!sub?.hasMenu;
  const showReservation = business.allowReservation ?? !!(sub?.hasReservation || sub?.hasAppointment);
  const bookingMode: 'reservation' | 'appointment' | null = showReservation
    ? isService
      ? 'appointment'
      : 'reservation'
    : null;

  // Ordering is restaurant/market only AND must be enabled by the owner.
  const categorySupportsOrder = !!sub?.hasOrder;
  const orderingEnabled = categorySupportsOrder && (business.allowOrder ?? false);
  const canOrderItems = !isMock && !isOwner && !isBusinessAccount && orderingEnabled && showMenu;
  const minOrder = Math.max(0, business.minOrder ?? 0);

  const menuGroups = groupMenu(business.menu);

  // Cart derived values.
  const cartItems = business.menu
    .map((m) => ({ item: m, qty: cart[m.id] ?? 0 }))
    .filter((ci) => ci.qty > 0);
  const cartTotal = cartItems.reduce((s, ci) => s + ci.item.price * ci.qty, 0);
  const cartCount = cartItems.reduce((s, ci) => s + ci.qty, 0);
  const meetsMin = cartTotal >= minOrder;
  const remaining = Math.max(0, minOrder - cartTotal);
  const showCartBar = canOrderItems && cartCount > 0;

  const addToCart = (itemId: string) => setCart((c) => ({ ...c, [itemId]: (c[itemId] ?? 0) + 1 }));
  const decFromCart = (itemId: string) =>
    setCart((c) => {
      const next = { ...c };
      const q = (next[itemId] ?? 0) - 1;
      if (q <= 0) delete next[itemId];
      else next[itemId] = q;
      return next;
    });

  const requireAuth = (action: () => void) => {
    if (user.type === 'guest') {
      showAlert('Hesap gerekli', 'Bu özelliği kullanmak için giriş yapmalısın.', [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Giriş Yap', onPress: () => router.push('/auth') },
      ]);
      return;
    }
    action();
  };

  const openCartContact = () =>
    requireAuth(() => {
      if (!meetsMin) {
        showAlert(
          'Minimum tutar',
          `Minimum sipariş tutarı ${minOrder} ₺. Sepetine ${remaining} ₺ daha ekle.`,
          [{ text: 'Tamam' }]
        );
        return;
      }
      setContactVisible(true);
    });

  const closeContact = () => setContactVisible(false);

  const useMyLocation = async () => {
    setLocating(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setLocating(false);
      showAlert('Konum izni gerekli', 'Konumunu paylaşmak için izin vermelisin.', [{ text: 'Tamam' }]);
      return;
    }
    try {
      const pos = await Location.getCurrentPositionAsync({});
      setLat(pos.coords.latitude);
      setLng(pos.coords.longitude);
      try {
        const geo = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        const g = geo[0];
        if (g && !address.trim()) {
          const line = [g.street, g.name, g.district, g.city].filter(Boolean).join(' ');
          if (line) setAddress(line);
        }
      } catch {
        // reverse geocode is best-effort
      }
    } catch {
      showAlert('Konum alınamadı', 'Lütfen tekrar dene.', [{ text: 'Tamam' }]);
    }
    setLocating(false);
  };

  const submitOrder = async () => {
    if (!cartItems.length) return;
    if (!meetsMin) {
      showAlert('Minimum tutar', `Minimum sipariş tutarı ${minOrder} ₺. Sepetine ${remaining} ₺ daha ekle.`, [{ text: 'Tamam' }]);
      return;
    }
    if (!phone.trim()) {
      showAlert('Telefon zorunlu', 'İşletmenin sana ulaşabilmesi için telefon numarası gerekli.', [{ text: 'Tamam' }]);
      return;
    }
    if (!address.trim()) {
      showAlert('Konum zorunlu', 'Siparişin ulaştırılabilmesi için adres/konum bilgisi gerekli.', [{ text: 'Tamam' }]);
      return;
    }
    if (lat == null || lng == null) {
      showAlert('Konum zorunlu', 'Sipariş vermek için "Konumumu Kullan" ile konumunu paylaşmalısın.', [{ text: 'Tamam' }]);
      return;
    }

    // Location is mandatory: verify the customer is physically within 100 m of
    // the saved delivery location before allowing the order.
    setSubmittingOrder(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setSubmittingOrder(false);
      showAlert('Konum izni zorunlu', 'Sipariş verebilmek için konum iznini açman gerekiyor.', [{ text: 'Tamam' }]);
      return;
    }
    let current: Location.LocationObject;
    try {
      current = await Location.getCurrentPositionAsync({});
    } catch {
      setSubmittingOrder(false);
      showAlert('Konum alınamadı', 'Mevcut konumun alınamadı. Lütfen tekrar dene.', [{ text: 'Tamam' }]);
      return;
    }
    const dist = distanceMeters(current.coords.latitude, current.coords.longitude, lat, lng);
    if (dist > 100) {
      setSubmittingOrder(false);
      showAlert(
        'Mevcut konuma uzaksınız',
        `Paylaştığın teslimat konumuna ${Math.round(dist)} m uzaktasın. Sipariş verebilmek için "Konumumu Kullan" ile konumunu güncelle (100 m içinde olmalısın).`,
        [{ text: 'Tamam' }]
      );
      return;
    }

    const { error } = await placeOrder({
      business_id: business.id,
      items: cartItems.map((ci) => ({ menu_item_id: ci.item.id, name: ci.item.name, price: ci.item.price, qty: ci.qty })),
      total: cartTotal,
      phone: phone.trim(),
      address: address.trim(),
      lat,
      lng,
      note: note.trim() || null,
      customer_name: maskFullName(authUser?.first_name, authUser?.last_name, authUser?.username ?? user.name),
    });
    setSubmittingOrder(false);
    if (error) {
      showAlert('Gönderilemedi', error, [{ text: 'Tamam' }]);
      return;
    }
    closeContact();
    setCart({});
    setNote('');
    showAlert(
      'Sipariş talebin gönderildi',
      `İşletme onayladığında "Geçmişim" ekranından durumu takip edebilirsin.${business.avgDeliveryMinutes ? ` Ortalama teslim ~${business.avgDeliveryMinutes} dk.` : ''}`,
      [{ text: 'Tamam' }]
    );
  };

  const handleBooking = () =>
    requireAuth(async () => {
      if (!phone.trim()) {
        showAlert('Telefon zorunlu', 'İşletmenin seni araması için telefon numarası gerekli.', [{ text: 'Tamam' }]);
        return;
      }
      if (isMock) {
        showAlert('Demo işletme', 'Bu bir demo işletmedir. Gerçek işletmelerde talep oluşturabilirsin.', [{ text: 'Tamam' }]);
        return;
      }
      setBooking(true);
      const { error } = await createReservation({
        business_id: business.id,
        date: tomorrowIso,
        time,
        guests: bookingMode === 'appointment' ? 1 : guests,
        phone: phone.trim(),
        service_id: bookingMode === 'appointment' ? selectedService : null,
        type: bookingMode === 'appointment' ? 'appointment' : 'reservation',
        customer_name: maskFullName(authUser?.first_name, authUser?.last_name, authUser?.username ?? user.name),
      });
      setBooking(false);
      if (error) {
        showAlert('Gönderilemedi', error, [{ text: 'Tamam' }]);
        return;
      }
      showAlert(
        bookingMode === 'appointment' ? 'Randevu talebin gönderildi' : 'Rezervasyon talebin gönderildi',
        `${tomorrowLabel} · ${time}. İşletme onayı bekleniyor.`,
        [{ text: 'Tamam' }]
      );
    });

  const callBusiness = (phoneNo?: string) => {
    if (!phoneNo) return;
    Linking.openURL(`tel:${phoneNo.replace(/\s/g, '')}`).catch(() =>
      showAlert('Arama başlatılamadı', 'Cihazında telefon uygulaması bulunamadı.', [{ text: 'Tamam' }])
    );
  };

  const openMaps = () => {
    const query = encodeURIComponent(business.address || business.name);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    Linking.openURL(url).catch(() =>
      showAlert('Harita açılamadı', 'Cihazında harita uygulaması bulunamadı.', [{ text: 'Tamam' }])
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: showCartBar ? 140 : spacing.xxxl }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await reload();
              setRefreshing(false);
            }}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.hero}>
          <Image source={{ uri: business.cover }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />
          <LinearGradient colors={['transparent', 'rgba(15,12,10,0.8)']} style={StyleSheet.absoluteFill} />
          {!isBusinessAccount ? (
            <Pressable style={styles.saveBtn} hitSlop={8} onPress={() => toggleSaveBusiness(business.id)}>
              <MaterialCommunityIcons
                name={saved ? 'bookmark' : 'bookmark-outline'}
                size={24}
                color={saved ? colors.primary : colors.white}
              />
            </Pressable>
          ) : null}
          <View style={styles.heroInfo}>
            <View style={styles.heroBadges}>
              <Badge label={categoryLabel(business.category)} tone="dark" />
              <Badge label={status.label} tone={status.open ? 'success' : 'neutral'} />
            </View>
            <Text style={styles.heroName}>{business.name}</Text>
            <View style={styles.heroMeta}>
              <MaterialCommunityIcons name="star" size={16} color={colors.warning} />
              <Text style={styles.heroMetaText}>
                {business.rating.toFixed(1)} ({business.reviewCount}) · {business.distanceKm} km
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.desc}>{business.description}</Text>

          {isOwner ? (
            <View style={styles.ownerCard}>
              <View style={styles.ownerHead}>
                <MaterialCommunityIcons name="shield-account-outline" size={20} color={colors.primaryDark} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.ownerTitle}>Bu senin işletmen</Text>
                  <Text style={styles.ownerSub}>Kendi işletmende müşteri işlemi yapamazsın. Gelen talepleri yönet.</Text>
                </View>
              </View>
              <View style={styles.ownerBtns}>
                <View style={{ flex: 1 }}>
                  <Button label="İşletme Sayfam" icon="store-cog-outline" variant="secondary" onPress={() => router.push(`/business/manage/${business.id}`)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button label="Gelen Talepler" icon="bell-ring-outline" onPress={() => router.push('/business/requests')} />
                </View>
              </View>
            </View>
          ) : null}

          {!isOwner && isBusinessAccount ? (
            <View style={styles.ownerCard}>
              <View style={styles.ownerHead}>
                <MaterialCommunityIcons name="store-alert-outline" size={20} color={colors.primaryDark} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.ownerTitle}>İşletme hesabı</Text>
                  <Text style={styles.ownerSub}>İşletme hesabıyla diğer işletmelere sipariş veya rezervasyon gönderemezsin. Müşteri olarak işlem yapmak için kullanıcı hesabı kullan.</Text>
                </View>
              </View>
            </View>
          ) : null}

          {business.campaign ? (
            <View style={styles.campaignBanner}>
              <View style={styles.campaignLeft}>
                <MaterialCommunityIcons name="sale" size={24} color={colors.primary} />
                <Text style={styles.campaignTitle}>{business.campaign}</Text>
              </View>
            </View>
          ) : null}

          <InfoRow icon="map-marker-outline" text={business.address} onPress={openMaps} actionIcon="directions" />
          <InfoRow icon="clock-outline" text={`Çalışma saatleri: ${business.hours}${status.detail ? ` · ${status.detail}` : ''}`} />
          <InfoRow icon="phone-outline" text={business.phone} onPress={() => callBusiness(business.phone)} actionIcon="phone" />

          <View style={styles.galleryHead}>
            <Text style={styles.sectionTitle}>Fotoğraflar</Text>
            <Text style={styles.galleryHint}>Büyütmek için dokun</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>
            {business.images.map((uri, i) => (
              <Pressable key={i} onPress={() => openPhoto(uri)} style={styles.galleryItem}>
                <Image source={{ uri }} style={styles.galleryImg} contentFit="cover" transition={200} />
                <View style={styles.galleryZoom}>
                  <MaterialCommunityIcons name="magnify-plus-outline" size={14} color={colors.white} />
                </View>
              </Pressable>
            ))}
          </ScrollView>

          {showMenu && business.menu.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>{isService ? 'Hizmetler & Fiyatlar' : 'Menü & Fiyatlar'}</Text>

              {canOrderItems ? (
                <>
                  <Text style={styles.orderHint}>
                    Ürünleri sepete ekle; toplam tutar minimumu geçtiğinde sipariş verebilirsin.
                  </Text>
                  {minOrder > 0 ? (
                    <View style={styles.minRow}>
                      <MaterialCommunityIcons name="cart-percent" size={16} color={colors.primaryDark} />
                      <Text style={styles.minText}>Minimum sipariş tutarı: {minOrder} ₺</Text>
                    </View>
                  ) : null}
                  {business.avgDeliveryMinutes ? (
                    <View style={styles.deliveryRow}>
                      <MaterialCommunityIcons name="bike-fast" size={16} color={colors.primaryDark} />
                      <Text style={styles.deliveryText}>Ortalama teslim süresi ~{business.avgDeliveryMinutes} dk</Text>
                    </View>
                  ) : null}

                  {menuGroups.map((group) => (
                    <View key={group.name} style={styles.menuGroup}>
                      <View style={styles.menuGroupHead}>
                        <Text style={styles.menuGroupTitle}>{group.name}</Text>
                        <Text style={styles.menuGroupCount}>{group.items.length} ürün</Text>
                      </View>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.menuGroupRow}>
                        {group.items.map((item) => {
                          const qty = cart[item.id] ?? 0;
                          return (
                            <View key={item.id} style={styles.prodCard}>
                              <Pressable
                                disabled={!item.image}
                                onPress={() => item.image && openPhoto(item.image, item.name)}
                                style={styles.prodImageWrap}
                              >
                                {item.image ? (
                                  <>
                                    <Image source={{ uri: item.image }} style={styles.prodImage} contentFit="cover" transition={150} />
                                    <View style={styles.prodZoom}>
                                      <MaterialCommunityIcons name="magnify-plus-outline" size={12} color={colors.white} />
                                    </View>
                                  </>
                                ) : (
                                  <View style={styles.prodImageEmpty}>
                                    <MaterialCommunityIcons name="silverware-fork-knife" size={22} color={colors.textFaint} />
                                  </View>
                                )}
                                {item.tag ? (
                                  <View style={styles.prodTag}>
                                    <Text style={styles.prodTagText}>{item.tag}</Text>
                                  </View>
                                ) : null}
                              </Pressable>
                              <Text style={styles.prodName} numberOfLines={2}>{item.name}</Text>
                              <Text style={styles.prodPrice}>{item.price} ₺</Text>
                              {qty > 0 ? (
                                <View style={styles.qtyRow}>
                                  <Pressable style={styles.qtyBtn} hitSlop={6} onPress={() => decFromCart(item.id)}>
                                    <MaterialCommunityIcons name="minus" size={16} color={colors.primary} />
                                  </Pressable>
                                  <Text style={styles.qtyValue}>{qty}</Text>
                                  <Pressable style={styles.qtyBtn} hitSlop={6} onPress={() => addToCart(item.id)}>
                                    <MaterialCommunityIcons name="plus" size={16} color={colors.primary} />
                                  </Pressable>
                                </View>
                              ) : (
                                <Pressable style={styles.addBtn} onPress={() => addToCart(item.id)}>
                                  <MaterialCommunityIcons name="plus" size={14} color={colors.white} />
                                  <Text style={styles.addBtnText}>Ekle</Text>
                                </Pressable>
                              )}
                            </View>
                          );
                        })}
                      </ScrollView>
                    </View>
                  ))}
                </>
              ) : (
                // Minimal, elegant product + price list (no ordering).
                <View style={styles.minimalMenu}>
                  {menuGroups.map((group) => (
                    <View key={group.name} style={styles.minimalGroup}>
                      <View style={styles.minimalGroupHead}>
                        <Text style={styles.minimalGroupTitle}>{group.name}</Text>
                        <Text style={styles.minimalGroupCount}>{group.items.length}</Text>
                      </View>
                      {group.items.map((item, idx) => (
                        <Pressable
                          key={item.id}
                          disabled={!item.image}
                          onPress={() => item.image && openPhoto(item.image, item.name)}
                          style={[styles.minimalRow, idx < group.items.length - 1 && styles.minimalRowBorder]}
                        >
                          {item.image ? (
                            <Image source={{ uri: item.image }} style={styles.minimalThumb} contentFit="cover" transition={150} />
                          ) : null}
                          <View style={styles.minimalInfo}>
                            <Text style={styles.minimalName} numberOfLines={1}>{item.name}</Text>
                            {item.tag ? <Text style={styles.minimalTag}>{item.tag}</Text> : null}
                          </View>
                          <Text style={styles.minimalPrice}>{item.price} ₺</Text>
                        </Pressable>
                      ))}
                    </View>
                  ))}
                </View>
              )}
            </>
          ) : !showMenu ? (
            <View style={styles.noMenu}>
              <MaterialCommunityIcons name="calendar-star" size={20} color={colors.textSubtle} />
              <Text style={styles.noMenuText}>
                Bu işletme fiyat listesi paylaşmıyor. Etkinlik ve duyuruları Gönderiler ile takip edebilirsin.
              </Text>
            </View>
          ) : null}

          {bookingMode && !isOwner && !isBusinessAccount ? (
            <>
              <Text style={styles.sectionTitle}>{bookingMode === 'appointment' ? 'Randevu' : 'Rezervasyon'}</Text>
              <View style={styles.reserveCard}>
                <View style={styles.reserveRow}>
                  <Text style={styles.reserveLabel}>Tarih</Text>
                  <Text style={styles.reserveValue}>{tomorrowLabel}</Text>
                </View>

                {bookingMode === 'reservation' ? (
                  <View style={styles.reserveRow}>
                    <Text style={styles.reserveLabel}>Kişi</Text>
                    <View style={styles.stepper}>
                      <Pressable hitSlop={8} onPress={() => setGuests((g) => Math.max(1, g - 1))}>
                        <MaterialCommunityIcons name="minus-circle-outline" size={26} color={colors.primary} />
                      </Pressable>
                      <Text style={styles.stepperValue}>{guests}</Text>
                      <Pressable hitSlop={8} onPress={() => setGuests((g) => Math.min(12, g + 1))}>
                        <MaterialCommunityIcons name="plus-circle-outline" size={26} color={colors.primary} />
                      </Pressable>
                    </View>
                  </View>
                ) : null}

                {bookingMode === 'appointment' && business.menu.length > 0 ? (
                  <>
                    <Text style={styles.reserveLabel}>Hizmet</Text>
                    <View style={styles.timeRow}>
                      {business.menu.map((m) => {
                        const active = selectedService === m.id;
                        return (
                          <Pressable key={m.id} onPress={() => setSelectedService(m.id)} style={[styles.timeChip, active && styles.timeChipActive]}>
                            <Text style={[styles.timeText, active && { color: colors.white }]}>{m.name}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </>
                ) : null}

                <Text style={styles.reserveLabel}>Saat</Text>
                <View style={styles.timeRow}>
                  {TIMES.map((t) => {
                    const active = t === time;
                    return (
                      <Pressable key={t} onPress={() => setTime(t)} style={[styles.timeChip, active && styles.timeChipActive]}>
                        <Text style={[styles.timeText, active && { color: colors.white }]}>{t}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={styles.reserveLabel}>Telefon (zorunlu)</Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+90 5xx xxx xx xx"
                  placeholderTextColor={colors.textFaint}
                  keyboardType="phone-pad"
                  style={styles.phoneInput}
                  accessibilityLabel="Telefon"
                />

                <Button
                  label={booking ? 'Gönderiliyor...' : bookingMode === 'appointment' ? 'Randevu Talebi Gönder' : 'Rezervasyon Talebi Gönder'}
                  icon="calendar-check"
                  onPress={handleBooking}
                  loading={booking}
                />
              </View>
            </>
          ) : null}
        </View>
      </ScrollView>

      {showCartBar ? (
        <View style={[styles.cartBar, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.cartInfo}>
            <Text style={styles.cartTotal}>{cartTotal} ₺</Text>
            <Text style={styles.cartMeta}>
              {cartCount} ürün{!meetsMin && minOrder > 0 ? ` · ${remaining} ₺ daha ekle` : ''}
            </Text>
          </View>
          <Pressable
            style={[styles.cartBtn, meetsMin ? styles.cartBtnActive : styles.cartBtnLocked]}
            disabled={!meetsMin}
            onPress={openCartContact}
          >
            <MaterialCommunityIcons
              name={meetsMin ? 'cart-check' : 'lock-outline'}
              size={18}
              color={meetsMin ? colors.black : colors.textSubtle}
            />
            <Text style={[styles.cartBtnText, { color: meetsMin ? colors.black : colors.textSubtle }]}>
              {meetsMin ? 'Sipariş Ver' : `Min. ${minOrder} ₺`}
            </Text>
          </Pressable>
        </View>
      ) : null}

      <Modal visible={contactVisible} transparent animationType="slide" onRequestClose={closeContact}>
        <Pressable style={styles.modalOverlay} onPress={closeContact}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Sipariş Bilgileri</Text>

            <View style={styles.cartSummary}>
              {cartItems.map((ci) => (
                <View key={ci.item.id} style={styles.cartSummaryRow}>
                  <Text style={styles.cartSummaryName} numberOfLines={1}>{ci.qty}× {ci.item.name}</Text>
                  <Text style={styles.cartSummaryPrice}>{ci.item.price * ci.qty} ₺</Text>
                </View>
              ))}
              <View style={styles.cartSummaryDivider} />
              <View style={styles.cartSummaryRow}>
                <Text style={styles.cartSummaryTotalLabel}>Toplam</Text>
                <Text style={styles.cartSummaryTotal}>{cartTotal} ₺</Text>
              </View>
            </View>

            {business.avgDeliveryMinutes ? (
              <View style={styles.modalDelivery}>
                <MaterialCommunityIcons name="bike-fast" size={14} color={colors.primaryDark} />
                <Text style={styles.modalDeliveryText}>Ortalama teslim ~{business.avgDeliveryMinutes} dk</Text>
              </View>
            ) : null}
            <View style={styles.modalNote}>
              <MaterialCommunityIcons name="information-outline" size={16} color={colors.textSubtle} />
              <Text style={styles.modalNoteText}>
                Telefon ve konum zorunludur. Sipariş verebilmek için bulunduğun yerin, paylaştığın teslimat konumuna en fazla 100 m mesafede olması gerekir.
              </Text>
            </View>

            <Text style={styles.modalLabel}>Telefon (zorunlu)</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="+90 5xx xxx xx xx"
              placeholderTextColor={colors.textFaint}
              keyboardType="phone-pad"
              style={styles.modalInput}
              accessibilityLabel="Telefon"
            />

            <Text style={styles.modalLabel}>Adres / Konum (zorunlu)</Text>
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="Teslimat adresi veya tarif"
              placeholderTextColor={colors.textFaint}
              style={[styles.modalInput, styles.modalTextArea]}
              multiline
              accessibilityLabel="Adres"
            />

            <Text style={styles.modalLabel}>Sipariş Notu (opsiyonel)</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Örn. kapı zilini çalma, acı sos olmasın"
              placeholderTextColor={colors.textFaint}
              style={[styles.modalInput, styles.modalTextArea]}
              multiline
              accessibilityLabel="Sipariş notu"
            />

            <Button
              label={locating ? 'Konum alınıyor...' : lat != null ? 'Konum eklendi ✓' : 'Konumumu Kullan'}
              icon="crosshairs-gps"
              variant="secondary"
              onPress={useMyLocation}
              loading={locating}
            />

            <View style={{ height: spacing.sm }} />
            <Button
              label={submittingOrder ? 'Gönderiliyor...' : `Sipariş Talebi Gönder · ${cartTotal} ₺`}
              icon="send"
              onPress={submitOrder}
              loading={submittingOrder}
            />
            <Pressable style={styles.modalCancel} onPress={closeContact}>
              <Text style={styles.modalCancelText}>Vazgeç</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <PhotoViewer visible={!!photoUri} uri={photoUri} caption={photoCaption} onClose={() => setPhotoUri(null)} />
    </View>
  );
}

function InfoRow({
  icon,
  text,
  onPress,
  actionIcon,
}: {
  icon: string;
  text: string;
  onPress?: () => void;
  actionIcon?: string;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const inner = (
    <>
      <MaterialCommunityIcons name={icon as keyof typeof MaterialCommunityIcons.glyphMap} size={18} color={colors.textSubtle} />
      <Text style={[styles.infoText, onPress ? styles.infoLink : null]}>{text}</Text>
      {onPress && actionIcon ? (
        <MaterialCommunityIcons name={actionIcon as keyof typeof MaterialCommunityIcons.glyphMap} size={18} color={colors.primary} />
      ) : null}
    </>
  );
  if (onPress) {
    return (
      <Pressable style={styles.infoRow} onPress={onPress}>
        {inner}
      </Pressable>
    );
  }
  return <View style={styles.infoRow}>{inner}</View>;
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  missingText: { fontSize: fontSize.md, color: colors.textSubtle },
  hero: { height: 260, justifyContent: 'flex-end', backgroundColor: colors.surfaceTint },
  saveBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInfo: { padding: spacing.lg, gap: spacing.sm },
  heroBadges: { flexDirection: 'row', gap: spacing.sm },
  heroName: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.white },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroMetaText: { color: 'rgba(255,255,255,0.9)', fontSize: fontSize.sm },
  body: { padding: spacing.lg, gap: spacing.md },
  desc: { fontSize: fontSize.md, color: colors.text, lineHeight: fontSize.md * 1.6 },

  ownerCard: { backgroundColor: colors.primarySoft, borderRadius: radius.lg, padding: spacing.md, gap: spacing.md },
  ownerHead: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  ownerTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.primaryDark },
  ownerSub: { fontSize: fontSize.xs, color: colors.text, marginTop: 2, lineHeight: fontSize.xs * 1.5 },
  ownerBtns: { flexDirection: 'row', gap: spacing.sm },

  campaignBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  campaignLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  campaignTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.primaryDark },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  infoText: { flex: 1, fontSize: fontSize.sm, color: colors.textSubtle },
  infoLink: { color: colors.primary, fontWeight: fontWeight.medium, textDecorationLine: 'underline' },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text, marginTop: spacing.sm },
  orderHint: { fontSize: fontSize.xs, color: colors.textSubtle, lineHeight: fontSize.xs * 1.5 },
  minRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.warningSoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  minText: { fontSize: fontSize.sm, color: colors.warning, fontWeight: fontWeight.semibold },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  deliveryText: { fontSize: fontSize.sm, color: colors.primaryDark, fontWeight: fontWeight.semibold },
  modalDelivery: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  modalDeliveryText: { fontSize: fontSize.xs, color: colors.primaryDark, fontWeight: fontWeight.medium },
  gallery: { gap: spacing.md, paddingRight: spacing.lg },
  galleryHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  galleryHint: { fontSize: fontSize.xs, color: colors.textSubtle },
  galleryItem: { borderRadius: radius.md, overflow: 'hidden' },
  galleryImg: { width: 160, height: 110, borderRadius: radius.md, backgroundColor: colors.surfaceTint },
  galleryZoom: { position: 'absolute', right: 6, bottom: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },

  menuGroup: { gap: spacing.sm },
  menuGroupHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  menuGroupTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  menuGroupCount: { fontSize: fontSize.xs, color: colors.textSubtle },
  menuGroupRow: { gap: spacing.md, paddingRight: spacing.lg, paddingVertical: 2 },
  prodCard: { width: 150, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, gap: 6 },
  prodImageWrap: { width: '100%', height: 104, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.surfaceTint },
  prodImage: { width: '100%', height: '100%' },
  prodImageEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  prodZoom: { position: 'absolute', right: 6, bottom: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  prodTag: { position: 'absolute', top: 6, left: 6, backgroundColor: colors.warning, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm },
  prodTagText: { color: colors.white, fontSize: 10, fontWeight: fontWeight.bold },
  prodName: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text, minHeight: 36 },
  prodPrice: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.primary },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  addBtnText: { color: colors.white, fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  qtyBtn: { width: 30, height: 30, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  qtyValue: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.primaryDark, minWidth: 20, textAlign: 'center' },

  minimalMenu: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.lg,
  },
  minimalGroup: { gap: spacing.xs },
  minimalGroupHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  minimalGroupTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text, letterSpacing: 0.2 },
  minimalGroupCount: { fontSize: fontSize.xs, color: colors.textFaint },
  minimalRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  minimalRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  minimalThumb: { width: 44, height: 44, borderRadius: radius.sm, backgroundColor: colors.surfaceTint },
  minimalInfo: { flex: 1 },
  minimalName: { fontSize: fontSize.md, color: colors.text, fontWeight: fontWeight.medium },
  minimalTag: { fontSize: fontSize.xs, color: colors.textSubtle, marginTop: 2 },
  minimalPrice: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.primary },

  noMenu: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
  },
  noMenuText: { flex: 1, fontSize: fontSize.sm, color: colors.textSubtle, lineHeight: fontSize.sm * 1.5 },
  reserveCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  reserveRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reserveLabel: { fontSize: fontSize.sm, color: colors.textSubtle, fontWeight: fontWeight.medium },
  reserveValue: { fontSize: fontSize.md, color: colors.text, fontWeight: fontWeight.semibold },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepperValue: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text, minWidth: 24, textAlign: 'center' },
  timeRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  timeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  timeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  timeText: { fontSize: fontSize.sm, color: colors.text, fontWeight: fontWeight.semibold },
  phoneInput: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: fontSize.md,
    color: colors.text,
  },

  cartBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadow.lg,
  },
  cartInfo: { flex: 1 },
  cartTotal: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  cartMeta: { fontSize: fontSize.xs, color: colors.textSubtle, marginTop: 2 },
  cartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: radius.md,
    minWidth: 150,
  },
  cartBtnActive: { backgroundColor: colors.warning },
  cartBtnLocked: { backgroundColor: colors.surfaceTint, borderLeftWidth: 4, borderLeftColor: colors.warning },
  cartBtnText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold },

  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  modalHandle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.borderStrong, marginBottom: spacing.sm },
  modalTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  cartSummary: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
    marginVertical: spacing.xs,
  },
  cartSummaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  cartSummaryName: { flex: 1, fontSize: fontSize.sm, color: colors.text },
  cartSummaryPrice: { fontSize: fontSize.sm, color: colors.textSubtle, fontWeight: fontWeight.medium },
  cartSummaryDivider: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  cartSummaryTotalLabel: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  cartSummaryTotal: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.primary },
  modalNote: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md, marginVertical: spacing.sm },
  modalNoteText: { flex: 1, fontSize: fontSize.xs, color: colors.textSubtle, lineHeight: fontSize.xs * 1.5 },
  modalLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.text },
  modalInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: fontSize.md,
    color: colors.text,
  },
  modalTextArea: { height: 72, textAlignVertical: 'top' },
  modalCancel: { alignItems: 'center', paddingVertical: spacing.md },
  modalCancelText: { fontSize: fontSize.sm, color: colors.textSubtle, textDecorationLine: 'underline' },
});
