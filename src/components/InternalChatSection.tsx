import React, { useState } from 'react';
import { LanguageCode } from '../domain/familySpaceCore';

interface ChatMessage {
  id: number;
  sender: 'me' | 'other';
  senderNameAr: string;
  senderNameEn: string;
  textAr: string;
  textEn: string;
  timestamp: string;
}

interface ChatThread {
  id: string;
  category: 'doctor' | 'nursery' | 'family';
  participantNameAr: string;
  participantNameEn: string;
  roleTitleAr: string;
  roleTitleEn: string;
  scopedChildAr: string;
  scopedChildEn: string;
  onlineStatusAr: string;
  onlineStatusEn: string;
  unreadCount: number;
  messages: ChatMessage[];
}

const INITIAL_CHAT_THREADS: ChatThread[] = [
  {
    id: 'thread-nursery',
    category: 'nursery',
    participantNameAr: 'أ. ريم — مشرفة حضانة خطوات صغيرة',
    participantNameEn: 'Ms. Reem — Little Steps Nursery Supervisor',
    roleTitleAr: 'مشرفة فصل الحضانة (صلاحية مقتصرة على: نور)',
    roleTitleEn: 'Nursery Supervisor (Scoped Access: Nour only)',
    scopedChildAr: 'نور (3 سنوات)',
    scopedChildEn: 'Nour (3 yrs)',
    onlineStatusAr: 'متصلة الآن · تقارير الحضانة',
    onlineStatusEn: 'Online · Nursery Updates',
    unreadCount: 1,
    messages: [
      {
        id: 1,
        sender: 'other',
        senderNameAr: 'أ. ريم',
        senderNameEn: 'Ms. Reem',
        textAr: 'صباح الخير مدام سارة 🌸 نور تناولت فطورها كاملًا اليوم وشاركت في نشاط التلوين الجماعي بحماس كبير.',
        textEn: 'Good morning Sara! Nour finished her entire breakfast today and happily joined the group painting activity.',
        timestamp: '10:45 AM',
      },
      {
        id: 2,
        sender: 'me',
        senderNameAr: 'أنتِ (ولي الأمر)',
        senderNameEn: 'You (Parent)',
        textAr: 'شكرًا جزيلًا أستاذة ريم على المتابعة الجميلة، هل نامت وقت القيلولة؟',
        textEn: 'Thank you so much Ms. Reem! Did she take her midday nap?',
        timestamp: '12:15 PM',
      },
      {
        id: 3,
        sender: 'other',
        senderNameAr: 'أ. ريم',
        senderNameEn: 'Ms. Reem',
        textAr: 'نعم، نامت لمدة 45 دقيقة بهدوء، ومستعدة لموعد الانصراف الساعة 2:30 م.',
        textEn: 'Yes, she slept peacefully for 45 minutes and is ready for 2:30 PM pickup.',
        timestamp: '01:20 PM',
      },
    ],
  },
  {
    id: 'thread-doctor',
    category: 'doctor',
    participantNameAr: 'عيادة د. سلمى الكيلاني — طب الأطفال',
    participantNameEn: 'Dr. Salma El-Kilany Pediatric Clinic',
    roleTitleAr: 'استشاري طب الأطفال وحديثي الولادة',
    roleTitleEn: 'Consultant Pediatrician',
    scopedChildAr: 'عز ونور',
    scopedChildEn: 'Ezz & Nour',
    onlineStatusAr: 'يرد خلال ساعات العمل',
    onlineStatusEn: 'Replies during clinic hours',
    unreadCount: 0,
    messages: [
      {
        id: 10,
        sender: 'other',
        senderNameAr: 'عيادة د. سلمى',
        senderNameEn: 'Dr. Salma Clinic',
        textAr: 'أهلًا بكم، تم تأكيد موعد متابعة التطعيم للطفلة نور يوم الأحد القادم الساعة 10:00 صباحًا.',
        textEn: 'Hello! Nour’s vaccination follow-up appointment is confirmed for next Sunday at 10:00 AM.',
        timestamp: 'Yesterday',
      },
    ],
  },
  {
    id: 'thread-coparent',
    category: 'family',
    participantNameAr: 'أحمد (الأب — شريك الأسرة)',
    participantNameEn: 'Ahmed (Father — Co-Parent)',
    roleTitleAr: 'حساب الأب الموثق',
    roleTitleEn: 'Verified Father Account',
    scopedChildAr: 'كل الأطفال (عز ونور)',
    scopedChildEn: 'All Children (Ezz & Nour)',
    onlineStatusAr: 'متصل',
    onlineStatusEn: 'Online',
    unreadCount: 0,
    messages: [
      {
        id: 20,
        sender: 'other',
        senderNameAr: 'أحمد',
        senderNameEn: 'Ahmed',
        textAr: 'خلصت تمرين السباحة مع عز، وهنقرأ قصة المساء أول ما نرجع البيت إن شاء الله.',
        textEn: 'Finished swimming practice with Ezz! We will read the bedtime story as soon as we get home.',
        timestamp: '06:10 PM',
      },
    ],
  },
];

