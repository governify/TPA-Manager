<script setup>
import axios from 'axios';
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
import { bluejayInfraStore } from '@/stores/bluejayInfra';
import { reactive, ref, watch } from 'vue';
import { useToast } from "primevue/usetoast";
import InputSwitch from 'primevue/inputswitch';
import { useTPAMode } from '@/utils/tpaMode.js';
import { changeShowHidden } from '@/utils/showHiddenCourses.js';
import EditCourseDialog from './EditCourseDialog.vue';
import ProjectDetails from './ProjectDetails.vue';
import CourseConfig from './CourseNotificationsDialog.vue';
import ActionButton from './ActionButton.vue';
import { getDefaultCalculationConfig } from './configurations';

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


// View logic --------------------------------------------------------------------------
const { showHiddenCourses } = changeShowHidden();
const { tpaEditMode } = useTPAMode();
const bluejayInfra = bluejayInfraStore();
const router = useRouter();
const toast = useToast();
const emit = defineEmits(['courseUpdated', 'taskToggled']);
const authorization = ref(localStorage.getItem('auth'));

// Lifecycle Hooks ---------------------------------------------------------------------
watch(
  () => props,
  (newVal) => {
    if (newVal.authenticated) {
      authorization.value = localStorage.getItem('auth');
    }
  },
  { deep: true }
);

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

// Auth logic --------------------------------------------------------------------------
const isNotAuthorized = () => {
  if (!authorization.value) {
    toast.add({ severity: 'warning', summary: 'Warning', detail: `Could not toggle ${action}. Please add auth.`, life: 3000 });
    return true;
  }
  return false; // Is authorized
};

// Pop Ups Logic --------------------------------------------------------------------------
const isCourseEditPopupVisible = ref(false);
const isCourseConfigPopupVisible = ref(false);
const selectedCourse = ref({});
const POPUPS = {
  COURSE_EDIT: 'courseEdit',
  COURSE_CONFIG: 'courseConfig',
};

const openPopup = (course, popupName) => {
  selectedCourse.value = course;
  switch (popupName) {
    case POPUPS.COURSE_EDIT:
      isCourseEditPopupVisible.value = true;
      break;
    case POPUPS.COURSE_CONFIG:
      isCourseConfigPopupVisible.value = true;
      break;
    default:
      break;
  }
};

const closePopup = () => {
  isCourseEditPopupVisible.value = false;
  isCourseConfigPopupVisible.value = false;
  emit('courseUpdated');
};

// Info buttons logic -------------------------------------------------------------------

const showTpa = (classId, projectId) => {
  tpaEditMode.value = false;
  router.push({ name: 'tpa', params: { classId: classId, projectId: projectId } });
};

const showDashboard = (projectId) => {
  const targetURL = `${bluejayInfra.DASHBOARD_URL}/dashboard/script/dashboardLoader.js?dashboardURL=${bluejayInfra.REPORTER_URL}/api/v4/dashboards/tpa-${projectId}/main`;
  window.open(targetURL, '_blank');
};

const showGithubRepository = (identities) => {
  if (isNotAuthorized()) return;
  const githubIdentity = identities.find(identity => identity.source === 'github');
  if (githubIdentity) {
    const { repoOwner, repository } = githubIdentity;
    const url = `https://github.com/${repoOwner}/${repository}`;
    window.open(url, '_blank');
  } else {
    toast.add({ severity: 'info', summary: 'Info', detail: 'Project has no GitHub repository.', life: 3000 });
  }
};

// Action buttons logic ------------------------------------------------------------------------

