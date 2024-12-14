import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from "react";
import Chart from "chart.js/auto";
import zoomPlugin from "chartjs-plugin-zoom";
import annotationPlugin from "chartjs-plugin-annotation";
import _ from "lodash";
import ExpandableOptions from "../../molecules/expandable-options";

import SensorSelector from "../../molecules/popup-sensor-selector";
import SensorServicesIST from "../../../services/sensor-service";
import DataManagerIST from "../../../services/data-manager";

import lineChartIcon from "../../../img/expandable-options/line.png";
import {
  createChartJsDatas,
  getChartJsPlugin,
  scaleToFixHandler,
  interpolateHandler,
  expandableOptions,
  SCALE_FIT_OPTION,
  NOTE_OPTION,
  INTERPOLATE_OPTION,
  X_DEFAULT_UNIT,
  X_MIN_VALUE,
  Y_MIN_VALUE,
  STATISTIC_OPTION,
  SELECTION_OPTION,
  OPTIONS_WITH_SELECTED,
  POINT_STYLE,
  POINT_HOVER_RADIUS,
  POINT_RADIUS,
  hiddenDataLineIds,
  SHOW_OFF_DATA_POINT_MARKER,
  ALLOW_ENTER_LEAVE_ANNOTATIONS,
  LABEL_NOTE_TYPE,
  PREFIX_LABEL_NOTE,
  PREFIX_STATISTIC_NOTE,
  STATISTIC_NOTE_TYPE,
  calculateSuggestXYAxis,
  createChartJsDatasForCustomXAxis,
  ADD_COLUMN_OPTION,
  DELETE_COLUMN_OPTION,
  ADD_ROW_OPTION,
  DELETE_ROW_OPTION,
  DELETE_RANGE_SELECTION,
  createYAxisLineChart,
  createYAxisId,
  createXAxisLineChart,
} from "../../../utils/widget-line-chart/commons";
import {
  DEFAULT_SENSOR_DATA,
  LINE_CHART_DELTA_TABLE,
  LINE_CHART_LABEL_NOTE_TABLE,
  LINE_CHART_RANGE_SELECTION_TABLE,
  LINE_CHART_STATISTIC_NOTE_TABLE,
} from "../../../js/constants";

import "./index.scss";
import usePrompt from "../../../hooks/useModal";
import PromptPopup from "../../molecules/popup-prompt-dialog";
import StoreService from "../../../services/store-service";
import {
  addStatisticNote,
  getAllCurrentStatisticNotes,
  removeStatisticNote,
} from "../../../utils/widget-line-chart/statistic-plugin";
import {
  addLabelNote,
  createLabelNoteId,
  getAllCurrentLabelNotes,
} from "../../../utils/widget-line-chart/label-plugin";
import {
  addPointDataPreview,
  getAllCurrentPointDataPreview,
} from "../../../utils/widget-line-chart/point-data-preview-plugin";
import {
  addDelta,
  findFirstDeltaByValue,
  getAllCurrentDeltas,
  getChartAnnotationByDelta,
} from "../../../utils/widget-line-chart/delta-plugin";
import { onClickChartHandler, onClickNoteElement } from "../../../utils/widget-line-chart/annotation-plugin";
import {
  createHiddenDataLineId,
  onClickLegendHandler,
  parseHiddenDataLineId,
} from "../../../utils/widget-line-chart/legend-plugin";
import {
  getRangeSelections,
  handleAddSelection,
  handleDeleteSelection,
  getListRangeSelections,
} from "../../../utils/widget-line-chart/selection-plugin";
import { useActivityContext } from "../../../context/ActivityContext";
import { createSensorInfo, parseSensorInfo } from "../../../utils/core";
import { FIRST_COLUMN_DEFAULT_OPT, FIRST_COLUMN_SENSOR_OPT } from "../../../utils/widget-table-chart/commons";
import { f7 } from "framework7-react";
import PopoverStatisticOptions from "./PopoverStatisticOptions";

import { useTranslation } from "react-i18next";
import deleteIconChart from "../../../img/expandable-options/ico-tool-delete.png";
import nextIcon from "../../../img/expandable-options/ico-tool-rightarrow.png";
import previousIcon from "../../../img/expandable-options/ico-tool-leftarrow.png";
import addNoteIcon from "../../../img/expandable-options/ico-tool-edit.png";
import deltaIcon from "../../../img/expandable-options/ico-tool-delta.png";

Chart.register(zoomPlugin);
Chart.register(annotationPlugin);

// ===================================== START DRAG-DROP UTILS =====================================
let noteElement;
let lastNoteEvent;
let isDragging = false;
let selectedPointElement = null;
let selectedNoteElement = null;
let chartSelectedIndex = 0;

let isRangeSelected = false;
let startRangeElement = null;

const statisticNotesStorage = new StoreService(LINE_CHART_STATISTIC_NOTE_TABLE);
const labelNotesStorage = new StoreService(LINE_CHART_LABEL_NOTE_TABLE);
const rangeSelectionStorage = new StoreService(LINE_CHART_RANGE_SELECTION_TABLE);
const deltasStorage = new StoreService(LINE_CHART_DELTA_TABLE);

const handleDrag = function ({ event, chart, pageId, widgetId }) {
  if (isRangeSelected) {
    switch (event.type) {
      case "mousemove":
        if (!startRangeElement) return;
        handleAddSelection({
          chartInstance: chart,
          startRangeElement: startRangeElement,
          endRangeElement: event,
          pageId,
          widgetId,
        });
        return true;
      case "mouseup": // do not press the mouse
        startRangeElement = undefined;
        break;
      case "mousedown": // press the mouse
        startRangeElement = event;
        break;
      case "mouseout":
      default:
    }
  } else if (noteElement) {
    if (noteElement) {
      switch (event.type) {
        case "mousemove":
          const result = handleElementDragging(event);
          return result;
        case "mouseup": // do not press the mouse
          lastNoteEvent = undefined;
          break;
        case "mousedown": // press the mouse
          lastNoteEvent = event;
          break;
        case "mouseout":
        default:
      }
    }
  }
};

