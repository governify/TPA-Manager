<script setup>
import { ref, onMounted, onUnmounted, onBeforeUnmount } from 'vue'
import { useToast } from "primevue/usetoast";
import NavMenu from '@/components/NavMenu.vue';
import Divider from 'primevue/divider';
import { bluejayInfraStore } from '@/stores/bluejayInfra';
import { useRoute, useRouter } from 'vue-router';
import Dashboard from '@/components/Dashboard.vue';
import Guarantees from '@/components/Guarantees.vue';
import Metrics from '@/components/Metrics.vue';
import { useTPAMode } from '@/utils/tpaMode.js';
import Button from 'primevue/button';
import Panel from 'primevue/panel';
import axios from 'axios';
import ProgressSpinner from 'primevue/progressspinner';
import Fieldset from 'primevue/fieldset';
import { useTpaEditionStore } from '@/stores/tpaEdition';
import { storeToRefs } from 'pinia';
import { useConfirm } from "primevue/useconfirm";
import ConfirmPopup from 'primevue/confirmpopup';
import ToggleButton from 'primevue/togglebutton';
import InputSwitch from 'primevue/inputswitch';
import InputText from 'primevue/inputtext';

const route = useRoute();
const router = useRouter();
const bluejayInfra = bluejayInfraStore();
const toast = useToast();
const confirm = useConfirm();
const isMobile = ref(window.innerWidth <= 768);
const loading = ref(true);
const expandedDashboardBlocks = ref(false);
const expandedGuarantees = ref(false);
const expandedMetrics = ref(false);
const dashboardBlocks = ref();
const guarantees = ref();
const metrics = ref();
const templatesURL = `${bluejayInfra.REGISTRY_URL}/api/v6/templates`;
const coursesURL = bluejayInfra.SCOPE_MANAGER_URL + '/api/v1/scopes/development/courses';
const template = ref({});
const templateId = route.params.templateId;
const tpaEditionStore = useTpaEditionStore();
const { originalTpa, modifiedTpa, discardButtonClicked } = storeToRefs(tpaEditionStore);
const { isProductionEnvironment } = storeToRefs(tpaEditionStore);
const { tpaEditMode } = useTPAMode();
const onlyVisualize = ref(false);

const updateIsMobile = () => {
    isMobile.value = window.innerWidth <= 768;
};
onMounted(() => {
    getTemplate();
    window.addEventListener('resize', updateIsMobile);
});
onUnmounted(() => {
    window.removeEventListener('resize', updateIsMobile);
});
function handlePageUnload(event) {
    if (!discardButtonClicked.value && originalTpa.value && modifiedTpa.value && JSON.stringify(originalTpa.value) !== JSON.stringify(modifiedTpa.value)) {
        event.returnValue = 'There are unsaved changes. Are you sure you want to leave?';
        // Web apps cannot prevent the user from leaving the page.
        // All we can do is warn them to save their work if they want to.
        // Also, the browser will show a generic message, so we can't customize it.
    }
};

// Attach the event listener when the component is mounted
window.addEventListener('beforeunload', handlePageUnload);
onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', handlePageUnload);
});

async function getTemplate() {
    await axios.get(templatesURL + `/${templateId}`)
        .then(async (response) => {
            template.value = response.data;
            tpaEditionStore.setInitialTpaData(template.value);
            checkTemplateBeingUsed();
        })
        .catch(error => {
            toast.add({ severity: 'error', summary: 'Error', detail: error.response.data.error, life: 3000 });
        });
    loading.value = false;

}
async function checkTemplateBeingUsed() {
    let courses = [];
    await axios.get(coursesURL, {
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(async (response) => {
        courses = response.data.scope.sort((a, b) => a.classId.localeCompare(b.classId));
        const coursesWithTPAtemplate = courses.filter(course => course.templateId === templateId);
        if (coursesWithTPAtemplate.length > 0) {
            onlyVisualize.value = true;
            tpaEditMode.value = false;
            toast.add({ severity: 'info', summary: 'Info', detail: 'This TPA is being used in a course. You can only read it.', life: 5000 });
        }
    })
        .catch(error => {
            console.log('Error: ', error);
        });
}

function confirmSaveTpaChanges(event) {
    confirm.require({
        target: event.currentTarget,
        message: 'Do you wish to save the current changes?',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
            tpaEditionStore.saveTpaChanges('template').then(() => {
                router.push({ name: 'templates-management' });
                toast.add({ severity: 'success', summary: 'Confirmed', detail: 'Changes saved!', life: 3000 });
            }).catch(error => {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Changes could not be saved.', life: 3000 });
            });
        }
    });
}

function confirmDiscardTpaChanges(event) {
    confirm.require({
        target: event.currentTarget,
        message: 'Are you sure you want to discard the current changes?',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
            tpaEditionStore.discardTpaChanges().catch(error => {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Changes could not be discarded.', life: 3000 });
            });
        }
    });
}