// TODO currently adminEmailNotification.js sends email to courseAdmin and notificationScriptSimpl, sends email/slack to project admins and slack to courseAdmins (just push all messages)
// This scripts work. However a refactor is needed to make it more clear, simpler and to avoid code duplication
const TASK_TYPES = {
  TPA_CALCULATION: {
    name: 'tpaCalculation',
    isDisabled: (course, project) => {
      if (!project) return isCourseTaskDisabled(course);
      return false;
    },
    getColor: (course, project) => getColorOfTask('tpaCalculation', course, project),
    createTask: (course, project, isRunning) => {
      if (!course || !project || !course.classId || !project.projectId) return null;
      let calculationConfig = course.calculationConfig || getDefaultCalculationConfig();
      return {
        id: `tpaCalculation-${course.classId}-${project.projectId}`,
        script: `${bluejayInfra.ASSETS_MANAGER_INTERNAL_URL}/api/v1/public/director/tasks/system/requestTpaReport/script.js`,
        running: isRunning,
        config: {
          agreementId: `tpa-${project.projectId}` // This is standard in Bluejay. Do not change
        },
        tags: {
          simple: ['tpaCalculation', 'createdByTpaManager'],
          keyValue: {
            type: 'tpaCalculation',
            courseId: course.classId,
            projectId: project.projectId
          }
        },
        code: 0, //skips oas warning
        message: "message", //skips oas warning
        ...calculationConfig //stores init, end and interval
      };
    }
  },
  EMAIL: {
    name: 'email',
    isDisabled: (course, project) => {
      return isNotificationTaskDisabled("email", course, project);
    },
    getColor: (course, project) => getColorOfTask('email', course, project),
    createTask: (course, project, isRunning) => {
      if (!course || !project || !course.classId || !project.projectId) return null;
      if (project && !project.notifications?.email) return null; // Project does not have email configured
      let task = {
        running: isRunning,
        config: {
          urls: {
            assets: `${bluejayInfra.ASSETS_MANAGER_URL}`,
            scopes: `${bluejayInfra.SCOPE_MANAGER_URL}`,
            registry: `${bluejayInfra.REGISTRY_URL}`,
            dashboard: `${bluejayInfra.DASHBOARD_URL}`,
            reporter: `${bluejayInfra.REPORTER_URL}`
          },
          initialDate: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(),
          finalDate: null, //This is not used in the script, initialDate is to get DAYS count from now, maybe we should pass the days instead of the date
        },
        init: Date.now(),
        end: new Date((new Date().getTime() + 1000 * 60 * 60 * 24 * 365)).toISOString(), //1 year from now (user does not select end date)
        interval: course.notifications?.config?.interval || 86400, //1 day
        code: 0, //skips oas warning
        message: "message", //skips oas warning
        tags: {
          simple: ['email', 'createdByTpaManager'],
          keyValue: {
            type: 'email',
            courseId: course.classId,
            projectId: project.projectId
          }
        }
      }
      if (project) {
        task.config.forAdmin = false;
        task.config.adminEmails = null;
        task.config.courseId = course.classId;
        task.config.projectId = project.projectId;
        task.id = `email-${project.projectId}`;
      }
      task.config.scopeManagerKey = localStorage.getItem('auth') || '';
      task.script = `${bluejayInfra.ASSETS_MANAGER_INTERNAL_URL}/api/v1/public/director/tasks/system/tpaComplianceNotifications/script.js`;
      return task;
    }
  },
  EMAIL_ADMIN: {
    name: 'admin-email',
    isDisabled: (course, project) => {
      return isNotificationTaskDisabled("admin-email", course, project);
    },
    getColor: (course, project) => getColorOfTask('admin-email', course, project),
    createTask: (course, project, isRunning) => {
      if (!course || !course.classId) return null;
      if (!course.notifications?.credentials?.email) return null; // Course does not have admin email configured
      let task = {
        running: isRunning,
        config: {
          urls: {
            assets: `${bluejayInfra.ASSETS_MANAGER_URL}`,
            scopes: `${bluejayInfra.SCOPE_MANAGER_URL}`,
            registry: `${bluejayInfra.REGISTRY_URL}`,
            dashboard: `${bluejayInfra.DASHBOARD_URL}`,
            reporter: `${bluejayInfra.REPORTER_URL}`
          },
          initialDate: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(),
          finalDate: null, //This is not used in the script, initialDate is to get DAYS count from now, maybe we should pass the days instead of the date
        },
        init: Date.now(),
        end: new Date((new Date().getTime() + 1000 * 60 * 60 * 24 * 365)).toISOString(), //1 year from now (user does not select end date)
        interval: course.notifications?.config?.interval || 86400, //1 day
        code: 0, //skips oas warning
        message: "message", //skips oas warning
        tags: {
          simple: ['email', 'createdByTpaManager'],
          keyValue: {
            type: 'admin-email',
            courseId: course.classId,
            projectId: project?.projectId
          }
        }
      }
      /*
      {
          "forAdmin": false,xxxxx
          "adminEmails": "your_email@example.com,your_email2@example.com",
          "courseId": "showcase",
          "projectId": "showcase-GH-governify_bluejay-showcase",
          "scopeManagerKey": "bluejay-scopes-private-key"
      }
      */
      //Admin email
      task.config.forAdmin = true;
      task.config.adminEmails = course.notifications?.credentials?.email;
      task.config.courseId = course.classId;
      task.projectId = null;
      task.id = `admin-email-${course.classId}`;

      task.config.scopeManagerKey = localStorage.getItem('auth') || '';
      task.script = `${bluejayInfra.ASSETS_MANAGER_INTERNAL_URL}/api/v1/public/director/tasks/system/tpaComplianceNotifications/script.js`;
      return task;
    }
  },
  SLACK: {
    name: 'slack',
    isDisabled: (course, project) => {
      return isNotificationTaskDisabled("slack", course, project);
    },
    getColor: (course, project) => getColorOfTask('slack', course, project),
    createTask: (course, project, isRunning) => {
      if (!course || !course.classId) return null;
      if (project && !project.projectId) return null;
      if (project && !project.notifications?.slack) return null; // Project does not have slack configured
      let task = {
        running: isRunning,
        config: {
          urls: {
            assets: `${bluejayInfra.ASSETS_MANAGER_URL}`,
            scopes: `${bluejayInfra.SCOPE_MANAGER_URL}`,
            registry: `${bluejayInfra.REGISTRY_URL}`,
            dashboard: `${bluejayInfra.DASHBOARD_URL}`,
            reporter: `${bluejayInfra.REPORTER_URL}`
          },
          initialDate: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(),
          finalDate: null, //This is not used in the script, initialDate is to get DAYS count from now, maybe we should pass the days instead of the date
        },
        init: Date.now(),
        end: new Date((new Date().getTime() + 1000 * 60 * 60 * 24 * 365)).toISOString(), //1 year from now (user does not select end date)
        interval: course.notifications?.config?.interval || 86400, //1 day
        code: 0, //skips oas warning
        message: "message", //skips oas warning
        tags: {
          simple: ['slack', 'createdByTpaManager'],
          keyValue: {
            type: 'slack',
            courseId: course.classId,
            projectId: project?.projectId
          }
        }
      }
      if (project) {
        task.script = `${bluejayInfra.ASSETS_MANAGER_URL}/api/v1/public/director/notificationScriptSimpl.js`;
        task.id = `slack-${project.projectId}`;
        task.config.classId = course.classId;
        task.config.projectId = project.projectId;
        task.config.projectName = project.name;
        task.config.slack = project.notifications.slack;
        task.config.forAdmin = false;

      } else {
        //Admin slack
        //TODO this script does not exist. The slak admin was resend all messages in a for loop for each project. This is not the best approach
        task.script = `${bluejayInfra.ASSETS_MANAGER_URL}/api/v1/public/director/adminSlackNotification.js`;
        task.id = `admin-slack-${course.classId}`;
        task.config.classId = course.classId;
        task.config.slack = course.notifications?.credentials?.slack;
        task.config.forAdmin = true;
      }
      return task;
    }
  },
};

