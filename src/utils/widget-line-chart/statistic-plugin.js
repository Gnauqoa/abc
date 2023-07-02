import {
  PREFIX_LINEAR_REGRESSION,
  PREFIX_STATISTIC_NOTE,
  SAMPLE_STATISTIC_NOTE,
  LINEAR_REGRESSION_BACKGROUND,
  STATISTIC_NOTE_BACKGROUND,
  SAMPLE_LINEAR_ANNOTATION,
} from "./commons";
import DataManagerIST from "../../services/data-manager";
import { LINE_CHART_STATISTIC_NOTE_TABLE } from "../../js/constants";
import StoreService from "../../services/store-service";
import { getRangeSelections } from "./selection-plugin";
import { max, mean, min, round, std } from "mathjs";
import { createSensorInfo } from "../core";
import { createHiddenDataLineId } from "./legend-plugin";

const statisticNotesStorage = new StoreService(LINE_CHART_STATISTIC_NOTE_TABLE);

// ======================================= START RANGE SELECTION OPTIONS FUNCTIONS =======================================
const calculateLinearRegression = ({ dataRunData }) => {
  const n = dataRunData.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i++) {
    const x = i;
    const y = dataRunData[i];

    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope: round(slope, 2), intercept: round(intercept, 2) };
};

const getDataStatistic = ({ datasets, boxRange }) => {
  const result = [];
  for (const dataset of datasets) {
    let datasetData = dataset.data;
    const sensorInfo = dataset.yAxis?.sensorInfo;
    const yAxisID = dataset.yAxis?.id;
    if (!datasetData || !sensorInfo) continue;

    if (boxRange) {
      datasetData = datasetData.filter((data) => {
        const dataX = parseFloat(data.x);
        const dataY = parseFloat(data.y);

        const boxRangeX1 = parseFloat(boxRange.x1);
        const boxRangeX2 = parseFloat(boxRange.x2);
        const boxRangeY1 = parseFloat(boxRange.y1);
        const boxRangeY2 = parseFloat(boxRange.y2);

        return (dataX - boxRangeX1) * (dataX - boxRangeX2) <= 0 && (dataY - boxRangeY1) * (dataY - boxRangeY2) <= 0;
      });
    }

    const dataRunData = datasetData.map((data) => parseFloat(data.y));
    if (dataRunData.length === 0) return false;

    const maxValue = round(max(dataRunData), 2);
    const minValue = round(min(dataRunData), 2);
    const meanValue = round(mean(dataRunData), 2);
    const stdValue = round(std(dataRunData), 2);
    const { slope, intercept } = calculateLinearRegression({ dataRunData: dataRunData });

    const lastDataIndex = datasetData.length - 1;
    const middleDataIndex = parseInt(datasetData.length / 2);

    const x1 = parseFloat(datasetData[0].x);
    const x2 = parseFloat(datasetData[lastDataIndex].x);
    const y1 = slope * 0 + intercept;
    const y2 = slope * lastDataIndex + intercept;

    const startPoint = { x: x1, y: y1 };
    const midPoint = { x: parseFloat(datasetData[middleDataIndex].x), y: parseFloat(datasetData[middleDataIndex].y) };
    const endPoint = { x: x2, y: y2 };

    result.push({
      yAxisID: yAxisID,
      sensorInfo: sensorInfo,
      min: minValue,
      max: maxValue,
      mean: meanValue,
      std: stdValue,
      linearRegression: { slope, intercept },
      startPoint,
      midPoint,
      endPoint,
    });
  }
  return result;
};
// ======================================= STATISTIC OPTION =======================================
export const addStatisticNote = ({ chartInstance, isShowStatistic, sensors, pageId, hiddenDataLineIds }) => {
  if (!isShowStatistic) {
    // Get Range Selection and extract bounding box
    let boxRange;
    const { rangeSelections } = getRangeSelections({ pageId });
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

      const statisticsResult = getDataStatistic({ datasets, boxRange });
      if (statisticsResult.length === 0) continue;

      for (const statisticResult of statisticsResult) {
        const { yAxisID, sensorInfo, min, max, mean, std, linearRegression, startPoint, midPoint, endPoint } =
          statisticResult;
        const hiddenDataLineId = createHiddenDataLineId({ dataRunId, sensorInfo });

        const { slope: m, intercept: b } = linearRegression;
        const linearRegFunction = `y = ${m}x + ${b}`;
        const content = ["Đường tuyến tính", "  y = mx + b"];
        content.push(`  m = ${m}`);
        content.push(`  b = ${b}`);
        content.push("");
        content.push(`Max = ${max}`);
        content.push(`Min = ${min}`);
        content.push(`Mean = ${mean}`);
        content.push(`Std = ${std}`);

        // Add statistics notes annotations
        const statisticNoteId = createStatisticNoteId({ pageId, dataRunId, sensorInfo });
        const statisticNote = {
          id: statisticNoteId,
          dataRunId: dataRunId,
          pageId: pageId,
          content: content,
          backgroundColor: STATISTIC_NOTE_BACKGROUND,
          xValue: midPoint.x,
          yValue: midPoint.y,
          xAdjust: -60,
          yAdjust: -60,
          yScaleID: yAxisID,
        };
        const newStatisticNote = {
          ...SAMPLE_STATISTIC_NOTE,
          ...statisticNote,
        };

        // Add linear regression annotations
        const linearRegNoteId = createLinearRegNoteId({ pageId, dataRunId, sensorInfo });
        const linearRegNote = {
          id: linearRegNoteId,
          xMax: endPoint.x,
          xMin: startPoint.x,
          yMax: endPoint.y,
          yMin: startPoint.y,
          label: {
            display: true,
            backgroundColor: LINEAR_REGRESSION_BACKGROUND,
            content: linearRegFunction,
          },
          yScaleID: yAxisID,
        };
        const newLinearReg = {
          ...SAMPLE_LINEAR_ANNOTATION,
          ...linearRegNote,
        };

        statisticNotesStorage.save({
          id: statisticNoteId,
          pageId: pageId,
          dataRunId: dataRunId,
          sensorInfo: sensorInfo,
          summary: statisticNote,
          linearReg: linearRegNote,
        });

        // If the current dataRun is hidden, skip update it in chart
        if (hiddenDataLineIds.has(hiddenDataLineId)) continue;

        // Update chart annotations
        chartInstance.config.options.plugins.annotation.annotations = {
          ...chartInstance.config.options.plugins.annotation.annotations,
          [statisticNoteId]: newStatisticNote,
          [linearRegNoteId]: newLinearReg,
        };
      }
    }
  } else {
    const currentStatisticNotes = statisticNotesStorage.query({ pageId });
    currentStatisticNotes.forEach((note) => {
      delete chartInstance.config.options.plugins.annotation.annotations[note.summary.id];
      delete chartInstance.config.options.plugins.annotation.annotations[note.linearReg.id];
      statisticNotesStorage.delete(note.id);
    });
  }

  chartInstance.update();
  return true;
};

