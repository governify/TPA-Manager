<script setup>
import { ref } from 'vue';
import { useTpaEditionStore } from '@/stores/tpaEdition';

import EditContent from './EditContent.vue';

import Tag from 'primevue/tag';
import Button from 'primevue/button';
import DataView from 'primevue/dataview';
import Fieldset from 'primevue/fieldset';
import Checkbox from 'primevue/checkbox';
import Dropdown from 'primevue/dropdown';
import Markdown from 'vue3-markdown-it';
import Divider from 'primevue/divider';
import { useTPAMode } from '@/utils/tpaMode.js';

const { tpaEditMode } = useTPAMode();

const props = defineProps({
  fieldName: {
    type: String,
    required: true
  }
});

const tpaEditionStore = useTpaEditionStore();

const guarantees = ref(tpaEditionStore.getTpaField(props.fieldName) ?? {});
const isGuaranteeByMember = ref(guarantees.value.map((value) => value.scope?.member));
const collapsed = ref(new Array(guarantees.value.length).fill(true));

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

function addNewGuarantee() {
  
  guarantees.value.push({
    id: "Default ID",
    notes: "Write your notes here...",
    description: "Guarantee description here...",
    scope: {
      project: {
        name: "Project",
        description: "Project",
        type: "string",
        default: tpaEditionStore.getTpaField('context.definitions.scopes.development.project.default')
      },
      class: {
        name: "Class",
        description: "Class",
        type: "string",
        default: tpaEditionStore.getTpaField('context.definitions.scopes.development.class.default')
      },
      // member: "*" // To indicate whether the guarantee is by member or not
    },
    of: [{
      scope: {
        project: tpaEditionStore.getTpaField('context.definitions.scopes.development.project.default')
        // member: "*" // To indicate whether the guarantee is by member or not
      },
      objective: "EXAMPLE_METRIC_1 / EXAMPLE_METRIC_2 * 100 >= 75",
      with: { },
      window: {
        type: "static",
        period: null,
        initial: new Date().getFullYear() + "-01-01T00:00:00.000Z"
      }
    }]
  });
  
  collapsed.value.push(false);
}

function deleteGuarantee(index) {
  guarantees.value.splice(index, 1);
  isGuaranteeByMember.value.splice(index, 1);
  collapsed.value.splice(index, 1);
}

function updateGuaranteeMember(index) {
  if (isGuaranteeByMember.value[index]) {
    guarantees.value[index].scope.member = "*";
    guarantees.value[index].of[0].scope.member = "*";
  } else {
    tpaEditionStore.deleteTpaField(props.fieldName + "[" + index + "].scope.member");
    tpaEditionStore.deleteTpaField(props.fieldName + "[" + index + "].of[0].scope.member");
  }
}

function scrollToMetric(metric) {
  const metricElement = document.getElementById(metric);
  metricElement.scrollIntoView({ behavior: 'smooth' });

  // Aplicar una clase que activa la transición
  metricElement.classList.add('shadow-effect');

  // Quitar la clase después de que termine la animación
  setTimeout(() => {
    metricElement.classList.remove('shadow-effect');
  }, 2000); // Tiempo total = tiempo de entrada (1s) + tiempo de permanencia (2s) + tiempo de salida (1s)
}


</script>

