<script setup lang="ts" generic="T">
import { ref, reactive, useTemplateRef, watch } from 'vue'
import type { Alignment, Position, PopupProps } from './Popup.vue'
import Popup from './Popup.vue'

export interface TourStep<T> {
  selector: string
  content: string
  data: T
  position?: Position
  alignment?: Alignment
}

export interface TourProps<T> extends /* @vue-ignore */ PopupProps {
  steps: TourStep<T>[]
  highlightClass?: string
  dismissable?: boolean
}

const {
  steps = [],
  highlightClass,
  dismissable = true,
} = defineProps<TourProps<T>>()

const emit = defineEmits<{
  (event: 'target-not-found', selector: string): void
  (event: 'on-previous', index: number): void
  (event: 'on-next', index: number): void
  (event: 'on-hide', index: number): void
}>()

const popup = useTemplateRef('popup')

const target = ref<HTMLElement>()

const index = defineModel<number>({ default: 0 })

let step = reactive<TourStep<T>>({
  selector: '',
  content: '',
  data: {} as T,
})

function show(stepIndex = 0) {
  index.value = stepIndex

  step = reactive<TourStep<T>>(steps[stepIndex])

  target.value?.classList.remove(highlightClass || '')
  target.value = document.querySelector(step.selector) as HTMLElement

  if (!target.value) {
    emit('target-not-found', step.selector)
    return
  }

  popup.value?.hide()

  if (highlightClass) target.value.classList.add(highlightClass)

  target.value.scrollIntoView({
    block: 'nearest',
    inline: 'nearest',
    behavior: 'smooth',
  })

  if (target.value.dataset.tour) {
    try {
      const tourData = JSON.parse(
        target.value.dataset.tour
          .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')
          .replace(/'([^']*?)'/g, '"$1"')
      )

      step = reactive<TourStep<T>>({ ...step, ...tourData })
    } catch (error) {
      console.error(
        `Error parsing data-tour attribute for ${step.selector}`,
        error
      )
    }
  }

  onScrollCompletion(() => {
    if (target.value) popup.value?.show(target.value)
  })
}

function previous() {
  index.value = index.value <= 0 ? steps.length - 1 : --index.value
  emit('on-previous', index.value)
}

function next() {
  index.value = index.value >= steps.length - 1 ? 0 : ++index.value
  emit('on-next', index.value)
}

function hide() {
  popup.value?.hide()
  popup.value?.hide()
  emit('on-hide', index.value)
}

function onScrollCompletion(callback: () => void) {
  let lastX = -1
  let lastY = -1

  const checkScrollPosition = () => {
    if (window.scrollX === lastX && window.scrollY === lastY) return callback()

    lastX = window.scrollX
    lastY = window.scrollY

    setTimeout(checkScrollPosition, 25)
  }

  setTimeout(checkScrollPosition, 50) // minimum delay when no scroll is needed
}

watch(index, () => show(index.value))

defineExpose({
  popup,
  target,
  index,
  show,
  previous,
  next,
})
</script>

<template>
  <Popup
    ref="popup"
    v-bind="{ ...$props, ...$attrs }"
    :hideDelay="200"
    :showDelay="200"
    :arrowOffset="8"
    :position="step.position ?? 'top'"
    :alignment="step.alignment ?? 'center'"
    @hide="target?.classList.remove(highlightClass || '')"
  >
    <slot name="header" v-bind="{ target, steps, index, hide }">
      <p class="px-6 pt-3">{{ index + 1 }} / {{ steps.length }}</p>
    </slot>

    <slot v-bind="{ target, steps, index, hide }">
      <p class="px-6 py-3">
        {{ step.content }}
      </p>
    </slot>

    <slot name="footer" v-bind="{ target, steps, index, hide, previous, next }">
      <div class="flex gap-4 mt-3">
        <Button label="Previous" @click="previous" class="w-full" />
        <Button label="Next" @click="next" class="w-full" />
      </div>
    </slot>
  </Popup>
</template>
