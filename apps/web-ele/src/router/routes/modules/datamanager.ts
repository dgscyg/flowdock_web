import type { RouteRecordRaw } from 'vue-router';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:database',
      title: $t('datamanager.datamanager.title'),
      order: 3,
    },
    name: 'DataManager',
    path: '/datamanager',
    component: () => import('#/views/datamanager/basic.vue'),
  },
];

export default routes;
