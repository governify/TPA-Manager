<script setup>
import Button from 'primevue/button'
import SpeedDial from 'primevue/speeddial';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import { useAppThemeStore } from '@/stores/appTheme';
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useToast } from "primevue/usetoast";
import { useRoute } from 'vue-router';
import { bluejayInfraStore } from '@/stores/bluejayInfra';
import { useTPAMode } from '@/utils/tpaMode.js';
import Breadcrumb from 'primevue/breadcrumb';
import InputSwitch from 'primevue/inputswitch';

const { tpaEditMode } = useTPAMode();
const bluejayInfra = bluejayInfraStore();
const route = useRoute();
const toast = useToast();
const emit = defineEmits(['auth-updated', 'templates-updated']);
const appThemeStore = useAppThemeStore();
const visible_addAuth = ref(false)
const auth = ref('')
const authenticated = ref(localStorage.getItem('auth') ? true : false);
const isMobile = ref(window.innerWidth <= 768);
const classId = route.params.classId;
const projectId = route.params.projectId;
const templateId = route.params.templateId;
const displayDialogNewTemplate = ref(false);
const newTemplateId = ref('');
const templatesURL = bluejayInfra.REGISTRY_URL + "/api/v6/templates";
const assetsURL = bluejayInfra.ASSETS_MANAGER_URL + "/api/v1/public/renders/tpa/template.json";


const pageHeader = computed(() => {
    let content = {
        title: 'Development Scopes',
        img: '/appicon.svg'
    };
    switch (route.path) {
        case '/templates-management':
            content.title = 'Templates Management';
            content.img = '/templates-management.svg';
            break;
        case '/new-course':
            content.title = 'Create new Course';
            content.img = '/new-course.svg';
            break;
        case '/tpa-list/' + classId:
            content.title = 'TPA list for';
            content.img = '/tpa-list.svg';
            break;
        case '/catalogue':
            content.title = 'TPs Catalogue';
            content.img = '/catalogue.svg';
            break;
        case '/tpa-template/' + templateId:
            content.title = templateId;
            content.img = '/tpa-template.svg';
            break;
        case '/tpa/' + classId + '/' + projectId:
            content.title = 'TPA';
            content.img = {
                "read_mode": "/tpa-read.svg",
                "edit_mode": "/tpa-edit.svg"
            };

    }
    return content;
});
const home = ref({
    icon: 'pi pi-home',
    route: '/'
});
const items_tpa = ref([
    { label: classId, route: `/tpa-list/${classId}` },
    { label: projectId },
    { label: 'TPA' }
]);

