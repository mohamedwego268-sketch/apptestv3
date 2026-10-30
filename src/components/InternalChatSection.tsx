import React, { useState } from 'react';
import { LanguageCode, getEmptyStateCopy, sanitizeUserText } from '../domain/familySpaceCore';
import { getCardBackgroundSpec } from '../domain/cardBackgrounds';
import { FriendlyEmptyState, PrimaryCtaButton, SoftFilledIcon } from './DesignSystem';

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
    roleTitleAr: 'مشرفة فصل الحضانة والخيال (صلاحية مقتصرة على: ليلى)',
    roleTitleEn: 'Nursery Supervisor (Scoped Access: Laila only)',
    scopedChildAr: 'ليلى (٤ سنوات)',
    scopedChildEn: 'Laila (4 yrs)',
    onlineStatusAr: 'متصلة الآن · تقارير الحضانة',
    onlineStatusEn: 'Online · Nursery Updates',
    unreadCount: 1,
    messages: [
      {
        id: 1,
        sender: 'other',
        senderNameAr: 'أ. ريم',
        senderNameEn: 'Ms. Reem',
        textAr: 'صباح الخير يا مريم وأحمد 🌸 ليلى تناولت فطورها كاملًا اليوم وأبدعت في نشاط الرسم بالألوان المائية ومسرح العرائس بحماس كبير.',
        textEn: 'Good morning Maryam & Ahmad! Laila finished her entire breakfast today and happily joined watercolor painting and puppet theater.',
        timestamp: '10:45 AM',
      },
      {
        id: 2,
        sender: 'me',
        senderNameAr: 'أحمد ومريم (ولي الأمر)',
        senderNameEn: 'Ahmad & Maryam (Parents)',
        textAr: 'شكرًا جزيلًا أستاذة ريم على المتابعة الجميلة، هل شاركت أصدقاءها حكايتها الجديدة؟',
        textEn: 'Thank you so much Ms. Reem! Did she share her new imaginative story with her friends?',
        timestamp: '12:15 PM',
      },
      {
        id: 3,
        sender: 'other',
        senderNameAr: 'أ. ريم',
        senderNameEn: 'Ms. Reem',
        textAr: 'نعم، حكت لهم قصة الفراشة الملونة، ومستعدة لموعد الانصراف الساعة 2:30 م.',
        textEn: 'Yes, she told them the colorful butterfly story and is ready for 2:30 PM pickup.',
        timestamp: '01:20 PM',
      },
    ],
  },
  {
    id: 'thread-doctor',
    category: 'doctor',
    participantNameAr: 'جهة طبية — نموذج محادثة',
    participantNameEn: 'Healthcare Provider — Sample Conversation',
    roleTitleAr: 'تواصل مع مقدم الرعاية الصحية',
    roleTitleEn: 'Consultant Pediatrician',
    scopedChildAr: 'حمزة وليلى ويوسف',
    scopedChildEn: 'Hamza, Laila & Youssef',
    onlineStatusAr: 'يرد خلال ساعات العمل',
    onlineStatusEn: 'Replies during clinic hours',
    unreadCount: 0,
    messages: [
      {
        id: 10,
        sender: 'other',
        senderNameAr: 'جهة طبية',
        senderNameEn: 'Healthcare Provider',
        textAr: 'مرحبًا بكم. هذه رسالة توضيحية لشكل التواصل داخل التطبيق؛ المواعيد الفعلية لا تُؤكَّد إلا من الجهة الطبية.',
        textEn: 'Hello! This is a sample message showing how in-app communication may look. Actual appointments must be confirmed by the healthcare provider.',
        timestamp: 'Yesterday',
      },
    ],
  },
  {
    id: 'thread-coparent',
    category: 'family',
    participantNameAr: 'أحمد ومريم (ركن تناغم الوالدين)',
    participantNameEn: 'Ahmad & Maryam (Co-Parenting Sync)',
    roleTitleAr: 'الحساب العائلي المشترك',
    roleTitleEn: 'Unified Family Account',
    scopedChildAr: 'كل الأطفال (حمزة وليلى ويوسف)',
    scopedChildEn: 'All Children (Hamza, Laila & Youssef)',
    onlineStatusAr: 'متصل',
    onlineStatusEn: 'Online',
    unreadCount: 0,
    messages: [
      {
        id: 20,
        sender: 'other',
        senderNameAr: 'أحمد',
        senderNameEn: 'Ahmad',
        textAr: 'أنهيت تمرين كرة القدم والسباحة مع يوسف، وسنقرأ قصة المساء مع ليلى ونجهز قيلولة حمزة فور عودتنا للمنزل إن شاء الله.',
        textEn: 'Finished football and swimming practice with Youssef! We will read the bedtime story with Laila and settle Hamza as soon as we get home.',
        timestamp: '06:10 PM',
      },
    ],
  },
];

