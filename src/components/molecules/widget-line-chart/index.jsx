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
  createChartJsData,
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
  Y_UPPER_LOWER_BOUND,
  X_MIN_VALUE,
  getMaxPointsAllDatasets,
  prepareContentNote,
} from "../../../utils/line-chart-utils";

import "./index.scss";
import dialog from "../dialog/dialog";

Chart.register(zoomPlugin);
Chart.register(annotationPlugin);

// ===================================== START DRAG-DROP UTILS =====================================
let noteElement;
let lastNoteEvent;
let selectedPointElement = null;
let allNotes = {};
let timerDoubleClick;
const POINT_BACKGROUND_COLOR = "#36a2eb80";
const POINT_BORDER_COLOR = "#36a2eb";

const NOTE_BACKGROUND_COLOR = "#ff638440";
const NOTE_BACKGROUND_COLOR_ACTIVE = "#e9164440";
const NOTE_BORDER_COLOR = "#C12553";

let sampleNote = {
  type: "label",
  backgroundColor: NOTE_BACKGROUND_COLOR,
  borderRadius: 6,
  borderWidth: 1,
  borderColor: NOTE_BORDER_COLOR,
  padding: {
    top: 12,
    left: 6,
    right: 6,
    bottom: 12,
  },
  content: ["    Note    "],
  callout: {
    display: true,
    borderColor: "black",
  },
  xValue: 0,
  yValue: 0,
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
      case "mouseout":
      case "mouseup":
        lastNoteEvent = undefined;
        break;
      case "mousedown":
        lastNoteEvent = event;
        break;
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

const getAllCurrentNotes = (sensorId, sensorIndex) => {
  const currentChartNotes = Object.values(allNotes).filter((note) => {
    return note.sensorId === sensorId && note.sensorIndex === sensorIndex;
  });

  const noteElements = {};
  currentChartNotes.forEach((note) => {
    const newNoteElement = {
      ...sampleNote,
      content: note.content,
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
      // Get max points of all datasets
      const maxPointsAllDatasets = getMaxPointsAllDatasets(chart);
      const newPointBackgroundColor = Array.from({ length: maxPointsAllDatasets }, () => POINT_BACKGROUND_COLOR);
      const newPointBorderColor = Array.from({ length: maxPointsAllDatasets }, () => POINT_BORDER_COLOR);

      if (isPointElement) {
        const selectedPoint = elements[0];
        const dataPointIndex = selectedPoint.index;
        selectedPointElement = selectedPoint;
        newPointBackgroundColor[dataPointIndex] = "red";

        chart.config.options.pointBackgroundColor = newPointBackgroundColor;
        chart.config.options.pointBorderColor = newPointBorderColor;

        chart.update();
      } else if (selectedPointElement !== null) {
        selectedPointElement = null;

        chart.config.options.pointBackgroundColor = newPointBackgroundColor;
        chart.config.options.pointBorderColor = newPointBorderColor;

        chart.update();
      }
    }
  }
};
const onEnterNoteElement = ({ chart, element }) => {
  const noteElementId = element.options.id;
  noteElement = element;

  chart.canvas.style.cursor = "pointer";
  chart.config.options.plugins.annotation.annotations[noteElementId].backgroundColor = NOTE_BACKGROUND_COLOR_ACTIVE;
  chart.config.options.plugins.zoom.pan.enabled = false;
  chart.update();
};

const onLeaveNoteElement = ({ chart, element }) => {
  const noteElementId = element?.options?.id;
  let label = chart.config.options.plugins.annotation.annotations[noteElementId];

  if (label) {
    const oldXPixel = chart.scales.x.getPixelForValue(label.xValue);
    const oldYPixel = chart.scales.y.getPixelForValue(label.yValue);
    const newAdjustPos = {
      xAdjust: element.centerX - oldXPixel,
      yAdjust: element.centerY - oldYPixel,
    };

    label = {
      ...label,
      ...newAdjustPos,
      backgroundColor: NOTE_BACKGROUND_COLOR,
    };

    noteElement = undefined;
    lastNoteEvent = undefined;

    const currentNote = {
      ...allNotes[noteElementId],
      ...newAdjustPos,
    };

    allNotes = {
      ...allNotes,
      [noteElementId]: currentNote,
    };

    chart.config.options.plugins.annotation.annotations[noteElementId] = { ...label };
  }

  chart.canvas.style.cursor = "default";
  chart.config.options.plugins.zoom.pan.enabled = true;
  chart.update();
};

const onClickNoteElement = ({ chart, element }) => {
  if (timerDoubleClick) {
    timerDoubleClick = null;
    onDoubleClickNoteElement({ chart, element });
  } else {
    timerDoubleClick = setTimeout(() => {
      timerDoubleClick = null;
    }, 250);
  }
};

const onDoubleClickNoteElement = ({ chart, element }) => {
  const noteElementId = element.options.id;
  const noteElement = chart.config.options.plugins.annotation.annotations[noteElementId];
  if (!noteElement) return;

  dialog.modifyNoteLineChart("Thêm note", (note) => {
    if (!note) {
      delete chart.config.options.plugins.annotation.annotations[noteElementId];
      delete allNotes[noteElementId];
    } else {
      const newContents = prepareContentNote(note);
      chart.config.options.plugins.annotation.annotations[noteElementId].content = newContents;
      allNotes[noteElementId] = { ...allNotes[noteElementId], content: newContents };
    }
    chart.update();
  });
};
const addNoteHandler = (chartInstance, sensorInstance) => {
  if (!selectedPointElement || !selectedPointElement.element) return;

  const xValueNoteElement = chartInstance.scales.x.getValueForPixel(selectedPointElement.element.x);
  const yValueNoteElement = chartInstance.scales.y.getValueForPixel(selectedPointElement.element.y);
  const noteId = `note-element_${sensorInstance.id}_${sensorInstance.index}_${selectedPointElement.datasetIndex}_${selectedPointElement.index}`;

  if (!Object.keys(allNotes).includes(noteId)) {
    const notePos = {
      id: noteId,
      sensorId: sensorInstance.id,
      sensorIndex: sensorInstance.index,
      xValue: xValueNoteElement,
      yValue: yValueNoteElement,
      xAdjust: -60,
      yAdjust: -60,
    };

    const newNoteElement = {
      ...sampleNote,
      ...notePos,
    };

    allNotes = { ...allNotes, [noteId]: notePos };
    chartInstance.config.options.plugins.annotation.annotations = {
      ...chartInstance.config.options.plugins.annotation.annotations,
      [noteId]: newNoteElement,
    };
  }

  // Clear selected point
  selectedPointElement = null;
  const maxPointsAllDatasets = getMaxPointsAllDatasets(chartInstance);
  const newPointBackgroundColor = Array.from({ length: maxPointsAllDatasets }, () => POINT_BACKGROUND_COLOR);
  const newPointBorderColor = Array.from({ length: maxPointsAllDatasets }, () => POINT_BORDER_COLOR);
  chartInstance.config.options.pointBackgroundColor = newPointBackgroundColor;
  chartInstance.config.options.pointBorderColor = newPointBorderColor;

  chartInstance.update();
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
    chartData: data,
    pageStep,
    firstPageStep,
  });

  if (!suggestedMaxX) {
    suggestedMaxX = pageStep;
  }

  const stepSize = suggestedMaxX / 10;

  chartInstance.data = createChartJsData({
    chartData: data,
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

  const noteAnnotations = getAllCurrentNotes(sensor?.id, sensor?.index);
  chartInstance.config.options.plugins.annotation.annotations = {
    ...noteAnnotations,
  };
  chartInstance.update();
};

// ============================================= MAIN COMPONENT =============================================
let LineChart = (props, ref) => {
  const { widget, handleSensorChange } = props;
  const { sensor } = widget;
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
    setChartData: ({ xUnit, yUnit, chartData = [], curSensor: sensor }) => {
      /**
       * chartData = [
       * { name, data: [{x,y}, ...]}
       * ]
       */
      //log("chart data:", chartData);
      axisRef.current.xUnit = xUnit;
      chartData = createChartDataAndParseXAxis({ chartData });
      updateChart({
        chartInstance: chartInstanceRef.current,
        data: chartData,
        axisRef,
        sensor,
        xUnit,
        yUnit,
      });
    },
  }));

  useEffect(() => {
    const data = createChartJsData({
      chartData: [
        {
          name: "",
          data: [],
        },
      ],
    });
    const minUnitValue = SensorServices.getMinUnitValueAllSensors();

    const chartJsPlugin = getChartJsPlugin({ valueLabelContainerRef: valueContainerElRef });
    chartInstanceRef.current = new Chart(chartEl.current, {
      type: "line",
      data: data,
      options: {
        onClick: onClickChartHandler,
        //Customize chart options
        animation: false,
        maintainAspectRatio: false,
        events: ["mousemove", "mouseout", "click", "touchstart", "touchmove", "mousedown"],
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
              y: { min: minUnitValue - Y_UPPER_LOWER_BOUND },
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
            selectedSensor={widget.sensor}
            onChange={(sensor) => handleSensorChange(widget.id, sensor)}
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
