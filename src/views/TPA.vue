<script setup>
import { ref, onMounted, onUnmounted, onBeforeUnmount } from 'vue'
import { useToast } from "primevue/usetoast";
import NavMenu from '@/components/NavMenu.vue';
import Divider from 'primevue/divider';
import { bluejayInfraStore } from '@/stores/bluejayInfra';
import { useRoute } from 'vue-router';
import Scope from '@/components/Scope.vue';
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
import Dialog from 'primevue/dialog';
import RadioButton from 'primevue/radiobutton';
import InputText from 'primevue/inputtext';
import InlineMessage from 'primevue/inlinemessage';


const tpaEditionStore = useTpaEditionStore();
const displaySaveChanges = ref(false);
const { originalTpa, modifiedTpa, discardButtonClicked } = storeToRefs(tpaEditionStore);
const { isProductionEnvironment } = storeToRefs(tpaEditionStore);
const { tpaEditMode } = useTPAMode();
const route = useRoute();
const bluejayInfra = bluejayInfraStore();
const toast = useToast();
const confirm = useConfirm();
const projectId = route.params.projectId;
const isMobile = ref(window.innerWidth <= 768);
const agreementURL = `${bluejayInfra.REGISTRY_URL}/api/v6/agreements/tpa-${projectId}`;
const agreement = ref({});
const loading = ref(true);
const expandedDashboardBlocks = ref(false);
const expandedGuarantees = ref(false);
const expandedMetrics = ref(false);
const dashboardBlocks = ref();
const guarantees = ref();
const metrics = ref();
const newTemplateVersion = ref('');
const authorization = ref('');
const exampleVersion = ref('');

