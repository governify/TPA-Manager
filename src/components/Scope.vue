<script setup>
import { ref, watch } from 'vue';
import { useTpaEditionStore } from '@/stores/tpaEdition';
import { useTPAMode } from '@/utils/tpaMode.js';

import Checkbox from 'primevue/checkbox';
import Calendar from 'primevue/calendar';

const { tpaEditMode } = useTPAMode();

const props = defineProps({
  fieldName: {
    type: String
  }
});

const tpaEditionStore = useTpaEditionStore()

const isMemberNeeded = ref(tpaEditionStore.getTpaField(props.fieldName)?.member?.default);
const validityInitial = ref(new Date(tpaEditionStore.getTpaField('context.validity.initial')));

watch(validityInitial, (newValue) => {
  tpaEditionStore.updateTpaField('context.validity.initial', newValue.toISOString());
});

</script>

<template>

  <div class="flex flex-column gap-2">
    <div class="flex align-items-center gap-2">
      <span>Project:</span>
      <span>{{ tpaEditionStore.getTpaField(fieldName + '.project.default') }}</span>
    </div>

    <div class="flex align-items-center gap-2">
      <span>Course:</span>
      <span>{{ tpaEditionStore.getTpaField(fieldName + '.class.default') }}</span>
    </div>
    <div class="flex align-items-center gap-2">
      <span>Template:</span>
      <span>{{ tpaEditionStore.getTpaField('templateId') }}</span>
    </div>

    <div class="flex gap-2">
      <span>Will calculations by member be required?</span>
      <Checkbox v-model="isMemberNeeded" :disabled="!tpaEditMode" aria-label="memberNeeded" :binary="true" trueValue="*" falseValue="null" @change="tpaEditionStore.updateTpaField(fieldName + '.member.default', isMemberNeeded)" />
    </div>

    <div class="flex align-items-center gap-2">
      <span>Agreement validity start:</span>
      <Calendar v-model="validityInitial" :disabled="!tpaEditMode" showIcon showTime :manualInput="false" />
    </div>

  </div>

</template>