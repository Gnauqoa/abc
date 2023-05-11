import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from "react";
import Chart, { PointElement } from "chart.js/auto";
import zoomPlugin from "chartjs-plugin-zoom";
import annotationPlugin from "chartjs-plugin-annotation";
import _ from "lodash";
import ExpandableOptions from "../expandable-options";

import SensorSelector from "../popup-sensor-selector";
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
  clearAllSelectedPoints,
  expandableOptions,
  SCALE_FIT_OPTION,
  NOTE_OPTION,
  INTERPOLATE_OPTION,
  X_DEFAULT_UNIT,
  X_MIN_VALUE,
  Y_MIN_VALUE,
  prepareContentNote,
} from "../../../utils/widget-line-utils";
import { DEFAULT_SENSOR_DATA } from "../../../js/constants";

import "./index.scss";
import dialog from "../dialog/dialog";
import chartjsUtils from "../../../utils/chartjs-utils";

Chart.register(zoomPlugin);
Chart.register(annotationPlugin);

// ===================================== START DRAG-DROP UTILS =====================================
let noteElement;
let lastNoteEvent;
let selectedPointElement = null;
let selectedNoteElement = null;
let allNotes = {};

const NOTE_BACKGROUND_COLOR = chartjsUtils.transparentize(chartjsUtils.CHART_COLORS.red, 0.5);
const NOTE_BACKGROUND_COLOR_ACTIVE = chartjsUtils.CHART_COLORS.red;
const NOTE_BORDER_COLOR = "#C12553";

let sampleNote = {
  type: "label",
  backgroundColor: NOTE_BACKGROUND_COLOR,
  borderRadius: 6,
  borderWidth: 1,
  borderColor: NOTE_BORDER_COLOR,
  padding: {
    top: 20,
    left: 12,
    right: 12,
    bottom: 20,
  },
  content: ["    Note    "],
  callout: {
    display: true,
    borderColor: "black",
  },
  xValue: 0,
  yValue: 0,
  display: true,
};

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
  return true;
};

const getAllCurrentNotes = ({ sensorId, sensorIndex, datasetIndex }) => {
  const currentChartNotes = Object.values(allNotes).filter((note) => {
    return (
      (sensorId === undefined || note.sensorId === sensorId) &&
      (sensorIndex === undefined || note.sensorIndex === sensorIndex) &&
      (datasetIndex === undefined || note.datasetIndex === datasetIndex)
    );
  });

  const noteElements = {};
  currentChartNotes.forEach((note) => {
    const newNoteElement = {
      ...sampleNote,
      content: note.content,
      backgroundColor: note.backgroundColor,
      xValue: note.xValue,
      yValue: note.yValue,
      xAdjust: note.xAdjust,
      yAdjust: note.yAdjust,
    };

    noteElements[note.id] = newNoteElement;
  });
  return noteElements;
};

const onClickChartHandler = (event, elements, chart) => {
  if (event.type === "click") {
    const isPointElement = elements[0]?.element instanceof PointElement;

    // Handle click point
    if (isPointElement || selectedPointElement !== null) {
      if (isPointElement) {
        clearAllSelectedPoints(chart);

        const selectedPoint = elements[0];
        const datasetIndex = selectedPoint.datasetIndex;
        const dataPointIndex = selectedPoint.index;
        const currentDataset = chart.data.datasets[datasetIndex];

        const newPointBackgroundColor = Array.from(
          { length: currentDataset.data.length },
          () => currentDataset.backgroundColor
        );
        const newPointBorderColor = Array.from(
          { length: currentDataset.data.length },
          () => currentDataset.borderColor
        );

        selectedPointElement = selectedPoint;
        selectedNoteElement = null;

        newPointBackgroundColor[dataPointIndex] = "red";

        currentDataset.pointBackgroundColor = newPointBackgroundColor;
        currentDataset.pointBorderColor = newPointBorderColor;

        chart.update();
      } else if (selectedPointElement !== null) {
        selectedPointElement = null;
        selectedNoteElement = null;

        clearAllSelectedPoints(chart);
        chart.update();
      }
    }

    return true;
  }
};
const onEnterNoteElement = ({ chart, element }) => {
  noteElement = element;
  chart.config.options.plugins.zoom.pan.enabled = false;
  chart.update();
  return true;
};

const onLeaveNoteElement = ({ chart, element }) => {
  const noteElementId = element?.options?.id;
  let label = chart.config.options.plugins.annotation.annotations[noteElementId];
  let currentNote = allNotes[noteElementId];

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

    allNotes = {
      ...allNotes,
      [noteElementId]: {
        ...currentNote,
        ...newAdjustPos,
      },
    };
  }

  chart.config.options.plugins.zoom.pan.enabled = true;
  chart.update();

  noteElement = undefined;
  lastNoteEvent = undefined;
  return true;
};

const onClickNoteElement = ({ element }) => {
  const elementNoteId = element?.options?.id;

  if (selectedNoteElement === element) {
    element.options.backgroundColor = NOTE_BACKGROUND_COLOR;
    allNotes[elementNoteId].backgroundColor = NOTE_BACKGROUND_COLOR;
    selectedNoteElement = null;
  } else {
    if (selectedNoteElement !== null) {
      const prevNoteElementId = selectedNoteElement.options.id;
      selectedNoteElement.backgroundColor = NOTE_BACKGROUND_COLOR;
      allNotes[prevNoteElementId].backgroundColor = NOTE_BACKGROUND_COLOR;
    }

    element.options.backgroundColor = NOTE_BACKGROUND_COLOR_ACTIVE;
    allNotes[elementNoteId].backgroundColor = NOTE_BACKGROUND_COLOR_ACTIVE;
    selectedNoteElement = element;
  }

  return true;
};

