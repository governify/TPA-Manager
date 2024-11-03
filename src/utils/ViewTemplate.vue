<script setup>
import { ref, onMounted, onUnmounted, } from 'vue'
import { useToast } from "primevue/usetoast";
import NavMenu from '@/components/NavMenu.vue';
import Divider from 'primevue/divider';
import { bluejayInfraStore } from '@/stores/bluejayInfra';

const bluejayInfra = bluejayInfraStore();
const toast = useToast();
const isMobile = ref(window.innerWidth <= 768);
const updateIsMobile = () => {
    isMobile.value = window.innerWidth <= 768;
};
onMounted(() => {
    window.addEventListener('resize', updateIsMobile);
});
onUnmounted(() => {
    window.removeEventListener('resize', updateIsMobile);
});

//THIS VIEW FOLLOWS THE DESIGN OF TPA MANAGER IN ORDER TO CREATING A NEW VIEW

</script>
<template>
    <div style="display: grid; justify-items: center;">
        <div class="card">
            <NavMenu />
            <Divider layout="horizontal" />
        </div>
    </div>
</template>

<style scoped></style>