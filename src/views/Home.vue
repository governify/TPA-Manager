<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import Divider from 'primevue/divider';
import { useToast } from "primevue/usetoast";
import NavMenu from '@/components/NavMenu.vue';
import { bluejayInfraStore } from '@/stores/bluejayInfra';
import ScopesTree from '@/components/TreeBrowser/ScopesTree.vue';
import ProgressSpinner from 'primevue/progressspinner';
import { changeShowHidden } from '@/utils/showHiddenCourses.js';

const { showHiddenCourses } = changeShowHidden();
const loading = ref(true);
const courses = ref([]);
const tasksByTarget = ref({ courses: {}, errors: [] });
const toast = useToast();
const bluejayInfra = bluejayInfraStore();
const isMobile = ref(window.innerWidth <= 768);
const coursesURL = bluejayInfra.SCOPE_MANAGER_URL + "/api/v1/scopes/development/courses";
const authenticated = ref(localStorage.getItem('auth') ? true : false);
const updateIsMobile = () => {
    isMobile.value = window.innerWidth <= 768;
};
onMounted(async () => {
    await getCourses();
    await getTasksFromDirector();
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
    console.log("Getting courses");
    await axios.get(coursesURL, {
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
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Could not connect to Scope Manager service. Courses will not be available.',
        });
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

async function getTasksFromDirector() {
    const module = await import('axios');
    const axios = module.default;
    console.log("Getting tasks from director");
    await axios.get(bluejayInfra.DIRECTOR_URL + "/api/v1/tasks", {
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(async (response) => {
        const data = response.data;
        const tasks = { courses: {}, errors: [] };
        for (let task of data) {
            if (!(task.tags && task.tags.keyValue && task.tags.keyValue.type)) {
                // The task does not have the required tags
                continue;
            }
            const tags = task.tags.keyValue;
            if (tags.projectId && tags.courseId) {
                tasks.courses[tags.courseId] = tasks.courses[tags.courseId] ?? { tasks: {}, projects: {}, projectsActiveTasksCountByType: {} };
                tasks.courses[tags.courseId].projects[tags.projectId] = tasks.courses[tags.courseId].projects[tags.projectId] ?? { tasks: {} };
                tasks.courses[tags.courseId].projects[tags.projectId].tasks[tags.type] = task;
                if (task.running) {
                    // to compare number of active tasks in a course with the number of projects. RED = 0 active, GREEN = all active, YELLOW = some active
                    tasks.courses[tags.courseId].projectsActiveTasksCountByType[tags.type] =
                        tasks.courses[tags.courseId].projectsActiveTasksCountByType[tags.type] + 1 || 1;
                }
            } else if (tags.courseId) {
                tasks.courses[tags.courseId] = tasks.courses[tags.courseId] ?? { tasks: {}, projects: {} };
                tasks.courses[tags.courseId].tasks[tags.type] = task;
            }
        }
        tasksByTarget.value = tasks;
        console.log("DIRECTOR_TASK_BY_TARGET",tasksByTarget.value);
    }).catch(error => {
        tasksByTarget.value = { courses: {}, errors: [error] };
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Could not connect to Director service. Executing tasks will not be possible.',
        });
        console.log("Error: ", error);
    });
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
            <ScopesTree @courseUpdated="getCourses" @taskToggled="getTasksFromDirector" v-else :nodes="courses"
                :authenticated="authenticated" :tasks="tasksByTarget" />
        </div>
    </div>
</template>

<style scoped></style>