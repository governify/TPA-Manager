<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from "primevue/usetoast";

import { useTpaEditionStore } from '@/stores/tpaEdition';
import { useAppThemeStore } from '@/stores/appTheme';

import Tag from 'primevue/tag';
import Chips from 'primevue/chips';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import Fieldset from 'primevue/fieldset';
import Checkbox from 'primevue/checkbox';
import InputText from 'primevue/inputtext';

import highlight from 'highlight.js';
import CodeEditor from 'simple-code-editor';

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  fieldName: {
    type: String
  }
})

const tpaEditionStore = useTpaEditionStore();
const appThemeStore = useAppThemeStore();
const toast = useToast();

const variables = ref({});

onMounted(() => {
  for (let stepNumber in props.data.steps) {
    const stepData = props.data.steps[stepNumber];

    if (stepData.type.includes('query')) {
      tpaEditionStore.formatQueryGraphQL(stepData.query).then(formattedQuery => {
        props.data.steps[stepNumber].query = formattedQuery;
      }).catch(error => {
        toast.add({
          severity: 'error',
          summary: 'Invalid query format',
          detail: `The "query" format at Step ${parseInt(stepNumber, 10) + 1} of the metric "${props.fieldName.split('[')[1].split(']')[0]}" is invalid.
          Please use a valid GraphQL format.`,
          life: 10000
        });
      });
    } else if (stepData.type === 'runScript') {
      variables.value[stepNumber] = JSON.stringify(stepData.variables, null, 2);
    }
  }
})

function updateStepType(stepNumber, stepValue) {
  if (stepValue === 'queryGetObject' || stepValue === 'queryGetObjects') {
    props.data.steps[stepNumber] = {
      type: stepValue,
      query: "query {\n" + "  repository(owner: \"%PROJECT.github.repository%\", name: \"%PROJECT.github.repoOwner%\") {\n" + "    name\n" + "  }\n" + "}",
      cache: false
    };
  } else if (stepValue === 'objectGetSubObjects') {
    props.data.steps[stepNumber] = {
      type: 'objectGetSubObjects',
      location: ''
    };
  } else if (stepValue === 'objectsFilterObjects') {
    props.data.steps[stepNumber] = {
      type: 'objectsFilterObjects',
      filters: []
    };
  } else if (stepValue === 'runScript') {
    variables.value[stepNumber] = "{}"
    props.data.steps[stepNumber] = {
      type: 'runScript',
      variables: {},
      script: "module.exports.generic = function newFunction(inputData, variables)  {\n" + "  return inputData;\n" + "}"
    };
  }
  
  tpaEditionStore.updateTpaField(props.fieldName + '.githubGQL.custom.steps.[' + stepNumber + ']', props.data.steps[stepNumber]);
}

function updateStepVariables(stepNumber) {
  try {
    const variablesValue = JSON.parse(variables.value[stepNumber]);
    props.data.steps[stepNumber].variables = variablesValue;
    tpaEditionStore.updateTpaField(props.fieldName + '.githubGQL.custom.steps.[' + stepNumber + '].variables', variablesValue);
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Invalid variables format',
      detail: `The "variables" format at Step ${parseInt(stepNumber, 10) + 1} of the metric "${props.fieldName.split('[')[1].split(']')[0]}" is invalid.
      Please use a valid JSON format.`,
      life: 10000
    });

    variables.value[stepNumber] = JSON.stringify(props.data.steps[stepNumber].variables, null, 2);
  }
}

async function updateStepQuery(stepNumber, stepQuery) {
  try {
    const formattedQuery = await tpaEditionStore.formatQueryGraphQL(stepQuery);
    props.data.steps[stepNumber].query = formattedQuery;
    tpaEditionStore.updateTpaField(props.fieldName + '.githubGQL.custom.steps.[' + stepNumber + '].query', formattedQuery);
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Invalid query format',
      detail: `The "query" format at Step ${parseInt(stepNumber, 10) + 1} of the metric "${props.fieldName.split('[')[1].split(']')[0]}" is invalid.
      Please use a valid GraphQL format.`,
      life: 10000
    });
  }
}