interface InternalChatSectionProps {
  language: LanguageCode;
  darkMode?: boolean;
  onShowToast: (msg: string) => void;
}

export const InternalChatSection: React.FC<InternalChatSectionProps> = ({
  language,
  darkMode = false,
  onShowToast,
}) => {
  const isEn = language === 'en';
  const [threads, setThreads] = useState<ChatThread[]>(INITIAL_CHAT_THREADS);
  const [activeThreadId, setActiveThreadId] = useState<string>('thread-nursery');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'doctor' | 'nursery' | 'family'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [messageInput, setMessageInput] = useState<string>('');
  const [chatsArchived, setChatsArchived] = useState<boolean>(false);
  const emptyChatCopy = getEmptyStateCopy('chats', language);

  const filteredThreads = chatsArchived
    ? []
    : threads.filter((t) => {
        if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
        const q = searchQuery.trim().toLowerCase();
        if (!q) return true;
        const hay = `${t.participantNameAr} ${t.participantNameEn} ${t.roleTitleAr} ${t.scopedChildAr}`.toLowerCase();
        return hay.includes(q);
      });

  const activeThread =
    filteredThreads.find((t) => t.id === activeThreadId) || filteredThreads[0] || null;

  const handleSendMessage = (customText?: string) => {
    const text = sanitizeUserText(customText ?? messageInput, 500);
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
          ? 'تم استلام رسالتك في سجل متابعة الحضانة، وسنوافيكم بالتحديث فورًا.'
          : activeThread.category === 'doctor'
          ? 'شكرًا لتواصلكم مع العيادة، تم تسجيل استفساركم في ملف الطفل الطبي.'
          : 'تمام، وصلت رسالتك وتم تحديث تنسيق اليوم العائلي 👍.',
      textEn:
        'Message received and logged in your family care record.',
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
    onShowToast(isEn ? 'Message added' : 'تمت إضافة الرسالة');
  };

  return (
    <section className="space-y-5" aria-label={isEn ? 'Internal Family & Provider Chat' : 'المحادثات الداخلية والرسائل'}>
      {/* Image Background Hero & Category Filter Tabs Bar */}
      <div
        className="image-bg-card rounded-[24px] p-5 space-y-4"
        style={{ backgroundImage: getCardBackgroundSpec('chat', darkMode).backgroundImageCss }}
      >
        <div className="flex flex-col items-center justify-center text-center gap-2">
          <span className="image-card-badge px-3 py-1 rounded-full text-xs font-extrabold inline-flex items-center gap-1.5">
            <SoftFilledIcon id="shield" size={24} />
            <span>{isEn ? 'Family Messages · Child-Specific Access' : 'محادثات الأسرة · صلاحيات مرتبطة بكل طفل'}</span>
          </span>
          <h2 className="section-heading-centered image-card-title">
            {isEn ? 'Family & Care Team Messages' : 'رسائل الأسرة ومقدمي الرعاية'}
          </h2>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-1.5 p-1.5 rounded-2xl bg-white/90 border border-white/80 max-w-2xl mx-auto">
          {[
            { id: 'all', labelAr: 'الكل', labelEn: 'All' },
            { id: 'nursery', labelAr: 'الحضانة', labelEn: 'Nursery' },
            { id: 'doctor', labelAr: 'العيادات', labelEn: 'Doctors' },
            { id: 'family', labelAr: 'الأسرة', labelEn: 'Family' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCategoryFilter(tab.id as typeof categoryFilter)}
              className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-colors whitespace-nowrap ${
                categoryFilter === tab.id
                  ? 'bg-[#FF8C61] text-white shadow-2xs'
                  : 'text-slate-700 hover:bg-orange-50'
              }`}
            >
              {isEn ? tab.labelEn : tab.labelAr}
            </button>
          ))}
          <button
            id="toggle-empty-chats-btn"
            type="button"
            onClick={() => {
              const next = !chatsArchived;
              setChatsArchived(next);
              onShowToast(
                next
                  ? isEn
                    ? 'Conversations archived'
                    : 'تمت أرشفة المحادثات مؤقتًا'
                  : isEn
                  ? 'Active conversations restored'
                  : 'تمت استعادة المحادثات النشطة بنجاح'
              );
            }}
            className="min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-extrabold border border-orange-200 bg-orange-50 text-orange-950 hover:bg-orange-100 transition-colors whitespace-nowrap"
          >
            {chatsArchived
              ? isEn
                ? 'Show Chats'
                : 'عرض المحادثات'
              : isEn
              ? 'Archive Chats'
              : 'أرشفة المحادثات'}
          </button>
        </div>
      </div>

      {filteredThreads.length === 0 ? (
        <FriendlyEmptyState
          id="empty-chats-state"
          iconId="shield"
          tone="sky"
          title={emptyChatCopy.title}
          subtitle={emptyChatCopy.subtitle}
          actionLabel={emptyChatCopy.actionLabel}
          onAction={() => {
            setChatsArchived(false);
            setCategoryFilter('all');
            onShowToast(
              isEn
                ? 'Active conversations restored'
                : 'تمت استعادة المحادثات النشطة بنجاح'
            );
          }}
        />
      ) : (
        /* Two-Column Messaging Workspace */
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5 items-stretch">
          {/* Conversation List */}
          <div className="rounded-[24px] border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] p-3.5 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between px-2 py-0.5 text-xs font-extrabold text-[var(--color-muted)]">
              <span>{isEn ? 'Active Conversations' : 'المحادثات النشطة'}</span>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-[#2DD4BF]">
                ● {isEn ? 'Demo Messaging' : 'نموذج مراسلة تجريبي'}
              </span>
            </div>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isEn ? '🔍 Search conversations...' : '🔍 ابحث في المحادثات...'}
              aria-label={isEn ? 'Search conversations' : 'البحث في المحادثات'}
              className="w-full rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] px-3 py-2 text-xs font-semibold text-[var(--color-text)]"
            />
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
                className={`w-full p-3.5 rounded-2xl border text-start transition-colors space-y-1 cursor-pointer ${
                  isSelected
                    ? 'border-blue-600 dark:border-[#38BDF8] bg-sky-50/90 dark:bg-[#142430] shadow-2xs'
                    : 'border-transparent hover:bg-[var(--color-control-muted)] dark:hover:bg-[#142430]/70'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-[var(--color-text)] truncate">
                    {isEn ? thread.participantNameEn : thread.participantNameAr}
                  </span>
                  {thread.unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-extrabold tabular-nums">
                      {thread.unreadCount}
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-bold text-blue-800 dark:text-[#7DD3FC] truncate">
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
          <div className="rounded-[24px] border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] flex flex-col justify-between min-h-[460px] overflow-hidden shadow-2xs">
            {/* Chat Header */}
            <div className="p-4 border-b border-[var(--color-border)] dark:border-[#1E3646] bg-sky-50/60 dark:bg-[#142430] flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-[var(--color-text)]">
                  {isEn ? activeThread.participantNameEn : activeThread.participantNameAr}
                </h3>
                <div className="text-xs font-semibold text-[var(--color-muted)]">
                  {isEn ? activeThread.roleTitleEn : activeThread.roleTitleAr} ·{' '}
                  <span className="text-emerald-700 dark:text-[#2DD4BF] font-bold">
                    ● {isEn ? activeThread.onlineStatusEn : activeThread.onlineStatusAr}
                  </span>
                </div>
              </div>
              <div className="text-[11px] font-extrabold text-blue-900 dark:text-[#7DD3FC] bg-white dark:bg-[#101D26] border border-sky-200 dark:border-[#1E3646] px-3 py-1 rounded-xl shadow-2xs">
                🛡️ {isEn ? activeThread.scopedChildEn : activeThread.scopedChildAr}
              </div>
            </div>

            {/* Messages Viewport */}
            <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[330px]">
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
                          ? 'bg-blue-600 text-white rounded-ee-xs'
                          : 'bg-sky-50/80 dark:bg-[#142430] border border-sky-100 dark:border-[#1E3646] text-[var(--color-text)] rounded-es-xs'
                      }`}
                    >
                      <div className="font-extrabold text-[11px] opacity-80 mb-0.5">
                        {isEn ? msg.senderNameEn : msg.senderNameAr}
                      </div>
                      <div className="font-medium">{isEn ? msg.textEn : msg.textAr}</div>
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
            <div className="p-4 border-t border-[var(--color-border)] dark:border-[#1E3646] space-y-2.5 bg-[var(--color-surface)] dark:bg-[#101D26]">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  isEn ? 'Thank you for the update! 🌸' : 'شكرًا جزيلًا على المتابعة 🌸',
                  isEn ? 'On our way for pickup 🚗' : 'نحن في الطريق للاستلام الآن 🚗',
                  isEn ? 'Share today’s meal note 🍎' : 'ملاحظة وجبة الغداء اليوم 🍎',
                ].map((quick, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(quick)}
                    className="px-3 py-1.5 rounded-xl text-[11px] font-extrabold bg-sky-50 dark:bg-[#142430] border border-sky-200/70 dark:border-[#1E3646] text-sky-950 dark:text-[#7DD3FC] hover:bg-sky-100 transition-colors cursor-pointer"
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
                      ? 'Type a message...'
                      : 'اكتب رسالتك هنا...'
                  }
                  className="flex-1 rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] px-4 py-2.5 text-xs sm:text-sm font-semibold text-[var(--color-text)]"
                />
                <PrimaryCtaButton
                  variant="blue"
                  size="md"
                  onClick={() => handleSendMessage()}
                >
                  {isEn ? 'Send' : 'إرسال'}
                </PrimaryCtaButton>
              </div>
            </div>
          </div>
        )}
      </div>
      )}
    </section>
  );
};
