import { ref, type Ref, reactive, watch } from 'vue'
import type { TreeNode } from 'primevue/treenode'

export interface TreeTableFilterOptions {
  stayOpenKeys?: Ref<Record<string, boolean>> // Keys for the nodes that need to stay open (typically the selection keys)
  minGlobalFilterLength?: 2
  filteredOutClass?: ''
  highlightClass?: ''
}

export function useTreeTableFilter(
  nodes = ref<TreeNode[]>([]),
  expandedKeys = ref<Record<string, boolean>>({}),
  options: TreeTableFilterOptions
) {
  const {
    stayOpenKeys = ref<Record<string, boolean>>({}),
    minGlobalFilterLength = 2,
    filteredOutClass = '',
    highlightClass = '',
  } = options

  const GLOBAL = 'global'

  const filters = reactive<Record<string, string>>({})

  const highlights = ref<Record<string, Record<string, string>>>({})

  const savedExpandedKeys = ref<Record<string, boolean>>({})

  const filterProps: Record<
    string,
    {
      minLength: number
      strict: boolean
      filterCallback?: (value: string) => boolean
    }
  > = {} //, regex: RegExp }> = {};

  let timerId = 0

  const highlightColumn = (
    node: TreeNode,
    field: string,
    minLength = 0,
    strict = false
  ): string => {
    if (!filterProps[field]) filterProps[field] = { minLength, strict }

    return highlights.value[node.key ?? '']?.[field] || node.data[field]
  }

  const hasSomeFilter = (filters: Record<string, string>): boolean => {
    return Object.entries(filters).some(
      ([key, value]) =>
        value &&
        value.length >=
          (key === GLOBAL ? minGlobalFilterLength : filterProps[key].minLength)
    )
  }

  const recursivelyStyleMatchingNodes = (
    childNodes: TreeNode[] | undefined,
    filters: Record<string, string>
  ): boolean => {
    let hasMatchingChild = false

    for (const node of childNodes || []) {
      const nodeMatch = highlightMatchingValues(node, filters)

      const childMatch = recursivelyStyleMatchingNodes(node.children, filters)

      const hidden = !nodeMatch && !childMatch
      if (hidden) {
        delete expandedKeys.value[node.key || '']

        if (!node.styleClass?.includes(` ${filteredOutClass}`))
          node.styleClass = `${node.styleClass || ''} ${filteredOutClass}`
      } else {
        if (childMatch && hasSomeFilter(filters))
          expandedKeys.value[node.key || ''] = true

        node.styleClass = node.styleClass?.replace(` ${filteredOutClass}`, '')
      }

      if (!hidden) hasMatchingChild = true
    }

    return hasMatchingChild
  }

  const commaToPattern = (
    text: string,
    minLength = 0,
    strict = false
  ): string => {
    const pattern = text
      .split(',')
      .map((p) => (strict && p.trimStart() ? '^' : '') + p.trimStart())
      .filter((p) => p.length >= minLength)
      .join('|')
    return pattern
  }

  const highlightMatchingValues = (
    node: TreeNode,
    filters: Record<string, string>
  ): boolean => {
    const key = node.key || ''

    const globalPattern =
      filters[GLOBAL]?.length >= minGlobalFilterLength ? filters[GLOBAL] : ''

    const fieldsToSearch = Object.keys(filterProps).filter(
      (key) => (filters[key] || globalPattern) && key !== GLOBAL
    )

    let allFieldsMatched = true
    let anyGlobalMatched = !globalPattern // If no global pattern, consider it matched

    for (const field of fieldsToSearch) {
      const text = node.data[field]?.toString() || ''
      const props = filterProps[field]

      let highlighted = text

      const fieldPattern =
        filters[field]?.length >= props.minLength ? filters[field] : ''

      let fieldMatched = !fieldPattern // If no field pattern, consider it matched

      if (globalPattern)
        if (new RegExp(globalPattern, 'gi').test(text)) anyGlobalMatched = true

      if (fieldPattern)
        fieldMatched = props.filterCallback
          ? props.filterCallback(text)
          : new RegExp(
              commaToPattern(fieldPattern, props.minLength, props.strict),
              'gi'
            ).test(text)

      if (globalPattern || fieldPattern) {
        highlighted = text.replace(
          new RegExp(
            `(${[
              globalPattern,
              commaToPattern(fieldPattern, props.minLength, props.strict),
            ]
              .filter(Boolean)
              .join('|')})`,
            'gi'
          ),
          (match: string) => `<mark class="${highlightClass}">${match}</mark>`
        )

        if (!highlights.value[key]) highlights.value[key] = {}

        highlights.value[key][field] = highlighted
      }

      allFieldsMatched = allFieldsMatched && fieldMatched
    }

    return allFieldsMatched && anyGlobalMatched
  }

  watch(
    () => ({ ...filters }),
    (newValue, oldValue) => {
      const hadFilters = hasSomeFilter(oldValue)
      const hasFilters = hasSomeFilter(newValue)

      if (hasFilters && !hadFilters) {
        savedExpandedKeys.value = expandedKeys.value
        expandedKeys.value = {}
      }

      clearInterval(timerId)
      timerId = window.setTimeout(
        () => {
          highlights.value = {}

          recursivelyStyleMatchingNodes(nodes.value, filters)

          if (!hasFilters) {
            expandedKeys.value = savedExpandedKeys.value
            // Keep selected keys expanded if any
            for (const key in stayOpenKeys.value) {
              for (const node of findParentNodesByKey(nodes.value, key) || [])
                expandedKeys.value[node.key || ''] = true
            }
          }
        },
        !hasFilters ||
          Object.values(newValue).some((v) => v?.length > minGlobalFilterLength)
          ? 150
          : 500
      )
    }
  )

  const findParentNodesByKey = (
    nodes: TreeNode[],
    key: string,
    parentNodes: TreeNode[] = []
  ): TreeNode[] | null => {
    for (const node of nodes) {
      const path = [...parentNodes, node]
      if (node.key === key) return path

      const foundPath = findParentNodesByKey(node.children || [], key, path)
      if (foundPath) return foundPath
    }
    return null
  }

  /*
  let isUpdating = false

  watch(
    () => ({ ...expandedKeys.value }),
    (newValue, oldValue) => {
      if (isUpdating || hasSomeFilter(filters)) return
  )
  */

  return {
    filters,
    highlightColumn,
    highlights,
  }
}
