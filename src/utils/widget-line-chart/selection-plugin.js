import { LINE_CHART_RANGE_SELECTION_TABLE } from "../../js/constants";
import StoreService from "../../services/store-service";
import {
  RANGE_SELECTION_ANNOTATION_ID,
  RANGE_SELECTION_BACKGROUND,
  SAMPLE_RANGE_SELECTION_ANNOTATION,
  calculateBoxRange,
} from "./commons";
import _ from "lodash";

let timeoutDragSelection;
const rangeSelectionStorage = new StoreService(LINE_CHART_RANGE_SELECTION_TABLE);

const addRangeSelection = ({ chartInstance, boxRange, pageId, widgetId }) => {
  const selectionId = `${RANGE_SELECTION_ANNOTATION_ID}_${pageId}_${widgetId}_${chartInstance.id}`;

  const rangeSelection = {
    id: selectionId,
    xMax: boxRange.endXValue,
    xMin: boxRange.startXValue,
    yMax: boxRange.endYValue,
    yMin: boxRange.startYValue,
    backgroundColor: RANGE_SELECTION_BACKGROUND,
  };
  if (boxRange.yScaleID) {
    rangeSelection.yScaleID = boxRange.yScaleID;
  }

  const newRangeSelection = {
    ...SAMPLE_RANGE_SELECTION_ANNOTATION,
    ...rangeSelection,
  };

  rangeSelectionStorage.save({
    id: selectionId,
    pageId: pageId,
    chartId: chartInstance.id,
    selection: rangeSelection,
    widgetId,
  });

  chartInstance.config.options.plugins.annotation.annotations = {
    ...chartInstance.config.options.plugins.annotation.annotations,
    [selectionId]: newRangeSelection,
  };

  chartInstance.update();
  return true;
};

export const handleAddSelection = ({ chartInstance, startRangeElement, endRangeElement, pageId, widgetId }) => {
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

      if (isUpdateSelection) addRangeSelection({ chartInstance, boxRange: boxRange, pageId, widgetId });
    }
  }, 5);
};

export const handleDeleteSelection = ({ pageId, chartInstance, widgetId }) => {
  const condition = {
    chartId: chartInstance.id,
  };
  if (pageId) condition.pageId = pageId;
  if (!_.isNil(widgetId)) condition.widgetId = widgetId;

  const allRangeSelections = rangeSelectionStorage.query(condition);
  allRangeSelections.forEach((selectionNote) => {
    const selectionId = selectionNote.id;
    delete chartInstance.config.options.plugins.annotation.annotations[selectionId];
    rangeSelectionStorage.delete(selectionId);
  });

  chartInstance.update();
};

export const getRangeSelections = ({ pageId, chartId, widgetId }) => {
  const condition = {};
  const rangeSelections = {};
  if (pageId) condition.pageId = pageId;
  if (chartId) condition.chartId = chartId;
  if (!_.isNil(widgetId)) condition.widgetId = widgetId;
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

export const getListRangeSelections = ({ pageId }) => {
  const condition = {};
  if (pageId) condition.pageId = pageId;
  const allRangeSelections = rangeSelectionStorage.query(condition);

  return allRangeSelections.map((selectionNote) => ({
    xMin: selectionNote.selection.xMin,
    xMax: selectionNote.selection.xMax,
    yMin: selectionNote.selection.yMin,
    yMax: selectionNote.selection.yMax,
    pageId: selectionNote.pageId,
    chartId: selectionNote.chartId,
  }));
};
