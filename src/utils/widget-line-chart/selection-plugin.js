import { LINE_CHART_RANGE_SELECTION_TABLE } from "../../js/constants";
import StoreService from "../../services/store-service";
import {
  RANGE_SELECTION_ANNOTATION_ID,
  RANGE_SELECTION_BACKGROUND,
  SAMPLE_RANGE_SELECTION_ANNOTATION,
  calculateBoxRange,
} from "./commons";

let timeoutDragSelection;
const rangeSelectionStorage = new StoreService(LINE_CHART_RANGE_SELECTION_TABLE);

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

const addRangeSelection = ({ chartInstance, boxRange, pageId }) => {
  const selectionId = `${RANGE_SELECTION_ANNOTATION_ID}_${pageId}`;

  const rangeSelection = {
    id: selectionId,
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

  rangeSelectionStorage.save({
    id: selectionId,
    pageId: pageId,
    selection: rangeSelection,
  });

  chartInstance.config.options.plugins.annotation.annotations = {
    ...chartInstance.config.options.plugins.annotation.annotations,
    [selectionId]: newRangeSelection,
  };

  chartInstance.update();
  return true;
};

export const handleAddSelection = ({ chartInstance, startRangeElement, endRangeElement, pageId }) => {
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

      if (isUpdateSelection) addRangeSelection({ chartInstance, boxRange: boxRange, pageId });
    }
  }, 5);
};

export const handleDeleteSelection = ({ pageId, chartInstance }) => {
  const condition = {};
  if (pageId) condition.pageId = pageId;

  const allRangeSelections = rangeSelectionStorage.query(condition);
  allRangeSelections.forEach((selectionNote) => {
    const selectionId = selectionNote.id;
    delete chartInstance.config.options.plugins.annotation.annotations[selectionId];
    rangeSelectionStorage.delete(selectionId);
  });

  chartInstance.update();
};

export const getRangeSelections = ({ pageId }) => {
  const condition = {};
  const rangeSelections = {};
  if (pageId) condition.pageId = pageId;
  const allRangeSelections = rangeSelectionStorage.query(condition);

  allRangeSelections.forEach((selectionNote) => {
    const note = selectionNote.selection;
    const newRangeSelection = {
      ...SAMPLE_RANGE_SELECTION_ANNOTATION,
      xMax: note.xMax,
      xMin: note.xMin,
      yMax: note.yMax,
      yMin: note.yMin,
      backgroundColor: RANGE_SELECTION_BACKGROUND,
    };
    rangeSelections[selectionNote.id] = newRangeSelection;
  });
  return { rangeSelections };
};
