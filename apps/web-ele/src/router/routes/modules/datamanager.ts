import type { RouteRecordRaw } from 'vue-router';
import { $t } from '#/locales';
import { UserCode } from '#/types/auth_code';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:database',
      title: $t('datamanager.datamanager.title'),
      order: 3,
      authority: [UserCode],
    },
    name: 'DataManager',
    path: '/datamanager',
    component: () => import('#/views/datamanager/basic.vue'),
  },
];

export default routes;
