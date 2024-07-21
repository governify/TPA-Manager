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
const emit = defineEmits(['courseUpdated']);
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
  if(!authorization.value) {
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


</script>

<template>
  <div class="node-container">
    <!-- Root node -->
    <div class="node-root-content">
      <div class="node-head-root">
        <span style="font-size: 20px !important;cursor: pointer;" @click="toggleNode('Courses')">
          <i :class="['pi', 'pi-angle-double-right', { 'rotate-down': isExpanded('Courses'), 'rotate-right': !isExpanded('Courses') }]"
            :style="{ color: isExpanded('Courses') ? '#10B981' : '#43A5F4' }"></i>
          {{ nodes[0].name }}
        </span>
        <Button label="New Course" severity="success" @click.stop @click="$router.push({ name: 'new-course' })" icon="pi pi-plus" :pt="{
          root: { style: 'height: 27px; padding: 0 10px; margin-left: 10px' },
        }" raised />
      </div>

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
    <div v-if="isExpanded('Courses')" class="children-container">
      <div v-if="nodes[0].children?.length > 0" v-for="course in nodes[0].children" :key="course.classId"
        class="node-content">
        <div class="node-head">
          <span style="font-size: 20px !important;cursor: pointer;" @click.stop="toggleNode(course.classId)">
            <i :class="['pi', 'pi-angle-double-right', { 'rotate-down': isExpanded(course.classId), 'rotate-right': !isExpanded(course.classId) }]"
              :style="{ color: isExpanded(course.classId) ? '#10B981' : '#43A5F4' }"></i>
            {{ course.classId }}
          </span>
          <div class="flex gap-2">
            <Button label="Edit" v-if="authenticated"   severity="contrast" icon="pi pi-pencil" @click="openEditDialog(course)" :pt="{
          root: { style: 'margin-left: 10px' }
        }"  outlined/>
            <Button label="TPA Template"
              @click="$router.push({ name: 'tpa-template', params: { templateId: course.templateId } })"  raised />
            <Button label="TPA List" @click="$router.push({ name: 'tpa-list', params: { classId: course.classId } })"
              raised />
              <span class="auto-run-info">Auto run <Checkbox v-model="course.autoRun" :binary="true" /></span>
          </div>

        </div>

        <!-- Each project node -->
        <div v-if="isExpanded(course.classId)" class="children-container">
          <div v-if="course.projects.length > 0" v-for="project in course.projects" :key="project.projectId"
            class="node-content">
            <div class="node-head">
              <span style="font-size: 20px !important;cursor: pointer;" @click.stop="toggleNode(project.projectId)">
                <i :class="['pi', 'pi-angle-double-right', { 'rotate-down': isExpanded(project.projectId), 'rotate-right': !isExpanded(project.projectId) }]"
                  :style="{ color: isExpanded(project.projectId) ? '#10B981' : '#43A5F4' }"></i>
                {{ project.name }}
              </span>
              <div class="flex align-items-center gap-2" @click.stop>
                <Button label="TPA" @click="showTpa(course.classId, project.projectId)" :pt="{
          root: { class: 'bg-yellow-400 border-yellow-400 hover:bg-yellow-600 hover:border-yellow-600', style: 'height: 27px; padding: 0 10px; margin-left: 10px' },
        }" raised />
                <Button label="Dashboard" @click="showDashboard(project.projectId)" :pt="{
          root: { class: 'bg-yellow-400 border-yellow-400 hover:bg-yellow-600 hover:border-yellow-600', style: 'height: 27px;' },
        }" raised />
                <Button class="github-button" @click="showGithubRepository(project.identities)"
                  icon="pi pi-github"
                  :pt="{
          root: { style: 'height: 27px; width: 20px' },
        }"/>
              <Button label="Activate" severity="success" @click="'hasta la vista'" :pt="{
          root: { style: 'height: 27px;' },
        }" raised />
              </div>

            </div>

            <!-- each project details -->
            <div v-if="isExpanded(project.projectId)" class="details-container">
              <div class="left-sections">
                <h3 style="margin: 0;">Identities</h3>
                <ul v-if="project.identities && project.identities.length && project.identities.some(identitie => Object.keys(identitie).length > 0)">
                  <li v-for="identity in project.identities" :key="identity.source">
                    <template v-for="(value, key) in identity" :key="key">
                      <div>{{ key }}: {{ value }}</div>
                    </template>
                  </li>
                </ul>
                <p v-else>No data available</p>

                <h3 style="margin: 0;">Credentials</h3>
                <ul v-if="project.credentials && project.credentials.length && project.credentials.some(credential => Object.keys(credential).length > 0)">
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
                  <ul v-if="project.members && project.members.length && project.members.some(member => Object.keys(member).length > 0)">
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
          <div v-else class="details-container">
            <p>No projects available</p>
          </div>
        </div>
      </div>
      <div v-else class="details-container">
        <p>No courses available</p>
      </div>
    </div>
    <Dialog v-model:visible="displayDialogEditClass" :header="'Edit course: ' + originalCourseValues.classId" modal>
      <ScrollPanel :style="{ 'width': '100%', 'height': '400px', 'margin-bottom': '5px' }"
        :pt="{ barY: 'hover:bg-green-400 bg-green-400 opacity-70', barX: 'hover:bg-green-400 bg-green-400 opacity-70' }">
        <div class="flex flex-column gap-2 mb-3 mr-3" :style="{ width: isMobile ?  '250px' : '300px'}">
          <div class="edit-card">
            <label for="templateId">Previous TPA template:</label>
            <p>{{ originalCourseValues.templateId }}</p>
            <label for="templateId">Select TPA template</label>
            <Dropdown id="templateId" v-model="editedCourseValues.templateId" :options="templates" optionLabel="id"
              optionValue="id" filter>
            </Dropdown>
          </div>
          <div class="edit-card">
            <label for="joinCode">Previous Join Code:</label>
            <p>{{ originalCourseValues.joinCode }}</p>
            <label for="joinCode">Join Code</label>
            <InputText id="joinCode" v-model="editedCourseValues.joinCode" />
          </div>
          <div class="edit-card">
            <label for="autoRun">Previous Auto-run:</label>
            <p>{{ originalCourseValues.autoRun }}</p>
            <label for="autoRun">Auto-run:</label>
            <InputSwitch v-model="editedCourseValues.autoRun" :pt="{
          slider: ({ props }) => ({
            class: props.modelValue ? 'bg-green-400' : 'bg-gray-300'
          })
        }" />
          </div>
          <div class="edit-card">
            <label for="hidden">Previous Hidden:</label>
            <p>{{ originalCourseValues.hidden }}</p>
            <label for="hidden">Hidden:</label>
            <InputSwitch v-model="editedCourseValues.hidden" :pt="{
          slider: ({ props }) => ({
            class: props.modelValue ? 'bg-green-400' : 'bg-gray-300'
          })
        }" />
          </div>
        </div>
        <ScrollTop target="parent" :threshold="300" icon="pi pi-angle-up" />
      </ScrollPanel>
      <div class="flex justify-content-center gap-2" style="margin-bottom: 10px;">
        <Button label="Modify" @click="updateCourse"
          :pt="{ root: { class: 'bg-green-400 border-green-400 hover:bg-green-600 hover:border-green-600' } }" />
        <Button label="Cancel" @click="displayDialogEditClass = false"
          :pt="{ root: { class: 'bg-red-400 border-red-400 hover:bg-red-600 hover:border-red-600' } }" />
      </div>
    </Dialog>
  </div>
</template>


<style scoped>

.auto-run-info {
  display: inline-block;
  border: 1px solid #000; 
  border-radius: 8px; 
  padding: 2px 6px; 
  box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.3); 
  font-size: 10px; 
  white-space: nowrap; 
}



.children-container {
  padding-left: 20px;
}

.node-root-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.node-content {
  display: block;
  align-items: flex-start;
  margin-top: 8px;
}

.node-head, .node-head-root{
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 20px;
}

.main-node,
.class-node,
.project-node {
  cursor: pointer;
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



.github-button {
  color: white;
  background-color: #414543;
  border: 1px solid #414543;
  border-radius: 4px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
  padding: 0;
  transition: background-color 0.3s, border-color 0.3s, transform 0.3s; 
}

.github-button:hover {
  background-color: #333;
  border-color: #333;
  transform: scale(1.1); 
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
.node-head > div > Button {
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
  .node-head > div {
    flex-direction: row; 
    flex-wrap: wrap;
    justify-content: flex-start;
  }

  .node-head > div > Button {
    width: auto;
  }

  .details-container {
    flex-direction: column;
    align-items: flex-start;
  }

  

  .github-icon{
    justify-content: flex-start;
  }

  

}
</style>
