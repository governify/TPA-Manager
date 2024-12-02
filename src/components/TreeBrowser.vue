<script setup>
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
import ScrollPanel from 'primevue/scrollpanel';
import ScrollTop from 'primevue/scrolltop';
import { bluejayInfraStore } from '@/stores/bluejayInfra';
import { reactive, ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import { useToast } from "primevue/usetoast";
import Dropdown from 'primevue/dropdown';
import InputSwitch from 'primevue/inputswitch';
import { useTPAMode } from '@/utils/tpaMode.js';
import { changeShowHidden } from '@/utils/showHiddenCourses.js';
import Checkbox from 'primevue/checkbox';

//Tree logic
const props = defineProps({
  nodes: Array,
  tasks: Object,
  authenticated: Boolean
});

const expandedStates = reactive({});

const toggleNode = (nodeId) => {
  expandedStates[nodeId] = !expandedStates[nodeId];
};

const isExpanded = (nodeId) => {
  return !!expandedStates[nodeId];
};

watch(
  () => props.authenticated,
  (newVal) => {
    if (newVal) {
      authorization.value = localStorage.getItem('auth');
    }
  }
);

//View logic
const { showHiddenCourses } = changeShowHidden();
const { tpaEditMode } = useTPAMode();
const bluejayInfra = bluejayInfraStore();
const router = useRouter();
const isMobile = ref(window.innerWidth <= 768);
const toast = useToast();
const displayDialogEditClass = ref(false);
const SCOPES_URL = `${bluejayInfra.SCOPE_MANAGER_URL}/api/v1/scopes/development/`;
const emit = defineEmits(['courseUpdated', 'taskToggled']);
const editedCourseValues = ref({});
const originalCourseValues = ref({});
const authorization = ref(localStorage.getItem('auth'));
const templatesURL = bluejayInfra.REGISTRY_URL + "/api/v6/templates";
const templates = ref([]);


watch(showHiddenCourses, (newValue, oldValue) => {
  if (newValue === true) {
    toast.add({
      severity: 'info',
      summary: 'Info',
      detail: 'Showing hidden courses',
      life: 3000
    });
  } else if (newValue === false) {
    toast.add({
      severity: 'info',
      summary: 'Info',
      detail: 'Hiding courses',
      life: 3000
    });
  }
});
async function openEditDialog(node) {
  editedCourseValues.value = {
    templateId: node.templateId || 'null',
    joinCode: node.joinCode || 'none',
    autoRun: node.autoRun !== undefined ? node.autoRun : false,
    hidden: node.hidden !== undefined ? node.hidden : false,
  };
  originalCourseValues.value = {
    classId: node.classId,
    templateId: node.templateId || 'null',
    joinCode: node.joinCode || 'none',
    autoRun: node.autoRun !== undefined ? node.autoRun : false,
    hidden: node.hidden !== undefined ? node.hidden : false,
  };
  await getTemplates();
  displayDialogEditClass.value = true;
}


async function updateCourse() {
  try {
    const module = await import('axios');
    const axios = module.default;
    const response = await axios.put(SCOPES_URL + originalCourseValues.value.classId, editedCourseValues.value, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization.value,
      }
    });
    if (response.data.code === 200) {
      toast.add({ severity: 'success', summary: 'Success', detail: 'Course updated successfully', life: 3000 });
      editedCourseValues.value = {};
      originalCourseValues.value = {};
      emit('courseUpdated');
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: response.data.message, life: 3000 });
    }
  } catch (error) {
    console.error("Error updating course:", error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update course', life: 3000 });
  }
  displayDialogEditClass.value = false;
}
async function getTemplates() {
  const module = await import('axios');
  const axios = module.default;
  await axios.get(templatesURL)
    .then(async (response) => {
      templates.value = response.data.sort((a, b) => a.id.localeCompare(b.id));
    })
    .catch(error => {
      console.log("Error: ", error);
    });
}
const showTpa = (classId, projectId) => {
  tpaEditMode.value = false;
  router.push({ name: 'tpa', params: { classId: classId, projectId: projectId } });
};

