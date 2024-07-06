<script setup>
import _ from 'lodash';
import { ref, watch } from 'vue';
import { deepFindKeyword, parseJsonEditorContent } from '@/utils/utils';
import { useAppThemeStore } from '@/stores/appTheme';
import { useTpaEditionStore } from '@/stores/tpaEdition';

import 'vanilla-jsoneditor/themes/jse-theme-dark.css'
import JsonEditorVue from 'json-editor-vue'
import Checkbox from 'primevue/checkbox';
import DataView from 'primevue/dataview';
import Fieldset from 'primevue/fieldset';
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import { useTPAMode } from '@/utils/tpaMode.js';

const { tpaEditMode } = useTPAMode();

const props = defineProps({
  fieldName: {
    type: String,
    required: true
  }
});

const appThemeStore = useAppThemeStore();
const tpaEditionStore = useTpaEditionStore();

const BLOCKS_WITHOUT_GUARANTEES = ["divider-changer", "divider-github", "divider-github-states", "divider-changer-github"];
const BLOCKS_WITH_ZERO_METRIC_CONFIG = ["correlated", "gauge-time-correlation", "gauge-time-correlation-notZero", "gauge-period-time-correlation-notZero-member"];
const BLOCKS_WITH_TIME_INTERVAL_CONFIG = ["time-graph2-member-groupby", "time-graph-count-groupby"]
const BLOCKS_WITH_AGGREGATION_CONFIG = ["time-graph2-member-groupby"]

const projectId = tpaEditionStore.getTpaField('context.definitions.scopes.development.project.default');
const dashboardBlocks = ref(Object.values(tpaEditionStore.getTpaField(props.fieldName)?.blocks ?? {}));
const useDefaultDashboard = ref(dashboardBlocks.value.length === 0);
const dashboardBlocksCache = ref(JSON.parse(localStorage.getItem("dashboardBlocks") ?? "{}")?.[projectId] || dashboardBlocks.value);
const currentlyEditingConfig = ref(new Array(dashboardBlocks.value.length).fill(false));
const collapsed = ref(new Array(dashboardBlocks.value.length).fill(true));

// Update the TPA edition store when dashboard config is modified
watch(dashboardBlocks.value, (newValue) => {
  if (!useDefaultDashboard.value) {
    tpaEditionStore.updateTpaField(props.fieldName, {configDashboard: true, blocks: newValue});
  }
});

defineExpose({
  collapseAll,
  expandAll
});

function collapseAll() {
  collapsed.value.map((value, index) => collapsed.value[index] = true);
}

function expandAll() {
  collapsed.value.map((value, index) => collapsed.value[index] = false);
}

// Used to refresh the local storage cache when the user changes the "use default dashboard" checkbox
function refreshLocalStorageInfo() {
  if (useDefaultDashboard.value) {
    let currentCache = JSON.parse(localStorage.getItem("dashboardBlocks") ?? "{}");
    currentCache[projectId] = dashboardBlocks.value;
    
    localStorage.setItem("dashboardBlocks", JSON.stringify(currentCache));
    tpaEditionStore.updateTpaField(props.fieldName, {});
  } else {
    dashboardBlocksCache.value = JSON.parse(localStorage.getItem("dashboardBlocks") ?? "{}")?.[projectId] || dashboardBlocks.value;
    
    const blocks = dashboardBlocks.value.reduce((acc, value, index) => ({ ...acc, [index]: value }), {});
    tpaEditionStore.updateTpaField(props.fieldName, { configDashboard: true, blocks });
  }
}

function validateBlockTypeChange(blockData) {

  blockData.config = parseJsonEditorContent(blockData.config);

  if (BLOCKS_WITHOUT_GUARANTEES.includes(blockData.type)) {
    _.unset(blockData, 'guarantee');
  } else {
    blockData.guarantee ??= null;
  } 

  if (BLOCKS_WITH_ZERO_METRIC_CONFIG.includes(blockData.type) || blockData.type.includes('notZero')) {
    blockData.config['x-axis-metric'] ??= "metric_[metric-name-here]";
    blockData.config['y-axis-metric'] ??= "metric_[metric-name-here]";
    blockData.config['not-zero-metric'] ??= "metric_[metric-name-here]";
  } else {
    _.unset(blockData.config, 'x-axis-metric');
    _.unset(blockData.config, 'y-axis-metric');
    _.unset(blockData.config, 'not-zero-metric');
  }

  if (BLOCKS_WITH_TIME_INTERVAL_CONFIG.includes(blockData.type)) {
    blockData.config['time-interval'] ??= "[1d/1w/...]"
  } else {
    _.unset(blockData.config, 'time-interval');
  }

  if (BLOCKS_WITH_AGGREGATION_CONFIG.includes(blockData.type)) {
    blockData.config['aggregation'] ??= "[sum/avg/...]"
  } else {
    _.unset(blockData.config, 'aggregation');
  }
  
}

