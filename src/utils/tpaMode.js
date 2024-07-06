import { ref } from 'vue';

const tpaEditMode = ref(false); 

export function useTPAMode() {
  return { tpaEditMode };
}
