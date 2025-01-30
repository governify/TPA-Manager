<script setup>
import ScrollPanel from 'primevue/scrollpanel';
import ScrollTop from 'primevue/scrolltop';

const props = defineProps({
  project: Object
});
</script>

<template>
  <div class="details-container">
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
    <div class="notifications-section">
      <h3 style="margin-bottom: 5px;">Notifications</h3>
      <pre>{{ JSON.stringify(project.notifications, null, 2) }}</pre>
    </div>  
  </div>
</template>

<style scoped>
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
</style>
