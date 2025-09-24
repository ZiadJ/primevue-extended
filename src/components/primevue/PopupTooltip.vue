<template>
  <div ref="contentWrapper">
    <slot />
  </div>
  <Popup
    ref="popup"
    v-bind="{ ...$attrs, ...props, ...popupProps }"
    @beforeShow="beforeShow"
  >
    <slot name="popup" v-bind="state" />
  </Popup>
</template>

<script setup lang="ts">
import {
  ref,
  type Ref,
  reactive,
  onMounted,
  onUnmounted,
  watch,
  useTemplateRef,
  nextTick,
} from 'vue'
// import type { PopoverProps, PopoverSlots } from "primevue/popover"
import Popup from './Popup.vue'
import type { Position, Alignment } from './Popup.vue'
import type { PopupProps } from './Popup.vue'
import type { Rect } from '@floating-ui/vue'

interface PopupTooltipProps extends /* @vue-ignore */ PopupProps {
  position?: Position
  alignment?: Alignment
  dismissable?: boolean
  rootSelector?: string | Ref // The selector or referenced element used to catch tooltip events
  prematchSelector?: string // The selector used to identify a tooltip element
  matchSelector?: string // The selector used to target more specific tooltip elements
  modelSelector?: string // The selector used to identify the element containing the model
  ignoreNestedTooltips?: boolean // Ignore tooltips that already have a parent listener
  clickOnly?: boolean // Click to open
  animateSize?: boolean // Animate the popup size then changing targets
  resizeDuration?: number // Resize animation duration whem changing target
  resizeEasing?: string // Resize animation easing whem changing target
}

type StateType = {
  target: HTMLElement | null
  context?: object
  model: {
    data: string | number | object | boolean | null
  }
}

const popup = useTemplateRef('popup')
const contentWrapper = useTemplateRef<HTMLElement>('contentWrapper')

let listener: HTMLElement | null = null

const props = withDefaults(defineProps<PopupTooltipProps>(), {
  dismissable: true,
  position: 'top',
  alignment: 'center',
  prematchSelector:
    '[data-tooltip], [data-tooltip-model], [data-tooltip-context]',
  modelSelector: ':scope > input[type="hidden"]',
  resizeDuration: 180,
  resizeEasing: 'ease',
})

const state = reactive<StateType>({
  target: null,
  context: {},
  model: {
    data: '',
  },
})

const emit = defineEmits<{
  (e: 'before-show', target: HTMLElement): HTMLElement | boolean | undefined
  (e: 'get-data', state: StateType): StateType | undefined
  (e: 'set-data', newState: StateType, oldState: StateType):
    | StateType
    | undefined
}>()

const regexJSON = /^\s*(\{[\s\S]*\}|\[[\s\S]*\])\s*$/
const isLoading = ref(false)
let unwatch: (() => void) | null = null

const popupProps = ref<PopupProps>({})
const target = ref<HTMLElement | null>(null)

let dataKey = ''

const debounceIds: Record<string, number> = {}

function debounce(callback?: () => void, delay = 0, id = 'default') {
  clearTimeout(debounceIds[id])
  if (callback) debounceIds[id] = window.setTimeout(() => callback(), delay)
}

function parseJson<T = unknown>(text: string | null | undefined): T | null {
  if (text == null) return null // NB: '== null' also checks for undefined

  try {
    return JSON.parse(
      text
        .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')
        .replace(/'([^']*?)'/g, '"$1"')
    ) as T
  } catch (error) {
    console.error('Error parsing JSON:', error)
    return null
  }
}

function smoothResize(
  element: HTMLElement,
  oldRect: Rect,
  newRect: Rect,
  onComplete?: () => void
) {
  if (!element || !oldRect || !newRect) return

  // set anim based on duration and ease specified in the props
  const ease = `${props.resizeDuration}ms ${props.resizeEasing}`
  element.style.transition = `width ${ease}, height ${ease}`

  element.style.width = `${oldRect.width}px`
  element.style.height = `${oldRect.height}px`

  // Force reflow
  void element.offsetWidth
  void element.offsetHeight

  element.style.overflow = 'hidden'

  element.style.width = `${newRect.width}px`
  element.style.height = `${newRect.height}px`

  element.addEventListener(
    'transitionend',
    (e) => {
      // console.log(element)
      element.style.width = 'auto'
      element.style.height = 'auto'
      element.style.overflow = 'auto'
      onComplete?.()
    },
    { once: true }
  )
}

const beforeShow = async () => {
  if (!target.value) return

  const newState = getTargetData(target.value, props.modelSelector)
  if (!newState) return

  if (unwatch) unwatch()

  state.context = newState.context
  state.model.data = newState.model.data

  unwatch = watch(
    state.model,
    (newModel, oldModel) => {
      setTargetData(newModel.data, oldModel.data)
    },
    { deep: true }
  )

  if (props.animateSize) {
    const container = popup.value?.popover?.container?.querySelector(
      ':scope > .p-popover-content'
    ) as HTMLElement

    // Expand animation
    if (container) {
      container.style.height = 'auto'
      const oldRect = container.getBoundingClientRect()

      await nextTick()

      container.style.height = 'auto'
      const newRect = container.getBoundingClientRect()

      smoothResize(container, oldRect, newRect, () => {
        popup.value?.realign()
      })
    }
  }
}

