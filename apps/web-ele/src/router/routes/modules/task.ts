import type { RouteRecordRaw } from 'vue-router';
import { $t } from '#/locales';
import { UserCode } from '#/types/auth_code';
const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:list-checks',
      title: $t('task.task.title'),
      order: 1,
      authority: [UserCode],
    },
    name: 'Task',
    path: '/task',
    component: () => import('#/views/task/basic.vue'),
  },
];

export default routes;