const taskStates = {
  all: '#0a0',
  none: '#d00',
  some: '#f80'
}


/**
 * 
 * @param {Object} params
 * @param {string} params.action The action to toggle (tpaCalculation, email, slack)
 * @param {boolean} params.wasRunning The previous state of the action.
 * @param {Object} params.course The course to toggle the action for
 */
const toggleAllProjectsAction = async (params) => {
  console.log('TOGGLING ALL PROJECTS');
  const { action, wasRunning, course } = params;
  if (!authorization.value) {
    toast.add({ severity: 'info', summary: 'Info', detail: 'Please add auth to toggle actions.', life: 3000 });
    return;
  }
  const promises = course.projects.map(project => {
    let config = { action, wasRunning, course, project, emitsEvent: false };
    return toggleAction(config);
  });
  await Promise.all(promises);
  console.log('FINISHED TOGGLING ALL PROJECTS');
  emit('taskToggled');
  if (params.action === TASK_TYPES.TPA_CALCULATION) {
    optimizeCalculationPeriod();
  }
};



/**
 * 
 * @param {Object} params
 * @param {string} params.action The action to toggle (TASK_TYPES.something)
 * @param {boolean} params.wasRunning The previous state of the action.
 * @param {Object} params.course The course to toggle the action for
 * @param {Object} params.project The project to toggle the action for (optional)
 * @param {boolean} params.emitsEvent If the function should emit the taskToggled event
 */
