import { ref } from 'vue';

const showHiddenCourses = ref(false); 

export function changeShowHidden() {
  return { showHiddenCourses };
}
