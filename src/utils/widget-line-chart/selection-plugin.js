export const onSelectRegion = ({ chartInstance, isSelectRegion }) => {
  if (!isSelectRegion) {
    chartInstance.config.options.plugins.zoom.pan.enabled = false;
  } else {
    chartInstance.config.options.plugins.zoom.pan.enabled = true;
  }
  chartInstance.update();
};
