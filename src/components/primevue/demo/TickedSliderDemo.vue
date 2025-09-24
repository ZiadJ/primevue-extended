<script setup>
import { ref } from 'vue'
import TickedSlider from '../TickedSlider.vue'

const value = ref(20)
const values = ref([-200, 200])
const tickCount = ref(3)
</script>

<template>
  <TickedSlider
    v-model="tickCount"
    :min="1"
    :max="13"
    :step="2"
    :tickStep="2"
    hideInput
  >
    <template #tick="{ value, model }">
      <div class="tick-dot"></div>
    </template>
  </TickedSlider>
  <TickedSlider
    v-model="value"
    :min="-1000"
    :max="1000"
    :step="50"
    :tickCount="tickCount"
    :showLabel="true"
  />
  <TickedSlider
    v-model="value"
    :min="-500"
    :max="1500"
    :tickCount="tickCount"
    :showLabel="true"
    stickyInput
    :inputOpacity="80"
    :tickDecimals="1"
    inputSize="small"
  />
  <TickedSlider
    v-model="values"
    :min="-1000"
    :max="1000"
    :step="10"
    :tickCount="tickCount"
    :showLabel="true"
    :tickDecimals="0"
  />
  <br />
  <div class="text-center">
    {{ values }}
  </div>
</template>

<style>
.tick-dot {
  position: absolute;
  translate: -50% -50%;
  border-radius: 50%;
  width: calc(var(--p-slider-handle-height) * 0.75);
  height: calc(var(--p-slider-handle-height) * 0.75);
  background-color: var(--p-slider-track-background);
}

.in-range > .tick-dot {
  background-color: var(--p-slider-range-background);
}
</style>
