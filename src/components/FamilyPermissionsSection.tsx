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
  locText,
  validatePhoneForCountry,
} from '../domain/familySpaceCore';
import { PrimaryCtaButton } from './DesignSystem';

export type SixFamilyRoleId =
  | 'father'
  | 'mother'
  | 'uncle'
  | 'aunt'
  | 'grandmother'
  | 'grandfather';

export interface SixFamilyRolePreset {
  id: SixFamilyRoleId;
  labelAr: string;
  labelEn: string;
  emoji: string;
  sideAr: string;
  category: ExtendedRoleCategory;
  badgeColor: string;
  defaultPerms: {
    profile: boolean;
    routine: boolean;
    calendar: boolean;
    wishes: boolean;
    growth: boolean;
    health: boolean;
    privatePhotos: boolean;
    emergencyAccess: boolean;
  };
}

export const SIX_FAMILY_ROLES: SixFamilyRolePreset[] = [
  {
    id: 'father',
    labelAr: 'الأب (Father)',
    labelEn: 'Father',
    emoji: '👨🏻‍💼',
    sideAr: 'الأسرة الأساسية',
    category: 'father',
    badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
    defaultPerms: {
      profile: true,
      routine: true,
      calendar: true,
      wishes: true,
      growth: true,
      health: true,
      privatePhotos: true,
      emergencyAccess: true,
    },
  },
  {
    id: 'mother',
    labelAr: 'الأم (Mother)',
    labelEn: 'Mother',
    emoji: '👩🏻‍💼',
    sideAr: 'الأسرة الأساسية',
    category: 'mother',
    badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
    defaultPerms: {
      profile: true,
      routine: true,
      calendar: true,
      wishes: true,
      growth: true,
      health: true,
      privatePhotos: true,
      emergencyAccess: true,
    },
  },
  {
    id: 'grandfather',
    labelAr: 'الجد (Grandfather)',
    labelEn: 'Grandfather',
    emoji: '👴🏻',
    sideAr: 'العائلة الممتدة',
    category: 'grandparent',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    defaultPerms: {
      profile: true,
      routine: false,
      calendar: true,
      wishes: true,
      growth: true,
      health: false,
      privatePhotos: true,
      emergencyAccess: true,
    },
  },
  {
    id: 'grandmother',
    labelAr: 'الجدة (Grandmother)',
    labelEn: 'Grandmother',
    emoji: '👵🏻',
    sideAr: 'العائلة الممتدة',
    category: 'grandparent',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
    defaultPerms: {
      profile: true,
      routine: true,
      calendar: true,
      wishes: true,
      growth: true,
      health: true,
      privatePhotos: true,
      emergencyAccess: true,
    },
  },
  {
    id: 'uncle',
    labelAr: 'العم / الخال (Uncle)',
    labelEn: 'Uncle',
    emoji: '🧔🏻',
    sideAr: 'العائلة الممتدة',
    category: 'uncle_aunt',
    badgeColor: 'bg-sky-100 text-sky-900 border-sky-300',
    defaultPerms: {
      profile: true,
      routine: false,
      calendar: true,
      wishes: true,
      growth: false,
      health: false,
      privatePhotos: false,
      emergencyAccess: true,
    },
  },
  {
    id: 'aunt',
    labelAr: 'العمة / الخالة (Aunt)',
    labelEn: 'Aunt',
    emoji: '👩🏻',
    sideAr: 'العائلة الممتدة',
    category: 'uncle_aunt',
    badgeColor: 'bg-pink-100 text-pink-900 border-pink-300',
    defaultPerms: {
      profile: true,
      routine: true,
      calendar: true,
      wishes: true,
      growth: false,
      health: false,
      privatePhotos: false,
      emergencyAccess: true,
    },
  },
];

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
  activeParentAccount?: 'mother' | 'father';
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
  onInstantJoinFamilyMember?: (member: Omit<FamilyMember, 'id'>) => void;
  onShowToast?: (msg: string) => void;
}

