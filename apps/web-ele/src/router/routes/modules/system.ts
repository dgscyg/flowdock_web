import type { RouteRecordRaw } from 'vue-router';
import { $t } from '#/locales';
import { BusinessSuperAdmin } from '#/types/auth_code';
const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:settings',
      title: $t('setting.system.title'),
      order: 5,
      authority: [BusinessSuperAdmin],
    },
    name: 'System',
    path: '/system',
    children: [
      // {
      //   name: 'SystemBasic',
      //   path: '/system/basic',
      //   component: () => import('#/views/setting/system/basic.vue'),
      //   meta: {
      //     icon: 'lucide:sliders-horizontal',
      //     title: $t('setting.basic.title'),
      //   },
      // },
      {
        name: 'SystemStorage',
        path: '/system/storage',
        component: () => import('#/views/setting/system/storage.vue'),
        meta: {
          icon: 'lucide:archive',
          title: $t('setting.storage.title'),
        },
      },
    ],
  },
];

export default routes;
