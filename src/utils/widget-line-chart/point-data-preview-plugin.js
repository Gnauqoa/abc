import { LINE_CHART_POINT_DATA_PREVIEW_TABLE } from "../../js/constants";
import StoreService from "../../services/store-service";
import {
  POINT_DATA_PREVIEW_BACKGROUND,
  PREFIX_POINT_DATA_PREVIEW,
  SAMPLE_POINT_DATA_PREVIEW,
  clearAllSelectedPoints,
  prepareContentNote,
} from "./commons";
import { createHiddenDataLineId } from "./legend-plugin";

const pointDataPreviewsStorage = new StoreService(LINE_CHART_POINT_DATA_PREVIEW_TABLE);

export const getAllCurrentPointDataPreview = ({ pageId, widgetId, sensorInfo, dataRunId, hiddenDataLineIds }) => {
  const condition = {};
  if (pageId) condition.pageId = pageId;
  if (widgetId != undefined) condition.widgetId = widgetId;
  if (dataRunId) condition.dataRunId = dataRunId;
  if (sensorInfo) condition.sensorInfo = sensorInfo;

  const allPointDataPreviews = pointDataPreviewsStorage.query(condition);
  const PointDataPreviews = {};

  allPointDataPreviews.forEach((data) => {
    const dataRunId = data.dataRunId;
    const sensorInfo = data.sensorInfo;
    const hiddenDataLineId = createHiddenDataLineId({ dataRunId, sensorInfo });
    if (hiddenDataLineIds?.has(hiddenDataLineId)) return;

    const PointDataPreview = data.label;
    const newLabelNote = {
      ...SAMPLE_POINT_DATA_PREVIEW,
      content: PointDataPreview.content,
      backgroundColor: PointDataPreview.backgroundColor,
      xValue: PointDataPreview.xValue,
      yValue: PointDataPreview.yValue,
      xAdjust: PointDataPreview.xAdjust,
      yAdjust: PointDataPreview.yAdjust,
      yScaleID: PointDataPreview.yScaleID,
    };

    PointDataPreviews[PointDataPreview.id] = newLabelNote;
  });
  return PointDataPreviews;
};

export const addPointDataPreview = ({
  chartInstance,
  pageId,
  sensorInfo,
  dataRunId,
  content,
  selectedPointElement,
  widgetId = 0,
  yScaleId = "y",
  dataPointIndex,
  xAdjust = 45,
}) => {
  const xValueNoteElement = chartInstance.scales.x.getValueForPixel(selectedPointElement.element.x);
  const yValueNoteElement = chartInstance.scales[yScaleId].getValueForPixel(selectedPointElement.element.y);
  const noteId = createPointDataPreviewId({
    pageId,
    dataRunId,
    sensorInfo,
    dataPointIndex,
    widgetId,
  });
  const newNote = {
    id: noteId,
    content: content,
    backgroundColor: POINT_DATA_PREVIEW_BACKGROUND,
    xValue: xValueNoteElement,
    yValue: yValueNoteElement,
    xAdjust: xAdjust,
    yAdjust: 0,
    widgetId,
  };
  const otherPointData = pointDataPreviewsStorage.query({
    pageId,
    widgetId,
  });
  if (otherPointData && otherPointData.length > 0) {
    otherPointData.forEach((item) => {
      pointDataPreviewsStorage.delete(item.id);
      delete chartInstance.config.options.plugins.annotation.annotations[item.id];
    });
  }
  pointDataPreviewsStorage.save({
    id: noteId,
    label: newNote,
    pageId: pageId,
    widgetId,
    sensorInfo: sensorInfo,
    dataRunId,
  });

  const newNoteElement = {
    ...SAMPLE_POINT_DATA_PREVIEW,
    ...newNote,
  };

  chartInstance.config.options.plugins.annotation.annotations = {
    ...chartInstance.config.options.plugins.annotation.annotations,
    [noteId]: newNoteElement,
  };
  chartInstance.update();

  return true;
};

export const createPointDataPreviewId = ({ pageId, widgetId, dataRunId, sensorInfo, dataPointIndex }) => {
  const dataId = `${PREFIX_POINT_DATA_PREVIEW}_${pageId}_${widgetId}_${dataRunId}_${sensorInfo}_${dataPointIndex}`;
  return dataId;
};
