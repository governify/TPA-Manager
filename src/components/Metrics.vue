<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from "primevue/usetoast";
import { useAppThemeStore } from '@/stores/appTheme';
import { useTpaEditionStore } from '@/stores/tpaEdition';

import StepDisplay from './StepDisplay.vue';

import 'vanilla-jsoneditor/themes/jse-theme-dark.css'
import ToggleButton from 'primevue/togglebutton';
import OverlayPanel from 'primevue/overlaypanel';
import CodeEditor from 'simple-code-editor';
import Calendar from 'primevue/calendar';
import InputText from 'primevue/inputtext';
import DataView from 'primevue/dataview';
import Fieldset from 'primevue/fieldset';
import Dropdown from 'primevue/dropdown';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import { useTPAMode } from '@/utils/tpaMode.js';

const props = defineProps({
    fieldName: {
        type: String,
        required: true
    }
});

const toast = useToast();
const appThemeStore = useAppThemeStore();
const { tpaEditMode } = useTPAMode();
const tpaEditionStore = useTpaEditionStore();

const metrics = ref(tpaEditionStore.getTpaField(props.fieldName) ?? {});
const collapsed = ref(new Array(Object.keys(metrics.value).length).fill(true));
const metricEntries = ref(Object.entries(metrics.value));
const metricElements = ref([]);
const metricDetailsObject = ref([]);
const metricDetailsString = ref([]);
const metricElementTypes = ref([]);

const showSwitchDetailsModeErrorDialog = ref(false);
const selectWindowOverlayPanel = ref();
const showEditEventDialog = ref(false);
const currentEditingMetricId = ref();
const currentEditingMetricIndex = ref();
const currentEditingSource = ref();
const currentEditingEndpoint = ref();
const currentEditingFilter = ref({});
const isInteractiveMode = ref(false);
const changingElementType = ref(false);
const detailsMode = ref(new Array(Object.keys(metrics.value).length).fill(false)); // true = Interactive; false = Json
const windowComputation = ref({
    period: "weekly",
    initial: new Date(new Date().getFullYear(), 0, 1),
    end: new Date(),
    timeZone: "America/Los_Angeles"
});

onMounted(() => {
    for (let metricEntry of metricEntries.value) {
        const metricElement = JSON.stringify(metricEntry?.[1]?.measure?.element, null, 2);
        
        metricDetailsObject.value.push(Object.values(Object.values(metricEntry?.[1]?.measure?.event)[0])[0]);
        metricDetailsString.value.push(JSON.stringify(Object.values(Object.values(metricEntry?.[1]?.measure?.event)[0])[0], null, 2));
        
        if (metricElement === '"number"') {
            metricElements.value.push(metricElement);
            metricElementTypes.value.push('number');
        } else if (metricElement.includes('githubGQL')) {
            metricElements.value.push(metricEntry[1].measure.element)
            metricElementTypes.value.push('githubGQL');
        } else {
            metricElements.value.push(metricElement);
            metricElementTypes.value.push('json');
        }
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

function addNewMetric() {
    const isNewMetricIdDuplicated = metricEntries.value.find(metricEntry => metricEntry[0] === "DEFAULT_METRIC_NAME_" + (Object.keys(metrics.value).length + 1));
    const newMetricLabel = isNewMetricIdDuplicated ? "DEFAULT_METRIC_NAME_" + (Object.keys(metrics.value).length + 1) + "_DUPLICATED" : "DEFAULT_METRIC_NAME_" + (Object.keys(metrics.value).length + 1);
    const newMetric = {
        collector: {
            infrastructurePath: "internal.collector.events",
            endpoint: "/api/v2/computations",
            type: "POST-GET-V1",
            config: {
                "scopeManager": `${tpaEditionStore.isProductionEnvironment ? "http://bluejay-scope-manager" : "http://host.docker.internal:5700"}/api/v1/scopes/development`
            }
        },
        measure: {
            computing: "actual",
            element: "number",
            event: {
                github: {
                    events: {}
                }
            },
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
                }
            }
        }
    };

    collapsed.value.push(false);
    metrics.value[newMetricLabel] = newMetric;
    metricEntries.value.push([newMetricLabel, newMetric]);
    metricElements.value.push(JSON.stringify(newMetric.measure.element));
    metricElementTypes.value.push('number');
    metricDetailsObject.value.push({});
    metricDetailsString.value.push("{}");
    detailsMode.value.push(false);
    updateMetricsFromEntries();
}

function updateMetricsFromEntries() {
    tpaEditionStore.updateTpaField(props.fieldName, Object.fromEntries(metricEntries.value));
}

function updateMetricsFromElement(elementIndex) {
    try {
        const metricElement = metricElements.value[elementIndex];
        metricEntries.value[elementIndex][1].measure.element = typeof metricElement === "object" ? metricElement : JSON.parse(metricElement);
        updateMetricsFromEntries();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Invalid element format',
            detail: `The "element" format at metric "${metricEntries.value[elementIndex][0]}" is invalid. Please correct it and retry.`,
            life: 10000
        });

        // Reset the value to the previous one
        metricElements.value[elementIndex] = JSON.stringify(metricEntries.value[elementIndex][1].measure.element, null, 2);
    }
}

