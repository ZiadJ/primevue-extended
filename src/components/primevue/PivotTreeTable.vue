<script setup lang="ts" generic="T extends DataItem">
import { ref, watch, useTemplateRef, computed, useSlots } from 'vue'
import type { TreeTableProps, TreeTableSortEvent } from 'primevue/treetable'
import type { TreeNode } from 'primevue/treenode'
import {
  localeComparator,
  resolveFieldData,
  sort,
} from '@primeuix/utils/object'
import type { ColumnNode } from 'primevue/column'
import type TreeTable from 'primevue/treetable'

// Generic interface for data items
export interface DataItem {
  id: string | number
  [key: string]: unknown
}

export interface PivotTreeTableProps<T extends DataItem>
  extends /* @vue-ignore */ Omit<TreeTableProps, 'value'> {
  value?: T[] | undefined
  groupFields?: string[] // The list of fields to group by
  groupableOnly?: boolean // Only show groupable fields in the dropdown
  sortOnchange?: boolean // Resort when the data is edited
  debug?: boolean // Show the node data underneath the table for debugging puposes
  formatExpanderText?: (
    field: string,
    groupKey: string,
    children: T[] | undefined
  ) => string // The function to format each node text
}

const props = withDefaults(defineProps<PivotTreeTableProps<T>>(), {
  value: () => [],
  groupFields: () => [],
  groupableOnly: false,
  debug: false,
  formatExpanderText: (field: string, groupKey: string, children: T[] = []) =>
    `${String(field)}: ${groupKey} (${children.length})`,
})

const emit =
  defineEmits<
    (event: 'group-change', activeGroupFields: string[] | undefined) => void
  >()

type TreeTableType = InstanceType<typeof TreeTable> & {
  columns: ColumnNode[]
}

const treetable = useTemplateRef<TreeTableType>('treetable')
const activeGroupFields = defineModel<string[]>('activeGroupFields', {
  default: [],
})
const nodes = ref<TreeNode[]>([])

const sortField = ref<string | undefined>(undefined)
const sortOrder = ref<number | undefined>(undefined)

// Watch for changes in value, activeGroupFields, and sorting
watch(
  [() => props.value, activeGroupFields, sortField, sortOrder],
  () => loadData(),
  { deep: props.sortOnchange, immediate: true }
)

function loadData() {
  const columns = treetable.value?.columns

  const expanderColumn = columns?.find((c: ColumnNode) => 'expander' in c.props)

  if (expanderColumn) {
    nodes.value = groupAsTreeTableData(
      props.value,
      expanderColumn.props.field as string,
      activeGroupFields.value
    )
  }
}

watch(activeGroupFields, () => {
  emit('group-change', activeGroupFields.value)
})

// Handle sort event from TreeTable
function onSort(event: TreeTableSortEvent) {
  sortField.value = event.sortField as string
  sortOrder.value = event.sortOrder as number
}

function isGroupableField(items: T[] | null, property: string): boolean {
  const values = items?.map((item) => item[property])
  const uniqueValues = new Set(values)
  return uniqueValues.size === 1 || uniqueValues.size === values?.length
}

const groupableFields = computed(() => {
  if (!props.value?.length) return []

  if (props.groupFields.length)
    return props.groupFields.filter(
      (field) => !isGroupableField(props.value, field)
    )

  return Object.keys(props.value[0]).filter(
    (field) => !props.groupableOnly || !isGroupableField(props.value, field)
  ) as string[]
})

function sortNodes(
  nodes: TreeNode[],
  sortField: string | undefined,
  sortOrder: number | undefined
): TreeNode[] {
  if (!sortField || sortOrder === null) return nodes
  return [...nodes].sort((a, b) => {
    return sort(
      resolveFieldData(a.data, sortField),
      resolveFieldData(b.data, sortField),
      sortOrder,
      localeComparator()
    )
  })
}

function groupAsTreeTableData(
  items: T[] | undefined = [],
  expanderFieldname = '',
  fields: string[] = []
): TreeNode[] {
  if (!fields.length) {
    const nodes = (items || []).map((item) => ({
      key: item.id.toString(),
      data: item,
    }))
    return sortNodes(nodes, sortField.value, sortOrder.value)
  }

  const field = fields[0]
  const group = Object.groupBy(items || [], (item) => item[field] as string)

  const groupedNodes = Object.entries(group).map(([groupKey, children]) => ({
    key: `groupedBy-${String(field)}-${groupKey}`,
    data: {
      [expanderFieldname]: props.formatExpanderText(field, groupKey, children),
    },
    children: groupAsTreeTableData(
      children,
      expanderFieldname,
      fields.slice(1)
    ),
  }))

  return sortNodes(groupedNodes, sortField.value, sortOrder.value)
}

function onClick(event: PointerEvent) {
  const el = event.target as HTMLElement
  const row = el
    .closest('tr')
    ?.querySelector('.p-treetable-node-toggle-button') as HTMLElement

  if (row) row.click()
}

defineExpose({
  nodes,
  activeGroupFields,
  groupableFields,
  treetable,
  loadData,
})
</script>

<template>
  <div class="grouped-tree-table">
    <slot name="groupSelect" :data="{ activeGroupFields, groupFields }">
      <MultiSelect
        v-model="activeGroupFields"
        :options="groupableFields"
        placeholder="Select columns to group by"
        display="chip"
        class="mb-3"
      />
    </slot>

    <TreeTable
      ref="treetable"
      :value="nodes"
      v-bind="$attrs"
      @sort="onSort"
      @click="onClick"
      :class="{ 'hide-toggler': !activeGroupFields.length }"
    >
      <template v-for="slot in Object.keys(useSlots())" :key="slot">
        <slot :name="slot" />
      </template>
    </TreeTable>

    <pre v-if="debug">{{ nodes }}</pre>
  </div>
</template>

<style scoped>
:deep(.p-treetable tr[aria-expanded]) {
  cursor: pointer;
}

:deep(.p-treetable tr[aria-expanded]:hover) {
  background: var(--p-chip-background);
}

/*.hide-toggler :deep(.p-treetable-node-toggle-button) {
  display: none;
}*/
</style>
