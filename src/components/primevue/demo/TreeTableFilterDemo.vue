<template>
  <TreeTable
    ref="treeTableRef"
    :value="nodes"
    v-model:expandedKeys="expandedKeys"
    :resizableColumns="true"
    scrollable
    @nodeSelect="unSelect"
  >
    <template #header>
      <div class="flex justify-end">
        <IconField>
          <InputIcon class="pi pi-search" />
          <InputText v-model="filters.global" placeholder="Search" />
        </IconField>
      </div>
    </template>
    <Column field="name" header="Name" expander resizable>
      <template #filter>
        <InputText
          v-model.trim="filters['name']"
          placeholder="Filter by name"
        />
      </template>
      <template #body="{ node }">
        <span class="" v-html="highlightColumn(node, 'name', 2)"></span>
      </template>
    </Column>
    <Column field="size" header="Size">
      <template #filter>
        <InputText
          v-model.trim="filters['size']"
          placeholder="Filter by size"
        />
      </template>
      <template #body="{ node }">
        <span v-html="highlightColumn(node, 'size', 0, true)"></span>
      </template>
    </Column>
    <Column field="type" header="Type" rowEditor="true">
      <template #filter>
        <InputText
          v-model.trim="filters['type']"
          placeholder="Filter by type"
        />
      </template>
      <template #body="{ node, column }">
        <span v-html="highlightColumn(node, 'type')"></span>
      </template>
    </Column>
  </TreeTable>
  <br />
  <br />
  <br />
  {{ filters }}
</template>

<script setup>
import { ref, onMounted, watch, useTemplateRef } from 'vue'
import { NodeService } from '@/service/NodeService'
import { useTreeTableFilter } from '@/composables/useTreeTableFilter'
import { useSmoothTreeExpander } from '@/composables/useSmoothTreeExpander'
import { useTreeDragAndDrop } from '@/composables/useTreeDragAndDrop'
import TreeLines from '../TreeLines.vue'

let key = ref(0)
const treeTableRef = useTemplateRef('treeTableRef')
const nodes = ref([])
const expandedKeys = ref({ 0: true, '0-0': true })

useSmoothTreeExpander(treeTableRef, nodes, expandedKeys)

const { filters, highlightColumn } = useTreeTableFilter(nodes, expandedKeys, {
  filteredOutClass: 'filtered-out-node',
})

NodeService.getTreeTableNodes().then((data) => (nodes.value = data))

//const unSelect = (node) =>
//  selectedKeys.value[node.key]
//    ? setTimeout(() => delete selectedKeys.value[node.key])
//    : ''
</script>

<style scoped>
:deep(.filtered-out-node) > td > div {
  opacity: 0.65 !important;
}
</style>
