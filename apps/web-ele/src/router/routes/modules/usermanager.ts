import type { RouteRecordRaw } from 'vue-router';
import { $t } from '#/locales';
import { BusinessSuperAdmin } from '#/types/auth_code';
const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:users',
      title: $t('setting.user-manager.title'),
      order: 4,
      authority: [BusinessSuperAdmin],
    },
    name: 'UserManager',
    path: '/user-manager',
    component: () => import('#/views/usermanager/basic.vue'),
  },
];

export default routes;
