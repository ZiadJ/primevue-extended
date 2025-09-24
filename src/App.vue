<script setup>
import { ref } from 'vue'
import PopupDemo from '@/components/primevue/demo/PopupDemo.vue'
import TourDemo from '@/components/primevue/demo/PopupTourDemo.vue'
import PopupTooltipDemo from '@/components/primevue/demo/PopupTooltipDemo.vue'
import TickedSliderDemo from '@/components/primevue/demo/TickedSliderDemo.vue'
import GaugeDemo from '@/components/primevue/demo/GaugeDemo.vue'
import PivotTreeTableDemo from '@/components/primevue/demo/PivotTreeTableDemo.vue'
import TreePanelDemo from '@/components/primevue/demo/TreePanelDemo.vue'
import TreeTableMiscDemo from '@/components/primevue/demo/TreeTableMiscDemo.vue'
import TreeTableFilterDemo from '@/components/primevue/demo/TreeTableFilterDemo.vue'
import DateAutocompleteDemo from '@/components/primevue/demo/DateAutocompleteDemo.vue'

let tabIndex = ref('0')
const experimental = 0
if (experimental) tabIndex.value = '9'
</script>

<template>
  <ThemeSwitcher>
    <p class="font-semibold text-lg">
      A collection of components extending Primevue
    </p>
  </ThemeSwitcher>
  <div class="card">
    <Tabs v-model:value="tabIndex" scrollable>
      <TabList>
        <Tab value="0">Popup</Tab>
        <Tab value="1">Tooltip</Tab>
        <Tab value="2">Guided Tour</Tab>
        <Tab value="3">Ticked Slider</Tab>
        <Tab value="4">Gauge</Tab>
        <Tab value="5">Pivot Table</Tab>
        <Tab value="6">Tree Panel</Tab>
        <Tab value="7">Tree Table Filter</Tab>
        <Tab value="8">Tree Table Misc.</Tab>
        <Tab value="9">Date Completion</Tab>
        <Tab v-if="experimental" value="10">Hover Menus</Tab>
      </TabList>
      <TabPanels>
        <TabPanel value="0">
          <br />
          A flexible popup menu component that supports:
          <ul class="list-disc ml-4">
            <li>Custom dynamic positioning with target tracking</li>
            <li>Click and hover triggers</li>
            <li>Focus management</li>
          </ul>
          <br />
          <Divider />
          <br />
          <PopupDemo />
        </TabPanel>
        <TabPanel value="1">
          <br />
          A tooltip component that buids upon the Popup component, featuring:
          <ul class="list-disc ml-4">
            <li>Dynamic nested element targeting</li>
            <li>Fully decoupled two-way binding</li>
            <li>Rich content support</li>
          </ul>
          <br />
          <Divider /><br />
          <PopupTooltipDemo />
        </TabPanel>
        <TabPanel value="2">
          <br />
          A basic tour guide component using the Popup component.
          <br />
          <br />
          <Divider />
          <TourDemo v-if="tabIndex == 2" />
        </TabPanel>

        <TabPanel value="3">
          <br />
          A slider component with clickable ticks and an input element over each
          handle.
          <br />
          <br />
          <Divider />
          <TickedSliderDemo />
        </TabPanel>
        <TabPanel value="4">
          <br />
          A knob component with a customizable pointer.
          <br />
          <br />
          <Divider />
          <GaugeDemo />
        </TabPanel>
        <TabPanel value="5">
          <br />
          A component that dynamicaly groups tabular data by specifiable
          columns.
          <br />
          <Divider />
          <PivotTreeTableDemo />
        </TabPanel>
        <TabPanel value="6">
          <br />
          A panel menu that works like the tree select.
          <br />
          <br />
          <Divider />
          <TreePanelDemo />
        </TabPanel>
        <TabPanel value="7">
          <br />
          Custom filter functionality for the TreeTable with the following
          features:
          <br />
          <ul class="list-disc ml-4">
            <li>Match highlighting</li>
            <li>Auto unfold</li>
            <li>High performance</li>
          </ul>
          <br />
          <Divider />
          <TreeTableFilterDemo />
        </TabPanel>
        <TabPanel value="8">
          <br />
          Extending the TreeTable with the following functionality:
          <ul class="list-disc ml-4">
            <li>Drag and drop</li>
            <li>Animated expansion</li>
            <li>Hierarchy lines</li>
          </ul>
          <br />
          <Divider />
          <TreeTableMiscDemo />
        </TabPanel>
        <TabPanel value="9">
          <br />
          A directive that autocompletes dates while typing.
          <br />
          <br />
          <Divider />
          <DateAutocompleteDemo />
        </TabPanel>
        <TabPanel v-if="experimental" value="10">
          <br />
          The MegaMenu component with hover support.
          <br />
          <br />
          <Divider />
          <HoverMegaMenuDemo />
          <HoverSplitButtonDemo />
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>
  <toast />
</template>
