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
import { ThreeDChildAvatar } from './ThreeDVisuals';
import {
  BannerSlideItem,
  CompareArrowsIcon,
  MasterPatternCard,
  PrimaryCtaButton,
  StarOfTheDayCrownBadge,
  SwipeableBannerCarousel,
} from './DesignSystem';
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
  const [activeTab, setActiveTab] = useState<'doctors' | 'child_records' | 'sos_dosage' | 'articles'>('doctors');
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
      id: 'med-slide-sos',
      badge: isEn ? '🚑 SOS & Dosage Hub' : '🚑 دليل الطوارئ والجرعات',
      title: isEn
        ? 'Emergency Contacts & Weight-Based Fever Reducer Guide'
        : 'أرقام الطوارئ وحاسبة جرعات خافض الحرارة بالوزن',
      subtitle: isEn
        ? 'Quick Reference · Safe Pediatric Weight Dosage · Medical Disclaimer'
        : 'مرجع سريع وآمن لجرعات حمزة وليلى ويوسف مع تنبيهات السلامة الطبية',
      ctaLabel: isEn ? 'Open Emergency Checklist' : 'افتح قائمة الاستعداد للطوارئ',
      onCtaClick: () => setActiveTab('sos_dosage'),
      iconId: 'shield',
      gradient: 'linear-gradient(125deg, #fff1f2, #ffe4e6, #fef3c7)',
      ctaVariant: 'orange',
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-emerald-50/90 dark:bg-[#101D26] border border-emerald-200/80 dark:border-[#1E3646] max-w-full"
          role="tablist"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'doctors'}
            onClick={() => setActiveTab('doctors')}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-colors cursor-pointer ${
              activeTab === 'doctors'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-emerald-950 dark:text-[#F8FAFC] hover:bg-emerald-100/70 dark:hover:bg-[#142430]'
            }`}
          >
            👩‍⚕️ {isEn ? `Doctors (${filteredDoctors.length})` : `دكاترة وعيادات (${filteredDoctors.length})`}
          </button>
          <button
            id="medical-sos-dosage-tab-btn"
            type="button"
            role="tab"
            aria-selected={activeTab === 'sos_dosage'}
            onClick={() => setActiveTab('sos_dosage')}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-colors cursor-pointer ${
              activeTab === 'sos_dosage'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'text-rose-900 dark:text-rose-200 hover:bg-rose-100/70 dark:hover:bg-[#142430]'
            }`}
          >
            🚑 {isEn ? 'Emergency Preparedness' : 'الاستعداد للطوارئ'}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'child_records'}
            onClick={() => setActiveTab('child_records')}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-colors cursor-pointer ${
              activeTab === 'child_records'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-emerald-950 dark:text-[#F8FAFC] hover:bg-emerald-100/70 dark:hover:bg-[#142430]'
            }`}
          >
            💉 {isEn ? `Growth & Vaccines (${kids.length})` : `التطعيمات والنمو (${kids.length})`}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'articles'}
            onClick={() => setActiveTab('articles')}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-colors cursor-pointer ${
              activeTab === 'articles'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-emerald-950 dark:text-[#F8FAFC] hover:bg-emerald-100/70 dark:hover:bg-[#142430]'
            }`}
          >
            📋 {isEn ? `Guides (${medicalArticles.length})` : `أدلة طبية سريعة (${medicalArticles.length})`}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setFilterByUserCity((prev) => !prev)}
          className={`min-h-[44px] px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-extrabold border transition-colors cursor-pointer ${
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
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shadow-2xs soft-card-surface">
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
        <div className="space-y-5 animate-tab-enter">
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
                  topRightBadge={<StarOfTheDayCrownBadge language={language} completedCount={1} />}
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

      {/* TAB 2B: FAMILY EMERGENCY PREPAREDNESS — NO DOSAGE OR DIAGNOSIS */}
      {activeTab === 'sos_dosage' && (
        <div id="sos-dosage-quick-hub" data-testid="sos-dosage-quick-hub" className="space-y-4 animate-tab-enter">
          <div className="rounded-2xl border-2 border-amber-300 dark:border-amber-600/50 bg-amber-50 dark:bg-[#1F1A14] p-4 flex items-start gap-3">
            <span className="text-2xl shrink-0">⚠️</span>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-amber-950 dark:text-amber-200">
                {isEn ? 'Emergency information — preparation only' : 'معلومات الطوارئ — للاستعداد فقط'}
              </h3>
              <p className="text-xs font-semibold leading-relaxed text-amber-900 dark:text-amber-100">
                {isEn
                  ? 'This page does not diagnose, recommend medicines, or calculate doses. For an emergency, contact the official local emergency service immediately.'
                  : 'القسم ده لا يشخّص الحالات ولا يوصي بأدوية أو يحسب جرعات. في أي حالة طارئة، تواصل فورًا مع جهة الطوارئ الرسمية في بلدك.'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: '📞', titleAr: 'أرقام التواصل المهمة', titleEn: 'Important contact numbers', bodyAr: 'احفظ رقم الطوارئ المحلي، ومركز السموم الرسمي إن توفر، ورقم طبيب الطفل.', bodyEn: 'Save your official local emergency number, poison center if available, and your child’s clinician.' },
              { icon: '📍', titleAr: 'معلومات الوصول', titleEn: 'Location details', bodyAr: 'احتفظ بعنوان المنزل الدقيق وأقرب معلم واضح لمشاركته مع خدمات الطوارئ.', bodyEn: 'Keep your exact home address and a nearby landmark ready to share with emergency responders.' },
              { icon: '🧒', titleAr: 'بطاقة تعريف الطفل', titleEn: 'Child information card', bodyAr: 'جهّز اسم الطفل وعمره وبيانات ولي الأمر وأي حساسية أو حالة صحية أدخلتها بنفسك.', bodyEn: 'Have the child’s name, age, parent contact, and any allergies or conditions you personally recorded.' },
              { icon: '💊', titleAr: 'قائمة الأدوية', titleEn: 'Medication list', bodyAr: 'سجّل أسماء الأدوية وتركيز العبوة كما هي على الملصق، واتبع تعليمات الطبيب أو الصيدلي فقط.', bodyEn: 'Record medicine names and package concentrations exactly as printed; follow a clinician or pharmacist’s instructions.' },
            ].map((item) => (
              <div key={item.titleEn} className="rounded-2xl border border-rose-200 dark:border-[#1E3646] bg-white dark:bg-[#142430] p-4 space-y-2">
                <div className="text-2xl">{item.icon}</div>
                <h4 className="text-sm font-extrabold text-[var(--color-text)]">{isEn ? item.titleEn : item.titleAr}</h4>
                <p className="text-xs leading-relaxed text-[var(--color-muted)] dark:text-[#94A3B8]">{isEn ? item.bodyEn : item.bodyAr}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-rose-200 dark:border-[#1E3646] bg-rose-50/70 dark:bg-[#101D26] p-4 space-y-2">
            <h4 className="text-sm font-extrabold text-rose-950 dark:text-rose-200">{isEn ? 'When urgent help may be needed' : 'متى تحتاج مساعدة عاجلة؟'}</h4>
            <p className="text-xs leading-relaxed text-rose-900 dark:text-rose-100">
              {isEn
                ? 'If a child has severe breathing difficulty, becomes unresponsive, has a seizure, or you believe there is immediate danger, contact emergency services now. Do not wait for an app response.'
                : 'لو الطفل عنده صعوبة شديدة في التنفس، أو فقد الاستجابة، أو حدثت تشنجات، أو فيه خطر فوري، اتصل بالطوارئ الآن. ما تستناش رد من التطبيق.'}
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: EVIDENCE-BASED MEDICAL & PSYCHOLOGICAL GUIDES */}
      {activeTab === 'articles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-tab-enter">
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
                topLeftBadge={isEn ? 'Demo educational content · Not clinically reviewed' : 'محتوى توعوي تجريبي · غير معتمد كمراجعة طبية'}
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
                    className="min-h-[44px] px-2 text-xs font-extrabold text-[#0d9488] dark:text-[#A5F3FC] hover:underline cursor-pointer"
                  >
                    {isEn ? 'Read Now' : 'اقرأ الآن'}
                  </button>
                }
                bodyContent={
                  <p className="text-xs sm:text-sm font-semibold text-[var(--color-muted)] dark:text-[#94A3B8] leading-relaxed">
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
                    className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-extrabold border border-[var(--color-border)] dark:border-[#1E3646] bg-white dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] cursor-pointer"
                  >
                    {isSaved ? (isEn ? '🌟 Saved' : '🌟 محفوظ') : isEn ? '🔖 Save' : '🔖 حفظ'}
                  </button>
                }
              />
            );
          })}
        </div>
      )}

      {/* Compact Clinical Notice Strip (No Cross-Section Navigation) */}
      <div className="rounded-2xl border border-emerald-200/80 dark:border-[#1E3646] bg-emerald-50/60 dark:bg-[#101D26] px-4 py-2.5 text-xs font-bold text-emerald-950 dark:text-[#A5F3FC] flex flex-wrap items-center justify-between gap-2 soft-card-surface">
        <span>⚕️ {isEn ? 'Guidance & Appointment Coordination Hub (Text & Clinical Records Only)' : 'ركن التوعية الطبية وتنسيق المواعيد الأسرية (سجلات وأدلة نصية طبية فقط)'}</span>
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
                  🩺 {isEn ? 'Demo educational content · Not medical advice' : 'محتوى توعوي تجريبي · لا يُعد نصيحة طبية'}
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
