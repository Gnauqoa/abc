import { LINE_CHART_DELTA_TABLE } from "../../js/constants";
import StoreService from "../../services/store-service";
import {
  DELTA_BOX_BACKGROUND,
  DELTA_BOX_BORDER,
  PREFIX_DELTA,
  SAMPLE_DELTA_BOX,
  SAMPLE_DELTA_POINT,
  SAMPLE_LABEL_NOTE,
} from "./commons";
import { createHiddenDataLineId } from "./legend-plugin";
import _ from "lodash";

const deltasStorage = new StoreService(LINE_CHART_DELTA_TABLE);

export const getAllCurrentDeltas = ({ pageId, widgetId, sensorInfo, dataRunId, hiddenDataLineIds }) => {
  const condition = {};
  if (pageId) condition.pageId = pageId;
  if (widgetId != undefined) condition.widgetId = widgetId;
  if (dataRunId) condition.dataRunId = dataRunId;
  if (sensorInfo) condition.sensorInfo = sensorInfo;

  const deltas = deltasStorage.query(condition);
  let pointDeltas = {};

  deltas.forEach((delta) => {
    const dataRunId = delta.dataRunId;
    const sensorInfo = delta.sensorInfo;
    const hiddenDataLineId = createHiddenDataLineId({ dataRunId, sensorInfo });
    if (hiddenDataLineIds?.has(hiddenDataLineId)) return;

    const newDeltas = getChartAnnotationByDelta(delta);
    pointDeltas = {
      ...pointDeltas,
      ...newDeltas,
    };
  });
  return pointDeltas;
};

export const getChartAnnotationByDelta = (delta) => {
  const pointDeltas = {};

  const newDelta = {
    ...SAMPLE_DELTA_POINT,
    sensorInfo: delta.sensorInfo,
    xValue: delta.xMin,
    yValue: delta.yMin,
  };
  pointDeltas[delta.id] = newDelta;

  const newDeltaMax = {
    ...SAMPLE_DELTA_POINT,
    sensorInfo: delta.sensorInfo,
    xValue: delta.xMax,
    yValue: delta.yMax,
  };
  pointDeltas[`${delta.id}_max`] = newDeltaMax;

  const deltaBox = {
    ...SAMPLE_DELTA_BOX,
    sensorInfo: delta.sensorInfo,
    xMax: delta.xMax,
    xMin: delta.xMin,
    yMax: delta.yMax,
    yMin: delta.yMin,
  };
  pointDeltas[`${delta.id}_box`] = deltaBox;

  const deltaX = {
    ...SAMPLE_LABEL_NOTE,
    sensorInfo: delta.sensorInfo,
    backgroundColor: DELTA_BOX_BACKGROUND,
    borderColor: DELTA_BOX_BORDER,
    content: [`Δx=${Math.round(Number(delta.xMax) - Number(delta.xMin))}`],
    xValue: (Number(delta.xMax) + Number(delta.xMin)) / 2,
    yValue: Math.min(Number(delta.yMax), Number(delta.yMin)),
    yAdjust: 60,
  };
  pointDeltas[`${delta.id}_x`] = deltaX;

  const deltaY = {
    ...SAMPLE_LABEL_NOTE,
    sensorInfo: delta.sensorInfo,
    backgroundColor: DELTA_BOX_BACKGROUND,
    borderColor: DELTA_BOX_BORDER,
    content: [`Δy=${Math.round(Number(delta.yMax) - Number(delta.yMin))}`],
    xValue: Math.max(Number(delta.xMax), Number(delta.xMin)),
    yValue: (Number(delta.yMax) + Number(delta.yMin)) / 2,
    xAdjust: 60,
  };
  pointDeltas[`${delta.id}_y`] = deltaY;

  return pointDeltas;
};

export const addDelta = ({ pageId, widgetId, dataRunId, sensorInfo, xMin, yMin, xMax, yMax, chartInstance }) => {
  const deltaId = createLabelDeltaId({
    pageId,
    widgetId,
    dataRunId,
    sensorInfo,
  });

  const newDelta = {
    id: deltaId,
    pageId,
    widgetId,
    sensorInfo,
    dataRunId,
    xMin,
    yMin,
    xMax,
    yMax,
  };

  deltasStorage.save(newDelta);

  const annotation = getChartAnnotationByDelta(newDelta);
  Object.keys(annotation).forEach((key) => {
    if (!_.get(chartInstance, `config.options.plugins.annotation.annotations[${key}]`)) {
      chartInstance.config.options.plugins.annotation.annotations[key] = annotation[key];
    }
  });
  chartInstance.update();

  return newDelta;
};

export const createLabelDeltaId = ({ pageId, widgetId, dataRunId, sensorInfo }) => {
  const count = deltasStorage.query({ pageId, widgetId }).length;
  const deltaId = `${PREFIX_DELTA}_${pageId}_${widgetId}_${dataRunId}_${sensorInfo}_${count}`;
  return deltaId;
};

export const findFirstDeltaByValue = ({ pageId, widgetId, sensorInfo, dataRunId, xValue, yValue }) => {
  const condition = {};
  if (pageId) condition.pageId = pageId;
  if (widgetId != undefined) condition.widgetId = widgetId;
  if (dataRunId) condition.dataRunId = dataRunId;
  if (sensorInfo) condition.sensorInfo = sensorInfo;

  let deltas = deltasStorage.query({ ...condition, xMax: xValue, yMax: yValue });
  if (deltas && deltas.length > 0) return { delta: deltas[0], isMax: true };
  deltas = deltasStorage.query({ ...condition, xMin: xValue, yMin: yValue });
  if (deltas && deltas.length > 0) return { delta: deltas[0], isMax: false };
  else return null;
};
