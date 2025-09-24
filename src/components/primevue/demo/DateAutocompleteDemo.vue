<template>
  <div class="card flex gap-2">
    <Calendar v-model="date" v-datetime-mask v-auto-focus placeholder="date" />
    <Calendar
      v-model="date"
      v-datetime-mask
      showTime
      placeholder="datetime"
      stepMinute="15"
    />
    <Calendar v-model="date" v-datetime-mask timeOnly placeholder="time" />
  </div>
  {{ date }}
</template>

<script setup>
import { ref } from 'vue'
import vDatetimeMask from '@/directives/dateautocomplete'
import vAutofocus from '@/directives/autofocus'

const date = ref()
</script>