/** Deterministic SVG QR Code generator for the Family Code */
const FamilyQrCodeSvg: React.FC<{ code: string }> = ({ code }) => {
  const seed = code.split('').reduce((acc, ch, i) => acc + ch.charCodeAt(0) * (i + 1), 0);
  const size = 11;
  const cells: boolean[][] = [];
  for (let r = 0; r < size; r++) {
    cells[r] = [];
    for (let c = 0; c < size; c++) {
      const isTopLeft = r < 3 && c < 3;
      const isTopRight = r < 3 && c >= size - 3;
      const isBottomLeft = r >= size - 3 && c < 3;
      if (isTopLeft || isTopRight || isBottomLeft) {
        cells[r][c] = true;
      } else {
        cells[r][c] = ((seed + r * 17 + c * 31) % 3) !== 0;
      }
    }
  }

  return (
    <svg
      viewBox="0 0 130 130"
      className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl bg-white p-2.5 border-2 border-teal-500/40 shadow-sm mx-auto"
      role="img"
      aria-label={`QR Code ${code}`}
    >
      <rect width="130" height="130" rx="12" fill="#ffffff" />
      {cells.map((row, rIdx) =>
        row.map((filled, cIdx) =>
          filled ? (
            <rect
              key={`${rIdx}-${cIdx}`}
              x={10 + cIdx * 10}
              y={10 + rIdx * 10}
              width="8.5"
              height="8.5"
              rx="2"
              fill={
                (rIdx < 3 && cIdx < 3) ||
                (rIdx < 3 && cIdx >= size - 3) ||
                (rIdx >= size - 3 && cIdx < 3)
                  ? '#0f766e'
                  : '#1e293b'
              }
            />
          ) : null
        )
      )}
    </svg>
  );
};

