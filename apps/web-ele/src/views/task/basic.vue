<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue';

import { Timer } from '@element-plus/icons-vue';
import {
  ElButton,
  ElIcon,
  ElPopover,
  ElTable,
  ElTableColumn,
} from 'element-plus';

interface User {
  date: string;
  name: string;
  address: string;
}

const handleEdit = (index: number, row: User) => { };
const handleDelete = (index: number, row: User) => { };

const tableData = ref<User[]>([
  {
    date: '2016-05-03',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-02',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-04',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-01',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-03',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-02',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-04',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-01',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-03',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-02',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-04',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-01',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-03',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-02',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-04',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-01',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-03',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-02',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-04',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-01',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-03',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-02',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-04',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-01',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-03',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-02',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-04',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-01',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-03',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-02',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-04',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-01',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
]);

const tableHeight = ref(window.innerHeight - 120); // 120px 是预估的其他元素高度

// 监听窗口大小变化，动态调整表格高度
const updateTableHeight = () => {
  tableHeight.value = window.innerHeight - 120;
};

onMounted(() => {
  window.addEventListener('resize', updateTableHeight);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateTableHeight);
});
</script>

<template>
  <div class="table-container">
    <ElTable :data="tableData" :max-height="tableHeight" style="width: 100%">
      <ElTableColumn fixed label="Date" width="180">
        <template #default="scope">
          <div v-if="scope?.row" style="display: flex; align-items: center">
            <ElIcon>
              <Timer />
            </ElIcon> <span style="margin-left: 10px">{{
      scope.row.date
    }}</span>
          </div>
        </template>
      </ElTableColumn>
      <ElTableColumn label="Name" width="180">
        <template #default="scope">
          <ElPopover v-if="scope?.row" effect="light" trigger="hover" placement="top" width="auto">
            <template #default>
              <div>name: {{ scope.row.name }}</div>

              <div>address: {{ scope.row.address }}</div>
            </template>
          </ElPopover>
        </template>
      </ElTableColumn>
      <ElTableColumn label="Operations">
        <template #default="scope">
          <template v-if="scope?.row">
            <ElButton size="small" @click="handleEdit(scope.$index, scope.row)">
              Edit
            </ElButton>
            <ElButton size="small" type="danger" @click="handleDelete(scope.$index, scope.row)">
              Delete
            </ElButton>
          </template>
        </template>
      </ElTableColumn>
    </ElTable>
  </div>
</template>

<style scoped>
.table-container {
  box-sizing: border-box;
  height: 100%;
  padding: 16px;
}
</style>
