<script setup>
import { ref, onMounted, onUnmounted, } from 'vue'
import NavMenu from '@/components/NavMenu.vue';
import Divider from 'primevue/divider';
import axios from 'axios';
import ProgressSpinner from 'primevue/progressspinner';
import Button from 'primevue/button';
const catalogueData = ref({ metrics: [], guarantees: [] })
const loading = ref(true)
const isMobile = ref(window.innerWidth <= 768);
const updateIsMobile = () => {
  isMobile.value = window.innerWidth <= 768;
};
onMounted(async () => {
  const data = await getCatalogueData();
  // Add a delay between each metric/guarantee to make the transition look better
  for (let i = 0; i < data.metrics.length; i++) {
    setTimeout(() => {
      catalogueData.value.metrics.push(data.metrics[i]);
    }, i * 50);
  }

  for (let i = 0; i < data.guarantees.length; i++) {
    setTimeout(() => {
      catalogueData.value.guarantees.push(data.guarantees[i]);
    }, 1000 + i * 50);
  }
  window.addEventListener('resize', updateIsMobile);
});
onUnmounted(() => {
  window.removeEventListener('resize', updateIsMobile);
});
async function getCatalogueData() {
  try {
    const response = await axios.get('https://api.github.com/repos/governify/governify-examples/contents/metrics/event-collector/metricsGuarantees.json');
    const parsedResponse = JSON.parse(atob(response.data.content));

    for (let metric of parsedResponse.metrics) {
      for (let key in metric.dsl) {
        const { scope, computing, ...data } = metric.dsl[key].metric;
        metric.dsl = data;
      }
    }

    for (let guarantee of parsedResponse.guarantees) {
      guarantee.objective = guarantee.of[0].objective
    }

    loading.value = false

    return parsedResponse;
  } catch (error) {
    console.log("Error obtaining TPs catalogue: ", error);
  }
}

const scrollToGuarantees = () => {
  document.getElementById("guaranteesSection").scrollIntoView({ behavior: 'smooth' });
};

</script>
<template>
  <div style="display: grid; justify-items: center;">
    <div class="card ">
      <NavMenu />
      <Divider layout="horizontal" />
      <div v-if="loading" class="flex flex-column m-5">
        <ProgressSpinner class="text-center" strokeWidth="4" />
        <h3 class="text-center">Loading...</h3>
      </div>
      <div v-else class="content">
        <div class="metrics-header">
          <span class="title">Metrics</span>
          <Button label="Go to Guarantees" @click="scrollToGuarantees" :pt="{
        root: { class: 'bg-yellow-300 border-yellow-300 hover:bg-yellow-500 hover:border-yellow-500', style: 'height: 27px;' },
      }" raised />
        </div>
        <div class="metrics-section">
          <TransitionGroup name="list">
            <div v-for="metric in catalogueData.metrics" :key="metric.name" class="metrics-card">
              <div class="metrics-card-header text-center">
                {{ metric.name }}
              </div>
              <div class="text-center">
                <p>{{ metric.description }}</p>
              </div>

              <div class="pre-visualization">
                <pre class="preOverflow">
  {{ JSON.stringify(metric.dsl, null, 2) }}
</pre>
              </div>
            </div>
          </TransitionGroup>
        </div>
        <div id="guaranteesSection" class="guarantees-header">
          <span class="title">Guarantees</span>
        </div>
        <div class="guarantees-section">
          <TransitionGroup name="list">
            <div v-for="guarantee in catalogueData.guarantees" :key="guarantee.id" class="guarantee-card">
              <div class="guarantees-card-header text-center">
                {{ guarantee.id }}
              </div>
              <div class="text-center">
                <p>{{ guarantee.description }}</p>
              </div>
              <div class="pre-visualization">
                <pre class="objective">{{ JSON.stringify(guarantee.objective, null, 2) }}</pre>
              </div>
            </div>
          </TransitionGroup>
        </div>


      </div>
    </div>
  </div>

</template>

<style scoped>
.list-enter-active {
  animation: enterAnimation 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}

@keyframes enterAnimation {
  0% {
    opacity: 0;
    transform: translateY(30px) scale(0.5);
  }

  50% {
    opacity: 0.75;
    transform: translateY(15px) scale(1.1);
  }

  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
.objective {
  overflow-wrap: break-word;
  max-width: 70%;
}
.content {
  display: flex;
  justify-content: center;
  flex-direction: column;
}
.metrics-section {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  width: 100%;
  gap: 20px;
}
.guarantees-section {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  width: 100%;
  gap: 20px;
}
.pre-visualization {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}

.metrics-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.metrics-card-header,.guarantees-card-header {
  width: 100%;
  text-align: center;
  font-size: min(max(15px, 2.5vw), 15px);
  font-weight: bold;
  overflow-wrap: break-word;
}

.guarantee-card,
.metrics-card {
  flex: 0 1 calc(50% - 20px);
  border: 1px solid #10B981;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-wrap: break-word;
}

.guarantees-header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 20px;
  margin-bottom: 10px;
}

.title {
  font-size: min(max(30px, 4vw), 35px) !important;
  margin-bottom: 8px;
  font-weight: 600;
}
@media (max-width: 1370px) {
  .guarantees-section{
    flex-direction: column;
  }
    
  .guarantee-card {
    flex: 0 1 100%;
    max-width: 100%;
  }
}
@media (max-width: 1040px) {
  .metrics-section{
    flex-direction: column;
  }
  .metrics-card {
    flex: 0 1 100%;
    max-width: 100%;
  }
}

@media (max-width: 768px) {
  .metrics-header {
    flex-direction: column;
    gap: 0;
    margin-bottom: 15px;
  }

  .guarantees-header {
    flex-direction: column;
    margin-bottom: 15px;
    margin-top: 15px;
  }

  .metrics-header span {
    margin-bottom: 0 !important;
  }
}

</style>