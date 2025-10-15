<template>
  <Popup v-if="true" @close="handleCancel">
    <template #header>
      <span>Notifications Config: {{ props.course.classId }}</span>
    </template>
    <template #body>
      <div class="flex flex-column gap-2">
        <div class="edit-card gap-2">
          <h3>General Settings</h3>
          <label for="adminNotificationsInterval">
            <span v-tooltip.top="'This interval will be used in new notifications only (any service).'">
              Select Interval:
            </span>
          </label>
          <Dropdown id="adminNotificationsInterval" v-model="adminNotificationsInterval" :options="intervalOptions"
            optionLabel="label" optionValue="value" filter :showClear="true">
          </Dropdown>
        </div>
        <div class="edit-card gap-2">
          <h3>Email Notifications</h3>
          <label for="emailAdm">
            <span v-tooltip.top="'List of admin emails that will receive notifications.'">
              Admin Email:
            </span>
          </label>
          <div v-for="(email, index) in emailAdm" :key="index" class="flex items-center gap-2 ">
            <InputText v-model="emailAdm[index]" placeholder="Admin Email" class="flex-grow" />
            <Button icon="pi pi-trash" class="p-button-danger p-button-sm" @click="removeEmail(index)" />
          </div>
          <div class="flex items-center gap-2">
            <InputText v-model="newEmail" placeholder="Add new email" class="flex-grow" @keyup.enter="addEmail" />
            <Button label="Add" icon="pi pi-plus" class="p-button-primary p-button-sm" @click="addEmail" />
          </div>
        </div>
        <div class="edit-card">
          <h3>Slack Notifications</h3>
          <label for="slackWebHook">
            <span v-tooltip.top="'Slack webhook URL of the admin channel. Notifications will be sent to this channel.'">
              Admin Slack Channel Webhook:
            </span>
          </label>
          <Textarea id="slackWebHook" v-model="slackWebHook" placeholder="Admin webhook" class="w-full" rows="3" />
        </div>
      </div>
    </template>
    <template #footer>
      <Button label="Save" @click="saveConfig" class="p-button-success" />
      <Button label="Close" @click="handleCancel" class="p-button-danger" />
    </template>
  </Popup>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import Button from 'primevue/button';
import Popup from '../Popup.vue';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import { useToast } from 'primevue/usetoast';
import { bluejayInfraStore } from '@/stores/bluejayInfra';
import { intervalOptions } from './configurations';

const props = defineProps({
  course: Object
});

const emit = defineEmits(['updateCourse', 'close']);

const bluejayInfra = bluejayInfraStore();
const SCOPES_URL = `${bluejayInfra.SCOPE_MANAGER_URL}/api/v1/scopes/development/`;
const authorization = ref(localStorage.getItem('auth'));
const slackWebHook = ref('');
const emailAdm = ref([]);
const newEmail = ref('');
const adminNotificationsInterval = ref(86400);

const loadConfig = () => {
  if (!props.course || !props.course.classId) return;
  const notifications = props.course.notifications || {};
  const credentials = notifications.credentials || {};
  const config = notifications.config || {};

  slackWebHook.value = credentials.slack || '';
  emailAdm.value = credentials.email ? credentials.email.split(',') : [];
  adminNotificationsInterval.value = config.interval || 86400;
};

const saveConfig = async () => {
  if (!props.course || !props.course.classId) return;
  const courseId = props.course.classId;
  const notifications = {
    credentials: {
      slack: slackWebHook.value,
      email: emailAdm.value.join(','),
    },
    config: {
      interval: adminNotificationsInterval.value,
    }
  };
  const courseWithNotifications = { notifications };
  try {
    const module = await import('axios');
    const axios = module.default;

    const response = await axios.put(`${SCOPES_URL}${courseId}`, courseWithNotifications, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization.value,
      }
    });

    toast.add({ severity: 'success', summary: 'Success', detail: 'Configuration saved successfully.', life: 3000 });
    emit('updateCourse');
    emit('close');

  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to save configuration.', life: 3000 });
    console.error('Error saving configuration:', error);
  }
};

const toast = useToast();

const addEmail = () => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (newEmail.value && emailPattern.test(newEmail.value)) {
    emailAdm.value.push(newEmail.value);
    newEmail.value = '';
    toast.add({ severity: 'warn', summary: 'Save Changes', detail: 'Click Save to apply changes. Email added.', life: 3000 });
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Invalid email address.', life: 3000 });
  }
};

const removeEmail = (index) => {
  emailAdm.value.splice(index, 1);
  toast.add({ severity: 'warn', summary: 'Save Changes', detail: 'Click Save to apply changes. Email removed.', life: 3000 });
};

const handleCancel = () => {
  emit('close');
};

watch(() => props.course, (newVal) => {
  if (newVal && props.course && props.course.classId) {
    loadConfig();
  }
});

onMounted(() => {
  if (props.course && props.course.classId) {
    console.log(`Course config dialog mounted for course: ${props.course.classId}`);
    console.log(props.course);
    loadConfig();
  }
});
</script>

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

.flex-column {
  display: flex;
  flex-direction: column;
}
</style>