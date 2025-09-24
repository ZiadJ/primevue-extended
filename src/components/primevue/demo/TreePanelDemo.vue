<template>
  <TreePanel
    ref="treePanelRef"
    v-model="selectedKeys"
    :items="items"
    checkbox
    badge
  >
    <template #label="{ item }">
      <span class="p-3">{{ item.label + ' (' + item.key + ')' }} </span>
    </template>
  </TreePanel>
  <br />
  <pre>
  <!-- {{ selectedKeys }} -->
  </pre>
</template>

<script setup>
import { ref, computed, useTemplateRef } from 'vue'
import TreePanel from '../TreePanel.vue'

const treePanelRef = useTemplateRef('treePanelRef')

const selectedKeys = ref({ '1_1': true })

setTimeout(() => {
  treePanelRef.value.setSelectedState('0_0', true)
}, 3000)

const items = ref([
  {
    key: '0',
    label: 'Users',
    icon: 'pi pi-users',
    items: [
      {
        key: '0_0',
        label: 'New',
        items: [
          {
            key: '0_1_0',
            label: 'Member',
          },
          {
            key: '0_1_1',
            label: 'Group',
          },
        ],
      },
      {
        key: '0_1',
        label: 'Search',
      },
    ],
  },
  {
    key: '1',
    label: 'Tasks',
    icon: 'pi pi-server',
    items: [
      {
        key: '1_0',
        label: 'Add New',
        items: [
          {
            key: '1_0_0',
            label: 'Tasks1',
            icon: 'pi pi-server',
          },
          {
            key: '1_0_1',
            label: 'Tasks2',
            icon: 'pi pi-server',
          },
        ],
      },
      {
        key: '1_1',
        label: 'Pending',
      },
      {
        key: '1_2',
        label: 'Overdue',
      },
    ],
  },
  {
    key: '2',
    label: 'Calendar',
    icon: 'pi pi-calendar',
    items: [
      {
        key: '2_0',
        label: 'New Event',
      },
      {
        key: '2_1',
        label: 'Today',
      },
      {
        key: '2_2',
        label: 'This Week',
      },
    ],
  },
])

/*const selectedKeysArray = computed({
  set: (value) => {
    selectedKeys.value = {};
  value.forEach((item) => (selectedKeys.value[item] = true));
},
get: () => {
  const result = [];
  for (const key in selectedKeys.value)
  if (selectedKeys.value[key] === true) result.push(key);
  return result;
},
});

selectedKeysArray.value = ['1_0_1'];
*/
</script>
