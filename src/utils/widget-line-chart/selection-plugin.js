import { abs } from "mathjs";
import {
  RANGE_SELECTION_ANNOTATION_ID,
  RANGE_SELECTION_BACKGROUND,
  SAMPLE_RANGE_SELECTION_ANNOTATION,
  calculateBoxRange,
} from "./commons";

let timeoutDragSelection;

export const onSelectRegion = ({ chartInstance, isSelectRegion }) => {
  if (!isSelectRegion) {
    chartInstance.config.options.plugins.zoom.pan.enabled = false;
    chartInstance.config.options.plugins.zoom.zoom.pinch.enabled = false;
    chartInstance.config.options.plugins.zoom.zoom.wheel.enabled = false;
  } else {
    chartInstance.config.options.plugins.zoom.pan.enabled = true;
    chartInstance.config.options.plugins.zoom.zoom.pinch.enabled = true;
    chartInstance.config.options.plugins.zoom.zoom.wheel.enabled = true;
  }
  chartInstance.update();
};

const addRangeSelection = ({ chartInstance, boxRange }) => {
  delete chartInstance.config.options.plugins.annotation.annotations[RANGE_SELECTION_ANNOTATION_ID];

  const rangeSelection = {
    id: RANGE_SELECTION_ANNOTATION_ID,
    xMax: boxRange.endXValue,
    xMin: boxRange.startXValue,
    yMax: boxRange.endYValue,
    yMin: boxRange.startYValue,
    backgroundColor: RANGE_SELECTION_BACKGROUND,
  };
  const newRangeSelection = {
    ...SAMPLE_RANGE_SELECTION_ANNOTATION,
    ...rangeSelection,
  };
  chartInstance.config.options.plugins.annotation.annotations = {
    ...chartInstance.config.options.plugins.annotation.annotations,
    [RANGE_SELECTION_ANNOTATION_ID]: newRangeSelection,
  };

  chartInstance.update();
  return true;
};

export const handleAddSelection = ({ chartInstance, startRangeElement, endRangeElement }) => {
  clearTimeout(timeoutDragSelection);
  timeoutDragSelection = setTimeout(() => {
    if (startRangeElement) {
      const boxRange = calculateBoxRange({
        startElement: startRangeElement,
        endElement: endRangeElement,
        chartInstance,
      });

      const isUpdateSelection =
        boxRange.startXValue !== boxRange.endXValue && boxRange.startYValue !== boxRange.endYValue;

      if (isUpdateSelection) addRangeSelection({ chartInstance, boxRange: boxRange });
    }
  }, 10);
};
