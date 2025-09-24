// useTreeDragAndDrop.ts
import { ref, type Ref, nextTick } from 'vue'
import type { TreeNode } from 'primevue/treenode'

export function useTreeDragAndDrop(
  nodes: Ref<TreeNode[]>,
  expandedKeys: Ref<{ [key: string]: boolean }>,
  expandDelay = 1000,
  dropHighlightDuration = 1000
) {
  const draggedNode = ref<TreeNode | null>(null)
  const landingNode = ref<TreeNode | null>(null)
  const landingPosition = ref<'before' | 'after' | 'child' | 'landed' | null>(
    null
  )
  const treeUpdated = ref(0) // Counter to trigger tree visualization updates

  let expandTimeout = 0
  let highlightTimeout = 0

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

  function isDescendant(
    potentialChild: TreeNode,
    potentialParent: TreeNode
  ): boolean {
    if (!potentialParent.children || !potentialParent.children.length)
      return false

    for (const child of potentialParent.children) {
      if (child.key === potentialChild.key) return true
      if (isDescendant(potentialChild, child)) return true
    }

    return false
  }

  function handleDragStart(event: DragEvent, node: TreeNode) {
    draggedNode.value = node
    event.dataTransfer?.setData('text', node.key || '')

    if (landingPosition.value === 'landed') {
      landingNode.value = null
      landingPosition.value = null
    }

    clearTimeout(highlightTimeout)
  }

  function handleDragOver(event: DragEvent, node: TreeNode) {
    event.preventDefault()

    if (!draggedNode.value || draggedNode.value.key === node.key) return

    // Check if trying to drop on its own descendant
    if (draggedNode.value && isDescendant(node, draggedNode.value)) return

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    const mouseY = event.clientY
    const threshold = rect.height / 4

    landingNode.value = node

    landingPosition.value =
      mouseY < rect.top + threshold
        ? 'before'
        : mouseY > rect.bottom - threshold
        ? 'after'
        : 'child'

    if (
      expandTimeout === 0 &&
      landingPosition.value === 'child' &&
      node.children?.length
    )
      expandTimeout = window.setTimeout(() => {
        expandedKeys.value[node.key || ''] = !expandedKeys.value[node.key || ''] // toggle expansion
      }, expandDelay)
  }

  function handleDragLeave() {
    if (landingPosition.value !== 'landed')
      landingPosition.value = landingNode.value = null

    clearTimeout(expandTimeout)
    expandTimeout = 0
  }

  function handleDrop(event: DragEvent, targetNode: TreeNode) {
    event.preventDefault()

    clearTimeout(expandTimeout)

    if (!draggedNode.value || draggedNode.value.key === targetNode.key)
      return resetDragState()

    // Check if dropping on descendant
    if (draggedNode.value && isDescendant(targetNode, draggedNode.value))
      return resetDragState()

    // Find and remove the dragged node from its current position
    const draggedNodeResult = findNodeByKey(draggedNode.value.key || '')
    if (draggedNodeResult) {
      const { node: dragNode, parents } = draggedNodeResult
      const nodeToMove = { ...dragNode } // Clone to avoid reference issues

      // Remove node from its current position
      if (parents.length > 0) {
        const parentNode = parents[0]
        if (parentNode.children) {
          const index = parentNode.children.findIndex(
            (child) => child.key === dragNode.key
          )
          if (index !== -1) {
            parentNode.children.splice(index, 1)
          }
          //if(!parentNode.children.length)
          //  delete parentNode.children
        }
      } else {
        const index = nodes.value.findIndex((n) => n.key === dragNode.key)
        if (index !== -1) {
          nodes.value.splice(index, 1)
        }
      }

      // Add node to new position
      if (landingPosition.value === 'child') {
        if (!targetNode.children) targetNode.children = []
        targetNode.children.push(nodeToMove)
        expandedKeys.value[targetNode.key || ''] = true
      } else {
        const targetNodeResult = findNodeByKey(targetNode.key || '')
        if (targetNodeResult) {
          const { parents: targetParents } = targetNodeResult

          if (targetParents.length > 0) {
            const parentNode = targetParents[0]
            if (parentNode.children) {
              const targetIndex = parentNode.children.findIndex(
                (child) => child.key === targetNode.key
              )
              if (targetIndex !== -1) {
                const newIndex =
                  landingPosition.value === 'after'
                    ? targetIndex + 1
                    : targetIndex
                parentNode.children.splice(newIndex, 0, nodeToMove)
              }
            }
          } else {
            const targetIndex = nodes.value.findIndex(
              (n) => n.key === targetNode.key
            )
            if (targetIndex !== -1) {
              const newIndex =
                landingPosition.value === 'after'
                  ? targetIndex + 1
                  : targetIndex
              nodes.value.splice(newIndex, 0, nodeToMove)
            }
          }
        }
      }
    }

    landingNode.value = targetNode
    landingPosition.value = 'landed'
    highlightTimeout = window.setTimeout(() => {
      if (landingPosition.value === 'landed') {
        landingNode.value = null
        landingPosition.value = null
      }
    }, dropHighlightDuration)

    draggedNode.value = null

    // Force a tree update after the drop operation
    nextTick(() => {
      treeUpdated.value++
    })
  }

  function resetDragState() {
    if (landingPosition.value !== 'landed') {
      landingPosition.value = null
      landingNode.value = null
    }
    draggedNode.value = null
  }

  return {
    draggedNode,
    landingNode,
    landingPosition,
    treeUpdated,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    expandedKeys,
    findNodeByKey,
  }
}
