<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import Divider from 'primevue/divider';
import axios from 'axios'
import { useToast } from "primevue/usetoast";
import { useRoute, useRouter } from 'vue-router';
import ScrollPanel from 'primevue/scrollpanel';
import ScrollTop from 'primevue/scrolltop';
import NavMenu from '@/components/NavMenu.vue';
import { bluejayInfraStore } from '@/stores/bluejayInfra';
import ProgressSpinner from 'primevue/progressspinner';
import { useTPAMode } from '@/utils/tpaMode';


const { tpaEditMode } = useTPAMode();
const loading = ref(true);
const bluejayInfra = bluejayInfraStore();
const route = useRoute();
const router = useRouter();
const toast = useToast();
const isMobile = ref(window.innerWidth <= 768);
const course = ref();
const classId = route.params.classId;
const classesURL = bluejayInfra.SCOPE_MANAGER_URL + "/api/v1/scopes/development";
const agreements = ref([]);
const agreementsURL = bluejayInfra.REGISTRY_URL + "/api/v6/agreements";


onMounted(async () => {
    await getCourse();
    findClassTPAs(classId);
    window.addEventListener('resize', updateIsMobile);
});
onUnmounted(() => {
    window.removeEventListener('resize', updateIsMobile);
});
const updateIsMobile = () => {
    isMobile.value = window.innerWidth <= 768;
};

async function getCourse() {
    await axios.get(classesURL + "/" + classId, {
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(async (response) => {
        course.value = response.data.scope;
    })
        .catch(error => {
            console.log("Error: ", error);
            toast.add({ severity: 'error', summary: 'Error', detail: error.response.data.error, life: 3000 });
        });
}

async function findClassTPAs(classId) {
    await axios.get(agreementsURL, {
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(async (response) => {
        let allAgreements = response.data.sort((a, b) => a.id.localeCompare(b.id));
        agreements.value = allAgreements.filter(agreement => agreement.context.definitions.scopes.development.class.default === classId);
    })
        .catch(error => {
            console.log("Error: ", error);
            toast.add({ severity: 'error', summary: 'Error', detail: error.response.data.error, life: 3000 });
        });
        loading.value = false
}

const showTpa = (courseId, projectId) => {
  tpaEditMode.value = false;
  router.push({ name: 'tpa', params: { classId: courseId, projectId: projectId} });
};

</script>

<template>
    <div style="display: grid; justify-items: center;">
        <div class="card">
            <NavMenu />
            <Divider layout="horizontal" />
            <div v-if="loading" class="flex flex-column m-5">
                <ProgressSpinner class="text-center" strokeWidth="4" />
                <h3 class="text-center">Loading...</h3>
            </div>
            <div class="content" v-else>
                <div v-if="agreements.length === 0" class="tpas-card">
                    <h2>No agreements found</h2>
                </div>
                <div v-if="agreements.length > 0" class="tpas-card">
                    <h2>Agreements</h2>
                    <ScrollPanel style="width: 100%; height: 80%"
                        :pt="{ bary: 'hover:bg-green-400 bg-green-400 opacity-70' }">
                        <ul>
                            <li v-for="agreement in agreements" :key="agreement.id">
                                <div class="agreement-item">
                                    <span class="agreement-span"
                                        @click="showTpa(agreement.context.definitions.scopes.development.class.default, agreement.context.definitions.scopes.development.project.default)">
                                        {{ agreement.id }}
                                    </span>
                                </div>
                            </li>
                        </ul>
                        <ScrollTop target="parent" :threshold="200" style="margin-right: 15px;"
                            icon="pi pi-angle-up" />
                    </ScrollPanel>
                </div>
            </div>
        </div>
    </div>
</template>


<style scoped>
.tpas-card-enter-active {
    transition: opacity 0.5s ease;
}

.tpas-card-enter-from {
    opacity: 0;
}

.tpas-card-enter-to {
    opacity: 1;
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


.agreements-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    margin-top: 10px;
}

.agreement-span {
    cursor: pointer;
    color: #10B981;
    padding: 5px 10px;
    border: 1px solid transparent;
    border-radius: 5px;
    font-size: 18px;
}

.agreement-span:hover {
    background-color: #4CD07D;
    border-color: #10B981;
    color: white;
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
    gap: 10px;
}

.card-header {
    font-size: min(max(20px, 4vw), 25px) !important;
}

.tpas-card {
    width: 80%;
    max-height: 390px;
    border: 1px solid #ccc;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    padding: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.template-card span {
    font-size: min(max(15px, 4vw), 18px) !important;
}



@media screen and (max-width: 768px) {
    .template-card {
        flex: 0 1 100%;
    }

    .tpas-card {
        width: 100%;
    }

}
</style>