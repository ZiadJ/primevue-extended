<script setup>
import { ref, computed, useTemplateRef } from 'vue'
import Popup from '../Popup.vue'
import { useToast } from 'primevue/usetoast'
const toast = useToast()

const position = ref()
const horizontalAlignment = ref()
const verticalAlignment = ref()

const menu = useTemplateRef('menu')
const popup = useTemplateRef('popup')

const items = ref([{ name: 'Item1' }, { name: 'Item2' }, { name: 'Item3' }])
const itemData = ref()

const alignment = computed(() =>
  position.value == 'top' || position.value == 'bottom'
    ? horizontalAlignment.value
    : verticalAlignment.value
)

const menuItems = computed(() => [
  {
    label: 'Details',
    icon: 'pi pi-info',
    command: () =>
      toast.add({
        summary: 'Details',
        detail: itemData.value.name,
        life: 5000,
      }),
  },
  {
    label: 'Delete ' + itemData.value?.name,
    icon: 'pi pi-trash',
    command: () => deleteEntry(itemData.value),
  },
])

function deleteEntry(data) {
  items.value = items.value.filter((entry) => entry.name !== data.name)
}

function show(e) {
  popup.value?.show(e, e.target.closest('.popup'))
}
</script>

<template>
  <DataTable :value="items">
    <Column field="name" header="Name" />
    <Column field="name" header="Menu (click)">
      <template #body="{ data }">
        <Button
          @click="
            (event) => {
              itemData = data
              menu.toggle(event)
            }
          "
          icon="pi pi-ellipsis-v"
        />
      </template>
    </Column>
    <Column field="name" header="Popup (click)">
      <template #body="{ data }">
        <Button @click="popup.toggle($event, data)" icon="pi pi-ellipsis-v" />
      </template>
    </Column>
    <Column field="name" header="Popup (hover/click)">
      <template #body="{ data }">
        <Button
          @click="popup.toggle($event, data)"
          @mouseenter="popup.hover($event, data)"
          icon="pi pi-ellipsis-v"
        />
      </template>
    </Column>
  </DataTable>

  <div class="m-16 text-center mb-[500px]">
    <Panel
      class="popup inline-block w-fit m-auto !pt-6"
      pt:header="!hidden"
      @click="popup.show($event, null, '.popup')"
    >
      <SelectButton
        v-model="position"
        :options="['top', 'bottom', 'left', 'right']"
        :allowEmpty="false"
      />
      <br />
      <br />
      <SelectButton
        v-if="position == 'top' || position == 'bottom'"
        v-model="horizontalAlignment"
        :options="['left', 'center', 'right']"
      />
      <SelectButton
        v-else
        v-model="verticalAlignment"
        :options="['top', 'center', 'bottom']"
      />
      <!-- {{ popup?.isOpen }} -->
    </Panel>
  </div>

  <Menu id="menu" ref="menu" popup :model="menuItems">
    <template #start>
      <InputText v-model="itemData.name" size="small" class="m-2" />
    </template>
  </Menu>

  <Popup
    ref="popup"
    v-model="itemData"
    :showDelay="200"
    :hideDelay="200"
    :showDelayOnReshow="100"
    :position="position"
    :alignment="alignment"
    :arrowOffset="8"
    hideOnPopupClick
    @keyup.enter="popup.hide()"
    autofocus
    trackTarget
    trackScroll
    pt:content:style="padding: 0"
  >
    <div v-if="itemData">
      <InputText
        v-model="itemData.name"
        class="nofocus"
        size="small"
        pt:root="m-2"
      />
      <Menu :model="menuItems" pt:root:style="border: 0" />
    </div>
    <div v-else class="py-24 px-16 text-center">
      {{ position || 'unset' }} {{ alignment || 'unset' }}
      <br />
      {{ !popup.flipCount ? '' : 'reoriented to ' + popup.currentPosition + ' to fit in' }}
    </div>
  </Popup>
</template>

