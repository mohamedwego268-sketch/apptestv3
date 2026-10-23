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
} from '../domain/familySpaceCore';
import { ThreeDChildAvatar, ThreeDIcon, ThreeDInteractiveScene } from './ThreeDVisuals';

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

  return (
    <section className="space-y-6" aria-label={isEn ? 'Medical & Child Health Hub' : 'الركن الطبي وصحة الطفل'}>
      {/* Distinct Clinical Emerald Hero Personality */}
      <div
        className="rounded-[24px] p-5 sm:p-7 border border-emerald-200/80 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
        style={{
          background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdfa 52%, #e0f2fe 100%)',
          boxShadow: '0 16px 34px -14px rgba(13, 148, 136, 0.14)',
        }}
      >
        <div className="space-y-2.5 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold text-teal-800">
            <span>🩺 {isEn ? 'Dedicated Medical & Child Wellness Hub' : 'الركن الطبي المتخصص وصحة الطفل (0–8 سنوات)'}</span>
            <span aria-hidden="true">·</span>
            <span dir="ltr" className="tabular-nums">
              {country === 'SA' ? '🇸🇦' : '🇪🇬'} {city}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
            {isEn
              ? 'Trusted Pediatricians, Vaccination Records & Evidence-Based Medical Guides'
              : 'أطباء الأطفال، سجل التطعيمات والنمو، والدليل الطبي والنفسي الموثق'}
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            {isEn
              ? 'Separated cleanly from entertainment media so parents can focus on verified pediatricians in your city, vaccination schedules, and peer-reviewed medical guidance.'
              : 'قسم طبي مستقل ومفصول بالكامل عن الترفيه والفيديوهات، يجمع لكِ أطباء الأطفال والاستشاريين في مدينتك، سجل تطعيمات ونمو أطفالك، والمقالات الطبية المراجعة علميًا.'}
          </p>

          {/* Medical Disclaimer Strip */}
          <div className="pt-1 text-xs font-semibold text-teal-900">
            ⚕️{' '}
            {isEn
              ? 'Clinical Disclaimer: Information and directories are for family guidance and appointment coordination, not emergency medical diagnosis.'
              : 'إخلاء مسؤولية طبي: المعلومات والأدلة هنا للتوعية وتنسيق المواعيد الأسرية ولا تغني عن الكشف الطبي المباشر أو الطوارئ.'}
          </div>
        </div>

        <div className="w-full lg:w-auto shrink-0">
          <ThreeDInteractiveScene
            variant="health-hub"
            title={isEn ? 'Verified Pediatric Care' : 'رعاية طبية ونفسية موثقة'}
            subtitle={isEn ? `Local Providers in ${city}` : `أطباء وعيادات في ${city}`}
          />
        </div>
      </div>

      {/* Segmented Navigation inside Medical Hub */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="inline-flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-teal-50/90 border border-teal-200/80"
          role="tablist"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'doctors'}
            onClick={() => setActiveTab('doctors')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'doctors'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-teal-900 hover:bg-teal-100/70'
            }`}
          >
            👩‍⚕️ {isEn ? `Doctors & Clinics (${filteredDoctors.length})` : `الأطباء والعيادات (${filteredDoctors.length})`}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'child_records'}
            onClick={() => setActiveTab('child_records')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'child_records'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-teal-900 hover:bg-teal-100/70'
            }`}
          >
            💉 {isEn ? `Vaccinations & Growth (${kids.length})` : `سجل التطعيمات والنمو (${kids.length})`}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'articles'}
            onClick={() => setActiveTab('articles')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'articles'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-teal-900 hover:bg-teal-100/70'
            }`}
          >
            📋 {isEn ? `Medical & Psychology Guides (${medicalArticles.length})` : `المقالات الطبية والنفسية (${medicalArticles.length})`}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterByUserCity((prev) => !prev)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors whitespace-nowrap shrink-0 ${
              filterByUserCity
                ? 'bg-teal-700 text-white border-teal-700'
                : 'bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)]'
            }`}
          >
            📍 {isEn ? `Near My City (${city})` : `في مدينتي فقط (${city})`}
          </button>
        </div>
      </div>

      {/* TAB 1: DOCTORS, PEDIATRICIANS & PSYCHOLOGISTS DIRECTORY */}
      {activeTab === 'doctors' && (
        <div className="space-y-4">
          <div className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isEn
                  ? 'Search pediatrician, speech therapist, child psychologist, or clinic...'
                  : 'ابحث عن طبيب أطفال، أخصائي تخاطب، استشاري نفسي، أو عيادة...'
              }
              aria-label={isEn ? 'Search doctors and clinics' : 'البحث في الأطباء والعيادات'}
              className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3.5 py-2.5 text-sm text-[var(--color-text)]"
            />
            <select
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              aria-label={isEn ? 'Filter by medical specialty' : 'تصفية حسب التخصص الطبي'}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3.5 py-2.5 text-xs font-bold text-[var(--color-text)]"
            >
              <option value="all">{isEn ? 'All Specialties' : 'كل التخصصات الطبية والنفسية'}</option>
              <option value="pediatrics">{isEn ? 'Pediatrics & Newborn Care' : 'طب الأطفال وحديثي الولادة'}</option>
              <option value="psychology">{isEn ? 'Child Psychology & Speech Therapy' : 'الإرشاد النفسي والتخاطب وتعديل السلوك'}</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDoctors.map((doc) => {
              const fee = currency === 'SAR' ? doc.priceSAR : doc.priceEGP;
              return (
                <article
                  key={doc.id}
                  className="rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 flex flex-col justify-between gap-4 hover:border-teal-500 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0">
                          <ThreeDIcon id="health" size={32} />
                        </div>
                        <div>
                          <div className="text-[11px] font-bold text-teal-800">
                            {doc.category === 'doctor'
                              ? isEn
                                ? 'Pediatrics & Physical Growth'
                                : 'طب الأطفال ومتابعة النمو'
                              : isEn
                              ? 'Child Psychology & Behavior'
                              : 'إرشاد نفسي وتعديل سلوك'}
                          </div>
                          <h3 className="text-base font-extrabold text-[var(--color-text)] leading-snug">
                            {isEn ? doc.nameEn : doc.name}
                          </h3>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                      {isEn ? doc.descriptionEn : doc.description}
                    </p>

                    <div className="text-xs text-[var(--color-muted)] space-y-1 pt-1 border-t border-[var(--color-border)]">
                      <div>
                        <strong className="text-[var(--color-text)]">
                          {isEn ? 'Location: ' : 'الموقع والمدينة: '}
                        </strong>
                        <span>{doc.city}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>
                          <strong className="text-[var(--color-text)]">
                            {isEn ? 'Rating: ' : 'التقييم: '}
                          </strong>
                          <span dir="ltr" className="tabular-nums font-bold text-amber-700">
                            🌟 {doc.rating} ({doc.reviewCount || 120})
                          </span>
                        </span>
                        <span dir="ltr" className="font-extrabold text-teal-800 tabular-nums">
                          {formatCurrency(fee, currency, language)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setBookingDoctor(doc)}
                      className="flex-1 px-4 py-2.5 rounded-xl text-xs font-extrabold bg-teal-700 text-white hover:bg-teal-800 transition-colors whitespace-nowrap"
                    >
                      📅 {isEn ? 'Book Consultation (Demo)' : 'حجز موعد وتنسيق تقويم الأسرة'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: CHILD VACCINATIONS, GROWTH & PRIVATE HEALTH RECORDS */}
      {activeTab === 'child_records' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {kids.map((kid) => {
            const age = calculateChildAge(kid.birth, language);
            return (
              <div
                key={kid.id}
                className="rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4"
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
                      {kid.name}
                    </h3>
                    <div className="text-xs text-[var(--color-muted)]">
                      {age.label} · {age.stageTitle}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="rounded-xl bg-teal-50/70 border border-teal-200/60 p-3">
                    <div className="text-[11px] text-teal-900 font-semibold">
                      {isEn ? 'Height' : 'الطول'}
                    </div>
                    <div dir="ltr" className="text-base font-extrabold text-teal-950 tabular-nums mt-0.5">
                      {kid.growthHeightCm ? `${kid.growthHeightCm} cm` : '—'}
                    </div>
                  </div>
                  <div className="rounded-xl bg-teal-50/70 border border-teal-200/60 p-3">
                    <div className="text-[11px] text-teal-900 font-semibold">
                      {isEn ? 'Weight' : 'الوزن'}
                    </div>
                    <div dir="ltr" className="text-base font-extrabold text-teal-950 tabular-nums mt-0.5">
                      {kid.growthWeightKg ? `${kid.growthWeightKg} kg` : '—'}
                    </div>
                  </div>
                  <div className="rounded-xl bg-teal-50/70 border border-teal-200/60 p-3">
                    <div className="text-[11px] text-teal-900 font-semibold">
                      {isEn ? 'Blood Type' : 'فصيلة الدم'}
                    </div>
                    <div dir="ltr" className="text-base font-extrabold text-teal-950 tabular-nums mt-0.5">
                      {kid.bloodType || 'O+'}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-[var(--color-control-muted)] p-3.5 space-y-1.5 text-xs">
                  <div className="font-extrabold text-[var(--color-text)]">
                    💉 {isEn ? 'Vaccination Status & Next Dose' : 'حالة التطعيمات والجرعة القادمة'}
                  </div>
                  <p className="text-[var(--color-muted)] leading-relaxed">
                    {kid.vaccinationsNote ||
                      (isEn
                        ? 'Routine vaccinations up to date.'
                        : 'التطعيمات الأساسية منتظمة وفق جدول وزارة الصحة.')}
                  </p>
                  <div className="pt-1 font-extrabold text-[var(--color-text)]">
                    🔒 {isEn ? 'Private Parent Medical Notes' : 'ملاحظات صحية وحساسية (خاصة بالوالدين)'}
                  </div>
                  <p className="text-[var(--color-muted)] leading-relaxed">
                    {kid.healthNotePrivate ||
                      (isEn ? 'No allergies recorded.' : 'لا توجد حساسية مسجلة.')}
                  </p>
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
                className="rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs text-teal-800 font-bold">
                    <span>
                      🩺 {article.reviewerCredentialsAr || 'مراجع علميًا بواسطة استشاري طب الأطفال'}
                    </span>
                    <span dir="ltr" className="tabular-nums">
                      {article.ageStage === 'all' ? '0–8 yrs' : `${article.ageStage} yrs`}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-[var(--color-text)] leading-snug">
                    {isEn ? article.titleEn : article.title}
                  </h3>
                  <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                    {isEn ? article.summaryEn : article.summary}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--color-border)]">
                  <button
                    type="button"
                    onClick={() => setReadingArticle(article)}
                    className="px-4 py-2 rounded-xl text-xs font-extrabold bg-teal-700 text-white hover:bg-teal-800 transition-colors"
                  >
                    📖 {isEn ? 'Read Full Medical Guide' : 'قراءة الدليل الطبي كاملًا'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onToggleSaveMedia(article.id);
                      onShowToast(
                        isSaved
                          ? isEn
                            ? 'Removed from saved medical guides'
                            : 'تمت الإزالة من المحفوظات الطبية'
                          : isEn
                          ? 'Saved to medical reference list'
                          : 'تم الحفظ في مرجعك الطبي'
                      );
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-bold border border-[var(--color-border)] text-[var(--color-text)]"
                  >
                    {isSaved ? (isEn ? '🌟 Saved' : '🌟 محفوظ') : isEn ? '🔖 Save' : '🔖 حفظ'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Doctor Appointment Booking Modal */}
      {bookingDoctor && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleConfirmBooking}
            className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-extrabold text-[var(--color-text)]">
                🩺 {isEn ? 'Book Pediatric / Specialist Appointment' : 'حجز موعد طبي وإضافته لتقويم الأسرة'}
              </h3>
              <button
                type="button"
                onClick={() => setBookingDoctor(null)}
                className="px-2.5 py-1 rounded-lg text-xs font-bold border border-[var(--color-border)]"
              >
                {isEn ? 'Close' : 'إغلاق'}
              </button>
            </div>

            <div className="rounded-xl bg-teal-50 p-3 text-xs text-teal-950 space-y-1">
              <div className="font-bold">{isEn ? bookingDoctor.nameEn : bookingDoctor.name}</div>
              <div>{bookingDoctor.city}</div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                {isEn ? 'Select Child' : 'الطفل'}
              </label>
              <select
                value={bookingChildId}
                onChange={(e) => setBookingChildId(Number(e.target.value))}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-xs text-[var(--color-text)]"
              >
                {kids.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                  {isEn ? 'Preferred Date' : 'تاريخ الموعد'}
                </label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-xs text-[var(--color-text)]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                  {isEn ? 'Time Slot' : 'الوقت المفضل'}
                </label>
                <input
                  type="text"
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-xs text-[var(--color-text)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                {isEn ? 'Symptoms or Consultation Note' : 'سبب الزيارة أو ملاحظات للطبيب'}
              </label>
              <textarea
                value={bookingNote}
                onChange={(e) => setBookingNote(e.target.value)}
                placeholder={isEn ? 'e.g., Routine checkup or vaccination...' : 'مثال: متابعة نمو دورية أو استشارة نوم...'}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] p-3 text-xs text-[var(--color-text)] min-h-[70px]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBookingDoctor(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-[var(--color-border)]"
              >
                {isEn ? 'Cancel' : 'إلغاء'}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-extrabold bg-teal-700 text-white"
              >
                {isEn ? 'Confirm & Add to Family Calendar' : 'تأكيد الحجز وإضافته للتقويم'}
              </button>
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
          <div className="w-full max-w-xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-4 max-h-[85vh] overflow-y-auto shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-teal-800">
                  🩺 {readingArticle.reviewerCredentialsAr || 'دليل طبي ونفسي مراجع علميًا'}
                </div>
                <h3 className="text-lg font-extrabold text-[var(--color-text)] mt-1">
                  {isEn ? readingArticle.titleEn : readingArticle.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReadingArticle(null)}
                className="px-3 py-1 rounded-lg text-xs font-bold border border-[var(--color-border)]"
              >
                {isEn ? 'Close' : 'إغلاق'}
              </button>
            </div>

            <div className="space-y-2.5 text-sm text-[var(--color-text)] leading-relaxed">
              {(isEn && readingArticle.bodyEn ? readingArticle.bodyEn : readingArticle.body).map(
                (para, idx) => (
                  <p key={idx} className="rounded-xl bg-[var(--color-control-muted)] p-3.5">
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
