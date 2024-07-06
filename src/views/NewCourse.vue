<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useToast } from "primevue/usetoast";
import NavMenu from '@/components/NavMenu.vue';
import Divider from 'primevue/divider';
import { bluejayInfraStore } from '@/stores/bluejayInfra';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import axios from 'axios';
import Dialog from 'primevue/dialog';
import InputSwitch from 'primevue/inputswitch';
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import InlineMessage from 'primevue/inlinemessage'
import ProgressSpinner from 'primevue/progressspinner';
import { useRouter } from 'vue-router';

const router = useRouter();
const bluejayInfra = bluejayInfraStore();
const toast = useToast();
const isMobile = ref(window.innerWidth <= 768);
const new_course = ref({
    "classId": "",
    "templateId": null,
    "autoRun": false,
    "hidden": false,
    "joinCode": "",
    "identities": [],
    "credentials": [],
    "projects": []
});
const authorization = computed(() => localStorage.getItem('auth'));
const templates = ref([]);
const jsonInput = ref();
const visible_addIdentities = ref(false);
const visible_addCredentials = ref(false);
const templatesURL = bluejayInfra.REGISTRY_URL + "/api/v6/templates";
const scopesURL = bluejayInfra.SCOPE_MANAGER_URL + "/api/v1/scopes/development/courses";
const loading = ref(true);
const updateIsMobile = () => {
    isMobile.value = window.innerWidth <= 768;
};

const isCreateDisabled = computed(() => templates.value.length === 0);

onMounted(() => {
    getTemplates();
    if (localStorage.getItem('auth')) {
        authorization.value = localStorage.getItem('auth');
    }
    window.addEventListener('resize', updateIsMobile);
});
onUnmounted(() => {
    window.removeEventListener('resize', updateIsMobile);
});
async function getTemplates() {
    await axios.get(templatesURL)
        .then(async (response) => {
            templates.value = response.data.sort((a, b) => a.id.localeCompare(b.id));
        })
        .catch(error => {
            console.log("Error: ", error);
        });
        loading.value = false;
}

async function createCourse() {
    if (new_course.value.classId != "" && new_course.value.classId !== null && new_course.value.joinCode != "" && new_course.value.joinCode !== null) {
        await axios.post(scopesURL, new_course.value, {
            headers: {
                'Content-Type': 'application/json', 'Authorization': `${authorization.value}`
            }
        }).then(async (response) => {
            if (response.data.code === 201) {
                sessionStorage.setItem('successMessage', 'Course created successfully!');
                router.push({ name: 'home' });
            } else {
                toast.add({ severity: 'error', summary: 'Error', detail: response.data.message, life: 3000 });
            }
        }).catch(error => {
            console.log("Error: ", error);
            toast.add({ severity: 'error', summary: 'Error', detail: 'Server error', life: 3000 });
        });
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Please fill all required fields', life: 3000 });
    }
}

async function clearData() {
    new_course.value = {
        "classId": "",
        "templateId": null,
        "autoRun": false,
        "hidden": false,
        "joinCode": "",
        "identities": [],
        "credentials": [],
        "projects": [],
    };
}

async function hasSourceField(item) {
    return typeof item === 'object' && item !== null && 'source' in item && typeof item.source === 'string';
}

async function validatejsonInput(parsedData) {
    if (Array.isArray(parsedData)) {
        return parsedData.every(hasSourceField);
    } else {
        return hasSourceField(parsedData);
    }
}

async function addCredentialorIdent() {
    try {
        const parsedData = JSON.parse(jsonInput.value.trim());
        if (await validatejsonInput(parsedData)) {
            if (visible_addCredentials.value) {
                new_course.value.credentials.push(parsedData);
            }
            if (visible_addIdentities.value) {
                new_course.value.identities.push(parsedData);
            }
            jsonInput.value = "";
            visible_addIdentities.value = false;
            visible_addCredentials.value = false;
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: "Each identity must have a source field.", life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: "Invalid JSON format or missing source field.", life: 3000 });
    }
}


</script>

