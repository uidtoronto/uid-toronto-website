import type { MemberStatus, RegistrationMembershipType } from '../types';

/** Turkish strings for the Super Admin CMS. */
export const adminTr = {
  // Nav & layout
  brandSubtitle: 'UID Toronto',
  superAdmin: 'Süper Yönetici',
  dashboard: 'Yönetim Paneli',
  news: 'Haberler',
  events: 'Etkinlikler',
  board: 'Yönetim Kurulu',
  projects: 'Projeler',
  members: 'Üyeler',
  donations: 'Bağışlar',
  newsletter: 'E-Bülten',
  signOut: 'Çıkış Yap',
  signedOut: 'Başarıyla çıkış yapıldı.',
  toggleSidebar: 'Menüyü aç/kapat',

  // Common actions
  create: 'Oluştur',
  save: 'Kaydet',
  saving: 'Kaydediliyor…',
  delete: 'Sil',
  edit: 'Düzenle',
  cancel: 'İptal',
  yes: 'Evet',
  update: 'Güncelle',
  back: 'Geri',
  search: 'Ara',
  uploadImage: 'Görsel Yükle',
  chooseFile: 'Dosya Seç',
  uploading: 'Yükleniyor…',
  removeImage: 'Görseli kaldır',
  addGalleryImages: 'Galeri görselleri ekle',
  publish: 'Yayınla',
  unpublish: 'Yayından kaldır',
  published: 'Yayında',
  draft: 'Taslak',
  featured: 'Öne çıkan',
  content: 'İçerik',
  roster: 'Kayıt',
  finance: 'Finans',

  // Success / error messages
  successSaved: '✓ Başarıyla kaydedildi.',
  successCreated: '✓ Başarıyla oluşturuldu.',
  successUpdated: '✓ Başarıyla güncellendi.',
  successDeleted: '✓ Başarıyla silindi.',
  successPublished: '✓ Yayına alındı.',
  successUnpublished: '✓ Yayından kaldırıldı.',
  successOrderSaved: '✓ Sıralama kaydedildi.',
  successNewsSaved: '✓ Haber başarıyla kaydedildi.',
  successEventSaved: '✓ Etkinlik başarıyla kaydedildi.',
  successProjectSaved: '✓ Proje başarıyla kaydedildi.',
  successBoardSaved: '✓ Yönetim kurulu üyesi başarıyla kaydedildi.',
  successMemberSaved: '✓ Üye başarıyla güncellendi.',

  // Confirmations
  confirmUnsavedLeave: 'Kaydedilmemiş değişiklikleriniz var. Sayfadan ayrılmak istediğinize emin misiniz?',
  confirmDeleteNews: 'Bu haber makalesini silmek istediğinize emin misiniz?',
  confirmDeleteEvent: 'Bu etkinliği silmek istediğinize emin misiniz?',
  confirmDeleteProject: 'Bu projeyi silmek istediğinize emin misiniz?',
  confirmDeleteBoard: 'Bu yönetim kurulu üyesini silmek istediğinize emin misiniz?',

  // Empty states
  noNews: 'Henüz haber makalesi yok.',
  noEvents: 'Henüz etkinlik yok.',
  noProjects: 'Henüz proje yok.',
  noBoard: 'Henüz yönetim kurulu üyesi yok.',
  noMembers: 'Üye bulunamadı.',
  noDonations: 'Henüz bağış kaydı yok.',
  noData: 'Veri yok',
  noRecentActivity: 'Son aktivite yok.',
  noRecentMembers: 'Henüz üye yok.',

  // Dashboard
  welcome: (name: string) => `Hoş geldiniz, ${name}`,
  dashboardSub: 'Üyelik ve abonelik genel bakışı.',
  totalMembers: 'Toplam üye',
  activeMembers: 'Aktif',
  pendingMembers: 'Beklemede',
  subscriptions: 'Abonelikler',
  membersByStatus: 'Duruma göre üyeler',
  membersByType: 'Türe göre üyeler',
  recentMembers: 'Son üyeler',
  subscriptionStats: 'Abonelik istatistikleri',
  recentActivity: 'Son aktivite',
  registered: 'kayıt oldu',

  // Donations
  totalDonations: 'Toplam Bağış',
  totalRaised: 'Toplam Toplanan',
  date: 'Tarih',
  amount: 'Tutar',
  donorEmail: 'Bağışçı E-postası',
  paymentId: 'Ödeme ID',

  // News
  newArticle: 'Yeni makale',
  createNews: 'Haber makalesi oluştur',
  editNews: 'Haber makalesini düzenle',
  titleEn: 'Başlık (İngilizce) *',
  titleTr: 'Başlık (Türkçe)',
  excerptEn: 'Özet (İngilizce) *',
  excerptTr: 'Özet (Türkçe)',
  bodyEn: 'İçerik (İngilizce)',
  bodyTr: 'İçerik (Türkçe)',
  publishImmediately: 'Hemen yayınla',
  newsTitleRequired: 'İngilizce başlık ve özet zorunludur.',

  // Events
  newEvent: 'Yeni etkinlik',
  createEvent: 'Etkinlik oluştur',
  editEvent: 'Etkinliği düzenle',
  eventDate: 'Tarih *',
  eventTime: 'Saat *',
  location: 'Konum *',
  descriptionEn: 'Açıklama (İngilizce) *',
  descriptionTr: 'Açıklama (Türkçe)',
  eventRequired: 'Başlık, açıklama, tarih ve konum zorunludur.',

  // Projects
  newProject: 'Yeni proje',
  createProject: 'Proje oluştur',
  editProject: 'Projeyi düzenle',
  categoryEn: 'Kategori (İngilizce)',
  categoryTr: 'Kategori (Türkçe)',
  projectDate: 'Proje tarihi',
  coverImage: 'Kapak görseli',
  galleryImages: 'Galeri görselleri',
  socialLinks: 'Sosyal bağlantılar (isteğe bağlı)',
  featuredHomepage: 'Ana sayfada öne çıkar',
  projectRequired: 'İngilizce başlık ve açıklama zorunludur.',

  // Board
  newBoardMember: 'Yeni üye',
  createBoardMember: 'Yönetim kurulu üyesi oluştur',
  editBoardMember: 'Yönetim kurulu üyesini düzenle',
  nameEn: 'Ad (İngilizce)',
  nameTr: 'Ad (Türkçe)',
  positionEn: 'Pozisyon (İngilizce) *',
  positionTr: 'Pozisyon (Türkçe)',
  profilePhoto: 'Profil fotoğrafı',
  featuredRow: 'Öne çıkan (Başkan / Sekreter sırası)',
  dragReorder: 'Sıralamak için satırları sürükleyin. Sıra kamuya açık BYK bölümünde yansır.',
  boardRequired: 'İngilizce pozisyon zorunludur.',
  noName: '(İsim yok)',

  // Members
  editMember: 'Üyeyi düzenle',
  saveChanges: 'Değişiklikleri kaydet',
  searchMembers: 'Ad veya e-posta ile ara…',
  firstName: 'Ad',
  lastName: 'Soyad',
  email: 'E-posta',
  phone: 'Telefon',
  mobile: 'Cep telefonu',
  city: 'Şehir',
  status: 'Durum',
  membershipType: 'Üyelik türü',
  addressLine1: 'Adres satırı 1',
  addressLine2: 'Adres satırı 2',
  province: 'İl',
  postalCode: 'Posta kodu',
  country: 'Ülke',
  memberNotFound: 'Üye bulunamadı.',

  // Image upload defaults
  featuredImage: 'Öne çıkan görsel',
} as const;

export const adminStatusLabels: Record<MemberStatus, string> = {
  active: 'Aktif',
  inactive: 'Pasif',
  pending: 'Beklemede',
  suspended: 'Askıya Alındı',
};

export const adminMembershipLabels: Record<RegistrationMembershipType, string> = {
  adult: 'Yetişkin',
  student: 'Öğrenci',
  pensioner: 'Emekli',
};

export const adminPaymentStatusLabels: Record<string, string> = {
  active: 'Aktif',
  pending: 'Beklemede',
  failed: 'Başarısız',
  cancelled: 'İptal',
  canceled: 'İptal',
};
