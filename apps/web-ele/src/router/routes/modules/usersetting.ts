import type { RouteRecordRaw } from 'vue-router';
import { $t } from '#/locales';
import { UserCode } from '#/types/auth_code';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:settings',
      title: $t('setting.user.title'),
      order: 5,
      authority: [UserCode],
    },
    name: 'UserSetting',
    path: '/user',
    component: () => import('#/views/setting/user/basic.vue'),
  },
];

export default routes;
