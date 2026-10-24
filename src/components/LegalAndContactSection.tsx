import React, { useState } from 'react';
import {
  LanguageCode,
  STRICTLY_DIGITAL_CONTACT_CONFIG,
} from '../domain/familySpaceCore';
import { getCardBackgroundSpec } from '../domain/cardBackgrounds';
import { ThreeDIcon } from './ThreeDVisuals';
import {
  PASTEL_CARD_TONES,
  PrimaryCtaButton,
  SoftFilledIcon,
} from './DesignSystem';

export type LegalOrContactPageType = 'privacy' | 'terms' | 'contact';

interface LegalAndContactSectionProps {
  pageType: LegalOrContactPageType;
  language: LanguageCode;
  parentName: string;
  darkMode?: boolean;
  onNavigateSubPage: (target: LegalOrContactPageType) => void;
  onShowToast?: (msg: string) => void;
}

interface PolicyClause {
  id: string;
  badgeAr: string;
  badgeEn: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  bulletsAr: string[];
  bulletsEn: string[];
  tone: keyof typeof PASTEL_CARD_TONES;
}

const PRIVACY_CLAUSES: PolicyClause[] = [
  {
    id: 'privacy-1',
    badgeAr: 'البند الأول · جمع البيانات',
    badgeEn: 'Clause 1 · Data Collection',
    titleAr: '١. سياسة جمع بيانات الأسرة والطفل (نص قياسي تجريبي)',
    titleEn: '1. Family & Child Data Collection Policy (Standard Placeholder)',
    bodyAr:
      'هذا النص يمثل نصًا قياسيًا تجريبيًا (أبجد هوز حطي كلمن — لوريم إيبسوم بالعربية) مخصصًا لاختبار واجهة سياسة الخصوصية في تطبيق مساحة الأسرة. نلتزم بحماية كافة البيانات المدخلة الخاصة بالوالدين والأطفال وعدم مشاركتها مع أي أطراف خارجية غير مصرح لها.',
    bodyEn:
      'Standard Arabic & English placeholder text for user testing. We protect all parent and child profile data and never share personal information with unauthorized third parties.',
    bulletsAr: [
      'يتم حفظ بيانات ملفات الأطفال والروتين محليًا لأغراض العرض والاختبار.',
      'لا يتم جمع أي بيانات بنكية حقيقية أثناء تجربة محاكاة الدفع الإلكتروني.',
      'يحق لولي الأمر تصدير أو مسح كافة البيانات المسجلة في أي وقت بضغطة واحدة.',
    ],
    bulletsEn: [
      'Child profiles and routines are stored locally for prototype testing.',
      'No real banking credentials are collected during checkout simulation.',
      'Parents can export or erase all stored data at any time with one click.',
    ],
    tone: 'teal',
  },
  {
    id: 'privacy-2',
    badgeAr: 'البند الثاني · التشفير والأمان',
    badgeEn: 'Clause 2 · Security & Encryption',
    titleAr: '٢. أمن المعلومات وصلاحيات الوصول العائلي المشترك',
    titleEn: '2. Information Security & Shared Family Access Permissions',
    bodyAr:
      'نص تجريبي قياسي: تخضع جميع صلاحيات أفراد العائلة (الأب، الأم، الجد، الجدة، العم، الخالة) لضوابط صارمة يحددها الحساب الرئيسي للأسرة، مع إمكانية تجميد الصلاحيات الحساسة أو إلغاء الربط عبر رمز الاستجابة السريعة (QR) في أي لحظة.',
    bodyEn:
      'All family member permissions (Father, Mother, Grandparents, Uncles, Aunts) are governed by strict role controls managed by the primary family account.',
    bulletsAr: [
      'حماية الصور والملاحظات الصحية الخاصة بالطفل بصلاحيات مقيدة.',
      'رموز دعوة العائلة (QR Code) مؤقتة ومشفرة لمنع الاستخدام غير المصرح به.',
      'إشعارات أمان فورية عند انضمام أي فرد جديد إلى شجرة الحساب العائلي.',
    ],
    bulletsEn: [
      'Private photos and medical notes are protected by role-scoped permissions.',
      'Family QR invitation codes are time-limited and verifiable.',
      'Instant security alerts whenever a new member joins the family profile.',
    ],
    tone: 'sky',
  },
  {
    id: 'privacy-3',
    badgeAr: 'البند الثالث · ملفات تعريف الارتباط',
    badgeEn: 'Clause 3 · Local Storage & Cookies',
    titleAr: '٣. التخزين المحلي وتفضيلات تجربة المستخدم',
    titleEn: '3. Local Storage & User Experience Preferences',
    bodyAr:
      'نص تجريبي قياسي (لوريم إيبسوم العربي): يستخدم التطبيق تقنيات التخزين المحلي في المتصفح لحفظ تفضيلات السمة البصرية، اللغة المختارة، ومحتويات سلة التسوق التجريبية لضمان استمرارية التجربة بسلاسة دون الحاجة لإعادة الإدخال.',
    bodyEn:
      'The application uses browser local storage to persist theme preferences, language settings, and mock shopping cart items across testing sessions.',
    bulletsAr: [
      'حفظ تلقائي لسمة الأم أو الأب واللغة العربية أو الإنجليزية.',
      'عدم استخدام أي ملفات تتبع إعلانية خارجية داخل قسم ألعاب الأطفال.',
      'الالتزام الكامل بمعايير خصوصية الطفل الرقمية في جميع الأقسام التفاعلية.',
    ],
    bulletsEn: [
      'Automatic persistence for theme and language preferences.',
      'Zero external ad-tracking scripts inside the Kids & Games section.',
      'Full compliance with digital child safety standards across all modules.',
    ],
    tone: 'purple',
  },
];