const toggleAction = async (config) => {
  const module = await import('axios');
  const axios = module.default;
  const { action, wasRunning, course, project, emitsEvent = true, isDisabled = false } = config;
  if (isDisabled) return;
  if (isNotAuthorized()) return;
  let isRunning = !wasRunning;

  let directorTasksUrl = `${bluejayInfra.DIRECTOR_URL}/api/v1/tasks`;
  let newTask = action.createTask(course, project, isRunning);

  if (newTask === null) {
    toast.add({ severity: 'warn', summary: 'Warning', detail: 'Missing required parameters for this task.', life: 3000 });
    return;
  }

  // Special handling for admin-email: DELETE if turning off
  if ((action.name === 'admin-email' || action === 'admin-email') && !isRunning) {
    // Find the task id in tasks
    const taskId = props.tasks.courses?.[course.classId]?.tasks?.['admin-email']?.id;
    if (!taskId) {
      toast.add({ severity: 'warn', summary: 'Warning', detail: 'No admin-email task to delete.', life: 3000 });
      return;
    }
    try {
      await axios.delete(`${directorTasksUrl}/${taskId}`);
      if (emitsEvent) {
        emit('taskToggled');
      }
      toast.add({ severity: 'success', summary: 'Success', detail: 'Admin email notification removed.', life: 3000 });
    } catch (error) {
      console.error('Error deleting admin-email task', error);
      toast.add({ severity: 'error', summary: 'Error', detail: 'Could not delete admin email notification', life: 3000 });
    }
    return;
  }

  // Default: POST to create/update task
  try {
    const response = await axios.post(directorTasksUrl, newTask, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('Task toggled successfully', response.data);
    if (emitsEvent) {
      emit('taskToggled');
      if (action === TASK_TYPES.TPA_CALCULATION) {
        optimizeCalculationPeriod();
      }
    }
    return;
  } catch (error) {
    console.error('Error toggling task', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Could not toggle task', life: 3000 });
  }

}

const optimizeCalculationPeriod = async () => {
  const taskConfig = {
    filenameMustIncludeAll: ["tpaCalculation"],
    startingTime: "00:00",
    endingTime: "00:58",
    batchSize: 1
  };

  try {
    const scriptResponse = await axios.get(`${bluejayInfra.ASSETS_MANAGER_URL}/api/v1/public/director/tasks/utils/optimizeCalculationPeriod/script.js`);
    const scriptText = scriptResponse.data;

    const payload = {
      scriptText: scriptText,
      scriptConfig: taskConfig
    };

    await axios.post(`${bluejayInfra.DIRECTOR_URL}/api/v1/tasks/test`, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    toast.add({ severity: 'success', summary: 'Success', detail: 'Calculation period optimized successfully', life: 3000 });
  } catch (error) {
    console.error('Error optimizing calculation period', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Could not optimize calculation period', life: 3000 });
  }
};





/**
 * Get the status of a task
 * @param {string} action The action to get the status of
 * @param {object} course The course to get the status of
 * @param {object} project The project to get the status of
 * @returns {Object} { isRunning: boolean, color: string}
 * 
 * There is 2 types of tasks: Course tasks and Project tasks.
 * Project tasks are tasks that are enabled/disabled for a specific project.
 * Course tasks are tasks that are enabled/disabled for all projects of a course.
 * 
 * Course task can be all,none or some depending on the number of active tasks. The is running is only true if all tasks are running
 */
const getTaskStatus = (action, course, project) => {
  let tasks = props.tasks;
  let result = {};
  if (project) {
    // Project task
    let isRunning = tasks.courses[course.classId]?.projects?.[project.projectId]?.tasks?.[action]?.running;
    result = { isRunning, color: isRunning ? taskStates.all : taskStates.none };
  } else {
    // Course task. (Enable/Disable all projects tasks), must compare project count with active tasks count
    // Special case for admin-email (and otras tareas de curso)
    if (action === 'admin-email' || action === TASK_TYPES.EMAIL_ADMIN.name) {
      let isRunning = tasks.courses[course.classId]?.tasks?.['admin-email']?.running;
      result = { isRunning, color: isRunning ? taskStates.all : taskStates.none };
    } else {
      let activeTasks = tasks.courses[course.classId]?.projectsActiveTasksCountByType?.[action];
      let projectCount = course.projects.length;
      if (!activeTasks || activeTasks === 0) {
        result = { isRunning: false, color: taskStates.none };
      } else if (activeTasks === projectCount) {
        result = { isRunning: true, color: taskStates.all };
      } else {
        result = { isRunning: false, color: taskStates.some };
      }
    }
  }

  return result;
};

const isCourseTaskDisabled = (course) => {
  return course.projects.length === 0;
}

const isNotificationTaskDisabled = (action, course, project) => {
  if (!project) return isCourseTaskDisabled(course);
  // Is disabled if the project has no notification settings for the action
  return !project.notifications[action];
}


const getColorOfTask = (action, course, project) => {
  return getTaskStatus(action, course, project).color;
};
//Useful if developing a toggle functionallity
const isTaskRunning = (action, course, project) => {
  return getTaskStatus(action, course, project).isRunning;
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
      :key="course.classId" class="column padding-left border-node">
      <div name="COURSE HEADER" class="space-between course-header">

        <div class="flex-row" style="cursor: pointer;" @click.stop="toggleNode(course.classId)">
          <i :class="['pi', 'pi-angle-double-right', { 'rotate-down': isExpanded(course.classId), 'rotate-right': !isExpanded(course.classId) }]"
            :style="{ color: isExpanded(course.classId) ? '#10B981' : '#43A5F4' }"></i>
          <div class="dynamic-string">{{ course.classId }}</div>
        </div>

        <!-- buttons (right) -->
        <div class="flex-row margin-left gap-4">
          <!-- info buttons -->
          <div class="flex-row gap-2">
            <Button v-tooltip.top="'Edit'" v-if="authenticated" icon="pi pi-pencil"
              @click="openPopup(course, POPUPS.COURSE_EDIT)" class="base-button info" raised />
            <Button v-tooltip.top="'Notifications'" v-if="authenticated" icon="pi pi-bell"
              @click="openPopup(course, POPUPS.COURSE_CONFIG)" class="base-button info" raised />
            <Button v-tooltip.top="'TPA Template'" icon="pi pi-file"
              @click="$router.push({ name: 'tpa-template', params: { templateId: course.templateId } })"
              class="base-button info" raised />
          </div>

          <!-- action buttons -->
          <div class="flex-row gap-2 ">
            <ActionButton v-tooltip.top="'Toggle Admin Email Notifications'"
              @turnOn="toggleAction({ action: TASK_TYPES.EMAIL_ADMIN, wasRunning: false, course, project: null })"
              @turnOff="toggleAction({ action: TASK_TYPES.EMAIL_ADMIN, wasRunning: true, course, project: null })"
              class="base-button" icon="pi pi-user" :color="TASK_TYPES.EMAIL_ADMIN.getColor(course)"
              :disabled="TASK_TYPES.EMAIL_ADMIN.isDisabled(course)" />
            <ActionButton v-tooltip.top="'Toggle All Calculations for all projects'"
              @turnOn="toggleAllProjectsAction({ action: TASK_TYPES.TPA_CALCULATION, wasRunning: false, course })"
              @turnOff="toggleAllProjectsAction({ action: TASK_TYPES.TPA_CALCULATION, wasRunning: true, course })"
              class="base-button" icon="pi pi-bolt" :color="TASK_TYPES.TPA_CALCULATION.getColor(course)"
              :disabled="TASK_TYPES.TPA_CALCULATION.isDisabled(course)" />
            <ActionButton v-tooltip.top="'Toggle All Emails for all projects'"
              @turnOn="toggleAllProjectsAction({ action: TASK_TYPES.EMAIL, wasRunning: false, course })"
              @turnOff="toggleAllProjectsAction({ action: TASK_TYPES.EMAIL, wasRunning: true, course })"
              class="base-button" icon="pi pi-envelope" :color="TASK_TYPES.EMAIL.getColor(course)"
              :disabled="TASK_TYPES.EMAIL.isDisabled(course)" />
            <ActionButton v-tooltip.top="'Toggle All Slack for all projects'"
              @turnOn="toggleAllProjectsAction({ action: TASK_TYPES.SLACK, wasRunning: false, course })"
              @turnOff="toggleAllProjectsAction({ action: TASK_TYPES.SLACK, wasRunning: true, course })"
              icon="pi pi-slack" :color="TASK_TYPES.SLACK.getColor(course)"
              :disabled="TASK_TYPES.SLACK.isDisabled(course)" />

          </div>
        </div>
      </div>

      <!-- Course details (NEW LINE)  -->
      <!-- Each project node -->
      <div v-if="isExpanded(course.classId) && course.projects.length > 0" v-for="project in course.projects"
        :key="project.projectId" class="padding-left column">

        <div class="flex-row space-between project-header">
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
              <ActionButton v-tooltip.top="'Toggle Calculations'"
                @turnOn="toggleAction({ action: TASK_TYPES.TPA_CALCULATION, wasRunning: false, course, project })"
                @turnOff="toggleAction({ action: TASK_TYPES.TPA_CALCULATION, wasRunning: true, course, project })"
                :disabled="TASK_TYPES.TPA_CALCULATION.isDisabled(course, project)" :icon="'pi pi-bolt'"
                :color="TASK_TYPES.TPA_CALCULATION.getColor(course, project)" />
              <ActionButton v-tooltip.top="'Toggle Emails'"
                @turnOn="toggleAction({ action: TASK_TYPES.EMAIL, wasRunning: false, course, project })"
                @turnOff="toggleAction({ action: TASK_TYPES.EMAIL, wasRunning: true, course, project })"
                :disabled="TASK_TYPES.EMAIL.isDisabled(course, project)" :icon="'pi pi-envelope'"
                :color="TASK_TYPES.EMAIL.getColor(course, project)" />
              <ActionButton v-tooltip.top="'Toggle Slack'"
                @turnOn="toggleAction({ action: TASK_TYPES.SLACK, wasRunning: false, course, project })"
                @turnOff="toggleAction({ action: TASK_TYPES.SLACK, wasRunning: true, course, project })"
                :disabled="TASK_TYPES.SLACK.isDisabled(course, project)" :icon="'pi pi-slack'"
                :color="TASK_TYPES.SLACK.getColor(course, project)" />

            </div>
          </div>
        </div>

        <!-- each project details (NEW LINE)-->
        <div v-if="isExpanded(project.projectId)">
          <ProjectDetails :project="project" />
        </div>

      </div>
      <div v-else-if="isExpanded(course.classId) && !course.projects.length > 0" class="details-container">
        <p>No projects available</p>
      </div>

    </div>
    <div v-else-if="isExpanded('Courses') && !nodes[0].children?.length > 0" class="details-container">
      <p>No courses available</p>
    </div>

    <!-- Dialog for editing course -->
    <EditCourseDialog v-if="isCourseEditPopupVisible" :course="selectedCourse" @close="closePopup"
      @courseUpdated="emit('courseUpdated')" />

    <CourseConfig v-if="isCourseConfigPopupVisible" :course="selectedCourse" @close="closePopup"
      @courseUpdated="emit('courseUpdated')" />
  </div>
</template>

<style scoped>
.dynamic-string {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
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

.base-button {
  color: white;
  background-color: #414543;
  border: 0px;
  border-radius: 4px;
  height: 40px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: background-color 0.3s, border-color 0.3s, transform 0.3s;
}

.base-button:hover {
  transform: scale(1.1);
}

.base-button.info {
  background-color: #414543;
}

.base-button.info:hover {
  background-color: #333;
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

.border-node {
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #ccc;
}

.course-header {
  background-color: #e0e0e0;
  padding: 10px;
  border-radius: 5px;
  font-weight: bold;
}

.project-header {
  background-color: #f0f0f0;
  padding: 10px;
  border-radius: 5px;
}
</style>