const handleElementDragging = function (event) {
  if (!lastNoteEvent || !noteElement) {
    return;
  }

  const moveX = event.x - lastNoteEvent.x;
  const moveY = event.y - lastNoteEvent.y;

  noteElement.x += moveX;
  noteElement.y += moveY;
  noteElement.x2 += moveX;
  noteElement.y2 += moveY;
  noteElement.centerX += moveX;
  noteElement.centerY += moveY;

  lastNoteEvent = event;
  if (moveX !== 0 || moveY !== 0) {
    isDragging = true;
  }
  return true;
};

export const onEnterNoteElement = ({ chart, element }) => {
  const noteElementId = element?.options?.id;
  const prefix = noteElementId?.split("_")?.[0];
  if (!ALLOW_ENTER_LEAVE_ANNOTATIONS.includes(prefix)) return;

  noteElement = element;

  if (!isRangeSelected) chart.config.options.plugins.zoom.pan.enabled = false;
  chart.update();
};

export const onLeaveNoteElement = ({ chart, element }) => {
  const noteElementId = element?.options?.id;
  const prefix = noteElementId?.split("_")?.[0];
  if (!ALLOW_ENTER_LEAVE_ANNOTATIONS.includes(prefix)) return;

  let label = chart.config.options.plugins.annotation.annotations[noteElementId];

  // Check whether the note is statistic note or label note
  let noteType;
  let currentNote;
  if (prefix === PREFIX_LABEL_NOTE) {
    const labelNote = labelNotesStorage.find(noteElementId);
    if (!labelNote) return;

    currentNote = labelNote.label;
    noteType = LABEL_NOTE_TYPE;
  } else if (prefix === PREFIX_STATISTIC_NOTE) {
    const statisticNote = statisticNotesStorage.find(noteElementId);
    if (!statisticNote) return;

    currentNote = statisticNote.summary;
    noteType = STATISTIC_NOTE_TYPE;
  }

  if (label) {
    const oldXPixel = chart.scales.x.getPixelForValue(currentNote.xValue);
    const oldYPixel = chart.scales.y.getPixelForValue(currentNote.yValue);
    const newAdjustPos = {
      xAdjust: element.centerX - oldXPixel,
      yAdjust: element.centerY - oldYPixel,
    };

    chart.config.options.plugins.annotation.annotations[noteElementId] = {
      ...label,
      ...newAdjustPos,
      backgroundColor: currentNote.backgroundColor,
    };

    // Update note position
    const updatedNote = {
      ...currentNote,
      ...newAdjustPos,
    };

    if (noteType === STATISTIC_NOTE_TYPE) {
      statisticNotesStorage.merge({ id: noteElementId, summary: updatedNote });
    } else if (noteType === LABEL_NOTE_TYPE) {
      labelNotesStorage.merge({ id: noteElementId, label: updatedNote });
    }
  }

  noteElement = undefined;
  lastNoteEvent = undefined;
  isDragging = false;

  if (!isRangeSelected) chart.config.options.plugins.zoom.pan.enabled = true;
  chart.update();
};

// ======================================= CHART FUNCTIONS =======================================
/**
 * data: [{
 * name:string,
 * data: [{
 * x: 0,
 * y:0
 * }]
 * }]
 *
 */
// TODO: check axisRef does not change for first time change sensor value
const updateChart = ({ chartInstance, data = [], axisRef, pageId, isDefaultXAxis, sensors, widgetId }) => {
  try {
    const pageStep = 5;
    const firstPageStep = 10;
    let { suggestMaxX } = calculateSuggestXYAxis({
      chartDatas: data,
      pageStep,
      firstPageStep,
    });
    if (!suggestMaxX) {
      suggestMaxX = pageStep;
    }

    const stepSize = suggestMaxX / 10;

    // ------ Update scales variables for 2-axises ------
    const scales = {
      x: createXAxisLineChart({ unit: axisRef.current.xUnit }),
    };

    // Add y axises depending on number of sensors
    if (sensors && sensors.length !== 0) {
      sensors.forEach((sensor, index) => {
        // Revert index to map with the order sensor selector button
        // y0 stay on the right most of the axises
        const curIndex = sensors.length - 1 - index;
        const yAxisID = createYAxisId({ index: curIndex });
        const sensorId = sensor.id;
        const sensorIndex = sensor.index;
        const sensorInfo = SensorServicesIST.getSensorInfo(sensorId);
        let sensorSubInfo;
        if (sensorInfo && sensorInfo.data) sensorSubInfo = sensorInfo.data[sensorIndex];
        else
          sensorSubInfo = {
            max: 1.0,
            min: 0,
            unit: "",
          };

        const yAxisInfo = createYAxisLineChart(sensorSubInfo);
        scales[yAxisID] = yAxisInfo;
      });
    } else {
      const sensorInfo = {
        max: 1.0,
        min: 0,
        unit: "",
      };
      const yAxisInfo = createYAxisLineChart(sensorInfo);
      scales.y = yAxisInfo;
    }

    scales.x.type = "linear";
    scales.x.suggestedMin = 0;
    scales.x.suggestedMax = suggestMaxX;
    if (stepSize) {
      scales.x.ticks.stepSize = stepSize;
    }
    chartInstance.options.plugins.zoom.zoom.mode = "xy";
    chartInstance.options.plugins.zoom.pan.mode = "xy";

    // Check if the x-axis is time to custom unit to create appropriate chart
    if (isDefaultXAxis) {
      chartInstance.data = createChartJsDatas({ chartDatas: data, hiddenDataLineIds: hiddenDataLineIds });
    } else {
      chartInstance.data = createChartJsDatasForCustomXAxis({ chartDatas: data, hiddenDataLineIds: hiddenDataLineIds });
    }
    chartInstance.options.animation = false;
    chartInstance.options.scales = scales;

    // Update Annotations for chart
    let newChartAnnotations;

    // Update the chart selection
    if (data?.length > 0) {
      // update chart notes
      const labelNoteAnnotations = getAllCurrentLabelNotes({
        pageId,
        widgetId,
        hiddenDataLineIds,
      });
      const labelDeltaAnnotations = getAllCurrentDeltas({
        pageId,
        widgetId,
        hiddenDataLineIds,
      });
      const { summaryNotes, linearRegNotes } = getAllCurrentStatisticNotes({
        pageId: pageId,
        hiddenDataLineIds,
        widgetId,
      });
      const { rangeSelections } = getRangeSelections({ pageId: pageId, widgetId });
      // const pointDataPreviewAnnotations = getAllCurrentPointDataPreview({
      //   pageId,
      //   widgetId,
      //   hiddenDataLineIds,
      // });
      newChartAnnotations = {
        ...labelNoteAnnotations,
        ...labelDeltaAnnotations,
        ...summaryNotes,
        ...rangeSelections,
        // ...pointDataPreviewAnnotations,
      };

      for (const regression of linearRegNotes) {
        chartInstance.data.datasets.push(regression);
      }
    } else {
      // const { rangeSelections } = getRangeSelections({ pageId: pageId });
      // newChartAnnotations = {
      //   ...rangeSelections,
      // };
    }

    chartInstance.config.options.plugins.annotation.annotations = newChartAnnotations;
    chartInstance.update();

    for (let index = 0; index < chartInstance.data.datasets.length; index++) {
      const dataRunId = chartInstance.data.datasets[index]?.dataRunId;
      const sensorInfo = chartInstance.data.datasets[index]?.yAxis?.sensorInfo;
      const hiddenDataLineId = createHiddenDataLineId({ dataRunId, sensorInfo });
      if (hiddenDataLineIds.has(hiddenDataLineId)) {
        chartInstance.hide(index);
      }
    }
  } catch (error) {
    console.error("updateChart: ", error);
  }
};

