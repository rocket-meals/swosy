/**
 * backendTranslations.ts – the texts for the backend-only keys of {@link BackendTranslationKeys}.
 *
 * Only keys that no app would ever show belong here. Everything generic (`Ja`, `Heute`, `Fehler`,
 * weekdays, months, …) comes from `commonTranslations` in `repo-depkit-common` and must not be
 * repeated – `BackendTranslations.test.ts` fails on a duplicate as well as on a missing language.
 *
 * Every key carries a non-empty text in **all** `ALL_TRANSLATION_LANGUAGES`, because a user with
 * an Arabic profile gets an Arabic push notification, not a German one with an Arabic fallback.
 */

import type { TranslationResources } from 'repo-depkit-common';

export const backendTranslations: TranslationResources = {
  /**
   * Body of the "your meal is served soon" push notification.
   * `{{date}}` is a day the user recognises ("Morgen", "24.08.2026"), `{{food}}` the meal name.
   */
  notification_foodoffer_body: {
    de: '{{date}}: {{food}}',
    en: '{{date}}: {{food}}',
    ar: '{{date}}: {{food}}',
    es: '{{date}}: {{food}}',
    fr: '{{date}} : {{food}}',
    ru: '{{date}}: {{food}}',
    tr: '{{date}}: {{food}}',
    zh: '{{date}}：{{food}}',
  },

  /** Used as `{{food}}` when the meal has no name in any language the user could read. */
  notification_foodoffer_unknown_food: {
    de: 'ein Gericht',
    en: 'a meal',
    ar: 'وجبة',
    es: 'un plato',
    fr: 'un plat',
    ru: 'блюдо',
    tr: 'bir yemek',
    zh: '一道菜',
  },

  /**
   * Rejection of a change to a dashboard that is shipped with Rocket Meals.
   * `{{marker}}` is the name marker from `SystemDashboardHelper.SYSTEM_NAME_SUFFIX`, so the text
   * never restates the marker as a literal.
   */
  dashboard_system_edit_forbidden: {
    de: 'Dieses Dashboard ist ein System-Dashboard (Kennzeichnung "{{marker}}" im Namen). System-Dashboards werden bei jedem Update zurückgesetzt und dürfen deshalb nicht bearbeitet werden. Bitte lege für eigene Auswertungen ein neues Dashboard an.',
    en: 'This dashboard is a system dashboard (marked with "{{marker}}" in its name). System dashboards are reset with every update and therefore cannot be edited. Please create a new dashboard for your own reports.',
    ar: 'هذه لوحة معلومات نظام (يُشار إليها بـ "{{marker}}" في الاسم). تتم إعادة ضبط لوحات معلومات النظام مع كل تحديث، ولذلك لا يمكن تعديلها. يرجى إنشاء لوحة معلومات جديدة لتقاريرك الخاصة.',
    es: 'Este panel es un panel del sistema (identificado con "{{marker}}" en el nombre). Los paneles del sistema se restablecen con cada actualización y por eso no se pueden editar. Crea un panel nuevo para tus propios análisis.',
    fr: 'Ce tableau de bord est un tableau de bord système (identifié par « {{marker}} » dans son nom). Les tableaux de bord système sont réinitialisés à chaque mise à jour et ne peuvent donc pas être modifiés. Veuillez créer un nouveau tableau de bord pour vos propres analyses.',
    ru: 'Это системная панель (обозначена «{{marker}}» в названии). Системные панели сбрасываются при каждом обновлении, поэтому их нельзя редактировать. Пожалуйста, создайте новую панель для собственных отчётов.',
    tr: 'Bu pano bir sistem panosudur (adında "{{marker}}" ile işaretlenmiştir). Sistem panoları her güncellemede sıfırlanır ve bu nedenle düzenlenemez. Kendi değerlendirmeleriniz için lütfen yeni bir pano oluşturun.',
    zh: '这是系统仪表板（名称中标有"{{marker}}"）。系统仪表板会在每次更新时被重置，因此无法编辑。请为自己的分析新建一个仪表板。',
  },

  /** Rejection of a change to a panel that belongs to a shipped dashboard. */
  dashboard_system_panel_edit_forbidden: {
    de: 'Dieses Panel gehört zu einem System-Dashboard (Kennzeichnung "{{marker}}" im Namen). System-Dashboards werden bei jedem Update zurückgesetzt und dürfen deshalb nicht bearbeitet werden. Bitte lege für eigene Auswertungen ein neues Dashboard an.',
    en: 'This panel belongs to a system dashboard (marked with "{{marker}}" in its name). System dashboards are reset with every update and therefore cannot be edited. Please create a new dashboard for your own reports.',
    ar: 'تنتمي هذه اللوحة إلى لوحة معلومات نظام (يُشار إليها بـ "{{marker}}" في الاسم). تتم إعادة ضبط لوحات معلومات النظام مع كل تحديث، ولذلك لا يمكن تعديلها. يرجى إنشاء لوحة معلومات جديدة لتقاريرك الخاصة.',
    es: 'Este panel pertenece a un panel del sistema (identificado con "{{marker}}" en el nombre). Los paneles del sistema se restablecen con cada actualización y por eso no se pueden editar. Crea un panel nuevo para tus propios análisis.',
    fr: 'Ce panneau appartient à un tableau de bord système (identifié par « {{marker}} » dans son nom). Les tableaux de bord système sont réinitialisés à chaque mise à jour et ne peuvent donc pas être modifiés. Veuillez créer un nouveau tableau de bord pour vos propres analyses.',
    ru: 'Эта панель относится к системной панели мониторинга (обозначена «{{marker}}» в названии). Системные панели сбрасываются при каждом обновлении, поэтому их нельзя редактировать. Пожалуйста, создайте новую панель для собственных отчётов.',
    tr: 'Bu bölme bir sistem panosuna aittir (adında "{{marker}}" ile işaretlenmiştir). Sistem panoları her güncellemede sıfırlanır ve bu nedenle düzenlenemez. Kendi değerlendirmeleriniz için lütfen yeni bir pano oluşturun.',
    zh: '此面板属于系统仪表板（名称中标有"{{marker}}"）。系统仪表板会在每次更新时被重置，因此无法编辑。请为自己的分析新建一个仪表板。',
  },
};
