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
import { LINE_CHART_STATISTIC_NOTE_TABLE } from "../../js/constants";
import StoreService from "../../services/store-service";

const statisticNotesStorage = new StoreService(LINE_CHART_STATISTIC_NOTE_TABLE);

// ======================================= STATISTIC OPTION =======================================
export const addStatisticNote = ({ chartInstance, isShowStatistic, sensor, pageId }) => {
  console.log("isShowStatistic: ", isShowStatistic);
  if (!isShowStatistic) {
    const dataRunId = DataManagerIST.getCurrentDataRunId();
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

    const lastDataIndex = dataRunData.length - 1;
    const startPointYValue = m * 0 + b;
    const endPointYValue = m * lastDataIndex + b;

    // Add statistics notes annotations
    const statisticNoteId = `${PREFIX_STATISTIC_NOTE}_${pageId}_${dataRunId}`;
    const statisticNote = {
      id: statisticNoteId,
      dataRunId: dataRunId,
      pageId: pageId,
      content: content,
      backgroundColor: STATISTIC_NOTE_BACKGROUND,
      xValue: lastDataIndex,
      yValue: dataRunData[lastDataIndex],
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
      dataRunId: dataRunId,
      pageId: pageId,
      xMax: lastDataIndex,
      xMin: 0,
      yMax: endPointYValue,
      yMin: startPointYValue,
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
      summary: statisticNote,
      linearReg: linearRegNote,
      pageId: pageId,
    });

    // Update chart annotations
    chartInstance.config.options.plugins.annotation.annotations = {
      ...chartInstance.config.options.plugins.annotation.annotations,
      [statisticNoteId]: newStatisticNote,
      [linearRegNoteId]: newLinearReg,
    };
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

export const getAllCurrentStatisticNotes = ({ pageId }) => {
  const allStatNotes = statisticNotesStorage.query({ pageId: pageId });

  const summaryNotes = {};
  const linearRegNotes = {};

  allStatNotes.forEach((statNote) => {
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
