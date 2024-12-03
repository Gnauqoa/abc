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
} from "../../../utils/widget-line-chart/commons";
import { abs } from "mathjs";
import SensorSelector from "../../molecules/popup-sensor-selector";
import SensorServiceIST, { BUILTIN_DECIBELS_SENSOR_ID, BUILTIN_MICROPHONE_ID } from "../../../services/sensor-service";
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
} from "../../../utils/widget-line-chart/delta-plugin";
import { addLabelNote, createLabelNoteId } from "../../../utils/widget-line-chart/label-plugin";
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
import { handleAddSelection, handleDeleteSelection } from "../../../utils/widget-line-chart/selection-plugin";
import _ from "lodash";
import PopoverStatisticOptions from "../widget-line-chart/PopoverStatisticOptions";
import { addStatisticNote, removeStatisticNote } from "../../../utils/widget-scope-view/statistic-plugin";
import { f7 } from "framework7-react";
import { FIRST_COLUMN_DEFAULT_OPT } from "../../../utils/widget-table-chart/commons";

const MAX_DECIBEL = 120;
const MIN_DECIBEL = 30;
const GET_SAMPLES_INTERVAL = 100;
const DEFAULT_MIN_AMPLITUDE = 0.1;
const MAX_FREQUENCY = 1000;
const REF_VALUE = 1.0; // Reference value for SPL calculation
const REF_DB = 150.0; // Reference level in dB
const POINT_RADIUS = 2;

let drawChartTimerId;

const SINE_WAVE = 0;
const FREQUENCY_WAVE = 1;
const DECIBEL = 2;

const visualSettings = {
  [`${BUILTIN_DECIBELS_SENSOR_ID}-0`]: DECIBEL,
  [`${BUILTIN_MICROPHONE_ID}-0`]: SINE_WAVE,
  [`${BUILTIN_MICROPHONE_ID}-1`]: FREQUENCY_WAVE,
};

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

