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
import { FriendlyEmptyState, PrimaryCtaButton, SectionHeader, SoftFilledIcon } from './DesignSystem';

interface NotificationsCenterSectionProps {
  state: FamilySpaceState;
  language: LanguageCode;
  onSelectParentAccount: (parentId: 'mother' | 'father') => void;
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
  onSelectParentAccount,
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
  const notifications = isDismissedAll ? [] : rawNotifications;
  const unreadCount = notifications.filter((n) => !n.read).length;
  const emptyNotifCopy = getEmptyStateCopy('notifications', language);

  return (
    <div className="space-y-5">
      {/* Top Parent Switcher Image Background Hero Card */}
      <div
        className="image-bg-card rounded-[24px] p-5 space-y-4"
        style={{ backgroundImage: getCardBackgroundSpec('notifications', state.darkMode).backgroundImageCss }}
      >
        <div className="flex flex-col items-center justify-center text-center gap-2">
          <span className="image-card-badge px-3 py-1 rounded-full text-xs font-extrabold inline-flex items-center gap-1.5">
            <SoftFilledIcon id="notifications" size={24} />
            <span>
              {isEn ? '3 Daily Notifications Engine' : '٣ إشعارات يومية مخصصة'} · {prefs.quietHoursStart}–{prefs.quietHoursEnd}
            </span>
          </span>
          <h2 className="section-heading-centered image-card-title">
            {isEn
              ? `Today's Notifications — ${locText(parentProfile.fullName, language)}`
              : `إشعارات اليوم — ${parentProfile.fullName}`}
          </h2>
        </div>

        <div className="flex items-center justify-center gap-1.5 bg-white/90 p-1.5 rounded-2xl border border-white max-w-sm mx-auto">
          <button
            type="button"
            onClick={() => onSelectParentAccount('mother')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-colors ${
              activeParent === 'mother'
                ? 'bg-[#FF8C61] text-white shadow-2xs'
                : 'text-slate-700'
            }`}
          >
            {isEn ? 'Mother (Sara)' : 'الأم (سارة)'}
          </button>
          <button
            type="button"
            onClick={() => onSelectParentAccount('father')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-colors ${
              activeParent === 'father'
                ? 'bg-[#FF8C61] text-white shadow-2xs'
                : 'text-slate-700'
            }`}
          >
            {isEn ? 'Father (Ahmed)' : 'الأب (أحمد)'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Notifications Feed (2 columns) */}
        <div className="lg:col-span-2 rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-extrabold text-[var(--color-text)]">
                {isEn
                  ? `Daily Smart Alerts (${notifications.length})`
                  : `تنبيهات اليوم الذكية (${notifications.length})`}
              </h3>
              <div className="text-xs font-bold text-[var(--color-muted)]">
                {isEn ? `Unread: ${unreadCount}` : `غير مقروءة: ${unreadCount}`}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
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
                className="min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-extrabold border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] text-[var(--color-text)] hover:border-[var(--color-accent)] transition-colors"
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
                  ✓ {isEn ? 'Mark All Read' : 'تحديد الكل كمقروء'}
                </PrimaryCtaButton>
              )}
            </div>
          </div>

          {notifications.length === 0 ? (
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
            <div className="space-y-3">
              {notifications.map((notif) => {
                const slotCardStyle =
                  notif.slot === 'morning'
                    ? 'bg-amber-50/75 dark:bg-[#142430] border-amber-200/75 dark:border-[#1E3646]'
                    : notif.slot === 'midday'
                    ? 'bg-sky-50/75 dark:bg-[#142430] border-sky-200/75 dark:border-[#1E3646]'
                    : 'bg-teal-50/75 dark:bg-[#142430] border-teal-200/75 dark:border-[#1E3646]';

                return (
                  <div
                    key={notif.id}
                    className={`rounded-2xl border p-4 transition-all ${slotCardStyle} ${
                      notif.read ? 'opacity-85' : 'shadow-2xs'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-xl bg-white dark:bg-[#101D26] border border-[var(--color-border)] dark:border-[#1E3646] text-[11px] font-extrabold text-[var(--color-text)] shadow-2xs">
                          {isEn ? notif.categoryLabelEn : notif.categoryLabelAr}
                        </span>
                        {notif.read && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 text-[10px] font-extrabold">
                            ✓ {isEn ? 'Read' : 'مقروء'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-extrabold text-[var(--color-muted)] tabular-nums">
                        <span>🕒 {notif.scheduledTime}</span>
                        <button
                          type="button"
                          onClick={() => onToggleReadNotification(notif.id)}
                          className="px-3 py-1 rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-white dark:bg-[#101D26] text-[11px] font-extrabold text-[var(--color-text)] hover:border-[var(--color-accent)] transition-colors"
                        >
                          {notif.read
                            ? isEn
                              ? 'Mark Unread'
                              : 'كغير مقروء'
                            : isEn
                            ? 'Mark Read'
                            : 'تم الاطلاع'}
                        </button>
                      </div>
                    </div>

                    <h4 className="text-sm font-extrabold text-[var(--color-text)] mb-1">
                      {isEn ? notif.titleEn : notif.titleAr}
                    </h4>
                    <p className="text-xs font-semibold text-[var(--color-muted)] leading-relaxed">
                      {isEn ? notif.bodyEn : notif.bodyAr}
                    </p>
                  </div>
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
              {isEn ? 'Enable 3 Daily Tips' : 'تفعيل الإشعارات اليومية الثلاثة'}
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
