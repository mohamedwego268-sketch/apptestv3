import React, { useState, useMemo } from 'react';
import {
  ChildProfile,
  CommercialCatalogItem,
  CountryCode,
  CurrencyCode,
  LanguageCode,
  MediaContentItem,
  calculateChildAge,
  formatCurrency,
  locText,
} from '../domain/familySpaceCore';
import { ThreeDChildAvatar, ThreeDIcon } from './ThreeDVisuals';
import {
  BannerSlideItem,
  CompareArrowsIcon,
  MasterPatternCard,
  PrimaryCtaButton,
  SwipeableBannerCarousel,
} from './DesignSystem';
import { getCardBackgroundSpec } from '../domain/cardBackgrounds';
import { ChildGrowthChart } from './ChildGrowthChart';

interface MedicalHealthSectionProps {
  kids: ChildProfile[];
  doctorsAndClinics: CommercialCatalogItem[];
  medicalArticles: MediaContentItem[];
  country: CountryCode;
  city: string;
  currency: CurrencyCode;
  language: LanguageCode;
  savedMediaIds: number[];
  darkMode?: boolean;
  onToggleSaveMedia: (id: number) => void;
  onBookDoctorAppointment: (doctorName: string, childId: number | null, date: string, time: string, note: string) => void;
  onShowToast: (msg: string) => void;
}

