import type { RouteRecordRaw } from 'vue-router';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:folder-kanban',
      title: $t('datavision.datavision.title'),
      order: 2,
    },
    name: 'DataVision',
    path: '/datavision',
    component: () => import('#/views/datavision/basic.vue'),
  },
];

export default routes;
