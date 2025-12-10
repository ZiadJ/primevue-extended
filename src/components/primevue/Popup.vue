<template>
  <Popover
    ref="popover"
    v-bind="{ ...$props, ...$attrs }"
    class="p-popup"
    @hide="hide"
    :dismissable
    @click="click"
    @mouseenter="popupEnter"
    @mouseleave="popupLeave"
  >
    <slot :model="model" />
  </Popover>
</template>

<script setup lang="ts" generic="T">
import type Popover from 'primevue/popover'
import { ref, useTemplateRef, onMounted, onUnmounted, nextTick } from 'vue'
import type { PopoverProps } from 'primevue/popover'

export type Position = 'top' | 'bottom' | 'left' | 'right'
export type Alignment = Position | 'center'

export interface PopupProps extends /* @vue-ignore */ PopoverProps {
  position?: Position
  alignment?: Alignment
  hideDelay?: number
  showDelay?: number
  hideArrow?: boolean // never show the popup arrow
  centerArrow?: boolean // keep the arrow centered regardless of alignment
  delayOnRecentShow?: number // the show delay if the popup was recently open
  margin?: number // gap in pixels between popup and target element
  transform?: string // the css transform for the popup
  parentSelector?: string // the parent achorage selector for the target element (default is 'a, button')
  autofocus?: boolean // focuses on the first form element inside that doesn't have class 'nofocus'
  travelDuration?: number // the popup travel time when switching targets
  travelEasing?: string // the popup travel easing type
  hideOnTargetLeave?: boolean // hide when mouse leaves the target
  hideOnOffscreen?: boolean // hide when the target goes offscreen during scrolling (requires trackScroll)
  hideOnPopupClick?: boolean // hide when a buttton or anchor within is clicked
  dismissable?: boolean // hides when clicking outside (default is true)
  trackTarget?: boolean // follow the target when parent elements are resized
  trackScroll?: boolean // follow the target when scrolling
}

export type PopoverType = InstanceType<typeof Popover> & {
  container: HTMLElement
}

const props = withDefaults(defineProps<PopupProps>(), {
  dismissable: true,
  position: 'bottom',
  alignment: 'left',
  hideDelay: 150,
  showDelay: 200,
  margin: 8,
  travelDuration: 0,
  travelEasing: 'ease',
  delayOnRecentShow: 150,
  parentSelector: 'a, button',
})

const emit = defineEmits<{
  (event: 'before-show', target: HTMLElement | undefined): void
  (event: 'show', target: HTMLElement | undefined): void
  (event: 'hide', target: HTMLElement | undefined): void
}>()

const popover = useTemplateRef<PopoverType>('popover')

const model = defineModel<T>()

let target: HTMLElement | undefined = undefined
let previousTarget: HTMLElement | undefined = undefined
let lastActiveElement: HTMLElement | null = null

const isOpen = ref(false)
const flipCount = ref(0)
const isClicked = ref(false) // popup was open by clicking
const isSticky = ref(false) // ignores mouse leave
const currentPosition = ref(props.position)

const parentSizeWatcher = watchParentSize(50, true)

const debounceIds: Record<string, number> = {}

function debounce(callback?: () => void, delay = 0, id = 'default') {
  clearTimeout(debounceIds[id])
  if (callback) debounceIds[id] = window.setTimeout(() => callback(), delay)
}

