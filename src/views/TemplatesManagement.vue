<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import NavMenu from '@/components/NavMenu.vue';
import Divider from 'primevue/divider';
import axios from 'axios';
import ScrollPanel from 'primevue/scrollpanel';
import ScrollTop from 'primevue/scrolltop';
import Button from 'primevue/button';
import ConfirmPopup from 'primevue/confirmpopup';
import { useConfirm } from 'primevue/useconfirm';
import { bluejayInfraStore } from '@/stores/bluejayInfra';
import { useTPAMode } from '@/utils/tpaMode.js';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import { useRouter } from 'vue-router';

const { tpaEditMode } = useTPAMode();
const router = useRouter();
const bluejayInfra = bluejayInfraStore();
const toast = useToast();
const confirm = useConfirm();
const templates = ref([]);
const courses = ref([]);
const authorization = ref();
const templatesURL = bluejayInfra.REGISTRY_URL + '/api/v6/templates';
const coursesURL = bluejayInfra.SCOPE_MANAGER_URL + '/api/v1/scopes/development/courses';
const isMobile = ref(window.innerWidth <= 768);
const showNoTemplatesMessage = ref(false);
const templatesConfig = ref([]);
const sampleTemplate = ref();
const displayCreateFromSample = ref(false);
const newTemplateId = ref('');