const updateChart = ({ chartInstance, data, maxX, maxY, minY, labelX, labelY, tension }) => {
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
      min: 0,
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
      (option) =>
        ![ADD_ROW_OPTION, DELETE_ROW_OPTION, ADD_COLUMN_OPTION, DELETE_COLUMN_OPTION, DELETE_RANGE_SELECTION].includes(
          option.id
        )
    );

  //========================= OPTIONS FUNCTIONS =========================
  const onChooseOptionHandler = ({ optionId }) => {
    switch (optionId) {
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
      default:
        break;
    }
  };
  const defaultSensorIndex = 0;
  const sensor = widget.sensors[defaultSensorIndex];
  const sensorInfo = createSensorInfo(sensor);

  const soundSensors = SensorServiceIST.getActiveSoundSensors();
  const soundSensorsId = soundSensors.map((sensor) => sensor.id);

  const initWebAudio = () => {
    const samplingRate = MicrophoneServiceIST.getSamplingRate();
    const fftSize = MicrophoneServiceIST.getFFTSize();
    const timePerSample = MicrophoneServiceIST.getTimePerSample();
    let maxAmplitude = DEFAULT_MIN_AMPLITUDE;

    function visualize() {
      if (visualSettings[sensorInfo] === SINE_WAVE) {
        const drawSineWave = function () {
          let time = 0;
          const normalizedArray = [];
          const dataArray = MicrophoneServiceIST.getFloatTimeDomainData();

          for (let i = 0; i < BUFFER_LENGTH; i++) {
            const y = dataArray[i];
            if (abs(y) > maxAmplitude) maxAmplitude = abs(y);
            normalizedArray.push({ x: time, y: y });
            time += timePerSample * 1000;
          }

          const chartData = [
            {
              name: t("organisms.sound_amplitude"),
              data: normalizedArray,
              dataRunId: currentDataRunId,
            },
          ];

          const chartDatas = createChartDataAndParseXAxis({ chartDatas: chartData });
          updateChart({
            chartInstance: chartInstanceRef.current,
            data: chartDatas,
            maxX: timePerSample * BUFFER_LENGTH * 1000,
            maxY: maxAmplitude,
            minY: maxAmplitude * -1,
            labelY: t("organisms.sound_amplitude"),
            labelX: t("common.time") + " (ms)",
            tension: 0.2,
          });

          if (isRunning) drawChartTimerId = setTimeout(drawSineWave, GET_SAMPLES_INTERVAL);
        };

        drawSineWave();
      } else if (visualSettings[sensorInfo] === FREQUENCY_WAVE) {
        const drawFrequencyWave = function () {
          let frequency = 0;
          const normalizedArray = [];
          const dataArrayAlt = MicrophoneServiceIST.getFloatFrequencyData();

          for (let i = 0; i < dataArrayAlt.length; i++) {
            const amplitude = Math.pow(10, dataArrayAlt[i] / 20);
            const spl = 20 * Math.log10(amplitude / REF_VALUE);
            const positivedB = spl + REF_DB;

            if (i * (samplingRate / fftSize) > MAX_FREQUENCY) break;

            normalizedArray.push({ x: frequency, y: positivedB });
            frequency = i * (samplingRate / fftSize);
          }

          const chartData = [
            {
              name: t("organisms.sound_level"),
              data: normalizedArray,
              dataRunId: currentDataRunId,
            },
          ];

          const chartDatas = createChartDataAndParseXAxis({ chartDatas: chartData });
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

          if (isRunning) drawChartTimerId = setTimeout(drawFrequencyWave, GET_SAMPLES_INTERVAL);
        };
        drawFrequencyWave();
      }
    }

    visualize();
  };

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
            }
            return true;
          },
          animation: false,
          maintainAspectRatio: false,
          plugins: {
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
                args.changed = true;
                return;
              }
            },
          },
        ],
      });

      const data = DataManagerIST.getSoundDataDataRun(sensorInfo, currentDataRunId);
      if (Array.isArray(data) && data.length === 1) {
        const chartData = [
          {
            name: t("organisms.periodic_oscillations_according_to_frequency"),
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
          labelY: visualSettings[sensorInfo] === SINE_WAVE ? "amplitude" : "decibels",
          labelX: visualSettings[sensorInfo] === SINE_WAVE ? "ms" : "frequency",
          tension: visualSettings[sensorInfo] === SINE_WAVE ? 0.6 : 0.2,
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

  useEffect(() => {
    if (isRunning) initWebAudio();
    else {
      const curDatasets = chartInstanceRef.current.data?.datasets;
      if (Array.isArray(curDatasets) && curDatasets.length === 1) {
        const data = curDatasets[0].data;
        DataManagerIST.addSoundDataDataRun(sensorInfo, data, currentDataRunId);
      }
      clearTimeout(drawChartTimerId);
    }
  }, [isRunning]);

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
    });

    if (result) {
      // Clear selected point
      selectedPointElement = null;
      selectedNoteElement = null;
      const iconContainers = document.getElementsByClassName("icon-container-widget");
      Array.from(iconContainers).forEach((iconContainer) => {
        iconContainer.style.display = "none";
      });
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
    const { tooltip } = chartInstanceRef.current;
    // const newDataPointIndex = (dataPointIndex - 1 + currentDataset.data.length) % currentDataset.data.length;

    const newPointBackgroundColor = Array.from(
      { length: currentDataset.data.length },
      () => currentDataset.backgroundColor
    );
    const newPointBorderColor = Array.from({ length: currentDataset.data.length }, () => currentDataset.borderColor);

    newPointBackgroundColor[newDataPointIndex] = "blue"; // Highlight new point
    currentDataset.pointBackgroundColor = newPointBackgroundColor;
    currentDataset.pointBorderColor = newPointBorderColor;

    tooltip.setActiveElements([
      {
        datasetIndex,
        index: newDataPointIndex,
      },
    ]);
    const newSelectedPointElement = tooltip.getActiveElements()[0];
    selectedPointElement = newSelectedPointElement;

    chartInstanceRef.current.update();
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
    } else {
      chartInstanceRef.current.update();
    }
    // isRangeSelected = True => display zoom

    setIsSelectRegion(isRangeSelected);
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
          definedSensors={soundSensorsId}
        ></SensorSelector>
      </div>
      {prompt}
    </div>
  );
};

export default ScopeViewWidget;