interface InternalChatSectionProps {
  language: LanguageCode;
  onShowToast: (msg: string) => void;
}

export const InternalChatSection: React.FC<InternalChatSectionProps> = ({
  language,
  onShowToast,
}) => {
  const isEn = language === 'en';
  const [threads, setThreads] = useState<ChatThread[]>(INITIAL_CHAT_THREADS);
  const [activeThreadId, setActiveThreadId] = useState<string>('thread-nursery');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'doctor' | 'nursery' | 'family'>('all');
  const [messageInput, setMessageInput] = useState<string>('');

  const filteredThreads = threads.filter(
    (t) => categoryFilter === 'all' || t.category === categoryFilter
  );

  const activeThread =
    threads.find((t) => t.id === activeThreadId) || filteredThreads[0] || threads[0];

  const handleSendMessage = (customText?: string) => {
    const text = (customText ?? messageInput).trim();
    if (!text || !activeThread) return;

    const userMsg: ChatMessage = {
      id: Date.now(),
      sender: 'me',
      senderNameAr: 'أنت (ولي الأمر)',
      senderNameEn: 'You (Parent)',
      textAr: text,
      textEn: text,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };

    const autoReply: ChatMessage = {
      id: Date.now() + 1,
      sender: 'other',
      senderNameAr: activeThread.participantNameAr.split('—')[0].trim(),
      senderNameEn: activeThread.participantNameEn.split('—')[0].trim(),
      textAr:
        activeThread.category === 'nursery'
          ? 'تم استلام رسالتك في سجل متابعة الحضانة، وسنوافيكم بالتحديث فورًا (رد تلقائي تجريبي).'
          : activeThread.category === 'doctor'
          ? 'شكرًا لتواصلكم مع العيادة، تم تسجيل استفساركم في ملف الطفل الطبي (رد تلقائي تجريبي).'
          : 'تمام، وصلت رسالتك وتم تحديث تنسيق اليوم العائلي 👍 (رد تجريبي).',
      textEn:
        'Message received and logged under family permissions (Simulated demo reply).',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };

    setThreads((prev) =>
      prev.map((th) =>
        th.id === activeThread.id
          ? {
              ...th,
              unreadCount: 0,
              messages: [...th.messages, userMsg, autoReply],
            }
          : th
      )
    );
    setMessageInput('');
    onShowToast(isEn ? 'Message sent (Demo)' : 'تم إرسال الرسالة');
  };

  return (
    <section className="space-y-6" aria-label={isEn ? 'Internal Family & Provider Chat' : 'المحادثات الداخلية والرسائل'}>
      {/* Crisp Royal Blue Messaging Personality Hero */}
      <div
        className="rounded-[24px] p-5 sm:p-6 border border-blue-200/80 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
        style={{
          background: 'linear-gradient(135deg, #eff6ff 0%, #e0f2fe 55%, #f0f9ff 100%)',
          boxShadow: '0 16px 34px -14px rgba(37, 99, 235, 0.13)',
        }}
      >
        <div className="space-y-2 max-w-2xl">
          <div className="text-xs font-extrabold text-blue-800">
            💬 {isEn ? 'Permission-Aware Internal Messaging (Demo)' : 'مركز المحادثات الداخلية المحمي بالصلاحيات (عرض تجريبي)'}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
            {isEn
              ? 'Direct Communication with Nursery Supervisors, Pediatric Clinics & Family'
              : 'تواصل آمن ومباشر مع مشرفات الحضانة، عيادات الأطباء، وشريك الأسرة'}
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            {isEn
              ? 'Each conversation respects your child-specific permissions so nursery or school staff only see updates for the child assigned to them.'
              : 'تخضع كل محادثة لقواعد الخصوصية والصلاحيات المحددة لكل طفل، بحيث لا يرى مقدم الرعاية أو الحضانة إلا بيانات الطفل المصرح له به.'}
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-white/90 border border-blue-200 shrink-0">
          {[
            { id: 'all', labelAr: 'كل المحادثات', labelEn: 'All Chats' },
            { id: 'nursery', labelAr: 'الحضانة والمدرسة', labelEn: 'Nursery & School' },
            { id: 'doctor', labelAr: 'الأطباء والعيادات', labelEn: 'Doctors & Clinics' },
            { id: 'family', labelAr: 'الأسرة', labelEn: 'Family' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCategoryFilter(tab.id as typeof categoryFilter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors whitespace-nowrap ${
                categoryFilter === tab.id
                  ? 'bg-blue-700 text-white'
                  : 'text-blue-950 hover:bg-blue-50'
              }`}
            >
              {isEn ? tab.labelEn : tab.labelAr}
            </button>
          ))}
        </div>
      </div>

      {/* Two-Column Messaging Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5 items-stretch">
        {/* Conversation List */}
        <div className="rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 space-y-2">
          <div className="px-2 py-1 text-xs font-extrabold text-[var(--color-muted)]">
            {isEn ? 'Active Conversations' : 'قائمة المحادثات النشطة'}
          </div>
          {filteredThreads.map((thread) => {
            const isSelected = thread.id === activeThread?.id;
            const lastMsg = thread.messages[thread.messages.length - 1];
            return (
              <button
                key={thread.id}
                type="button"
                onClick={() => {
                  setActiveThreadId(thread.id);
                  setThreads((prev) =>
                    prev.map((t) => (t.id === thread.id ? { ...t, unreadCount: 0 } : t))
                  );
                }}
                className={`w-full p-3.5 rounded-2xl border text-start transition-colors space-y-1 ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70'
                    : 'border-transparent hover:bg-[var(--color-control-muted)]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-[var(--color-text)] truncate">
                    {isEn ? thread.participantNameEn : thread.participantNameAr}
                  </span>
                  {thread.unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-700 text-white text-[10px] font-extrabold tabular-nums">
                      {thread.unreadCount}
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-semibold text-blue-800 truncate">
                  🔒 {isEn ? `Scope: ${thread.scopedChildEn}` : `النطاق: ${thread.scopedChildAr}`}
                </div>
                {lastMsg && (
                  <p className="text-xs text-[var(--color-muted)] line-clamp-1">
                    {isEn ? lastMsg.textEn : lastMsg.textAr}
                  </p>
                )}
              </button>
            );
          })}
        </div>

        {/* Active Chat Screen */}
        {activeThread && (
          <div className="rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col justify-between min-h-[470px] overflow-hidden">
            {/* Chat Header */}
            <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-control-muted)]/50 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-[var(--color-text)]">
                  {isEn ? activeThread.participantNameEn : activeThread.participantNameAr}
                </h3>
                <div className="text-xs text-[var(--color-muted)]">
                  {isEn ? activeThread.roleTitleEn : activeThread.roleTitleAr} ·{' '}
                  <span className="text-emerald-700 font-semibold">
                    {isEn ? activeThread.onlineStatusEn : activeThread.onlineStatusAr}
                  </span>
                </div>
              </div>
              <div className="text-[11px] font-bold text-blue-900 bg-blue-100/80 px-3 py-1 rounded-xl">
                🛡️ {isEn ? `Child Scope: ${activeThread.scopedChildEn}` : `نطاق الطفل المصرح به: ${activeThread.scopedChildAr}`}
              </div>
            </div>

            {/* Messages Viewport */}
            <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[340px]">
              {activeThread.messages.map((msg) => {
                const isMe = msg.sender === 'me';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[82%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                        isMe
                          ? 'bg-blue-700 text-white rounded-ee-xs'
                          : 'bg-[var(--color-control-muted)] text-[var(--color-text)] rounded-es-xs'
                      }`}
                    >
                      <div className="font-bold text-[11px] opacity-80 mb-0.5">
                        {isEn ? msg.senderNameEn : msg.senderNameAr}
                      </div>
                      <div>{isEn ? msg.textEn : msg.textAr}</div>
                    </div>
                    <span
                      dir="ltr"
                      className="text-[10px] text-[var(--color-muted)] tabular-nums mt-1 px-1"
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Quick Reply Chips & Input Composer */}
            <div className="p-4 border-t border-[var(--color-border)] space-y-2.5 bg-[var(--color-surface)]">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  isEn ? 'Thank you for the update! 🌸' : 'شكرًا جزيلًا على المتابعة 🌸',
                  isEn ? 'We are on our way for pickup 🚗' : 'نحن في الطريق للاستلام الآن 🚗',
                  isEn ? 'Please share today’s meal note 🍎' : 'يرجى مشاركة ملاحظة وجبة الغداء اليوم 🍎',
                ].map((quick, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(quick)}
                    className="px-3 py-1 rounded-xl text-[11px] font-semibold bg-[var(--color-control-muted)] text-[var(--color-text)] hover:bg-blue-50"
                  >
                    {quick}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={
                    isEn
                      ? 'Type a message to the provider or family member...'
                      : 'اكتب رسالتك هنا (محادثة تجريبية محمية بالصلاحيات)...'
                  }
                  className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3.5 py-2.5 text-xs sm:text-sm text-[var(--color-text)]"
                />
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-blue-700 text-white hover:bg-blue-800 whitespace-nowrap"
                >
                  {isEn ? 'Send' : 'إرسال'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