<template>
    <div style="display: grid; justify-items: center;">
        <div class="card ">
            <NavMenu />
            <Divider layout="horizontal" />
            <div v-if="loading" class="flex flex-column m-5">
                <ProgressSpinner class="text-center" strokeWidth="4" />
                <h3 class="text-center">Loading...</h3>
            </div>
            <div v-else class="content">
                <div class="form-container" style="flex: 1;">
                    <div class="form">
                        <div class="row">
                            <div class="flex flex-column gap-2" style="width: 45%;">
                                <label for="class-name">Course name<span class="required-asterisk">*</span></label>
                                <InputText id="class-name" v-model="new_course.classId" />
                            </div>
                            <div class="flex flex-column gap-2" :class="{ 'template-warning': templates.length === 0 }"
                                style="width: 45%; min-width: 135px;">
                                <label for="selected_template">Select TPA template<span
                                        class="required-asterisk">*</span></label>
                                <Dropdown id="selected_template" v-model="new_course.templateId" :options="templates"
                                    optionLabel="id" optionValue="id" showClear filter>
                                </Dropdown>
                            </div>
                            <div class="row" v-if="templates.length === 0">
                                <InlineMessage class="mb-2" severity="error">A template must be created in order to
                                    create a new course.</InlineMessage>
                                    <Button label="Create one!" class="p-button-raised p-button-primary mt-2" @click="$router.push({ name: 'templates-management' })" outlined/>

                            </div>
                            <div class="flex flex-column gap-2" style="width: 45%;">
                                <label for="join-code">Join code<span class="required-asterisk">*</span></label>
                                <InputText id="join-code" v-model="new_course.joinCode" />

                            </div>

                        </div>

                        <div class="row">
                            <div class="flex flex-row gap-2"
                                style="width: 45%; align-items: center; justify-content: center;">
                                <label for="identities">Identities:</label>
                                <Button id="identities"  label="Add"
                                    @click="visible_addIdentities = true" icon="pi pi-user-plus" :pt="{
                root: { class: 'bg-yellow-300 border-yellow-300 hover:bg-yellow-400', style: 'min-width: 93px' }
            }" />
                                <Dialog v-model:visible="visible_addIdentities" modal :header="'Add your Identities'"
                                    :style="{}">
                                    <span class="p-text-secondary block mb-5">Please don´t forget source field.</span>
                                    <div class="flex align-items-center gap-3 mb-3">
                                        <Textarea v-model="jsonInput" rows="5" cols="40" class="flex-auto"
                                            placeholder="Enter JSON here..." />
                                    </div>
                                    <div class="flex justify-content-center gap-2" style="margin-bottom: 10px;">
                                        <Button label="Add" @click="addCredentialorIdent" :pt="{
                root: { class: 'bg-green-400 border-green-400 hover:bg-green-600 hover:border-green-600' }
            }" />
                                        <Button label="Cancel" @click="visible_addIdentities = false"
                                            :pt="{
                root: { class: 'bg-red-400 border-red-400 hover:bg-red-600 hover:border-red-600' }
            }" />
                                    </div>
                                </Dialog>
                            </div>
                            <div class="flex flex-row gap-2"
                                style="width: 45%; align-items: center; justify-content: center;">
                                <label for="credentials">Credentials:</label>
                                <Button id="credentials" label="Add"
                                    @click="visible_addCredentials = true" icon="pi pi-key" :pt="{
                root: { class: 'bg-yellow-300 border-yellow-300 hover:bg-yellow-400', style: 'min-width: 93px' }
            }" />
                                <Dialog v-model:visible="visible_addCredentials" modal header="Add your Credentials"
                                    :style="{}">
                                    <span class="p-text-secondary block mb-5">Please don´t forget source field.</span>
                                    <div class="flex align-items-center gap-3 mb-3">
                                        <Textarea v-model="jsonInput" rows="5" cols="40" class="flex-auto"
                                            placeholder="Enter JSON here..." />
                                    </div>
                                    <div class="flex justify-content-center gap-2" style="margin-bottom: 10px;">
                                        <Button  label="Add" @click="addCredentialorIdent" :pt="{
                root: { class: 'bg-green-400 border-green-400 hover:bg-green-600 hover:border-green-600' }
            }" />
                                        <Button  label="Cancel" @click="visible_addCredentials = false"
                                            :pt="{
                root: { class: 'bg-red-400 border-red-400 hover:bg-red-600 hover:border-red-600' }
            }" />
                                    </div>
                                </Dialog>
                            </div>
                        </div>
                        <div class="row">
                            <div class="flex flex-row gap-2" style="justify-content: center;">
                                <label for="autoRun">Auto-run:</label>
                                <InputSwitch v-model="new_course.autoRun" :pt="{
                slider: ({ props }) => ({
                    class: props.modelValue ? 'bg-green-400' : 'bg-gray-300'
                })
            }" />
                            </div>
                            <div class="flex flex-row gap-2" style="justify-content: center;">
                                <label for="hidden">Hidden:</label>
                                <InputSwitch v-model="new_course.hidden" :pt="{
                slider: ({ props }) => ({
                    class: props.modelValue ? 'bg-green-400' : 'bg-gray-300'
                })
            }" />
                            </div>
                        </div>
                    </div>

                    <div class="buttons">
                        <Button label="Create" @click="createCourse" icon="pi pi-check"
                            :disabled="isCreateDisabled" :pt="{
                root: { class: 'bg-green-400 border-green-400 hover:bg-green-600 hover:border-green-600' }
            }" />
                        <Button icon="pi pi-times" @click="clearData" :pt="{
                root: { class: 'bg-red-400 border-red-400 hover:bg-red-600 hover:border-red-600' }
            }" />
                    </div>
                    <div class="required-fields">
                        <span class="required-asterisk">*</span> Required fields
                    </div>
                </div>
                <div class="preview">
                    <pre style="min-width: 205px;">{{ JSON.stringify(new_course, null, 2) }}</pre>
                </div>
            </div>
        </div>
    </div>
</template>


<style scoped>
.template-warning .p-dropdown {
    border: 1px solid red;
}

.row {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-width: 100%;
}

.content {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
    align-self: center;
    gap: 10px;
}

.form {
    display: flex;
    flex-wrap: wrap;
    flex-direction: column;
    gap: 10px;
    border: 1px solid #ccc;
    padding: 10px;
    border-radius: 8px;
    min-width: 409px;
}

.preview {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
}

.buttons {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 2%;
    gap: 10px;
}

.required-asterisk {
    color: red;
    margin-left: 2px;
}

.required-fields {
    margin-top: 10px;
    text-align: center;
}

@media screen and (max-width: 768px) {

    .row>* {
        flex: 0 1 calc(100% - 10px);
    }

    .form {
        min-width: 80vw;
    }
}
</style>