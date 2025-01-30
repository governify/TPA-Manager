<script setup>
import Button from 'primevue/button';
import { bluejayInfraStore } from '@/stores/bluejayInfra';
import { onMounted, ref, watch } from 'vue';
import InputText from 'primevue/inputtext';
import { useToast } from "primevue/usetoast";
import Dropdown from 'primevue/dropdown';
import InputSwitch from 'primevue/inputswitch';
import Popup from '../Popup.vue';
import { intervalOptions, getDefaultCalculationConfig } from './configurations';
import Calendar from 'primevue/calendar';
import Message from 'primevue/message';

const props = defineProps({
  course: Object
});

const emit = defineEmits(['updateCourse', 'close']);

// View logic
const bluejayInfra = bluejayInfraStore();
const toast = useToast();
const SCOPES_URL = `${bluejayInfra.SCOPE_MANAGER_URL}/api/v1/scopes/development/`;
const authorization = ref(localStorage.getItem('auth'));
const templatesURL = bluejayInfra.REGISTRY_URL + "/api/v6/templates";
const templates = ref([]);

const templateId = ref('');
const joinCode = ref('');
const autoRun = ref(false);
const hideDashboardLink = ref(false);
const hidden = ref(false);
const calculationConfig = ref({init: null, end: null, interval: ''});

const loadConfig = async (course) => {
  if (!course) return;

  templateId.value = course.templateId ?? '';
  joinCode.value = course.joinCode ?? '';
  autoRun.value = course.autoRun ?? false;
  hideDashboardLink.value = course.hideDashboardLink ?? false;
  hidden.value = course.hidden ?? false;
  let defaultcalculationConfig = getDefaultCalculationConfig();
  calculationConfig.value = {
    init: course.calculationConfig?.init ? new Date(course.calculationConfig.init) : defaultcalculationConfig.init,
    end: course.calculationConfig?.end ? new Date(course.calculationConfig.end) : defaultcalculationConfig.end,
    interval: course.calculationConfig?.interval ?? defaultcalculationConfig.interval
  };

  await getTemplates();
};

const saveConfig = async () => {
  if (!props.course) return;

  const updatedCourse = {
    templateId: templateId.value,
    joinCode: joinCode.value,
    autoRun: autoRun.value,
    hideDashboardLink: hideDashboardLink.value,
    hidden: hidden.value,
    calculationConfig: {
      ...calculationConfig.value,
      init: calculationConfig.value.init.toISOString(),
      end: calculationConfig.value.end.toISOString()
    }
  };

  try {
    const module = await import('axios');
    const axios = module.default;

    const response = await axios.put(SCOPES_URL + props.course.classId, updatedCourse, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization.value,
      }
    });
    if (response.data.code === 200) {
      toast.add({ severity: 'success', summary: 'Success', detail: 'Course updated successfully', life: 3000 });
      emit('updateCourse');
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: response.data.message, life: 3000 });
    }
  } catch (error) {
    console.error("Error updating course:", error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update course', life: 3000 });
  }
  emit('close');
};

const handleCancel = () => {
  emit('close');
};

const getTemplates = async () => {
  const module = await import('axios');
  const axios = module.default;
  await axios.get(templatesURL)
    .then(async (response) => {
      templates.value = response.data.sort((a, b) => a.id.localeCompare(b.id));
    })
    .catch(error => {
      console.log("Error: ", error);
    });
};

// Lifecycle hooks
onMounted(async () => {
  if (props.course) {
    console.log("Setting dialog with course: ", props.course);
    await loadConfig(props.course);
  }
});

watch(() => props.course, async (newValue) => {
  if (newValue) {
    await loadConfig(newValue);
    console.log("Setting dialog with new value: ", newValue);
  }
});
</script>

<template>
  <Popup v-if="true" @close="handleCancel">
    <template #header>
      <span>Edit course: {{ props.course.classId }}</span>
    </template>
    <template #body>
      <div class="flex flex-column gap-2">
        <div class="edit-card gap-2">
          <h3>Course Settings</h3>
          <label for="templateId">
            <span
              v-tooltip.top="'The template that will be used to create NEW TPAs for this course. If you change the template, the new TPAs will be created using the new template. The existing TPAs will not be affected.'">
              Template ID:
            </span>
          </label>
          <Dropdown id="templateId" v-model="templateId" :options="templates" optionLabel="id" optionValue="id" filter
            :showClear="true">
          </Dropdown>
          <label for="joinCode">
            <span v-tooltip.top="'The code that users will use to JOIN this course.'">
              Join Code:
            </span>
          </label>
          <InputText id="joinCode" v-model="joinCode" />
          <label for="hidden">
            <span
              v-tooltip.top="'If enabled, the course will be hidden. Includes TPA-Manager browser and Join service.'">
              Hidden:
            </span>
          </label>
          <InputSwitch v-model="hidden" />
          <label for="hideDashboardLink">
            <span v-tooltip.top="`If enabled, the project's dashboard URL will be hidden in the JOIN microservice. The URL will only be shown to the professor in the scopesBrowser.`">
              Hide Dashboard URL:
            </span>
          </label>
          <InputSwitch v-model="hideDashboardLink" />
        </div>
        <div class="edit-card gap-2">
          <h3>TPA Calculation Settings</h3>

          <label for="autoRun">
            <span
              v-tooltip.top="'If enabled, when a group JOINs to this course, the TPA calculations will start running automatically. Otherwise, the TPA calculations will only run when the user clicks on the RUN button (bolt icon).'">
              Auto Run:
            </span>
          </label>
          <InputSwitch v-model="autoRun" />
          <label for="init">
            <span
              v-tooltip.top="'The date and time when the TPA calculations will START running. The calculations will run from this date and time until the end date.'">
              Start Date:
            </span>
          </label>
          <Message severity="warn">
            Warning: Your input will be converted to Zulu time<br />
            - Current local time:<br />
            {{ new Date().toLocaleString() }} <br />
            - Current Zulu(UTC) time:<br />
            {{ new Date().toISOString() }}
          </Message>

          <Calendar id="init" v-model="calculationConfig.init" showIcon showButtonBar showTime dateFormat="yy/mm/dd"
            timeFormat="HH:mm" />
          <label for="end">
            <span
              v-tooltip.top="'The date and time when the TPA calculations will STOP running. The calculations will run from the start date until this date and time.'">
              End Date:
            </span>
          </label>
          <Calendar id="end" v-model="calculationConfig.end" showIcon showButtonBar showTime dateFormat="yy/mm/dd"
            timeFormat="HH:mm" />
          <label for="interval">
            <span
              v-tooltip.top="'The interval at which the TPA calculations will run. For example, if you select `Hourly`, the calculations will run every hour. \n Bluejay is designed to run HOURLY'">
              Interval:
            </span>
          </label>
          <Dropdown id="interval" v-model="calculationConfig.interval" :options="intervalOptions" optionLabel="label"
            optionValue="value" />
        </div>
      </div>

    </template>
    <template #footer>
      <Button label="Modify" @click="saveConfig" class="p-button-success" />
      <Button label="Cancel" @click="handleCancel" class="p-button-danger" />
    </template>
  </Popup>
</template>

<style scoped>
.custom-popup {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 500px;
  z-index: 1000;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #e0e0e0;
}

.popup-body {
  padding: 10px;
}

.popup-footer {
  display: flex;
  justify-content: center;
  gap: 10px;
  padding: 10px;
  border-top: 1px solid #e0e0e0;
}

.close-button {
  background: none;
  border: none;
  cursor: pointer;
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
</style>