export const MedicalHealthSection: React.FC<MedicalHealthSectionProps> = ({
  kids,
  doctorsAndClinics,
  medicalArticles,
  country,
  city,
  currency,
  language,
  savedMediaIds,
  darkMode,
  onToggleSaveMedia,
  onBookDoctorAppointment,
  onShowToast,
}) => {
  const isEn = language === 'en';
  const displayCity = locText(city, language);
  const [activeTab, setActiveTab] = useState<'doctors' | 'child_records' | 'articles'>('doctors');
  const [filterByUserCity, setFilterByUserCity] = useState<boolean>(false);
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [bookingDoctor, setBookingDoctor] = useState<CommercialCatalogItem | null>(null);
  const [bookingChildId, setBookingChildId] = useState<number>(kids[0]?.id || 0);
  const [bookingDate, setBookingDate] = useState<string>('2026-11-05');
  const [bookingTime, setBookingTime] = useState<string>('05:00 م');
  const [bookingNote, setBookingNote] = useState<string>('');
  const [readingArticle, setReadingArticle] = useState<MediaContentItem | null>(null);
  const [comparedDoctorIds, setComparedDoctorIds] = useState<number[]>([]);

  const handleToggleCompareDoctor = (doc: CommercialCatalogItem) => {
    setComparedDoctorIds((prev) => {
      const exists = prev.includes(doc.id);
      const next = exists ? prev.filter((id) => id !== doc.id) : [...prev.slice(-2), doc.id];
      onShowToast(
        exists
          ? isEn
            ? `Removed "${doc.nameEn}" from comparison`
            : `تمت إزالة «${doc.name}» من المقارنة`
          : isEn
          ? `Added "${doc.nameEn}" to comparison`
          : `تمت إضافة «${doc.name}» للمقارنة`
      );
      return next;
    });
  };

  const filteredDoctors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return doctorsAndClinics.filter((doc) => {
      const matchesCountry = doc.country === 'ALL' || doc.country === country;
      const matchesCity =
        !filterByUserCity ||
        doc.city.includes(city) ||
        doc.city.includes('أونلاين');
      const matchesSpecialty =
        specialtyFilter === 'all' ||
        (specialtyFilter === 'pediatrics' && doc.category === 'doctor') ||
        (specialtyFilter === 'psychology' && doc.category === 'consultation');
      const haystack = `${doc.name} ${doc.nameEn} ${doc.description} ${doc.city}`.toLowerCase();
      return matchesCountry && matchesCity && matchesSpecialty && (!q || haystack.includes(q));
    });
  }, [doctorsAndClinics, country, city, filterByUserCity, specialtyFilter, searchQuery]);

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingDoctor) return;
    onBookDoctorAppointment(
      isEn ? bookingDoctor.nameEn : bookingDoctor.name,
      bookingChildId || null,
      bookingDate,
      bookingTime,
      bookingNote
    );
    setBookingDoctor(null);
    setBookingNote('');
  };

  const medicalBanners: BannerSlideItem[] = [
    {
      id: 'med-slide-doctors',
      badge: isEn ? '🩺 Verified Pediatricians' : '🩺 أطباء وعيادات معتمدة',
      title: isEn
        ? `Top Pediatricians & Specialists in ${displayCity}`
        : `أفضل أطباء واستشاريي الأطفال في ${city}`,
      subtitle: isEn
        ? 'Instant Appointment Booking · Syncs with Family Calendar'
        : 'حجز فوري للمواعيد · يضاف تلقائيًا لتقويم الأسرة',
      ctaLabel: isEn ? 'Book Doctor Now' : 'احجز موعد طبيب الآن',
      onCtaClick: () => {
        setActiveTab('doctors');
        if (filteredDoctors[0]) setBookingDoctor(filteredDoctors[0]);
      },
      iconId: 'health',
      gradient: 'linear-gradient(125deg, #ecfdf5, #d1fae5, #e0f2fe)',
      ctaVariant: 'emerald',
    },
    {
      id: 'med-slide-vaccines',
      badge: isEn ? '💉 Growth & Vaccinations' : '💉 التطعيمات ومتابعة النمو',
      title: isEn
        ? 'Child Growth Metrics & Vaccination Schedule (0–8 Yrs)'
        : 'سجل التطعيمات وقياسات الطول والوزن لأطفالك',
      subtitle: isEn
        ? 'Height · Weight · Blood Type · Private Parent Notes'
        : 'الطول · الوزن · فصيلة الدم · ملاحظات صحية خاصة',
      ctaLabel: isEn ? 'Open Child Health Records' : 'عرض السجل الصحي للأطفال',
      onCtaClick: () => setActiveTab('child_records'),
      iconId: 'children',
      gradient: 'linear-gradient(125deg, #f0fdfa, #ccfbf1, #ede9fe)',
      ctaVariant: 'indigo',
    },
    {
      id: 'med-slide-guides',
      badge: isEn ? '📋 Peer-Reviewed Guides' : '📋 أدلة طبية ونفسية موثقة',
      title: isEn
        ? 'Quick Pediatric & Child Psychology Guides'
        : 'إرشادات طبية ونفسية مراجعة علميًا للوالدين',
      subtitle: isEn
        ? 'Newborn Care · Fever · Speech · Positive Behavior'
        : 'رعاية الرضع · التسنين · التخاطب · تعديل السلوك',
      ctaLabel: isEn ? 'Browse Medical Guides' : 'تصفح الأدلة الطبية',
      onCtaClick: () => setActiveTab('articles'),
      iconId: 'star',
      gradient: 'linear-gradient(125deg, #fffbeb, #fef3c7, #dcfce7)',
      ctaVariant: 'orange',
    },
  ];

  return (
    <section className="space-y-5" aria-label={isEn ? 'Medical & Child Health Hub' : 'الركن الطبي وصحة الطفل'}>
      {/* Swipeable Medical Highlights Carousel */}
      <SwipeableBannerCarousel
        slides={medicalBanners}
        language={language}
        ariaLabel={isEn ? 'Medical Highlights Carousel' : 'لافتات الرعاية الطبية المتحركة'}
      />

      {/* Segmented Navigation inside Medical Hub */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div
          className="inline-flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-emerald-50/90 dark:bg-[#101D26] border border-emerald-200/80 dark:border-[#1E3646]"
          role="tablist"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'doctors'}
            onClick={() => setActiveTab('doctors')}
            className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-extrabold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'doctors'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-emerald-950 dark:text-[#F8FAFC] hover:bg-emerald-100/70 dark:hover:bg-[#142430]'
            }`}
          >
            👩‍⚕️ {isEn ? `Doctors (${filteredDoctors.length})` : `دكاترة وعيادات (${filteredDoctors.length})`}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'child_records'}
            onClick={() => setActiveTab('child_records')}
            className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-extrabold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'child_records'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-emerald-950 dark:text-[#F8FAFC] hover:bg-emerald-100/70 dark:hover:bg-[#142430]'
            }`}
          >
            💉 {isEn ? `Vaccinations & Growth (${kids.length})` : `التطعيمات والنمو (${kids.length})`}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'articles'}
            onClick={() => setActiveTab('articles')}
            className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-extrabold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'articles'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-emerald-950 dark:text-[#F8FAFC] hover:bg-emerald-100/70 dark:hover:bg-[#142430]'
            }`}
          >
            📋 {isEn ? `Medical Guides (${medicalArticles.length})` : `أدلة طبية سريعة (${medicalArticles.length})`}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setFilterByUserCity((prev) => !prev)}
          className={`min-h-[40px] px-3.5 py-2 rounded-2xl text-xs font-extrabold border transition-colors whitespace-nowrap shrink-0 ${
            filterByUserCity
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
              : 'bg-[var(--color-surface)] dark:bg-[#101D26] text-[var(--color-text)] border-[var(--color-border)] dark:border-[#1E3646]'
          }`}
        >
          📍 {isEn ? `My City (${displayCity})` : `الأقرب في (${city})`}
        </button>
      </div>

      {/* TAB 1: DOCTORS, PEDIATRICIANS & PSYCHOLOGISTS DIRECTORY */}
      {activeTab === 'doctors' && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shadow-2xs">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isEn
                  ? '🔍 Search pediatrician, speech therapist, or clinic...'
                  : '🔍 ابحث عن طبيب أطفال، أخصائي تخاطب، أو عيادة...'
              }
              aria-label={isEn ? 'Search doctors and clinics' : 'البحث في الأطباء والعيادات'}
              className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3.5 py-2 text-xs font-semibold text-[var(--color-text)]"
            />
            <select
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              aria-label={isEn ? 'Filter by medical specialty' : 'تصفية حسب التخصص الطبي'}
              className="min-h-[38px] rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-1.5 text-xs font-extrabold text-[var(--color-text)]"
            >
              <option value="all">{isEn ? 'All Specialties' : 'كل التخصصات'}</option>
              <option value="pediatrics">{isEn ? '🩺 Pediatrics & Growth' : '🩺 طب الأطفال والنمو'}</option>
              <option value="psychology">{isEn ? '🧠 Psychology & Speech' : '🧠 إرشاد نفسي وتخاطب'}</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredDoctors.map((doc) => {
              const fee = currency === 'SAR' ? doc.priceSAR : doc.priceEGP;
              const isPediatrics = doc.category === 'doctor';
              const isCompared = comparedDoctorIds.includes(doc.id);
              return (
                <MasterPatternCard
                  key={doc.id}
                  tone={isPediatrics ? 'emerald' : 'teal'}
                  categoryKey="doctor"
                  itemIdOrIndex={doc.id}
                  darkMode={darkMode}
                  onThumbnailClick={() => setBookingDoctor(doc)}
                  topLeftBadge={
                    isPediatrics
                      ? isEn
                        ? 'Pediatrics & Growth'
                        : 'طب الأطفال والنمو'
                      : isEn
                      ? 'Psychology & Speech'
                      : 'إرشاد نفسي وتخاطب'
                  }
                  topRightBadge={
                    <span>
                      ⭐ {doc.rating} ({doc.reviewCount || 142})
                    </span>
                  }
                  title={isEn ? doc.nameEn : doc.name}
                  metaLeft={
                    <span>
                      📍 {locText(doc.city, language)} · {isEn ? 'Verified' : 'موثق'}
                    </span>
                  }
                  metaRightAction={
                    <button
                      type="button"
                      onClick={() => setBookingDoctor(doc)}
                      className="text-[10px] font-extrabold text-[#0d9488] dark:text-[#A5F3FC] hover:underline cursor-pointer"
                    >
                      {isEn ? 'Details' : 'تفاصيل'}
                    </button>
                  }
                  footerLeft={
                    <div className="flex flex-col">
                      <span className="text-[9.5px] font-bold text-[var(--color-muted)] dark:text-[#94A3B8]">
                        {isEn ? 'Fee:' : 'الكشف:'}
                      </span>
                      <span dir="ltr" className="text-xs font-extrabold text-emerald-900 dark:text-[#A5F3FC] tabular-nums">
                        {formatCurrency(fee, currency, language)}
                      </span>
                    </div>
                  }
                  footerRight={
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleToggleCompareDoctor(doc)}
                        aria-pressed={isCompared}
                        title={isEn ? 'Compare Clinic' : 'مقارنة العيادة'}
                        aria-label={isEn ? 'Compare Clinic' : 'مقارنة العيادة'}
                        className={`h-8 px-2 rounded-lg border text-[10px] font-extrabold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer ${
                          isCompared
                            ? 'bg-[#0d9488] border-[#0d9488] text-white'
                            : 'border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-text)] dark:text-[#A5F3FC] hover:border-[#0d9488]'
                        }`}
                      >
                        <CompareArrowsIcon size={13} />
                      </button>
                      <PrimaryCtaButton
                        variant="emerald"
                        size="sm"
                        onClick={() => setBookingDoctor(doc)}
                      >
                        📅 {isEn ? 'Book' : 'احجز'}
                      </PrimaryCtaButton>
                    </div>
                  }
                />
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: CHILD VACCINATIONS, GROWTH & PRIVATE HEALTH RECORDS */}
      {activeTab === 'child_records' && (
        <div className="space-y-5">
          {kids.length > 0 && (
            <ChildGrowthChart
              kids={kids}
              language={language}
              darkMode={Boolean(darkMode)}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {kids.map((kid) => {
              const age = calculateChildAge(kid.birth, language);
              return (
                <MasterPatternCard
                  key={kid.id}
                  tone="teal"
                  categoryKey="medical"
                  itemIdOrIndex={kid.id}
                  darkMode={darkMode}
                  topLeftBadge={age.label}
                  topRightBadge={
                    <span>
                      ✅ {isEn ? 'Up to Date' : 'تطعيمات منتظمة'}
                    </span>
                  }
                  titlePrefixSlot={
                    <ThreeDChildAvatar
                      name={kid.name}
                      gender={kid.gender}
                      stageCode={age.stageCode}
                      accessoryTheme={kid.avatarTheme || 'astronaut'}
                      photoDataUrl={kid.photoDataUrl}
                      useIllustratedAvatar={kid.useIllustratedAvatar}
                      size="sm"
                    />
                  }
                  title={locText(kid.name, language)}
                  metaLeft={
                    <span>
                      👶 {age.stageTitle} · 🩸 {kid.bloodType || 'O+'}
                    </span>
                  }
                  bodyContent={
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-xl bg-white/90 dark:bg-[#142430] border border-teal-100 dark:border-[#1E3646] p-2 shadow-2xs">
                          <div className="text-[10px] text-teal-900 dark:text-[#94A3B8] font-bold">
                            📏 {isEn ? 'Height' : 'الطول'}
                          </div>
                          <div dir="ltr" className="text-xs sm:text-sm font-extrabold text-teal-950 dark:text-[#2DD4BF] tabular-nums mt-0.5">
                            {kid.growthHeightCm ? `${kid.growthHeightCm} cm` : '—'}
                          </div>
                        </div>
                        <div className="rounded-xl bg-white/90 dark:bg-[#142430] border border-teal-100 dark:border-[#1E3646] p-2 shadow-2xs">
                          <div className="text-[10px] text-teal-900 dark:text-[#94A3B8] font-bold">
                            📊 {isEn ? 'Weight' : 'الوزن'}
                          </div>
                          <div dir="ltr" className="text-xs sm:text-sm font-extrabold text-teal-950 dark:text-[#FB923C] tabular-nums mt-0.5">
                            {kid.growthWeightKg ? `${kid.growthWeightKg} kg` : '—'}
                          </div>
                        </div>
                        <div className="rounded-xl bg-white/90 dark:bg-[#142430] border border-teal-100 dark:border-[#1E3646] p-2 shadow-2xs">
                          <div className="text-[10px] text-teal-900 dark:text-[#94A3B8] font-bold">
                            🩸 {isEn ? 'Blood' : 'الفصيلة'}
                          </div>
                          <div dir="ltr" className="text-xs sm:text-sm font-extrabold text-teal-950 dark:text-[#F8FAFC] tabular-nums mt-0.5">
                            {kid.bloodType || 'O+'}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl bg-white/90 dark:bg-[#142430] border border-teal-100 dark:border-[#1E3646] p-2.5 space-y-1 text-xs">
                        <div className="text-[var(--color-muted)] dark:text-[#94A3B8] font-semibold">
                          💉{' '}
                          {kid.vaccinationsNote
                            ? locText(kid.vaccinationsNote, language)
                            : isEn
                            ? 'Routine vaccinations up to date.'
                            : 'التطعيمات الأساسية منتظمة.'}
                        </div>
                        {kid.healthNotePrivate && (
                          <div className="pt-1 border-t border-teal-100 dark:border-[#1E3646] text-[var(--color-muted)] dark:text-[#94A3B8] font-semibold">
                            🔒 {locText(kid.healthNotePrivate, language)}
                          </div>
                        )}
                      </div>
                    </div>
                  }
                  footerLeft={
                    <span className="text-xs font-extrabold text-emerald-900 dark:text-[#A5F3FC]">
                      💉 {isEn ? 'Vaccinations: Up to Date' : 'سجل التطعيمات: منتظمة'}
                    </span>
                  }
                />
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: EVIDENCE-BASED MEDICAL & PSYCHOLOGICAL GUIDES */}
      {activeTab === 'articles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {medicalArticles.map((article) => {
            const isSaved = savedMediaIds.includes(article.id);
            return (
              <MasterPatternCard
                key={article.id}
                tone="emerald"
                categoryKey="medical"
                itemIdOrIndex={article.id}
                darkMode={darkMode}
                onThumbnailClick={() => setReadingArticle(article)}
                topLeftBadge={locText(article.reviewerCredentialsAr, language, 'Peer-Reviewed Specialist')}
                topRightBadge={
                  <span>
                    👶 {article.ageStage === 'all' ? '0–8 yrs' : `${article.ageStage} yrs`}
                  </span>
                }
                title={isEn ? article.titleEn : article.title}
                metaLeft={
                  <span>
                    🩺 {locText(article.durationLabel, language)} · 📍 {displayCity}
                  </span>
                }
                metaRightAction={
                  <button
                    type="button"
                    onClick={() => setReadingArticle(article)}
                    className="text-[11px] font-extrabold text-[#0d9488] dark:text-[#A5F3FC] hover:underline cursor-pointer"
                  >
                    {isEn ? 'Read Now' : 'اقرأ الآن'}
                  </button>
                }
                bodyContent={
                  <p className="text-xs font-semibold text-[var(--color-muted)] dark:text-[#94A3B8] line-clamp-2">
                    {isEn ? article.summaryEn : article.summary}
                  </p>
                }
                footerLeft={
                  <PrimaryCtaButton
                    variant="emerald"
                    size="sm"
                    onClick={() => setReadingArticle(article)}
                  >
                    📖 {isEn ? 'Open Guide' : 'قراءة الدليل'}
                  </PrimaryCtaButton>
                }
                footerRight={
                  <button
                    type="button"
                    onClick={() => {
                      onToggleSaveMedia(article.id);
                      onShowToast(
                        isSaved
                          ? isEn
                            ? 'Removed from saved guides'
                            : 'تمت الإزالة من المحفوظات'
                          : isEn
                          ? 'Saved to medical guides'
                          : 'تم الحفظ في مرجعك الطبي'
                      );
                    }}
                    className="min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-extrabold border border-[var(--color-border)] dark:border-[#1E3646] bg-white dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] cursor-pointer"
                  >
                    {isSaved ? (isEn ? '🌟 Saved' : '🌟 محفوظ') : isEn ? '🔖 Save' : '🔖 حفظ'}
                  </button>
                }
              />
            );
          })}
        </div>
      )}

      {/* Compact Clinical Notice Strip */}
      <div className="rounded-2xl border border-emerald-200/80 dark:border-[#1E3646] bg-emerald-50/60 dark:bg-[#101D26] px-4 py-2.5 text-xs font-bold text-emerald-950 dark:text-[#A5F3FC] flex items-center justify-between gap-2 soft-card-surface">
        <span>⚕️ {isEn ? 'Guidance & Appointment Coordination Hub' : 'ركن التوعية الطبية وتنسيق المواعيد الأسرية'}</span>
        <span>📍 {displayCity}</span>
      </div>

      {/* Doctor Appointment Booking Modal */}
      {bookingDoctor && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleConfirmBooking}
            className="w-full max-w-md rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-extrabold text-[var(--color-text)]">
                🩺 {isEn ? 'Book Doctor Appointment' : 'حجز موعد طبي وتنسيق التقويم'}
              </h3>
              <button
                type="button"
                onClick={() => setBookingDoctor(null)}
                aria-label={isEn ? 'Close modal' : 'إغلاق النافذة'}
                className="w-8 h-8 rounded-xl text-lg font-black leading-none border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-text)] flex items-center justify-center shrink-0 cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-950 space-y-0.5">
              <div className="font-extrabold">{isEn ? bookingDoctor.nameEn : bookingDoctor.name}</div>
              <div className="font-semibold">📍 {locText(bookingDoctor.city, language)}</div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[var(--color-text)] mb-1">
                {isEn ? 'Select Child' : 'الطفل'}
              </label>
              <select
                value={bookingChildId}
                onChange={(e) => setBookingChildId(Number(e.target.value))}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-xs font-bold text-[var(--color-text)]"
              >
                {kids.map((k) => (
                  <option key={k.id} value={k.id}>
                    {locText(k.name, language)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-extrabold text-[var(--color-text)] mb-1">
                  {isEn ? 'Preferred Date' : 'تاريخ الموعد'}
                </label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-xs font-bold text-[var(--color-text)]"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-[var(--color-text)] mb-1">
                  {isEn ? 'Time Slot' : 'الوقت المفضل'}
                </label>
                <input
                  type="text"
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-xs font-bold text-[var(--color-text)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[var(--color-text)] mb-1">
                {isEn ? 'Consultation Note' : 'ملاحظات سريعة للطبيب'}
              </label>
              <textarea
                value={bookingNote}
                onChange={(e) => setBookingNote(e.target.value)}
                placeholder={isEn ? 'Routine checkup or vaccination...' : 'مثال: متابعة نمو دورية أو تطعيم...'}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] p-3 text-xs text-[var(--color-text)] min-h-[64px]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBookingDoctor(null)}
                className="min-h-[40px] px-4 py-2 rounded-2xl text-xs font-extrabold border border-[var(--color-border)]"
              >
                {isEn ? 'Cancel' : 'إلغاء'}
              </button>
              <PrimaryCtaButton type="submit" variant="emerald" size="sm">
                {isEn ? 'Confirm Booking' : 'تأكيد الحجز بالتقويم'}
              </PrimaryCtaButton>
            </div>
          </form>
        </div>
      )}

      {/* Medical Guide Reader Modal */}
      {readingArticle && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-xl rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-4 max-h-[85vh] overflow-y-auto shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-extrabold text-emerald-800">
                  🩺 {locText(readingArticle.reviewerCredentialsAr, language, 'Peer-Reviewed Medical & Psychology Guide')}
                </div>
                <h3 className="text-lg font-extrabold text-[var(--color-text)] mt-1">
                  {isEn ? readingArticle.titleEn : readingArticle.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReadingArticle(null)}
                aria-label={isEn ? 'Close guide reader' : 'إغلاق الدليل الطبي'}
                className="w-8 h-8 rounded-xl text-lg font-black leading-none border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-text)] flex items-center justify-center shrink-0 cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="space-y-2.5 text-sm text-[var(--color-text)] leading-relaxed">
              {(isEn && readingArticle.bodyEn ? readingArticle.bodyEn : readingArticle.body).map(
                (para, idx) => (
                  <p key={idx} className="rounded-2xl bg-emerald-50/70 border border-emerald-100 p-3.5">
                    {para}
                  </p>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
