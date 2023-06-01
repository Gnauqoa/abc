import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from "react";
import Chart from "chart.js/auto";
import zoomPlugin from "chartjs-plugin-zoom";
import annotationPlugin from "chartjs-plugin-annotation";
import _ from "lodash";
import ExpandableOptions from "../../molecules/expandable-options";

import SensorSelector from "../../molecules/popup-sensor-selector";
import SensorServices from "../../../services/sensor-service";

import lineChartIcon from "../../../img/expandable-options/line.png";
import {
  calculateSuggestMaxX,
  createChartDataAndParseXAxis,
  createChartJsDatas,
  roundAndGetSignificantDigitString,
  getCustomTooltipFunc,
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
  hiddenDataRunIds,
  SHOW_OFF_DATA_POINT_MARKER,
} from "../../../utils/widget-line-chart/commons";
import {
  DEFAULT_SENSOR_DATA,
  LINE_CHART_LABEL_NOTE_TABLE,
  LINE_CHART_STATISTIC_NOTE_TABLE,
} from "../../../js/constants";

import "./index.scss";
import usePrompt from "../../../hooks/useModal";
import PromptPopup from "../../molecules/popup-prompt-dialog";
import StoreService from "../../../services/store-service";
import { addStatisticNote, getAllCurrentStatisticNotes } from "../../../utils/widget-line-chart/statistic-plugin";
import { addLabelNote, getAllCurrentLabelNotes } from "../../../utils/widget-line-chart/label-plugin";
import {
  onClickChartHandler,
  onClickNoteElement,
  onEnterNoteElement,
  onLeaveNoteElement,
} from "../../../utils/widget-line-chart/annotation-plugin";
import { onClickLegendHandler } from "../../../utils/widget-line-chart/legend-plugin";
import { onSelectRegion } from "../../../utils/widget-line-chart/selection-plugin";

Chart.register(zoomPlugin);
Chart.register(annotationPlugin);

// ===================================== START DRAG-DROP UTILS =====================================
let noteElement;
let lastNoteEvent;
let isDragging = false;
let selectedPointElement = null;
let selectedNoteElement = null;

const statisticNotesStorage = new StoreService(LINE_CHART_STATISTIC_NOTE_TABLE);
const labelNotesStorage = new StoreService(LINE_CHART_LABEL_NOTE_TABLE);

const dragger = {
  id: "annotation-dragger",
  beforeEvent(chart, args, options) {
    if (handleDrag(args.event)) {
      args.changed = true;
      return;
    }
  },
};