function deleteMetric(event, index) {
    event.stopPropagation();
    delete metrics.value[Object.keys(metrics.value)[index]];
    metricEntries.value.splice(index, 1);
    collapsed.value.splice(index, 1);
    metricElements.value.splice(index, 1);
    metricElementTypes.value.splice(index, 1);
    metricDetailsObject.value.splice(index, 1);
    metricDetailsString.value.splice(index, 1);
    detailsMode.value.splice(index, 1);
    updateMetricsFromEntries();
}

function openEditEventDialog(event, metricId, metricIndex) {
    showEditEventDialog.value = true;
    currentEditingMetricId.value = metricId;
    currentEditingMetricIndex.value = metricIndex;
    
    if (event && Object.keys(event).length > 0) {
        try {
            currentEditingSource.value = Object.keys(event)[0];
            const firstPropertyValue = Object.values(event)[0];
            
            if (firstPropertyValue) {
                currentEditingEndpoint.value = Object.keys(firstPropertyValue)[0];
                currentEditingFilter.value = Object.values(firstPropertyValue)[0];
            } else {
                currentEditingEndpoint.value = 'undefined';
                currentEditingFilter.value = {};
            }
        } catch (error) {
        }
    } else {
        // Handle the case where event is null or has no properties
        currentEditingEndpoint.value = 'undefined';
        currentEditingFilter.value = {};
    }
}


function confirmEventEdit() {
    if (currentEditingSource.value === 'githubGQL') {
        const defaultQuery = "query { repository(owner: \"%PROJECT.github.repository%\", name: \"%PROJECT.github.repoOwner%\") { name } }";
        currentEditingFilter.value = {
            type: "GraphQL",
            title: "Custom GraphQL query",
            steps: {
                0: {
                    type: "queryGetObject",
                    query: tpaEditionStore.unformatQueryGraphQL(defaultQuery),
                    cache: false
                }
            }
        };
    }
    
    // Merge the source, endpoint and filter into a single object
    let newEvent = {
        [currentEditingSource.value]: {
            [currentEditingEndpoint.value]: currentEditingFilter.value
        }
    };

    showEditEventDialog.value = false;
    metricEntries.value[currentEditingMetricIndex.value][1].measure.event = newEvent;
    metricDetailsObject.value[currentEditingMetricIndex.value] = currentEditingFilter.value;
    metricDetailsString.value[currentEditingMetricIndex.value] = JSON.stringify(currentEditingFilter.value, null, 2);
    updateMetricsFromEntries();
}