const updateIsMobile = () => {
    isMobile.value = window.innerWidth <= 768;
};
onMounted(async () => {
    await getTpa();
    if (localStorage.getItem('auth')) {
        authorization.value = localStorage.getItem('auth');
    }
    window.addEventListener('resize', updateIsMobile);
});
onUnmounted(() => {
    window.removeEventListener('resize', updateIsMobile);
});
function handlePageUnload(event) {
    if (saveOption.value === 'one-tpa' && !discardButtonClicked.value && originalTpa.value && modifiedTpa.value && JSON.stringify(originalTpa.value) !== JSON.stringify(modifiedTpa.value)) {
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

async function createExampleVersion(templateId) {
    if (templateId) {
        const versionRegex = /v(\d+)-(\d+)-(\d+)/;
        const match = templateId.match(versionRegex);
        if (match && match.length >= 4) {
            const major = parseInt(match[1], 10);
            const minor = parseInt(match[2], 10);
            const patch = parseInt(match[3], 10);
            const newMajor = major + 1;
            const newTemplateId = templateId.replace(versionRegex, `v${newMajor}-${minor}-${patch}`);
            exampleVersion.value = newTemplateId;
        }
    }
}
async function getTpa() {
    await axios.get(agreementURL, {
        headers: {
            'Content-Type': 'application/json',
        }
    }).then(async (response) => {
        agreement.value = response.data;
        tpaEditionStore.setInitialTpaData(agreement.value);
        createExampleVersion(agreement.value.templateId);
    })
        .catch(error => {
            console.log("Error: ", error);
            toast.add({ severity: 'error', summary: 'Error', detail: 'Error fetching agreement' });
        });
    loading.value = false;
}
const saveOption = ref('');
const loadingChanges = ref(false);

async function saveTpaChanges() {
    tpaEditionStore.saveTpaChanges('agreement').then(() => {
        toast.add({ severity: 'success', summary: 'Confirmed', detail: 'Changes saved!', life: 3000 });
    }).catch(error => {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Changes could not be saved.', life: 3000 });
    });
}
async function saveTpasChanges() {
    if (agreement.value.templateId) {
        tpaEditionStore.saveTpasChanges(newTemplateVersion.value, authorization).then(() => {
            setTimeout(() => {
                loadingChanges.value = false;
                displaySaveChanges.value = false;
                window.location.reload();
            }, 3000);
            toast.add({ severity: 'success', summary: 'Confirmed', detail: 'Changes saved!', life: 3000 });
        }).catch(error => {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Changes could not be saved.', life: 3000 });
        });
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Template ID not found in agreement.', life: 3000 });
    }

}

function handleSaveChanges() {
    if (saveOption.value === 'all-tpas') {
        const isVersionValid = validateVersion();
        if (!isVersionValid) return;
        loadingChanges.value = true;
        saveTpasChanges();
    } else {
        saveTpaChanges();
    }
}

function validateVersion() {
    const baseRegex = /^template-(.+?)-v(\d+)-(\d+)-(\d+)$/;
    const currentMatch = agreement.value.templateId.match(baseRegex);
    const newMatch = newTemplateVersion.value.match(baseRegex);
    if (!newMatch) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Invalid format for the template version.', life: 3000 });
        return false;
    }

    if (newMatch[1] !== currentMatch[1]) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'You can\'t change name, only update the version.', life: 3000 });
        return false;
    }
    const newVersionNumbers = newMatch.slice(2, 5).map(Number);
    const currentVersionNumbers = currentMatch.slice(2, 5).map(Number);
    const isVersionIncreased = newVersionNumbers.some((num, idx) => num > currentVersionNumbers[idx]);
    if (!isVersionIncreased) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'At least one part of the version number must be greater.', life: 3000 });
        return false;
    }
    return true;
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
                            platform <img src="/governify.ico" width="20" height="20" alt="governify-img"
                                loading="lazy" /> </a>.
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
                        <Button class="mr-3 mb-3" label="Catalogue" icon="pi pi-book" severity="secondary"
                            @click="$router.push({ name: 'catalogue' })" />
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
                            <Button icon="pi pi-save" @click="displaySaveChanges = true" v-tooltip.left="'Save changes'"
                                :pt="{
                                root: { class: 'bg-green-400 border-green-400 hover:bg-green-600 hover:border-green-600' }
                            }" />
                            <Dialog v-model:visible="displaySaveChanges" header="Save TPA changes" modal>
                                <span class="p-text-secondary block mb-3">Choose your save option:</span>
                                <div class="flex flex-column  gap-3 mb-3" style="width: 300px;">
                                    <div>
                                        <RadioButton id="one-tpa" value="one-tpa" v-model="saveOption"
                                            label="This TPA" /> <label for="one-tpa">This TPA</label>
                                    </div>
                                    <div>
                                        <RadioButton id="all-tpas" value="all-tpas" v-model="saveOption"
                                            label="All course TPAs" /> <label for="all-tpas">All course TPAs</label>
                                    </div>

                                    <div v-if="saveOption === 'all-tpas'">
                                        <span class="p-text-secondary block mb-3">Current template version:</span>
                                        <span class="p-text-secondary text-center block mb-3"> {{ agreement.templateId ?
                                agreement.templateId : 'no-templateId found' }}</span>
                                        <InlineMessage class="mb-2" severity="warn">New version must be above current
                                        </InlineMessage>
                                        <label for="new-version" class="p-text-secondary block mb-3">New template
                                            version:</label>
                                        <p>Example: {{ exampleVersion }}</p>
                                        <InputText class="w-full" id="new-version" v-model="newTemplateVersion" />
                                    </div>
                                </div>
                                <div class="flex justify-content-center gap-2" style="margin-bottom: 10px;">
                                    <Button :label="loadingChanges && saveOption === 'all-tpas' ? '' : 'Save'"
                                        @click="handleSaveChanges"
                                        :disabled="loadingChanges && saveOption === 'all-tpas'"
                                        class="bg-green-400 border-green-400 hover:bg-green-600 hover:border-green-600">
                                        <template v-if="loadingChanges && saveOption === 'all-tpas'">
                                            <i class="pi pi-spin pi-spinner"></i>
                                        </template>
                                    </Button>
                                    <Button label="Cancel" @click="displaySaveChanges = false"
                                        :pt="{ root: { class: 'bg-red-400 border-red-400 hover:bg-red-600 hover:border-red-600' } }" />
                                </div>
                            </Dialog>
                            <Button title="Discard changes" icon="pi pi-times" @click="confirmDiscardTpaChanges"
                                v-tooltip.bottom="'Discard changes'" :pt="{
                                root: { class: 'bg-red-400 border-red-400 hover:bg-red-600 hover:border-red-600' }
                            }" />
                        </template>
                        <Button icon="pi pi-angle-double-up" @click="collapseAll" style="grid-area: collapseAll;"
                            v-tooltip.bottom="'Collapse all'" outlined />
                        <Button icon="pi pi-angle-double-down" @click="expandAll" style="grid-area: expandAll;"
                            v-tooltip.top="'Expand all'" outlined />
                        <a :href="bluejayInfra.REGISTRY_URL + '/api/v6/agreements/tpa-' + projectId" target="_blank"
                            style="grid-area: viewTpaJson;">
                            <Button class="view-tpa-button" v-tooltip.right="'View TPA in JSON'">
                                <template #icon>
                                    <img src="/json.svg" alt="View TPA in JSON" width="20" height="20" />
                                </template>
                            </Button>
                        </a>
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

                <div>
                    <h2>Scope</h2>
                    <Scope fieldName="context.definitions.scopes.development"
                        :key="agreement.context.definitions.scopes.development" />
                </div>
                <Divider layout="horizontal" />
                <div>
                    <div class="flex align-items-center gap-2">
                        <h2>Dashboard blocks</h2>
                        <ToggleButton class="expandButton" v-model="expandedDashboardBlocks"
                            @click="toggleExpandedDashboardBlocks" onLabel="" offLabel="" onIcon="pi pi-angle-down"
                            offIcon="pi pi-angle-right" />
                    </div>
                    <Dashboard ref="dashboardBlocks" fieldName="context.definitions.dashboards.main.config"
                        :key="agreement.context.definitions.dashboards.main.config" />
                </div>
                <Divider layout="horizontal" />

                <div>
                    <div class="flex align-items-baseline gap-2">
                        <h2>Metrics</h2>
                        <ToggleButton class="expandButton" v-model="expandedMetrics" @click="toggleExpandedMetrics"
                            onLabel="" offLabel="" onIcon="pi pi-angle-down" offIcon="pi pi-angle-right" />
                    </div>
                    <Metrics ref="metrics" fieldName="terms.metrics" :key="agreement.terms.metrics" />
                </div>
                <Divider layout="horizontal" />

                <div>
                    <div class="flex align-items-baseline gap-2">
                        <h2>Guarantees</h2>
                        <ToggleButton class="expandButton" v-model="expandedGuarantees"
                            @click="toggleExpandedGuarantees" onLabel="" offLabel="" onIcon="pi pi-angle-down"
                            offIcon="pi pi-angle-right" />
                    </div>
                    <Guarantees ref="guarantees" fieldName="terms.guarantees" :key="agreement.terms.guarantees" />
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>

.buttons {
    display: flex;
    justify-content: center;
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