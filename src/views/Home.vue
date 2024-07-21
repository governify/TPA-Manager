<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import Divider from 'primevue/divider';
import { useToast } from "primevue/usetoast";
import NavMenu from '@/components/NavMenu.vue';
import { bluejayInfraStore } from '@/stores/bluejayInfra';
import TreeBrowser from '@/components/TreeBrowser.vue';
import ProgressSpinner from 'primevue/progressspinner';
import { changeShowHidden } from '@/utils/showHiddenCourses.js';

const { showHiddenCourses } = changeShowHidden();
const loading = ref(true);
const courses = ref([]);
const toast = useToast();
const bluejayInfra = bluejayInfraStore();
const isMobile = ref(window.innerWidth <= 768);
const coursesURL = ref(bluejayInfra.SCOPE_MANAGER_URL + "/api/v1/scopes/development/courses");
const authenticated = ref(localStorage.getItem('auth') ? true : false);
const updateIsMobile = () => {
    isMobile.value = window.innerWidth <= 768;
};
onMounted(async () => {
    await getCourses();
    const successMessage = sessionStorage.getItem('successMessage');
    if (successMessage) {
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: successMessage,
            life: 3000
        });
        sessionStorage.removeItem('successMessage');
    }
    window.addEventListener('resize', updateIsMobile);
});
onUnmounted(() => {
    window.removeEventListener('resize', updateIsMobile);
});
watch(showHiddenCourses, () => {
    getCourses();
});
async function getCourses() {
    const module = await import('axios');
    const axios = module.default;
    await axios.get(coursesURL.value, {
        headers: {
            'Content-Type': 'application/json', 'Authorization': `${localStorage.getItem('auth')}`
        }
    }).then(async (response) => {
        courses.value = response.data.scope?.sort((a, b) => a.classId.localeCompare(b.classId));
        courses.value = [{
            "name": "Courses",
            "children": await filterCourses(courses.value)
        }];
    }).catch(error => {
        console.log("Error: ", error);
        courses.value = [{
            "name": "Courses",
            "children": []
        }];
    });
    loading.value = false;
}


async function filterCourses(courses) {
    if (!courses) {
        return [];
    }
    let filteredCourses = [];
    for (let course of courses) {
        if (!course.hidden) {
            filteredCourses.push(course);
        }
        if (showHiddenCourses.value && course.hidden) {
            filteredCourses.push(course);
        }

    }
    return filteredCourses;
}

async function handleAuthUpdated() {
    getCourses();
    authenticated.value = localStorage.getItem('auth') ? true : false;
}

</script>
<template>
    <div style="display: grid; justify-items: center;">
        <div class="card ">
            <NavMenu @auth-updated="handleAuthUpdated" />
            <Divider layout="horizontal" />
            <div v-if="loading" class="flex flex-column m-5">
                <ProgressSpinner class="text-center" strokeWidth="4" />
                <h3 class="text-center">Loading...</h3>
            </div>
            <TreeBrowser @courseUpdated="getCourses" v-else :nodes="courses" :authenticated="authenticated" />
        </div>
    </div>
</template>

<style scoped></style>