const showDashboard = (projectId) => {
  const targetURL = `${bluejayInfra.DASHBOARD_URL}/dashboard/script/dashboardLoader.js?dashboardURL=${bluejayInfra.REPORTER_URL}/api/v4/dashboards/tpa-${projectId}/main`;
  window.open(targetURL, '_blank');
};

const showGithubRepository = (identities) => {
  if (!authorization.value) {
    toast.add({ severity: 'info', summary: 'Info', detail: 'Please add auth to view the GitHub repository.', life: 3000 });
    return;
  }
  const githubIdentity = identities.find(identity => identity.source === 'github');
  if (githubIdentity) {
    const { repoOwner, repository } = githubIdentity;
    const url = `https://github.com/${repoOwner}/${repository}`;
    window.open(url, '_blank');
  } else {
    toast.add({ severity: 'info', summary: 'Info', detail: 'Project has no GitHub repository.', life: 3000 });
  }
};

const _getActionClassForCourse = (classId, actionType) => {
  let result = "base-button ";
  let projectsCount = props.tasks['course']?.[classId]?.projectsCount;
  let actionsCount = props.tasks['course']?.[classId]?.[actionType].length;
  if (projectsCount === actionsCount) {
    result += "on";
  } else if (actionsCount === 0) {
    result += "off";
  } else {
    result += "half-on";
  }
  return result;
};

const getActionClass = (target, classId, actionType) => {
  if (target === 'course') {
    return _getActionClassForCourse(classId, actionType);
  }
  let result = "base-button ";
  let task = props.tasks[target]?.[classId]?.[actionType];
  if (task && task.running) {
    result += "on";
  } else {
    result += "off";
  }
  console.log(result);
  return result;
};


</script>

