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
import { ThreeDIcon } from './ThreeDVisuals';

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
  // Parent Account Verification State
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

  // Caregiver / Extended Family Invitation Builder State
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
        text: language === 'en' ? check.errorEn || 'Invalid phone' : check.errorAr || 'رقم غير صالح',
      });
      return;
    }
    setOtpRequested(true);
    setVerificationMsg({
      type: 'ok',
      text:
        language === 'en'
          ? `Simulated OTP sent to ${check.fullInternational}. Use demo code: ${DEMO_OTP_CODE}`
          : `تم إرسال رمز التحقق التجريبي (OTP) إلى ${check.fullInternational}. استخدم الرمز التوضيحي: ${DEMO_OTP_CODE}`,
    });
  };

  const handleVerifyOtpAndSaveParent = () => {
    const check = validatePhoneForCountry(phoneInput, countryInput);
    if (!check.valid) {
      setVerificationMsg({
        type: 'err',
        text: language === 'en' ? check.errorEn || 'Invalid phone' : check.errorAr || 'رقم غير صالح',
      });
      return;
    }
    if (otpInput.trim() !== DEMO_OTP_CODE) {
      setVerificationMsg({
        type: 'err',
        text:
          language === 'en'
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
      text:
        language === 'en'
          ? '✅ Phone number (OTP) and linked Email verified for this parent identity!'
          : '✅ تم توثيق رقم الهاتف (OTP) والبريد الإلكتروني المرتبط بنفس هوية الحساب بنجاح!',
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
        text: language === 'en' ? 'Enter recipient name first.' : 'اكتب اسم المدعو أولاً.',
      });
      return;
    }
    const phoneCheck = validatePhoneForCountry(invPhone, invCountry);
    if (!phoneCheck.valid) {
      setInvFeedback({
        type: 'err',
        text:
          language === 'en'
            ? phoneCheck.errorEn || 'Invalid phone'
            : phoneCheck.errorAr || 'رقم الهاتف غير صالح',
      });
      return;
    }
    if (invKidIds.length === 0) {
      setInvFeedback({
        type: 'err',
        text:
          language === 'en'
            ? 'Select at least one child profile for this invitation.'
            : 'حدد طفلاً واحدًا على الأقل لربط صلاحيات المدعو به.',
      });
      return;
    }

    const rInfo = roleLabelsMap[invRoleCat];
    const isSchoolOrNursery = invRoleCat === 'nursery' || invRoleCat === 'teacher' || invRoleCat === 'nanny';

    onCreateInvitation({
      recipientName: invName.trim(),
      roleLabel: language === 'en' ? rInfo.en : rInfo.ar,
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
      text:
        language === 'en'
          ? '✅ Invitation created with child-scoped permissions!'
          : '✅ تم إنشاء الدعوة وتحديد الأطفال المسموح بالوصول إليهم بنجاح!',
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ThreeDIcon id="family" size={38} />
          <div>
            <h2 className="text-xl font-bold text-[var(--color-text)]">
              {language === 'en'
                ? 'Family Identity, Verified Parent Accounts & Caregiver Access'
                : 'هوية الأسرة، توثيق حسابات الوالدين، ودعوات الحضانة والعائلة'}
            </h2>
            <p className="text-sm text-[var(--color-muted)]">
              {language === 'en'
                ? 'Two independent parent accounts (Mother & Father) plus child-specific invitations for grandparents, nannies, nurseries, and teachers.'
                : 'حسابان مستقلان للأم والأب مع توثيق الهاتف (OTP) والبريد، ودعوات مخصصة لكل طفل للأجداد والمربيات ومشرفي الحضانات والمدارس.'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenAddPersonModal}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--color-accent)] text-[var(--color-accent-contrast)] whitespace-nowrap shrink-0"
        >
          {language === 'en' ? '+ Quick Add Family Member' : '+ إضافة فرد مباشرة'}
        </button>
      </div>

      {/* SECTION A: Two Independent Parent Accounts (Mother & Father) + OTP/Email Verification */}
      <div className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[var(--color-text)]">
              {language === 'en'
                ? '1. Independent Parent Accounts & Identity Verification (Mother & Father)'
                : '١. حسابات الوالدين المستقلة وتوثيق الهوية (الأم والأب)'}
            </h3>
            <p className="text-xs text-[var(--color-muted)]">
              {language === 'en'
                ? 'Phone number and email address are linked to the same parent identity so verification works seamlessly across both channels.'
                : 'يرتبط رقم الهاتف والبريد الإلكتروني بنفس هوية الوالد لضمان التوثيق الموحد عبر الرسائل القصيرة (OTP) والبريد.'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-[var(--color-control-muted)] p-1 rounded-xl">
            <button
              type="button"
              onClick={() => handleSwitchParentTab('mother')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                editingParent === 'mother'
                  ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs'
                  : 'text-[var(--color-muted)]'
              }`}
            >
              {language === 'en' ? '👩🏻 Mother (Sara)' : '👩🏻 حساب الأم (سارة)'}
            </button>
            <button
              type="button"
              onClick={() => handleSwitchParentTab('father')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                editingParent === 'father'
                  ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs'
                  : 'text-[var(--color-muted)]'
              }`}
            >
              {language === 'en' ? '👨🏻 Father (Ahmed)' : '👨🏻 حساب الأب (أحمد)'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">
              {language === 'en' ? 'Country & Calling Code' : 'الدولة ومفتاح الهاتف الدولي'}
            </label>
            <select
              value={countryInput}
              onChange={(e) => setCountryInput(e.target.value as CountryCode)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-xs text-[var(--color-text)]"
            >
              <option value="EG">🇪🇬 مصر (+20 Egypt)</option>
              <option value="SA">🇸🇦 السعودية (+966 Saudi Arabia)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">
              {language === 'en'
                ? `Mobile Number (${countryInput === 'SA' ? '+966' : '+20'})`
                : `رقم الجوال (${countryInput === 'SA' ? '+966' : '+20'})`}
            </label>
            <input
              type="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder={countryInput === 'SA' ? '512345678' : '1012345678'}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-xs tabular-nums"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">
              {language === 'en' ? 'Linked Email Address' : 'البريد الإلكتروني المرتبط بالحساب'}
            </label>
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-xs"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 font-semibold">
              {currentParent.phoneVerified
                ? language === 'en'
                  ? `✅ Phone Verified (${currentParent.phoneCode} ${currentParent.phoneNumber})`
                  : `✅ الهاتف موثّق (${currentParent.phoneCode} ${currentParent.phoneNumber})`
                : language === 'en'
                ? 'Phone Unverified'
                : 'الهاتف غير موثق'}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-900 border border-sky-200 font-semibold">
              {currentParent.emailVerified
                ? language === 'en'
                  ? `✅ Email Linked (${currentParent.email})`
                  : `✅ البريد مرتبط (${currentParent.email})`
                : 'البريد قيد التوثيق'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRequestOtp}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-[var(--color-border)] bg-[var(--color-control-bg)] text-[var(--color-text)]"
            >
              {language === 'en'
                ? 'Send Simulated OTP (123456)'
                : 'إرسال رمز تحقق OTP تجريبي (123456)'}
            </button>
            {otpRequested && (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  className="w-24 rounded-lg border border-[var(--color-accent)] bg-[var(--color-surface)] px-2.5 py-1.5 text-xs font-bold text-center tabular-nums"
                />
                <button
                  type="button"
                  onClick={handleVerifyOtpAndSaveParent}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--color-accent)] text-[var(--color-accent-contrast)]"
                >
                  {language === 'en' ? 'Verify & Save' : 'تأكيد الرمز والحفظ'}
                </button>
              </div>
            )}
          </div>
        </div>

        {verificationMsg && (
          <div
            role="status"
            className={`rounded-xl p-3 text-xs font-semibold ${
              verificationMsg.type === 'ok'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-red-50 text-red-900 border border-red-200'
            }`}
          >
            {verificationMsg.text}
          </div>
        )}
      </div>

      {/* SECTION B: Child-Scoped Invitations for Extended Family, Nurseries & School Teachers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <form
          onSubmit={handleSendInvitation}
          className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3"
        >
          <h3 className="text-base font-bold text-[var(--color-text)]">
            {language === 'en'
              ? '2. Invite Caregiver, Nursery or Relative'
              : '٢. دعوة فرد عائلة أو مشرفة حضانة/مدرسة'}
          </h3>
          <p className="text-xs text-[var(--color-muted)]">
            {language === 'en'
              ? 'Assign specific children so school or nursery staff only access the child(ren) in their care.'
              : 'حدد الطفل أو الأطفال المشمولين بالدعوة بحيث لا تطلع الحضانة أو المدرسة إلا على الطفل المخصص لها فقط.'}
          </p>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">
              {language === 'en' ? 'Recipient Name' : 'اسم المدعو / المشرفة'}
            </label>
            <input
              type="text"
              value={invName}
              onChange={(e) => setInvName(e.target.value)}
              placeholder={language === 'en' ? 'e.g., Ms. Nourhan / Grandpa Ali' : 'مثال: أ. نورهان / جدو علي'}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-1.5 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">
                {language === 'en' ? 'Role' : 'الصفة / الدور'}
              </label>
              <select
                value={invRoleCat}
                onChange={(e) => setInvRoleCat(e.target.value as ExtendedRoleCategory)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-2.5 py-1.5 text-xs"
              >
                <option value="nursery">{language === 'en' ? 'Nursery Supervisor' : 'مشرفة حضانة'}</option>
                <option value="teacher">{language === 'en' ? 'School Teacher' : 'معلمة مدرسة'}</option>
                <option value="nanny">{language === 'en' ? 'Nanny / Babysitter' : 'مربية أطفال'}</option>
                <option value="grandparent">{language === 'en' ? 'Grandparent' : 'جد / جدة'}</option>
                <option value="uncle_aunt">{language === 'en' ? 'Uncle / Aunt' : 'عم / خال / عمة / خالة'}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">
                {language === 'en' ? 'Access Expires' : 'تاريخ انتهاء الصلاحية'}
              </label>
              <input
                type="date"
                value={invExpires}
                onChange={(e) => setInvExpires(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-2.5 py-1.5 text-xs tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">
                {language === 'en' ? 'Code' : 'الكود'}
              </label>
              <select
                value={invCountry}
                onChange={(e) => setInvCountry(e.target.value as CountryCode)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-2 py-1.5 text-xs"
              >
                <option value="EG">+20 EG</option>
                <option value="SA">+966 SA</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">
                {language === 'en' ? 'Phone Number' : 'رقم الهاتف للدعوة'}
              </label>
              <input
                type="tel"
                value={invPhone}
                onChange={(e) => setInvPhone(e.target.value)}
                placeholder={invCountry === 'SA' ? '512345678' : '1022334455'}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-1.5 text-xs tabular-nums"
              />
            </div>
          </div>

          {/* Child-Specific Scope Checkboxes */}
          <div>
            <span className="block text-xs font-semibold text-[var(--color-text)] mb-1">
              {language === 'en'
                ? 'Assigned Child(ren) Only:'
                : 'الأطفال المسموح له بالوصول إليهم فقط:'}
            </span>
            <div className="flex flex-wrap gap-2">
              {kids.map((k) => (
                <label
                  key={k.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-control-bg)] text-xs cursor-pointer"
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
              className={`rounded-xl p-2.5 text-xs font-semibold ${
                invFeedback.type === 'ok'
                  ? 'bg-emerald-50 text-emerald-900'
                  : 'bg-red-50 text-red-900'
              }`}
            >
              {invFeedback.text}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2 rounded-xl text-xs font-bold bg-[var(--color-accent)] text-[var(--color-accent-contrast)]"
          >
            {language === 'en' ? '+ Send Scoped Invitation' : '+ إرسال دعوة مخصصة الصلاحيات'}
          </button>
        </form>

        {/* Invitations Lifecycle & Active Family Members (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Active Invitations Lifecycle */}
          <div className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
            <h3 className="text-base font-bold text-[var(--color-text)]">
              {language === 'en'
                ? `Invitation Lifecycle (${invitations.length})`
                : `حالة الدعوات المرسلة ودورة حياتها (${invitations.length})`}
            </h3>
            {invitations.length === 0 ? (
              <div className="text-xs text-[var(--color-muted)]">
                {language === 'en' ? 'No invitations sent yet.' : 'لا توجد دعوات مرسلة حاليًا.'}
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
                          <span className="text-sm font-bold text-[var(--color-text)]">
                            {inv.recipientName}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${statusBadge}`}>
                            {inv.status === 'pending'
                              ? language === 'en'
                                ? 'Pending'
                                : 'قيد الانتظار'
                              : inv.status === 'accepted'
                              ? language === 'en'
                                ? 'Accepted'
                                : 'مقبولة ونشطة'
                              : inv.status === 'revoked'
                              ? language === 'en'
                                ? 'Revoked'
                                : 'مسحوبة الصلاحية'
                              : inv.status === 'cancelled'
                              ? language === 'en'
                                ? 'Cancelled'
                                : 'ملغاة'
                              : 'منتهية'}
                          </span>
                        </div>
                        <div className="text-xs text-[var(--color-muted)] tabular-nums">
                          {inv.roleLabel} · {inv.phoneCountry === 'SA' ? '+966' : '+20'} {inv.phoneNumber} ·{' '}
                          {language === 'en' ? 'Assigned Kids: ' : 'مقتصر على الطفل: '}
                          <strong className="text-[var(--color-text)]">
                            {assignedNames || 'غير محدد'}
                          </strong>{' '}
                          · تنتهي: {inv.expiresAt}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {inv.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => onUpdateInvitationStatus(inv.id, 'accepted')}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white"
                            >
                              {language === 'en' ? 'Simulate Accept' : 'محاكاة قبول الدعوة'}
                            </button>
                            <button
                              type="button"
                              onClick={() => onUpdateInvitationStatus(inv.id, 'cancelled')}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-[var(--color-border)] text-red-700"
                            >
                              {language === 'en' ? 'Cancel' : 'إلغاء الدعوة'}
                            </button>
                          </>
                        )}
                        {inv.status === 'accepted' && (
                          <button
                            type="button"
                            onClick={() => onUpdateInvitationStatus(inv.id, 'revoked')}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-red-200 bg-red-50 text-red-800"
                          >
                            {language === 'en' ? 'Revoke Access' : 'سحب وإيقاف الصلاحية فورًا'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Family Members List */}
          <div className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
            <h3 className="text-base font-bold text-[var(--color-text)]">
              {language === 'en'
                ? 'Active Family Members & Granular Access Scope'
                : 'أفراد العائلة ومقدمو الرعاية النشطون ونطاق الصلاحيات'}
            </h3>

            {family.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-muted)]">
                {language === 'en'
                  ? 'No family members added yet.'
                  : 'لا يوجد أفراد مسجلون بعد. أضف فردًا لتخصيص صلاحياته.'}
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-border)]">
                {family.map((person) => {
                  const p = person.permissions;
                  const activeScopes: string[] = [];
                  if (p?.profile) activeScopes.push('الملف الأساسي');
                  if (p?.routine) activeScopes.push('الروتين');
                  if (p?.calendar || person.events) activeScopes.push('المناسبات');
                  if (p?.wishes || person.wishes) activeScopes.push('الأمنيات');
                  if (p?.growth) activeScopes.push('النمو');
                  if (p?.receiveReminders) activeScopes.push('التذكيرات');
                  if (p?.submitCareUpdates) activeScopes.push('تقارير الرعاية');
                  if (p?.health && !disputeFreezeActive) activeScopes.push('الصحة 🩺');
                  if (p?.privatePhotos && !disputeFreezeActive) activeScopes.push('الصور الخاصة 🖼️');

                  const assignedKidsLabel = person.assignedKidIds?.length
                    ? kids
                        .filter((k) => person.assignedKidIds?.includes(k.id))
                        .map((k) => k.name)
                        .join('، ')
                    : 'جميع الأطفال';

                  return (
                    <div
                      key={person.id}
                      className="py-3.5 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                          style={{ background: 'var(--color-icon-tint)' }}
                          aria-hidden="true"
                        >
                          {person.emoji || '👤'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-[var(--color-text)]">
                            {person.name}
                          </div>
                          <div className="text-xs text-[var(--color-muted)]">
                            {person.role} · {person.side} · الأطفال: {assignedKidsLabel}
                          </div>
                          <div className="text-xs text-[var(--color-muted)] mt-0.5">
                            <span className="font-semibold text-[var(--color-text)]">
                              النطاق المسموح:{' '}
                            </span>
                            {activeScopes.length ? activeScopes.join(' · ') : 'بدون صلاحيات اطلاع'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => onOpenPermModal(person)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] whitespace-nowrap"
                        >
                          {language === 'en' ? 'Permissions' : 'تخصيص الصلاحيات'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeletePerson(person.id)}
                          aria-label={`حذف ${person.name}`}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-[var(--color-border)] bg-[var(--color-surface)] text-red-700 whitespace-nowrap"
                        >
                          {language === 'en' ? 'Remove' : 'حذف'}
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

      {/* Privacy & Parental Dispute Safeguard Panel */}
      <div className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
        <h3 className="text-base font-bold text-[var(--color-text)]">
          {language === 'en'
            ? '🔒 Privacy & Parental Dispute Safeguard'
            : '🔒 حدود الخصوصية وحماية الخلاف الأسري'}
        </h3>
        <p className="text-xs text-[var(--color-muted)] leading-relaxed">
          {language === 'en'
            ? 'Family membership does not grant blanket access to sensitive child data. Health records and private photos default to private. If parents disagree on granting sensitive access, enabling the safeguard below freezes sensitive disclosures immediately.'
            : 'عضوية الفرد في مساحة الأسرة لا تعني رؤية كل تفاصيل الطفل. السجلات الصحية والصور الخاصة مغلقة افتراضيًا. وفي حال وجود خلاف بين أولياء الأمور حول منح صلاحية حساسة، يوقف النظام كشف البيانات الحساسة فورًا.'}
        </p>

        <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--color-control-muted)] cursor-pointer">
          <input
            type="checkbox"
            checked={disputeFreezeActive}
            onChange={(e) => onToggleDisputeFreeze(e.target.checked)}
            className="mt-1 accent-[var(--color-accent)]"
          />
          <span className="text-xs text-[var(--color-text)] leading-relaxed">
            <strong className="block">
              تفعيل تجميد الصلاحيات الحساسة (حالة خلاف بين الوالدين)
            </strong>
            يمنع مشاركة السجلات الصحية والصور الخاصة مع أي طرف إضافي حتى اتساق موافقة الوالدين.
          </span>
        </label>

        {disputeFreezeActive && (
          <div
            className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900"
            role="status"
          >
            وضع الحماية نشط حاليًا: تم إغلاق الوصول إلى السجلات الصحية والصور الخاصة لجميع الأفراد الإضافيين.
          </div>
        )}
      </div>
    </div>
  );
};
