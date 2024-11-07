import { hiddenDataLineIds } from "./commons";
import { getAllCurrentLabelNotes } from "./label-plugin";
import { getAllCurrentStatisticNotes } from "./statistic-plugin";

// ======================================= CHART LEGEND =======================================
export const onClickLegendHandler = ({ event, legendItem, legend, pageId, widgetId = 0 }) => {
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
  const labelNotes = getAllCurrentLabelNotes({
    dataRunId: dataRunId,
    sensorInfo: sensorInfo,
    widgetId,
    pageId,
  });
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
  linearRegNotes.forEach((regression) => {
    // First, we have to check if the chart maintains the note element or not
    // if not, add to the chart, otherwise, update the note element
    const dataset = ci.data.datasets.find((ds) => ds.id === regression.id);
    if (dataset && !isShowNote) {
      ci.data.datasets = ci.data.datasets.filter((ds) => ds.id !== regression.id);
    } else if (!dataset && isShowNote) {
      ci.data.datasets.push(regression);
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