// ============================================= MAIN COMPONENT =============================================
let LineChart = (props, ref) => {
  const { t } = useTranslation();

  const {
    handleSensorChange,
    handleXAxisChange,
    handleAddExtraCollectingSensor,
    handleDeleteExtraCollectingSensor,
    handleAddWidget,
    handleDeleteWidget,
  } = useActivityContext();
  const { widgets, xAxis, pageId } = props;
  // const definedSensors = DataManagerIST.getCustomUnitSensorInfos({ unitId: xAxis.id });

  // show icon delete chart
  const [isShowIconDeleteChart, setIsShowIconDeleteChart] = useState(false);
  const [activeChart, setActiveChart] = useState(null);

  // Check whether the options are selected or not
  const isSelectStatistic = statisticNotesStorage.query({ pageId: pageId }).length > 0;
  const isSelectRangeSelection = rangeSelectionStorage.query({ pageId: pageId }).length > 0;
  const [isShowStatistic, setIsShowStatistic] = useState(isSelectStatistic);
  const [isSelectRegion, setIsSelectRegion] = useState(isSelectRangeSelection);
  const [isOffDataPoint, setIsOffDataPoint] = useState(false);
  const [shouldShowRowOptions, setShouldShowRowOptions] = useState(true);
  const [shouldShowColumnOptions, setShouldShowColumnOptions] = useState(true);
  const [deltaSelected, setDeltaSelected] = useState(); // {delta, isMax}

  // Vertical chart or horizontal chart
  const defaultExpandOptions = expandableOptions.map((option) => {
    if (option.id === STATISTIC_OPTION) return { ...option, selected: isShowStatistic };
    else if (option.id === SELECTION_OPTION) return { ...option, selected: isSelectRegion };
    else if (option.id === SHOW_OFF_DATA_POINT_MARKER) return { ...option, selected: isOffDataPoint };
    else if ([ADD_ROW_OPTION, DELETE_ROW_OPTION].includes(option.id))
      return { ...option, visible: shouldShowRowOptions };
    else if ([ADD_COLUMN_OPTION, DELETE_COLUMN_OPTION].includes(option.id))
      return { ...option, visible: shouldShowColumnOptions };
    else return option;
  });

  const chartRefs = useRef([]);
  const chartInstanceRefs = useRef([]);
  const axisRef = useRef({ xUnit: xAxis?.unit || "", yUnit: "", yMin: 0, yMax: 1.0 });
  const valueContainerElRef = useRef([]);

  //=================================================================================
  //============================== useImperativeHandle ==============================
  //=================================================================================
  useImperativeHandle(ref, () => ({
    clearData: () => {},

    /*
    This function is used to clear hiddenDataLineIds
    in the LineChart for the deleted dataRunIds
    */
    modifyDataRunIds: ({ dataRunIds }) => {
      try {
        for (const hiddenDataLineId of hiddenDataLineIds) {
          const { dataRunId } = parseHiddenDataLineId(hiddenDataLineId);
          if (!dataRunIds.includes(dataRunId)) {
            hiddenDataLineIds.delete(dataRunId);
          }
        }

        chartInstanceRefs.current.forEach((chartInstanceRef, index) => {
          // Delete all the label + statistic notes of the deleted dataRunIds
          const allLabelNotes = getAllCurrentLabelNotes({ pageId, widgetId: widgets[index].id });
          const allPointDataPreviews = getAllCurrentPointDataPreview({ pageId, widgetId: widgets[index].id });
          const allLabelDeltas = getAllCurrentDeltas({ pageId, widgetId: widgets[index].id });
          const allStatisticNotes = getAllCurrentStatisticNotes({ pageId, widgetId: widgets[index].id });

          Object.keys(allLabelNotes).forEach((labelNodeKey) => {
            if (_.get(chartInstanceRef, `config.options.plugins.annotation.annotations[${labelNodeKey}]`))
              delete chartInstanceRef.config.options.plugins.annotation.annotations[labelNodeKey];
          });
          Object.keys(allLabelDeltas).forEach((labelDeltaKey) => {
            if (_.get(chartInstanceRef, `config.options.plugins.annotation.annotations[${labelDeltaKey}]`)) {
              delete chartInstanceRef.config.options.plugins.annotation.annotations[labelDeltaKey];
            }
          });

          Object.keys(allPointDataPreviews).forEach((key) => {
            if (_.get(chartInstanceRef, `config.options.plugins.annotation.annotations[${key}]`))
              delete chartInstanceRef.config.options.plugins.annotation.annotations[key];
          });

          for (const statisticNote of allStatisticNotes.linearRegNotes) {
            if (!dataRunIds.includes(statisticNote.dataRunId)) {
              const linearRegNoteId = statisticNote.id;

              statisticNotesStorage.delete(statisticNote.id);
              if (_.get(chartInstanceRef, `config.options.plugins.annotation.annotations[${linearRegNoteId}]`))
                delete chartInstanceRef.config.options.plugins.annotation.annotations[linearRegNoteId];
            }
          }
          Object.keys(allStatisticNotes.summaryNotes).forEach((summaryNoteId, index) => {
            if (!dataRunIds.includes(allStatisticNotes.linearRegNotes[index].dataRunId)) {
              if (_.get(chartInstanceRef, `config.options.plugins.annotation.annotations[${summaryNoteId}]`))
                delete chartInstanceRef.config.options.plugins.annotation.annotations[summaryNoteId];
            }
          });
        });
      } catch (error) {
        console.error("LineChart_modifyDataRunIds: ", error);
      }
    },

    modifySensors: ({ sensors }) => {
      try {
        const curSensorInfos = [];

        for (const sensor of sensors) {
          const sensorInfo = createSensorInfo(sensor);
          curSensorInfos.push(sensorInfo);
        }
        chartInstanceRefs.current.forEach((chartInstanceRef, index) => {
          if (!chartInstanceRef.attached) return;
          const allLabelNotes = getAllCurrentLabelNotes({ pageId, widgetId: widgets[index].id });
          const allLabelDeltas = getAllCurrentDeltas({ pageId, widgetId: widgets[index].id });
          const allPointDataPreviews = getAllCurrentPointDataPreview({ pageId, widgetId: widgets[index].id });

          const allStatisticNotes = getAllCurrentStatisticNotes({ pageId, widgetId: widgets[index].id });

          Object.keys(allLabelNotes).forEach((labelNodeKey) => {
            if (
              !curSensorInfos.includes(allLabelNotes[labelNodeKey].sensorInfo) &&
              _.get(chartInstanceRef, `config.options.plugins.annotation.annotations[${labelNodeKey}]`)
            )
              delete chartInstanceRef.config.options.plugins.annotation.annotations[labelNodeKey];
          });
          Object.keys(allLabelDeltas).forEach((labelDeltaKey) => {
            if (
              !curSensorInfos.includes(allLabelDeltas[labelDeltaKey].sensorInfo) &&
              _.get(chartInstanceRef, `config.options.plugins.annotation.annotations[${labelDeltaKey}]`)
            ) {
              delete chartInstanceRef.config.options.plugins.annotation.annotations[labelDeltaKey];
            }
          });

          Object.keys(allPointDataPreviews).forEach((key) => {
            if (
              !curSensorInfos.includes(allPointDataPreviews[key].sensorInfo) &&
              _.get(chartInstanceRef, `config.options.plugins.annotation.annotations[${key}]`)
            )
              delete chartInstanceRef.config.options.plugins.annotation.annotations[key];
          });

          for (const statisticNote of allStatisticNotes.linearRegNotes) {
            if (!curSensorInfos.includes(statisticNote.sensorInfo)) {
              const linearRegNoteId = statisticNote.id;

              statisticNotesStorage.delete(statisticNote.id);
              if (_.get(chartInstanceRef, `config.options.plugins.annotation.annotations[${linearRegNoteId}]`))
                delete chartInstanceRef.config.options.plugins.annotation.annotations[linearRegNoteId];
            }
          }
          Object.keys(allStatisticNotes.summaryNotes).forEach((summaryNoteId, index) => {
            if (!curSensorInfos.includes(allStatisticNotes.linearRegNotes[index].sensorInfo)) {
              if (_.get(chartInstanceRef, `config.options.plugins.annotation.annotations[${summaryNoteId}]`))
                delete chartInstanceRef.config.options.plugins.annotation.annotations[summaryNoteId];
            }
          });
        });
      } catch (error) {
        console.error("LineChart_modifyDataRunIds: ", error);
      }
    },

    setChartData: ({ widgetIndex, widgetId, chartDatas = [], isDefaultXAxis, sensors }) => {
      if (chartInstanceRefs.current[widgetIndex])
        updateChart({
          chartInstance: chartInstanceRefs.current[widgetIndex],
          data: chartDatas,
          axisRef: axisRef,
          pageId,
          isDefaultXAxis,
          sensors,
          widgetId,
        });
    },
  }));

  useEffect(() => {
    // Clear Range Selection
    isRangeSelected = isSelectRegion;

    const minUnitValue = SensorServicesIST.getMinUnitValueAllSensors();

    const sensorContainers = document.getElementsByClassName("sensor-select-vertical-mount-container");
    Array.from(sensorContainers).forEach((item) => {
      item.style.maxWidth = (document.documentElement.clientHeight - 300) / (widgets.length + 0.5) + "px";
    });

    widgets.forEach((widget, i) => {
      const chartJsPlugin = getChartJsPlugin({ valueLabelContainerRef: valueContainerElRef.current[i] });
      if (!chartInstanceRefs.current[i] || !chartInstanceRefs.current[i].attached) {
        chartInstanceRefs.current[i] = new Chart(chartRefs.current[i], {
          type: "line",
          options: {
            events: ["mousemove", "mouseout", "mousedown", "mouseup", "click", "touchstart", "touchmove"],
            elements: {
              point: {
                pointStyle: POINT_STYLE,
                pointRadius: POINT_RADIUS,
                pointHoverRadius: POINT_HOVER_RADIUS,
              },
            },
            onClick: (event, elements, chart) => {
              const { status, newPointEl } = onClickChartHandler({
                event,
                elements,
                chart,
                selectedPointElement,
                widgetIndex: i,
                POINT_RADIUS,
              });
              if (status) {
                const { datasetIndex, index: dataPointIndex } = newPointEl;
                const currentDataset = chart.data.datasets[datasetIndex];
                const xValue = currentDataset.data[dataPointIndex].x;
                const yValue = currentDataset.data[dataPointIndex].y;
                const dataRunId = currentDataset?.dataRunId;
                const sensorInfo = currentDataset?.yAxis?.sensorInfo;

                const deltaResult = findFirstDeltaByValue({
                  pageId,
                  widgetId: widget.id,
                  dataRunId,
                  sensorInfo,
                  xValue,
                  yValue,
                });

                selectedPointElement = newPointEl;
                selectedNoteElement = null;
                chartSelectedIndex = i;
                handleAddPointDataPreview(newPointEl);
                setDeltaSelected(deltaResult);
              } else {
                const otherPointData = getAllCurrentPointDataPreview({ pageId, widgetId: i });
                Object.keys(otherPointData).forEach((key) => {
                  delete chart.config.options.plugins.annotation.annotations[key];
                });

                chart.update();
              }
              return true;
            },
            animation: false,
            maintainAspectRatio: false,
            plugins: {
              tooltip: { enabled: false },

              zoom: {
                pan: {
                  // pan options and/or events
                  enabled: true,
                  mode: "xy",
                },
                limits: {
                  x: { min: X_MIN_VALUE },
                  y: { min: minUnitValue - Y_MIN_VALUE },
                },
                zoom: {
                  wheel: {
                    enabled: true,
                  },
                  pinch: {
                    enabled: true,
                  },

                  mode: "xy",
                  scaleMode: "xy",
                },
              },

              annotation: {
                enter: ({ chart, element }) => onEnterNoteElement({ chart, element }),
                leave: ({ chart, element }) => onLeaveNoteElement({ chart, element }),
                click: ({ element }) => {
                  if (isDragging) {
                    isDragging = false;
                    return false;
                  }

                  const { status, element: newElement } = onClickNoteElement({ element, selectedNoteElement });
                  if (status) {
                    selectedNoteElement = newElement;
                    chartSelectedIndex = i;
                  }
                  return true;
                },
                annotations: {},
              },

              legend: {
                display: true,
                onClick: (event, legendItem, legend) =>
                  onClickLegendHandler({ pageId, event, legendItem, legend, widgetId: widget.id }),
                labels: {
                  filter: (item) => item.text !== "none",
                },
              },
            },
          },
          plugins: [
            chartJsPlugin,
            {
              id: "annotation-dragger",
              beforeEvent(chart, args, options) {
                if (handleDrag({ event: args.event, chart, pageId, widgetId: widget.id })) {
                  args.changed = true;
                  return;
                }
              },
            },
          ],
        });

        // Not need updated chart, as updateChart function will call update
        chartInstanceRefs.current[i].config.options.plugins.zoom.pan.enabled = !isSelectRangeSelection;
        chartInstanceRefs.current[i].config.options.plugins.zoom.zoom.pinch.enabled = !isSelectRangeSelection;
        chartInstanceRefs.current[i].config.options.plugins.zoom.zoom.wheel.enabled = !isSelectRangeSelection;

        updateChart({
          chartInstance: chartInstanceRefs.current[i],
          data: [],
          axisRef: axisRef,
          pageId,
          widgetId: widget.id,
        });
      }
    });
  }, [widgets]);

  //========================= ADD NOTE FUNCTIONS =========================
  const addNoteHandler = () => {
    const chartInstance = chartInstanceRefs.current[chartSelectedIndex];
    const isValidPointElement = selectedPointElement?.element;
    const isValidNoteElement = selectedNoteElement?.options;
    if (!isValidPointElement && !isValidNoteElement) return;

    let noteId, sensorInfo;
    let prevContent = [""];
    let yScaleId = "y";

    // Get NoteId to find whether the note is exist or not
    // for getting the old content of note
    if (isValidNoteElement) {
      noteId = selectedNoteElement.options.id;
    } else if (isValidPointElement) {
      const datasetIndex = selectedPointElement.datasetIndex;
      const dataPointIndex = selectedPointElement.index;
      const dataset = chartInstance.data.datasets[datasetIndex];
      const dataRunId = dataset?.dataRunId;
      sensorInfo = dataset?.yAxis?.sensorInfo;
      const sensorId = parseSensorInfo(sensorInfo).id;
      if (widgets[chartSelectedIndex].sensors.length > 1) {
        const sensorIndex = widgets[chartSelectedIndex].sensors.findIndex((item) => item.id == sensorId);
        yScaleId = sensorIndex > 0 ? `y${sensorIndex}` : "y";
      }
      noteId = createLabelNoteId({
        pageId,
        widgetId: widgets[chartSelectedIndex].id,
        dataRunId,
        sensorInfo,
        dataPointIndex,
      });
    } else return;

    const labelNote = labelNotesStorage.find(noteId);
    if (labelNote) {
      const note = labelNote.label;
      prevContent = note.content;
      prevContent = prevContent.join(" ");
    }

    showModal((onClose) => (
      <PromptPopup
        title={t("organisms.add_comments")}
        inputLabel={t("organisms.commentary")}
        defaultValue={prevContent}
        onClosePopup={onClose}
        extraData={{ sensorInfo, chartInstance, yScaleId }}
      />
    ));
  };

  const callbackAddLabelNote = ({ newInput: newContent, extraData }) => {
    const result = addLabelNote({
      chartInstance: extraData.chartInstance,
      pageId: pageId,
      sensorInfo: extraData.sensorInfo,
      newContent: newContent,
      selectedPointElement,
      selectedNoteElement,
      widgetId: widgets[chartSelectedIndex].id,
      yScaleId: extraData.yScaleId,
    });

    if (result) {
      // Clear selected point
      const otherPointData = getAllCurrentPointDataPreview({ pageId, widgetId: widgets[chartSelectedIndex].id });
      Object.keys(otherPointData).forEach((key) => {
        delete extraData.chartInstance.config.options.plugins.annotation.annotations[key];
      });

      extraData.chartInstance.update();
      selectedPointElement = null;
      selectedNoteElement = null;
      chartSelectedIndex = null;
      const iconContainers = document.getElementsByClassName("icon-container-widget");
      Array.from(iconContainers).forEach((iconContainer) => {
        iconContainer.style.display = "none";
      });
    }
  };
  const { prompt, showModal } = usePrompt({ className: "use-prompt-dialog-popup", callbackFn: callbackAddLabelNote });

  //========================= ADD DATA TOOLTIP FUNCTIONS =========================
  const handleAddPointDataPreview = (pointElement) => {
    const isValidPointElement = pointElement?.element;
    if (!isValidPointElement) {
      return;
    }

    const chartInstance = chartInstanceRefs.current[chartSelectedIndex];
    let noteId, sensorInfo;
    let prevContent = [""];
    let yScaleId = "y";

    // Get NoteId to find whether the note is exist or not
    // for getting the old content of note
    if (isValidPointElement) {
      const datasetIndex = pointElement.datasetIndex;
      const dataPointIndex = pointElement.index;
      const dataset = chartInstance.data.datasets[datasetIndex];
      const dataRunId = dataset?.dataRunId;
      sensorInfo = dataset?.yAxis?.sensorInfo;
      const sensorId = parseSensorInfo(sensorInfo).id;
      if (widgets[chartSelectedIndex].sensors.length > 1) {
        const sensorIndex = widgets[chartSelectedIndex].sensors.findIndex((item) => item.id == sensorId);
        yScaleId = sensorIndex > 0 ? `y${sensorIndex}` : "y";
      }

      const content = [
        dataset.name || dataset.label,
        `x= ${dataset.data[dataPointIndex]?.x} (${axisRef.current.xUnit})`,
        `y= ${dataset.data[dataPointIndex]?.y} (${dataset.yAxis.info.title.text})`,
      ];

      addPointDataPreview({
        chartInstance,
        pageId,
        dataRunId,
        sensorInfo,
        content,
        selectedPointElement: pointElement,
        widgetId: chartSelectedIndex,
        yScaleId,
        dataPointIndex,
      });
    } else return;

    const labelNote = labelNotesStorage.find(noteId);
    if (labelNote) {
      const note = labelNote.label;
      prevContent = note.content;
      prevContent = prevContent.join(" ");
    }
  };

  //========================= STATISTIC OPTION FUNCTIONS =========================
  const statisticHandler = ({ optionId, chart, widgetId, widgetIndex }) => {
    if (_.isEqual(widgets[widgetIndex].sensors, [DEFAULT_SENSOR_DATA])) return;

    if (!isShowStatistic) {
      f7.popover.open(".popover-statistic-options", `#${optionId}`);
    } else {
      const result = removeStatisticNote({
        chartInstance: chart,
        pageId,
        widgetId,
      });
      result && setIsShowStatistic(!isShowStatistic);
    }
  };

  const addStatisticHandler = ({ widgetId, sensors, chartInstance, statisticOptionId }) => {
    let isDefaultXAxis = [FIRST_COLUMN_DEFAULT_OPT].includes(xAxis?.id);
    const result = addStatisticNote({
      chartInstance,
      isShowStatistic,
      sensors,
      pageId,
      hiddenDataLineIds,
      isDefaultXAxis,
      statisticOptionId,
      widgetId,
    });
    result && setIsShowStatistic(!isShowStatistic);
  };

  //========================= SELECTION REGION FUNCTIONS =========================
  const selectRegionHandler = () => {
    isRangeSelected = !isSelectRegion;
    chartInstanceRefs.current.forEach((chartInstance, index) => {
      chartInstance.config.options.plugins.zoom.pan.enabled = !isRangeSelected;
      chartInstance.config.options.plugins.zoom.zoom.pinch.enabled = !isRangeSelected;
      chartInstance.config.options.plugins.zoom.zoom.wheel.enabled = !isRangeSelected;

      if (!isRangeSelected) {
        const widgetId = widgets[index].id;
        handleDeleteSelection({ pageId, chartInstance, widgetId });
        const statisticNotes = statisticNotesStorage.query({ pageId, widgetId });
        statisticNotes.forEach((statisticNote) => {
          statisticNotesStorage.delete(statisticNote.id);
          delete chartInstance.config.options.plugins.annotation.annotations[statisticNote.id];

          if (statisticNote.linearReg) {
            chartInstance.data.datasets = chartInstance.data.datasets.filter(
              (dataset) => dataset.id != statisticNote.linearReg.id
            );
          }
          addStatisticNote({
            chartInstance,
            isShowStatistic,
            sensors: widgets[index].sensors,
            pageId,
            hiddenDataLineIds,
            isDefaultXAxis: statisticNote.isDefaultXAxis,
            statisticOptionId: statisticNote.statisticOptionId,
            widgetId,
          });
        });
      } else {
        chartInstance.update();
      }
    });
    // isRangeSelected = True => display zoom

    setIsSelectRegion(isRangeSelected);
  };

  //========================= SHOW OFF DATA POINT FUNCTIONS =========================
  const showOffDataPointHandler = (chartInstance) => {
    if (isOffDataPoint) {
      chartInstance.config.options.elements.point.pointStyle = POINT_STYLE;
    } else {
      chartInstance.config.options.elements.point.pointStyle = false;
    }
    chartInstance.update();
    setIsOffDataPoint(!isOffDataPoint);
  };

  //========================= CUSTOM X AXIS FUNCTION =========================
  const onSelectUserUnit = ({ option }) => {
    // if (option.id === xAxis.id) return;

    let chartDatas = [];
    let isDefaultXAxis = true;

    axisRef.current.xUnit = option.unit;
    handleXAxisChange({ xAxisId: xAxis.id, option: option });
    widgets.forEach((widget, index) => {
      updateChart({
        chartInstance: chartInstanceRefs.current[index],
        data: chartDatas,
        axisRef: axisRef,
        pageId,
        isDefaultXAxis,
      });
    });
  };

  const changeSelectedSensor = ({ sensor, sensorIndex, widgetId }) => {
    axisRef.current.yUnit = sensor.unit;
    handleSensorChange({ widgetId, sensorIndex, sensor });
  };

  const addColumnHandler = () => {
    const numSensor = widgets[0].sensors?.length ?? 0;
    if (numSensor >= 4) return;
    const canvas = chartRefs.current[0];
    canvas.style.width = 40 * (numSensor + 1) + "px";

    handleAddExtraCollectingSensor({ widgetId: widgets[0].id });
    setShouldShowRowOptions(false);
  };

  const deleteColumnHandler = (sensorDeletedId) => {
    const numSensor = widgets[0].sensors?.length ?? 1;
    if (numSensor <= 1) return;
    const deletedColumn = sensorDeletedId || numSensor - 1;

    const container = document.getElementById("line-chart-canvas-container");
    const canvas = container.querySelector("canvas");
    canvas.style.width = 40 * (numSensor - 1) + "px";

    handleDeleteExtraCollectingSensor(widgets[0].id, deletedColumn);
    if (numSensor <= 2) {
      setShouldShowRowOptions(true);
    }
  };

  const addRowHandler = () => {
    if (widgets.length >= 3) return;
    else {
      handleAddWidget();
      setShouldShowColumnOptions(false);
    }
  };

  const deleteRowHandler = (widgetId) => {
    const numWidget = widgets?.length ?? 1;
    if (numWidget <= 1) return;
    handleDeleteWidget(widgetId);
    if (numWidget <= 2) {
      setShouldShowColumnOptions(true);
    }
  };

  //next add icon delete above range
  const deleteDataInRangeSelection = () => {
    const selectedRanges = getListRangeSelections({ pageId: pageId });
    let xAxisWillDeletes = [];
    let xAxisSensorId = null;
    chartInstanceRefs.current.forEach((chart, index) => {
      const datasets = chart.config.data.datasets;
      const selectedRange = selectedRanges.find((item) => item.chartId == chart.id);
      if (selectedRange)
        datasets.forEach((dataset) => {
          const dataRunId = dataset.dataRunId;
          const sensorInfo = dataset.yAxis.sensorInfo;
          const deletedResult = DataManagerIST.deleteSensorDataInDataRun({
            dataRunId,
            sensorInfo,
            selectedRange,
            unitId: xAxis.id,
          });
          if (deletedResult.unitType === FIRST_COLUMN_SENSOR_OPT) {
            if (xAxisWillDeletes.find((item) => item.dataRunId == deletedResult.data.dataRunId)) {
              const index = xAxisWillDeletes.indexOf((item) => item.dataRunId == deletedResult.data.dataRunId);
              xAxisWillDeletes[index].indexes.push(deletedResult.data.indexes);
            } else {
              xAxisWillDeletes = xAxisWillDeletes.push(deletedResult.data);
            }
            xAxisSensorId = deletedResult.xAxisSensorId;
          }
        });

      handleDeleteSelection({ pageId, chartInstance: chart, widgetId: widgets[index].id });
    });

    //handle delete xAxis if xAxis is sensor
    if (xAxisWillDeletes.length > 0) {
      xAxisWillDeletes.forEach((xAxisWillDelete) => {
        DataManagerIST.deleteSensorDataInDataRunByIndexes({
          dataRunId: xAxisWillDelete.dataRunId,
          sensorId: xAxisSensorId,
          indexes: xAxisWillDelete.indexes,
        });
      });
    }
  };

  const handleChangeSelectedNote = ({ type }) => {
    if (!selectedPointElement) return;
    const { datasetIndex, index: dataPointIndex } = selectedPointElement;
    const chartInstance = chartInstanceRefs.current[chartSelectedIndex];
    const currentDataset = chartInstance.data.datasets[datasetIndex];

    const newDataPointIndex =
      type == "next"
        ? (dataPointIndex + 1) % currentDataset.data.length
        : (dataPointIndex - 1 + currentDataset.data.length) % currentDataset.data.length;

    if (deltaSelected) {
      const newXValue = currentDataset.data[newDataPointIndex].x;
      const newYValue = currentDataset.data[newDataPointIndex].y;
      const { delta, isMax } = deltaSelected;
      if (isMax) {
        delta.xMax = newXValue;
        delta.yMax = newYValue;
      } else {
        delta.xMin = newXValue;
        delta.yMin = newYValue;
      }
      setDeltaSelected({ delta, isMax });
      deltasStorage.save(delta);
      const annotation = getChartAnnotationByDelta(delta);
      Object.keys(annotation).forEach((key) => {
        if (_.get(chartInstance, `config.options.plugins.annotation.annotations[${key}]`)) {
          delete chartInstance.config.options.plugins.annotation.annotations[key];
        }
        chartInstance.config.options.plugins.annotation.annotations[key] = annotation[key];
      });
    }
    // const newDataPointIndex = (dataPointIndex - 1 + currentDataset.data.length) % currentDataset.data.length;

    const newPointBackgroundColor = Array.from(
      { length: currentDataset.data.length },
      () => currentDataset.backgroundColor
    );
    const newPointBorderColor = Array.from({ length: currentDataset.data.length }, () => currentDataset.borderColor);
    const newPointSize = Array.from({ length: currentDataset.data.length }, () => POINT_RADIUS);

    newPointBackgroundColor[newDataPointIndex] = "blue"; // Highlight new point
    newPointSize[newDataPointIndex] = POINT_HOVER_RADIUS;

    currentDataset.pointBackgroundColor = newPointBackgroundColor;
    currentDataset.pointBorderColor = newPointBorderColor;
    currentDataset.pointRadius = newPointSize;

    const newSelectedPointElement = {
      datasetIndex,
      index: newDataPointIndex,
      element: chartInstance.getDatasetMeta(datasetIndex).data[newDataPointIndex],
    };
    handleAddPointDataPreview(newSelectedPointElement);
    selectedPointElement = newSelectedPointElement;

    chartInstance.update();
  };

  //========================= DELTA FUNCTIONS =========================

  const handleAddDelta = () => {
    if (!selectedPointElement) return;
    const { datasetIndex, index: dataPointIndex } = selectedPointElement;
    const chartInstance = chartInstanceRefs.current[chartSelectedIndex];
    const currentDataset = chartInstance.data.datasets[datasetIndex];
    const dataRunId = currentDataset?.dataRunId;
    const sensorInfo = currentDataset?.yAxis?.sensorInfo;
    let pointDeltaMaxIndex = dataPointIndex + Math.round(currentDataset.data.length / 3);
    if (pointDeltaMaxIndex >= currentDataset.data.length) pointDeltaMaxIndex = currentDataset.data.length - 1;

    const result = addDelta({
      pageId,
      widgetId: widgets[chartSelectedIndex].id,
      dataRunId,
      sensorInfo,
      xMin: currentDataset.data[dataPointIndex].x,
      yMin: currentDataset.data[dataPointIndex].y,
      xMax: currentDataset.data[pointDeltaMaxIndex].x,
      yMax: currentDataset.data[pointDeltaMaxIndex].y,
      chartInstance,
    });

    setDeltaSelected({ delta: result, isMax: false });
  };

  const deleteDeltaHandler = () => {
    if (!deltaSelected) return;
    const chartInstance = chartInstanceRefs.current[chartSelectedIndex];
    const deltaId = deltaSelected.delta.id;
    const annotation = getChartAnnotationByDelta(deltaSelected.delta);
    Object.keys(annotation).forEach((key) => {
      if (_.get(chartInstance, `config.options.plugins.annotation.annotations[${key}]`)) {
        delete chartInstance.config.options.plugins.annotation.annotations[key];
      }
    });
    deltasStorage.delete(deltaId);
    setDeltaSelected(null);
    chartInstance.update();
  };

  //========================= OPTIONS FUNCTIONS =========================
  const onChooseOptionHandler = ({ optionId }) => {
    switch (optionId) {
      case SCALE_FIT_OPTION:
        chartInstanceRefs.current.forEach((chartInstanceRef) => {
          scaleToFixHandler(chartInstanceRef, axisRef, xAxis);
        });
        break;
      case NOTE_OPTION:
        addNoteHandler();
        break;
      case INTERPOLATE_OPTION:
        chartInstanceRefs.current.forEach((chartInstanceRef) => {
          interpolateHandler(chartInstanceRef, hiddenDataLineIds);
        });
        break;
      case STATISTIC_OPTION:
        chartInstanceRefs.current.forEach((chartInstanceRef, index) => {
          statisticHandler({ optionId, chart: chartInstanceRef, widgetId: widgets[index].id, widgetIndex: index });
        });
        break;
      case SELECTION_OPTION:
        selectRegionHandler();
        break;
      case SHOW_OFF_DATA_POINT_MARKER:
        chartInstanceRefs.current.forEach((chartInstanceRef) => {
          showOffDataPointHandler(chartInstanceRef);
        });
        break;
      case ADD_COLUMN_OPTION:
        addColumnHandler();
        break;
      case DELETE_COLUMN_OPTION:
        deleteColumnHandler();
        break;
      case ADD_ROW_OPTION:
        addRowHandler();
        break;
      case DELETE_ROW_OPTION:
        deleteRowHandler(widgets[widgets.length - 1].id);
        break;
      case DELETE_RANGE_SELECTION:
        deleteDataInRangeSelection();
        break;
      default:
        break;
    }
  };

  //==========================CLICK DELETE CHART========================
  const handleChartOnclick = (card) => {
    setActiveChart(card);
    setIsShowIconDeleteChart(true);

    // Ẩn icon sau 5 giây
    setTimeout(() => {
      setIsShowIconDeleteChart(false);
      setActiveChart(null); // Reset active card
    }, 5000);
  };

  return (
    <div className="line-chart-wapper">
      {widgets.map((widget, index) => (
        <div className="line-chart" key={`line-chart-selector-${pageId}-${index}`}>
          {widget.sensors.map((sensor, sensorIndex) => (
            <div
              key={`line-sensor-selector-${pageId}-${sensorIndex}`}
              className="sensor-selector-wrapper"
              onClick={() => handleChartOnclick(sensorIndex)}
            >
              <div className="sensor-select-vertical-mount-container">
                {isShowIconDeleteChart && activeChart === sensorIndex && widget.sensors.length > 1 && (
                  <div className="icon-delete-chart" onClick={() => deleteColumnHandler(sensorIndex)}>
                    <img src={deleteIconChart} alt="delete" />
                  </div>
                )}

                <SensorSelector
                  selectedSensor={sensor}
                  onChange={(sensor) => changeSelectedSensor({ sensor, sensorIndex, widgetId: widgets[index].id })}
                  onSelectUserInit={onSelectUserUnit}
                  // definedSensors={xAxis.id === FIRST_COLUMN_DEFAULT_OPT ? false : definedSensors}
                ></SensorSelector>
              </div>
            </div>
          ))}
          <div id="line-chart-canvas-container" className="canvas-container" onClick={() => handleChartOnclick(index)}>
            {/* cannot set current data for second or more sensor */}

            <div
              className="current-value-sec"
              ref={(el) => (valueContainerElRef.current[index] = el)}
              style={{ opacity: `${index === 0 ? "1" : "0"}` }}
            ></div>

            <canvas ref={(el) => (chartRefs.current[index] = el)} />
            <div
              id={`icon-container-widget-${index}`}
              className="icon-container-widget"
              style={{ position: "absolute", display: "none" }}
            >
              <div style={{ cursor: "pointer", width: "20px", height: "20px" }} onClick={() => handleAddDelta()}>
                <img src={deltaIcon} alt="deltaIcon" />
              </div>
              <div
                style={{ cursor: "pointer", width: "20px", height: "20px", paddingLeft: "10px", marginLeft: "5px" }}
                onClick={() => handleChangeSelectedNote({ type: "prev" })}
              >
                <img src={previousIcon} alt="previousIcon" />
              </div>
              <div
                style={{ cursor: "pointer", width: "20px", height: "20px", paddingLeft: "10px", marginLeft: "5px" }}
                onClick={() => handleChangeSelectedNote({ type: "next" })}
              >
                <img src={nextIcon} alt="nextIcon" />
              </div>
              {deltaSelected && (
                <div
                  style={{ cursor: "pointer", width: "20px", height: "20px", paddingLeft: "10px", marginLeft: "5px" }}
                  onClick={() => deleteDeltaHandler()}
                >
                  <img src={deleteIconChart} alt="deleteIconChart" />
                </div>
              )}
              <div
                style={{ cursor: "pointer", width: "20px", height: "20px", paddingLeft: "10px", marginLeft: "5px" }}
                onClick={() => addNoteHandler()}
              >
                <img src={addNoteIcon} alt="addNoteIcon" />
              </div>
            </div>
          </div>
          {isShowIconDeleteChart && activeChart === index && widgets.length > 1 && (
            <div className="icon-delete-chart-vertical" onClick={() => deleteRowHandler(widget.id)}>
              <img src={deleteIconChart} alt="delete" />
            </div>
          )}
        </div>
      ))}

      <div className="expandable-options">
        <ExpandableOptions
          expandIcon={lineChartIcon}
          options={defaultExpandOptions}
          onChooseOption={onChooseOptionHandler}
        />
        <PopoverStatisticOptions
          callback={({ statisticOptionId }) =>
            widgets.forEach((widget, index) => {
              addStatisticHandler({
                sensors: widget.sensors,
                chartInstance: chartInstanceRefs.current[index],
                statisticOptionId,
                widgetId: widget.id,
              });
            })
          }
        />
        <div className="sensor-selector-wrapper">
          <div className="sensor-select-vertical-mount-container">
            <SensorSelector
              selectedSensor={xAxis?.id === FIRST_COLUMN_DEFAULT_OPT ? DEFAULT_SENSOR_DATA : xAxis}
              selectedUnit={`${t(xAxis?.name)} (${xAxis?.unit})`}
              onChange={(sensor) =>
                onSelectUserUnit({
                  option: { id: `${FIRST_COLUMN_SENSOR_OPT}:${sensor.id}`, unit: sensor.unit, name: sensor.name },
                })
              }
              onSelectUserInit={onSelectUserUnit}
              defaultTab={null}
            />
          </div>
        </div>
      </div>
      {prompt}
    </div>
  );
};

LineChart = forwardRef(LineChart);
export default LineChart;
