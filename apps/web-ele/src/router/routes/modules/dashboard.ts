import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';
import { BusinessSuperAdmin } from '#/types/auth_code';
import { UserCode } from '#/types/auth_code';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:layout-dashboard',
      order: -1,
      title: $t('page.dashboard.title'),
    },
    name: 'Dashboard',
    path: '/dashboard',
    children: [
      {
        name: 'Workspace',
        path: '/workspace',
        component: () => import('#/views/dashboard/workspace/index.vue'),
        meta: {
          affixTab: true,
          icon: 'carbon:workspace',
          title: $t('page.dashboard.workspace'),
          authority: [UserCode],
        },
      },
      {
        name: 'Analytics',
        path: '/analytics',
        component: () => import('#/views/dashboard/analytics/index.vue'),
        meta: {
          icon: 'lucide:area-chart',
          title: $t('page.dashboard.analytics'),
          authority: [UserCode],
        },
      },
      {
        name: 'Overview',
        path: '/overview',
        component: () => import('#/views/dashboard/overview/index.vue'),
        meta: {
          icon: 'lucide:workspace',
          title: $t('page.dashboard.overview'),
          authority: [BusinessSuperAdmin],
        },
      },
    ],
  },
];

export default routes;