export const FamilyPermissionsSection: React.FC<FamilyPermissionsSectionProps> = ({
  family,
  kids,
  parentAccounts,
  invitations,
  disputeFreezeActive,
  language,
  activeParentAccount = 'mother',
  onOpenAddPersonModal,
  onOpenPermModal,
  onDeletePerson,
  onToggleDisputeFreeze,
  onUpdateParentAccount,
  onCreateInvitation,
  onUpdateInvitationStatus,
  onInstantJoinFamilyMember,
  onShowToast,
}) => {
  const isEn = language === 'en';
  const editingParent: 'mother' | 'father' = activeParentAccount;
  const currentParent = parentAccounts[editingParent];
  const [phoneInput, setPhoneInput] = useState(currentParent.phoneNumber);
  const [countryInput, setCountryInput] = useState<CountryCode>(currentParent.country);
  const [emailInput, setEmailInput] = useState(currentParent.email);
  const [otpInput, setOtpInput] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);

  React.useEffect(() => {
    const p = parentAccounts[editingParent];
    setPhoneInput(p.phoneNumber);
    setCountryInput(p.country);
    setEmailInput(p.email);
    setOtpRequested(false);
    setOtpInput('');
    setVerificationMsg(null);
  }, [editingParent, parentAccounts]);
  const [verificationMsg, setVerificationMsg] = useState<{
    type: 'ok' | 'err';
    text: string;
  } | null>(null);

  // Family Account Integration (QR Code, Invite Link & Manual Code)
  const [familyInviteCode, setFamilyInviteCode] = useState<string>('FS-FAM-8824');
  const [qrMode, setQrMode] = useState<'generate' | 'scan'>('generate');
  const [scannerStatus, setScannerStatus] = useState<'idle' | 'scanning' | 'linked'>('idle');
  const [joinName, setJoinName] = useState<string>('مريم (الأم)');
  const [joinRole, setJoinRole] = useState<SixFamilyRoleId>('mother');
  const [manualCodeInput, setManualCodeInput] = useState<string>('FS-FAM-8824');
  const [linkCopiedMsg, setLinkCopiedMsg] = useState<string | null>(null);

  // Scoped Invitation State
  const [invName, setInvName] = useState('');
  const [invRoleCat, setInvRoleCat] = useState<SixFamilyRoleId>('grandmother');
  const [invCountry, setInvCountry] = useState<CountryCode>('EG');
  const [invPhone, setInvPhone] = useState('');
  const [invEmail, setInvEmail] = useState('');
  const [invExpires, setInvExpires] = useState('2026-12-31');
  const [invKidIds, setInvKidIds] = useState<number[]>(kids[0] ? [kids[0].id] : []);
  const [invFeedback, setInvFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const inviteUrl = `https://familyspace.app/join/${familyInviteCode}`;

  const handleCopyText = (text: string, label: string) => {
    try {
      navigator.clipboard?.writeText(text)?.catch(() => {});
    } catch {
      // Fallback
    }
    setLinkCopiedMsg(label);
    onShowToast?.(label);
    window.setTimeout(() => setLinkCopiedMsg(null), 2600);
  };

  const handleSimulateQrScanAndJoin = () => {
    setScannerStatus('scanning');
    window.setTimeout(() => {
      const preset = SIX_FAMILY_ROLES.find((r) => r.id === joinRole) || SIX_FAMILY_ROLES[1];
      const memberName = joinName.trim() || (isEn ? preset.labelEn : preset.labelAr);
      if (onInstantJoinFamilyMember) {
        onInstantJoinFamilyMember({
          name: memberName,
          role: isEn ? preset.labelEn : preset.labelAr,
          side: preset.sideAr,
          emoji: preset.emoji,
          wishes: preset.defaultPerms.wishes,
          events: preset.defaultPerms.calendar,
          roleCategory: preset.category,
          assignedKidIds: kids.map((k) => k.id),
          permissions: {
            ...getDefaultPermissions(joinRole === 'father' || joinRole === 'mother'),
            ...preset.defaultPerms,
            receiveReminders: true,
            viewEducational: true,
          },
        });
      }
      setScannerStatus('linked');
      setLinkCopiedMsg(
        isEn
          ? `✅ QR Scanned! ${memberName} (${preset.labelEn}) joined the family account!`
          : `✅ تم مسح الـ QR بنجاح! انضم «${memberName}» بصفة (${preset.labelAr}) لحساب الأسرة فورًا!`
      );
    }, 600);
  };

  const handleManualCodeJoin = () => {
    if (!manualCodeInput.trim()) {
      setLinkCopiedMsg(isEn ? '⚠️ Please enter the family code first.' : '⚠️ أدخل كود الأسرة اليدوي أولاً.');
      return;
    }
    const preset = SIX_FAMILY_ROLES.find((r) => r.id === joinRole) || SIX_FAMILY_ROLES[1];
    const memberName = joinName.trim() || (isEn ? preset.labelEn : preset.labelAr);
    if (onInstantJoinFamilyMember) {
      onInstantJoinFamilyMember({
        name: memberName,
        role: isEn ? preset.labelEn : preset.labelAr,
        side: preset.sideAr,
        emoji: preset.emoji,
        wishes: preset.defaultPerms.wishes,
        events: preset.defaultPerms.calendar,
        roleCategory: preset.category,
        assignedKidIds: kids.map((k) => k.id),
        permissions: {
          ...getDefaultPermissions(joinRole === 'father' || joinRole === 'mother'),
          ...preset.defaultPerms,
          receiveReminders: true,
          viewEducational: true,
        },
      });
    }
    setScannerStatus('linked');
    setLinkCopiedMsg(
      isEn
        ? `✅ Linked via code ${manualCodeInput}! ${memberName} (${preset.labelEn}) joined!`
        : `✅ تم الربط بالكود ${manualCodeInput}! انضم «${memberName}» بصفة (${preset.labelAr})!`
    );
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
        ? `Verification code sent to ${check.fullInternational}.`
        : `تم إرسال رمز التحقق إلى ${check.fullInternational}.`,
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
          ? 'Incorrect OTP verification code. Please check and try again.'
          : 'رمز التحقق غير صحيح. يرجى التأكد والمحاولة مرة أخرى.',
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

  const handleSendInvitation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invName.trim()) {
      setInvFeedback({
        type: 'err',
        text: isEn ? 'Enter recipient name first.' : 'اكتب اسم فرد العائلة أولاً.',
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
    }

    const preset = SIX_FAMILY_ROLES.find((r) => r.id === invRoleCat) || SIX_FAMILY_ROLES[3];

    onCreateInvitation({
      recipientName: invName.trim(),
      roleLabel: isEn ? preset.labelEn : preset.labelAr,
      roleCategory: preset.category,
      side: preset.sideAr,
      phoneCountry: invCountry,
      phoneNumber: phoneCheck.normalized,
      email: invEmail.trim() || undefined,
      assignedKidIds: invKidIds.length ? invKidIds : kids.map((k) => k.id),
      permissions: {
        ...getDefaultPermissions(invRoleCat === 'father' || invRoleCat === 'mother'),
        ...preset.defaultPerms,
        receiveReminders: true,
        viewEducational: true,
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
        ? `✅ Invitation created for ${preset.labelEn}!`
        : `✅ تم إرسال الدعوة بصفة (${preset.labelAr}) وتخصيص الصلاحيات بنجاح!`,
    });
  };

  return (
    <div className="space-y-4">
      {/* ====================================================================
          MODULE 2A: FAMILY ACCOUNT INTEGRATION (QR CODE + INVITE LINK + MANUAL CODE)
          Flow: User A (Dad) generates QR -> User B (Mom / Family) scans -> Joins!
          ==================================================================== */}
      <div className="rounded-[20px] border border-teal-200/90 bg-gradient-to-br from-teal-50/90 via-white to-purple-50/70 p-4 sm:p-5 space-y-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold bg-teal-100 text-teal-900">
              📲 {isEn ? 'Instant Family Account Linking (QR & Code)' : 'ربط حساب الأسرة الفوري (QR Code · رابط · كود يدوي)'}
            </span>
            <h2 className="text-sm sm:text-base font-extrabold text-[var(--color-text)] mt-1">
              {isEn
                ? 'Link Father, Mother & Extended Family in One Tap'
                : 'ربط حساب الأب والأم وأفراد العائلة بخطوة واحدة'}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 bg-[var(--color-control-muted)] p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setQrMode('generate')}
              className={`px-3 py-1.5 rounded-lg text-[11.5px] font-extrabold transition-all ${
                qrMode === 'generate'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              👨🏻 {isEn ? '1. Dad Generates QR' : '١. الأب يولّد رمز QR'}
            </button>
            <button
              type="button"
              onClick={() => setQrMode('scan')}
              className={`px-3 py-1.5 rounded-lg text-[11.5px] font-extrabold transition-all ${
                qrMode === 'scan'
                  ? 'bg-[var(--color-accent)] text-white shadow-2xs'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              👩🏻 {isEn ? '2. Mom Scans QR to Join' : '٢. الأم تمسح الـ QR للانضمام'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
          {/* Left Column: User A (Dad) QR Generator + Invite Link + Manual Code */}
          <div
            className={`rounded-2xl border p-4 flex flex-col sm:flex-row items-center gap-4 shadow-2xs transition-all ${
              qrMode === 'generate'
                ? 'border-teal-400 dark:border-[#2DD4BF] bg-white/95 dark:bg-[#101D26] ring-2 ring-teal-500/20'
                : 'border-teal-200/80 dark:border-[#1E3646] bg-white/85 dark:bg-[#101D26]/80'
            }`}
          >
            <div className="shrink-0 text-center space-y-1.5">
              <FamilyQrCodeSvg code={familyInviteCode} />
              <div className="text-[10.5px] font-extrabold text-teal-900 dark:text-[#2DD4BF] tabular-nums">
                {familyInviteCode}
              </div>
            </div>

            <div className="flex-1 space-y-2.5 w-full">
              <div className="text-xs font-extrabold text-[var(--color-text)]">
                👨🏻‍💼 {isEn ? 'User A (Father — Ahmed): Share QR or Code' : 'المستخدم (أ) الأب أحمد: شارك رمز الـ QR أو الكود'}
              </div>

              {/* Manual Code Box */}
              <div className="rounded-xl bg-teal-50/80 dark:bg-[#142430] border border-teal-200 dark:border-[#1E3646] px-3 py-2 flex items-center justify-between gap-2">
                <div>
                  <div className="text-[10px] font-bold text-[var(--color-muted)]">
                    {isEn ? 'Manual Family Code' : 'كود الربط اليدوي للأسرة'}
                  </div>
                  <div dir="ltr" className="text-xs font-mono font-extrabold text-teal-950 dark:text-[#F8FAFC] tracking-wider">
                    {familyInviteCode}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    id="copy-family-code-btn"
                    type="button"
                    onClick={() =>
                      handleCopyText(
                        familyInviteCode,
                        isEn ? 'Manual family code copied' : 'تم نسخ الكود اليدوي بنجاح'
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#101D26] border border-teal-200 dark:border-[#1E3646] text-[11px] font-extrabold text-teal-900 dark:text-[#A5F3FC] cursor-pointer"
                  >
                    {isEn ? 'Copy Code' : 'نسخ الكود'}
                  </button>
                  <button
                    id="generate-new-qr-btn"
                    type="button"
                    onClick={() => {
                      const next = `FS-FAM-${Math.floor(1000 + Math.random() * 9000)}`;
                      setFamilyInviteCode(next);
                      setManualCodeInput(next);
                      const msg = isEn
                        ? `New Family QR Generated (${next})`
                        : `تم توليد رمز QR جديد للأسرة (${next})`;
                      setLinkCopiedMsg(msg);
                      onShowToast?.(msg);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-teal-700 text-white text-[11px] font-extrabold flex items-center gap-1 cursor-pointer"
                    title={isEn ? 'Generate new QR code' : 'توليد رمز QR جديد'}
                  >
                    <span>🔄</span>
                    <span>{isEn ? 'New' : 'جديد'}</span>
                  </button>
                </div>
              </div>

              {/* Invite Link Box */}
              <div className="rounded-xl bg-slate-50 dark:bg-[#142430] border border-[var(--color-border)] dark:border-[#1E3646] px-3 py-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-[var(--color-muted)]">
                    {isEn ? 'Direct Invite Link' : 'رابط الدعوة المباشر'}
                  </div>
                  <div dir="ltr" className="text-[11px] font-mono font-bold text-[var(--color-text)] truncate">
                    {inviteUrl}
                  </div>
                </div>
                <button
                  id="copy-invite-link-btn"
                  type="button"
                  onClick={() =>
                    handleCopyText(
                      inviteUrl,
                      isEn ? 'Family invite link copied' : 'تم نسخ الرابط بنجاح — جاهز للمشاركة مع الأسرة'
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#101D26] border border-[var(--color-border)] dark:border-[#1E3646] text-[11px] font-extrabold text-[var(--color-text)] shrink-0 cursor-pointer"
                >
                  🔗 {isEn ? 'Copy Link' : 'نسخ الرابط'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: User B (Mom / Family Member) Interactive QR Scanner & Role Join */}
          <div
            className={`rounded-2xl border p-4 space-y-3 shadow-2xs flex flex-col justify-between transition-all ${
              qrMode === 'scan'
                ? 'border-rose-400 dark:border-[#FDA4AF] bg-white/95 dark:bg-[#101D26] ring-2 ring-rose-500/20'
                : 'border-rose-200/80 dark:border-[#1E3646] bg-white/85 dark:bg-[#101D26]/80'
            }`}
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-extrabold text-[var(--color-text)]">
                  👩🏻‍💼 {isEn ? 'User B (Mom / Family): Scan QR or Enter Code' : 'المستخدم (ب) الأم أو القريب: امسح الـ QR أو أدخل الكود'}
                </div>
                <span className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-800 text-[10px] font-extrabold">
                  {scannerStatus === 'scanning'
                    ? isEn
                      ? '⏳ Scanning...'
                      : '⏳ جاري المسح...'
                    : scannerStatus === 'linked'
                    ? isEn
                      ? '✅ Linked!'
                      : '✅ متصل بالأسرة'
                    : isEn
                    ? 'Ready to Scan'
                    : 'جاهز للمسح'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10.5px] font-extrabold text-[var(--color-muted)] mb-1">
                    {isEn ? 'Member Name' : 'اسم المنضم للأسرة'}
                  </label>
                  <input
                    type="text"
                    value={joinName}
                    onChange={(e) => setJoinName(e.target.value)}
                    placeholder={isEn ? 'Sara (Mom) / Grandma' : 'مثال: سارة (الأم) / تيتة كريمة'}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-2.5 py-1.5 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] font-extrabold text-[var(--color-muted)] mb-1">
                    {isEn ? 'Family Role (6 Roles)' : 'الصفة العائلية (٦ أدوار)'}
                  </label>
                  <select
                    aria-label={isEn ? 'Select Family Role' : 'اختر الصفة العائلية'}
                    value={joinRole}
                    onChange={(e) => {
                      const nextRole = e.target.value as SixFamilyRoleId;
                      setJoinRole(nextRole);
                      const preset = SIX_FAMILY_ROLES.find((r) => r.id === nextRole);
                      if (preset) {
                        setJoinName(
                          nextRole === 'mother'
                            ? 'سارة (الأم)'
                            : nextRole === 'father'
                            ? 'أحمد (الأب)'
                            : nextRole === 'grandmother'
                            ? 'تيتة كريمة (الجدة)'
                            : nextRole === 'grandfather'
                            ? 'جدو محمود (الجد)'
                            : nextRole === 'uncle'
                            ? 'عمو كريم (العم/الخال)'
                            : 'خالتو سلمى (العمة/الخالة)'
                        );
                      }
                    }}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-2.5 py-1.5 text-xs font-bold"
                  >
                    {SIX_FAMILY_ROLES.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.emoji} {isEn ? r.labelEn : r.labelAr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Manual Code Input Row */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  dir="ltr"
                  value={manualCodeInput}
                  onChange={(e) => setManualCodeInput(e.target.value)}
                  placeholder="FS-FAM-8824"
                  aria-label={isEn ? 'Manual Family Code' : 'كود الأسرة اليدوي'}
                  className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-1.5 text-xs font-mono font-bold text-center"
                />
                <button
                  type="button"
                  onClick={handleManualCodeJoin}
                  className="min-h-[36px] px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-extrabold whitespace-nowrap"
                >
                  🔑 {isEn ? 'Join by Code' : 'ربط بالكود'}
                </button>
              </div>
            </div>

            <div className="pt-1 flex flex-wrap items-center gap-2">
              <PrimaryCtaButton
                variant="rose"
                size="sm"
                onClick={handleSimulateQrScanAndJoin}
                className="flex-1"
              >
                📷 {isEn ? 'Scan Dad’s QR & Join Instantly' : 'مسح رمز QR وانضمام فوري لحساب الأسرة'}
              </PrimaryCtaButton>
              <button
                type="button"
                onClick={onOpenAddPersonModal}
                className="min-h-[36px] px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-white text-[11px] font-extrabold text-[var(--color-text)]"
              >
                + {isEn ? 'Custom Add' : 'إضافة مخصصة'}
              </button>
            </div>
          </div>
        </div>

        {linkCopiedMsg && (
          <div
            role="status"
            className="rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2 text-xs font-extrabold text-emerald-950 flex items-center justify-between"
          >
            <span>{linkCopiedMsg}</span>
            <button
              type="button"
              onClick={() => setLinkCopiedMsg(null)}
              className="text-emerald-800 font-bold text-xs"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* ====================================================================
          MODULE 2B: ROLE MANAGEMENT & PERMISSIONS MATRIX (6 FAMILY ROLES)
          Father, Mother, Uncle, Aunt, Grandmother, Grandfather
          ==================================================================== */}
      <div className="rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5 space-y-3.5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-[var(--color-text)]">
              🛡️ {isEn ? 'Role Management & Permissions (6 Family Roles)' : 'إدارة الأدوار والصلاحيات العائلية (الأب · الأم · الجد · الجدة · العم/الخال · العمة/الخالة)'}
            </h3>
            <p className="text-[11px] font-semibold text-[var(--color-muted)]">
              {isEn
                ? 'Tap any role card below to quickly add or inspect default permissions for that family role.'
                : 'اضغط على أي دور لإضافته سريعًا أو تخصيص صلاحياته لكل طفل داخل مساحة الأسرة.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {SIX_FAMILY_ROLES.map((rolePreset) => {
            const countInFamily = family.filter(
              (m) =>
                m.role.includes(rolePreset.labelEn) ||
                m.role.includes(rolePreset.labelAr.split(' ')[0])
            ).length;
            return (
              <div
                key={rolePreset.id}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-control-muted)]/55 p-3 flex flex-col justify-between gap-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xl">{rolePreset.emoji}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${rolePreset.badgeColor}`}>
                      {countInFamily} {isEn ? 'active' : 'مسجل'}
                    </span>
                  </div>
                  <div className="text-xs font-extrabold text-[var(--color-text)]">
                    {isEn ? rolePreset.labelEn : rolePreset.labelAr}
                  </div>
                  <div className="text-[10px] font-semibold text-[var(--color-muted)] leading-snug">
                    {rolePreset.defaultPerms.health
                      ? isEn
                        ? 'Full Care + Medical + Routine'
                        : 'صلاحية كاملة + صحة + روتين'
                      : rolePreset.defaultPerms.routine
                      ? isEn
                        ? 'Routine + Calendar + Wishes'
                        : 'روتين + مواعيد + أمنيات'
                      : isEn
                      ? 'Calendar + Wishes + Emergency'
                      : 'مواعيد + أمنيات + طوارئ'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setJoinRole(rolePreset.id);
                    setJoinName(isEn ? rolePreset.labelEn : rolePreset.labelAr);
                    if (onInstantJoinFamilyMember) {
                      onInstantJoinFamilyMember({
                        name: isEn ? rolePreset.labelEn : rolePreset.labelAr,
                        role: isEn ? rolePreset.labelEn : rolePreset.labelAr,
                        side: rolePreset.sideAr,
                        emoji: rolePreset.emoji,
                        wishes: rolePreset.defaultPerms.wishes,
                        events: rolePreset.defaultPerms.calendar,
                        roleCategory: rolePreset.category,
                        assignedKidIds: kids.map((k) => k.id),
                        permissions: {
                          ...getDefaultPermissions(
                            rolePreset.id === 'father' || rolePreset.id === 'mother'
                          ),
                          ...rolePreset.defaultPerms,
                          receiveReminders: true,
                          viewEducational: true,
                        },
                      });
                      setLinkCopiedMsg(
                        isEn
                          ? `✅ Added ${rolePreset.labelEn} with preset permissions!`
                          : `✅ تمت إضافة دور (${rolePreset.labelAr}) بصلاحياته المعتمدة!`
                      );
                    }
                  }}
                  className="w-full py-1.5 px-2 rounded-xl bg-white hover:bg-[var(--color-accent-soft)] border border-[var(--color-border)] text-[11px] font-extrabold text-[var(--color-text)] transition-colors"
                >
                  + {isEn ? `Add ${rolePreset.labelEn}` : `إضافة ${rolePreset.labelAr.split(' ')[0]}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION A: Active Parent Account Verification */}
      <div className="rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5 space-y-3.5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <h3 className="text-sm sm:text-base font-extrabold text-[var(--color-text)]">
            {isEn ? '1. Verified Parent Account & Identity' : '١. حساب ولي الأمر وتوثيق الهوية'}
          </h3>

          <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-[var(--color-control-muted)] text-[var(--color-text)] border border-[var(--color-border)]">
            {editingParent === 'father'
              ? isEn
                ? '👨🏻 Father (Ahmed)'
                : '👨🏻 الأب (أحمد)'
              : isEn
              ? '👩🏻 Mother (Sara)'
              : '👩🏻 الأم (سارة)'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <div>
            <label className="block text-[11px] font-extrabold text-[var(--color-text)] mb-1">
              {isEn ? 'Country & Code' : 'الدولة ومفتاح الهاتف'}
            </label>
            <select
              value={countryInput}
              onChange={(e) => setCountryInput(e.target.value as CountryCode)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-1.5 text-xs font-bold text-[var(--color-text)]"
            >
              <option value="EG">🇪🇬 مصر (+20 Egypt)</option>
              <option value="SA">🇸🇦 السعودية (+966 Saudi Arabia)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-[var(--color-text)] mb-1">
              {isEn
                ? `Mobile (${countryInput === 'SA' ? '+966' : '+20'})`
                : `رقم الجوال (${countryInput === 'SA' ? '+966' : '+20'})`}
            </label>
            <input
              type="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder={countryInput === 'SA' ? '512345678' : '1012345678'}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-1.5 text-xs font-bold tabular-nums"
            />
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-[var(--color-text)] mb-1">
              {isEn ? 'Linked Email' : 'البريد الإلكتروني'}
            </label>
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-1.5 text-xs font-bold"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200">
              {currentParent.phoneVerified
                ? `✅ ${currentParent.phoneCode} ${currentParent.phoneNumber}`
                : isEn
                ? 'Phone Unverified'
                : 'الهاتف غير موثق'}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-900 border border-sky-200">
              {currentParent.emailVerified ? `✅ ${currentParent.email}` : 'البريد قيد التوثيق'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRequestOtp}
              className="min-h-[34px] px-3 py-1 rounded-xl text-[11px] font-extrabold border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] text-[var(--color-text)] cursor-pointer"
            >
              🔐 {isEn ? 'Send Verification Code' : 'إرسال رمز التحقق'}
            </button>
            {otpRequested && (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  className="w-22 rounded-xl border border-[var(--color-accent)] bg-white px-2 py-1 text-xs font-extrabold text-center tabular-nums"
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
            className={`rounded-xl p-2.5 text-xs font-extrabold ${
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
          className="rounded-[20px] border border-amber-200/80 bg-amber-50/60 p-4 space-y-2.5 shadow-2xs"
        >
          <h3 className="text-sm sm:text-base font-extrabold text-[var(--color-text)]">
            {isEn ? '2. Invite Relative by Phone' : '٢. دعوة فرد عائلة عبر الجوال'}
          </h3>

          <div>
            <label className="block text-[11px] font-extrabold text-[var(--color-text)] mb-1">
              {isEn ? 'Recipient Name' : 'اسم فرد العائلة'}
            </label>
            <input
              type="text"
              value={invName}
              onChange={(e) => setInvName(e.target.value)}
              placeholder={isEn ? 'Grandpa Ali / Aunt Salma' : 'مثال: جدو علي / خالتو سلمى'}
              className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-extrabold text-[var(--color-text)] mb-1">
                {isEn ? 'Family Role' : 'الصفة العائلية'}
              </label>
              <select
                value={invRoleCat}
                onChange={(e) => setInvRoleCat(e.target.value as SixFamilyRoleId)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-white px-2 py-1.5 text-xs font-bold"
              >
                {SIX_FAMILY_ROLES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {isEn ? r.labelEn : r.labelAr}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-extrabold text-[var(--color-text)] mb-1">
                {isEn ? 'Expires' : 'تنتهي في'}
              </label>
              <input
                type="date"
                value={invExpires}
                onChange={(e) => setInvExpires(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-white px-2 py-1.5 text-xs font-bold tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-extrabold text-[var(--color-text)] mb-1">
                {isEn ? 'Code' : 'الكود'}
              </label>
              <select
                value={invCountry}
                onChange={(e) => setInvCountry(e.target.value as CountryCode)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-white px-2 py-1.5 text-xs font-bold"
              >
                <option value="EG">+20 EG</option>
                <option value="SA">+966 SA</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-[11px] font-extrabold text-[var(--color-text)] mb-1">
                {isEn ? 'Phone Number' : 'رقم الجوال'}
              </label>
              <input
                type="tel"
                value={invPhone}
                onChange={(e) => setInvPhone(e.target.value)}
                placeholder={invCountry === 'SA' ? '512345678' : '1022334455'}
                className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-bold tabular-nums"
              />
            </div>
          </div>

          <div>
            <span className="block text-[11px] font-extrabold text-[var(--color-text)] mb-1">
              👶 {isEn ? 'Assigned Child(ren):' : 'الأطفال المسموح بالوصول إليهم:'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {kids.map((k) => (
                <label
                  key={k.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--color-border)] bg-white text-xs font-extrabold cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={invKidIds.includes(k.id)}
                    onChange={() => handleToggleInvitedKid(k.id)}
                    className="accent-[var(--color-accent)]"
                  />
                  <span>{locText(k.name, language)}</span>
                </label>
              ))}
            </div>
          </div>

          {invFeedback && (
            <div
              role="status"
              className={`rounded-xl p-2 text-xs font-extrabold ${
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
        <div className="lg:col-span-2 space-y-3.5">
          <div className="rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-2.5 shadow-2xs">
            <h3 className="text-sm sm:text-base font-extrabold text-[var(--color-text)]">
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
                    .map((k) => locText(k.name, language))
                    .join(isEn ? ', ' : '، ');
                  const statusBadge =
                    inv.status === 'accepted'
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                      : inv.status === 'pending'
                      ? 'bg-amber-50 text-amber-900 border-amber-200'
                      : 'bg-red-50 text-red-900 border-red-200';
                  return (
                    <div
                      key={inv.id}
                      className="py-2.5 flex flex-wrap items-center justify-between gap-2.5"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-extrabold text-[var(--color-text)]">
                            {locText(inv.recipientName, language)}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${statusBadge}`}>
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
                        <div className="text-[11px] font-semibold text-[var(--color-muted)] tabular-nums">
                          {locText(inv.roleLabel, language)} · 👶 <strong className="text-[var(--color-text)]">{assignedNames || '—'}</strong> · ⏳ {inv.expiresAt}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {inv.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => onUpdateInvitationStatus(inv.id, 'accepted')}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-emerald-600 text-white"
                            >
                              {isEn ? 'Accept' : 'قبول'}
                            </button>
                            <button
                              type="button"
                              onClick={() => onUpdateInvitationStatus(inv.id, 'cancelled')}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold border border-[var(--color-border)] text-red-700"
                            >
                              {isEn ? 'Cancel' : 'إلغاء'}
                            </button>
                          </>
                        )}
                        {inv.status === 'accepted' && (
                          <button
                            type="button"
                            onClick={() => onUpdateInvitationStatus(inv.id, 'revoked')}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold border border-red-200 bg-red-50 text-red-800"
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

          <div className="rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-2.5 shadow-2xs">
            <h3 className="text-sm sm:text-base font-extrabold text-[var(--color-text)]">
              👥 {isEn ? `Linked Family Members (${family.length})` : `أفراد العائلة المرتبطون بالحساب (${family.length})`}
            </h3>

            {family.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--color-border)] p-5 text-center text-xs font-bold text-[var(--color-muted)]">
                {isEn ? 'No family members added yet.' : 'لا يوجد أفراد مسجلون بعد.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {family.map((person) => {
                  const p = person.permissions;
                  const activeScopes: string[] = [];
                  if (p?.profile) activeScopes.push(isEn ? 'Profile' : 'الملف');
                  if (p?.routine) activeScopes.push(isEn ? 'Routine' : 'الروتين');
                  if (p?.calendar || person.events) activeScopes.push(isEn ? 'Calendar' : 'المواعيد');
                  if (p?.wishes || person.wishes) activeScopes.push(isEn ? 'Wishes' : 'الأمنيات');
                  if (p?.health && !disputeFreezeActive) activeScopes.push(isEn ? 'Health 🩺' : 'الصحة 🩺');

                  const assignedKidsLabel = person.assignedKidIds?.length
                    ? kids
                        .filter((k) => person.assignedKidIds?.includes(k.id))
                        .map((k) => locText(k.name, language))
                        .join(isEn ? ', ' : '، ')
                    : isEn
                    ? 'All Children'
                    : 'كل الأطفال';

                  return (
                    <div
                      key={person.id}
                      className="rounded-xl border border-teal-200/70 bg-teal-50/45 p-3 flex flex-wrap items-center justify-between gap-2.5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-white shadow-2xs flex items-center justify-center text-xl shrink-0">
                          {person.emoji || '👤'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-extrabold text-xs sm:text-sm text-[var(--color-text)]">
                            {locText(person.name, language)}
                          </div>
                          <div className="text-[11px] font-bold text-[var(--color-muted)]">
                            {locText(person.role, language)} · 👶 {assignedKidsLabel}
                          </div>
                          <div className="text-[10.5px] font-bold text-teal-900 mt-0.5">
                            🔑 {activeScopes.length ? activeScopes.join(' · ') : isEn ? 'No permissions' : 'بدون صلاحيات'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => onOpenPermModal(person)}
                          className="min-h-[34px] px-2.5 py-1 rounded-xl text-[11px] font-extrabold border border-[var(--color-border)] bg-white text-[var(--color-text)]"
                        >
                          ⚙️ {isEn ? 'Permissions' : 'الصلاحيات'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeletePerson(person.id)}
                          aria-label={`حذف ${person.name}`}
                          className="min-h-[34px] px-2.5 py-1 rounded-xl text-[11px] font-extrabold border border-red-200 bg-white text-red-700"
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
      <div className="rounded-[20px] border border-rose-200/80 bg-rose-50/60 p-3.5 flex flex-wrap items-center justify-between gap-2.5 shadow-2xs">
        <label className="flex items-center gap-2 cursor-pointer">
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
          <span className="px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-950 text-[11px] font-extrabold" role="status">
            🛡️ {isEn ? 'Safeguard Active' : 'وضع الحماية نشط'}
          </span>
        )}
      </div>
    </div>
  );
};
