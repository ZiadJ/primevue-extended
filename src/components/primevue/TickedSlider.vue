<script setup lang="ts">
import { useTemplateRef, ref, computed, onMounted, watch, nextTick } from 'vue'
import type { SliderProps } from 'primevue/slider'

export interface TickSliderProps extends /* @vue-ignore */ SliderProps {
  min?: number
  max?: number
  step?: number
  tickDecimals?: number
  tickCount?: number
  tickStep?: number
  hideInput?: boolean
  stickyInput?: boolean
  inputOpacity?: number
  inputSize?: 'small' | 'large'
}

const {
  min = 0,
  max = 0,
  step = 1,
  tickDecimals = 0,
  tickCount = 0,
  tickStep,
  hideInput,
  stickyInput,
  inputSize,
  inputOpacity = 100,
} = defineProps<TickSliderProps>()

const labelRefs = useTemplateRef<HTMLElement[]>('labelRefs')
const centeredContainer = useTemplateRef<HTMLElement>('centeredContainer')

const model = defineModel<number | number[]>()

const isRange = computed(() => typeof model.value !== 'number')
// Convert model to a range array if it isn't already, for consistency
const range = computed(() => {
  return typeof model.value === 'number'
    ? [model.value]
    : (model.value as [number, number])
})

const isOverlap = ref(false)

const tickValues = computed(() => {
  const stepSize = tickStep ?? (max - min) / (tickCount + 1)
  return Array.from(
    { length: (max - min) / stepSize + 1 },
    (_, i) => min + stepSize * i
  )
})

const isTickInRange = (tickValue: number) =>
  isRange.value
    ? tickValue >= min && tickValue <= max // range.value[0] && tickValue <= range.value[1]
    : tickValue <= (model.value as number)

const clampValue = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value))

const getPercentage = (value: number) =>
  clampValue(((value - min) / (max - min)) * 100, 0, 100)

const getSteppedValue = (value: number) =>
  Math.round((value - min) / step) * step + min

const updateModelValue = (value: number, index: number) => {
  if (isRange.value && Array.isArray(model.value)) {
    model.value[index] = clampValue(value, min, max)
  } else {
    model.value = clampValue(value, min, max)
  }
}

const getSize = (text: string | undefined, index: number) => {
  const size =
    (
      text ??
      Intl.NumberFormat(navigator.language, {
        minimumFractionDigits: tickDecimals,
      }).format(Number.parseFloat(range.value[index].toFixed(tickDecimals)))
    ).length - 1

  return clampValue(size, 1, 20)
}

const tickClick = (e: MouseEvent) => {
  const el = (e.target as HTMLElement).closest('[data-tick-value]')
  if (el) {
    const value = Number((el as HTMLElement).dataset.tickValue)
    const index = isRange.value
      ? +(Math.abs(range.value[0] - value) > Math.abs(range.value[1] - value))
      : 0

    updateModelValue(value, index)
  }
}

const checkLabelOverlap = async () => {
  if (isRange.value && labelRefs.value) {
    isOverlap.value = false

    await nextTick()

    const rects = labelRefs.value.map((label) => label.getBoundingClientRect())
    if (rects.length >= 2) {
      const [r1, r2] = rects
      isOverlap.value =
        (r1.right > r2.left && r1.right < r2.right) ||
        (r1.left > r2.left && r1.left < r2.right)
    }
  }
}

const handleEscape = (e: Event, value: number | number[]) => {
  const target = e.target as HTMLInputElement
  target.value = value.toString()
  target.blur()
}

const handleSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  target.select()
}

const handleInputSize = (e: Event, index: number) => {
  const target = e.target as HTMLInputElement
  if (target) {
    target.size = getSize(target.value, index)
  }
}

onMounted(checkLabelOverlap)
watch(range, checkLabelOverlap)
</script>