function updateStepData(stepNumber, stepKey, stepData) {
  tpaEditionStore.updateTpaField(props.fieldName + '.githubGQL.custom.steps.[' + stepNumber + '][' + stepKey + ']', stepData);
}

function checkFilterFormat(e, stepNumber) {
  const newFilter = e.value[e.value.length - 1];
  const filterSplit = newFilter.split("==");
  if (filterSplit.length !== 2 || filterSplit[0].trim() === "" || filterSplit[1].trim() === "") {
    props.data.steps[stepNumber].filters.pop();
    toast.add({
      severity: 'warn',
      summary: 'Invalid filter format',
      detail: 'The filter format is invalid. Please use the following format: "abc == xyz".',
      life: 10000
    });
  }
}

function addNewStep() {
  const newStepNumber = Object.keys(props.data.steps).length;
  props.data.steps[newStepNumber] = {
    type: 'queryGetObject',
    query: "query {\n" + "  repository(owner: \"%PROJECT.github.repository%\", name: \"%PROJECT.github.repoOwner%\") {\n" + "    name\n" + "  }\n" + "}",
    cache: false
  };
  tpaEditionStore.updateTpaField(props.fieldName + '.githubGQL.custom.steps[' +  newStepNumber + ']', props.data.steps[newStepNumber]);
}

function deleteStep(event, stepNumber) {
  event.stopPropagation();
  tpaEditionStore.deleteTpaField(props.fieldName + '.githubGQL.custom.steps.[' + stepNumber + ']');
  delete props.data.steps?.[stepNumber];

  const newSteps = {};
  let newIndex = 0;

  for (let step in props.data.steps) {
    if (!isNaN(step)) {
      newSteps[newIndex] = props.data.steps[step];
      newIndex++;
    }
  }

  props.data.steps = newSteps;
  tpaEditionStore.updateTpaField(props.fieldName + '.githubGQL.custom.steps', props.data.steps);
}

function moveStep(event, stepNumber, direction) {
  event.stopPropagation();
  if (direction === 'up' && stepNumber != 0 || direction === 'down' && stepNumber != Object.keys(props.data.steps).length - 1) {
    const newStepNumber = direction === 'up' ? parseInt(stepNumber, 10) - 1 : parseInt(stepNumber, 10) + 1;
    const newStep = props.data.steps[newStepNumber];
  
    props.data.steps[newStepNumber] = props.data.steps[stepNumber];
    props.data.steps[stepNumber] = newStep;
  
    tpaEditionStore.updateTpaField(props.fieldName + '.githubGQL.custom.steps', props.data.steps);

    const newVariables = {};
    for (let step in variables.value) {
      if (step === stepNumber) {
        newVariables[newStepNumber] = variables.value[step];
      } else if (step == newStepNumber) {
        newVariables[stepNumber] = variables.value[step];
      } else {
        newVariables[step] = variables.value[step];
      }
    }
    variables.value = newVariables;
  }
}
</script>

