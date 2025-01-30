<template>
    <div class="overlay" @click="$emit('close')">
        <div class="custom-popup" @click.stop>
            <div class="row">
                <div class="popup-header">
                    <slot name="header"></slot>
                </div>
                <Button icon="pi pi-times" @click="$emit('close')" class="btn" />
            </div>
            <div class="popup-body">
                <ScrollPanel style="width: 95%; height: 100%; margin-bottom: 15px; padding: 10px;">

                    <slot name="body" class="margin-5"></slot>
                    <ScrollTop target="parent" :threshold="300" icon="pi pi-angle-up" />
                </ScrollPanel>
            </div>
            <div class="popup-footer">
                <slot name="footer"></slot>
            </div>
        </div>
    </div>
</template>

<script setup>
import Button from 'primevue/button';
import ScrollPanel from 'primevue/scrollpanel';
import ScrollTop from 'primevue/scrolltop';
</script>

<style scoped>
.overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 999;
}

.custom-popup {
    background: white;
    padding: 10px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    width: 60vh;
    z-index: 1000;
    overflow: hidden;

}

.popup-header {
    padding: 10px;
    display: flex;
    overflow: hidden;
}

.popup-body {
    padding: 10px;
    display: flex;
    height: 50vh;
    width: 100%;
    overflow: hidden;
}

.popup-footer {
    overflow: hidden;
    display: flex;
    justify-content: center;
    gap: 10px;
    padding: 10px;
    border-top: 1px solid #e0e0e0;
}


.row {
    padding: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    border-bottom: 1px solid #e0e0e0;
}
</style>