<template>
  <div class="column">
    <!-- title and Create button -->
    <div class="space-between">
      <div>
        <span style="font-size: 20px !important;cursor: pointer;" @click="toggleNode('Courses')">
          <i :class="['pi', 'pi-angle-double-right', { 'rotate-down': isExpanded('Courses'), 'rotate-right': !isExpanded('Courses') }]"
            :style="{ color: isExpanded('Courses') ? '#10B981' : '#43A5F4' }"></i>
          {{ nodes[0].name }}
        </span>
        <Button label="New Course" severity="success" @click.stop @click="$router.push({ name: 'new-course' })"
          icon="pi pi-plus" :pt="{
            root: { style: 'height: 27px; padding: 0 10px; margin-left: 10px' },
          }" raised />
      </div>
      <!-- show hidden courses -->
      <div class="flex align-items-center gap-2">
        <span> Show hidden courses: </span>
        <InputSwitch v-model="showHiddenCourses" aria-label="showHiddenCourses" :pt="{
          slider: ({ props }) => ({
            class: props.modelValue ? 'bg-green-400' : 'bg-gray-300'
          })
        }" />
      </div>
    </div>





    <!-- Each course node -->
    <div v-if="isExpanded('Courses') && nodes[0].children?.length > 0" v-for="course in nodes[0].children"
      :key="course.classId" class="column padding-left">
      <div name="COURSE HEADER" class="space-between">

        <div class="flex-row" style="cursor: pointer;" @click.stop="toggleNode(course.classId)">
          <i :class="['pi', 'pi-angle-double-right', { 'rotate-down': isExpanded(course.classId), 'rotate-right': !isExpanded(course.classId) }]"
            :style="{ color: isExpanded(course.classId) ? '#10B981' : '#43A5F4' }"></i>
          <div class="dynamic-string">{{ course.classId }}</div>
        </div>

        <!-- buttons (right) -->
        <div class="flex-row margin-left gap-4">
          <!-- info buttons -->
          <div class="flex-row gap-2">
            <Button v-tooltip.top="'Edit'" v-if="authenticated" icon="pi pi-pencil" @click="openEditDialog(course)"
              class="base-button info" raised />
            <Button v-tooltip.top="'TPA Template'" icon="pi pi-file"
              @click="$router.push({ name: 'tpa-template', params: { templateId: course.templateId } })"
              class="base-button info" raised />
            <Button v-tooltip.top="'TPA List'" icon="pi pi-list"
              @click="$router.push({ name: 'tpa-list', params: { classId: course.classId } })" class="base-button info"
              raised />
          </div>

          <!-- action buttons -->
          <div class="flex-row gap-2 ">
            <Button v-tooltip.top="'Toggle All Calculations'" icon="pi pi-bolt" @click=""
              :class="getActionClass('project', course.classId, 'calculation')" raised />
            <Button v-tooltip.top="'Toggle All Emails'" icon="pi pi-envelope" @click=""
              :class="getActionClass('project', course.classId, 'email')" raised />
            <Button v-tooltip.top="'Toggle All Slack'" icon="pi pi-slack" @click=""
              :class="getActionClass('project', course.classId, 'slack')" raised />
          </div>
        </div>
      </div>

      <!-- Course details (NEW LINE)  -->
      <!-- Each project node -->
      <div v-if="isExpanded(course.classId) && course.projects.length > 0" v-for="project in course.projects"
        :key="project.projectId" class="padding-left column">
        
        <div class="flex-row space-between">
          <div class="flex-row" style="cursor: pointer;" @click.stop="toggleNode(project.projectId)">
            <i :class="['pi', 'pi-angle-double-right', { 'rotate-down': isExpanded(project.projectId), 'rotate-right': !isExpanded(project.projectId) }]"
              :style="{ color: isExpanded(project.projectId) ? '#10B981' : '#43A5F4' }"></i>
            <div class="dynamic-string">{{ project.name }}</div>
          </div>

          <!-- buttons (right) -->
           <div class="flex-row margin-left gap-4">

             <div class="flex align-items-center gap-2" @click.stop>
               <Button v-tooltip.top="'TPA'" icon="pi pi-file-edit" @click="showTpa(course.classId, project.projectId)"
               class="base-button info" raised />
               <Button v-tooltip.top="'Dashboard'" icon="pi pi-chart-line" @click="showDashboard(project.projectId)"
               class="base-button info" raised />
               <Button v-tooltip.top="'GitHub Repository'" icon="pi pi-github"
               @click="showGithubRepository(project.identities)" class="base-button info" raised />
              </div>
              
              <div class="flex align-items-center gap-2" @click.stop>
                <Button v-tooltip.top="'Toggle Calculations'" icon="pi pi-bolt" @click="'hasta la vista'"
                :class="getActionClass('project', course.classId, 'calculation')" raised />
                <Button v-tooltip.top="'Toggle Emails'" icon="pi pi-envelope" @click="'hasta la vista'"
                :class="getActionClass('project', course.classId, 'email')" raised />
                <Button v-tooltip.top="'Toggle Slack'" icon="pi pi-slack" @click="'hasta la vista'"
                :class="getActionClass('project', course.classId, 'slack')" raised />
              </div>
            </div>
          </div>

        <!-- each project details (NEW LINE)-->
        <div v-if="isExpanded(project.projectId)" class="details-container">
          <div class="left-sections">
            <h3 style="margin: 0;">Identities</h3>
            <ul
              v-if="project.identities && project.identities.length && project.identities.some(identitie => Object.keys(identitie).length > 0)">
              <li v-for="identity in project.identities" :key="identity.source">
                <template v-for="(value, key) in identity" :key="key">
                  <div>{{ key }}: {{ value }}</div>
                </template>
              </li>
            </ul>
            <p v-else>No data available</p>

            <h3 style="margin: 0;">Credentials</h3>
            <ul
              v-if="project.credentials && project.credentials.length && project.credentials.some(credential => Object.keys(credential).length > 0)">
              <li v-for="credential in project.credentials" :key="credential.source">
                <template v-for="(value, key) in credential" :key="key">
                  <div>{{ key }}: {{ value }}</div>
                </template>
              </li>
            </ul>
            <p v-else>No data available</p>
          </div>
          <div class="members-section">
            <h3 style="margin-bottom: 5px;">Members</h3>
            <ScrollPanel
              :style="{ 'width': '100%', 'height': project.members.length > 0 ? '200px' : '100px', 'margin-bottom': '5px', ' padding-right': ' 15px' }"
              :pt="{ barY: 'hover:bg-green-400 bg-green-400 opacity-70', barX: 'hover:bg-green-400 bg-green-400 opacity-70' }">
              <ul
                v-if="project.members && project.members.length && project.members.some(member => Object.keys(member).length > 0)">
                <li v-for="member in project.members" :key="member">
                  <template v-for="(value, key) in member" :key="key">
                    <div>{{ key }}: {{ value }}</div>
                  </template>
                </li>
              </ul>
              <p v-else>No data available</p>
              <ScrollTop target="parent" :threshold="300" icon="pi pi-angle-up" />
            </ScrollPanel>

          </div>
        </div>

      </div>
      <div v-else-if="isExpanded(course.classId) && !course.projects.length > 0" class="details-container">
        <p>No projects available</p>
      </div>
      
    </div>
    <div v-else-if="isExpanded('Courses') && !nodes[0].children?.length > 0" class="details-container">
      <p>No courses available</p>
    </div>
  </div>

