const deleteOldCalculations = async (course) => {
    const projectIds = course.projects.map(project => project.projectId);
    for (const projectId of projectIds) {
      try {
        axios.delete(`${bluejayInfra.DIRECTOR_URL}/api/v1/calculations/${projectId}`);
      } catch (error) {
        console.warn("Calculation was not active in the first place. Project:", projectId, error);
      }
    }
  };
  
  const activateAllCourseTPACalculation = async (course) => {
    let data = { someValue: 'someValue' }; //To force not fetching data inside the loop
    try {
      const response = await axios.get(`${bluejayInfra.ASSETS_MANAGER_URL}/api/v1/public/director/${course.classId}.json`);
      data = response.data;
    } catch (error) {
      console.warn("Error fetching aseets computation config JSON data for course with id:", course.classId, error);
    }
    for (const project of course.projects) {
      try {
        await activateTPACalculation(project.projectId, data);
      } catch (error) {
        console.error("Error activating calculation for project with id:", project.projectId, error);
      }
    }
  };
  const activateTPACalculation = async (projectId, courseCalcConfig = null) => {
    try {
      if (!courseCalcConfig) {//Config is not passed, fetch it
        try {
          const response = await axios.get(`${bluejayInfra.ASSETS_MANAGER_URL}/api/v1/public/director/${projectId}.json`);
          courseCalcConfig = response.data;
  
        } catch (error) {
          console.warn("Cannot find calculation configuration for this course. Please add it in assets. Poject:", projectId, error);
          toast.add({ severity: 'warn', summary: 'Warning', detail: 'Cannot find calculation configuration for this course. Please add it in assets.', life: 5000 });
        }
      }
      if (!courseCalcConfig || !courseCalcConfig.init || !courseCalcConfig.end || !courseCalcConfig.interval) { //If data is not fetched or not complete, use default values 
        courseCalcConfig = {
          init: new Date().toISOString(),
          end: new Date(Date.now() + TpaCalcDuration).toISOString(),
          interval: 3600000,
        };
      }
      const task = {
        id: projectId,
        script: `${bluejayInfra.DIRECTOR_URL}/api/v1/public/director/${projectId}.js`,
        running: true,
        config: {
          agreementId: projectId
        },
        init: courseCalcConfig.init,
        end: courseCalcConfig.end,
        //one hour interval
        interval: courseCalcConfig.interval,
      };
      const response = await axios.post(`${bluejayInfra.DIRECTOR_URL}/api/v1/tasks`, task);
      if (response.status === 200) {
        toast.add({ severity: 'success', summary: 'Success', detail: 'Calculation activated successfully', life: 5000 });
      } else {
        toast.add({ severity: 'error', summary: 'Error', detail: response.data.message, life: 5000 });
      }
    } catch (error) {
      console.error("Error activating calculation for project with id:", projectId, error);
      toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to activate calculation', life: 5000 });
    }
  };
  
  const optimizeCalculationPeriod = async (config) => {
    const script = await axios.get("/scripts/optimizeCalculationPeriod.js");
    const payload = {
      scriptText: script.data,
      scriptConfig: config,
    };
    const url = `${bluejayInfra.DIRECTOR_URL}/api/v1/tasks/test`;
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization.value,
      },
    });
    if (response.status === 200) {
      toast.add({ severity: 'success', summary: 'Success', detail: 'Optimization triggered successfully', life: 5000 });
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: response.data.message, life: 5000 });
    }
  };
  
  const activateCourse = async (course) => {
    try {
      
      // Check if the director is functioning
      try {
        console.log("directorUrl:", bluejayInfra.DIRECTOR_URL);
        await axios.get(bluejayInfra.DIRECTOR_URL);
      } catch (error) {
        if (!error.response) { // Just stop if the director is not responding
          console.log("Error activating course:", error);
          toast.add({ severity: 'error', summary: 'Error', detail: '"Director" service, responsible for calculations, is not responding. Please try again later.', life: 5000 });
          return;
        }
      }
  
  
      // Delete old calculations
      await deleteOldCalculations(course);
  
      // Activate calculations for groups in the course
      await activateAllCourseTPACalculation(course);
  
      // Optimize calculation period
      const optimizeConfig = {
        "filenameMustIncludeAll": ["tpa-"], // Only consider TPA calculations, not inculing course name means calculations for all courses will be considered
        "startingTime": "10:00",
        "endingTime": "10:59",
        "batchSize": 1
      };
      await optimizeCalculationPeriod(optimizeConfig);
  
      toast.add({ severity: 'success', summary: 'Success', detail: 'Course activated successfully', life: 5000 });
    } catch (error) {
      console.error("Error activating course:", error);
      toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to activate course', life: 5000 });
    }
  };

  // 7 months in milliseconds
const TpaCalcDuration = 7 * 30 * 24 * 60 * 60 * 1000;