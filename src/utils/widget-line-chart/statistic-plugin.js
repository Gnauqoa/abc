import {
  PREFIX_LINEAR_REGRESSION,
  PREFIX_STATISTIC_NOTE,
  SAMPLE_STATISTIC_NOTE,
  LINEAR_REGRESSION_BACKGROUND,
  STATISTIC_NOTE_BACKGROUND,
  getDataStatistic,
  SAMPLE_LINEAR_ANNOTATION,
} from "./commons";
import DataManagerIST from "../../services/data-manager";
import { LINE_CHART_RANGE_SELECTION_TABLE, LINE_CHART_STATISTIC_NOTE_TABLE } from "../../js/constants";
import StoreService from "../../services/store-service";
import { getRangeSelections } from "./selection-plugin";

const statisticNotesStorage = new StoreService(LINE_CHART_STATISTIC_NOTE_TABLE);

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
      const dataRunData = DataManagerIST.getDataRunData({
        dataRunId: dataRunId,
        sensorId: sensor.id,
        sensorIndex: sensor.index,
      });
      if (!dataRunData) return false;

      const { min, max, mean, std, linearRegression } = getDataStatistic(dataRunData);
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

      const dataset = chartInstance.config.data.datasets.find((dataset) => dataset.dataRunId === dataRunId);
      if (!dataset || !dataset.data) return false;

      const datasetData = dataset.data;
      const lastDataIndex = datasetData.length - 1;
      const middleDataIndex = parseInt(dataRunData.length / 2);

      console.log("boxRange: ", boxRange);

      const x1 = 0;
      const x2 = datasetData[lastDataIndex].x;
      const y1 = m * 0 + b;
      const y2 = m * lastDataIndex + b;

      // Add statistics notes annotations
      const statisticNoteId = `${PREFIX_STATISTIC_NOTE}_${pageId}_${dataRunId}`;
      const statisticNote = {
        id: statisticNoteId,
        dataRunId: dataRunId,
        pageId: pageId,
        content: content,
        backgroundColor: STATISTIC_NOTE_BACKGROUND,
        xValue: datasetData[middleDataIndex].x,
        yValue: datasetData[middleDataIndex].y,
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
        xMax: x2,
        xMin: x1,
        yMax: y2,
        yMin: y1,
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