const addNoteHandler = (chartInstance, sensorInstance) => {
  const isValidPointElement = selectedPointElement && selectedPointElement.element;
  const isValidNoteElement = selectedNoteElement && selectedNoteElement.options;
  if (!isValidPointElement && !isValidNoteElement) return;

  let noteId;
  if (isValidNoteElement) {
    noteId = selectedNoteElement.options.id;
  } else {
    noteId = `note-element_${sensorInstance.id}_${sensorInstance.index}_${selectedPointElement.datasetIndex}_${selectedPointElement.index}`;
  }

  const handleOpenPopup = (noteContent) => {
    const newNoteContent = !noteContent ? null : prepareContentNote(noteContent);
    if (Object.keys(allNotes).includes(noteId)) {
      chartInstance.config.options.plugins.annotation.annotations[noteId].content = newNoteContent;
      allNotes[noteId] = { ...allNotes[noteId], content: newNoteContent };
    } else if (newNoteContent) {
      const xValueNoteElement = chartInstance.scales.x.getValueForPixel(selectedPointElement.element.x);
      const yValueNoteElement = chartInstance.scales.y.getValueForPixel(selectedPointElement.element.y);

      const newNote = {
        id: noteId,
        datasetIndex: selectedPointElement.datasetIndex,
        sensorId: sensorInstance.id,
        sensorIndex: sensorInstance.index,

        content: newNoteContent,
        backgroundColor: NOTE_BACKGROUND_COLOR,
        xValue: xValueNoteElement,
        yValue: yValueNoteElement,
        xAdjust: -60,
        yAdjust: -60,
      };

      console.log(newNote);

      const newNoteElement = {
        ...sampleNote,
        ...newNote,
      };

      allNotes = { ...allNotes, [noteId]: newNote };
      chartInstance.config.options.plugins.annotation.annotations = {
        ...chartInstance.config.options.plugins.annotation.annotations,
        [noteId]: newNoteElement,
      };
    }

    // Clear selected point
    selectedPointElement = null;
    selectedNoteElement = null;
    clearAllSelectedPoints(chartInstance);
    chartInstance.update();
  };

  dialog.modifyNoteLineChart("Thêm chú giải", handleOpenPopup);
};

// ======================================= CHART LEGEND =======================================
const onClickLegendHandler = (event, legendItem, legend) => {
  if (event.type !== "click") return;

  const datasetIndex = legendItem.datasetIndex;
  const noteElements = getAllCurrentNotes({ datasetIndex: datasetIndex });
  const ci = legend.chart;

  let isShowNote = false;
  if (ci.isDatasetVisible(datasetIndex)) {
    ci.hide(datasetIndex);
    legendItem.hidden = true;
    isShowNote = false;
  } else {
    ci.show(datasetIndex);
    legendItem.hidden = false;
    isShowNote = true;
  }

  Object.keys(noteElements).forEach((nodeId) => {
    ci.config.options.plugins.annotation.annotations[nodeId].display = isShowNote;
  });
  ci.update();
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
const updateChart = ({ chartInstance, data, axisRef, sensor }) => {
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

  chartInstance.data = createChartJsDatas({
    chartDatas: data,
  });
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
  const noteAnnotations = getAllCurrentNotes({ sensorId: sensor?.id, sensorIndex: sensor?.index });
  chartInstance.config.options.plugins.annotation.annotations = {
    ...noteAnnotations,
  };
  chartInstance.update();
};

// ============================================= MAIN COMPONENT =============================================
let LineChart = (props, ref) => {
  const { widget, handleSensorChange } = props;
  const defaultSensorIndex = 0;
  const sensor = widget.sensors[defaultSensorIndex] || DEFAULT_SENSOR_DATA;
  const selectedSensor = widget.sensors[defaultSensorIndex] || DEFAULT_SENSOR_DATA;
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
        sensor,
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
        onClick: onClickChartHandler,
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
            enter: onEnterNoteElement,
            leave: onLeaveNoteElement,
            click: onClickNoteElement,
            annotations: {},
          },

          legend: {
            display: true,
            onClick: onClickLegendHandler,
          },
        },
      },
      plugins: [chartJsPlugin, dragger],
    });

    updateChart({
      chartInstance: chartInstanceRef.current,
      data: [],
      axisRef,
      xUnit: X_DEFAULT_UNIT,
      yUnit: "",
    });
  }, []);

  const onChooseOptionHandler = (optionId) => {
    switch (optionId) {
      case SCALE_FIT_OPTION:
        scaleToFixHandler(chartInstanceRef.current, axisRef);
        break;
      case NOTE_OPTION:
        addNoteHandler(chartInstanceRef.current, sensorRef.current);
        break;
      case INTERPOLATE_OPTION:
        interpolateHandler(chartInstanceRef.current);
        break;
      default:
        break;
    }
  };

  return (
    <div className="line-chart-wapper">
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
        <div className="expandable-options">
          <ExpandableOptions
            expandIcon={lineChartIcon}
            options={expandableOptions}
            onChooseOption={onChooseOptionHandler}
          />
        </div>
      </div>
    </div>
  );
};

LineChart = forwardRef(LineChart);
export default LineChart;
