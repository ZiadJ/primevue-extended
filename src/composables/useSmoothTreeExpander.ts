import {
  ref,
  type Ref,
  watch,
  onMounted,
  onBeforeUnmount,
  ComponentPublicInstance,
  useId,
} from 'vue'
import type { TreeNode } from 'primevue/treenode'
import type TreeTable from 'primevue/treetable'

export interface SmoothTreeExpanderOptions {
  collapseDuration?: number
  expandDuration?: number
  maxNodeHeight?: string
}

export function useSmoothTreeExpander(
  treeRef: Ref<ComponentPublicInstance<TreeNode> | null>,
  nodes: Ref<TreeNode[]>,
  expandedKeys: Ref<Record<string, boolean>>,
  options: SmoothTreeExpanderOptions = {}
) {
  const {
    collapseDuration = 200,
    expandDuration = 300,
    maxNodeHeight = '100px',
  } = options

  let isUpdating = false

  const UNIQUE_ID = `smooth-tree-expander-${useId()}`
  const NODE_COLLAPSED_CLASS = 'expander-node-collapsed'
  const styleElement = document.createElement('style')

  const styles = `
    @keyframes ${UNIQUE_ID}-tree-expand-node-expand {
      to {
        opacity: 1;
        transform: scaleY(1);
        max-height: ${maxNodeHeight};
      }
    }
    
    @keyframes ${UNIQUE_ID}-tree-expand-node-collapse-tr {
      to { opacity: 0; }
    }
    
    @keyframes ${UNIQUE_ID}-tree-expand-node-collapse {
      to {
        max-height: 0;
        padding: 0;
      }
    }
    
    .${UNIQUE_ID} tr > td > div {
      opacity: 0.25;
      transform: scaleY(0.8);
      max-height: 0;
      animation: ${UNIQUE_ID}-tree-expand-node-expand ${expandDuration}ms ease-in-out forwards;
      transform-origin: top;
    }
    
    .${UNIQUE_ID} tr.${NODE_COLLAPSED_CLASS} {
      animation: ${UNIQUE_ID}-tree-expand-node-collapse-tr ${collapseDuration}ms ease-in-out forwards;
    }
    
    .${UNIQUE_ID} tr.${NODE_COLLAPSED_CLASS} > td,
    .${UNIQUE_ID} tr.${NODE_COLLAPSED_CLASS} > td > div {
      animation: ${UNIQUE_ID}-tree-expand-node-collapse ${collapseDuration}ms ease-in-out forwards;
    }
  `

  onMounted(() => {
    const element = treeRef.value.$el as HTMLElement

    if (!element) return

    element.classList.add(UNIQUE_ID)

    styleElement.textContent = styles
    document.head.appendChild(styleElement)
  })

  onBeforeUnmount(() => {
    const element = treeRef.value.$el as HTMLElement

    if (element) element.classList.remove(UNIQUE_ID)

    if (styleElement.parentNode)
      styleElement.parentNode.removeChild(styleElement)
  })

  const findNodeByKey = (
    key: string,
    childNodes: TreeNode[] = nodes.value,
    parentNodes: TreeNode[] = []
  ): { node: TreeNode; parents: TreeNode[] } | null => {
    for (const node of childNodes) {
      if (node.key === key) return { node, parents: parentNodes }

      if (node.children?.length) {
        const foundPath = findNodeByKey(key, node.children, [
          node,
          ...parentNodes,
        ])
        if (foundPath) return foundPath
      }
    }
    return null
  }

  // Toggle class on child nodes
  function toggleNodes(childNodes: TreeNode[] = [], add = true) {
    for (const child of childNodes) {
      // Toggle class on this node
      const classes = (child.styleClass || '').split(' ').filter(Boolean)
      if (add && !classes.includes(NODE_COLLAPSED_CLASS)) {
        classes.push(NODE_COLLAPSED_CLASS)
      } else if (!add) {
        const index = classes.indexOf(NODE_COLLAPSED_CLASS)
        if (index !== -1) classes.splice(index, 1)
      }
      child.styleClass = classes.join(' ')

      // Process children if this node is expanded
      if (child.key && child.key in expandedKeys.value) {
        toggleNodes(child.children, add)
      }
    }
  }

  // Handle expanded keys changes
  const handleExpandedKeysChange = (newValue: object, oldValue: object) => {
    if (isUpdating) return

    // Find nodes that were collapsed
    const oldKeys = Object.keys(oldValue)
    const newKeys = Object.keys(newValue)
    const removedKeys = oldKeys.filter((key) => !newKeys.includes(key))

    // Animate closing of removed nodes
    for (const key of removedKeys) {
      // Temporarily restore expanded state for animation
      expandedKeys.value[key] = true

      const nodeData = findNodeByKey(key)
      if (nodeData?.node) {
        // Add collapse class to children
        toggleNodes(nodeData.node.children, true)

        // After animation duration, actually collapse
        setTimeout(() => {
          isUpdating = true
          delete expandedKeys.value[key]

          // Reset updating flag after Vue processes the change
          setTimeout(() => {
            isUpdating = false
          })

          // Remove collapse class
          toggleNodes(nodeData.node.children, false)
        }, collapseDuration)
      }
    }
  }

  function isLastChild(node: TreeNode, parent: TreeNode): boolean {
    if (!parent?.children?.length) return true
    return parent.children[parent.children.length - 1] === node
  }

  watch(() => ({ ...expandedKeys.value }), handleExpandedKeysChange)

  return {
    findNodeByKey,
    isLastChild,
  }
}
