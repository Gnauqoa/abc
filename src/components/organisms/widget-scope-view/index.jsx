import React, { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import { useTranslation } from "react-i18next";

import "./index.scss";
import { useActivityContext } from "../../../context/ActivityContext";
import {
  createChartDataAndParseXAxis,
  createChartJsDatas,
  getMaxMinAxises,
  expandableOptions,
  STATISTIC_OPTION,
  SELECTION_OPTION,
  SHOW_OFF_DATA_POINT_MARKER,
  INTERPOLATE_OPTION,
  ADD_COLUMN_OPTION,
  DELETE_COLUMN_OPTION,
  ADD_ROW_OPTION,
  DELETE_ROW_OPTION,
  DELETE_RANGE_SELECTION,
  POINT_STYLE,
  POINT_HOVER_RADIUS,
  interpolateHandler,
  ALLOW_ENTER_LEAVE_ANNOTATIONS,
  PREFIX_STATISTIC_NOTE,
  STATISTIC_NOTE_TYPE,
  getChartJsPlugin,
  PREFIX_LABEL_NOTE,
  NOTE_OPTION,
  SCALE_FIT_OPTION,
  LABEL_NOTE_TYPE,
} from "../../../utils/widget-line-chart/commons";
import SensorSelector from "../../molecules/popup-sensor-selector";

import SensorServicesIST, {
  SINE_WAVE_SENSOR_INFO,
  FREQUENCY_WAVE_SENSOR_INFO,
  CURRENT_SENSOR_V2_INFO,
  VOLTAGE_SENSOR_V2_INFO,
  SOUND_SENSOR_V2_LEVEL_INFO,
  SOUND_SENSOR_V2_INTENSITY_INFO,
  SOUND_SENSOR_V2_ID,
} from "../../../services/sensor-service";

import MicrophoneServiceIST, { BUFFER_LENGTH } from "../../../services/microphone-service";
import DataManagerIST from "../../../services/data-manager";
import { createSensorInfo } from "../../../utils/core";

import ExpandableOptions from "../../molecules/expandable-options";
import lineChartIcon from "../../../img/expandable-options/line.png";
import { onClickChartHandler, onClickNoteElement } from "../../../utils/widget-line-chart/annotation-plugin";
import {
  addDelta,
  findFirstDeltaByValue,
  getChartAnnotationByDelta,
  getAllCurrentDeltas,
} from "../../../utils/widget-line-chart/delta-plugin";
import {
  addLabelNote,
  createLabelNoteId,
  getAllCurrentLabelNotes,
} from "../../../utils/widget-line-chart/label-plugin";
import usePrompt from "../../../hooks/useModal";
import deleteIconChart from "../../../img/expandable-options/ico-tool-delete.png";
import nextIcon from "../../../img/expandable-options/ico-tool-rightarrow.png";
import previousIcon from "../../../img/expandable-options/ico-tool-leftarrow.png";
import addNoteIcon from "../../../img/expandable-options/ico-tool-edit.png";
import deltaIcon from "../../../img/expandable-options/ico-tool-delta.png";
import StoreService from "../../../services/store-service";
import {
  LINE_CHART_LABEL_NOTE_TABLE,
  LINE_CHART_STATISTIC_NOTE_TABLE,
  LINE_CHART_DELTA_TABLE,
  LINE_CHART_RANGE_SELECTION_TABLE,
} from "../../../js/constants";
import PromptPopup from "../../molecules/popup-prompt-dialog";
import {
  handleAddSelection,
  handleDeleteSelection,
  getListRangeSelections,
} from "../../../utils/widget-line-chart/selection-plugin";
import _, { isArray } from "lodash";
import PopoverStatisticOptions from "../widget-line-chart/PopoverStatisticOptions";
import { addStatisticNote, removeStatisticNote } from "../../../utils/widget-scope-view/statistic-plugin";
import { f7 } from "framework7-react";
import { FIRST_COLUMN_DEFAULT_OPT } from "../../../utils/widget-table-chart/commons";
import { getOscBufferData, clearOscBuffersData } from "../../../services/buffer-data-manager";
import {
  addPointDataPreview,
  getAllCurrentPointDataPreview,
} from "../../../utils/widget-line-chart/point-data-preview-plugin";

const MAX_DECIBEL = 120;
const MIN_DECIBEL = 30;
const DEFAULT_MIN_AMPLITUDE = 0.01;
const MAX_FREQUENCY = 2000;
const POINT_RADIUS = 2;
const READ_BUFFER_INTERVAL = 50;

let drawChartAnimationFrameId;
let drawChartTimeoutID;

let selectedPointElement = null;
let selectedNoteElement = null;
let isDragging = false;
let noteElement;
let lastNoteEvent;
let isRangeSelected = false;
let startRangeElement = null;

const labelNotesStorage = new StoreService(LINE_CHART_LABEL_NOTE_TABLE);
const statisticNotesStorage = new StoreService(LINE_CHART_STATISTIC_NOTE_TABLE);
const deltasStorage = new StoreService(LINE_CHART_DELTA_TABLE);
const rangeSelectionStorage = new StoreService(LINE_CHART_RANGE_SELECTION_TABLE);

setInterval(() => {
  clearOscBuffersData();
}, READ_BUFFER_INTERVAL);

const handleDrag = function ({ event, chart, pageId, widgetId }) {
  if (isRangeSelected) {
    switch (event.type) {
      case "mousemove":
      case "touchmove":
        if (!startRangeElement) return;
        handleAddSelection({
          chartInstance: chart,
          startRangeElement: startRangeElement,
          endRangeElement: event,
          pageId,
          widgetId,
        });
        return true;

      case "mousedown": // press the mouse
      case "touchstart":
        startRangeElement = event;
        break;
      case "mouseout":
      case "mouseup": // do not press the mouse
      case "touchend":
        startRangeElement = undefined;
        break;
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

const updateChart = ({ chartInstance, data, maxX, maxY, minY, minX = 0, labelX, labelY, tension }) => {
  chartInstance.data = createChartJsDatas({
    chartDatas: data,
    pointRadius: POINT_RADIUS,
    tension: tension,
  });

  chartInstance.options.animation = false;
  chartInstance.options.scales = {
    y: {
      suggestedMin: minY,
      suggestedMax: maxY,
      title: {
        color: "orange",
        display: true,
        text: labelY,
      },
    },
    x: {
      type: "linear",
      min: Math.round(minX),
      max: Math.round(maxX),
      ticks: {},
      title: {
        color: "orange",
        display: true,
        text: labelX,
        align: "end",
      },
    },
  };
  chartInstance.update();
};

const ScopeViewWidget = ({ widget, pageId }) => {
  const { t } = useTranslation();

  const { currentDataRunId, isRunning, handleSensorChange } = useActivityContext();
  const canvasRef = useRef();
  const valueLabelContainerRef = useRef();
  const chartInstanceRef = useRef();
  const [isOffDataPoint, setIsOffDataPoint] = useState(false);
  const [deltaSelected, setDeltaSelected] = useState(); // {delta, isMax}
  const isSelectRangeSelection = rangeSelectionStorage.query({ pageId: pageId }).length > 0;
  const [isSelectRegion, setIsSelectRegion] = useState(isSelectRangeSelection);
  const isSelectStatistic = statisticNotesStorage.query({ pageId: pageId }).length > 0;

  const [isShowStatistic, setIsShowStatistic] = useState(isSelectStatistic);

  const defaultExpandOptions = expandableOptions
    .map((option) => {
      if (option.id === STATISTIC_OPTION) return { ...option, selected: isShowStatistic };
      else if (option.id === SELECTION_OPTION) return { ...option, selected: isSelectRegion };
      else if (option.id === SHOW_OFF_DATA_POINT_MARKER) return { ...option, selected: isOffDataPoint };
      else return option;
    })
    .filter(
      (option) => ![ADD_ROW_OPTION, DELETE_ROW_OPTION, ADD_COLUMN_OPTION, DELETE_COLUMN_OPTION].includes(option.id)
    );

  //========================= OPTIONS FUNCTIONS =========================
  const onChooseOptionHandler = ({ optionId }) => {
    switch (optionId) {
      case SCALE_FIT_OPTION:
        handleScale({ chartInstance: chartInstanceRef.current, sensorInfo, currentDataRunId });
        break;
      case NOTE_OPTION:
        addNoteHandler();
        break;
      case INTERPOLATE_OPTION:
        interpolateHandler(chartInstanceRef.current, []);
        break;
      case SHOW_OFF_DATA_POINT_MARKER:
        showOffDataPointHandler();
        break;
      case SELECTION_OPTION:
        selectRegionHandler();
        break;
      case STATISTIC_OPTION:
        statisticHandler({ optionId });
        break;
      case DELETE_RANGE_SELECTION:
        deleteDataInRangeSelection({ chartInstance: chartInstanceRef.current });
        break;
      default:
        break;
    }
  };
  const defaultSensorIndex = 0;
  const sensor = widget.sensors[defaultSensorIndex];
  const sensorInfo = createSensorInfo(sensor);
  const sensorDataInfo = SensorServicesIST.getSensorInfo(sensor.id)?.data[sensor.index];

  const oscSensors = SensorServicesIST.getOscSensors();
  const oscSensorsId = oscSensors.map((sensor) => sensor.id);

  useEffect(() => {
    try {
      const chartJsPlugin = getChartJsPlugin({ valueLabelContainerRef });
      chartInstanceRef.current = new Chart(canvasRef.current, {
        type: "line",
        options: {
          events: ["mousemove", "mouseout", "mousedown", "mouseup", "click", "touchstart", "touchmove"],
          elements: {
            point: {
              pointStyle: POINT_STYLE,
              radius: POINT_RADIUS,
              hoverRadius: POINT_HOVER_RADIUS,
            },
          },
          onClick: (event, elements, chart) => {
            const { status, newPointEl } = onClickChartHandler({
              event,
              elements,
              chart,
              selectedPointElement,
              POINT_RADIUS,
            });
            if (status) {
              const { datasetIndex, index: dataPointIndex } = newPointEl;
              const currentDataset = chart.data.datasets[datasetIndex];
              const xValue = currentDataset.data[dataPointIndex].x;
              const yValue = currentDataset.data[dataPointIndex].y;

              const deltaResult = findFirstDeltaByValue({
                pageId,
                widgetId: widget.id,
                xValue,
                yValue,
              });

              setDeltaSelected(deltaResult);

              selectedPointElement = newPointEl;
              selectedNoteElement = null;
              handleAddPointDataPreview(newPointEl);
            } else {
              const otherPointData = getAllCurrentPointDataPreview({ pageId, widgetId: widget.id });
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
            legend: {
              display: false, //This will do the task
            },
            zoom: {
              pan: {
                enabled: true,
                mode: "xy",
              },
              limits: {
                x: { min: 0 },
              },
              zoom: {
                wheel: {
                  enabled: true,
                },
                pinch: {
                  enabled: true,
                },

                mode: "xy",
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
          },
        },
        plugins: [
          chartJsPlugin,
          {
            id: "annotation-dragger",
            beforeEvent(chart, args, options) {
              if (handleDrag({ event: args.event, chart, pageId, widgetId: widget.id })) {
                args.inChartArea = false;
                return;
              }
            },
          },
        ],
      });

      const data = DataManagerIST.getOscDataDataRun(sensorInfo, currentDataRunId);
      if (Array.isArray(data) && data.length === 1) {
        let chartName, labelX, labelY, tension;
        if (sensorInfo === SINE_WAVE_SENSOR_INFO) {
          chartName = t("organisms.sound_amplitude");
          labelX = t("common.time") + " (ms)";
          labelY = t("organisms.sound_amplitude");
          tension = 0.6;
        } else if (sensorInfo === FREQUENCY_WAVE_SENSOR_INFO) {
          chartName = t("organisms.sound_level");
          labelX = t("organisms.sound_frequency");
          labelY = t("organisms.sound_frequency");
          tension = 0.2;
        } else {
          chartName = sensor.name;
          labelX = t("common.time") + " (ms)";
          labelY = sensor.name + ` (${sensor.unit})`;
          tension = 0.6;
        }

        const chartData = [
          {
            name: chartName,
            data: data[0],
            dataRunId: currentDataRunId,
          },
        ];

        const chartDatas = createChartDataAndParseXAxis({ chartDatas: chartData });
        const { maxX, maxY, minY } = getMaxMinAxises({ chartDatas: chartDatas });
        const yValue = Math.max(Math.abs(maxY), Math.abs(minY));
        updateChart({
          chartInstance: chartInstanceRef.current,
          data: chartDatas,
          maxX: maxX,
          maxY: yValue,
          labelY: labelY,
          labelX: labelX,
          tension: tension,
        });
      } else {
        // Not need updated chart, as updateChart function will call update
        chartInstanceRef.current.config.options.plugins.zoom.pan.enabled = !isSelectRangeSelection;
        chartInstanceRef.current.config.options.plugins.zoom.zoom.pinch.enabled = !isSelectRangeSelection;
        chartInstanceRef.current.config.options.plugins.zoom.zoom.wheel.enabled = !isSelectRangeSelection;
        updateChart({ chartInstance: chartInstanceRef.current, data: [] });
      }
    } catch (error) {
      console.log("useEffect: ", error);
    }
  }, []);

  const drawSoundChart = () => {
    const normalizedArray = MicrophoneServiceIST.getSoundChartData(sensorInfo);
    const chartData = [
      {
        name: sensorInfo === SINE_WAVE_SENSOR_INFO ? t("organisms.sound_amplitude") : t("organisms.sound_level"),
        data: normalizedArray,
        dataRunId: currentDataRunId,
      },
    ];

    const chartDatas = createChartDataAndParseXAxis({ chartDatas: chartData });

    if (sensorInfo === SINE_WAVE_SENSOR_INFO) {
      const timePerSample = MicrophoneServiceIST.getTimePerSample();
      let maxAmplitude = DEFAULT_MIN_AMPLITUDE;
      updateChart({
        chartInstance: chartInstanceRef.current,
        data: chartDatas,
        maxX: timePerSample * BUFFER_LENGTH * 1000,
        maxY: maxAmplitude,
        minY: maxAmplitude * -1,
        labelY: t("organisms.sound_amplitude"),
        labelX: t("common.time") + " (ms)",
        tension: 0.6,
      });
    } else if (sensorInfo === FREQUENCY_WAVE_SENSOR_INFO) {
      updateChart({
        chartInstance: chartInstanceRef.current,
        data: chartDatas,
        maxX: MAX_FREQUENCY,
        maxY: MAX_DECIBEL,
        minY: MIN_DECIBEL,
        labelY: t("organisms.sound_level"),
        labelX: t("organisms.sound_frequency"),
        tension: 0.2,
      });
    }
  };

  const drawBufferChart = () => {
    const bufferData = getOscBufferData(sensor.id);
    if (!bufferData) return;

    let deltaTime, maxX, maxY, minY;
    if (sensor.id == SOUND_SENSOR_V2_ID) {
      deltaTime = 0.02; // sound sampled at 48KHz with 400 samples ~0.02ms/sample
      maxY = 0.05;
      minY = -0.05;
    } else {
      deltaTime = READ_BUFFER_INTERVAL / bufferData.length;
      minY = sensorDataInfo.min;
      maxY = sensorDataInfo.max;
      maxX = 100;
    }

    let normalizedArray = [];

    bufferData.map((value, index) => {
      if (isArray(value[sensor.index])) {
        for (let i = 0; i < value[sensor.index].length; i++) {
          normalizedArray.push({
            x: (index * value[sensor.index].length + i) * deltaTime,
            y: value[sensor.index][i],
          });
        }
      } else {
        normalizedArray.push({
          x: index * deltaTime,
          y: value[sensor.index],
        });
      }
    });

    maxX = normalizedArray.length * deltaTime;

    const chartData = [
      {
        name: sensor.name,
        data: normalizedArray,
        dataRunId: currentDataRunId,
      },
    ];

    const chartDatas = createChartDataAndParseXAxis({ chartDatas: chartData });

    updateChart({
      chartInstance: chartInstanceRef.current,
      data: chartDatas,
      maxX: maxX,
      maxY: maxY,
      minY: minY,
      labelY: sensor.name + ` (${sensor.unit})`,
      labelX: t("common.time") + " (ms)",
      tension: 0.6,
    });
  };

  useEffect(() => {
    if (isRunning) {
      const drawChart = function () {
        if ([SINE_WAVE_SENSOR_INFO, FREQUENCY_WAVE_SENSOR_INFO].includes(sensorInfo)) {
          drawSoundChart();
          if (isRunning) drawChartAnimationFrameId = requestAnimationFrame(drawChart);
        } else if (
          [
            CURRENT_SENSOR_V2_INFO,
            VOLTAGE_SENSOR_V2_INFO,
            SOUND_SENSOR_V2_LEVEL_INFO,
            SOUND_SENSOR_V2_INTENSITY_INFO,
          ].includes(sensorInfo)
        ) {
          drawBufferChart();
          if (isRunning) drawChartTimeoutID = setTimeout(drawChart, READ_BUFFER_INTERVAL);
          //if (isRunning) drawChartAnimationFrameId = requestAnimationFrame(drawChart);
        }
      };

      const otherPointData = getAllCurrentPointDataPreview({ pageId, widgetId: widget.id });
      Object.keys(otherPointData).forEach((key) => {
        delete chartInstanceRef.current.config.options.plugins.annotation.annotations[key];
      });

      const allLabelNotes = getAllCurrentLabelNotes({ pageId, widgetId: widget.id });
      Object.keys(allLabelNotes).forEach((labelNodeKey) => {
        delete chartInstanceRef.current.config.options.plugins.annotation.annotations[labelNodeKey];
      });

      const allLabelDeltas = getAllCurrentDeltas({ pageId, widgetId: widget.id });
      Object.keys(allLabelDeltas).forEach((labelDeltaKey) => {
        delete chartInstanceRef.current.config.options.plugins.annotation.annotations[labelDeltaKey];
      });

      const result = removeStatisticNote({
        chartInstance: chartInstanceRef.current,
        pageId,
        widgetId: widget.id,
      });
      result && setIsShowStatistic(false);

      handleDeleteSelection({ pageId, chartInstance: chartInstanceRef.current, widgetId: widget.id });
      setIsSelectRegion(false);

      chartInstanceRef.current.update();

      selectedPointElement = null;
      selectedNoteElement = null;

      const iconContainers = document.getElementsByClassName("icon-container-widget");
      Array.from(iconContainers).forEach((iconContainer) => {
        iconContainer.style.display = "none";
      });

      drawChart();
    } else {
      const curDatasets = chartInstanceRef.current.data?.datasets;
      if (Array.isArray(curDatasets) && curDatasets.length === 1) {
        const data = curDatasets[0].data;
        DataManagerIST.addOscDataDataRun(sensorInfo, data, currentDataRunId);
      }
      if (drawChartAnimationFrameId) {
        cancelAnimationFrame(drawChartAnimationFrameId);
        drawChartAnimationFrameId = null;
      }
      if (drawChartTimeoutID) {
        clearTimeout(drawChartTimeoutID);
        drawChartTimeoutID = null;
      }
    }
  }, [isRunning]);

  //========================= HANDLE SCALE FUNCTIONS =========================
  const handleScale = ({ chartInstance, sensorInfo, currentDataRunId }) => {
    if (!chartInstance.data || !Array.isArray(chartInstance.data.datasets) || chartInstance.data.datasets.length <= 0) {
      return;
    }
    const data = DataManagerIST.getOscDataDataRun(sensorInfo, currentDataRunId);
    if (Array.isArray(data) && data.length === 1) {
      let chartName, labelX, labelY, tension;
      if (sensorInfo === SINE_WAVE_SENSOR_INFO) {
        chartName = t("organisms.sound_amplitude");
        labelX = t("common.time") + " (ms)";
        labelY = t("organisms.sound_amplitude");
        tension = 0.6;
      } else if (sensorInfo === FREQUENCY_WAVE_SENSOR_INFO) {
        chartName = t("organisms.sound_level");
        labelX = t("organisms.sound_frequency");
        labelY = t("organisms.sound_frequency");
        tension = 0.2;
      } else {
        chartName = sensor.name;
        labelX = t("common.time") + " (ms)";
        labelY = sensor.name + ` (${sensor.unit})`;
        tension = 0.6;
      }
      const chartData = [
        {
          name: chartName,
          data: data[0],
          dataRunId: currentDataRunId,
        },
      ];

      const chartDatas = createChartDataAndParseXAxis({ chartDatas: chartData });
      if (isRangeSelected) {
        const selectedRanges = getListRangeSelections({ pageId: pageId });
        if (selectedRanges.length == 0) return;
        updateChart({
          chartInstance: chartInstanceRef.current,
          data: chartDatas,
          maxX: selectedRanges[0].xMax + 50,
          maxY: selectedRanges[0].maxY + 50,
          minX: selectedRanges[0].xMin - 30,
          minY: selectedRanges[0].yMin - 0,
          labelY,
          labelX,
          tension,
        });
      } else {
        const { maxX, maxY, minY } = getMaxMinAxises({ chartDatas: chartDatas });
        const yValue = Math.max(Math.abs(maxY), Math.abs(minY));
        updateChart({
          chartInstance: chartInstanceRef.current,
          data: chartDatas,
          maxX: maxX,
          maxY: yValue,
          labelY: labelY,
          labelX: labelX,
          tension: tension,
        });
      }
    }
  };

  const showOffDataPointHandler = () => {
    if (isOffDataPoint) {
      chartInstanceRef.current.config.options.elements.point.pointStyle = POINT_STYLE;
    } else {
      chartInstanceRef.current.config.options.elements.point.pointStyle = false;
    }
    chartInstanceRef.current.update();
    setIsOffDataPoint(!isOffDataPoint);
  };

  //========================= ADD NOTE FUNCTIONS =========================
  const addNoteHandler = () => {
    const isValidPointElement = selectedPointElement?.element;
    const isValidNoteElement = selectedNoteElement?.options;
    if (!isValidPointElement && !isValidNoteElement) return;

    let noteId;
    let prevContent = [""];

    // Get NoteId to find whether the note is exist or not
    // for getting the old content of note
    if (isValidNoteElement) {
      noteId = selectedNoteElement.options.id;
    } else if (isValidPointElement) {
      const dataPointIndex = selectedPointElement.index;
      noteId = createLabelNoteId({
        pageId,
        widgetId: widget.id,
        dataRunId: undefined,
        sensorInfo: undefined,
        dataPointIndex,
      });
    } else return;

    const labelNote = labelNotesStorage.find(noteId);
    if (labelNote) {
      const note = labelNote.label;
      prevContent = note.content;
      if (prevContent && prevContent.length > 0) {
        prevContent = prevContent.join(" ");
      }
    }

    showModal((onClose) => (
      <PromptPopup
        title={t("organisms.add_comments")}
        inputLabel={t("organisms.commentary")}
        defaultValue={prevContent}
        onClosePopup={onClose}
      />
    ));
  };

  const callbackAddLabelNote = ({ newInput: newContent }) => {
    const result = addLabelNote({
      chartInstance: chartInstanceRef.current,
      pageId: pageId,
      newContent: newContent,
      selectedPointElement,
      selectedNoteElement,
      widgetId: widget.id,
      pointSize: POINT_RADIUS,
    });

    if (result) {
      // Clear selected point
      selectedPointElement = null;
      selectedNoteElement = null;
      const iconContainers = document.getElementsByClassName("icon-container-widget");
      Array.from(iconContainers).forEach((iconContainer) => {
        iconContainer.style.display = "none";
      });

      const otherPointData = getAllCurrentPointDataPreview({ pageId, widgetId: widget.id });
      Object.keys(otherPointData).forEach((key) => {
        delete chartInstanceRef.current.config.options.plugins.annotation.annotations[key];
      });
      chartInstanceRef.current.update();
    }
  };
  const { prompt, showModal } = usePrompt({ className: "use-prompt-dialog-popup", callbackFn: callbackAddLabelNote });

  const handleAddDelta = () => {
    if (!selectedPointElement) return;
    const { index: dataPointIndex } = selectedPointElement;
    const currentDataset = chartInstanceRef.current.data.datasets[0];
    let pointDeltaMaxIndex = dataPointIndex + Math.round(currentDataset.data.length / 3);
    if (pointDeltaMaxIndex >= currentDataset.data.length) pointDeltaMaxIndex = currentDataset.data.length - 1;

    const result = addDelta({
      pageId,
      widgetId: widget.id,
      xMin: currentDataset.data[dataPointIndex].x,
      yMin: currentDataset.data[dataPointIndex].y,
      xMax: currentDataset.data[pointDeltaMaxIndex].x,
      yMax: currentDataset.data[pointDeltaMaxIndex].y,
      chartInstance: chartInstanceRef.current,
    });

    setDeltaSelected({ delta: result, isMax: false });
  };

  const deleteDeltaHandler = () => {
    if (!deltaSelected) return;
    const deltaId = deltaSelected.delta.id;
    const annotation = getChartAnnotationByDelta(deltaSelected.delta);
    Object.keys(annotation).forEach((key) => {
      if (_.get(chartInstanceRef.current, `config.options.plugins.annotation.annotations[${key}]`)) {
        delete chartInstanceRef.current.config.options.plugins.annotation.annotations[key];
      }
    });
    deltasStorage.delete(deltaId);
    setDeltaSelected(null);
    chartInstanceRef.current.update();
  };

  const handleChangeSelectedNote = ({ type }) => {
    if (!selectedPointElement) return;
    const { datasetIndex, index: dataPointIndex } = selectedPointElement;
    const currentDataset = chartInstanceRef.current.data.datasets[0];
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
        if (_.get(chartInstanceRef.current, `config.options.plugins.annotation.annotations[${key}]`)) {
          delete chartInstanceRef.current.config.options.plugins.annotation.annotations[key];
        }
        chartInstanceRef.current.config.options.plugins.annotation.annotations[key] = annotation[key];
      });
    }

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
      element: chartInstanceRef.current.getDatasetMeta(datasetIndex).data[newDataPointIndex],
    };
    handleAddPointDataPreview(newSelectedPointElement);
    selectedPointElement = newSelectedPointElement;

    chartInstanceRef.current.update();
  };

  //========================= ADD DATA TOOLTIP FUNCTIONS =========================
  const handleAddPointDataPreview = (pointElement) => {
    const isValidPointElement = pointElement?.element;
    if (!isValidPointElement) {
      return;
    }

    const chartInstance = chartInstanceRef.current;
    let noteId, chartName, labelX, labelY;
    let prevContent = [""];
    let yScaleId = "y";

    if (sensorInfo === SINE_WAVE_SENSOR_INFO) {
      chartName = t("organisms.sound_amplitude");
      labelX = t("common.time") + " (ms)";
      labelY = t("organisms.sound_amplitude");
    } else if (sensorInfo === FREQUENCY_WAVE_SENSOR_INFO) {
      chartName = t("organisms.sound_level");
      labelX = t("common.time") + " (ms)";
      labelY = t("organisms.sound_frequency");
    } else {
      chartName = sensor.name;
      labelX = t("common.time") + " (ms)";
      labelY = sensor.name + ` (${sensor.unit})`;
    }

    // Get NoteId to find whether the note is exist or not
    // for getting the old content of note
    if (isValidPointElement) {
      const dataPointIndex = pointElement.index;
      const dataset = chartInstance.data.datasets[0];
      const dataRunId = dataset?.dataRunId;

      const content = [
        chartName || dataset.name,
        `x= ${dataset.data[dataPointIndex].x.toLocaleString("de-DE", {
          minimumFractionDigits: 3,
          maximumFractionDigits: 3,
        })} (ms)`,
        `y= ${dataset.data[dataPointIndex].y.toLocaleString("de-DE", {
          minimumFractionDigits: 3,
          maximumFractionDigits: 3,
        })} ${sensor.unit ? `(${sensor.unit})` : ""}`,
      ];

      addPointDataPreview({
        chartInstance,
        pageId,
        dataRunId,
        sensorInfo,
        content,
        selectedPointElement: pointElement,
        widgetId: widget.id,
        yScaleId,
        dataPointIndex,
        xAdjust: 90,
      });
    } else return;

    const labelNote = labelNotesStorage.find(noteId);
    if (labelNote) {
      const note = labelNote.label;
      prevContent = note.content;
      prevContent = prevContent.join(" ");
    }
  };

  //========================= SELECTION REGION FUNCTIONS =========================
  const selectRegionHandler = () => {
    isRangeSelected = !isSelectRegion;
    startRangeElement = null;
    chartInstanceRef.current.config.options.plugins.zoom.pan.enabled = !isRangeSelected;
    chartInstanceRef.current.config.options.plugins.zoom.zoom.pinch.enabled = !isRangeSelected;
    chartInstanceRef.current.config.options.plugins.zoom.zoom.wheel.enabled = !isRangeSelected;

    if (!isRangeSelected) {
      handleDeleteSelection({ pageId, chartInstance: chartInstanceRef.current });
      setIsSelectRegion(false);
      startRangeElement = null;
    } else {
      chartInstanceRef.current.update();
      setIsSelectRegion(isRangeSelected);
    }
    // isRangeSelected = True => display zoom
  };

  //========================= STATISTIC OPTION FUNCTIONS =========================
  const statisticHandler = ({ optionId }) => {
    // if (_.isEqual(widgets[widgetIndex].sensors, [DEFAULT_SENSOR_DATA])) return;

    if (!isShowStatistic) {
      f7.popover.open(".popover-statistic-options", `#${optionId}`);
    } else {
      const result = removeStatisticNote({
        chartInstance: chartInstanceRef.current,
        pageId,
        widgetId: widget.id,
      });
      result && setIsShowStatistic(!isShowStatistic);
    }
  };

  const addStatisticHandler = ({ widgetId, sensors, statisticOptionId }) => {
    let isDefaultXAxis = [FIRST_COLUMN_DEFAULT_OPT];
    const result = addStatisticNote({
      chartInstance: chartInstanceRef.current,
      isShowStatistic,
      sensors,
      pageId,
      isDefaultXAxis,
      statisticOptionId,
      widgetId,
      hiddenDataLineIds: [],
    });
    result && setIsShowStatistic(!isShowStatistic);
  };

  //========================= DELETE DATA FUNCTIONS =========================
  const deleteDataInRangeSelection = ({ chartInstance }) => {
    if (!chartInstance.data || !Array.isArray(chartInstance.data.datasets) || chartInstance.data.datasets.length <= 0) {
      return;
    }
    const selectedRanges = getListRangeSelections({ pageId: pageId });

    const datasets = chartInstance.data.datasets;

    const selectedRange = selectedRanges[0];
    if (selectedRange)
      datasets.forEach((dataset) => {
        const dataRunId = dataset.dataRunId;
        const deletedResult = DataManagerIST.deleteSensorDataInDataRun({
          dataRunId,
          sensorInfo,
          selectedRange,
          unitId: FIRST_COLUMN_DEFAULT_OPT,
          isScope: true,
          chartInstance: chartInstanceRef.current,
        });
      });

    handleDeleteSelection({ pageId, chartInstance: chartInstanceRef.current, widgetId: widget.id });
  };

  return (
    <div className="scope-view-widget">
      <div className="canvas-container">
        <div className="current-value-sec" ref={valueLabelContainerRef}></div>
        <canvas ref={canvasRef} />
        <div
          id={`icon-container-widget`}
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
      <div className="expandable-options">
        <ExpandableOptions
          expandIcon={lineChartIcon}
          options={defaultExpandOptions}
          onChooseOption={onChooseOptionHandler}
        />
        <PopoverStatisticOptions
          callback={({ statisticOptionId }) => {
            addStatisticHandler({
              sensors: widget.sensors,
              statisticOptionId,
              widgetId: widget.id,
            });
          }}
        />
        <SensorSelector
          disabled={isRunning}
          selectedSensor={sensor}
          onChange={(sensor) =>
            handleSensorChange({ widgetId: widget.id, sensorIndex: defaultSensorIndex, sensor: sensor })
          }
          definedSensors={oscSensorsId}
        ></SensorSelector>
      </div>
      {prompt}
    </div>
  );
};

export default ScopeViewWidget;