const TERMS_AND_IP_CLAUSES: PolicyClause[] = [
  {
    id: 'terms-1',
    badgeAr: 'القسم الأول · شروط الاستخدام',
    badgeEn: 'Section 1 · Terms of Service',
    titleAr: '١. الشروط والأحكام العامة لاستخدام المنصة (نص قياسي تجريبي)',
    titleEn: '1. General Terms & Conditions of Platform Use',
    bodyAr:
      'هذا النص يمثل مسودة قياسية تجريبية (لوريم إيبسوم بالعربية) للشروط والأحكام الخاصة بتطبيق «مساحة الأسرة». باستخدامك لهذا النموذج التفاعلي، فإنك تقر بأن كافة عمليات الدفع والطلبات والحجوزات الطبية المعروضة هي محاكاة تجريبية مخصصة لاستطلاعات الرأي واختبار تجربة المستخدم.',
    bodyEn:
      'Standard placeholder text for Terms of Service. By using this interactive prototype, you acknowledge that all payments, orders, and bookings are simulated for user survey and testing purposes.',
    bulletsAr: [
      'المحتوى الطبي والتربوي المعروض استرشادي وتوعوي ولا يغني عن استشارة الطبيب المختص.',
      'بوابة الدفع الإلكتروني والدفع عند الاستلام تعمل في وضع المحاكاة الآمنة (Sandbox).',
      'يلتزم المستخدمون في مجتمع الآباء والأمهات بقواعد الاحترام المتبادل والخصوصية.',
    ],
    bulletsEn: [
      'Medical and parenting guides are informational and do not replace professional medical advice.',
      'Electronic payment and Cash on Delivery operate in safe sandbox simulation mode.',
      'Community members agree to uphold respectful and constructive parenting discussions.',
    ],
    tone: 'amber',
  },
  {
    id: 'terms-2',
    badgeAr: 'القسم الثاني · حقوق الملكية الفكرية',
    badgeEn: 'Section 2 · Intellectual Property Rights',
    titleAr: '٢. حقوق الملكية الفكرية والعلامات التجارية والتصميمات (IP Rights)',
    titleEn: '2. Intellectual Property, Trademarks & 3D Visual Assets',
    bodyAr:
      'نص قياسي لحقوق الملكية الفكرية: جميع حقوق الملكية الفكرية والتصميمات البصرية، بما في ذلك الهوية البصرية، الأيقونات ثلاثية الأبعاد، نماذج الألعاب التفاعلية، مقاطع الريلز والبودكاست، وهيكلة النظام البرمجي محفوظة بالكامل لمنصة «مساحة الأسرة — Family Space».',
    bodyEn:
      'All intellectual property rights, including visual design systems, 3D icons, interactive kids games, media reels/podcasts, and software architecture are reserved to Family Space.',
    bulletsAr: [
      'يُحظر نسخ أو إعادة توزيع التصميمات أو الأصول البصرية ثلاثية الأبعاد دون إذن كتابي مسبق.',
      'العلامة التجارية والشعار وواجهة الاستخدام محمية بموجب قوانين حماية الملكية الفكرية.',
      'جميع المحتويات التعليمية والألعاب المبتكرة مملوكة حصريًا للمنصة وشركائها المعتمدين.',
    ],
    bulletsEn: [
      'Copying or redistributing UI layouts or 3D visual assets without prior written consent is prohibited.',
      'Trademarks, logos, and Super App workflows are protected under intellectual property laws.',
      'Educational media and interactive games remain the exclusive property of the platform.',
    ],
    tone: 'indigo',
  },
  {
    id: 'terms-3',
    badgeAr: 'القسم الثالث · سياسة المتجر والطلبات',
    badgeEn: 'Section 3 · Store & Order Policy',
    titleAr: '٣. أحكام المتجر، الدفع الإلكتروني، والدفع عند الاستلام',
    titleEn: '3. Store, Electronic Payment & Cash on Delivery Terms',
    bodyAr:
      'نص تجريبي قياسي: يتيح قسم المتجر استعراض المنتجات والخدمات العائلية وإتمام الطلبات عبر خيارات الدفع الإلكتروني (البطاقات البنكية، Apple Pay، Google Pay) أو الدفع النقدي عند الاستلام، مع توفير شاشة تتبع مباشر لحالة الطلب من الاستلام وحتى التوصيل.',
    bodyEn:
      'The Store section supports Electronic Payment (Cards, Apple Pay, Google Pay) and Cash on Delivery (COD), paired with live order status tracking.',
    bulletsAr: [
      'إمكانية مراجعة ملخص الطلب وتفاصيل الدفع قبل التأكيد النهائي.',
      'تتبع فوري لمراحل تجهيز وتوصيل الطلب عبر واجهة التتبع المباشر.',
      'سياسة استبدال واسترجاع مرنة خلال ١٤ يومًا للمنتجات غير المستخدمة (بنود قياسية).',
    ],
    bulletsEn: [
      'Full order summary review prior to final confirmation.',
      'Real-time status updates via the Live Order Tracking interface.',
      'Standard 14-day return and exchange policy for eligible family products.',
    ],
    tone: 'emerald',
  },
];

