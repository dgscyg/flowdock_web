import type { RouteRecordRaw } from 'vue-router';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:settings',
      title: $t('system.system.title'),
      order: 5,
    },
    name: 'System',
    path: '/system',
    children: [
      {
        name: 'SystemBasic',
        path: '/system/basic',
        component: () => import('#/views/system/basic.vue'),
        meta: {
          icon: 'lucide:sliders-horizontal',
          title: $t('system.basic.title'),
        },
      },
    ],
  },
];

export default routes;