function updateLocalStorageEnvironment() {
    localStorage.setItem('isProductionEnvironment', isProductionEnvironment.value);
}
function toggleExpandedDashboardBlocks() {
    expandedDashboardBlocks.value ? dashboardBlocks.value.expandAll() : dashboardBlocks.value.collapseAll();
}

function toggleExpandedGuarantees() {
    expandedGuarantees.value ? guarantees.value.expandAll() : guarantees.value.collapseAll();
}

function toggleExpandedMetrics() {
    expandedMetrics.value ? metrics.value.expandAll() : metrics.value.collapseAll();
}

function expandAll() {
    expandedDashboardBlocks.value = true;
    expandedGuarantees.value = true;
    expandedMetrics.value = true;
    dashboardBlocks.value.expandAll();
    guarantees.value.expandAll();
    metrics.value.expandAll();
}

function collapseAll() {
    expandedDashboardBlocks.value = false;
    expandedGuarantees.value = false;
    expandedMetrics.value = false;
    dashboardBlocks.value.collapseAll();
    guarantees.value.collapseAll();
    metrics.value.collapseAll();
}

const openCatalogue = () => {
    const routePath = router.resolve({ name: 'catalogue' });
    window.open(routePath.href, '_blank');
};
</script>
<template>
    <div style="display: grid; justify-items: center;">
        <div class="card ">
            <NavMenu />
            <Divider layout="horizontal" />
            <Panel header="TPA Information" aria-label="TPAInfo" toggleable collapsed>
                <div class="content">
                    <p>A TPA is a document that describes the practices a team should follow during the development of a
                        project
                        and it is comprised of several elements such as the following:</p>
                    <ul>
                        <li><b>Guarantees:</b> The guarantees that the team will provide to the client.</li>
                        <li><b>Metrics:</b> The metrics that will be used to evaluate the fulfillment of those
                            guarantees.
                        </li>
                        <li><b>Dashboards:</b> The dashboards that will be used to visualize the fulfillment of the
                            guarantees.
                        </li>
                        <li><b>Extra information:</b> The extra information that will be used to complement the TPA
                            (context,
                            scopes, infrastructure settings...).</li>
                    </ul>

                    <p>The TPA Designer allows you to create and edit TPAs in a visual way, and then export them to a
                        JSON
                        file
                        that can be used by the <a href="https://www.governify.io/" target="_blank">Governify
                            platform <img src="/governify.ico" width="20" height="20"
                            alt="governify-img" loading="lazy" />  </a>.
                    </p>
                    <p><a href="https://github.com/governify" target="_blank">Governify</a> also provides a <a
                            href="https://github.com/governify/governify-examples/tree/master/metrics"
                            target="_blank">catalogue
                            of TPs</a>
                        and <a href="https://github.com/governify/governify-examples/tree/master/TPAs"
                            target="_blank">TPAs</a>
                        that can be used for reference as a starting point.
                        This catalogue can also be consulted inside the TPA Designer by clicking the button below.</p>
                    <div class="flex justify-content-center">
                        <Button aria-label="open-catalogue" class="mr-3 mb-3" label="Catalogue" icon="pi pi-book"
                            severity="secondary" @click="openCatalogue" />
                    </div>
                    <p>
                        This tool has been developed following the guidelines of the <a
                            href="https://docs.governify.io/about/iAgree" target="_blank">iAgree Syntax (version
                            5.2)</a>.
                        Also, you can check out the <a href="https://docs.governify.io/about/iAgree#examples"
                            target="_blank">documentation</a> for more info on how TPAs are modeled.
                    </p>
                </div>
            </Panel>
            <Fieldset legend="Control Panel" style="width: 20%;">
                <ConfirmPopup></ConfirmPopup>
                <div style="display: flex; justify-content: center; flex-direction: column;">
                    <div class="buttons">
                        <template v-if="tpaEditMode">
                            <Button aria-label="confirm-changes" icon="pi pi-save"
                                @click="confirmSaveTpaChanges($event)" v-tooltip.left="'Save changes'" :pt="{
                                root: { class: 'bg-green-400 border-green-400 hover:bg-green-600 hover:border-green-600' }
                            }" />
                            <Button aria-label="discard-changes" icon="pi pi-times" @click="confirmDiscardTpaChanges"
                                v-tooltip.bottom="'Discard changes'" :pt="{
                                root: { class: 'bg-red-400 border-red-400 hover:bg-red-600 hover:border-red-600' }
                            }" />
                        </template>
                        <Button aria-label="collapseAll" icon="pi pi-angle-double-up" @click="collapseAll"
                            style="grid-area: collapseAll;" v-tooltip.bottom="'Collapse all'" outlined />
                        <Button aria-label="expandAll" icon="pi pi-angle-double-down" @click="expandAll"
                            style="grid-area: expandAll;" v-tooltip.top="'Expand all'" outlined />
                        <a :href="bluejayInfra.REGISTRY_URL + '/api/v6/templates/' + templateId" target="_blank"
                            style="grid-area: viewTpaJson;">
                            <Button aria-label="view-tpa-in-json" class="view-tpa-button"
                                v-tooltip.right="'View TPA in JSON'">
                                <template #icon>
                                    <img src="/json.svg" alt="View TPA in JSON" width="20" height="20" />
                                </template>
                            </Button>
                        </a>
                        <div v-if="!onlyVisualize && !isMobile" class="flex align-items-center gap-1">
                            <img v-tooltip.bottom="'Read mode'" alt="Read mode" :src="'/tpa-read.svg'" width="30" height="30" />
                            <InputSwitch v-model="tpaEditMode" aria-label="toggleEditMode" :pt="{
                                slider: ({ props }) => ({
                                    class: props.modelValue ? 'bg-green-400' : 'bg-gray-300'
                                })
                            }" />
                            <img v-tooltip.bottom="'Edit mode'" alt="Edit mode" :src="'/tpa-edit.svg'" width="30" height="30" />
                        </div>
                        <img v-if="onlyVisualize" v-tooltip.bottom="'Read mode'" alt="Read mode" :src="'/tpa-read.svg'"
                            width="30" />
                    </div>
                    <div>
                        <div v-if="!onlyVisualize && isMobile"
                            class="flex align-items-center gap-1 justify-content-center mt-2">
                            <img v-tooltip.bottom="'Read mode'" alt="Read mode" :src="'/tpa-read.svg'" width="30" />
                            <InputSwitch v-model="tpaEditMode" aria-label="toggleEditMode" :pt="{
                                slider: ({ props }) => ({
                                    class: props.modelValue ? 'bg-green-400' : 'bg-gray-300'
                                })
                            }" />
                            <img v-tooltip.bottom="'Edit mode'" alt="Edit mode" :src="'/tpa-edit.svg'" width="30" />
                        </div>
                    </div>
                    <ToggleButton v-if="tpaEditMode" id="selectEnvironmentButton"
                        v-model="tpaEditionStore.isProductionEnvironment" v-tooltip="'Change environment'"
                        onLabel="Production environment" offLabel="Development environment" onIcon="pi pi-cloud"
                        offIcon="pi pi-cog" @click="updateLocalStorageEnvironment" style="margin-top: 5px;" />
                </div>
            </Fieldset>
            <div v-if="loading" class="flex flex-column m-5">
                <ProgressSpinner class="text-center" strokeWidth="4" />
                <h3 class="text-center">Loading...</h3>
            </div>
            <div class="content" v-else>
                <Divider v-if="tpaEditMode" layout="horizontal" />
                <div v-if="tpaEditMode" class="flex flex-column">
                    <h4>Change TPA Template id</h4>
                    <p style="color: #8e8e8e;font-size: 15px !important;"  >Example id: template-my-string-example-v1-0-0</p>
                    <InputText v-model="tpaEditionStore.modifiedTpa.id" :aria-label="tpaEditionStore.modifiedTpa.id" :class="isMobile ? 'w-full' : 'w-3'"
                        autofocus="true" />
                </div>
                <Divider layout="horizontal" />
                <div class="flex align-items-center gap-2">
                    <h2>Dashboard blocks</h2>
                    <ToggleButton class="expandButton" v-model="expandedDashboardBlocks"
                        @click="toggleExpandedDashboardBlocks" onLabel="" offLabel="" onIcon="pi pi-angle-down"
                        offIcon="pi pi-angle-right" />
                </div>
                <Dashboard ref="dashboardBlocks" fieldName="context.definitions.dashboards.main.config"
                    :key="template.context.definitions.dashboards.main.config" />


                <Divider layout="horizontal" />

                <div class="flex align-items-baseline gap-2">
                    <h2>Metrics</h2>
                    <ToggleButton class="expandButton" v-model="expandedMetrics" @click="toggleExpandedMetrics"
                        onLabel="" offLabel="" onIcon="pi pi-angle-down" offIcon="pi pi-angle-right" />
                </div>
                <Metrics ref="metrics" fieldName="terms.metrics" :key="template.terms.metrics" />
                <Divider layout="horizontal" />

                <div class="flex align-items-baseline gap-2">
                    <h2>Guarantees</h2>
                    <ToggleButton class="expandButton" v-model="expandedGuarantees" @click="toggleExpandedGuarantees"
                        onLabel="" offLabel="" onIcon="pi pi-angle-down" offIcon="pi pi-angle-right" />
                </div>
                <Guarantees ref="guarantees" fieldName="terms.guarantees" :key="template.terms.guarantees" />
            </div>
        </div>
    </div>
</template>

<style scoped>


.buttons {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 5px;
}

.view-tpa-button {
    border: 1px solid #505050;
    background-color: #ffffff;
}

.view-tpa-button:hover {
    background-color: #f0f0f0;
    border: 1px solid black !important;
}
</style>