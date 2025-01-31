let intervalOptions = [
  { label: 'Continuously (Development only)', value: 1000 * 8 },// 8 seconds
  { label: 'Hourly', value: 1000 * 60 * 60 },
  { label: 'Daily', value: 1000 * 60 * 60 * 24 },
  { label: 'Weekly', value: 1000 * 60 * 60 * 24 * 7 },
];


const TpaCalcDuration = 7 * 30 * 24 * 60 * 60 * 1000; // 7 months

const getDefaultCalculationConfig = () => {
  return {
    init: new Date(),
    end: new Date(Date.now() + TpaCalcDuration),
    //Default is Hourly
    interval: intervalOptions.filter(interval => interval.label === 'Hourly')[0].value
  }
};



export { intervalOptions, getDefaultCalculationConfig };

export default {
  intervalOptions,
  getDefaultCalculationConfig,
};