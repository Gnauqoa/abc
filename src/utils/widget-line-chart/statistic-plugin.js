import {
  PREFIX_LINEAR_REGRESSION,
  PREFIX_STATISTIC_NOTE,
  SAMPLE_STATISTIC_NOTE,
  STATISTIC_NOTE_BACKGROUND,
  STATISTIC_LINEAR,
  STATISTIC_QUADRATIC,
  STATISTIC_POWER,
  STATISTIC_INVERSE,
  STATISTIC_INVERSE_SQUARE,
  STATISTIC_SINUSOIDAL,
  STATISTIC_AREA,
} from "./commons";
import DataManagerIST from "../../services/data-manager";
import { LINE_CHART_STATISTIC_NOTE_TABLE } from "../../js/constants";
import StoreService from "../../services/store-service";
import { getRangeSelections } from "./selection-plugin";
import { max, mean, min, round, std } from "mathjs";
import { createSensorInfo } from "../core";
import { createHiddenDataLineId } from "./legend-plugin";
import {
  linearRegression,
  quadraticRegression,
  powerRegression,
  inverseRegression,
  inverseSquareRegression,
  sinusoidalRegression,
  areaRegression,
  createRegressionDataPoints,
} from "./statistic-formula";
import _ from "lodash";

const statisticNotesStorage = new StoreService(LINE_CHART_STATISTIC_NOTE_TABLE);

// ======================================= START RANGE SELECTION OPTIONS FUNCTIONS =======================================

const createRegression = ({ statisticOptionId, datasetData, color }) => {
  let regression;
  switch (statisticOptionId) {
    case STATISTIC_LINEAR:
      regression = linearRegression(datasetData);
      break;
    case STATISTIC_QUADRATIC:
      regression = quadraticRegression(datasetData);
      break;
    case STATISTIC_POWER:
      regression = powerRegression(datasetData);
      break;
    case STATISTIC_INVERSE:
      regression = inverseRegression(datasetData);
      break;
    case STATISTIC_INVERSE_SQUARE:
      regression = inverseSquareRegression(datasetData);
      break;
    case STATISTIC_SINUSOIDAL:
      regression = sinusoidalRegression(datasetData);
      break;
    case STATISTIC_AREA:
      regression = areaRegression(datasetData);
      break;
    default:
      break;
  }
  return { ...regression, color };
};

const getDataStatistic = ({ datasets, boxRange, isDefaultXAxis, statisticOptionId }) => {
  const result = [];
  for (const dataset of datasets) {
    let datasetData = dataset.data;
    const sensorInfo = dataset.yAxis?.sensorInfo;
    const yAxisID = dataset.yAxis?.id;
    if (!datasetData || !sensorInfo) continue;

    if (boxRange) {
      datasetData = datasetData.filter((data, index) => {
        const dataX = isDefaultXAxis ? parseFloat(data.x) : index;
        const dataY = parseFloat(data.y);

        const boxRangeX1 = parseFloat(boxRange.x1);
        const boxRangeX2 = parseFloat(boxRange.x2);
        const boxRangeY1 = parseFloat(boxRange.y1);
        const boxRangeY2 = parseFloat(boxRange.y2);

        return (dataX - boxRangeX1) * (dataX - boxRangeX2) <= 0 && (dataY - boxRangeY1) * (dataY - boxRangeY2) <= 0;
      });
    }

    const dataRunData = datasetData.map((data) => parseFloat(data.y));
    if (dataRunData.length === 0) return result;

    const maxValue = round(max(dataRunData), 2);
    const minValue = round(min(dataRunData), 2);
    const meanValue = round(mean(dataRunData), 2);
    const stdValue = round(std(dataRunData), 2);

    const lastDataIndex = datasetData.length - 1;

    const x1 = isDefaultXAxis ? parseFloat(datasetData[0].x) : datasetData[0].x;
    const x2 = isDefaultXAxis ? parseFloat(datasetData[lastDataIndex].x) : datasetData[lastDataIndex].x;

    const regression = createRegression({ statisticOptionId, datasetData, color: dataset.borderColor });

    result.push({
      yAxisID: yAxisID,
      sensorInfo: sensorInfo,
      min: minValue,
      max: maxValue,
      mean: meanValue,
      std: stdValue,
      regression,
      x1,
      x2,
    });
  }
  return result;
};

