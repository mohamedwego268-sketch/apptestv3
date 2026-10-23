import React, { useState } from 'react';
import {
  ChildProfile,
  CountryCode,
  DEMO_OTP_CODE,
  ExtendedRoleCategory,
  FamilyInvitation,
  FamilyMember,
  InvitationStatus,
  LanguageCode,
  ParentAccountProfile,
  getDefaultPermissions,
  validatePhoneForCountry,
} from '../domain/familySpaceCore';
import { PrimaryCtaButton } from './DesignSystem';

interface FamilyPermissionsSectionProps {
  family: FamilyMember[];
  kids: ChildProfile[];
  parentAccounts: {
    mother: ParentAccountProfile;
    father: ParentAccountProfile;
  };
  invitations: FamilyInvitation[];
  disputeFreezeActive: boolean;
  language: LanguageCode;
  onOpenAddPersonModal: () => void;
  onOpenPermModal: (member: FamilyMember) => void;
  onDeletePerson: (id: number) => void;
  onToggleDisputeFreeze: (active: boolean) => void;
  onUpdateParentAccount: (
    parentId: 'mother' | 'father',
    patch: Partial<ParentAccountProfile>
  ) => void;
  onCreateInvitation: (invitation: Omit<FamilyInvitation, 'id' | 'createdAt'>) => void;
  onUpdateInvitationStatus: (invitationId: number, status: InvitationStatus) => void;
}

