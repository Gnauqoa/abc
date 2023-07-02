import { hiddenDataLineIds } from "./commons";
import { getAllCurrentLabelNotes } from "./label-plugin";
import { getAllCurrentStatisticNotes } from "./statistic-plugin";

// ======================================= CHART LEGEND =======================================
export const onClickLegendHandler = (event, legendItem, legend) => {
  if (event.type !== "click") return;

  const datasetIndex = legendItem.datasetIndex;
  const ci = legend.chart;

  const dataRunId = ci.data.datasets[datasetIndex]?.dataRunId;
  const sensorInfo = ci.data.datasets[datasetIndex]?.yAxis?.sensorInfo;
  const hiddenDataLineId = createHiddenDataLineId({ dataRunId, sensorInfo });

  let isShowNote = false;
  if (ci.isDatasetVisible(datasetIndex)) {
    ci.hide(datasetIndex);
    legendItem.hidden = true;
    isShowNote = false;
    hiddenDataLineIds.add(hiddenDataLineId);
  } else {
    ci.show(datasetIndex);
    legendItem.hidden = false;
    isShowNote = true;
    hiddenDataLineIds.delete(hiddenDataLineId);
  }

  // Update show/off label note
  const labelNotes = getAllCurrentLabelNotes({ dataRunId: dataRunId, sensorInfo: sensorInfo });
  Object.keys(labelNotes).forEach((nodeId) => {
    // First, we have to check if the chart maintains the note element or not
    // if not, add to the chart, otherwise, update the note element
    const noteElement = ci.config.options.plugins.annotation.annotations[nodeId];
    if (noteElement) noteElement.display = isShowNote;
    else {
      ci.config.options.plugins.annotation.annotations[nodeId] = labelNotes[nodeId];
    }
  });

  // Update show/off statistic note
  const { summaryNotes, linearRegNotes } = getAllCurrentStatisticNotes({
    dataRunId: dataRunId,
    sensorInfo: sensorInfo,
  });
  Object.keys(summaryNotes).forEach((nodeId) => {
    // First, we have to check if the chart maintains the note element or not
    // if not, add to the chart, otherwise, update the note element
    const noteElement = ci.config.options.plugins.annotation.annotations[nodeId];
    if (noteElement) noteElement.display = isShowNote;
    else if (isShowNote) {
      ci.config.options.plugins.annotation.annotations[nodeId] = summaryNotes[nodeId];
    }
  });
  Object.keys(linearRegNotes).forEach((nodeId) => {
    // First, we have to check if the chart maintains the note element or not
    // if not, add to the chart, otherwise, update the note element
    const noteElement = ci.config.options.plugins.annotation.annotations[nodeId];
    if (noteElement) noteElement.display = isShowNote;
    else if (isShowNote) {
      ci.config.options.plugins.annotation.annotations[nodeId] = linearRegNotes[nodeId];
    }
  });

  ci.update();
};

export const createHiddenDataLineId = ({ dataRunId, sensorInfo }) => {
  return `${dataRunId}_${sensorInfo}`;
};

export const parseHiddenDataLineId = (lineId) => {
  const [dataRunId, sensorInfo] = lineId.split("_");
  return { dataRunId, sensorInfo };
};
