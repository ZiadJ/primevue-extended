<script setup>
import { ref, useTemplateRef } from 'vue'
import PopupTooltip from '../PopupTooltip.vue'

const tooltipListenerRef = useTemplateRef('tooltipListenerRef')

const json = (text) => JSON.stringify(text)

const items = ref(
  [...Array(5)].map((_, i) => ({
    id: i + 1,
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.\n\n'
      .repeat(i + 1)
      .trim(),
    quantity: i,
    stockQty: i * 10,
  }))
)
</script>

<template>
  <Panel header="One-way binding">
    <PopupTooltip
      animateSize
      hideOnTargetLeave
      :travelDuration="200"
      resizeEasing="cubic-bezier(0.5, 0.01, 0, 1.2)"
    >
      <template #popup="{ target, context: ctx }">
        <pre>{{ ctx.description }}</pre>
      </template>

      <div class="flex gap-2">
        <!-- Use data-tooltip to create a tooltip -->
        <div
          v-for="item in items"
          :key="item.id"
          data-tooltip="{ delayOnRecentShow: 50 }"
          :data-tooltip-context="json(item)"
          class="flex-1 p-8 text-center border-[1px] dark:border-surface-600 rounded"
        >
          {{ item.id }}
        </div>
      </div>
    </PopupTooltip>
  </Panel>

  <!-- :rootSelector="tooltipListenerRef" -->
  <PopupTooltip
    rootSelector="#tooltipListener"
    @setData="
      (newState, oldState) => console.log('Set data:', newState, oldState)
    "
    autofocus
    trackTarget
    clickOnly
  >
    <template #popup="{ model, context: ctx }">
      <Slider
        v-if="ctx.type == 'slider'"
        v-model="model.data"
        :value="model.data"
        class="w-72"
        :max="ctx.max"
        :disabled="!ctx.max"
      />
      <Textarea v-else v-model="model.data" autoResize cols="50" />
    </template>
  </PopupTooltip>

  <Panel header="Two-way binding" class="mt-8">
    <div id="tooltipListener" ref="tooltipListenerRef">
      <DataTable :value="items">
        <Column field="id" header="Id" />
        <Column field="description" header="Description">
          <template #body="{ data: { description } }">
            <pre>{{ description }}</pre>
          </template>
        </Column>
        <Column field="quantity" header="Qty" sortable>
          <template #body="{ data }">
            <Button
              data-tooltip="{ position: 'top' }"
              :data-tooltip-context="
                json({ max: data.stockQty, type: 'slider' })
              "
            >
              {{ data.quantity }}
              <!-- 
               Use a hidden input as a direct child of the taget element for two-way binding. 
               Note that the popup will close when the key value changes, so as to preserve data integrity e.g when sorting.
              -->
              <input
                type="hidden"
                :data-key="data.id"
                v-model="data.quantity"
              />
            </Button>
          </template>
        </Column>
        <Column field="description" header="">
          <template #body="{ data }">
            <Button data-tooltip="{ position: 'left' }">
              <i class="pi pi-pencil py-1"></i>
              <input
                type="hidden"
                data-key="data.id"
                v-model="data.description"
              />
            </Button>
          </template>
        </Column>
      </DataTable>
    </div>
  </Panel>
</template>