export const FamilyPermissionsSection: React.FC<FamilyPermissionsSectionProps> = ({
  family,
  kids,
  parentAccounts,
  invitations,
  disputeFreezeActive,
  language,
  onOpenAddPersonModal,
  onOpenPermModal,
  onDeletePerson,
  onToggleDisputeFreeze,
  onUpdateParentAccount,
  onCreateInvitation,
  onUpdateInvitationStatus,
}) => {
  const isEn = language === 'en';
  const [editingParent, setEditingParent] = useState<'mother' | 'father'>('mother');
  const currentParent = parentAccounts[editingParent];
  const [phoneInput, setPhoneInput] = useState(currentParent.phoneNumber);
  const [countryInput, setCountryInput] = useState<CountryCode>(currentParent.country);
  const [emailInput, setEmailInput] = useState(currentParent.email);
  const [otpInput, setOtpInput] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [verificationMsg, setVerificationMsg] = useState<{
    type: 'ok' | 'err';
    text: string;
  } | null>(null);

  const [invName, setInvName] = useState('');
  const [invRoleCat, setInvRoleCat] = useState<ExtendedRoleCategory>('nursery');
  const [invCountry, setInvCountry] = useState<CountryCode>('EG');
  const [invPhone, setInvPhone] = useState('');
  const [invEmail, setInvEmail] = useState('');
  const [invExpires, setInvExpires] = useState('2026-12-31');
  const [invKidIds, setInvKidIds] = useState<number[]>(kids[0] ? [kids[0].id] : []);
  const [invFeedback, setInvFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const handleSwitchParentTab = (pid: 'mother' | 'father') => {
    setEditingParent(pid);
    const p = parentAccounts[pid];
    setPhoneInput(p.phoneNumber);
    setCountryInput(p.country);
    setEmailInput(p.email);
    setOtpRequested(false);
    setOtpInput('');
    setVerificationMsg(null);
  };

  const handleRequestOtp = () => {
    const check = validatePhoneForCountry(phoneInput, countryInput);
    if (!check.valid) {
      setVerificationMsg({
        type: 'err',
        text: isEn ? check.errorEn || 'Invalid phone' : check.errorAr || 'رقم غير صالح',
      });
      return;
    }
    setOtpRequested(true);
    setVerificationMsg({
      type: 'ok',
      text: isEn
        ? `Simulated OTP sent to ${check.fullInternational}. Code: ${DEMO_OTP_CODE}`
        : `تم إرسال رمز التحقق التجريبي إلى ${check.fullInternational}. الرمز: ${DEMO_OTP_CODE}`,
    });
  };

  const handleVerifyOtpAndSaveParent = () => {
    const check = validatePhoneForCountry(phoneInput, countryInput);
    if (!check.valid) {
      setVerificationMsg({
        type: 'err',
        text: isEn ? check.errorEn || 'Invalid phone' : check.errorAr || 'رقم غير صالح',
      });
      return;
    }
    if (otpInput.trim() !== DEMO_OTP_CODE) {
      setVerificationMsg({
        type: 'err',
        text: isEn
          ? `Incorrect OTP code. Enter demo code ${DEMO_OTP_CODE}.`
          : `رمز التحقق غير صحيح. أدخل الرمز التجريبي ${DEMO_OTP_CODE}.`,
      });
      return;
    }
    onUpdateParentAccount(editingParent, {
      country: countryInput,
      phoneCode: countryInput === 'SA' ? '+966' : '+20',
      phoneNumber: check.normalized,
      phoneVerified: true,
      email: emailInput.trim() || currentParent.email,
      emailVerified: true,
      onboardingCompleted: true,
    });
    setOtpRequested(false);
    setOtpInput('');
    setVerificationMsg({
      type: 'ok',
      text: isEn
        ? '✅ Phone number (OTP) and Email verified!'
        : '✅ تم توثيق رقم الهاتف (OTP) والبريد الإلكتروني بنجاح!',
    });
  };

  const handleToggleInvitedKid = (kidId: number) => {
    setInvKidIds((prev) =>
      prev.includes(kidId) ? prev.filter((id) => id !== kidId) : [...prev, kidId]
    );
  };

  const roleLabelsMap: Record<ExtendedRoleCategory, { ar: string; en: string; sideAr: string }> = {
    mother: { ar: 'الأم', en: 'Mother', sideAr: 'الأسرة الأساسية' },
    father: { ar: 'الأب', en: 'Father', sideAr: 'الأسرة الأساسية' },
    grandparent: { ar: 'جد / جدة', en: 'Grandparent', sideAr: 'العائلة الممتدة' },
    uncle_aunt: { ar: 'عم / خال / عمة / خالة', en: 'Uncle / Aunt', sideAr: 'العائلة الممتدة' },
    nanny: { ar: 'مربية / جليسة أطفال', en: 'Nanny / Babysitter', sideAr: 'مقدمو الرعاية' },
    nursery: { ar: 'مشرفة حضانة', en: 'Nursery Supervisor', sideAr: 'الحضانة والمدرسة' },
    teacher: { ar: 'معلمة مدرسة', en: 'School Teacher', sideAr: 'الحضانة والمدرسة' },
    other: { ar: 'مقدم رعاية آخر', en: 'Caregiver', sideAr: 'مقدمو الرعاية' },
  };

  const handleSendInvitation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invName.trim()) {
      setInvFeedback({
        type: 'err',
        text: isEn ? 'Enter recipient name first.' : 'اكتب اسم المدعو أولاً.',
      });
      return;
    }
    const phoneCheck = validatePhoneForCountry(invPhone, invCountry);
    if (!phoneCheck.valid) {
      setInvFeedback({
        type: 'err',
        text: isEn ? phoneCheck.errorEn || 'Invalid phone' : phoneCheck.errorAr || 'رقم الهاتف غير صالح',
      });
      return;
    }
    if (invKidIds.length === 0) {
      setInvFeedback({
        type: 'err',
        text: isEn
          ? 'Select at least one child profile.'
          : 'حدد طفلاً واحدًا على الأقل لربط الصلاحية به.',
      });
      return;
    }

    const rInfo = roleLabelsMap[invRoleCat];
    const isSchoolOrNursery = invRoleCat === 'nursery' || invRoleCat === 'teacher' || invRoleCat === 'nanny';

    onCreateInvitation({
      recipientName: invName.trim(),
      roleLabel: isEn ? rInfo.en : rInfo.ar,
      roleCategory: invRoleCat,
      side: rInfo.sideAr,
      phoneCountry: invCountry,
      phoneNumber: phoneCheck.normalized,
      email: invEmail.trim() || undefined,
      assignedKidIds: invKidIds,
      permissions: {
        ...getDefaultPermissions(false),
        wishes: !isSchoolOrNursery,
        receiveReminders: true,
        submitCareUpdates: isSchoolOrNursery,
        emergencyAccess: true,
        viewEducational: true,
        uploadReports: isSchoolOrNursery,
      },
      status: 'pending',
      expiresAt: invExpires || '2026-12-31',
      invitedByParent: editingParent,
    });

    setInvName('');
    setInvPhone('');
    setInvEmail('');
    setInvFeedback({
      type: 'ok',
      text: isEn
        ? '✅ Invitation created with child-scoped permissions!'
        : '✅ تم إنشاء الدعوة وتحديد الأطفال المسموح بالوصول إليهم بنجاح!',
    });
  };

  return (
    <div className="space-y-5">
      {/* Top Quick Action Bar */}
      <div className="rounded-[24px] border border-purple-200/80 bg-purple-50/75 p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold text-purple-950">
          <span>👨‍👩‍👧‍👦 {isEn ? 'Mother & Father Accounts' : 'حسابات الأم والأب المستقلة'}</span>
          <span aria-hidden="true">·</span>
          <span>🛡️ {isEn ? 'Scoped Child Access' : 'صلاحيات مخصصة لكل طفل'}</span>
        </div>
        <PrimaryCtaButton
          variant="purple"
          size="sm"
          onClick={onOpenAddPersonModal}
        >
          + {isEn ? 'Quick Add Member' : 'إضافة فرد مباشرة'}
        </PrimaryCtaButton>
      </div>

      {/* SECTION A: Two Independent Parent Accounts (Mother & Father) */}
      <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-extrabold text-[var(--color-text)]">
            {isEn ? '1. Verified Parent Accounts (Mother & Father)' : '١. حسابات الوالدين وتوثيق الهوية'}
          </h3>

          <div className="flex items-center gap-1.5 bg-[var(--color-control-muted)] p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => handleSwitchParentTab('mother')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold ${
                editingParent === 'mother'
                  ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-2xs'
                  : 'text-[var(--color-muted)]'
              }`}
            >
              👩🏻 {isEn ? 'Mother (Sara)' : 'الأم (سارة)'}
            </button>
            <button
              type="button"
              onClick={() => handleSwitchParentTab('father')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold ${
                editingParent === 'father'
                  ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-2xs'
                  : 'text-[var(--color-muted)]'
              }`}
            >
              👨🏻 {isEn ? 'Father (Ahmed)' : 'الأب (أحمد)'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-extrabold text-[var(--color-text)] mb-1">
              {isEn ? 'Country & Code' : 'الدولة ومفتاح الهاتف'}
            </label>
            <select
              value={countryInput}
              onChange={(e) => setCountryInput(e.target.value as CountryCode)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-xs font-bold text-[var(--color-text)]"
            >
              <option value="EG">🇪🇬 مصر (+20 Egypt)</option>
              <option value="SA">🇸🇦 السعودية (+966 Saudi Arabia)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[var(--color-text)] mb-1">
              {isEn
                ? `Mobile (${countryInput === 'SA' ? '+966' : '+20'})`
                : `رقم الجوال (${countryInput === 'SA' ? '+966' : '+20'})`}
            </label>
            <input
              type="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder={countryInput === 'SA' ? '512345678' : '1012345678'}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-xs font-bold tabular-nums"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[var(--color-text)] mb-1">
              {isEn ? 'Linked Email' : 'البريد الإلكتروني'}
            </label>
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-xs font-bold"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200">
              {currentParent.phoneVerified
                ? `✅ ${currentParent.phoneCode} ${currentParent.phoneNumber}`
                : isEn
                ? 'Phone Unverified'
                : 'الهاتف غير موثق'}
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-sky-50 text-sky-900 border border-sky-200">
              {currentParent.emailVerified ? `✅ ${currentParent.email}` : 'البريد قيد التوثيق'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRequestOtp}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold border border-[var(--color-border)] bg-[var(--color-control-bg)] text-[var(--color-text)]"
            >
              🔐 {isEn ? 'Send OTP (123456)' : 'إرسال رمز OTP (123456)'}
            </button>
            {otpRequested && (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  className="w-24 rounded-xl border border-[var(--color-accent)] bg-white px-2.5 py-1.5 text-xs font-extrabold text-center tabular-nums"
                />
                <PrimaryCtaButton
                  variant="emerald"
                  size="sm"
                  onClick={handleVerifyOtpAndSaveParent}
                >
                  {isEn ? 'Verify & Save' : 'تأكيد وحفظ'}
                </PrimaryCtaButton>
              </div>
            )}
          </div>
        </div>

        {verificationMsg && (
          <div
            role="status"
            className={`rounded-2xl p-3 text-xs font-extrabold ${
              verificationMsg.type === 'ok'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-red-50 text-red-900 border border-red-200'
            }`}
          >
            {verificationMsg.text}
          </div>
        )}
      </div>

      {/* SECTION B: Child-Scoped Invitations & Active Members */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <form
          onSubmit={handleSendInvitation}
          className="rounded-[24px] border border-amber-200/80 bg-amber-50/60 p-5 space-y-3 shadow-2xs"
        >
          <h3 className="text-base font-extrabold text-[var(--color-text)]">
            {isEn ? '2. Invite Caregiver or Nursery' : '٢. دعوة فرد عائلة أو حضانة'}
          </h3>

          <div>
            <label className="block text-xs font-extrabold text-[var(--color-text)] mb-1">
              {isEn ? 'Recipient Name' : 'اسم المدعو / المشرفة'}
            </label>
            <input
              type="text"
              value={invName}
              onChange={(e) => setInvName(e.target.value)}
              placeholder={isEn ? 'Ms. Nourhan / Grandpa Ali' : 'مثال: أ. نورهان / جدو علي'}
              className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-xs font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-extrabold text-[var(--color-text)] mb-1">
                {isEn ? 'Role' : 'الصفة'}
              </label>
              <select
                value={invRoleCat}
                onChange={(e) => setInvRoleCat(e.target.value as ExtendedRoleCategory)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-white px-2.5 py-2 text-xs font-bold"
              >
                <option value="nursery">{isEn ? 'Nursery Supervisor' : 'مشرفة حضانة'}</option>
                <option value="teacher">{isEn ? 'School Teacher' : 'معلمة مدرسة'}</option>
                <option value="nanny">{isEn ? 'Nanny' : 'مربية أطفال'}</option>
                <option value="grandparent">{isEn ? 'Grandparent' : 'جد / جدة'}</option>
                <option value="uncle_aunt">{isEn ? 'Uncle / Aunt' : 'عم / خال / عمة / خالة'}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-extrabold text-[var(--color-text)] mb-1">
                {isEn ? 'Expires' : 'تنتهي في'}
              </label>
              <input
                type="date"
                value={invExpires}
                onChange={(e) => setInvExpires(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-white px-2.5 py-2 text-xs font-bold tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-extrabold text-[var(--color-text)] mb-1">
                {isEn ? 'Code' : 'الكود'}
              </label>
              <select
                value={invCountry}
                onChange={(e) => setInvCountry(e.target.value as CountryCode)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-white px-2 py-2 text-xs font-bold"
              >
                <option value="EG">+20 EG</option>
                <option value="SA">+966 SA</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-extrabold text-[var(--color-text)] mb-1">
                {isEn ? 'Phone Number' : 'رقم الجوال'}
              </label>
              <input
                type="tel"
                value={invPhone}
                onChange={(e) => setInvPhone(e.target.value)}
                placeholder={invCountry === 'SA' ? '512345678' : '1022334455'}
                className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-xs font-bold tabular-nums"
              />
            </div>
          </div>

          <div>
            <span className="block text-xs font-extrabold text-[var(--color-text)] mb-1">
              👶 {isEn ? 'Assigned Child(ren):' : 'الأطفال المسموح بالوصول إليهم:'}
            </span>
            <div className="flex flex-wrap gap-2">
              {kids.map((k) => (
                <label
                  key={k.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-white text-xs font-extrabold cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={invKidIds.includes(k.id)}
                    onChange={() => handleToggleInvitedKid(k.id)}
                    className="accent-[var(--color-accent)]"
                  />
                  <span>{k.name}</span>
                </label>
              ))}
            </div>
          </div>

          {invFeedback && (
            <div
              role="status"
              className={`rounded-xl p-2.5 text-xs font-extrabold ${
                invFeedback.type === 'ok'
                  ? 'bg-emerald-50 text-emerald-900'
                  : 'bg-red-50 text-red-900'
              }`}
            >
              {invFeedback.text}
            </div>
          )}

          <PrimaryCtaButton type="submit" variant="orange" size="sm" className="w-full">
            + {isEn ? 'Send Scoped Invitation' : 'إرسال دعوة مخصصة'}
          </PrimaryCtaButton>
        </form>

        {/* Invitations Lifecycle & Active Family Members (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3 shadow-2xs">
            <h3 className="text-base font-extrabold text-[var(--color-text)]">
              📨 {isEn ? `Invitations (${invitations.length})` : `الدعوات المرسلة (${invitations.length})`}
            </h3>
            {invitations.length === 0 ? (
              <div className="text-xs font-bold text-[var(--color-muted)]">
                {isEn ? 'No invitations sent yet.' : 'لا توجد دعوات مرسلة حاليًا.'}
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-border)]">
                {invitations.map((inv) => {
                  const assignedNames = kids
                    .filter((k) => inv.assignedKidIds.includes(k.id))
                    .map((k) => k.name)
                    .join('، ');
                  const statusBadge =
                    inv.status === 'accepted'
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                      : inv.status === 'pending'
                      ? 'bg-amber-50 text-amber-900 border-amber-200'
                      : 'bg-red-50 text-red-900 border-red-200';
                  return (
                    <div
                      key={inv.id}
                      className="py-3 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-[var(--color-text)]">
                            {inv.recipientName}
                          </span>
                          <span className={`px-2 py-0.5 rounded-lg text-[11px] font-extrabold border ${statusBadge}`}>
                            {inv.status === 'pending'
                              ? isEn
                                ? 'Pending'
                                : 'قيد الانتظار'
                              : inv.status === 'accepted'
                              ? isEn
                                ? 'Accepted'
                                : 'نشطة'
                              : isEn
                              ? 'Revoked'
                              : 'مسحوبة'}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-[var(--color-muted)] tabular-nums">
                          {inv.roleLabel} · 👶 <strong className="text-[var(--color-text)]">{assignedNames || '—'}</strong> · ⏳ {inv.expiresAt}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {inv.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => onUpdateInvitationStatus(inv.id, 'accepted')}
                              className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-600 text-white"
                            >
                              {isEn ? 'Accept' : 'قبول'}
                            </button>
                            <button
                              type="button"
                              onClick={() => onUpdateInvitationStatus(inv.id, 'cancelled')}
                              className="px-3 py-1.5 rounded-xl text-xs font-extrabold border border-[var(--color-border)] text-red-700"
                            >
                              {isEn ? 'Cancel' : 'إلغاء'}
                            </button>
                          </>
                        )}
                        {inv.status === 'accepted' && (
                          <button
                            type="button"
                            onClick={() => onUpdateInvitationStatus(inv.id, 'revoked')}
                            className="px-3 py-1.5 rounded-xl text-xs font-extrabold border border-red-200 bg-red-50 text-red-800"
                          >
                            {isEn ? 'Revoke' : 'سحب الصلاحية'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3 shadow-2xs">
            <h3 className="text-base font-extrabold text-[var(--color-text)]">
              👥 {isEn ? 'Active Family & Caregivers' : 'أفراد العائلة ومقدمو الرعاية'}
            </h3>

            {family.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-6 text-center text-sm font-bold text-[var(--color-muted)]">
                {isEn ? 'No family members added yet.' : 'لا يوجد أفراد مسجلون بعد.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {family.map((person) => {
                  const p = person.permissions;
                  const activeScopes: string[] = [];
                  if (p?.profile) activeScopes.push('الملف');
                  if (p?.routine) activeScopes.push('الروتين');
                  if (p?.calendar || person.events) activeScopes.push('المواعيد');
                  if (p?.wishes || person.wishes) activeScopes.push('الأمنيات');
                  if (p?.health && !disputeFreezeActive) activeScopes.push('الصحة 🩺');

                  const assignedKidsLabel = person.assignedKidIds?.length
                    ? kids
                        .filter((k) => person.assignedKidIds?.includes(k.id))
                        .map((k) => k.name)
                        .join('، ')
                    : 'كل الأطفال';

                  return (
                    <div
                      key={person.id}
                      className="rounded-2xl border border-teal-200/70 bg-teal-50/50 p-3.5 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-white shadow-2xs flex items-center justify-center text-2xl shrink-0">
                          {person.emoji || '👤'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-extrabold text-sm text-[var(--color-text)]">
                            {person.name}
                          </div>
                          <div className="text-xs font-bold text-[var(--color-muted)]">
                            {person.role} · 👶 {assignedKidsLabel}
                          </div>
                          <div className="text-[11px] font-bold text-teal-900 mt-0.5">
                            🔑 {activeScopes.length ? activeScopes.join(' · ') : 'بدون صلاحيات'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => onOpenPermModal(person)}
                          className="min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-extrabold border border-[var(--color-border)] bg-white text-[var(--color-text)]"
                        >
                          ⚙️ {isEn ? 'Permissions' : 'الصلاحيات'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeletePerson(person.id)}
                          aria-label={`حذف ${person.name}`}
                          className="min-h-[38px] px-2.5 py-1.5 rounded-xl text-xs font-extrabold border border-red-200 bg-white text-red-700"
                        >
                          {isEn ? 'Remove' : 'حذف'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compact Privacy & Parental Safeguard Toggle */}
      <div className="rounded-[24px] border border-rose-200/80 bg-rose-50/60 p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={disputeFreezeActive}
            onChange={(e) => onToggleDisputeFreeze(e.target.checked)}
            className="w-4 h-4 accent-[var(--color-accent)]"
          />
          <span className="text-xs font-extrabold text-[var(--color-text)]">
            🔒 {isEn
              ? 'Freeze Sensitive Health & Photo Access (Parental Safeguard)'
              : 'تفعيل تجميد الصلاحيات الحساسة (حماية السجلات الصحية والصور الخاصة)'}
          </span>
        </label>

        {disputeFreezeActive && (
          <span className="px-3 py-1 rounded-xl bg-amber-100 text-amber-950 text-xs font-extrabold" role="status">
            🛡️ {isEn ? 'Safeguard Active' : 'وضع الحماية نشط'}
          </span>
        )}
      </div>
    </div>
  );
};
