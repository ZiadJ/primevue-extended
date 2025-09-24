<template>
  <div class="flex justify-around items-center gap-5 py-5">
    <Gauge
      v-model="value1"
      :size="150"
      :fulcrumSize="1.1"
      :pointerHeight="0.95"
      :pointerWidth="2"
      @change="change"
    />
    <Gauge
      v-model="value2"
      :min="10"
      :max="50"
      :fulcrumSize="0.85"
      :showValue="false"
    />
    <Gauge
      v-model="value3"
      :min="-5"
      :max="5"
      :size="70"
      :fulcrumSize="1.5"
      style="font-size: 11px"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Gauge from '../Gauge.vue'

const show = ref(false)
const value1 = ref(10)
const value2 = ref(20)
const value3 = ref(3)

function change(value) {
  console.log(value)
}
</script>
