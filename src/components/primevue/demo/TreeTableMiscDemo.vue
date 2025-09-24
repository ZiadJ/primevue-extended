<template>
  <TreeTable
    ref="treeTableRef"
    :value="nodes"
    v-model:expandedKeys="expandedKeys"
    v-model:selectionKeys="selectedKeys"
    :metaKeySelection="true"
    :resizableColumns="true"
    scrollable
    @nodeSelect="nodeSelect"
  >
    <Column field="name" header="Name" expander resizable>
      <template #body="{ node }">
        <TreeLines class="tree-drag-item" :node :nodes>
          <div
            :draggable="true"
            @dragstart="(e) => handleDragStart(e, node)"
            @dragover="(e) => handleDragOver(e, node)"
            @drop="(e) => handleDrop(e, node)"
            @dragleave="handleDragLeave"
            :class="
              landingNode?.key === node.key
                ? 'tree-drag-over-' + landingPosition
                : ''
            "
          >
            <div class="rounded-full p-3 bg-surface-200 dark:bg-surface-800">
              {{ node.data.name }}
            </div>
          </div>
        </TreeLines>
      </template>
    </Column>
    <Column field="size" header="Size"> </Column>
    <Column field="type" header="Type" rowEditor="true"> </Column>
  </TreeTable>
  <!-- {{ expandedKeys }} -->
</template>

<script setup lang="ts">
import { ref, onMounted, watch, useTemplateRef } from 'vue'
import { NodeService } from '@/service/NodeService'
import { useSmoothTreeExpander } from '@/composables/useSmoothTreeExpander'
import { useTreeDragAndDrop } from '@/composables/useTreeDragAndDrop'
import TreeLines from '../TreeLines.vue'

let key = ref(0)
const treeTableRef = useTemplateRef('treeTableRef')
const nodes = ref([])
const expandedKeys = ref({ 0: true, '0-0': true })

useSmoothTreeExpander(treeTableRef, nodes, expandedKeys, {
  nodeCollapseClass: 'node-collapsed',
  nodeCollapseDuration: 200,
})

const {
  landingNode,
  landingPosition,
  handleDragStart,
  handleDragOver,
  handleDragLeave,
  handleDrop,
} = useTreeDragAndDrop(nodes, expandedKeys)

NodeService.getTreeTableNodes().then((data) => (nodes.value = data))
</script>

<style>
.tree-drag-item {
  cursor: move;
  border-radius: 6px;
  transition: background-color 250ms ease-in-out;
}

.tree-drag-over-before::before,
.tree-drag-over-after::after {
  content: '';
  position: absolute;
  left: -25%;
  right: -25%;
  height: 2px;
  background-color: var(--body-text-color);
  border-radius: 6px;
}

/*
.tree-drag-over-child,
.tree-drag-over-landed {
}
*/
</style>
