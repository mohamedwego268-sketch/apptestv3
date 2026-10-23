import React from 'react';
import {
  FamilySpaceState,
  LanguageCode,
  ParentNotificationPrefs,
  generateThreeDailyNotifications,
} from '../domain/familySpaceCore';
import { ThreeDIcon } from './ThreeDVisuals';

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
}

export const NotificationsCenterSection: React.FC<NotificationsCenterSectionProps> = ({
  state,
  language,
  onSelectParentAccount,
  onUpdateNotificationPrefs,
  onToggleReadNotification,
  onMarkAllRead,
}) => {
  const activeParent = state.activeParentAccount;
  const parentProfile = state.parentAccounts[activeParent];
  const prefs = parentProfile.notificationPrefs;
  const notifications = generateThreeDailyNotifications(state, activeParent);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ThreeDIcon id="notifications" size={38} />
          <div>
            <h2 className="text-xl font-bold text-[var(--color-text)]">
              {language === 'en'
                ? 'Three Daily Parenting Notifications Center'
                : 'مركز الإشعارات اليومية للوالدين (٣ إشعارات يوميًا لكل والد)'}
            </h2>
            <p className="text-sm text-[var(--color-muted)]">
              {language === 'en'
                ? 'Independent daily guidance for Mother and Father (Morning, Midday, Evening) tailored to your children’s ages and routines.'
                : 'جدول إشعارات مستقل للأم وللأب (الصباح، الظهيرة، المساء) مخصص حسب أعمار أطفالك وروتين الأسرة مع احترام ساعات الهدوء.'}
            </p>
          </div>
        </div>

        {/* Parent Account Switcher */}
        <div className="flex items-center gap-2 bg-[var(--color-control-muted)] p-1.5 rounded-xl">
          <button
            type="button"
            onClick={() => onSelectParentAccount('mother')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeParent === 'mother'
                ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs'
                : 'text-[var(--color-muted)]'
            }`}
          >
            {language === 'en' ? '👩🏻 Mother Account (Sara)' : '👩🏻 حساب الأم (سارة)'}
          </button>
          <button
            type="button"
            onClick={() => onSelectParentAccount('father')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeParent === 'father'
                ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs'
                : 'text-[var(--color-muted)]'
            }`}
          >
            {language === 'en' ? '👨🏻 Father Account (Ahmed)' : '👨🏻 حساب الأب (أحمد)'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Notifications Feed (2 columns) */}
        <div className="lg:col-span-2 rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-[var(--color-text)]">
                {language === 'en'
                  ? `Today's 3 Parenting Notifications — ${parentProfile.fullName}`
                  : `رسائل وإشعارات اليوم الثلاثة — ${parentProfile.fullName}`}
              </h3>
              <p className="text-xs text-[var(--color-muted)]">
                {language === 'en'
                  ? `Unread: ${unreadCount} · Quiet Hours: ${prefs.quietHoursStart} to ${prefs.quietHoursEnd}`
                  : `غير مقروءة: ${unreadCount} · ساعات الهدوء: من ${prefs.quietHoursStart} إلى ${prefs.quietHoursEnd}`}
              </p>
            </div>
            <button
              type="button"
              onClick={onMarkAllRead}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--color-border)] bg-[var(--color-control-bg)] text-[var(--color-text)]"
            >
              {language === 'en' ? 'Mark all as read' : 'تحديد الكل كمقروء'}
            </button>
          </div>

          {!prefs.enabled && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900">
              {language === 'en'
                ? 'Optional parenting notifications are currently paused for this parent. Critical account and child safety alerts remain active.'
                : 'الإشعارات التربوية الاختيارية متوقفة مؤقتًا لهذا الحساب. تظل إشعارات أمان الحساب وتغييرات الصلاحيات نشطة دائمًا.'}
            </div>
          )}

          <div className="space-y-3">
            {notifications.map((notif) => {
              const slotBadgeStyle =
                notif.slot === 'morning'
                  ? 'bg-amber-50 text-amber-900 border-amber-200'
                  : notif.slot === 'midday'
                  ? 'bg-sky-50 text-sky-900 border-sky-200'
                  : notif.slot === 'evening'
                  ? 'bg-purple-50 text-purple-900 border-purple-200'
                  : 'bg-emerald-50 text-emerald-900 border-emerald-200';

              return (
                <div
                  key={notif.id}
                  className={`rounded-2xl border p-4 transition-all ${
                    notif.read
                      ? 'border-[var(--color-border)] bg-[var(--color-surface)] opacity-85'
                      : 'border-[var(--color-accent)] bg-[var(--color-control-bg)] shadow-xs'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${slotBadgeStyle}`}>
                      {language === 'en' ? notif.categoryLabelEn : notif.categoryLabelAr}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-[var(--color-muted)] tabular-nums">
                      <span>🕒 {notif.scheduledTime}</span>
                      <button
                        type="button"
                        onClick={() => onToggleReadNotification(notif.id)}
                        className="px-2.5 py-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[11px] font-semibold text-[var(--color-text)]"
                      >
                        {notif.read
                          ? language === 'en'
                            ? 'Mark Unread'
                            : 'تحديد كغير مقروء'
                          : language === 'en'
                          ? 'Mark Read'
                          : 'تم الاطلاع'}
                      </button>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-[var(--color-text)] mb-1">
                    {language === 'en' ? notif.titleEn : notif.titleAr}
                  </h4>
                  <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                    {language === 'en' ? notif.bodyEn : notif.bodyAr}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Per-Parent Preferences & Quiet Hours */}
        <div className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
          <h3 className="text-base font-bold text-[var(--color-text)]">
            {language === 'en'
              ? `Notification Preferences (${parentProfile.relationshipRole})`
              : `إعدادات إشعارات ${parentProfile.relationshipRole}`}
          </h3>

          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--color-control-muted)] cursor-pointer">
            <input
              type="checkbox"
              checked={prefs.enabled}
              onChange={(e) => onUpdateNotificationPrefs(activeParent, { enabled: e.target.checked })}
              className="mt-1 accent-[var(--color-accent)]"
            />
            <span className="text-xs text-[var(--color-text)]">
              <strong className="block">
                {language === 'en'
                  ? 'Enable 3 Daily Parenting Notifications'
                  : 'تفعيل الإشعارات التربوية الثلاثة يوميًا'}
              </strong>
              {language === 'en'
                ? 'Pause or disable optional tips anytime while keeping account/safety alerts active.'
                : 'يمكنك إيقاف النصائح اليومية مؤقتًا مع بقاء تنبيهات الأمان والحساب فعّالة.'}
            </span>
          </label>

          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between gap-2 text-xs">
              <label className="flex items-center gap-2 font-semibold text-[var(--color-text)]">
                <input
                  type="checkbox"
                  checked={prefs.morningEnabled}
                  disabled={!prefs.enabled}
                  onChange={(e) =>
                    onUpdateNotificationPrefs(activeParent, { morningEnabled: e.target.checked })
                  }
                  className="accent-[var(--color-accent)]"
                />
                <span>{language === 'en' ? '1. Morning Tip & Routine' : '١. إشعار الصباح والروتين'}</span>
              </label>
              <input
                type="time"
                aria-label="وقت إشعار الصباح"
                value={prefs.morningTime}
                disabled={!prefs.enabled || !prefs.morningEnabled}
                onChange={(e) =>
                  onUpdateNotificationPrefs(activeParent, { morningTime: e.target.value })
                }
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-control-bg)] px-2 py-1 text-xs tabular-nums"
              />
            </div>

            <div className="flex items-center justify-between gap-2 text-xs">
              <label className="flex items-center gap-2 font-semibold text-[var(--color-text)]">
                <input
                  type="checkbox"
                  checked={prefs.middayEnabled}
                  disabled={!prefs.enabled}
                  onChange={(e) =>
                    onUpdateNotificationPrefs(activeParent, { middayEnabled: e.target.checked })
                  }
                  className="accent-[var(--color-accent)]"
                />
                <span>{language === 'en' ? '2. Midday Growth & Play' : '٢. إشعار الظهيرة والنمو'}</span>
              </label>
              <input
                type="time"
                aria-label="وقت إشعار الظهيرة"
                value={prefs.middayTime}
                disabled={!prefs.enabled || !prefs.middayEnabled}
                onChange={(e) =>
                  onUpdateNotificationPrefs(activeParent, { middayTime: e.target.value })
                }
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-control-bg)] px-2 py-1 text-xs tabular-nums"
              />
            </div>

            <div className="flex items-center justify-between gap-2 text-xs">
              <label className="flex items-center gap-2 font-semibold text-[var(--color-text)]">
                <input
                  type="checkbox"
                  checked={prefs.eveningEnabled}
                  disabled={!prefs.enabled}
                  onChange={(e) =>
                    onUpdateNotificationPrefs(activeParent, { eveningEnabled: e.target.checked })
                  }
                  className="accent-[var(--color-accent)]"
                />
                <span>{language === 'en' ? '3. Evening Sleep & Reflection' : '٣. إشعار المساء والنوم'}</span>
              </label>
              <input
                type="time"
                aria-label="وقت إشعار المساء"
                value={prefs.eveningTime}
                disabled={!prefs.enabled || !prefs.eveningEnabled}
                onChange={(e) =>
                  onUpdateNotificationPrefs(activeParent, { eveningTime: e.target.value })
                }
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-control-bg)] px-2 py-1 text-xs tabular-nums"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--color-border)] space-y-2">
            <div className="text-xs font-bold text-[var(--color-text)]">
              {language === 'en' ? '🌙 Quiet Hours (Do Not Disturb)' : '🌙 ساعات الهدوء (عدم الإزعاج ليلاً)'}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[11px] text-[var(--color-muted)] mb-1">
                  {language === 'en' ? 'From' : 'من الساعة'}
                </label>
                <input
                  type="time"
                  value={prefs.quietHoursStart}
                  onChange={(e) =>
                    onUpdateNotificationPrefs(activeParent, { quietHoursStart: e.target.value })
                  }
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-control-bg)] px-2.5 py-1.5 text-xs tabular-nums"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[var(--color-muted)] mb-1">
                  {language === 'en' ? 'Until' : 'حتى الساعة'}
                </label>
                <input
                  type="time"
                  value={prefs.quietHoursEnd}
                  onChange={(e) =>
                    onUpdateNotificationPrefs(activeParent, { quietHoursEnd: e.target.value })
                  }
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-control-bg)] px-2.5 py-1.5 text-xs tabular-nums"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-[var(--color-notice)] text-[var(--color-notice-text)] p-3 text-xs leading-relaxed">
            {language === 'en'
              ? 'Simulation Note: This center demonstrates the 3-per-day parenting notification engine locally. Real mobile push notifications require backend FCM/APNs integration.'
              : 'ملاحظة الشفافية: يحاكي هذا المركز محرك الإشعارات اليومية الثلاثة محليًا داخل التطبيق. الإشعارات الفورية للهاتف (Push Notifications) تتطلب ربط خادم FCM/APNs في بيئة الإنتاج.'}
          </div>
        </div>
      </div>
    </div>
  );
};
