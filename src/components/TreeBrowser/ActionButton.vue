<script setup lang="ts">
import Button from 'primevue/button';

const props = defineProps<{
    disabled?: boolean;
    icon: string;
    color?: string;
}>();


const emit = defineEmits<{
    turnOn: [];
    turnOff: [];
}>();

</script>

<template>
    <div class="action-button" :class="{ 'disabled-container': disabled }" :style="{ background: color }">
        <Button
            severity="danger"
            :disabled="disabled"
            @click="emit('turnOff')"
            :class="['action-btn', 'side', 'left', { 'disabled-btn': disabled }]"
        >
            <i class="pi pi-stop-circle" style="font-size: xx-small;"></i>
        </Button>
        <span class="center side" :class="{ 'disabled-btn': disabled }" :style="{ background: color }">
            <i :class="icon" style="font-size: large;"></i>
        </span>
        <Button
            severity="success"
            :disabled="disabled"
            @click="emit('turnOn')"
            :class="['action-btn', 'side', 'right', { 'disabled-btn': disabled }]"
        >
            <i class="pi pi-caret-right" style="font-size: xx-small;"></i>
        </Button>
    </div>
</template>
<style scoped>
.action-button {
    display: flex;
    justify-content: center;
    flex-direction: row;
    align-items: center;
    border: 0px;
    border-radius: 4px;
    height: 40px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
    transition: background-color 0.3s, border-color 0.3s, transform 0.3s;
}

i {
    color: white;
}

.left, .right {
    background-color: #ffffff22 !important;
    border: 1px solid #3b3b3b !important;
}

.left {
    border-radius: 4px 0 0 4px !important;
}

.left:hover {
    background-color: #770000 !important;
}

.center {
    display: flex;
    align-items: center;
    border-top: 1px solid #3b3b3b !important;
    border-bottom: 1px solid #3b3b3b !important;
}

.side {
    display: flex !important;
    padding: 0 5px !important;
    height: 100%;
}

.right {
    border-radius: 0 4px 4px 0 !important;
}

.right:hover {
    background-color: #007700 !important;
}

.disabled-btn {
    opacity: 0.5 !important;
    cursor: not-allowed !important;
    background-color: gray !important;
    border-color: gray !important;
}

.disabled-container {
    pointer-events: none !important;
    opacity: 0.5 !important;
    background-color: gray !important;
}
</style>