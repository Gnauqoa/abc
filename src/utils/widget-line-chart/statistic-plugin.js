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

const getDataStatistic = ({ dataset, boxRange }) => {
  let datasetData = dataset.data;
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

  console.log("dataRunData: ", dataRunData);

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

  return {
    min: minValue,
    max: maxValue,
    mean: meanValue,
    std: stdValue,
    linearRegression: { slope, intercept },
    startPoint,
    midPoint,
    endPoint,
  };
};
// ======================================= STATISTIC OPTION =======================================
export const addStatisticNote = ({ chartInstance, isShowStatistic, sensor, pageId, hiddenDataRunIds }) => {
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
    const dataRunPreviews = DataManagerIST.getActivityDataRunPreview();
    for (const dataRunPreview of dataRunPreviews) {
      const dataRunId = dataRunPreview.id;
      // const dataRunId = DataManagerIST.getCurrentDataRunId();

      const dataset = chartInstance.config.data.datasets.find((dataset) => dataset.dataRunId === dataRunId);
      if (!dataset || !dataset.data) {
        console.error(`addStatisticNote: Cannot find dataset with dataRunId = ${dataRunId}`);
        return false;
      }

      const statisticResult = getDataStatistic({ dataset, boxRange });
      if (!statisticResult) continue;

      const { min, max, mean, std, linearRegression, startPoint, midPoint, endPoint } = statisticResult;

      const { slope: m, intercept: b } = linearRegression;
      const linearRegFunction = `y = ${m}x + ${b}`;
      const content = ["Linear fit", "  y = mx + b"];
      content.push(`  m = ${m}`);
      content.push(`  b = ${b}`);
      content.push("");
      content.push(`Max = ${max}`);
      content.push(`Min = ${min}`);
      content.push(`Mean = ${mean}`);
      content.push(`Std = ${std}`);

      // Add statistics notes annotations
      const statisticNoteId = `${PREFIX_STATISTIC_NOTE}_${pageId}_${dataRunId}`;
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
      };
      const newStatisticNote = {
        ...SAMPLE_STATISTIC_NOTE,
        ...statisticNote,
      };

      // Add linear regression annotations
      const linearRegNoteId = `${PREFIX_LINEAR_REGRESSION}_${pageId}_${dataRunId}`;
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
      };
      const newLinearReg = {
        ...SAMPLE_LINEAR_ANNOTATION,
        ...linearRegNote,
      };

      statisticNotesStorage.save({
        id: statisticNoteId,
        pageId: pageId,
        dataRunId: dataRunId,
        summary: statisticNote,
        linearReg: linearRegNote,
      });

      // If the current dataRun is hidden, skip update it in chart
      if (hiddenDataRunIds.has(dataRunId)) continue;

      // Update chart annotations
      chartInstance.config.options.plugins.annotation.annotations = {
        ...chartInstance.config.options.plugins.annotation.annotations,
        [statisticNoteId]: newStatisticNote,
        [linearRegNoteId]: newLinearReg,
      };
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

export const getAllCurrentStatisticNotes = ({ pageId, dataRunId, hiddenDataRunIds }) => {
  const condition = {};
  if (pageId) condition.pageId = pageId;
  if (dataRunId) condition.dataRunId = dataRunId;

  const allStatNotes = statisticNotesStorage.query(condition);

  const summaryNotes = {};
  const linearRegNotes = {};

  allStatNotes.forEach((statNote) => {
    if (hiddenDataRunIds && hiddenDataRunIds.has(statNote.dataRunId)) return;

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
    };

    const newLinearRegNote = {
      ...SAMPLE_LINEAR_ANNOTATION,
      label: linearRegNote.label,
      xMax: linearRegNote.xMax,
      xMin: linearRegNote.xMin,
      yMax: linearRegNote.yMax,
      yMin: linearRegNote.yMin,
    };

    summaryNotes[summaryNote.id] = newSummaryNote;
    linearRegNotes[linearRegNote.id] = newLinearRegNote;
  });
  return { summaryNotes, linearRegNotes };
};