export const getAllCurrentStatisticNotes = ({ pageId, dataRunId, sensorInfo, hiddenDataLineIds }) => {
  const condition = {};
  if (pageId) condition.pageId = pageId;
  if (dataRunId) condition.dataRunId = dataRunId;
  if (sensorInfo) condition.sensorInfo = sensorInfo;

  const allStatNotes = statisticNotesStorage.query(condition);

  const summaryNotes = {};
  const linearRegNotes = {};

  allStatNotes.forEach((statNote) => {
    const dataRunId = statNote.dataRunId;
    const sensorInfo = statNote.sensorInfo;
    const hiddenDataLineId = createHiddenDataLineId({ dataRunId, sensorInfo });
    if (hiddenDataLineIds?.has(hiddenDataLineId)) return;

    const summaryNote = statNote.summary;
    const linearRegNote = statNote.linearReg;

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

    const newLinearRegNote = {
      ...SAMPLE_LINEAR_ANNOTATION,
      label: linearRegNote.label,
      xMax: linearRegNote.xMax,
      xMin: linearRegNote.xMin,
      yMax: linearRegNote.yMax,
      yMin: linearRegNote.yMin,
      yScaleID: linearRegNote.yScaleID,
    };

    summaryNotes[summaryNote.id] = newSummaryNote;
    linearRegNotes[linearRegNote.id] = newLinearRegNote;
  });
  return { summaryNotes, linearRegNotes };
};

const createStatisticNoteId = ({ pageId, dataRunId, sensorInfo }) => {
  return `${PREFIX_STATISTIC_NOTE}_${pageId}_${dataRunId}_${sensorInfo}`;
};

const createLinearRegNoteId = ({ pageId, dataRunId, sensorInfo }) => {
  return `${PREFIX_LINEAR_REGRESSION}_${pageId}_${dataRunId}_${sensorInfo}`;
};