function updateEditedDataOnDetailsModes(metricIndex) {
    if (detailsMode.value[metricIndex] === true) {
        try {
            metricDetailsObject.value[metricIndex] = JSON.parse(metricDetailsString.value[metricIndex]);
            isInteractiveMode.value = true; // Switch to Interactive mode
        } catch (error) {
            showSwitchDetailsModeErrorDialog.value = true;
            isInteractiveMode.value = false;
            detailsMode.value[metricIndex] = false; // Switch back to Json mode
        }
    } else {
        
        for (let step of Object.values(metricDetailsObject.value[metricIndex].steps)) {
            if (step.type.includes('query')) {
                step.query = tpaEditionStore.unformatQueryGraphQL(step.query);
            }
        }
        
        metricDetailsString.value[metricIndex] = JSON.stringify(metricDetailsObject.value[metricIndex], null, 2);
        isInteractiveMode.value = false; // Switch to Json mode
    }
}

function updateMetricDetails(metricName, metricEvent, metricIndex) {
    const metricEventName = Object.keys(metricEvent)[0];
    const metricEventEndpoint = Object.keys(Object.values(metricEvent)[0])[0];
    const pathToUpdate = `${props.fieldName}[${metricName}].measure.event[${metricEventName}][${metricEventEndpoint}]`;

    try {
        const updatedValue = JSON.parse(metricDetailsString.value[metricIndex]);
        tpaEditionStore.updateTpaField(pathToUpdate, updatedValue);
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Invalid details format',
            detail: `The "details" format at metric "${metricName}" is invalid. Please correct it and retry.`,
            life: 10000
        });

        // Reset the value to the previous one
        metricDetailsString.value[metricIndex] = JSON.stringify(tpaEditionStore.getTpaField(pathToUpdate), null, 2);
    }
}

function updateMetricFilters(metricName, metricEvent, metricIndex) {
    const metricEventName = Object.keys(metricEvent)[0];
    const metricEventEndpoint = Object.keys(Object.values(metricEvent)[0])[0];
    const pathToUpdate = `${props.fieldName}[${metricName}].measure.event[${metricEventName}][${metricEventEndpoint}]`;

    try {
        const updatedValue = JSON.parse(metricDetailsString.value[metricIndex]);
        tpaEditionStore.updateTpaField(pathToUpdate, updatedValue);
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Invalid filters format',
            detail: `The "filters" format at metric "${metricName}" is invalid. Please correct it and retry.`,
            life: 10000
        });

        // Reset the value to the previous one
        metricDetailsString.value[metricIndex] = JSON.stringify(tpaEditionStore.getTpaField(pathToUpdate), null, 2);
    }
}

function showSelectWindowPanel(event) {
    event.stopPropagation();
    selectWindowOverlayPanel.value.toggle(event);
}

function computeMetric(metricData) {
    let windowComputationCopy = Object.assign({}, windowComputation.value);
    try {
        windowComputationCopy.initial = new Date(windowComputation.value.initial).toISOString();
        windowComputationCopy.end = new Date(windowComputation.value.end).toISOString();
        
        tpaEditionStore.testMetric(metricData, windowComputationCopy).then((response) => {
            window.open("http://localhost:5500" + response.data.computation, '_blank');
        }).catch((error) => {
            console.log("Error computing the metric: ", error);
        });
    } catch (error) {
        console.log("Error requesting the metric computation: ", error)
        toast.add({
            severity: 'error',
            summary: 'Invalid window computation format',
            detail: `The "window computation" format is invalid. Please correct it and retry again.`,
            life: 10000
        });
    }
}

async function changeElementType(metricIndex) {
    changingElementType.value = true;
    const currentElementType = metricElementTypes.value[metricIndex];
    let newElementValue = '"number"';

    if (currentElementType === 'number') {
        // Do nothing because the default value is already set
    } else if (currentElementType === 'githubGQL') {
        try {
            const defaultQuery = "query { repository(owner: \"%PROJECT.github.repository%\", name: \"%PROJECT.github.repoOwner%\") { name } }";
            const formattedQuery = await tpaEditionStore.formatQueryGraphQL(defaultQuery);
        
            newElementValue = {
                count: {
                    related: {
                        githubGQL: {
                            custom: {
                                type: "GraphQL",
                                title: "Custom GraphQL query",
                                steps: {
                                    0: {
                                        type: "queryGetObject",
                                        query: formattedQuery,
                                        cache: false
                                    }
                                }
                            }
                        }
                    }
                }
            };
        } catch (error) {
            console.log("Error formatting the default query: ", error);
        }
    } else {
        newElementValue = JSON.stringify({
            count: {
                related: {
                    github: {
                        events: {}
                    }
                }
            }
        }, null, 2);
    }

    metricElements.value[metricIndex] = newElementValue;
    updateMetricsFromElement(metricIndex);
    changingElementType.value = false;
}
</script>