export const LegalAndContactSection: React.FC<LegalAndContactSectionProps> = ({
  pageType,
  language,
  parentName,
  darkMode = false,
  onNavigateSubPage,
  onShowToast = () => {},
}) => {
  const isEn = language === 'en';

  // Digital Support Ticket State (Strictly Digital Contact Only — No Physical Address)
  const [senderName, setSenderName] = useState(parentName || '');
  const [senderEmail, setSenderEmail] = useState('parent@familyspace.app');
  const [senderPhone, setSenderPhone] = useState('+20 1012345678');
  const [ticketTopic, setTicketTopic] = useState<'support' | 'store' | 'Suggestion' | 'legal'>('support');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSubmittedId, setTicketSubmittedId] = useState<string | null>(null);

  const handleSendDigitalMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketMessage.trim()) {
      onShowToast(
        isEn
          ? 'Please write your message before sending.'
          : 'يرجى كتابة رسالتك أو استفسارك الرقمي قبل الإرسال.'
      );
      return;
    }
    const refId = `DIG-${String(Date.now()).slice(-5)}`;
    setTicketSubmittedId(refId);
    setTicketMessage('');
    onShowToast(
      isEn
        ? `✓ Digital message #${refId} sent to Customer Support!`
        : `✓ تم إرسال رسالتك الرقمية رقم #${refId} لفريق خدمة العملاء بنجاح!`
    );
  };

  return (
    <section
      className="space-y-4"
      aria-label={
        pageType === 'privacy'
          ? isEn
            ? 'Privacy Policy'
            : 'سياسة الخصوصية'
          : pageType === 'terms'
          ? isEn
            ? 'Terms of Service & Intellectual Property'
            : 'الشروط والأحكام وحقوق الملكية'
          : isEn
          ? 'Contact Us (Digital Channels)'
          : 'تواصل معنا (قنوات رقمية فقط)'
      }
    >
      {/* Sub-Navigation Switcher Bar between Privacy, Terms & IP, and Digital Contact Us */}
      <div className="rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="السياسات والتواصل الرقمي">
          <button
            type="button"
            role="tab"
            aria-selected={pageType === 'privacy'}
            onClick={() => onNavigateSubPage('privacy')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
              pageType === 'privacy'
                ? 'bg-teal-600 text-white shadow-2xs'
                : 'bg-[var(--color-control-muted)] text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <span>🔒</span>
            <span>{isEn ? 'Privacy Policy' : 'سياسة الخصوصية'}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={pageType === 'terms'}
            onClick={() => onNavigateSubPage('terms')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
              pageType === 'terms'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-[var(--color-control-muted)] text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <span>📜</span>
            <span>
              {isEn
                ? 'Terms & Intellectual Property'
                : 'الشروط والأحكام وحقوق الملكية'}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={pageType === 'contact'}
            onClick={() => onNavigateSubPage('contact')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
              pageType === 'contact'
                ? 'bg-orange-600 text-white shadow-2xs'
                : 'bg-[var(--color-control-muted)] text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <span>🎧</span>
            <span>{isEn ? 'Contact Us' : 'تواصل معنا'}</span>
          </button>
        </div>

        <span className="text-[11px] font-bold text-[var(--color-muted)] px-2">
          {pageType === 'contact'
            ? isEn
              ? '🌐 100% Digital Support'
              : '🌐 قنوات تواصل رقمية فقط'
            : isEn
            ? '📋 Standard Testing Copy'
            : '📋 نصوص قياسية لمرحلة الاختبار'}
        </span>
      </div>

      {/* =====================================================================
          SCREEN 1: PRIVACY POLICY (سياسة الخصوصية)
          ===================================================================== */}
      {pageType === 'privacy' && (
        <div className="space-y-4" data-testid="privacy-policy-screen">
          {/* Hero Image Card */}
          <div
            className="image-bg-card rounded-[24px] p-5 sm:p-6 flex flex-col items-center justify-center text-center gap-3"
            style={{ backgroundImage: getCardBackgroundSpec('privacy', darkMode).backgroundImageCss }}
          >
            <div className="w-12 h-12 rounded-2xl bg-white/90 border border-white shadow-2xs flex items-center justify-center shrink-0">
              <ThreeDIcon id="shield" size={30} />
            </div>
            <span className="image-card-badge inline-block px-3 py-0.5 rounded-full text-[11px] font-extrabold">
              {isEn ? 'PRIVACY & DATA PROTECTION' : 'حماية الخصوصية وأمان بيانات الأسرة'}
            </span>
            <h2 className="section-heading-centered image-card-title">
              {isEn
                ? 'Privacy Policy — Family Space Super App'
                : 'سياسة الخصوصية وحماية بيانات الأسرة والطفل'}
            </h2>
            <p className="image-card-subtitle text-xs font-semibold max-w-xl">
              {isEn
                ? 'Last updated: October 2026 · Structured Arabic placeholder clauses for beta testing'
                : 'آخر تحديث: أكتوبر ٢٠٢٦ · نص قياسي منظم لأغراض الفحص واستطلاع الرأي'}
            </p>
            <button
              type="button"
              onClick={() => onNavigateSubPage('terms')}
              className="min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-extrabold border border-white bg-white/90 text-slate-900 hover:bg-white transition-colors"
            >
              {isEn ? 'View Terms & IP →' : 'الشروط وحقوق الملكية ←'}
            </button>
          </div>

          {/* Clauses Grid */}
          <div className="grid grid-cols-1 gap-3.5">
            {PRIVACY_CLAUSES.map((clause) => {
              const tone = PASTEL_CARD_TONES[clause.tone];
              return (
                <article
                  key={clause.id}
                  className={`rounded-[20px] border ${tone.card} p-4 space-y-2.5 shadow-2xs`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold ${tone.badge}`}>
                      {isEn ? clause.badgeEn : clause.badgeAr}
                    </span>
                    <span className="text-[11px] font-bold text-[var(--color-muted)]">
                      🔒 {isEn ? 'Verified Standard Clause' : 'بند خصوصية معتمد'}
                    </span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-[var(--color-text)]">
                    {isEn ? clause.titleEn : clause.titleAr}
                  </h3>
                  <p className="text-xs text-[var(--color-text)]/90 leading-relaxed">
                    {isEn ? clause.bodyEn : clause.bodyAr}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    {(isEn ? clause.bulletsEn : clause.bulletsAr).map((b, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl bg-white/85 border border-white p-2.5 text-[11px] font-bold text-[var(--color-text)] flex items-start gap-1.5 shadow-2xs"
                      >
                        <span className="text-teal-700 font-extrabold">✓</span>
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          SCREEN 2: TERMS OF SERVICE & INTELLECTUAL PROPERTY (الشروط والأحكام وحقوق الملكية)
          ===================================================================== */}
      {pageType === 'terms' && (
        <div className="space-y-4" data-testid="terms-ip-screen">
          {/* Hero Image Card */}
          <div
            className="image-bg-card rounded-[24px] p-5 sm:p-6 flex flex-col items-center justify-center text-center gap-3"
            style={{ backgroundImage: getCardBackgroundSpec('terms', darkMode).backgroundImageCss }}
          >
            <div className="w-12 h-12 rounded-2xl bg-white/90 border border-white shadow-2xs flex items-center justify-center shrink-0">
              <ThreeDIcon id="star" size={30} />
            </div>
            <span className="image-card-badge inline-block px-3 py-0.5 rounded-full text-[11px] font-extrabold">
              {isEn ? 'TERMS & INTELLECTUAL PROPERTY' : 'الشروط والأحكام وحقوق الملكية الفكرية'}
            </span>
            <h2 className="section-heading-centered image-card-title">
              {isEn
                ? 'Terms of Service & Intellectual Property Rights'
                : 'الشروط والأحكام وحقوق الملكية الفكرية للمنصة'}
            </h2>
            <p className="image-card-subtitle text-xs font-semibold max-w-xl">
              {isEn
                ? 'All rights reserved © 2026 Family Space · Standard Arabic legal placeholder'
                : 'جميع الحقوق محفوظة © ٢٠٢٦ مساحة الأسرة · نص قانوني قياسي لمرحلة الاختبار'}
            </p>
            <button
              type="button"
              onClick={() => onNavigateSubPage('contact')}
              className="min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-extrabold border border-white bg-white/90 text-slate-900 hover:bg-white transition-colors"
            >
              {isEn ? 'Digital Contact Us →' : 'تواصل معنا رقميًا ←'}
            </button>
          </div>

          {/* Terms & IP Clauses Grid */}
          <div className="grid grid-cols-1 gap-3.5">
            {TERMS_AND_IP_CLAUSES.map((clause) => {
              const tone = PASTEL_CARD_TONES[clause.tone];
              return (
                <article
                  key={clause.id}
                  className={`rounded-[20px] border ${tone.card} p-4 space-y-2.5 shadow-2xs`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold ${tone.badge}`}>
                      {isEn ? clause.badgeEn : clause.badgeAr}
                    </span>
                    <span className="text-[11px] font-bold text-[var(--color-muted)]">
                      © {isEn ? 'Protected IP Clause' : 'حقوق ملكية محفوظة'}
                    </span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-[var(--color-text)]">
                    {isEn ? clause.titleEn : clause.titleAr}
                  </h3>
                  <p className="text-xs text-[var(--color-text)]/90 leading-relaxed">
                    {isEn ? clause.bodyEn : clause.bodyAr}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    {(isEn ? clause.bulletsEn : clause.bulletsAr).map((b, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl bg-white/85 border border-white p-2.5 text-[11px] font-bold text-[var(--color-text)] flex items-start gap-1.5 shadow-2xs"
                      >
                        <span className="text-indigo-700 font-extrabold">●</span>
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          SCREEN 3: CONTACT US (تواصل معنا — STRICTLY DIGITAL ONLY, NO PHYSICAL ADDRESS)
          ===================================================================== */}
      {pageType === 'contact' && (
        <div className="space-y-4" data-testid="digital-contact-us-screen">
          {/* Digital Contact Hero Image Banner */}
          <div
            className="image-bg-card rounded-[24px] p-5 sm:p-6 flex flex-col items-center justify-center text-center gap-3"
            style={{ backgroundImage: getCardBackgroundSpec('contact', darkMode).backgroundImageCss }}
          >
            <div className="w-12 h-12 rounded-2xl bg-white/90 border border-white shadow-2xs flex items-center justify-center shrink-0">
              <SoftFilledIcon id="notifications" size={30} />
            </div>
            <span className="image-card-badge inline-block px-3 py-0.5 rounded-full text-[11px] font-extrabold">
              {isEn ? 'DIGITAL CUSTOMER CARE 24/7' : 'مركز التواصل والدعم الرقمي ٢٤/٧'}
            </span>
            <h2 className="section-heading-centered image-card-title">
              {isEn
                ? 'Contact Us — Digital Support & Social Channels'
                : 'تواصل معنا — البريد الإلكتروني وخدمة العملاء والقنوات الرقمية'}
            </h2>
            <p className="image-card-subtitle text-xs font-semibold max-w-xl">
              {isEn
                ? STRICTLY_DIGITAL_CONTACT_CONFIG.workingHoursEn
                : STRICTLY_DIGITAL_CONTACT_CONFIG.workingHoursAr}
            </p>
          </div>

          {/* 1. Primary Digital Channels Grid: Support Email & Customer Service Phone Number */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Support Email Card */}
            <div className="rounded-[20px] border border-sky-200/90 bg-sky-50/85 p-4 space-y-3 shadow-2xs flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-sky-100 text-sky-900 text-[10px] font-extrabold">
                    {isEn ? 'SUPPORT EMAIL' : 'البريد الإلكتروني للدعم الفني'}
                  </span>
                  <span className="text-lg" aria-hidden="true">✉️</span>
                </div>
                <h3 className="text-xs sm:text-sm font-extrabold text-[var(--color-text)]">
                  {isEn ? 'Official Support & Care Email' : 'مراسلة الدعم الفني عبر البريد الإلكتروني'}
                </h3>
                <div className="space-y-1.5 pt-1">
                  <div className="rounded-xl bg-white/90 border border-sky-100 px-3 py-2 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-[var(--color-muted)]">
                      {isEn ? 'Technical Support:' : 'الدعم الفني العام:'}
                    </span>
                    <span dir="ltr" className="text-xs font-extrabold text-sky-950 select-all">
                      {STRICTLY_DIGITAL_CONTACT_CONFIG.supportEmail}
                    </span>
                  </div>
                  <div className="rounded-xl bg-white/90 border border-sky-100 px-3 py-2 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-[var(--color-muted)]">
                      {isEn ? 'Family & Orders Care:' : 'رعاية الأسرة والطلبات:'}
                    </span>
                    <span dir="ltr" className="text-xs font-extrabold text-sky-950 select-all">
                      {STRICTLY_DIGITAL_CONTACT_CONFIG.careEmail}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(STRICTLY_DIGITAL_CONTACT_CONFIG.supportEmail);
                    onShowToast(
                      isEn
                        ? `✓ Copied ${STRICTLY_DIGITAL_CONTACT_CONFIG.supportEmail}`
                        : `✓ تم نسخ البريد الإلكتروني: ${STRICTLY_DIGITAL_CONTACT_CONFIG.supportEmail}`
                    );
                  }}
                  className="min-h-[38px] px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-extrabold transition-colors"
                >
                  {isEn ? 'Copy Email' : 'نسخ البريد الإلكتروني'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onShowToast(
                      isEn
                        ? `✉️ Ready to email ${STRICTLY_DIGITAL_CONTACT_CONFIG.supportEmail}`
                        : `✉️ تم تجهيز مراسلة فورية إلى ${STRICTLY_DIGITAL_CONTACT_CONFIG.supportEmail}`
                    )
                  }
                  className="min-h-[38px] px-3 py-1.5 rounded-xl border border-sky-300 bg-white text-sky-950 text-xs font-extrabold hover:bg-sky-100 transition-colors"
                >
                  {isEn ? 'Direct Email' : 'إرسال بريد مباشر'}
                </button>
              </div>
            </div>

            {/* Customer Service Phone Number Card */}
            <div className="rounded-[20px] border border-emerald-200/90 bg-emerald-50/85 p-4 space-y-3 shadow-2xs flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-[10px] font-extrabold">
                    {isEn ? 'CUSTOMER SERVICE PHONE' : 'أرقام هاتف خدمة العملاء'}
                  </span>
                  <span className="text-lg" aria-hidden="true">📞</span>
                </div>
                <h3 className="text-xs sm:text-sm font-extrabold text-[var(--color-text)]">
                  {isEn
                    ? 'Unified Hotline & Direct Customer Care Numbers'
                    : 'الخط الساخن الموحد وأرقام خدمة العملاء المباشرة'}
                </h3>
                <div className="space-y-1.5 pt-1">
                  <div className="rounded-xl bg-white/90 border border-emerald-100 px-3 py-2 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-[var(--color-muted)]">
                      {isEn ? 'Unified Short Number:' : 'الرقم المختصر الموحد:'}
                    </span>
                    <span dir="ltr" className="text-sm font-extrabold text-emerald-950 tabular-nums">
                      ☎️ {STRICTLY_DIGITAL_CONTACT_CONFIG.hotlineShort}
                    </span>
                  </div>
                  <div className="rounded-xl bg-white/90 border border-emerald-100 px-3 py-2 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-[var(--color-muted)]">
                      {isEn ? 'Customer Care Line 1:' : 'هاتف خدمة العملاء (١):'}
                    </span>
                    <span dir="ltr" className="text-xs font-extrabold text-emerald-950 tabular-nums select-all">
                      {STRICTLY_DIGITAL_CONTACT_CONFIG.customerServicePhonePrimary}
                    </span>
                  </div>
                  <div className="rounded-xl bg-white/90 border border-emerald-100 px-3 py-2 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-[var(--color-muted)]">
                      {isEn ? 'Customer Care Line 2:' : 'هاتف خدمة العملاء (٢):'}
                    </span>
                    <span dir="ltr" className="text-xs font-extrabold text-emerald-950 tabular-nums select-all">
                      {STRICTLY_DIGITAL_CONTACT_CONFIG.customerServicePhoneSecondary}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    onShowToast(
                      isEn
                        ? `📞 Calling Customer Service (${STRICTLY_DIGITAL_CONTACT_CONFIG.hotlineShort})...`
                        : `📞 جاري الاتصال بخدمة العملاء (${STRICTLY_DIGITAL_CONTACT_CONFIG.hotlineShort})...`
                    )
                  }
                  className="min-h-[38px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition-colors"
                >
                  {isEn ? 'Call Customer Care' : 'اتصال بخدمة العملاء'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(STRICTLY_DIGITAL_CONTACT_CONFIG.customerServicePhonePrimary);
                    onShowToast(
                      isEn
                        ? `✓ Copied phone number ${STRICTLY_DIGITAL_CONTACT_CONFIG.customerServicePhonePrimary}`
                        : `✓ تم نسخ رقم خدمة العملاء: ${STRICTLY_DIGITAL_CONTACT_CONFIG.customerServicePhonePrimary}`
                    );
                  }}
                  className="min-h-[38px] px-3 py-1.5 rounded-xl border border-emerald-300 bg-white text-emerald-950 text-xs font-extrabold hover:bg-emerald-100 transition-colors"
                >
                  {isEn ? 'Copy Number' : 'نسخ رقم الهاتف'}
                </button>
              </div>
            </div>
          </div>

          {/* 2. Social Media Icons & Official Digital Channels Grid */}
          <div className="rounded-[22px] border border-purple-200/85 bg-purple-50/75 p-4 sm:p-5 space-y-3 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-900 text-[10px] font-extrabold">
                  {isEn ? 'SOCIAL MEDIA CHANNELS' : 'قنوات التواصل الاجتماعي الرسمية'}
                </span>
                <h3 className="text-xs sm:text-sm font-extrabold text-[var(--color-text)] mt-0.5">
                  {isEn
                    ? 'Follow & Message Family Space on Social Media'
                    : 'تابعنا وتواصل معنا عبر منصات التواصل الاجتماعي'}
                </h3>
              </div>
              <span className="text-[11px] font-bold text-purple-900">
                ⚡ {isEn ? 'Instant Digital Response' : 'استجابة رقمية فورية'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {STRICTLY_DIGITAL_CONTACT_CONFIG.socialChannels.map((soc) => {
                const toneObj =
                  PASTEL_CARD_TONES[soc.tone as keyof typeof PASTEL_CARD_TONES] ||
                  PASTEL_CARD_TONES.purple;
                return (
                  <button
                    key={soc.id}
                    type="button"
                    onClick={() =>
                      onShowToast(
                        isEn
                          ? `🌐 Connected to ${soc.nameEn} (${soc.handle})`
                          : `🌐 تم فتح قناة ${soc.nameAr} الرسمية (${soc.handle})`
                      )
                    }
                    className={`rounded-2xl border ${toneObj.card} bg-white/95 p-3 text-center flex flex-col items-center justify-center gap-1.5 shadow-2xs hover:shadow-sm active:scale-95 transition-all`}
                  >
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-extrabold ${toneObj.iconBox}`}>
                      {soc.icon}
                    </span>
                    <div className="text-xs font-extrabold text-[var(--color-text)] truncate max-w-full">
                      {isEn ? soc.nameEn : soc.nameAr}
                    </div>
                    <div dir="ltr" className="text-[10px] font-bold text-[var(--color-muted)] truncate max-w-full">
                      {soc.handle}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Direct In-App Digital Support Message Form (No Physical Address Fields) */}
          <div className="rounded-[22px] border border-amber-200/85 bg-amber-50/75 p-4 sm:p-5 space-y-3.5 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-extrabold">
                  {isEn ? 'DIRECT DIGITAL MESSAGE' : 'نموذج المراسلة الرقمية السريعة'}
                </span>
                <h3 className="text-xs sm:text-sm font-extrabold text-[var(--color-text)] mt-0.5">
                  {isEn
                    ? 'Send an Instant Message to Support'
                    : 'أرسل استفسارك أو ملاحظتك مباشرة لفريق خدمة العملاء'}
                </h3>
              </div>
              {ticketSubmittedId && (
                <span className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white text-[11px] font-extrabold">
                  ✓ {isEn ? `Ticket #${ticketSubmittedId} Sent` : `تم استلام طلبك #${ticketSubmittedId}`}
                </span>
              )}
            </div>

            <form onSubmit={handleSendDigitalMessage} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label htmlFor="contactSenderName" className="block text-[11px] font-extrabold text-[var(--color-text)] mb-1">
                    {isEn ? 'Your Name' : 'الاسم'}
                  </label>
                  <input
                    id="contactSenderName"
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder={isEn ? 'Parent Name' : 'اسم ولي الأمر'}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--color-text)]"
                  />
                </div>

                <div>
                  <label htmlFor="contactSenderEmail" className="block text-[11px] font-extrabold text-[var(--color-text)] mb-1">
                    {isEn ? 'Reply Email' : 'البريد الإلكتروني للرد'}
                  </label>
                  <input
                    id="contactSenderEmail"
                    type="email"
                    dir="ltr"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--color-text)]"
                  />
                </div>

                <div>
                  <label htmlFor="contactSenderPhone" className="block text-[11px] font-extrabold text-[var(--color-text)] mb-1">
                    {isEn ? 'Phone Number' : 'رقم الجوال للتواصل'}
                  </label>
                  <input
                    id="contactSenderPhone"
                    type="tel"
                    dir="ltr"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--color-text)] tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-2.5">
                <div>
                  <label htmlFor="contactTopicSelect" className="block text-[11px] font-extrabold text-[var(--color-text)] mb-1">
                    {isEn ? 'Inquiry Type' : 'نوع الاستفسار الرقمي'}
                  </label>
                  <select
                    id="contactTopicSelect"
                    value={ticketTopic}
                    onChange={(e) => setTicketTopic(e.target.value as typeof ticketTopic)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-xs font-extrabold text-[var(--color-text)]"
                  >
                    <option value="support">{isEn ? 'Technical Support' : 'دعم فني للحساب'}</option>
                    <option value="store">{isEn ? 'Store & Orders' : 'استفسار عن طلب بالمتجر'}</option>
                    <option value="Suggestion">{isEn ? 'Feature Suggestion' : 'اقتراح تطوير للتطبيق'}</option>
                    <option value="legal">{isEn ? 'Privacy & Policies' : 'الخصوصية وحقوق الملكية'}</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="contactMessageInput" className="block text-[11px] font-extrabold text-[var(--color-text)] mb-1">
                    {isEn ? 'Digital Message Details' : 'نص الرسالة'}
                  </label>
                  <input
                    id="contactMessageInput"
                    type="text"
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    placeholder={
                      isEn
                        ? 'Write your question or feedback here...'
                        : 'اكتب سؤالك أو رسالتك لفريق الدعم الرقمي...'
                    }
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--color-text)]"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <span className="text-[11px] font-bold text-amber-900">
                  ✉️ {STRICTLY_DIGITAL_CONTACT_CONFIG.supportEmail} · ☎️ {STRICTLY_DIGITAL_CONTACT_CONFIG.hotlineShort}
                </span>
                <PrimaryCtaButton type="submit" variant="orange" size="md">
                  <span>🚀</span>
                  <span>{isEn ? 'Send Digital Message' : 'إرسال الرسالة الرقمية'}</span>
                </PrimaryCtaButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