onMounted(() => {
  if (props.trackScroll)
    window.addEventListener('scroll', scroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', scroll)
})

function scroll() {
  realign(5, true, props.hideOnOffscreen)
}

function click(event: MouseEvent) {
  isClicked.value = true
  if (props.hideOnPopupClick) {
    if ((event.target as HTMLElement).closest(props.parentSelector)) hide(true)
  }
}

function targetLeave() {
  debounce(() => {
    if (!isSticky.value) hide(true)
  }, props.hideDelay)
}

function popupEnter() {
  debounce(() => {
    if (props.hideOnTargetLeave) hide()
  }, 100)
}

function popupLeave() {
  debounce(() => {
    if (!isSticky.value || (props.hideOnPopupClick && isClicked.value)) hide()
  }, props.hideDelay)
}

function toggle(eventOrTarget: MouseEvent | HTMLElement, data: T) {
  show(eventOrTarget, data, '', props.hideOnTargetLeave, true)
}

function hover(eventOrTarget: MouseEvent | HTMLElement, data: T) {
  show(eventOrTarget, data, '', true)
}

function show(
  eventOrTarget: MouseEvent | HTMLElement,
  data?: T,
  parentSelector = '',
  hideOnPopupLeave = false,
  toggle = false
) {
  isSticky.value = !hideOnPopupLeave
  isClicked.value = false

  let event: MouseEvent | { currentTarget: HTMLElement }

  previousTarget = target

  if (eventOrTarget instanceof HTMLElement) {
    event = { currentTarget: eventOrTarget }
    target = eventOrTarget
  } else {
    event = eventOrTarget
    target = ((event.target as HTMLElement).closest(
      parentSelector || props.parentSelector
    ) || target) as HTMLElement | undefined

    if (!target) return
  }

  const isSameTarget = target === previousTarget
  const delay = isSticky.value
    ? 0
    : isOpen.value
    ? props.delayOnRecentShow
    : props.showDelay

  if (isOpen.value) {
    if (isSameTarget && toggle && isSticky.value) {
      hide()
      return
    }
    if (!isSameTarget && !props.travelDuration) {
      hide()
    }
  }

  debounce(async () => {
    model.value = data

    const travelDuration = isOpen.value ? props.travelDuration : 0
    showPopover(
      popover.value,
      event as MouseEvent,
      target,
      props.autofocus,
      travelDuration
    )

    isOpen.value = true

    if (props.trackTarget && target)
      parentSizeWatcher.setTarget(target, (entries) => realign(10))
  }, delay)

  target.addEventListener('mouseleave', targetLeave, { once: true })
}

async function showPopover(
  popover: PopoverType | null,
  event: MouseEvent,
  target?: HTMLElement,
  autofocus = false,
  travelDuration = 0
) {
  emit('before-show', target)

  const isOpen = popover?.container != null

  if (!isOpen || travelDuration) {
    if (!isOpen) {
      lastActiveElement = document.activeElement as HTMLElement
      popover?.show(event, target)
      await nextTick()
    }

    alignPopup(target, popover?.container, travelDuration)

    if (autofocus) {
      // Select first focusable item in the popup that doesn't have .nofocus
      const focusElement = popover?.container.querySelector(
        '.autofocus,[autofocus],:is(a, input, button, select, textarea):not(.nofocus)'
      ) as HTMLElement
      focusElement?.focus()
    }
  }

  emit('show', target)
}

function hide(force?: boolean) {
  if (props.dismissable || force) {
    parentSizeWatcher.cleanup()

    // restore previous focus if the popup currently has focus
    if (popover.value?.container?.contains(document.activeElement)) {
      lastActiveElement?.focus({ preventScroll: true })
      lastActiveElement = null
    }

    popover.value?.hide()
    emit('hide', target)
    setTimeout(() => {
      isOpen.value = false
    })
  }
}

function alignPopup(
  target?: HTMLElement,
  popup?: HTMLElement,
  travelDuration = 0,
  position = props.position,
  alignment = props.alignment,
  forceAlign = false,
  failedAttempts = 0
) {
  if (!target || !popup) return

  const isTopOrBottom = position === 'top' || position === 'bottom'
  const { left, top, bottom, right } = target.getBoundingClientRect()
  const popHeight = popup.scrollHeight
  const popWidth = popup.offsetWidth
  const margin = props.margin

  currentPosition.value = position

  let newAlignment: Alignment | null = null
  // Default to center alignment if current alignment doesn't match position
  if (
    isTopOrBottom
      ? !['left', 'right', 'center'].includes(alignment)
      : !['top', 'bottom', 'center'].includes(alignment)
  )
    newAlignment = 'center'

  /*
  // Default to center alignment if the target and centered arrow are not in contact
  if (!isTopOrBottom) {
    if (bottom - top > popHeight * 2 - margin) newAlignment = 'center'
  } else {
    if (right - left > popWidth * 2 - margin) newAlignment = 'center'
  }
  */

  popup.style.inset = 'unset'
  popup.style.translate = '0'
  popup.style.margin = '0'

  flipCount.value = failedAttempts

  let flipPos: Position | undefined = undefined // the flipped position if current one doesn't fit on screen
  let transformOrigin = ''

  // Set position

  switch (position) {
    case 'top':
      flipPos = setAnchor(popup, 'bottom', top - margin, popHeight, forceAlign)
      transformOrigin = 'center bottom'
      break
    case 'bottom':
      flipPos = setAnchor(popup, 'top', bottom + margin, popHeight, forceAlign)
      transformOrigin = 'center top'
      break
    case 'left':
      flipPos = setAnchor(popup, 'right', left - margin, popWidth, forceAlign)
      transformOrigin = 'right center'
      break
    case 'right':
      flipPos = setAnchor(popup, 'left', right + margin, popWidth, forceAlign)
      transformOrigin = 'left center'
      break
  }

  if (flipPos && !forceAlign) {
    // Rotate 90deg if first flip failed
    if (failedAttempts === 1) flipPos = isTopOrBottom ? 'right' : 'top'

    return alignPopup(
      target,
      popup,
      travelDuration,
      failedAttempts >= 3 ? props.position : flipPos,
      newAlignment ?? alignment,
      failedAttempts >= 3,
      failedAttempts + 1
    )
  }

  popup.style.transformOrigin = transformOrigin

  // Set alignment

  if (isTopOrBottom) {
    switch (alignment) {
      case 'right':
        setAnchor(popup, 'right', right, popWidth, true)
        break
      case 'left':
        setAnchor(popup, 'left', left, popWidth, true)
        break
      default: {
        const midTarget = (left + right) / 2
        setAnchor(popup, 'left', midTarget, popWidth, true, -popWidth / 2)
        popup.style.translate = '-50% 0%'
        break
      }
    }
  } else {
    switch (alignment) {
      case 'bottom':
        setAnchor(popup, 'bottom', bottom, popHeight, true)
        break
      case 'top':
        setAnchor(popup, 'top', top, popHeight, true)
        break
      default: {
        const midTarget = (top + bottom) / 2
        setAnchor(popup, 'top', midTarget, popHeight, true, -popHeight / 2)
        popup.style.translate = '0% -50%'
        break
      }
    }
  }

  if (props.transform) popup.style.transform = props.transform

  popup.style.setProperty('--popup-travel-duration', `${travelDuration}ms`)
  popup.style.setProperty('--popup-travel-ease', `${props.travelEasing}`)

  setTimeout(() => {
    alignArrow(target, popup, position, newAlignment ?? alignment)
  }, travelDuration || 50)

  // Remove default enter animation class
  if (!isTopOrBottom) {
    // Replace the default vertical animation, if any, with a horizontal one
    if (popup.classList.contains('p-popover-enter-active')) {
      popup.classList.remove('p-popover-enter-active')
      popup.classList.add('popover-enter-x')
      setTimeout(() => popup.classList.remove('popover-enter-x'), 240)
    }
  }
}

function setAnchor(
  popup: HTMLElement,
  anchorPosition: Position,
  start: number,
  length = 0,
  force = false,
  offset = 0
): Position | undefined {
  const isTopOrBottom = anchorPosition === 'top' || anchorPosition === 'bottom'
  const isReverseCoord =
    anchorPosition === 'bottom' || anchorPosition === 'right'

  const screenMax = isTopOrBottom
    ? document.documentElement.clientHeight
    : document.documentElement.clientWidth

  // Fit the given vector within screen
  const clampedStart =
    fitToBounds(
      start + offset,
      length * (isReverseCoord ? -1 : 1),
      0,
      screenMax
    ) - offset

  // Check that the original vector fits and only proceed otherwise if forced to
  if (clampedStart !== start && !force) return anchorPosition

  const windowAnchorPoint =
    clampedStart + (isTopOrBottom ? window.scrollY : window.scrollX)

  // Reset the opposite side position
  const oppositePosition = {
    top: 'bottom',
    bottom: 'top',
    left: 'right',
    right: 'left',
  }[anchorPosition]
  popup.style.setProperty(`--popup-${oppositePosition}`, 'auto')

  // Set the new position
  const value = isReverseCoord
    ? screenMax - windowAnchorPoint
    : windowAnchorPoint
  popup.style.setProperty(`--popup-${anchorPosition}`, `${value}px`)
}

function fitToBounds(
  start: number,
  distance: number,
  min: number,
  max: number
): number {
  const clampedStart = clamp(start, 0, max)
  return clamp(clampedStart + distance, 0, max) - distance
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min
  if (value > max) return max
  return value
}

function alignArrow(
  target: HTMLElement,
  popup: HTMLElement,
  position: Position,
  alignment?: Alignment
) {
  if (props.hideArrow) {
    popup.classList.add('no-arrow')
    return
  }
  const popRect = popup.getBoundingClientRect()
  const targRect = target.getBoundingClientRect()

  popup.style.removeProperty('--overlayArrowTop')
  popup.style.removeProperty('--overlayArrowLeft')
  popup.classList.remove(
    'p-popover-flipped',
    'p-popover-left',
    'p-popover-right'
  )

  const isTopOrBottom = position === 'top' || position === 'bottom'

  if (isTopOrBottom) {
    const posX =
      !alignment || alignment === 'center' || props.centerArrow
        ? `${targRect.left + targRect.width / 2 - popRect.left}px`
        : alignment === 'left'
        ? `calc(1.25rem + ${targRect.left - popRect.left}px)`
        : `calc(100% - 1.25rem + ${targRect.right - popRect.right}px)`

    popup.style.setProperty('--overlayArrowLeft', `${posX}`)

    if (position === 'top') popup.classList.add('p-popover-flipped') // use the default class
  } else {
    const posY =
      !alignment || alignment === 'center' || props.centerArrow
        ? `${targRect.top + targRect.height / 2 - popRect.top}px`
        : alignment === 'top'
        ? `calc(1.25rem + ${targRect.top - popRect.top}px)`
        : `calc(100% - 1.25rem + ${targRect.bottom - popRect.bottom}px)`

    popup.style.setProperty('--overlayArrowTop', `${posY}`)

    popup.classList.add(`p-popover-${position}`)
  }
}

function realign(
  delay = 0,
  clampToViewport = false,
  hideOnOffscreen = false
): void {
  if (!popover.value?.container) return

  debounce(
    () => {
      if (!target) return

      if (!clampToViewport) {
        alignPopup(target, popover.value?.container)
      } else {
        const { top, bottom } = target.getBoundingClientRect()
        // const midY = (top + bottom) / 2
        const isTargetInViewport = top > 0 && bottom < window.innerHeight

        if (isTargetInViewport) {
          alignPopup(target, popover.value?.container)
        } else if (hideOnOffscreen) {
          hide()
        }
      }
    },
    delay,
    'realign'
  )
}

function watchParentSize(delay: number, allParents: boolean) {
  let observer: ResizeObserver | null = null
  let timeoutId: number | null = null

  return {
    setTarget(
      element: HTMLElement,
      callback: (entries: ResizeObserverEntry[]) => void
    ): void {
      observer?.disconnect()

      observer = new ResizeObserver((entries: ResizeObserverEntry[]) => {
        clearTimeout(timeoutId ?? 0)
        timeoutId = window.setTimeout(() => callback(entries), delay)
      })

      let currentElement: HTMLElement | null = element
      while (currentElement) {
        observer.observe(currentElement)
        if (!allParents) break
        currentElement = currentElement.parentElement
      }
    },
    cleanup(): void {
      observer?.disconnect()
      observer = null
    },
  }
}

/*
let arrowIntervalId = 0
let arrowDelayId = 0

function setupAnimation(callback, startDelay, duration, ...args) {
  clearInterval(this.animationInterval)
  clearTimeout(this.animationDelay)

  this.animationDelay = setTimeout(() => {
    this.animationInterval = setInterval(
      () => callback(...args),
      intervalTime
    )
  }, 15)

  setTimeout(() => clearInterval(this.animationInterval), duration + 30)
}*/

defineExpose({
  popover,
  target,
  previousTarget,
  lastActiveElement,
  toggle,
  show,
  hide,
  hover,
  realign,
  debounce,
  isOpen,
  isSticky,
  isClicked,
  flipCount,
  currentPosition,
})
</script>

<style>
.p-popup.p-popover.no-arrow:after,
.p-popup.p-popover.no-arrow:before {
  display: none;
}

.p-popup.p-popover:after,
.p-popup.p-popover:before {
  transition: left 70ms ease, top 70ms ease, opacity 200ms ease;
  left: var(--overlayArrowLeft, 0);
}

.p-popup.p-popover-right:before,
.p-popup.p-popover-right:after {
  top: var(--overlayArrowTop, 0);
  translate: -50% -50%;
  rotate: -90deg;
}

.p-popup.p-popover-left:before,
.p-popup.p-popover-left:after {
  left: 100%;
  top: var(--overlayArrowTop, 0);
  translate: 50% -50%;
  rotate: 90deg;
}

.p-popup.p-popover {
  inset: var(--popup-top, auto) var(--popup-right, auto)
    var(--popup-bottom, auto) var(--popup-left, auto) !important;

  transition: inset var(--popup-travel-duration)
      var(--popup-travel-ease, ease-out),
    transform 120ms cubic-bezier(0.4, 0, 0.2, 1),
    opacity 120ms cubic-bezier(0.4, 0, 0.2, 1);

  /*transition: inset 100ms cubic-bezier(0.4, 0, 0.2, 1); */
}

.p-popup.popover-enter-x {
  animation: popover-enter-x 120ms cubic-bezier(0, 0, 0.2, 1) forwards;
}

@keyframes popover-enter-x {
  from {
    opacity: 0;
    transform: scaleX(0.85);
  }

  to {
    opacity: 1;
    transform: scaleX(1);
  }
}
</style>