</template>


<style scoped>
/* show all borders in red for dev mode */
/* * {
  border: 1px solid red !important;
} */

.dynamic-string {
  max-width: 170px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.auto-run-info {
  display: inline-block;
  border: 1px solid #000;
  border-radius: 8px;
  padding: 2px 6px;
  box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.3);
  font-size: 10px;
  white-space: nowrap;
}



.padding-left {
  padding-left: 10px;
}

.space-between {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
}

.margin-left {
  margin-left: auto;
}

.flex-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.column {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
}

.pi {
  transition: transform 0.2s ease;
}

.rotate-down {
  transform: rotate(90deg);
}

.rotate-right {
  transform: rotate(0deg);
}

.project-details .details-box {
  border: 1px solid #ccc;
  padding: 10px;
  margin-top: 5px;
}

.edit-card {
  border: 1px solid #e0e0e0;
  padding: 20px;
  margin-bottom: 20px;
  background-color: #fff;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.edit-card label {
  font-size: 16px;
  color: #333;
  margin-bottom: 8px;
  font-weight: 500;
}

.edit-card p {
  color: #666;
  font-size: 14px;
  margin-bottom: 12px;
}



.base-button {
  color: white;
  background-color: #414543;
  border: 1px solid #414543;
  border-radius: 4px;
  height: 25px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: background-color 0.3s, border-color 0.3s, transform 0.3s;
}

.base-button:hover {

  transform: scale(1.1);
}

.base-button.info {
  background-color: #414543;
  border: 1px solid #414543;
}

.base-button.info:hover {
  background-color: #333;
  border: 1px solid #414543;
}

.base-button.on {
  background-color: #10B981;
  border: 1px solid #10B981;
}

.base-button.on:hover {
  background-color: #0D9488;
  border: 1px solid #10B981;
}

.base-button.off {
  background-color: #E53E3E;
  border: 1px solid #E53E3E;
}

.base-button.off:hover {
  background-color: #D94646;
  border: 1px solid #E53E3E;
}

.base-button.half-on {
  background-color: #F59E0B;
  border: 1px solid #F59E0B;
}

.base-button.half-on:hover {
  background-color: #D97706;
  border: 1px solid #F59E0B;
}

.details-container {
  border: 1px solid #ccc;
  padding: 15px !important;
  margin-top: 15px;
  border-radius: 10px;
  margin-bottom: 10px;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  cursor: default;
}

.left-sections {
  flex: 1;

}

.members-section {
  flex: 1;
}

p {
  color: #777;
  margin-left: 25px;
}

ul {
  padding-left: 25px;
  margin: 0 !important;
}

:deep(.p-scrollpanel-content) {
  width: 100%;
}

.node-head>div>Button {
  height: 27px;
  padding: 0 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media screen and (max-width: 768px) {

  .node-root-content,
  .node-content,
  .children-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .node-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .node-head>div {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .node-head>div>Button {
    width: auto;
  }

  .details-container {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
