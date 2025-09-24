<script setup>
import { ref, useTemplateRef } from 'vue'
import Tour from '../PopupTour.vue'

const steps = [
  {
    selector: '#step1',
    content: 'First step details',
  },
  {
    selector: '#step2',
    content: 'Second step details',
    position: 'left',
  },
  {
    selector: '#step3',
  },
]

const tour = useTemplateRef('tour')
const index = ref(0)
</script>

<template>
  <div class="card">
    <Button label="Start Tour" class="m-4" @click="tour.show()" />
    {{ index }}

    <section class="flex flex-col items-center">
      <Panel id="step1" class="w-3/4 py-32 text-center">First</Panel>
      <Button id="step2" class="my-96">Second</Button>
      <Panel
        id="step3"
        class="w-3/4 py-32 text-center"
        data-tour="{ content: 'Final Step Details (set inline)' }"
      >
        Third
      </Panel>
    </section>

    <Tour
      ref="tour"
      v-model="index"
      :steps="steps"
      highlightClass="shadow"
      trackScroll
    />
  </div>
</template>