const handleDrag = function (event) {
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
const updateChart = ({ chartInstance, data, axisRef, pageId }) => {
  const pageStep = 5;
  const firstPageStep = 10;

  let suggestedMaxX = calculateSuggestMaxX({
    chartDatas: data,
    pageStep,
    firstPageStep,
  });

  if (!suggestedMaxX) {
    suggestedMaxX = pageStep;
  }

  const stepSize = suggestedMaxX / 10;

  chartInstance.data = createChartJsDatas({ chartDatas: data, hiddenDataRunIds: hiddenDataRunIds });
  chartInstance.options.animation = false;
  chartInstance.options.scales = {
    y: {
      min: axisRef.current.yMin,
      suggestedMax: axisRef.current.yMax,
      title: {
        color: "orange",
        display: false,
        text: axisRef.current.yUnit,
      },
    },
    x: {
      type: "linear",
      suggestedMin: 0,
      suggestedMax: suggestedMaxX,
      ticks: {
        // forces step size to be 50 units
        //stepSize: ((1 / maxHz) * 1000).toFixed(0),
        //stepSize: stepSize
      },
      title: {
        color: "orange",
        display: true,
        text: `(${X_DEFAULT_UNIT})`,
        align: "end",
      },
    },
  };

  if (stepSize) {
    chartInstance.options.scales.x.ticks.stepSize = stepSize;
  }

  // update chart notes
  const labelNoteAnnotations = getAllCurrentLabelNotes({ pageId: pageId, hiddenDataRunIds });
  const { summaryNotes, linearRegNotes } = getAllCurrentStatisticNotes({ pageId: pageId, hiddenDataRunIds });

  chartInstance.config.options.plugins.annotation.annotations = {
    ...labelNoteAnnotations,
    ...summaryNotes,
    ...linearRegNotes,
  };

  chartInstance.update();

  for (let index = 0; index < chartInstance.data.datasets.length; index++) {
    const dataRunId = chartInstance.data.datasets[index]?.dataRunId;
    if (hiddenDataRunIds.has(dataRunId)) {
      chartInstance.hide(index);
    }
  }
};

// ============================================= MAIN COMPONENT =============================================
let LineChart = (props, ref) => {
  const { widget, handleSensorChange, pageId } = props;
  const defaultSensorIndex = 0;
  const sensor = widget.sensors[defaultSensorIndex] || DEFAULT_SENSOR_DATA;
  const selectedSensor = widget.sensors[defaultSensorIndex] || DEFAULT_SENSOR_DATA;

  const isSelectStatistic = statisticNotesStorage.query({ pageId: pageId }).length > 0;
  const [isShowStatistic, setIsShowStatistic] = useState(isSelectStatistic);
  const [isSelectRegion, setIsSelectRegion] = useState(false);
  const [isOffDataPoint, setIsOffDataPoint] = useState(false);
  const expandOptions = expandableOptions.map((option) => {
    if (!OPTIONS_WITH_SELECTED.includes(option.id)) return option;

    if (option.id === STATISTIC_OPTION) return { ...option, selected: isShowStatistic };
    else if (option.id === SELECTION_OPTION) return { ...option, selected: isSelectRegion };
    else if (option.id === SHOW_OFF_DATA_POINT_MARKER) return { ...option, selected: isOffDataPoint };
  });

  const chartEl = useRef();
  const chartInstanceRef = useRef();
  const sensorRef = useRef({});
  const axisRef = useRef({
    xUnit: "",
    yUnit: "",
    yMin: 0,
    yMax: null,
  });

  let valueContainerElRef = useRef();
  let xElRef = useRef();
  let yElRef = useRef();

  if (sensorRef.current.id != sensor?.id || sensorRef.current.index != sensor?.index) {
    sensorRef.current = {
      id: sensor?.id,
      index: sensor?.index,
    };
    const sensorList = SensorServices.getAllSensors();
    const existingSensorData = sensorList.find((s) => s.id === sensorRef.current.id);
    if (existingSensorData) {
      const sensorDetailData = existingSensorData.data[sensorRef.current.index];
      sensorRef.current.sensorDetailData = sensorDetailData;
      axisRef.current.yUnit = sensorDetailData.unit;
      axisRef.current.yMin = sensorDetailData.min;
      axisRef.current.yMax = sensorDetailData.max;
    }
  }

  useImperativeHandle(ref, () => ({
    clearData: () => {},
    setCurrentData: ({ data }) => {
      const xValue = roundAndGetSignificantDigitString({ n: data.x });
      xElRef.current.innerText = `${xValue}(${X_DEFAULT_UNIT})`;
      yElRef.current.innerText = `${data.y}(${axisRef.current.yUnit || ""})`;
    },

    // This function is used to clear hiddenDataRunIds
    // in the LineChart for the deleted dataRunIds
    modifyDataRunIds: ({ dataRunIds }) => {
      for (const dataRunId of hiddenDataRunIds) {
        if (!dataRunIds.includes(dataRunId)) {
          hiddenDataRunIds.delete(dataRunId);
        }
      }
      console.log("LineChart_Clear_Deleted_DataRunId_hiddenDataRunIds: ", hiddenDataRunIds);
    },

    setChartData: ({ xUnit, yUnit, chartDatas = [], curSensor: sensor }) => {
      /**
       * chartData = [
       * { name, data: [{x,y}, ...]}
       * ]
       */
      axisRef.current.xUnit = xUnit;
      chartDatas = createChartDataAndParseXAxis({ chartDatas });

      updateChart({
        chartInstance: chartInstanceRef.current,
        data: chartDatas,
        axisRef,
        pageId,
        xUnit,
        yUnit,
      });
    },
  }));

  useEffect(() => {
    const minUnitValue = SensorServices.getMinUnitValueAllSensors();
    const chartJsPlugin = getChartJsPlugin({ valueLabelContainerRef: valueContainerElRef });
    chartInstanceRef.current = new Chart(chartEl.current, {
      type: "line",
      options: {
        elements: {
          point: {
            pointStyle: POINT_STYLE,
            pointRadius: POINT_RADIUS,
            pointHoverRadius: POINT_HOVER_RADIUS,
          },
        },
        onClick: (event, elements, chart) => {
          const { status, newPointEl } = onClickChartHandler(
            event,
            elements,
            chart,
            selectedPointElement,
            selectedNoteElement
          );
          if (status) {
            selectedPointElement = newPointEl;
            selectedNoteElement = null;
          }
          return true;
        },
        animation: false,
        maintainAspectRatio: false,
        events: ["mousemove", "mouseout", "mousedown", "mouseup", "click", "touchstart", "touchmove"],
        plugins: {
          tooltip: {
            usePointStyle: true,
            enabled: false,
            external: getCustomTooltipFunc({ axisRef }),

            callbacks: {
              label: function (context) {
                const resultArr = [];
                let label = context.dataset.label || "";
                resultArr.push(label);

                if (context.parsed.x !== null && context.parsed.y != null) {
                  resultArr.push(context.parsed.x);
                  resultArr.push(context.parsed.y);
                }

                return resultArr.join("|");
              },
            },
          },
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
            },
          },

          annotation: {
            enter: ({ chart, element }) => {
              const { status, element: newElement } = onEnterNoteElement({ chart, element });
              if (status) noteElement = newElement;
              return true;
            },
            leave: ({ chart, element }) => {
              const { status } = onLeaveNoteElement({ chart, element });
              if (status) {
                noteElement = undefined;
                lastNoteEvent = undefined;
                isDragging = false;
              }
              return true;
            },
            click: ({ element }) => {
              if (isDragging) {
                isDragging = false;
                return false;
              }

              const { status, element: newElement } = onClickNoteElement({ element, selectedNoteElement });
              if (status) selectedNoteElement = newElement;
              return true;
            },
            annotations: {},
          },

          legend: {
            display: true,
            onClick: (event, legendItem, legend) => {
              onClickLegendHandler(event, legendItem, legend);
            },
          },
        },
      },
      plugins: [chartJsPlugin, dragger],
    });

    updateChart({
      chartInstance: chartInstanceRef.current,
      data: [],
      axisRef,
      pageId,
      xUnit: X_DEFAULT_UNIT,
      yUnit: "",
    });
  }, []);

  //========================= ADD NOTE FUNCTIONS =========================
  const addNoteHandler = (sensorInstance) => {
    const isValidPointElement = selectedPointElement && selectedPointElement.element;
    const isValidNoteElement = selectedNoteElement && selectedNoteElement.options;
    if (!isValidPointElement && !isValidNoteElement) return;

    let noteId;
    let prevContent = [""];

    if (isValidNoteElement) noteId = selectedNoteElement.options.id;
    else
      noteId = `note-element_${sensorInstance.id}_${sensorInstance.index}_${selectedPointElement.datasetIndex}_${selectedPointElement.index}`;

    const labelNote = labelNotesStorage.find(noteId);
    if (labelNote) {
      const note = labelNote.label;
      prevContent = note.content;
      prevContent = prevContent.join(" ");
    }

    showModal((onClose) => (
      <PromptPopup title="Thêm chú giải" inputLabel="Chú giải" defaultValue={prevContent} onClosePopup={onClose} />
    ));
  };

  const callbackAddLabelNote = (newContent) => {
    const result = addLabelNote({
      chartInstance: chartInstanceRef.current,
      pageId: pageId,
      newContent: newContent,
      selectedPointElement,
      selectedNoteElement,
    });

    if (result) {
      // Clear selected point
      selectedPointElement = null;
      selectedNoteElement = null;
    }
  };
  const { prompt, showModal } = usePrompt({ className: "use-prompt-dialog-popup", callbackFn: callbackAddLabelNote });

  //========================= STATISTIC OPTION FUNCTIONS =========================
  const statisticHandler = (chartInstance) => {
    if (_.isEqual(sensor, DEFAULT_SENSOR_DATA)) return;
    const result = addStatisticNote({
      chartInstance,
      isShowStatistic,
      sensor,
      pageId,
    });
    result && setIsShowStatistic(!isShowStatistic);
  };

  //========================= SELECTION REGION FUNCTIONS =========================
  const selectRegionHandler = (chartInstance) => {
    onSelectRegion({ chartInstance, isSelectRegion });
    setIsSelectRegion(!isSelectRegion);
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

  //========================= OPTIONS FUNCTIONS =========================
  const onChooseOptionHandler = (optionId) => {
    switch (optionId) {
      case SCALE_FIT_OPTION:
        scaleToFixHandler(chartInstanceRef.current, axisRef);
        break;
      case NOTE_OPTION:
        addNoteHandler(sensorRef.current);
        break;
      case INTERPOLATE_OPTION:
        interpolateHandler(chartInstanceRef.current);
        break;
      case STATISTIC_OPTION:
        statisticHandler(chartInstanceRef.current);
        break;
      case SELECTION_OPTION:
        selectRegionHandler(chartInstanceRef.current);
        break;
      case SHOW_OFF_DATA_POINT_MARKER:
        showOffDataPointHandler(chartInstanceRef.current);
        break;
      default:
        break;
    }
  };

  return (
    <div className="line-chart-wapper">
      <div className="line-chart">
        <div className="sensor-selector-wrapper">
          <div className="sensor-select-vertical-mount-container">
            <SensorSelector
              selectedSensor={selectedSensor}
              onChange={(sensor) => handleSensorChange(widget.id, defaultSensorIndex, sensor)}
            ></SensorSelector>
          </div>
        </div>

        <div className="canvas-container">
          <div className="current-value-sec" ref={valueContainerElRef}>
            <div className="value-container">
              x=<span ref={xElRef}></span>
            </div>
            <div className="value-container">
              y=<span ref={yElRef}></span>
            </div>
          </div>
          <canvas ref={chartEl} />
        </div>
      </div>

      <div className="expandable-options">
        <ExpandableOptions expandIcon={lineChartIcon} options={expandOptions} onChooseOption={onChooseOptionHandler} />
      </div>
      {prompt}
    </div>
  );
};

LineChart = forwardRef(LineChart);
export default LineChart;
