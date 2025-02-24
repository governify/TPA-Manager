import { defineStore } from "pinia";
import { ref } from "vue";

export const useBluejayInfraStore = defineStore("bluejayInfra", () => {
  const config = ref({});

  const REGISTRY_URL = ref("http://localhost:5400");
  const COLLECTOR_EVENTS_URL = ref("http://localhost:5500");
  const DASHBOARD_URL = ref("http://localhost:5600");
  const REPORTER_URL = ref("http://localhost:5300");
  const DIRECTOR_URL = ref("http://localhost:5800");
  const ASSETS_MANAGER_URL = ref("http://localhost:5200");
  const SCOPE_MANAGER_URL = ref("http://localhost:5700");

  const loadConfig = async () => {
    const response = await fetch("/config.json");
    const data = await response.json();
    config.value = data;

    REGISTRY_URL.value = data.VITE_REGISTRY_URL || "http://localhost:5400";
    COLLECTOR_EVENTS_URL.value = data.VITE_COLLECTOR_EVENTS_URL || "http://localhost:5500";
    DASHBOARD_URL.value = data.VITE_DASHBOARD_URL || "http://localhost:5600";
    REPORTER_URL.value = data.VITE_REPORTER_URL || "http://localhost:5300";
    DIRECTOR_URL.value = data.VITE_DIRECTOR_URL || "http://localhost:5800";
    ASSETS_MANAGER_URL.value = data.VITE_ASSETS_MANAGER_URL || "http://localhost:5200";
    SCOPE_MANAGER_URL.value = data.VITE_SCOPE_MANAGER_URL || "http://localhost:5700";
  };

  return {
    loadConfig,
    REGISTRY_URL,
    COLLECTOR_EVENTS_URL,
    DASHBOARD_URL,
    REPORTER_URL,
    DIRECTOR_URL,
    ASSETS_MANAGER_URL,
    SCOPE_MANAGER_URL
  };
});

export const bluejayInfraStore = useBluejayInfraStore;
