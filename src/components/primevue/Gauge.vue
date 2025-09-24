<template>
  <div style="position: relative; display: inline-block">
    <div class="center fulcrum"></div>
    <Knob
      v-model="model"
      v-bind="{ ...$props, ...$attrs }"
      :showValue="false"
    />
    <div
      class="center pointer"
      :style="{
        rotate: -150 + (150 * 2 * ((model || 0) - min)) / (max - min) + 'deg',
      }"
    ></div>
    <div v-if="showValue" class="center">
      <slot>
        {{ valueTemplate.replace(/{value}/g, (model || 0).toString()) }}
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const model = defineModel<number | undefined>()

export interface KnobProps {
  modelValue?: number | undefined
  size?: number | undefined
  fulcrumSize?: number | undefined
  pointerOffset?: number | undefined
  pointerWidth?: number | undefined
  pointerHeight?: number | undefined
  disabled?: boolean | undefined
  readonly?: boolean | undefined
  step?: number | undefined
  min?: number | undefined
  max?: number | undefined
  valueTemplate?: string | undefined
  showValue?: boolean | undefined
}

const {
  min = 0,
  max = 100,
  size = 100,
  fulcrumSize = 1,
  pointerOffset = 1,
  pointerWidth = 1,
  pointerHeight = 1,
  valueTemplate = '{value}',
  showValue = true,
} = defineProps<KnobProps>()
</script>

<style scoped>
.center {
  position: absolute;
  left: 50%;
  top: 50%;
  translate: -50% -50%;
  pointer-events: none;
}

.fulcrum {
  background: var(--p-knob-range-background);
  border-radius: 50%;
  padding: v-bind((size * fulcrumSize * 0.1) + 'px');
}

.pointer {
  border-top: v-bind(size * pointerHeight * 0.5 + 'px')
    var(--p-knob-range-background) solid;
  padding: v-bind(size * pointerWidth * 0.02 + 'px');
  translate: -50% v-bind(-50 - pointerOffset * 20 + '%');
  transform-origin: 50% v-bind(50 + pointerOffset * 20 + '%');
  border-radius: 50%;
  transition: 250ms;
}
</style>
