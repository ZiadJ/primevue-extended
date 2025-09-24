<template>
  <PivotTreeTable
    ref="pvTreeTable"
    :value="products"
    resizableColumns
    groupableOnly
    scrollable
    style="min-height: calc(100vh - 10rem)"
    scrollHeight="calc(100vh - 10rem)"
    @groupChange="(e) => console.log(e)"
  >
    <template #header> Products </template>
    <Column field="name" header="Name" sortable expander style="width: 50%" />
    <Column field="code" header="Code" sortable />
    <Column field="category" header="Category" sortable />
    <Column field="quantity" header="Qty" sortable>
      <template #body="{ node }">
        <InputNumber
          inputStyle="width: 5rem"
          v-if="!node.children?.length"
          v-model="node.data.quantity"
        />
      </template>
    </Column>
    <Column field="price" header="Price" sortable />
  </PivotTreeTable>
</template>

<script setup async>
import { ref, onMounted, computed } from 'vue'
import { ProductService } from '@/service/ProductService'
import PivotTreeTable from '../PivotTreeTable.vue'

const products = ref([])
const pvTreeTable = ref([])

onMounted(async () => {
  products.value = await ProductService.getProducts()
})
</script>