const updateIsMobile = () => {
    isMobile.value = window.innerWidth <= 768;
};
onMounted(() => {
    window.addEventListener('resize', updateIsMobile);
});
onUnmounted(() => {
    window.removeEventListener('resize', updateIsMobile);
});
const clearAuth = () => {
    localStorage.removeItem('auth')
    auth.value = ''
    authenticated.value = false;
    toast.add({ severity: 'success', summary: 'Success', detail: 'Auth has been removed', life: 3000 });
    emit('auth-updated');
}
const addAuth = () => {
    localStorage.setItem('auth', auth.value)
    authenticated.value = true;
    visible_addAuth.value = false
    toast.add({ severity: 'success', summary: 'Success', detail: 'Auth has been added', life: 3000 });
    emit('auth-updated');
}
const items = computed(() => [
    {
        label: 'Switch Theme',
        icon: appThemeStore.isDarkModeOn ? 'pi pi-moon' : 'pi pi-sun',
        command: () => appThemeStore.toggleTheme(),
    },
    {
        label: authenticated.value ? 'Log out' : 'Add Auth',
        icon: authenticated.value ? 'pi pi-sign-out' : 'pi pi-user-plus',
        command: () => authenticated.value ? clearAuth() : visible_addAuth.value = true,
    }
]);
async function addTemplate() {
    if (!newTemplateId.value) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Please fill the field.', life: 3000 });
    } else {
        let tpaTemplate = null;
        const module = await import('axios');
        const axios = module.default;
        console.log("assetsURL: ", assetsURL);
        tpaTemplate = await axios.get(assetsURL)
        const template = JSON.parse(JSON.stringify(tpaTemplate.data).replace(/"id":\s*"tpa-1010101010"/g, `"id": "${newTemplateId.value}"`).replace(/"type":\s*"agreement"/g, `"type": "template"`));
        await axios.post(templatesURL, template, {
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(async (response) => {
            displayDialogNewTemplate.value = false;
            newTemplateId.value = '';
            emit('templates-updated');
            toast.add({ severity: 'success', summary: 'Success', detail: 'Template added successfully.', life: 3000 });
        }).catch(error => {
            console.log("Error: ", error.response);
            if (error.response?.data?.message?.data?.code === 11000) {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Template already exists.', life: 3000 });
            } else {
                toast.add({ severity: 'error', summary: 'Error', detail: error.response.data.error, life: 3000 });
            }
        });
    }
}


</script>

<template>
    <div class="header">
        <Breadcrumb v-if="pageHeader.title === 'TPA'" :home="home" :model="items_tpa">
            <template #item="{ item }">
                <router-link v-if="item.route" v-slot="{ href, navigate }" :to="item.route" custom>
                    <a :href="href" @click="navigate">
                        <span :class="[item.icon, 'text-color']" />
                        <span class="text-primary font-semibold">{{ item.label }}</span>
                    </a>
                </router-link>
                <div v-else class="link-content">
                    <div v-if="!isMobile">
                        <img v-tooltip.bottom="'Read mode'" v-if="item.label === 'TPA'" :src="pageHeader.img.read_mode"
                            :alt="pageHeader.img.read_mode" width="30" />
                        <span v-if="item.label !== 'TPA'" class="text-color">{{ item.label }}</span>
                        <span v-if="item.label === 'TPA'">
                            <InputSwitch v-if="item.label === 'TPA'" v-model="tpaEditMode" :pt="{
            slider: ({ props }) => ({
                class: props.modelValue ? 'bg-green-400' : 'bg-gray-300'
            })
        }" />
                        </span>
                        <img v-tooltip.bottom="'Edit mode'" v-if="item.label === 'TPA'" :src="pageHeader.img.edit_mode"
                            :alt="pageHeader.img.edit_mode" width="30" />
                    </div>
                    <div v-else class="link-content">
                        <span class="text-color">{{ item.label }}</span>
                    </div>
                </div>


            </template>
        </Breadcrumb>
        <div v-if="isMobile && pageHeader.title === 'TPA'">
            <img v-tooltip.bottom="'Read mode'" :src="pageHeader.img.read_mode" :alt="pageHeader.img.read_mode"
                width="30" />
            <span>
                <InputSwitch v-model="tpaEditMode" :pt="{
            slider: ({ props }) => ({
                class: props.modelValue ? 'bg-green-400' : 'bg-gray-300'
            })
        }" />
            </span>
            <img v-tooltip.bottom="'Edit mode'" :src="pageHeader.img.edit_mode" :alt="pageHeader.img.edit_mode"
                width="30" />

        </div>
        <div class="header-top">
            <img v-if="pageHeader.title !== 'TPA'" :src="pageHeader.img" width="50" height="50"
                alt="header-img" loading="lazy" />
            <span v-if="pageHeader.title !== 'TPA'">{{ pageHeader.title }}</span>
            <span v-if="pageHeader.title === 'TPA list for'" style="color: #4CD07D;"> {{ classId }}</span>
        </div>

        <div class="buttons">
            <div v-if="isMobile" class="flex gap-2">
                <Button label="Classes" icon="pi pi-folder-open" @click="$router.push({ name: 'home' })" outlined />
                <div :style="{ height: '50px' }" class="flex align-items-center justify-content-center">
                    <SpeedDial :model="items" :radius="60" type="quarter-circle" direction="down-right"
                        showIcon="pi pi-cog" class="relative" :style="{ height: '50px' }" aria-label="speedDial-button"
                        buttonClass="p-button-outlined">
                        <template #item="slotProps">
                            <Button v-tooltip="slotProps.item.label" :icon="slotProps.item.icon"
                                :aria-label="slotProps.item.label" class="speeddial-button"
                                @click="slotProps.item.command" />
                        </template>
                    </SpeedDial>
                </div>
            </div>

            <Button v-if="!isMobile && pageHeader.title === 'Templates Management' && !templateId" label="New Template"
                aria-label="new-template" severity="success" icon="pi pi-plus"
                @click="displayDialogNewTemplate = true" />

            <Dialog v-model:visible="displayDialogNewTemplate" modal header="Add a new Template" :style="{}">
                <div class="flex flex-column gap-3 mb-3">
                    <label class="text-center" for="newTemplateId">Template ID</label>
                    <span class="p-text-secondary text-center block mb-3">Example id: template-my-string-example-v1-0-0</span>
                    <InputText id="newTemplateId" v-model="newTemplateId" />
                </div>
                <div class="flex justify-content-center gap-2" style="margin-bottom: 10px;">
                    <Button label="Add" @click="addTemplate" :pt="{
            root: { class: 'bg-green-400 border-green-400 hover:bg-green-600 hover:border-green-600' }
        }" />
                    <Button label="Cancel" @click="displayDialogNewTemplate = false" :pt="{
            root: { class: 'bg-red-400 border-red-400 hover:bg-red-600 hover:border-red-600' }
        }" />
                </div>
            </Dialog>
            <Button v-if="!isMobile" label="Courses" icon="pi pi-folder-open" @click="$router.push({ name: 'home' })"
                outlined />
            <Button label="Templates Management" @click="$router.push({ name: 'templates-management' })"
                icon="pi pi-wrench" outlined />
            <Button v-if="isMobile && pageHeader.title === 'Templates Management'" label="New Template"
                icon="pi pi-plus" @click="displayDialogNewTemplate = true" :pt="{
            root: { class: 'bg-green-400 border-green-400 hover:bg-green-600 hover:border-green-600' }
        }" />

            <div v-if="!isMobile" :style="{ height: '50px' }" class="flex align-items-center justify-content-center">
                <SpeedDial :model="items" :radius="60" type="quarter-circle" direction="down-right" showIcon="pi pi-cog"
                    aria-label="speedDial-button" class="relative" :style="{ height: '50px' }"
                    buttonClass="p-button-outlined">
                    <template #item="slotProps">
                        <Button v-tooltip="slotProps.item.label" :icon="slotProps.item.icon" class="speeddial-button"
                            :aria-label="slotProps.item.label" @click="slotProps.item.command" />
                    </template>
                </SpeedDial>
            </div>


            <Dialog v-model:visible="visible_addAuth" modal header="Add your authorization">
                <span class="p-text-secondary block mb-5">It will be avialible until you log out.</span>
                <div class="flex align-items-center gap-2 mb-3" style="width: 300px;">
                    <InputText id="auth" v-model="auth" class="flex-auto" autocomplete="off" />
                </div>
                <div class="flex justify-content-center gap-2" style="margin-bottom: 10px;">
                    <Button type="button" label="Save" @click="addAuth()"></Button>
                    <Button type="button" label="Cancel" severity="secondary" @click="visible_addAuth = false"></Button>
                </div>
            </Dialog>
        </div>
    </div>
</template>

<style scoped>
.link-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
}

.header {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    text-align: center;
    width: 100%;
    gap: 10px;
}

.header-top,
.buttons {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    gap: 10px;
}

.header-top span {
    font-size: min(max(25px, 4vw), 35px) !important;
}

@media screen and (max-width: 800px) {
    .header {
        flex-direction: column;
    }

    .buttons {
        flex-direction: column;
        width: 100%;
    }

    .header-top {
        flex-direction: column;
    }

}

@media screen and (max-width: 1350px) {
    .header {
        justify-content: center;
    }
}

.speeddial-button {
    background: #495057;
    color: #fff;
    border-radius: 50% !important;
    border-color: #495057;
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.speeddial-button:hover {
    background: #282E38;
    border-color: #282E38;
    color: #fff !important;
}
</style>