// ======================================= STATISTIC OPTION =======================================
export const addStatisticNote = ({
  chartInstance,
  isShowStatistic,
  sensors,
  pageId,
  hiddenDataLineIds,
  isDefaultXAxis,
  statisticOptionId,
  widgetId,
}) => {
  try {
    // Get Range Selection and extract bounding box
    let boxRange;
    const { rangeSelections } = getRangeSelections({ pageId, chartId: chartInstance.id });
    const rangeSelectionIds = Object.keys(rangeSelections);
    if (rangeSelectionIds.length === 1) {
      const rangeSelection = rangeSelections[rangeSelectionIds[0]];
      const { xMax, xMin, yMax, yMin } = rangeSelection;
      boxRange = {
        x1: xMin,
        x2: xMax,
        y1: yMin,
        y2: yMax,
      };
    }

    // Get all the current DataRun
    const currentSensorInfos = sensors.map((sensor) => createSensorInfo(sensor));
    const dataRunPreviews = DataManagerIST.getActivityDataRunPreview();
    for (const dataRunPreview of dataRunPreviews) {
      const dataRunId = dataRunPreview.id;
      const datasets = chartInstance.config.data.datasets.filter((dataset) => {
        const sensorInfo = dataset?.yAxis?.sensorInfo;
        return dataset.dataRunId === dataRunId && currentSensorInfos.includes(sensorInfo);
      });
      if (!datasets?.length) {
        console.error(`addStatisticNote: Cannot find dataset with dataRunId = ${dataRunId}`);
        return false;
      }

      const statisticsResult = getDataStatistic({ datasets, boxRange, isDefaultXAxis, statisticOptionId });
      if (statisticsResult.length === 0) continue;

      for (const statisticResult of statisticsResult) {
        const { yAxisID, sensorInfo, min, max, mean, std, regression, x1, x2 } = statisticResult;
        const hiddenDataLineId = createHiddenDataLineId({ dataRunId, sensorInfo });

        const { content } = regression;
        content.push(`Max = ${max}`);
        content.push(`Min = ${min}`);
        content.push(`Mean = ${mean}`);
        content.push(`Std = ${std}`);

        // Add linear regression annotations
        const linearRegNoteId = createLinearRegNoteId({ pageId, dataRunId, sensorInfo });
        const regressionDataPoints = createRegressionDataPoints(
          linearRegNoteId,
          regression,
          x1,
          x2,
          min,
          max,
          regression.midOriginalPoint
        );

        // Add statistics notes annotations
        const statisticNoteId = createStatisticNoteId({ pageId, widgetId, dataRunId, sensorInfo });
        const statisticNote = {
          id: statisticNoteId,
          dataRunId: dataRunId,
          pageId: pageId,
          content: content,
          backgroundColor: STATISTIC_NOTE_BACKGROUND,
          xValue: regressionDataPoints.midPoint.x,
          yValue: regressionDataPoints.midPoint.y,
          xAdjust: -60,
          yAdjust: -60,
          yScaleID: yAxisID,
        };
        const newStatisticNote = {
          ...SAMPLE_STATISTIC_NOTE,
          ...statisticNote,
        };

        statisticNotesStorage.save({
          id: statisticNoteId,
          pageId: pageId,
          dataRunId: dataRunId,
          sensorInfo: sensorInfo,
          summary: statisticNote,
          linearReg: regressionDataPoints,
          widgetId,
          statisticOptionId,
          isDefaultXAxis,
        });

        // If the current dataRun is hidden, skip update it in chart
        if (hiddenDataLineIds.has(hiddenDataLineId)) continue;

        if (regression.fitSuccessful) {
          chartInstance.data.datasets = [...chartInstance.data.datasets, regressionDataPoints];
        }

        // Update chart annotations
        chartInstance.config.options.plugins.annotation.annotations = {
          ...chartInstance.config.options.plugins.annotation.annotations,
          [statisticNoteId]: newStatisticNote,
        };

        chartInstance.update();
      }
    }

    chartInstance.update();
    return true;
  } catch (error) {
    console.error("addStatisticNote: ", error);
    return false;
  }
};

export const removeStatisticNote = ({ chartInstance, pageId, widgetId }) => {
  try {
    const currentStatisticNotes = statisticNotesStorage.query({ pageId, widgetId });
    currentStatisticNotes.forEach((note) => {
      delete chartInstance.config.options.plugins.annotation.annotations[note.summary.id];
      chartInstance.data.datasets = chartInstance.data.datasets.filter(
        (dataset) => dataset.dataRunId !== note.linearReg.id
      );
      statisticNotesStorage.delete(note.id);
    });

    chartInstance.update();
    return true;
  } catch (err) {
    console.error("removeStatisticNote: ", err);
    return false;
  }
};

export const getAllCurrentStatisticNotes = ({ pageId, dataRunId, sensorInfo, hiddenDataLineIds, widgetId }) => {
  const condition = {};
  if (pageId) condition.pageId = pageId;
  if (dataRunId) condition.dataRunId = dataRunId;
  if (!_.isNil(widgetId)) condition.widgetId = widgetId;
  if (sensorInfo) condition.sensorInfo = sensorInfo;

  const allStatNotes = statisticNotesStorage.query(condition);

  const summaryNotes = {};
  const linearRegNotes = [];

  allStatNotes.forEach((statNote) => {
    const dataRunId = statNote.dataRunId;
    const sensorInfo = statNote.sensorInfo;
    const hiddenDataLineId = createHiddenDataLineId({ dataRunId, sensorInfo });
    if (hiddenDataLineIds?.has(hiddenDataLineId)) return;

    const summaryNote = statNote.summary;
    const linearReg = statNote.linearReg;

    const newSummaryNote = {
      ...SAMPLE_STATISTIC_NOTE,
      content: summaryNote.content,
      backgroundColor: summaryNote.backgroundColor,
      xValue: summaryNote.xValue,
      yValue: summaryNote.yValue,
      xAdjust: summaryNote.xAdjust,
      yAdjust: summaryNote.yAdjust,
      yScaleID: summaryNote.yScaleID,
    };

    summaryNotes[summaryNote.id] = newSummaryNote;
    linearRegNotes.push(linearReg);
  });
  return { summaryNotes, linearRegNotes };
};

const createStatisticNoteId = ({ pageId, widgetId, dataRunId, sensorInfo }) => {
  return `${PREFIX_STATISTIC_NOTE}_${pageId}_${widgetId}_${dataRunId}_${sensorInfo}`;
};

const createLinearRegNoteId = ({ pageId, dataRunId, sensorInfo }) => {
  return `${PREFIX_LINEAR_REGRESSION}_${pageId}_${dataRunId}_${sensorInfo}`;
};