<template>
  
  <DataView :value="guarantees" dataKey="id">
    <template #list="slotProps">
      <Fieldset :legend="slotProps.data.id" :toggleable="true" :collapsed="collapsed[slotProps.index]" class="col-12" @toggle="collapsed[slotProps.index] = !collapsed[slotProps.index]">
        
        <div style="display: grid; grid-auto-flow: column; grid-template-columns: 1fr auto 1fr;">
          <div class="flex flex-column align-items-start gap-3">
            <span v-if="tpaEditMode" class="flex align-items-center gap-2">
              <i class="pi pi-file-edit"></i>
              <span class="font-semibold">Id:</span>
              <EditContent :fieldName="fieldName + '[' + slotProps.index + ']' + '.id'" />
            </span>
  
            <span class="flex align-items-center gap-2">
              <i class="pi pi-file-edit"></i>
              <span class="font-semibold">Notes:</span>
              <EditContent v-if="tpaEditMode" :fieldName="fieldName + '[' + slotProps.index + ']' + '.notes'" />
              <span v-else>{{ slotProps.data.notes }}</span>
            </span>
  
            <span class="flex align-items-center gap-2">
              <i class="pi pi-align-left"></i>
              <span class="font-semibold">Description:</span>
              <EditContent v-if="tpaEditMode" :fieldName="fieldName + '[' + slotProps.index + ']' + '.description'" />
              <span v-else>{{ slotProps.data.description }}</span>
            </span>
  
            <span class="flex align-items-center gap-2">
              <i class="pi pi-users"></i>
              <span class="font-semibold">Is guarantee by member?</span>
              <Checkbox v-model="isGuaranteeByMember[slotProps.index]" aria-label="guaranteeByMember" :disabled="!tpaEditMode" :readonly="!tpaEditMode" :binary="true" trueValue="*" :falseValue="undefined" @change="updateGuaranteeMember(slotProps.index)" />
            </span>
  
            <span class="flex align-items-center gap-2">
              <i class="pi pi-clock"></i>
              <span class="font-semibold">Calculation period:</span>
              <Dropdown v-if="tpaEditMode" class="editDropdown" :options="tpaEditionStore.WINDOW_PERIOD_OPTIONS" v-model="slotProps.data.of[0].window.period" optionLabel="label" optionValue="value" placeholder="Select a window period" />
              <Tag v-else :value="slotProps.data.of[0].window.period"></Tag>
            </span>
  
            <span class="flex align-items-center gap-2">
              <i class="pi pi-check-circle"></i>
              <span class="font-semibold">Objective:</span>
              <template v-if="tpaEditMode">
                <EditContent :fieldName="fieldName + '[' + slotProps.index + ']' + '.of[0].objective'" />
                <i class="pi pi-info-circle" title="The objective must be a mathematical expression using the metrics defined in the 'with' section."></i>
              </template>
              <Tag v-else :value="slotProps.data.of[0].objective"></Tag>
            </span>

            <span class="flex align-items-center gap-2">
              <i class="pi pi-tag"></i>
              <span class="font-semibold">Metrics being used:</span>
              <template v-if="Object.keys(slotProps.data.of[0].with).length == 0">
                <Tag severity="warning" value="There are no metrics being used!" />
              </template>
              <template v-else>
                <div v-for="metric in Object.keys(slotProps.data.of[0].with)" @click="scrollToMetric(metric)" class="cursor-pointer">
                  <Tag :value="metric" :key="slotProps.index" />
                </div>
              </template>
            </span>
          </div>
          
          <Divider layout="vertical" />

          <div class="pl-3">
            <h4 class="mb-2 text-center"><u>Markdown content of the "notes" section</u></h4>
            <Markdown :source="slotProps.data.notes" />
          </div>
        </div>
        
        <Button v-if="tpaEditMode" class="mt-2" icon="pi pi-trash" severity="danger" @click="deleteGuarantee(slotProps.index)" />
        
      </Fieldset>
    </template>
    
    <template #footer v-if="tpaEditMode">
      <Button label="Add new guarantee" icon="pi pi-plus" @click="addNewGuarantee" />
    </template>
  </DataView>
  
</template>

<style>
@keyframes shadow-animation {
  0% {
    box-shadow: 0px 0px 0px 10px rgba(255, 223, 186, 0);
  }
  50% {
    box-shadow: 0px 0px 15px 15px rgba(255, 223, 186, 0.7);
  }
  100% {
    box-shadow: 0px 0px 0px 10px rgba(255, 223, 186, 0);
  }
}

.shadow-effect {
  animation: shadow-animation 2s ease-in-out; /* Duración y efecto de la animación */
}

</style>