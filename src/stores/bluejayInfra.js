import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const bluejayInfraStore = defineStore("bluejayInfra", () => {
  const REGISTRY_URL = ref(process.env.REGISTRY_URL || "http://localhost:5400");
  const COLLECTOR_EVENTS_URL = ref(
    process.env.COLLECTOR_EVENTS_URL || "http://localhost:5500"
  );
  const DASHBOARD_URL = ref(process.env.DASHBOARD_URL || "http://localhost:5600");
  const REPORTER_URL = ref(process.env.REPORTER_URL || "http://localhost:5300");

  const isProductionEnvironment = ref(localStorage.getItem("isProductionEnvironment") === "true");
  const ASSETS_MANAGER_URL = computed(() => {
    if (process.env.ASSETS_MANAGER_URL) {
      return process.env.ASSETS_MANAGER_URL;
    }
    if (isProductionEnvironment.value) {
      return "http://bluejay-assets-manager";
    }
    return "http://host.docker.internal:5200";
  });

  const SCOPE_MANAGER_URL = computed(() => {
    if (process.env.SCOPE_MANAGER_URL) {
      return process.env.SCOPE_MANAGER_URL;
    }
    if (isProductionEnvironment.value) {
      return "http://bluejay-scope-manager";
    }
    return "http://host.docker.internal:5700";
  });

  return {REGISTRY_URL, COLLECTOR_EVENTS_URL, isProductionEnvironment, ASSETS_MANAGER_URL, SCOPE_MANAGER_URL, DASHBOARD_URL, REPORTER_URL,};
});