<template>
  <div
    class="tick-slider"
    :class="{ 'sticky-input': stickyInput }"
    style="position: relative"
  >
    <div class="tick-track" @click="tickClick">
      <div
        v-for="(value, index) in tickValues"
        :key="index"
        :data-tick-value="value"
        class="tick"
        :class="{ 'in-range': isTickInRange(value) }"
        :style="{ left: getPercentage(value) + '%' }"
      >
        <slot name="tick" v-bind="{ value, model, tickValues, tickDecimals }">
          <div class="tick-content">
            {{ value.toFixed(tickDecimals) }}
          </div>
        </slot>
      </div>
    </div>

    <div
      ref="centeredContainer"
      class="centered-container"
      v-if="isRange"
      :class="{ 'reverse-range': range && range[0] > range[1] }"
      :style="{
        left: getPercentage((range[0] + range[1]) / 2) + '%',
      }"
    ></div>
    <div>
      <Teleport :to="centeredContainer" :disabled="!isOverlap">
        <label
          v-if="!hideInput"
          v-for="(value, index) in range"
          :key="index"
          ref="labelRefs"
          class="value-label p-component"
          @keyup.escape="handleEscape($event, value)"
          @click="handleSelect"
          :style="{
            position: 'absolute',
            left: getPercentage(value) + '%',
          }"
        >
          <slot
            name="input"
            v-bind="{
              value,
              index,
              updateModelValue,
              getSize,
              inputOpacity,
              inputSize,
            }"
          >
            <InputNumber
              :modelValue="parseFloat(value.toFixed(tickDecimals))"
              @update:modelValue="(val) => updateModelValue(val, index)"
              variant="filled"
              :min="min"
              :max="max"
              :size="inputSize"
              :minFractionDigits="tickDecimals"
              :pt:pcInputText:root:style="{
                textAlign: 'center',
                background: `color-mix(in srgb, var(--p-inputtext-filled-background) ${inputOpacity}%, transparent)`,
              }"
              :pt:pcInputText:root:size="getSize(undefined, index)"
              @input="(e) => handleInputSize(e.originalEvent, index)"
            />
          </slot>
        </label>
      </Teleport>
    </div>
    <Slider
      v-model="model"
      :range="isRange"
      v-bind="{ ...$props, ...$attrs }"
      :min="min"
      :max="max"
      :step="step"
      @valueChange="(val: number | number[]) =>
      (model = Array.isArray(val)
        ? val.map(getSteppedValue)
        : getSteppedValue(val))
      "
    />
  </div>
</template>

<style scoped>
@keyframes fadeOut {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

.tick-slider {
  padding: 2rem 0;
}

.value-label {
  translate: -50% -50%;
  transform-origin: 50% 50%;
  opacity: 0%;
  scale: 0%;
  visibility: hidden;
  transition: scale 0.12s ease, opacity 0.12s ease, visibility 0s linear;
}

.tick-slider:is(:hover, :focus-within, .sticky-input) .value-label {
  translate: -50% calc(var(--p-slider-handle-height) * -0.5 - 100%);
  opacity: 100%;
  scale: 100%;
  visibility: visible;
  transition: scale 0.12s ease, opacity 0.12s ease,
    visibility 0.12s linear 0.12s;
}

.value-label :deep(input) {
  border-color: var(--p-slider-handle-background);
  border-radius: 99px;
}

.centered-container {
  position: absolute;
  display: flex;
  translate: -50%;
}

.centered-container.reverse-range {
  flex-flow: row-reverse;
}

.centered-container .value-label {
  translate: 0% calc(var(--p-slider-handle-height) * -0.5 - 100%) !important;
  position: relative !important;
  left: unset !important;
}

.centered-container .value-label:first-child :deep(input),
.centered-container.reverse-range .value-label:last-child :deep(input) {
  border-radius: 99px 0 0 99px;
  border-right: none;
}

.centered-container .value-label:last-child :deep(input),
.centered-container.reverse-range .value-label:first-child :deep(input) {
  border-radius: 0 99px 99px 0;
  border-left: none;
}

.tick {
  position: absolute;
  top: 50%;
  translate: -50%;
  cursor: pointer;
}

.tick-content {
  margin-top: calc(var(--p-slider-handle-height) * 0.25);
}
</style>