<template>
    <DataView :value="metricEntries" dataKey="id">
        <template #list="slotProps">

            <Fieldset :legend="slotProps.data[0]" :toggleable="true" :collapsed="collapsed[slotProps.index]" @toggle="collapsed[slotProps.index] = !collapsed[slotProps.index]" :id="slotProps.data[0]">
                
                <template #legend>
                    <div class="flex align-items-center gap-2 metric-legend">
                        {{  slotProps.data[0] }}
                        <Tag v-if="metricEntries.filter(metric => metric[0] === slotProps.data[0]).length > 1" severity="warning" class="pi pi-exclamation-triangle" title="This metric ID is duplicated and only the last one will be persisted!" />
                        <Button class="p-button-text" aria-label="playMetric" icon="pi pi-play" severity="success" @click="showSelectWindowPanel($event)" />

                        <OverlayPanel ref="selectWindowOverlayPanel">
                            <div class="flex flex-column gap-4">
                                <div class="flex gap-3">
                                    <div class="flex flex-column gap-2">
                                        <label for="windowPeriod">Period</label>
                                        <Dropdown class="editDropdown" :options="tpaEditionStore.WINDOW_PERIOD_OPTIONS" v-model="windowComputation.period" optionLabel="label" optionValue="value" placeholder="Select a period" inputId="windowPeriod" />
                                    </div>
                                    <div class="flex flex-column gap-2">
                                        <label for="windowInitial">Initial</label>
                                        <Calendar v-model="windowComputation.initial" inputId="windowInitial" placeholder="Select an initial date" />
                                    </div>
                                    <div class="flex flex-column gap-2">
                                        <label for="windowEnd">End</label>
                                        <Calendar v-model="windowComputation.end" inputId="windowEnd" placeholder="Select an end date" />
                                    </div>
                                </div>
                                <Button label="Compute metric" aria-label="computeMetric" click="computeMetric(slotProps.data[1])" />
                            </div>
                        </OverlayPanel>
                        <Button v-if="tpaEditMode" class="p-button-text" aria-label="deleteMetric" icon="pi pi-trash" severity="danger" @click="deleteMetric($event, slotProps.index)" />
                    </div>
                </template>

                <div class="flex flex-column align-items-start gap-3">

                    <div v-if="tpaEditMode" class="flex align-items-center gap-2 w-full">
                        <i class="pi pi-file-edit"></i>
                        <span class="font-semibold">Id:</span>
                        <InputText type="text" v-model="slotProps.data[0]" @change="updateMetricsFromEntries" class="w-full" />
                    </div>
                    
                    <span class="flex flex-column gap-2 w-full">
                        <span class="flex align-items-center gap-2">
                            <i class="pi pi-file"></i>
                            <b>Element:</b>
                            <Dropdown class="editDropdown w-full" :options="tpaEditionStore.COLLECTOR_ELEMENT_TYPES" v-model="metricElementTypes[slotProps.index]" placeholder="Select an element type" optionLabel="label" optionValue="value"  @change="changeElementType(slotProps.index)" :disabled="!tpaEditMode" />
                        </span>
                        <div>
                            <div v-if="metricElementTypes[slotProps.index] === 'githubGQL' && !changingElementType" @focusout="updateMetricsFromElement(slotProps.index)">
                                <StepDisplay :data="metricElements[slotProps.index].count.related.githubGQL.custom" :fieldName="props.fieldName + '[' + slotProps.data[0] + ']' + '.measure.element.count.related'" />
                            </div>
                            <div v-if="tpaEditMode" @focusout="updateMetricsFromElement(slotProps.index)">
                                <template v-if="metricElementTypes[slotProps.index] === 'json' && !changingElementType">
                                    <CodeEditor width="100%" :wrap="true" v-model="metricElements[slotProps.index]" :languages="[['json', 'JSON']]" :theme="appThemeStore.isDarkModeOn ? 'github-dark' : 'github'" :key="slotProps.data[0]" />
                                </template>
                            </div>
                            <div v-else>
                                <template v-if="metricElementTypes[slotProps.index] === 'json' && !changingElementType">
                                    <CodeEditor width="100%" :wrap="true" v-model="metricElements[slotProps.index]" :readOnly="true" :languages="[['json', 'JSON']]" :theme="appThemeStore.isDarkModeOn ? 'github-dark' : 'github'" :key="slotProps.data[0] + slotProps.index" />
                                </template>
                            </div>
                        </div>
                    </span>

                    <span class="flex flex-wrap align-items-center gap-2">
                        <i class="pi pi-megaphone"></i>
                        <b>Event:</b>
                        <div @click="openEditEventDialog(slotProps.data[1].measure.event, slotProps.data[0], slotProps.index)" class="flex align-items-center gap-2">
                            <Tag v-if="Object.keys(slotProps.data[1].measure.event)?.length === 0" severity="warning">No details</Tag>
                            <div v-else style="cursor: pointer;">
                                <Tag :class="tpaEditMode && 'cursor-pointer'"
                                    :severity="tpaEditionStore.COLLECTOR_EVENT_SOURCES.includes(Object.keys(slotProps.data[1].measure.event)?.[0]) ? 'success' : 'warning'">
                                    {{ Object.keys(slotProps.data[1].measure.event)?.[0] }} 
                                </Tag>
                                {{  Object.keys(Object.values(slotProps.data[1].measure.event)?.[0])?.[0] ? '&rarr;' : '' }}
                                <Tag v-if="Object.keys(Object.values(slotProps.data[1].measure.event)?.[0])?.[0]" :class="tpaEditMode && 'cursor-pointer'"
                                    :severity="tpaEditionStore.COLLECTOR_EVENT_ENDPOINTS?.[Object.keys(slotProps.data[1].measure.event)?.[0]]?.includes(Object.keys(Object.values(slotProps.data[1].measure.event)?.[0])?.[0]) ? 'success' : 'warning'">
                                    {{ Object.keys(Object.values(slotProps.data[1].measure.event)?.[0])?.[0] }}
                                </Tag>
                            </div>
                            <Button v-if="tpaEditMode" icon="pi pi-pencil" aria-label="editMetric" class="p-button-warning p-button-text" />
                        </div>
                    </span>
                    
                    <span class="flex flex-column gap-2 w-full">
                        <span class="flex align-items-center gap-2">
                            <i class="pi pi-align-left"></i>
                            <template v-if="slotProps.data[1].measure.event.githubGQL">
                                <b>Details mode:</b>
                                <ToggleButton v-model="detailsMode[slotProps.index]" onLabel="Interactive" offLabel="Json" onIcon="pi pi-desktop" offIcon="pi pi-file-edit" @change="updateEditedDataOnDetailsModes(slotProps.index)" />
                            </template>
                            <template v-else>
                                <b>Filters:</b>
                            </template>
                        </span>

                        <div>
                            <template v-if="tpaEditMode">
                                <template v-if="slotProps.data[1].measure.event.githubGQL">
                                    <StepDisplay v-if="isInteractiveMode" :data="metricDetailsObject[slotProps.index]" :fieldName="props.fieldName + '[' + slotProps.data[0] + ']' + '.measure.event'" />
                                    <div v-else @focusout="updateMetricDetails(slotProps.data[0], slotProps.data[1].measure.event, slotProps.index)" >
                                        <CodeEditor width="100%" :wrap="true" v-model="metricDetailsString[slotProps.index]" :languages="[['json', 'JSON']]" :theme="appThemeStore.isDarkModeOn ? 'github-dark' : 'github'" :key="slotProps.data[0] + slotProps.index" />
                                    </div>
                                </template>
                                <div v-else @focusout="updateMetricFilters(slotProps.data[0], slotProps.data[1].measure.event, slotProps.index)" >
                                    <CodeEditor width="100%" :wrap="true" v-model="metricDetailsString[slotProps.index]" :languages="[['json', 'JSON']]" :theme="appThemeStore.isDarkModeOn ? 'github-dark' : 'github'" :key="slotProps.data[0] + slotProps.index" />
                                </div>
                            </template>
                            <template v-else>
                                <StepDisplay v-if="isInteractiveMode" :data="metricDetailsObject[slotProps.index]" />
                                <CodeEditor v-else width="100%" :wrap="true" v-model="metricDetailsString[slotProps.index]" :readOnly="true" :languages="[['json', 'JSON']]" :theme="appThemeStore.isDarkModeOn ? 'github-dark' : 'github'" :key="slotProps.data[0] + slotProps.index" />
                            </template>
                        </div>
                    </span>
                    
                </div>
            </Fieldset>
        </template>
        
        <template #footer v-if="tpaEditMode">
            <Button label="Add new metric" aria-label="addMetric" icon="pi pi-plus" @click="addNewMetric" />
        </template>
    </DataView>

    <Dialog v-model:visible="showEditEventDialog" header="Edit event" modal :draggable="false" :closable="false" :dismissableMask="true" :breakpoints="{ '960px': '75svw'}" style="width: 40svw">
        <template #header>
            <h2 class="mb-0 font-bold">Edit event</h2>
        </template>
        
        <div class="flex justify-content-between gap-5 mb-1">
            <div class="flex-1">
                <p class="mb-1"><b>Source</b></p>
                <Dropdown v-if="tpaEditMode" class="editDropdown w-full" :options="tpaEditionStore.COLLECTOR_EVENT_SOURCES" v-model="currentEditingSource" placeholder="Select a source" />
            </div>
            <div class="flex-1">
                <p class="mb-1"><b>Endpoint</b></p>
                <Dropdown v-if="tpaEditMode" class="editDropdown w-full" :options="tpaEditionStore.COLLECTOR_EVENT_ENDPOINTS?.[currentEditingSource]" v-model="currentEditingEndpoint" placeholder="Enter an endpoint" />
            </div>
        </div>
        
        <template #footer>
            <div class="flex justify-content-end">
                <Button icon="pi pi-check" label="Save" aria-label="save" severity="success" @click="confirmEventEdit" :disabled="!(currentEditingSource && currentEditingEndpoint && tpaEditionStore.COLLECTOR_EVENT_ENDPOINTS?.[currentEditingSource] && tpaEditionStore.COLLECTOR_EVENT_ENDPOINTS?.[currentEditingSource].includes(currentEditingEndpoint))" />
                <Button icon="pi pi-times" label="Cancel" aria-label="cancel" severity="danger" @click="showEditEventDialog = false" />
            </div>
        </template>
    </Dialog>

    <Dialog v-model:visible="showSwitchDetailsModeErrorDialog" header="Error" modal :draggable="false" :closable="false" :breakpoints="{ '960px': '75svw'}" style="width: 30svw">
        <template #header>
            <h2 class="mb-0 font-bold">Error</h2>
        </template>

        <p class="mb-3">Switching to JSON mode is not possible due to invalid JSON content.</p>
        <p>Please correct the error and retry.</p>

        <template #footer>
            <div class="flex justify-content-end">
                <Button label="Ok" severity="success" @click="showSwitchDetailsModeErrorDialog = false" />
            </div>
        </template> 
    </Dialog>


</template>

<style>
    .p-fieldset.p-fieldset-toggleable .p-fieldset-legend a:has(.metric-legend) {
        padding: 0.75rem;
    }
</style>