<script setup lang="ts">
import { ref, watch } from 'vue'

export interface MenuItem {
  key: string
  label: string
  items?: MenuItem[]
}

export interface TreePanelProps {
  items: MenuItem[]
  multiple?: boolean
  checkbox?: boolean
  badge?: boolean
}

const { items, multiple } = defineProps<TreePanelProps>()

const expandedKeys = defineModel<Record<string, boolean>>('expandedKeys', {
  default: {},
})

const selectedKeys = defineModel<Record<string, boolean | 'partial'>>({
  default: {},
})

watch(selectedKeys, initselectedKeys, { immediate: true })

function initselectedKeys() {
  for (const key in selectedKeys.value)
    if (selectedKeys.value[key] === true) setSelectedState(key, true)
}

// Set expansion state for parent and child nodes (toggle if undefined)
function setExpandedState(item: MenuItem, expanded?: boolean) {
  if (!item.items) return

  if (multiple) {
    expandedKeys.value = {
      ...expandedKeys.value,
      [item.key]: expanded ?? !expandedKeys.value[item.key],
    }
    return
  }

  if (expanded !== false) {
    // In single mode, create new expanded keys object
    const parents = findByKey(item.key, items)?.parents || []
    const isCurrentlyExpanded = expandedKeys.value[item.key]
    const newExpandedKeys: Record<string, boolean> = {}

    // Keep all parent nodes expanded
    for (const parent of parents) newExpandedKeys[parent.key] = true
    if (!isCurrentlyExpanded) newExpandedKeys[item.key] = true

    expandedKeys.value = newExpandedKeys
  }
}

// Set selected state for parent and child nodes (toggle if undefined)
function setSelectedState(itemOrKey: MenuItem | string, checked?: boolean) {
  const item =
    typeof itemOrKey === 'string'
      ? findByKey(itemOrKey, items)?.item
      : itemOrKey
  const key = typeof itemOrKey === 'string' ? itemOrKey : itemOrKey.key

  // Set children selection state
  if (item) setChildrenSelectedState(item, checked ?? !selectedKeys.value[key])

  // Set parents selection state
  setParentsSelectState(key)
}

function setChildrenSelectedState(item: MenuItem, checked: boolean) {
  if (checked) selectedKeys.value[item.key] = true
  else delete selectedKeys.value[item.key]

  if (item.items)
    for (const child of item.items) {
      setChildrenSelectedState(child, checked)
    }
}

function setParentsSelectState(itemKey: string) {
  const parents = findByKey(itemKey, items)?.parents
  if (parents)
    for (const parent of parents.reverse())
      if (
        parent.items?.every((child) => selectedKeys.value[child.key] === true)
      )
        selectedKeys.value[parent.key] = true
      else if (parent.items?.some((child) => selectedKeys.value[child.key]))
        selectedKeys.value[parent.key] = 'partial'
      else delete selectedKeys.value[parent.key]
}

function findByKey(
  targetKey: string,
  items: MenuItem[] | undefined,
  parents: MenuItem[] = []
): null | { item: MenuItem; parents: MenuItem[] } {
  if (items)
    for (const item of items) {
      if (item.key === targetKey) return { item: item, parents: parents }

      const found = findByKey(targetKey, item.items, [...parents, item])
      if (found) return found
    }
  return null
}

defineExpose({
  setExpandedState,
  setSelectedState,
  findByKey,
})
</script>

<template>
  <PanelMenu
    v-bind="$attrs"
    :model="items"
    v-model:expandedKeys="expandedKeys"
    pt:panel="border-none"
  >
    <template #item="{ item }">
      <div
        class="flex items-center cursor-pointer"
        :class="selectedKeys[item.key ?? ''] ? 'surface-150' : ''"
      >
        <div @click.stop="setExpandedState(item as MenuItem)">
          <!-- Tooggle button slot -->
          <slot
            name="checkbox"
            :item="item"
            :expanded="expandedKeys[item.key ?? '']"
          >
            <i
              class="pi"
              :class="{
                'px-5': !item.items,
                'px-3 pi-chevron-right':
                  item.items && !expandedKeys[item.key ?? ''],
                'px-3 pi-chevron-down':
                  item.items && expandedKeys[item.key ?? ''],
              }"
            ></i>
          </slot>
        </div>
        <a
          class="flex w-full items-center"
          @click.stop="
            item.items
              ? setExpandedState(item as MenuItem)
              : setSelectedState(item as MenuItem)
          "
        >
          <div v-if="checkbox" @click.stop="setSelectedState(item as MenuItem)">
            <!-- Checkbox slot -->
            <slot
              name=" checkbox"
              :item="item"
              :selected="selectedKeys[item.key ?? '']"
            >
              <i
                class="pi pi-circle flex items-center"
                :class="{
                  'pi-check-circle': selectedKeys[item.key ?? ''] === true,
                  'pi-minus-circle': selectedKeys[item.key ?? ''] === 'partial',
                }"
              />
            </slot>
          </div>

          <!-- Label slot -->
          <slot name="label" :item="item">
            <span class="p-3">{{ item.label }}</span>
          </slot>

          <!-- Badge slot -->
          <slot name="badge" :item="item">
            <Badge
              v-if="badge && item.items"
              class="ml-auto mr-2"
              :value="item.items.length"
            />
          </slot>
        </a>
      </div>
    </template>
  </PanelMenu>
</template>
