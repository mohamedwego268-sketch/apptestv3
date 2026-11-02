import React, { useState } from 'react';
import {
  FamilySpaceState,
  LanguageCode,
  ParentNotificationPrefs,
  generateThreeDailyNotifications,
  getEmptyStateCopy,
  locText,
} from '../domain/familySpaceCore';
import { getCardBackgroundSpec } from '../domain/cardBackgrounds';
import { FriendlyEmptyState, MasterPatternCard, PrimaryCtaButton, SoftFilledIcon } from './DesignSystem';

interface NotificationsCenterSectionProps {
  state: FamilySpaceState;
  language: LanguageCode;
  onUpdateNotificationPrefs: (
    parentId: 'mother' | 'father',
    patch: Partial<ParentNotificationPrefs>
  ) => void;
  onToggleReadNotification: (notifId: string) => void;
  onMarkAllRead: () => void;
  onShowToast?: (msg: string) => void;
}

export const NotificationsCenterSection: React.FC<NotificationsCenterSectionProps> = ({
  state,
  language,
  onUpdateNotificationPrefs,
  onToggleReadNotification,
  onMarkAllRead,
  onShowToast,
}) => {
  const isEn = language === 'en';
  const [isDismissedAll, setIsDismissedAll] = useState(false);
  const activeParent = state.activeParentAccount;
  const parentProfile = state.parentAccounts[activeParent];
  const prefs = parentProfile.notificationPrefs;
  const rawNotifications = generateThreeDailyNotifications(state, activeParent);
  // Clearing routine alerts must never remove the parent's always-available wellbeing support messages.
  const notifications = isDismissedAll
    ? rawNotifications.filter((notification) => notification.slot === 'support')
    : rawNotifications;
  const supportNotifications = notifications.filter((notification) => notification.slot === 'support');
  const routineNotifications = notifications.filter((notification) => notification.slot !== 'support');
  const unreadCount = notifications.filter((n) => !n.read).length;
  const emptyNotifCopy = getEmptyStateCopy('notifications', language);

  return (
    <div className="space-y-5">
      {/* Top Active Parent Image Background Hero Card */}
      <div
        className="image-bg-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 space-y-2.5"
        style={{ backgroundImage: getCardBackgroundSpec('notifications', state.darkMode).backgroundImageCss }}
      >
        <div className="flex flex-col items-center justify-center text-center gap-1.5">
          <div className="flex items-center justify-center gap-2 overflow-x-auto whitespace-nowrap no-scrollbar max-w-full">
            <span className="image-card-badge px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold inline-flex items-center gap-1.5 shrink-0">
              <SoftFilledIcon id="notifications" size={16} />
              <span>
                {isEn ? 'Family reminders & parent support' : 'تذكيرات الأسرة ودعم الأب والأم'} · {prefs.quietHoursStart}–{prefs.quietHoursEnd}
              </span>
            </span>
            <span className="image-card-badge px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold inline-flex items-center gap-1 shrink-0">
              <SoftFilledIcon id="family" size={14} />
              <span>{isEn ? locText(parentProfile.fullName, language) : parentProfile.fullName}</span>
            </span>
          </div>
          <h2 className="section-heading-centered image-card-title text-base sm:text-xl">
            {isEn
              ? `Today's Notifications — ${locText(parentProfile.fullName, language)}`
              : `إشعارات اليوم — ${parentProfile.fullName}`}
          </h2>
        </div>
      </div>

      {supportNotifications.length > 0 && (
        <section
          aria-labelledby="parent-support-notifications-heading"
          className="rounded-[24px] border border-rose-200/80 dark:border-rose-900/50 bg-gradient-to-br from-rose-50/80 via-white to-teal-50/70 dark:from-[#241D28] dark:via-[#101D26] dark:to-[#142B2A] p-4 sm:p-5 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 id="parent-support-notifications-heading" className="text-sm sm:text-base font-extrabold text-[var(--color-text)]">
                💚 {isEn ? 'A little support for you, Mom & Dad' : 'رسائل دعم نفسي للأب والأم'}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)]">
                {isEn
                  ? 'Always here for you, even when daily reminders are cleared or paused.'
                  : 'موجودة دائمًا، حتى عند مسح التذكيرات اليومية أو إيقافها.'}
              </p>
            </div>
            <span className="rounded-full bg-rose-100 dark:bg-rose-950/60 px-3 py-1 text-[11px] font-bold text-rose-700 dark:text-rose-200">
              {supportNotifications.length} {isEn ? 'messages' : 'رسائل'}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {supportNotifications.map((notif) => (
              <article
                key={notif.id}
                className="rounded-2xl border border-rose-100 dark:border-rose-900/40 bg-white/90 dark:bg-[#17232D] p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-extrabold text-rose-700 dark:text-rose-200">
                    {isEn ? notif.categoryLabelEn : notif.categoryLabelAr}
                  </span>
                  <span className="text-[10px] text-[var(--color-muted)]">
                    {isEn ? 'Daily support' : notif.scheduledTime}
                  </span>
                </div>
                <h4 className="text-sm font-extrabold leading-snug text-[var(--color-text)]">
                  {isEn ? notif.titleEn : notif.titleAr}
                </h4>
                <p className="text-xs leading-relaxed text-[var(--color-muted)]">
                  {isEn ? notif.bodyEn : notif.bodyAr}
                </p>
                <button
                  type="button"
                  onClick={() => onToggleReadNotification(notif.id)}
                  className="min-h-[40px] w-full rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-950/30 px-3 py-2 text-xs font-bold text-rose-800 dark:text-rose-100 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-colors"
                >
                  {notif.read
                    ? isEn ? 'Mark as unread' : 'تحديد كغير مقروءة'
                    : isEn ? 'Mark as read' : 'تم الاطلاع'}
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Notifications Feed (2 columns) */}
        <div className="lg:col-span-2 rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[var(--color-border)] dark:border-[#1E3646]">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-extrabold text-[var(--color-text)]">
                {isEn
                  ? `Family alerts (${routineNotifications.length})`
                  : `تنبيهات الأسرة (${routineNotifications.length})`}
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-teal-500/10 text-[10.5px] font-extrabold text-[#0d9488] dark:text-[#2DD4BF]">
                {isEn ? `Unread: ${unreadCount}` : `غير مقروءة: ${unreadCount}`}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                id="toggle-empty-notifications-btn"
                type="button"
                onClick={() => {
                  const next = !isDismissedAll;
                  setIsDismissedAll(next);
                  if (next) {
                    onMarkAllRead();
                  }
                  onShowToast?.(
                    next
                      ? isEn
                        ? 'Notifications cleared & marked as read'
                        : 'تم مسح قائمة الإشعارات وتحديدها كمقروءة'
                      : isEn
                      ? 'Notifications restored'
                      : 'تمت استعادة الإشعارات اليومية بنجاح'
                  );
                }}
                className="min-h-[30px] h-[30px] px-2.5 py-1 rounded-lg text-[11px] font-extrabold border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] text-[var(--color-text)] hover:border-[var(--color-accent)] transition-colors cursor-pointer"
              >
                {isDismissedAll
                  ? isEn
                    ? '🔄 Restore Alerts'
                    : '🔄 استعادة الإشعارات'
                  : isEn
                  ? '🗑️ Clear List'
                  : '🗑️ مسح الإشعارات'}
              </button>
              {notifications.length > 0 && unreadCount > 0 && (
                <PrimaryCtaButton
                  variant="orange"
                  size="sm"
                  onClick={onMarkAllRead}
                >
                  ✓ {isEn ? 'Mark All as Read' : 'تحديد الكل كمقروء'}
                </PrimaryCtaButton>
              )}
            </div>
          </div>

          {routineNotifications.length === 0 ? (
            <FriendlyEmptyState
              id="empty-notifications-state"
              iconId="notifications"
              tone="amber"
              title={emptyNotifCopy.title}
              subtitle={emptyNotifCopy.subtitle}
              actionLabel={emptyNotifCopy.actionLabel}
              onAction={() => {
                setIsDismissedAll(false);
                onShowToast?.(
                  isEn
                    ? 'Daily notifications restored'
                    : 'تمت استعادة الإشعارات اليومية بنجاح'
                );
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {routineNotifications.map((notif, idx) => {
                const slotTone =
                  notif.slot === 'support'
                    ? 'rose'
                    : notif.slot === 'morning'
                    ? 'amber'
                    : notif.slot === 'midday'
                    ? 'sky'
                    : 'teal';

                return (
                  <MasterPatternCard
                    key={notif.id}
                    tone={slotTone}
                    categoryKey="notifications"
                    itemIdOrIndex={idx + 1}
                    darkMode={state.darkMode}
                    onThumbnailClick={() => onToggleReadNotification(notif.id)}
                    topLeftBadge={isEn ? notif.categoryLabelEn : notif.categoryLabelAr}
                    topRightBadge={
                      <span>
                        🕒 {notif.scheduledTime}
                      </span>
                    }
                    title={isEn ? notif.titleEn : notif.titleAr}
                    metaLeft={
                      <span>
                        {notif.read
                          ? isEn
                            ? '✓ Read Notification'
                            : '✓ تم الاطلاع على التنبيه'
                          : isEn
                          ? '● Unread Smart Alert'
                          : '● تنبيه ذكي جديد'}
                      </span>
                    }
                    bodyContent={
                      <p className="text-xs font-semibold text-[var(--color-muted)] dark:text-[#94A3B8] leading-relaxed">
                        {isEn ? notif.bodyEn : notif.bodyAr}
                      </p>
                    }
                    footerLeft={
                      <span className="text-[11px] font-extrabold text-[var(--color-muted)] dark:text-[#A5F3FC]">
                        {isEn ? parentProfile.fullName : parentProfile.fullName}
                      </span>
                    }
                    footerRight={
                      <button
                        type="button"
                        onClick={() => onToggleReadNotification(notif.id)}
                        className="min-h-[34px] px-3 py-1 rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-white dark:bg-[#142430] text-[11px] font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC] hover:border-[var(--color-accent)] transition-colors cursor-pointer"
                      >
                        {notif.read
                          ? isEn
                            ? 'Mark Unread'
                            : 'كغير مقروء'
                          : isEn
                          ? 'Mark Read'
                          : 'تم الاطلاع'}
                      </button>
                    }
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Per-Parent Preferences & Quiet Hours */}
        <div className="rounded-[24px] border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] p-5 space-y-4 shadow-2xs">
          <h3 className="text-base font-extrabold text-[var(--color-text)]">
            ⚙️ {isEn ? 'Notification Schedule' : 'مواعيد الإشعارات وساعات الهدوء'}
          </h3>

          <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-amber-50/70 dark:bg-[#142430] border border-amber-200/80 dark:border-[#1E3646] cursor-pointer">
            <input
              type="checkbox"
              checked={prefs.enabled}
              onChange={(e) => onUpdateNotificationPrefs(activeParent, { enabled: e.target.checked })}
              className="w-4 h-4 accent-[var(--color-accent)]"
            />
            <span className="text-xs font-extrabold text-[var(--color-text)]">
              {isEn ? 'Schedule Daily Reminders' : 'تحديد مواعيد التذكيرات اليومية'}
            </span>
          </label>

          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between gap-2 text-xs">
              <label className="flex items-center gap-2 font-extrabold text-[var(--color-text)]">
                <input
                  type="checkbox"
                  checked={prefs.morningEnabled}
                  disabled={!prefs.enabled}
                  onChange={(e) =>
                    onUpdateNotificationPrefs(activeParent, { morningEnabled: e.target.checked })
                  }
                  className="accent-[var(--color-accent)]"
                />
                <span>☀️ {isEn ? 'Morning' : 'الصباح'}</span>
              </label>
              <input
                type="time"
                aria-label="وقت إشعار الصباح"
                value={prefs.morningTime}
                disabled={!prefs.enabled || !prefs.morningEnabled}
                onChange={(e) =>
                  onUpdateNotificationPrefs(activeParent, { morningTime: e.target.value })
                }
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-2.5 py-1 text-xs font-bold tabular-nums"
              />
            </div>

            <div className="flex items-center justify-between gap-2 text-xs">
              <label className="flex items-center gap-2 font-extrabold text-[var(--color-text)]">
                <input
                  type="checkbox"
                  checked={prefs.middayEnabled}
                  disabled={!prefs.enabled}
                  onChange={(e) =>
                    onUpdateNotificationPrefs(activeParent, { middayEnabled: e.target.checked })
                  }
                  className="accent-[var(--color-accent)]"
                />
                <span>🌤️ {isEn ? 'Midday' : 'الظهيرة'}</span>
              </label>
              <input
                type="time"
                aria-label="وقت إشعار الظهيرة"
                value={prefs.middayTime}
                disabled={!prefs.enabled || !prefs.middayEnabled}
                onChange={(e) =>
                  onUpdateNotificationPrefs(activeParent, { middayTime: e.target.value })
                }
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-2.5 py-1 text-xs font-bold tabular-nums"
              />
            </div>

            <div className="flex items-center justify-between gap-2 text-xs">
              <label className="flex items-center gap-2 font-extrabold text-[var(--color-text)]">
                <input
                  type="checkbox"
                  checked={prefs.eveningEnabled}
                  disabled={!prefs.enabled}
                  onChange={(e) =>
                    onUpdateNotificationPrefs(activeParent, { eveningEnabled: e.target.checked })
                  }
                  className="accent-[var(--color-accent)]"
                />
                <span>🌙 {isEn ? 'Evening' : 'المساء'}</span>
              </label>
              <input
                type="time"
                aria-label="وقت إشعار المساء"
                value={prefs.eveningTime}
                disabled={!prefs.enabled || !prefs.eveningEnabled}
                onChange={(e) =>
                  onUpdateNotificationPrefs(activeParent, { eveningTime: e.target.value })
                }
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-2.5 py-1 text-xs font-bold tabular-nums"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--color-border)] space-y-2">
            <div className="text-xs font-extrabold text-[var(--color-text)]">
              🌙 {isEn ? 'Quiet Hours' : 'ساعات الهدوء ليلاً'}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[var(--color-muted)] mb-1">
                  {isEn ? 'From' : 'من'}
                </label>
                <input
                  type="time"
                  value={prefs.quietHoursStart}
                  onChange={(e) =>
                    onUpdateNotificationPrefs(activeParent, { quietHoursStart: e.target.value })
                  }
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-2.5 py-1.5 text-xs font-bold tabular-nums"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[var(--color-muted)] mb-1">
                  {isEn ? 'Until' : 'حتى'}
                </label>
                <input
                  type="time"
                  value={prefs.quietHoursEnd}
                  onChange={(e) =>
                    onUpdateNotificationPrefs(activeParent, { quietHoursEnd: e.target.value })
                  }
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-2.5 py-1.5 text-xs font-bold tabular-nums"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