function addNewBlock() {

  dashboardBlocks.value.push({
    type: null,
    guarantee: null,
    config: {
      "[title-field-name-here]": "Default title",
      "scope-class": tpaEditionStore.getTpaField('context.definitions.scopes.development.class.default')
    }
  });

  collapsed.value.push(false);
}

function deleteBlock(index) {
  dashboardBlocks.value.splice(index, 1);
  collapsed.value.splice(index, 1);
}

</script>

<template>
  
  <div class="flex gap-2">
    <p>Use the default dashboard?</p>
    <Checkbox v-model="useDefaultDashboard" aria-label="useDefaultDashboard" :binary="true" :disabled="!tpaEditMode" :readonly="!tpaEditMode" @change="refreshLocalStorageInfo" />
  </div>
  
  <DataView v-if="!useDefaultDashboard" :value="dashboardBlocks" dataKey="id">
    <template #list="slotProps">
      <Fieldset class="col-12" :legend="currentlyEditingConfig[slotProps.index] ? 'Editing config...' : deepFindKeyword('title', slotProps.data.config)" :toggleable="true" :collapsed="collapsed[slotProps.index]" @toggle="collapsed[slotProps.index] = !collapsed[slotProps.index]" key="index">
        <div style="display: grid; gap: 1rem; align-items: center; grid-template-columns: 30% auto" :class="!BLOCKS_WITHOUT_GUARANTEES.includes(slotProps.data.type) ? 'gridWithGuarantee' : 'gridWithoutGuarantee'">
          
          <span class="flex align-items-center gap-2">
            <i class="pi pi-star"></i>
            <span class="font-semibold">Type</span>
          </span>
          <Tag v-if="!tpaEditMode" :value="slotProps.data.type"></Tag>
          <Dropdown v-else class="editDropdown" v-model="slotProps.data.type" :options="tpaEditionStore.BLOCK_TYPES" placeholder="Select a type" @change="validateBlockTypeChange(slotProps.data)" />
          
          <template v-if="!BLOCKS_WITHOUT_GUARANTEES.includes(slotProps.data.type)">
            <span class="flex align-items-center gap-2">
              <i class="pi pi-tag"></i>
              <span class="font-semibold">Guarantee</span>
            </span>
            <Tag v-if="!tpaEditMode" :value="slotProps.data.guarantee" style="word-break: break-all;"></Tag>
            <Dropdown v-else v-model="slotProps.data.guarantee" class="editDropdown" :options="tpaEditionStore.getTpaField('terms.guarantees').map(guarantee => guarantee.id)" placeholder="Select a guarantee" />
          </template>
            
          <span class="flex align-items-center gap-2" style="grid-area: configTitle;">
            <i class="pi pi-wrench"></i>
            <span class="font-semibold">Config</span>
          </span>
          <div style="grid-area: configEdit;">
            <ul v-if="!tpaEditMode" class="my-0">
              <li class="text-md font-bold text-700" v-for="(value, key) in slotProps.data.config" :key="key">{{ key }}: {{ value }}</li>
            </ul>
            <JsonEditorVue v-else :class="appThemeStore.isDarkModeOn && 'jse-theme-dark'" v-model="slotProps.data.config" @click="currentlyEditingConfig[slotProps.index] = true" @blur="slotProps.data.config = parseJsonEditorContent(slotProps.data.config); currentlyEditingConfig[slotProps.index] = false" mode="text" :key="slotProps.data.type" />
          </div>
          
          <Button v-if="tpaEditMode" icon="pi pi-trash" severity="danger" @click="deleteBlock(slotProps.index)" />
        </div>

      </Fieldset>
    </template>

    <template #footer v-if="tpaEditMode">
      <Button label="Add new block" icon="pi pi-plus" @click="addNewBlock" />
    </template>
  </DataView>
</template>
  
<style scoped>
  .gridWithGuarantee {
    grid-template-areas: 'auto configTitle' 'auto configEdit' 'auto configEdit' 'auto configEdit';
  }
  
  .gridWithoutGuarantee {
    grid-template-areas: 'auto configTitle' 'auto configEdit' 'auto configEdit';
  }
</style>