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
  PrimaryCtaButton,
  SwipeableBannerCarousel,
} from './DesignSystem';
import { getCardBackgroundSpec } from '../domain/cardBackgrounds';

interface MedicalHealthSectionProps {
  kids: ChildProfile[];
  doctorsAndClinics: CommercialCatalogItem[];
  medicalArticles: MediaContentItem[];
  country: CountryCode;
  city: string;
  currency: CurrencyCode;
  language: LanguageCode;
  savedMediaIds: number[];
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
          className="inline-flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-emerald-50/90 border border-emerald-200/80"
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
                : 'text-emerald-950 hover:bg-emerald-100/70'
            }`}
          >
            👩‍⚕️ {isEn ? `Doctors (${filteredDoctors.length})` : `الأطباء والعيادات (${filteredDoctors.length})`}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'child_records'}
            onClick={() => setActiveTab('child_records')}
            className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-extrabold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'child_records'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-emerald-950 hover:bg-emerald-100/70'
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
                : 'text-emerald-950 hover:bg-emerald-100/70'
            }`}
          >
            📋 {isEn ? `Medical Guides (${medicalArticles.length})` : `الأدلة الطبية (${medicalArticles.length})`}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setFilterByUserCity((prev) => !prev)}
          className={`min-h-[40px] px-3.5 py-2 rounded-2xl text-xs font-extrabold border transition-colors whitespace-nowrap shrink-0 ${
            filterByUserCity
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
              : 'bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)]'
          }`}
        >
          📍 {isEn ? `My City (${displayCity})` : `في مدينتي (${city})`}
        </button>
      </div>

      {/* TAB 1: DOCTORS, PEDIATRICIANS & PSYCHOLOGISTS DIRECTORY */}
      {activeTab === 'doctors' && (
        <div className="space-y-4">
          <div className="rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shadow-2xs">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isEn
                  ? '🔍 Search pediatrician, speech therapist, psychologist, or clinic...'
                  : '🔍 ابحث عن طبيب أطفال، أخصائي تخاطب، استشاري نفسي، أو عيادة...'
              }
              aria-label={isEn ? 'Search doctors and clinics' : 'البحث في الأطباء والعيادات'}
              className="flex-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-4 py-2.5 text-xs sm:text-sm font-semibold text-[var(--color-text)]"
            />
            <select
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              aria-label={isEn ? 'Filter by medical specialty' : 'تصفية حسب التخصص الطبي'}
              className="min-h-[42px] rounded-2xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3.5 py-2.5 text-xs font-extrabold text-[var(--color-text)]"
            >
              <option value="all">{isEn ? 'All Specialties' : 'كل التخصصات'}</option>
              <option value="pediatrics">{isEn ? '🩺 Pediatrics & Growth' : '🩺 طب الأطفال والنمو'}</option>
              <option value="psychology">{isEn ? '🧠 Psychology & Speech' : '🧠 إرشاد نفسي وتخاطب'}</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDoctors.map((doc) => {
              const fee = currency === 'SAR' ? doc.priceSAR : doc.priceEGP;
              const isPediatrics = doc.category === 'doctor';
              const docBgSpec = getCardBackgroundSpec('medical');
              return (
                <article
                  key={doc.id}
                  className={`rounded-[24px] border ${
                    isPediatrics
                      ? 'bg-emerald-50/80 border-emerald-200/80'
                      : 'bg-teal-50/80 border-teal-200/80'
                  } p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-2xs hover:scale-[1.02] active:scale-[1.02] hover:shadow-md transition-all`}
                >
                  <div className="space-y-3">
                    <div
                      data-image-card="true"
                      style={{ backgroundImage: docBgSpec.backgroundImageCss }}
                      className="image-bg-card rounded-2xl p-4 min-h-[100px] flex flex-col justify-between gap-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-extrabold border border-white/25">
                          {isPediatrics
                            ? isEn
                              ? 'Pediatrics & Growth'
                              : 'طب الأطفال والنمو'
                            : isEn
                            ? 'Psychology & Speech'
                            : 'إرشاد نفسي وتخاطب'}
                        </span>
                        <span dir="ltr" className="text-xs font-extrabold text-amber-200 tabular-nums">
                          ★ {doc.rating} ({doc.reviewCount || 120})
                        </span>
                      </div>
                      <h3 className="text-base font-extrabold text-white leading-snug">
                        {isEn ? doc.nameEn : doc.name}
                      </h3>
                    </div>

                    <div className="text-xs font-bold text-[var(--color-muted)]">
                      📍 {locText(doc.city, language)} · {isEn ? 'Verified Clinic' : 'عيادة موثقة'}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-emerald-200/60 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[var(--color-muted)]">
                        {isEn ? 'Consultation Fee:' : 'قيمة الكشف:'}
                      </span>
                      <span dir="ltr" className="text-sm font-extrabold text-emerald-900 tabular-nums">
                        {formatCurrency(fee, currency, language)}
                      </span>
                    </div>

                    <PrimaryCtaButton
                      variant="emerald"
                      size="sm"
                      onClick={() => setBookingDoctor(doc)}
                      className="w-full"
                    >
                      📅 {isEn ? 'Book Appointment' : 'احجز موعد الآن'}
                    </PrimaryCtaButton>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: CHILD VACCINATIONS, GROWTH & PRIVATE HEALTH RECORDS */}
      {activeTab === 'child_records' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {kids.map((kid) => {
            const age = calculateChildAge(kid.birth, language);
            return (
              <div
                key={kid.id}
                className="rounded-[24px] border border-teal-200/80 bg-teal-50/70 p-5 space-y-4 shadow-2xs"
              >
                <div className="flex items-center gap-3.5">
                  <ThreeDChildAvatar
                    name={kid.name}
                    gender={kid.gender}
                    stageCode={age.stageCode}
                    accessoryTheme={kid.avatarTheme || 'astronaut'}
                    photoDataUrl={kid.photoDataUrl}
                    useIllustratedAvatar={kid.useIllustratedAvatar}
                    size="md"
                  />
                  <div>
                    <h3 className="text-lg font-extrabold text-[var(--color-text)]">
                      {locText(kid.name, language)}
                    </h3>
                    <div className="text-xs font-bold text-[var(--color-muted)]">
                      {age.label} · {age.stageTitle}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="rounded-2xl bg-white/90 border border-teal-100 p-3 shadow-2xs">
                    <div className="text-[11px] text-teal-900 font-bold">
                      📏 {isEn ? 'Height' : 'الطول'}
                    </div>
                    <div dir="ltr" className="text-base font-extrabold text-teal-950 tabular-nums mt-0.5">
                      {kid.growthHeightCm ? `${kid.growthHeightCm} cm` : '—'}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white/90 border border-teal-100 p-3 shadow-2xs">
                    <div className="text-[11px] text-teal-900 font-bold">
                      ⚖️ {isEn ? 'Weight' : 'الوزن'}
                    </div>
                    <div dir="ltr" className="text-base font-extrabold text-teal-950 tabular-nums mt-0.5">
                      {kid.growthWeightKg ? `${kid.growthWeightKg} kg` : '—'}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white/90 border border-teal-100 p-3 shadow-2xs">
                    <div className="text-[11px] text-teal-900 font-bold">
                      🩸 {isEn ? 'Blood' : 'الفصيلة'}
                    </div>
                    <div dir="ltr" className="text-base font-extrabold text-teal-950 tabular-nums mt-0.5">
                      {kid.bloodType || 'O+'}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-white/90 border border-teal-100 p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-[var(--color-text)]">
                      💉 {isEn ? 'Vaccinations' : 'التطعيمات'}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-800">
                      ✅ {isEn ? 'Up to Date' : 'منتظمة'}
                    </span>
                  </div>
                  <div className="text-[var(--color-muted)] font-semibold">
                    {kid.vaccinationsNote
                      ? locText(kid.vaccinationsNote, language)
                      : isEn
                      ? 'Routine vaccinations up to date.'
                      : 'التطعيمات الأساسية منتظمة.'}
                  </div>
                  {kid.healthNotePrivate && (
                    <div className="pt-1.5 border-t border-teal-100 text-[var(--color-muted)] font-semibold">
                      🔒 {locText(kid.healthNotePrivate, language)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: EVIDENCE-BASED MEDICAL & PSYCHOLOGICAL GUIDES */}
      {activeTab === 'articles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {medicalArticles.map((article) => {
            const isSaved = savedMediaIds.includes(article.id);
            return (
              <article
                key={article.id}
                className="rounded-[24px] border border-emerald-200/80 bg-emerald-50/75 p-5 flex flex-col justify-between gap-4 shadow-2xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs text-emerald-900 font-extrabold">
                    <span>
                      🩺 {locText(article.reviewerCredentialsAr, language, 'Peer-Reviewed Specialist')}
                    </span>
                    <span dir="ltr" className="tabular-nums">
                      👶 {article.ageStage === 'all' ? '0–8 yrs' : `${article.ageStage} yrs`}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-[var(--color-text)] leading-snug">
                    {isEn ? article.titleEn : article.title}
                  </h3>
                  <div className="text-xs font-semibold text-[var(--color-muted)] line-clamp-2">
                    {isEn ? article.summaryEn : article.summary}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-3 border-t border-emerald-200/60">
                  <PrimaryCtaButton
                    variant="emerald"
                    size="sm"
                    onClick={() => setReadingArticle(article)}
                  >
                    📖 {isEn ? 'Open Guide' : 'قراءة الدليل'}
                  </PrimaryCtaButton>
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
                    className="min-h-[40px] px-3.5 py-2 rounded-2xl text-xs font-extrabold border border-[var(--color-border)] bg-white text-[var(--color-text)]"
                  >
                    {isSaved ? (isEn ? '🌟 Saved' : '🌟 محفوظ') : isEn ? '🔖 Save' : '🔖 حفظ'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Compact Clinical Notice Strip */}
      <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 px-4 py-2.5 text-xs font-bold text-emerald-950 flex items-center justify-between gap-2">
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
                className="px-3 py-1 rounded-xl text-xs font-extrabold border border-[var(--color-border)]"
              >
                {isEn ? 'Close' : 'إغلاق'}
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
                className="px-3 py-1 rounded-xl text-xs font-extrabold border border-[var(--color-border)]"
              >
                {isEn ? 'Close' : 'إغلاق'}
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