<template>
  <Fieldset :legend="props.data.title" :toggleable="true">
    <span v-if="tpaEditionStore.isEditionMode && props.fieldName" class="flex align-items-center gap-2 mb-4">
        <i class="pi pi-file-edit"></i>
        <span class="font-semibold">Title:</span>
        <InputText type="text" v-model="props.data.title" @focusout="tpaEditionStore.updateTpaField(props.fieldName + '.githubGQL.custom.title', props.data.title);" />
    </span>

    <Fieldset v-for="(stepData, stepNumber) in props.data.steps" :toggleable="true" class="step-fieldset mb-3" :key="stepNumber + 'fieldset'">
      <template #legend>
        <div class="flex align-items-center gap-2">
          <span class="p-fieldset-legend-text">
            Step {{ parseInt(stepNumber, 10) + 1 }} - {{ tpaEditionStore.STEP_TYPES.find(stepType => stepType.value === stepData?.type)?.label }}
          </span>
  
          <Button v-if="tpaEditionStore.isEditionMode" icon="pi pi-arrow-up" class="p-button-rounded p-button-text" @click="moveStep($event, stepNumber, 'up')" />
          <Button v-if="tpaEditionStore.isEditionMode" icon="pi pi-arrow-down" class="p-button-rounded p-button-text" @click="moveStep($event, stepNumber, 'down')" />
          <Button v-if="tpaEditionStore.isEditionMode" icon="pi pi-trash" class="p-button-rounded p-button-danger p-button-text" @click="deleteStep($event, stepNumber)" />
        </div>
      </template>

      <ul>
        <li v-for="(stepValue, stepKey) in stepData" :key="stepKey + 'li'" >
          
          <template v-if="tpaEditionStore.isEditionMode">
            <div v-if="stepKey === 'type'" class="flex align-items-center gap-2">
              <strong>Type:</strong>
              <Dropdown class="editDropdown w-full" :options="tpaEditionStore.STEP_TYPES" optionLabel="label" optionValue="value" v-model="props.data.steps[stepNumber].type" placeholder="Select a type" @change="updateStepType(stepNumber, props.data.steps[stepNumber].type)" />
            </div>

            <template v-if="props.data.steps[stepNumber].type === 'queryGetObject' || props.data.steps[stepNumber].type === 'queryGetObjects'">
              <div v-if="stepKey === 'query'" class="flex flex-column gap-2">
                <strong>Query:</strong>
                <div @focusout="updateStepQuery(stepNumber, stepValue)">
                  <CodeEditor width="100%" :wrap="true" v-model="props.data.steps[stepNumber].query" :languages="[['graphql', 'GraphQL']]" :theme="appThemeStore.isDarkModeOn ? 'github-dark' : 'github'" :key="stepNumber + 'query'"></CodeEditor>
                </div>
              </div>
              <div v-else-if="stepKey === 'cache'" class="flex align-items-center gap-2">
                <strong>Cache:</strong>
                <Checkbox v-model="props.data.steps[stepNumber].cache"  aria-label="cache" :binary="true" :trueValue="true" :falseValue="false" @change="updateStepData(stepNumber, stepKey, !stepValue)" />
              </div>
            </template>

            <template v-else-if="props.data.steps[stepNumber].type === 'objectGetSubObjects'">
              <div v-if="stepKey === 'location'" class="flex align-items-center gap-2">
                <strong>Location:</strong>
                <InputText class="w-full" v-model="props.data.steps[stepNumber].location" @focusout="updateStepData(stepNumber, stepKey, stepValue)" />
              </div>
            </template>

            <template v-else-if="props.data.steps[stepNumber].type === 'objectsFilterObjects'">
              <div v-if="stepKey === 'filters'" class="flex flex-column gap-2">
                <strong>Filters:</strong>
                <div @focusout="updateStepData(stepNumber, stepKey, stepValue)">
                  <Chips v-model="props.data.steps[stepNumber].filters" separator="," :add-on-blur="true" @add="checkFilterFormat($event, stepNumber)" class="w-full" />
                </div>
              </div>
            </template>

            <template v-else-if="props.data.steps[stepNumber].type === 'runScript'">
              <div v-if="stepKey === 'variables'" class="flex flex-column gap-2">
                <strong>Variables:</strong>
                <div @focusout="updateStepVariables(stepNumber)">
                  <CodeEditor width="100%" v-model="variables[stepNumber]" :languages="[['json', 'JSON']]" :theme="appThemeStore.isDarkModeOn ? 'github-dark' : 'github'" :key="stepNumber + 'variables'"></CodeEditor>
                </div>
              </div>
              <div v-else-if="stepKey === 'script'" class="flex flex-column gap-2">
                <strong>Script:</strong>
                <div @focusout="updateStepData(stepNumber, stepKey, stepValue)">
                  <CodeEditor width="100%" v-model="props.data.steps[stepNumber].script" :languages="[['javascript', 'JavaScript']]" :theme="appThemeStore.isDarkModeOn ? 'github-dark' : 'github'" :key="stepNumber + 'script'"></CodeEditor>
                </div>
              </div>
            </template>
            
            <span v-else>
              {{ stepKey }}: {{ stepValue }}
            </span>
          </template>
          
          <template v-else>

            <template v-if="stepData.type === 'queryGetObject' || stepData.type === 'queryGetObjects'">
              <div v-if="stepKey === 'query'" class="flex flex-column gap-2">
                <strong>Query:</strong>
                <div>
                  <CodeEditor width="100%" :wrap="true" v-model="stepData.query" :readOnly="true" :languages="[['graphql', 'GraphQL']]" :theme="appThemeStore.isDarkModeOn ? 'github-dark' : 'github'" :key="stepNumber + 'query'"></CodeEditor>
                </div>
              </div>
              <div v-else-if="stepKey === 'cache'" class="flex align-items-center gap-2">
                <strong>Cache:</strong>
                <Checkbox v-model="stepData.cache" aria-label="cache" :binary="true" :trueValue="true" :falseValue="false" :readonly="true" />
              </div>
            </template>

            <template v-else-if="stepData.type === 'objectGetSubObjects'">
              <div v-if="stepKey === 'location'" class="flex align-items-center gap-2">
                <strong>Location:</strong>
                <Tag :value="stepData.location" />
              </div>
            </template>

            <template v-else-if="stepData.type === 'objectsFilterObjects'">
              <div v-if="stepKey === 'filters'" class="flex flex-column gap-2">
                <strong>Filters:</strong>
                <div>
                  <Chips v-model="stepData.filters" separator="," disabled class="w-full" style="opacity: 1;">
                    <template #removetokenicon>
                      &nbsp;
                    </template>
                  </Chips>
                </div>
              </div>
            </template>

            <template v-else-if="stepData.type === 'runScript'">
              <div v-if="stepKey === 'variables'" class="flex flex-column gap-2">
                <strong>Variables:</strong>
                <div>
                  <CodeEditor width="100%" v-model="variables[stepNumber]" :readOnly="true" :languages="[['json', 'JSON']]" :theme="appThemeStore.isDarkModeOn ? 'github-dark' : 'github'" :key="stepNumber + 'variables'"></CodeEditor>
                </div>
              </div>
              <div v-else-if="stepKey === 'script'" class="flex flex-column gap-2">
                <strong>Script:</strong>
                <div>
                  <CodeEditor width="100%" v-model="stepData.script" :readOnly="true" :languages="[['javascript', 'JavaScript']]" :theme="appThemeStore.isDarkModeOn ? 'github-dark' : 'github'" :key="stepNumber + 'script'"></CodeEditor>
                </div>
              </div>
            </template>

            <div v-else>
              {{ stepKey }}: {{ stepValue }}
            </div>

          </template>
          
        </li>
      </ul>
    </Fieldset>
    <Button v-if="tpaEditionStore.isEditionMode" icon="pi pi-plus" class="p-button-rounded p-button-primary" @click="addNewStep" label="Add new step" />
  </Fieldset>


</template>

<style scoped>
:deep(.step-fieldset .p-fieldset-content) {
  padding: 0;
}

.p-fieldset-content ul {
  list-style-type: none;
  margin: 0.5rem;
  padding-left: 0;
  display: grid;
  gap: 0.5rem;
}

:deep(.p-chips-multiple-container) {
  row-gap: 10px;
  width: 100%;
}
</style>