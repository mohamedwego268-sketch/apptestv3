import React, { useCallback, useEffect, useState } from 'react';
import {
  COUNTRY_CITIES_MAP,
  CountryCode,
  CurrencyCode,
  FamilySpaceState,
  getSuggestedCurrencyForCountry,
  locText,
} from '../domain/familySpaceCore';
import {
  ChildHomeScheduleRecord,
  FamilyHomeChildRecord,
  FamilyHomeRecord,
  acceptFamilyInvitation,
  createChildHomeWeeklySchedule,
  createFamilyHome,
  deleteChildHomeSchedule,
  fetchFamilyHomesWorkspace,
  linkCoParentAccountInSupabase,
  saveMyParentLocation,
  setChildCurrentHome,
  supabaseClient,
} from '../services/supabaseService';

interface FamilyHomesSectionProps {
  state: FamilySpaceState;
  onShowToast: (message: string) => void;
}

const WEEKDAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const WEEKDAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const FamilyHomesSection: React.FC<FamilyHomesSectionProps> = ({ state, onShowToast }) => {
  const isEn = state.language === 'en';
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [homes, setHomes] = useState<FamilyHomeRecord[]>([]);
  const [children, setChildren] = useState<FamilyHomeChildRecord[]>([]);
  const [schedules, setSchedules] = useState<ChildHomeScheduleRecord[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [inviteExpanded, setInviteExpanded] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerPhone, setPartnerPhone] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [acceptToken, setAcceptToken] = useState('');
  const [inviteSaving, setInviteSaving] = useState(false);

  const initialCountry = state.parentAccounts[state.activeParentAccount]?.country || state.country;
  const [personalCountry, setPersonalCountry] = useState<CountryCode>(initialCountry);
  const [personalCity, setPersonalCity] = useState<string>(() => COUNTRY_CITIES_MAP[initialCountry].some((city) => city.id === state.city) ? state.city : COUNTRY_CITIES_MAP[initialCountry][0]?.id || '');
  const [homeLabel, setHomeLabel] = useState('');
  const [homeCountry, setHomeCountry] = useState<CountryCode>(state.country);
  const [homeCity, setHomeCity] = useState<string>(state.city || COUNTRY_CITIES_MAP[state.country][0]?.id || '');
  const [scheduleChildId, setScheduleChildId] = useState('');
  const [scheduleHomeId, setScheduleHomeId] = useState('');
  const [scheduleWeekday, setScheduleWeekday] = useState('0');
  const [scheduleStart, setScheduleStart] = useState('08:00');
  const [scheduleEnd, setScheduleEnd] = useState('20:00');

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const result = await fetchFamilyHomesWorkspace();
    setLoading(false);
    if (result.error) {
      setLoadError(result.error);
      return;
    }
    setHomes(result.homes);
    setChildren(result.children);
    setSchedules(result.schedules);
    setScheduleChildId((current) => current || result.children[0]?.id || '');
    setScheduleHomeId((current) => current || result.homes.find((home) => !home.is_primary)?.id || result.homes[0]?.id || '');
  }, []);

  useEffect(() => {
    if (!expanded) return;
    void refresh();
  }, [expanded, refresh]);

  useEffect(() => {
    const client = supabaseClient;
    if (!expanded || !client || !state.verifiedFamilyId) return;
    const channel = client
      .channel('family-homes-workspace')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'family_homes', filter: `family_id=eq.${state.verifiedFamilyId}` }, () => void refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'child_home_schedules', filter: `family_id=eq.${state.verifiedFamilyId}` }, () => void refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'children', filter: `family_id=eq.${state.verifiedFamilyId}` }, () => void refresh())
      .subscribe();
    return () => { void client.removeChannel(channel); };
  }, [expanded, refresh, state.verifiedFamilyId]);

  const personalCities = COUNTRY_CITIES_MAP[personalCountry] || COUNTRY_CITIES_MAP.EG;
  const homeCities = COUNTRY_CITIES_MAP[homeCountry] || COUNTRY_CITIES_MAP.EG;

  const handleCreateCoParentInvite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setInviteSaving(true);
    const partnerRole = state.activeParentAccount === 'father' ? 'mother' : 'father';
    const result = await linkCoParentAccountInSupabase({
      familyId: state.verifiedFamilyId || 1,
      partnerRole,
      partnerName,
      partnerPhone,
      partnerEmail,
      country: state.country,
      method: 'qr_token',
    });
    setInviteSaving(false);
    if (!result.invitationCreated || !result.pairingToken) {
      onShowToast(result.error || (isEn ? 'Could not create the invitation.' : 'تعذر إنشاء الدعوة.'));
      return;
    }
    setInviteToken(result.pairingToken);
    onShowToast(isEn ? 'Invitation created. Share the secure code with the other parent.' : 'تم إنشاء الدعوة. شارك الرمز الآمن مع ولي الأمر الآخر.');
  };

  const handleAcceptCoParentInvite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setInviteSaving(true);
    const result = await acceptFamilyInvitation(acceptToken);
    setInviteSaving(false);
    if (!result.accepted) {
      const message = result.error || '';
      const friendly = message.includes('FAMILY_DATA_EXISTS')
        ? (isEn ? 'This account already has family or child data. A safe merge is needed before linking.' : 'الحساب ده يحتوي بالفعل على بيانات أسرة أو أطفال. نحتاج دمجًا آمنًا للبيانات قبل الربط.')
        : message;
      onShowToast(friendly || (isEn ? 'Invitation could not be accepted.' : 'تعذر قبول الدعوة.'));
      return;
    }
    onShowToast(isEn ? 'Family link confirmed. Reloading your shared family space…' : 'تم تأكيد ربط الحساب بالأسرة. جارٍ تحديث مساحة الأسرة المشتركة…');
    window.setTimeout(() => window.location.reload(), 700);
  };

  const handleCopyInviteToken = async () => {
    try {
      await navigator.clipboard.writeText(inviteToken);
      onShowToast(isEn ? 'Invitation code copied.' : 'تم نسخ رمز الدعوة.');
    } catch {
      onShowToast(isEn ? 'Select and copy the code manually.' : 'انسخ الرمز يدويًا من الحقل.');
    }
  };

  const handleSavePersonalLocation = async () => {
    setSaving(true);
    const result = await saveMyParentLocation({
      country: personalCountry,
      city: personalCity,
      currency: getSuggestedCurrencyForCountry(personalCountry),
      timezone: personalCountry === 'EG' ? 'Africa/Cairo' : 'Asia/Riyadh',
    });
    setSaving(false);
    onShowToast(result.error || (isEn ? 'Your private location has been saved.' : 'تم حفظ موقع حسابك الشخصي بشكل مستقل.'));
  };

  const handleAddHome = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    const result = await createFamilyHome({
      label: homeLabel || (isEn ? 'Additional home' : 'منزل إضافي'),
      country: homeCountry,
      city: homeCity,
      currency: getSuggestedCurrencyForCountry(homeCountry),
      timezone: homeCountry === 'EG' ? 'Africa/Cairo' : 'Asia/Riyadh',
    });
    setSaving(false);
    if (result.error) {
      onShowToast(result.error);
      return;
    }
    setHomeLabel('');
    await refresh();
    onShowToast(isEn ? 'The additional place has been added.' : 'تمت إضافة المكان بنجاح.');
  };

  const handleAssignCurrentHome = async (childId: string, homeId: string) => {
    setSaving(true);
    const result = await setChildCurrentHome({ childId, homeId: homeId || null });
    setSaving(false);
    if (result.error) onShowToast(result.error);
    else {
      await refresh();
      onShowToast(isEn ? 'Child location updated.' : 'تم تحديث مكان الطفل الحالي.');
    }
  };

  const handleAddSchedule = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!scheduleChildId || !scheduleHomeId) {
      onShowToast(isEn ? 'Choose a child and a home first.' : 'اختَر الطفل والمنزل أولاً.');
      return;
    }
    const home = homes.find((item) => item.id === scheduleHomeId);
    setSaving(true);
    const result = await createChildHomeWeeklySchedule({
      childId: scheduleChildId,
      homeId: scheduleHomeId,
      weekday: Number(scheduleWeekday),
      startTime: scheduleStart,
      endTime: scheduleEnd,
      timezone: home?.timezone || 'UTC',
    });
    setSaving(false);
    if (result.error) {
      onShowToast(result.error);
      return;
    }
    await refresh();
    onShowToast(isEn ? 'Weekly care schedule saved.' : 'تم حفظ جدول الإقامة الأسبوعي.');
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    setSaving(true);
    const result = await deleteChildHomeSchedule(scheduleId);
    setSaving(false);
    if (result.error) onShowToast(result.error);
    else {
      await refresh();
      onShowToast(isEn ? 'Schedule removed.' : 'تم حذف الموعد.');
    }
  };

  const homeName = (homeId: string) => homes.find((home) => home.id === homeId)?.label || (isEn ? 'Unknown place' : 'مكان غير معروف');
  const childName = (childId: string) => children.find((child) => child.id === childId)?.name || (isEn ? 'Child' : 'الطفل');

  return (
    <section className="rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] overflow-hidden" aria-label={isEn ? 'Family places' : 'أماكن الأسرة'}>
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="w-full min-h-[68px] px-4 py-3 flex items-center justify-between gap-3 text-start hover:bg-[var(--color-control-muted)]/50 transition-colors"
      >
        <span className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-300 flex items-center justify-center text-xl">⌂</span>
          <span className="min-w-0">
            <span className="block text-sm font-extrabold text-[var(--color-text)]">{isEn ? 'Family places' : 'أماكن الأسرة'}</span>
            <span className="block text-xs text-[var(--color-muted)] mt-0.5">{isEn ? 'Optional settings for more than one home' : 'إعداد اختياري عند وجود أكثر من مكان للطفل'}</span>
          </span>
        </span>
        <span className="text-xs font-bold text-[var(--color-muted)]">{expanded ? '−' : '+'}</span>
      </button>

      {expanded && (
        <div className="border-t border-[var(--color-border)] dark:border-[#1E3646] p-4 space-y-5">
          {loading && <p className="text-xs text-[var(--color-muted)]">{isEn ? 'Loading family places…' : 'جارٍ تحميل أماكن الأسرة…'}</p>}
          {loadError && <div className="rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 p-3 text-xs text-rose-700 dark:text-rose-300">{loadError}</div>}

          <div className="rounded-xl bg-[var(--color-control-muted)]/50 p-3 space-y-3">
            <div>
              <h3 className="text-sm font-extrabold text-[var(--color-text)]">{isEn ? 'Your personal location' : 'موقع حسابك الشخصي'}</h3>
              <p className="text-xs text-[var(--color-muted)] mt-1">{isEn ? 'This is kept separate from the other parent’s location.' : 'يُحفظ بشكل مستقل عن موقع ولي الأمر الآخر.'}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select value={personalCountry} onChange={(e) => { const value = e.target.value as CountryCode; setPersonalCountry(value); setPersonalCity(COUNTRY_CITIES_MAP[value][0]?.id || ''); }} className="min-h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)]">
                <option value="EG">{isEn ? 'Egypt' : 'مصر'}</option>
                <option value="SA">{isEn ? 'Saudi Arabia' : 'السعودية'}</option>
              </select>
              <select value={personalCity} onChange={(e) => setPersonalCity(e.target.value)} className="min-h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)]">
                {personalCities.map((city) => <option key={city.id} value={city.id}>{isEn ? city.nameEn : city.nameAr}</option>)}
              </select>
            </div>
            <button type="button" disabled={saving} onClick={() => void handleSavePersonalLocation()} className="min-h-10 px-4 rounded-xl bg-teal-600 text-white text-xs font-extrabold disabled:opacity-50">{isEn ? 'Save my location' : 'حفظ موقعي الشخصي'}</button>
          </div>

          <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
            <button type="button" onClick={() => setInviteExpanded((value) => !value)} aria-expanded={inviteExpanded} className="w-full min-h-12 px-3 py-2 flex items-center justify-between gap-2 text-start">
              <span className="text-sm font-extrabold text-[var(--color-text)]">{isEn ? 'Link the other parent' : 'ربط ولي الأمر الآخر'}</span>
              <span className="text-xs text-[var(--color-muted)]">{inviteExpanded ? '−' : '+'}</span>
            </button>
            {inviteExpanded && (
              <div className="border-t border-[var(--color-border)] p-3 space-y-4">
                <form onSubmit={handleCreateCoParentInvite} className="space-y-2.5">
                  <p className="text-xs text-[var(--color-muted)]">{isEn ? 'The family space is shared after the other parent accepts the invitation with their own verified account.' : 'تظل مساحة الأسرة واحدة، ولا يتم الربط إلا بعد قبول الطرف الآخر من حسابه الموثّق.'}</p>
                  <input value={partnerName} onChange={(e) => setPartnerName(e.target.value)} maxLength={80} placeholder={isEn ? 'Other parent’s name' : 'اسم ولي الأمر الآخر'} className="w-full min-h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)]" />
                  <input type="email" value={partnerEmail} onChange={(e) => setPartnerEmail(e.target.value)} placeholder={isEn ? 'Verified email address' : 'البريد الإلكتروني الذي سيستخدمه في الحساب'} className="w-full min-h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)]" />
                  <input type="tel" dir="ltr" value={partnerPhone} onChange={(e) => setPartnerPhone(e.target.value)} placeholder={isEn ? 'Phone with country code (optional if email is entered)' : 'رقم الجوال بمفتاح الدولة (اختياري عند إدخال البريد)'} className="w-full min-h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)]" />
                  <button type="submit" disabled={inviteSaving || (!partnerEmail.trim() && !partnerPhone.trim())} className="min-h-10 px-4 rounded-xl bg-indigo-600 text-white text-xs font-extrabold disabled:opacity-50">{isEn ? 'Create invitation' : 'إنشاء دعوة آمنة'}</button>
                </form>
                {inviteToken && (
                  <div className="rounded-xl bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900 p-3 space-y-2">
                    <div className="text-xs font-bold text-teal-800 dark:text-teal-200">{isEn ? 'Share this one-time invitation code' : 'شارك رمز الدعوة ده مع الطرف الآخر'}</div>
                    <div className="flex gap-2">
                      <input readOnly value={inviteToken} dir="ltr" className="min-w-0 flex-1 rounded-lg border border-teal-200 bg-white px-2 py-2 text-xs font-bold text-slate-800" />
                      <button type="button" onClick={() => void handleCopyInviteToken()} className="px-3 rounded-lg bg-teal-700 text-white text-xs font-bold">{isEn ? 'Copy' : 'نسخ'}</button>
                    </div>
                    <p className="text-[10px] text-teal-800 dark:text-teal-200">{isEn ? 'Valid for 48 hours. The recipient must sign in with the verified email or phone entered above.' : 'صالح لمدة 48 ساعة، ويجب على الطرف الآخر الدخول بالبريد أو رقم الجوال الموثّق المسجل في الدعوة.'}</p>
                  </div>
                )}
                <form onSubmit={handleAcceptCoParentInvite} className="pt-3 border-t border-[var(--color-border)] space-y-2">
                  <label className="block text-xs font-extrabold text-[var(--color-text)]">{isEn ? 'Have an invitation code?' : 'معاك رمز دعوة؟'}</label>
                  <input value={acceptToken} onChange={(e) => setAcceptToken(e.target.value.toUpperCase())} dir="ltr" placeholder="NKB-…" className="w-full min-h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-bold text-[var(--color-text)]" />
                  <button type="submit" disabled={inviteSaving || !acceptToken.trim()} className="min-h-10 px-4 rounded-xl bg-teal-600 text-white text-xs font-extrabold disabled:opacity-50">{isEn ? 'Accept invitation' : 'قبول الدعوة'}</button>
                </form>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-extrabold text-[var(--color-text)]">{isEn ? 'Family homes' : 'أماكن الطفل'}</h3>
              <p className="text-xs text-[var(--color-muted)] mt-1">{isEn ? 'The primary family home remains the default. Add another only if needed.' : 'منزل الأسرة هو الوضع الافتراضي. أضف مكانًا آخر فقط عند الحاجة.'}</p>
            </div>
            <div className="space-y-2">
              {homes.map((home) => (
                <div key={home.id} className="rounded-xl border border-[var(--color-border)] p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[var(--color-text)] truncate">{home.label} {home.is_primary && <span className="text-[10px] text-teal-700 dark:text-teal-300">· {isEn ? 'Default' : 'أساسي'}</span>}</div>
                    <div className="text-xs text-[var(--color-muted)] mt-1">{home.country === 'SA' ? '🇸🇦' : '🇪🇬'} {locText(home.city, state.language)} · {home.currency}</div>
                  </div>
                  <span className="text-[10px] text-[var(--color-muted)]">{home.is_primary ? (isEn ? 'Default' : 'افتراضي') : (isEn ? 'Additional' : 'إضافي')}</span>
                </div>
              ))}
              {!loading && homes.length === 0 && !loadError && <p className="text-xs text-[var(--color-muted)]">{isEn ? 'No family home is available yet.' : 'لا توجد أماكن مسجلة حتى الآن.'}</p>}
            </div>

            <form onSubmit={handleAddHome} className="rounded-xl border border-dashed border-[var(--color-border)] p-3 space-y-2.5">
              <h4 className="text-xs font-extrabold text-[var(--color-text)]">{isEn ? 'Add another place' : 'إضافة مكان آخر'}</h4>
              <input value={homeLabel} onChange={(e) => setHomeLabel(e.target.value)} maxLength={80} placeholder={isEn ? 'Place name (e.g. Mom’s home)' : 'اسم المكان (مثلاً: منزل ماما)'} className="w-full min-h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)]" />
              <div className="grid grid-cols-2 gap-2">
                <select value={homeCountry} onChange={(e) => { const value = e.target.value as CountryCode; setHomeCountry(value); setHomeCity(COUNTRY_CITIES_MAP[value][0]?.id || ''); }} className="min-h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)]">
                  <option value="EG">{isEn ? 'Egypt' : 'مصر'}</option>
                  <option value="SA">{isEn ? 'Saudi Arabia' : 'السعودية'}</option>
                </select>
                <select value={homeCity} onChange={(e) => setHomeCity(e.target.value)} className="min-h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)]">
                  {homeCities.map((city) => <option key={city.id} value={city.id}>{isEn ? city.nameEn : city.nameAr}</option>)}
                </select>
              </div>
              <button type="submit" disabled={saving || !homeCity} className="min-h-10 px-4 rounded-xl bg-teal-600 text-white text-xs font-extrabold disabled:opacity-50">{saving ? (isEn ? 'Saving…' : 'جارٍ الحفظ…') : (isEn ? 'Add place' : 'إضافة المكان')}</button>
            </form>
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-extrabold text-[var(--color-text)]">{isEn ? 'Child location & weekly routine' : 'مكان الطفل وجدول الإقامة'}</h3>
              <p className="text-xs text-[var(--color-muted)] mt-1">{isEn ? 'Set the current place and, if useful, a recurring weekly schedule.' : 'حدد مكان الطفل الحالي، ويمكنك إضافة جدول أسبوعي متكرر عند الحاجة.'}</p>
            </div>
            {children.map((child) => (
              <div key={child.id} className="rounded-xl border border-[var(--color-border)] p-3 space-y-2">
                <div className="text-sm font-bold text-[var(--color-text)]">{child.name}</div>
                <div className="flex gap-2">
                  <select value={child.current_home_id || ''} onChange={(e) => void handleAssignCurrentHome(child.id, e.target.value)} disabled={saving || homes.length === 0} className="flex-1 min-h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs text-[var(--color-text)]">
                    <option value="">{isEn ? 'Not set' : 'غير محدد'}</option>
                    {homes.map((home) => <option key={home.id} value={home.id}>{home.label}</option>)}
                  </select>
                  <span className="self-center text-[10px] text-[var(--color-muted)]">{isEn ? 'Current place' : 'المكان الحالي'}</span>
                </div>
              </div>
            ))}
            {children.length > 0 && homes.length > 0 && (
              <form onSubmit={handleAddSchedule} className="rounded-xl bg-[var(--color-control-muted)]/50 p-3 space-y-2.5">
                <h4 className="text-xs font-extrabold text-[var(--color-text)]">{isEn ? 'Add a weekly schedule' : 'إضافة موعد أسبوعي'}</h4>
                <div className="grid grid-cols-2 gap-2">
                  <select value={scheduleChildId} onChange={(e) => setScheduleChildId(e.target.value)} className="min-h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs text-[var(--color-text)]">
                    {children.map((child) => <option key={child.id} value={child.id}>{child.name}</option>)}
                  </select>
                  <select value={scheduleHomeId} onChange={(e) => setScheduleHomeId(e.target.value)} className="min-h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs text-[var(--color-text)]">
                    {homes.map((home) => <option key={home.id} value={home.id}>{home.label}</option>)}
                  </select>
                  <select value={scheduleWeekday} onChange={(e) => setScheduleWeekday(e.target.value)} className="min-h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs text-[var(--color-text)]">
                    {(isEn ? WEEKDAYS_EN : WEEKDAYS_AR).map((day, index) => <option key={day} value={index}>{day}</option>)}
                  </select>
                  <div className="grid grid-cols-2 gap-1">
                    <input type="time" value={scheduleStart} onChange={(e) => setScheduleStart(e.target.value)} className="min-w-0 min-h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-1 text-xs text-[var(--color-text)]" />
                    <input type="time" value={scheduleEnd} onChange={(e) => setScheduleEnd(e.target.value)} className="min-w-0 min-h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-1 text-xs text-[var(--color-text)]" />
                  </div>
                </div>
                <button type="submit" disabled={saving} className="min-h-10 px-4 rounded-xl bg-indigo-600 text-white text-xs font-extrabold disabled:opacity-50">{isEn ? 'Save weekly schedule' : 'حفظ الجدول الأسبوعي'}</button>
              </form>
            )}
            {schedules.length > 0 && (
              <div className="space-y-2">
                {schedules.map((schedule) => (
                  <div key={schedule.id} className="rounded-xl border border-[var(--color-border)] p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0 text-xs text-[var(--color-text)]">
                      <div className="font-bold">{childName(schedule.child_id)} · {homeName(schedule.home_id)}</div>
                      <div className="text-[var(--color-muted)] mt-1">{(isEn ? WEEKDAYS_EN : WEEKDAYS_AR)[schedule.weekday ?? 0]} · {schedule.start_time?.slice(0, 5)} – {schedule.end_time?.slice(0, 5)}</div>
                    </div>
                    <button type="button" disabled={saving} onClick={() => void handleDeleteSchedule(schedule.id)} className="text-xs font-bold text-rose-600 disabled:opacity-50">{isEn ? 'Remove' : 'حذف'}</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
