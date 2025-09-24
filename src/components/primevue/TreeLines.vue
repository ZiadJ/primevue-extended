<script setup lang="ts">
import { computed } from 'vue'
import { TreeNode } from 'primevue/treenode'

interface NodeResult {
  node: TreeNode
  parents: TreeNode[]
}

interface NodeToggleInfo {
  toggleNode: TreeNode
  parentKeys: string[]
  level?: number
  isChild?: boolean
}

const props = defineProps<{
  node: TreeNode
  nodes: TreeNode[]
}>()

const emit = defineEmits<{
  'node-toggle': [nodeInfo: NodeToggleInfo]
}>()

// Find the node in the tree and get its parents
const nodeResult = computed<NodeResult>(() => {
  return (
    findNodeByKey(props.node.key, props.nodes) || {
      node: props.node,
      parents: [],
    }
  )
})

const parents = computed<TreeNode[]>(() => nodeResult.value.parents)

// Check if a node is the last child in its parent
const isLast = (parentLevel: number): boolean => {
  const child = parents.value[parentLevel - 1] || props.node
  const parent = parents.value[parentLevel]
  if (!parent || !parent.children?.length) return true

  const nodeIndex = parent.children.findIndex((n) => n.key === child.key)
  return nodeIndex === parent.children.length - 1
}

// Toggle a parent node
const toggleByParent = (
  parents: TreeNode[],
  parent: TreeNode,
  level: number
): void => {
  const parentKeys = parents.slice(level).map((p) => p.key)

  // Create a payload to emit
  const nodeInfo: NodeToggleInfo = {
    toggleNode: parent,
    parentKeys: parentKeys,
    level: level,
  }

  emit('node-toggle', nodeInfo)
}

// Toggle a child node
const toggleByChild = (parents: TreeNode[], node: TreeNode): void => {
  const parentKeys = parents.map((p) => p.key)

  // Create a payload to emit
  const nodeInfo: NodeToggleInfo = {
    toggleNode: node,
    parentKeys: [node.key, ...parentKeys],
    isChild: true,
  }

  emit('node-toggle', nodeInfo)
}

// Helper function to find a node by key
function findNodeByKey(
  key: string,
  childNodes: TreeNode[] = [],
  parentNodes: TreeNode[] = []
): NodeResult | null {
  for (const node of childNodes) {
    if (node.key === key) return { node, parents: parentNodes }

    if (node.children && node.children.length) {
      const foundPath = findNodeByKey(key, node.children, [
        node,
        ...parentNodes,
      ])

      if (foundPath) return foundPath
    }
  }
  return null
}
</script>

<template>
  <div class="relative">
    <div
      v-if="parents.length"
      :class="!node.children?.length ? 'w-8' : 'w-0'"
      class="tree-line absolute border-b border-l bottom-1/2 cursor-pointer"
      style="left: -2.5rem; height: 200px; border-bottom-left-radius: 1rem"
      @click.stop="toggleByChild(parents, node)"
    >
      <template v-for="(parent, i) in parents">
        <div
          v-if="!isLast(i)"
          :key="i"
          class="absolute w-3 -top-4 -bottom-20 cursor-pointer"
          :style="`left: calc(${-i}rem - 6px)`"
          @click.stop="toggleByParent(parents, parent, i)"
        >
          <div class="absolute left-1/2 top-0 bottom-0 w-px"></div>
        </div>
      </template>
    </div>
    <slot></slot>
  </div>
</template>

<style scoped>
.tree-line {
  border-color: var(--p-surface-400);
}

.tree-line > div > div {
  background-color: var(--p-surface-400);
}
/*
.tree-line:hover {
  border-color: var(--primary-color, #3b82f6);
}
*/
</style>