// Handle tooltip display and data syncing
const showTooltip = (event: MouseEvent | TouchEvent) => {
  let targetEl = (event.target as HTMLElement).closest(
    props.prematchSelector
  ) as HTMLElement

  if (!targetEl) return

  event.preventDefault()

  if (props.matchSelector && !targetEl.matches(props.matchSelector)) return

  // Ignore event if there's a closer matching listener
  if (
    props.ignoreNestedTooltips &&
    listener !==
      targetEl.closest(
        props.clickOnly ? '.tooltip-click-listener' : '.tooltip-hover-listener'
      )
  )
    return

  const show = emit('before-show', targetEl)
  if (show !== undefined) {
    if (typeof show === 'boolean') {
      if (!show) return
    } else {
      targetEl = show
    }
  }

  target.value = targetEl

  popupProps.value = parseJson<PopupProps>(targetEl.dataset.tooltip) ?? {}

  if (props.clickOnly) {
    popup.value?.toggle(targetEl, state)
  } else {
    popup.value?.hover(targetEl, state)
  }
}

// Get data from target element (input value or dataset), triggered by the model watcher
const getTargetData = (
  element: HTMLElement,
  modelSelector: string
): StateType | undefined => {
  if (!element) return

  const dataEl = getTarget(element, modelSelector) as HTMLElement
  dataKey = dataEl.dataset.key

  let data = dataEl.dataset.tooltipModel ?? (dataEl as HTMLInputElement).value

  // Parse data if it is in JSON format
  if (regexJSON.test(data)) {
    try {
      data = JSON.parse(data)
    } catch {
      return
    }
  }

  const context = element.dataset.tooltipContext

  const result = {
    target: element,
    model: { data: data },
    context: (typeof context === 'object' ? context : parseJson(context)) ?? {},
  }

  return emit('get-data', result) ?? result
}

// Saves changes to either the value or dataset attributes
const setTargetData = async (
  newModel: string | number | object | boolean | null,
  oldModel?: string | number | object | boolean | null
) => {
  if (!target.value) return

  //console.log(modelData)

  const targetEl = getTarget(
    target.value,
    props.modelSelector
  ) as HTMLInputElement

  // Hide if the target element state is stale
  if (targetEl.dataset.key !== dataKey) {
    popup.value?.hide()
    return
  }

  // Retrieve new state value based on old and new model values
  const newState = emit(
    'set-data',
    { ...state, model: { data: newModel } },
    { ...state, model: { data: oldModel ?? null } }
  )

  // Apply any state transformations from emit
  if (newState) {
    // state.target = newState.target
    state.context = newState.context
    state.model = newState.model
  }

  const value = newState?.model.data ?? newModel ?? null

  if (targetEl.matches('input, textarea, select, option')) {
    targetEl.value = (value ?? '').toString()
    // targetEl.dispatchEvent(new Event('input'))

    setTimeout(() => {
      targetEl.dispatchEvent(new Event('input'))
    })
  } else {
    targetEl.dataset.tooltipModel =
      typeof value === 'object' ? JSON.stringify(value) : value.toString()
  }
}

const getTarget = (
  element: HTMLElement,
  inputSelector: string
): HTMLElement => {
  if (!inputSelector || element.matches('input')) return element

  return element.querySelector(inputSelector) ?? element
}

onMounted(async () => {
  await nextTick()

  listener = props.rootSelector
    ? typeof props.rootSelector === 'string'
      ? (document.querySelector(props.rootSelector) as HTMLElement)
      : props.rootSelector
    : contentWrapper.value

  listener?.classList.add('tooltip-click-listener')

  if ('ontouchstart' in window) {
    listener?.addEventListener('touchstart', showTooltip, true)
  } else {
    listener?.addEventListener('click', showTooltip, true)
  }

  if (!props.clickOnly) {
    listener?.classList.add('tooltip-hover-listener')
    listener?.addEventListener('mouseenter', showTooltip, true)
  }
})

onUnmounted(() => {
  listener?.classList.remove('tooltip-click-listener')
  listener?.classList.remove('tooltip-hover-listener')

  listener?.removeEventListener('click', showTooltip, true)
  listener?.removeEventListener('touchstart', showTooltip, true)
  listener?.removeEventListener('mouseenter', showTooltip, true)
})

defineExpose({
  popup,
  show: (eventOrTarget: HTMLElement | MouseEvent) =>
    popup.value?.show(eventOrTarget),
  hide: () => popup.value?.hide(),
  setTargetData,
  getTargetData,
  target,
  state,
})
</script>

<style>
.p-popup.p-popover > .p-popover-content {
  /* easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' */
}
</style>