const updateIsMobile = () => {
    isMobile.value = window.innerWidth <= 768;
};
async function getTemplates() {
    await axios.get(templatesURL)
        .then(async (response) => {
            templates.value = response.data?.sort((a, b) => a.id.localeCompare(b.id));
        })
        .catch(error => {
            templates.value = [];
            console.log('Error: ', error);
            const errorMessage = error?.response?.data?.error || 'Unspecified error occurred';
            toast.add({ severity: 'error', summary: 'Error', detail: errorMessage, life: 3000 });
        });
    try {
        const response = await axios.get('/templates.config.json');
        templatesConfig.value = response.data;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error fetching templates config', life: 3000 });
    }
    showNoTemplatesMessage.value = templatesConfig.value.length === 0;

}
async function getCourses() {
    await axios.get(coursesURL, {
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(async (response) => {
        courses.value = response.data.scope?.sort((a, b) => a.classId.localeCompare(b.classId));
    })
        .catch(error => {
            courses.value = [];
            console.log('Error: ', error);
        });
}
const deletePopup = (event, templateId) => {
    confirm.require({
        target: event.currentTarget,
        message: 'Are you sure you want to delete?',
        icon: 'pi pi-exclamation-triangle',
        rejectClass: 'p-button-secondary p-button-outlined p-button-sm',
        acceptClass: 'bg-red-400 border-red-400 hover:bg-red-600 hover:border-red-600',
        rejectLabel: 'Cancel',
        acceptLabel: 'Yes',
        accept: () => {
            axios.delete(`${templatesURL}/${templateId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authorization.value
                }
            }).then(async (response) => {
                toast.add({ severity: 'success', summary: 'Success', detail: 'Template deleted successfully.', life: 3000 });
                await getTemplates();
            }).catch(error => {
                console.log('Error: ', error);
                const errorMessage = error?.response?.data?.error || 'Unspecified error occurred';
                toast.add({ severity: 'error', summary: 'Error', detail: errorMessage, life: 3000 });
            });

        },
        reject: () => { }
    });
};
const coursesForTemplate = (templateId) => {
    return courses.value.filter(course => course.templateId === templateId);
};
onMounted(() => {
    getCourses();
    getTemplates();
    if (localStorage.getItem('auth')) {
        authorization.value = localStorage.getItem('auth');
    }
    window.addEventListener('resize', updateIsMobile);
});
onUnmounted(() => {
    window.removeEventListener('resize', updateIsMobile);
});

watch(templates, (newTemplates) => {
    if (newTemplates.length === 0) {
        setTimeout(() => {
            showNoTemplatesMessage.value = true;
        }, 500);
    } else {
        showNoTemplatesMessage.value = false;
    }
});

async function cloneTemplate(template) {
    if (templates.value.some(existingTemplate => existingTemplate.id.endsWith('-clone'))) {
        toast.add({ severity: 'warn', summary: 'Warning', detail: 'Rename or delete the clone to create a new one.', life: 4000 });
    } else {

        const new_template = JSON.parse(JSON.stringify(template));
        new_template.id = template.id + '-clone';
        delete new_template._id;
        await axios.post(templatesURL, new_template, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authorization.value
            }
        }).then(async (response) => {
            toast.add({ severity: 'success', summary: 'Success', detail: 'Template cloned successfully.', life: 3000 });
            await getTemplates();
        }).catch(error => {
            console.error('Error: ', error.response);
            toast.add({ severity: 'error', summary: 'Error', detail: error.response.data.error, life: 3000 });
        });
    }

}

const openSampleUrl = (url) => {
    window.open(url, '_blank');
};
async function createTemplateFromSample() {
    if (!newTemplateId.value) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Please fill the field.', life: 3000 });
        return;
    }
    const apiGitHubUrl = sampleTemplate.value.replace('github.com', 'api.github.com/repos')
        .replace('/blob/', '/')
        .replace('/main/', '/contents/');
    try {
        const response = await axios.get(apiGitHubUrl);
        const tpaTemplate = JSON.parse(atob(response.data.content));
        tpaTemplate.id = `${newTemplateId.value}`;
        tpaTemplate.type = "template";

        await axios.post(templatesURL, tpaTemplate, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authorization.value
            }
        });
        displayCreateFromSample.value = false;
        newTemplateId.value = '';
        getTemplates();
        toast.add({ severity: 'success', summary: 'Success', detail: 'Template added successfully.', life: 3000 });
    } catch (error) {
        console.error("Error: ", error);
        let detailMessage = 'Unknown error occurred.';
        if (error.response) {
            if (error.response.data && error.response.data.code === 11000) {
                detailMessage = 'Template already exists.';
            } else if (error.response.data && error.response.data.error) {
                detailMessage = error.response.data.error;
            } else {
                detailMessage = error.response.statusText || JSON.stringify(error.response.data);
            }
        }
        toast.add({ severity: 'error', summary: 'Error', detail: detailMessage, life: 3000 });
    }
}
const visualizeTemplate = (templateId) => {
    tpaEditMode.value = false;
    router.push({ name: 'tpa-template', params: { templateId } });
};
const editTemplate = (templateId) => {
    tpaEditMode.value = true;
    router.push({ name: 'tpa-template', params: { templateId } });
};

async function handleAuthUpdated() {
    authorization.value = localStorage.getItem('auth');
}
</script>

<template>
    <div style="display: grid; justify-items: center;">
        <div class="card ">
            <NavMenu @templates-updated="getTemplates" @auth-updated="handleAuthUpdated"/>
            <Divider layout="horizontal" />
            <div class="content">
                <TransitionGroup name="list">
                    <template v-if="templates.length === 0 && showNoTemplatesMessage">
                        <div class="card-checkout">
                            <h2 class="checkout-title text-center">Check out some samples from our GitHub</h2>
                            <ul>
                                <li v-for="(template, index) in templatesConfig" :key="index">
                                    <div @click="openSampleUrl(template.sample_url)">
                                        <span>{{ template.description }}</span>
                                    </div>
                                </li>
                            </ul>
                            <Button label="Create new template from sample" severity="success" @click="displayCreateFromSample = true"
                                :pt="{ root: { style: 'width: 280px; padding: 0 10px; margin-top: 10px' } }" />
                            <Dialog v-model:visible="displayCreateFromSample" header="Add new template from sample"
                                modal>
                                <div class="flex flex-column  gap-3 mb-3" style="width: 300px;">
                                    <label for="newTemplateId">Template ID</label>
                                    <p>Example id: template-my-string-example-v1-0-0</p>
                                    <InputText id="newTemplateId" v-model="newTemplateId" />

                                    <label for="sampleTemplate">Select Template Sample</label>
                                    <Dropdown id="sampleTemplate" v-model="sampleTemplate" :options="templatesConfig"
                                        optionLabel="description" optionValue="sample_url" filter showClear>
                                    </Dropdown>
                                </div>
                                <div class="flex justify-content-center gap-2" style="margin-bottom: 10px;">
                                    <Button label="Add" @click="createTemplateFromSample"
                                        :pt="{ root: { class: 'bg-green-400 border-green-400 hover:bg-green-600 hover:border-green-600' } }" />
                                    <Button label="Cancel" @click="displayCreateFromSample = false"
                                        :pt="{ root: { class: 'bg-red-400 border-red-400 hover:bg-red-600 hover:border-red-600' } }" />
                                </div>
                            </Dialog>

                        </div>
                    </template>
                    <template v-else>
                        <div v-for="template in templates" :key="template.id" class="template-card">
                            <div class="card-header">
                                <span class="text-header" v-tooltip.bottom="'Visualize'"
                                    @click="visualizeTemplate(template.id)">{{ template.id }}</span>
                                <Button v-if="!template.id.endsWith('-clone')" label="Clone"
                                    @click="cloneTemplate(template)" icon="pi pi-clone" :pt="{
                root: { style: 'height: 27px; min-width: 105px ;max-width: 105px ;padding: 0 10px; margin-left: 10px' },
            }" />
                            </div>
                            <div v-if="courses?.some(course => course.templateId === template.id)">
                                <span style="margin-left: 15px; font-size: min(max(15px, 4vw), 18px) !important;">In use
                                    in these courses:</span>
                                <ScrollPanel style="width: 100%; height: 125px"
                                    :pt="{ bary: 'hover:bg-green-400 bg-green-400 opacity-70' }">
                                    <ul>
                                        <li v-for="course in coursesForTemplate(template.id)" :key="course">
                                            <span style="font-size: min(max(15px, 4vw), 18px) !important;"
                                                @click="$router.push({ name: 'tpa-list', params: { classId: course.classId } })">{{
                course.classId }}</span>
                                        </li>
                                    </ul>
                                    <ScrollTop target="parent" :threshold="200" style="margin-right: 15px;"
                                        icon="pi pi-angle-up" />
                                </ScrollPanel>
                            </div>
                            <div v-else style="display: grid; justify-items: center; align-items: center;">
                                <span>Not in use</span>
                                <div class="buttons">
                                    <Button label="Edit" @click="editTemplate(template.id)" icon="pi pi-pencil" :pt="{
                root: { class: 'bg-yellow-400 border-yellow-400 hover:bg-yellow-600 hover:border-yellow-600', style: 'min-width: 93px' }
            }" />

                                    <ConfirmPopup></ConfirmPopup>
                                    <Button label="Delete" @click="deletePopup($event, template.id)" icon="pi pi-trash"
                                        :pt="{
                root: { class: 'bg-red-500 border-red-500 hover:bg-red-600 hover:border-red-600', style: 'min-width: 93px' }
            }" />

                                </div>
                            </div>
                        </div>
                    </template>
                </TransitionGroup>
            </div>
        </div>
    </div>
</template>


<style scoped>
p {
    color: #8e8e8e;
    font-size: 15px !important;
}

.card-checkout {
    border: 1px solid #ccc;
    border-radius: 10px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    padding: 20px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 80%;
}

.checkout-title {
    font-size: min(max(20px, 4vw), 30px) !important;
    margin-bottom: 10px;
}

.list-enter-active {
    animation: enterAnimation 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}

@keyframes enterAnimation {
    0% {
        opacity: 0;
        transform: translateY(30px) scale(0.5);
    }

    50% {
        opacity: 0.75;
        transform: translateY(15px) scale(1.1);
    }

    100% {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.list-leave-active {
    animation: leaveAnimation 0.5s cubic-bezier(0.55, 0, 0.1, 1) forwards;
}

@keyframes leaveAnimation {
    0% {
        opacity: 1;
        transform: translateY(0) scale(1);
    }

    50% {
        opacity: 0.5;
        transform: translateY(-15px) scale(1.1);
    }

    100% {
        opacity: 0;
        transform: translateY(-30px) scale(0.5);
    }
}


.buttons {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 7px;
}

ul {
    margin: 0 !important;
}

li {
    padding: 2px 0;
}

li span {
    cursor: pointer;
    color: #10B981;
}

.content {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 20px;
}

.card-header {
    display: flex;
    justify-content: space-between;
}

.text-header {
    cursor: pointer;
    font-size: min(max(20px, 4vw), 22px) !important;
    transition: 0.4s;
    margin-left: 5px;
}

.text-header:hover {
    color: #10B981;
    transform: scale(1.1);
}


.template-card {
    flex: 0 1 calc(50% - 10px);
    border: 1px solid #ccc;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    padding: 15px;
}


@media screen and (max-width: 768px) {
    .template-card {
        flex: 0 1 100%;
    }

    .card-checkout {
        width: 100%;
    }

    .card-header {
        flex-direction: column;
        justify-content: center;
    }
}
</style>