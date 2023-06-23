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
  ALLOW_ENTER_LEAVE_ANNOTATIONS,
  LABEL_NOTE_TYPE,
  PREFIX_LABEL_NOTE,
  PREFIX_STATISTIC_NOTE,
  STATISTIC_NOTE_TYPE,
  calculateSuggestXYAxis,
  createChartJsDatasForCustomXAxis,
  ADD_COLUMN_OPTION,
  DELETE_COLUMN_OPTION,
  createYAxisLineChart,
} from "../../../utils/widget-line-chart/commons";
import {
  DEFAULT_SENSOR_DATA,
  LINE_CHART_LABEL_NOTE_TABLE,
  LINE_CHART_RANGE_SELECTION_TABLE,
  LINE_CHART_STATISTIC_NOTE_TABLE,
} from "../../../js/constants";

import "./index.scss";
import usePrompt from "../../../hooks/useModal";
import PromptPopup from "../../molecules/popup-prompt-dialog";
import StoreService from "../../../services/store-service";
import { addStatisticNote, getAllCurrentStatisticNotes } from "../../../utils/widget-line-chart/statistic-plugin";
import { addLabelNote, getAllCurrentLabelNotes } from "../../../utils/widget-line-chart/label-plugin";
import { onClickChartHandler, onClickNoteElement } from "../../../utils/widget-line-chart/annotation-plugin";
import { onClickLegendHandler } from "../../../utils/widget-line-chart/legend-plugin";
import {
  getRangeSelections,
  handleAddSelection,
  handleDeleteSelection,
} from "../../../utils/widget-line-chart/selection-plugin";
import { FIRST_COLUMN_DEFAULT_OPT } from "../../../utils/widget-table-chart/commons";
import DataManagerIST from "../../../services/data-manager";
import PopoverDataRunSensors from "./PopoverDataRunSensors";
import { Button } from "framework7-react";
import { useActivityContext } from "../../../context/ActivityContext";

Chart.register(zoomPlugin);
Chart.register(annotationPlugin);

// ===================================== START DRAG-DROP UTILS =====================================
let noteElement;
let lastNoteEvent;
let isDragging = false;
let selectedPointElement = null;
let selectedNoteElement = null;

let isRangeSelected = false;
let startRangeElement = null;

const statisticNotesStorage = new StoreService(LINE_CHART_STATISTIC_NOTE_TABLE);
const labelNotesStorage = new StoreService(LINE_CHART_LABEL_NOTE_TABLE);
const rangeSelectionStorage = new StoreService(LINE_CHART_RANGE_SELECTION_TABLE);

const handleDrag = function ({ event, chart, pageId }) {
  if (isRangeSelected) {
    switch (event.type) {
      case "mousemove":
        if (!startRangeElement) return;
        handleAddSelection({
          chartInstance: chart,
          startRangeElement: startRangeElement,
          endRangeElement: event,
          pageId,
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
const updateChart = ({ chartInstance, data = [], axisRef, pageId, isCustomXAxis }) => {
  try {
    const setYAxisInfo = new Set();
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
      x: {
        ticks: {
          // forces step size to be 50 units
          //stepSize: ((1 / maxHz) * 1000).toFixed(0),
          //stepSize: stepSize
        },
        title: {
          color: "orange",
          display: true,
          text: axisRef.current.xUnit,
          align: "end",
        },
      },
    };

    // Add y axises depending on number of sensors
    if (data && data.length !== 0) {
      data.forEach((chartData) => {
        const { info, sensorInfo, id } = chartData.yAxis;
        if (setYAxisInfo.has(sensorInfo)) return; // Skip if YAxis is duplicated
        scales[id] = info;
        setYAxisInfo.add(sensorInfo);
      });
    } else {
      const sensorInfo = {
        max: axisRef.current.yMax,
        min: axisRef.current.yMin,
        unit: axisRef.current.yUnit,
      };
      const yAxisInfo = createYAxisLineChart(sensorInfo);
      scales.y = yAxisInfo;
    }

    if (!isCustomXAxis) {
      scales.x.type = "linear";
      scales.x.suggestedMin = 0;
      scales.x.suggestedMax = suggestMaxX;
      if (stepSize) {
        scales.x.ticks.stepSize = stepSize;
      }
      chartInstance.options.plugins.zoom.zoom.mode = "xy";
    } else {
      chartInstance.options.plugins.zoom.zoom.mode = "y";
    }

    // Check if the x-axis is time to custom unit to create appropriate chart
    if (!isCustomXAxis) {
      chartInstance.data = createChartJsDatas({ chartDatas: data, hiddenDataRunIds: hiddenDataRunIds });
    } else {
      chartInstance.data = createChartJsDatasForCustomXAxis({ chartDatas: data, hiddenDataRunIds: hiddenDataRunIds });
    }
    chartInstance.options.animation = false;
    chartInstance.options.scales = scales;

    // Update Annotations for chart
    let newChartAnnotations;

    // Update the chart selection
    if (data?.length > 0) {
      // update chart notes
      const labelNoteAnnotations = getAllCurrentLabelNotes({ pageId: pageId, hiddenDataRunIds });
      const { summaryNotes, linearRegNotes } = getAllCurrentStatisticNotes({ pageId: pageId, hiddenDataRunIds });
      const { rangeSelections } = getRangeSelections({ pageId: pageId });
      newChartAnnotations = {
        ...labelNoteAnnotations,
        ...summaryNotes,
        ...linearRegNotes,
        ...rangeSelections,
      };
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
      if (hiddenDataRunIds.has(dataRunId)) {
        chartInstance.hide(index);
      }
    }
  } catch (error) {
    console.error("updateChart: ", error);
  }
};

// ============================================= MAIN COMPONENT =============================================
let LineChart = (props, ref) => {
  const { handleSensorChange, handleXAxisChange, handleAddExtraCollectingSensor, handleDeleteExtraCollectingSensor } =
    useActivityContext();
  const { widget, xAxis, pageId, isRunning } = props;
  const defaultSensorIndex = 0;
  const sensor = widget.sensors[defaultSensorIndex] || DEFAULT_SENSOR_DATA;

  const definedSensors = DataManagerIST.getCustomUnitSensorInfos({ unitId: xAxis.id });

  // Check whether the options are selected or not
  const isSelectStatistic = statisticNotesStorage.query({ pageId: pageId }).length > 0;
  const isSelectRangeSelection = rangeSelectionStorage.query({ pageId: pageId }).length > 0;
  const [isShowStatistic, setIsShowStatistic] = useState(isSelectStatistic);
  const [isSelectRegion, setIsSelectRegion] = useState(isSelectRangeSelection);
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
  const xAxisRef = useRef({});
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

  if (xAxisRef.current.id !== xAxis?.id) {
    xAxisRef.current = {
      id: xAxis?.id,
      unit: xAxis?.unit,
      name: xAxis?.name,
    };
    axisRef.current.xUnit = xAxis?.unit;
  }

  //=================================================================================
  //============================== useImperativeHandle ==============================
  //=================================================================================
  useImperativeHandle(ref, () => ({
    clearData: () => {},
    setCurrentData: ({ data }) => {
      const xValue = roundAndGetSignificantDigitString({ n: data.x });
      xElRef.current.innerText = `${xValue}(${X_DEFAULT_UNIT})`;
      yElRef.current.innerText = `${data.y}(${axisRef.current.yUnit || ""})`;
    },

    /*
    This function is used to clear hiddenDataRunIds
    in the LineChart for the deleted dataRunIds
    */
    modifyDataRunIds: ({ dataRunIds }) => {
      try {
        for (const dataRunId of hiddenDataRunIds) {
          if (!dataRunIds.includes(dataRunId)) {
            hiddenDataRunIds.delete(dataRunId);
          }
        }

        // Delete all the label + statistic notes of the deleted dataRunIds
        const allLabelNotes = labelNotesStorage.all();
        const allStatisticNotes = statisticNotesStorage.all();

        for (const labelNote of allLabelNotes) {
          if (!dataRunIds.includes(labelNote.dataRunId)) {
            labelNotesStorage.delete(labelNote.id);
            delete chartInstanceRef.current.config.options.plugins.annotation.annotations[labelNote.id];
          }
        }

        for (const statisticNote of allStatisticNotes) {
          if (!dataRunIds.includes(statisticNote.dataRunId)) {
            const summaryNoteId = statisticNote.summary.id;
            const linearRegNoteId = statisticNote.linearReg.id;

            statisticNotesStorage.delete(statisticNote.id);
            delete chartInstanceRef.current.config.options.plugins.annotation.annotations[summaryNoteId];
            delete chartInstanceRef.current.config.options.plugins.annotation.annotations[linearRegNoteId];
          }
        }

        console.log("LineChart_Clear_Deleted_DataRunId_hiddenDataRunIds: ", hiddenDataRunIds);
      } catch (error) {
        console.error("LineChart_modifyDataRunIds: ", error);
      }
    },

    setChartData: ({ chartDatas = [], isCustomXAxis }) => {
      const isHasData = chartDatas.reduce((acc, chartData) => acc || chartData.data.length > 0, false);
      if (!isHasData) return;

      updateChart({
        chartInstance: chartInstanceRef.current,
        data: chartDatas,
        axisRef,
        pageId,
        isCustomXAxis,
      });
    },
  }));

  useEffect(() => {
    // Clear Range Selection
    isRangeSelected = isSelectRegion;

    const minUnitValue = SensorServices.getMinUnitValueAllSensors();
    const chartJsPlugin = getChartJsPlugin({ valueLabelContainerRef: valueContainerElRef });
    chartInstanceRef.current = new Chart(chartEl.current, {
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
            enter: ({ chart, element }) => onEnterNoteElement({ chart, element }),
            leave: ({ chart, element }) => onLeaveNoteElement({ chart, element }),
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
            onClick: (event, legendItem, legend) => onClickLegendHandler(event, legendItem, legend),
          },
        },
      },
      plugins: [
        chartJsPlugin,
        {
          id: "annotation-dragger",
          beforeEvent(chart, args, options) {
            if (handleDrag({ event: args.event, chart, pageId })) {
              args.changed = true;
              return;
            }
          },
        },
      ],
    });

    // Not need updated chart, as updateChart function will call update
    chartInstanceRef.current.config.options.plugins.zoom.pan.enabled = !isSelectRangeSelection;
    chartInstanceRef.current.config.options.plugins.zoom.zoom.pinch.enabled = !isSelectRangeSelection;
    chartInstanceRef.current.config.options.plugins.zoom.zoom.wheel.enabled = !isSelectRangeSelection;

    updateChart({
      chartInstance: chartInstanceRef.current,
      data: [],
      axisRef,
      pageId,
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
      hiddenDataRunIds,
    });
    result && setIsShowStatistic(!isShowStatistic);
  };

  //========================= SELECTION REGION FUNCTIONS =========================
  const selectRegionHandler = (chartInstance) => {
    isRangeSelected = !isSelectRegion;

    // isRangeSelected = True => display zoom
    chartInstance.config.options.plugins.zoom.pan.enabled = !isRangeSelected;
    chartInstance.config.options.plugins.zoom.zoom.pinch.enabled = !isRangeSelected;
    chartInstance.config.options.plugins.zoom.zoom.wheel.enabled = !isRangeSelected;

    if (!isRangeSelected) {
      handleDeleteSelection({ pageId, chartInstance });
    } else {
      chartInstance.update();
    }
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
    if (option.id === xAxis.id) return;

    let chartDatas = [];
    let isCustomXAxis = false;

    axisRef.current.xUnit = option.unit;
    handleXAxisChange({ xAxisId: xAxis.id, option: option });
    updateChart({
      chartInstance: chartInstanceRef.current,
      data: chartDatas,
      axisRef,
      pageId,
      isCustomXAxis,
    });
  };

  const changeSelectedSensor = ({ sensor, sensorIndex }) => {
    // Check if the user select the same sensor or not
    for (const selectedSensor of widget.sensors) {
      if (selectedSensor.id === sensor.id && selectedSensor.index === sensor.index) return;
    }
    handleSensorChange({ widgetId: widget.id, sensorIndex: sensorIndex, sensor: sensor });
  };

  const addColumnHandler = () => {
    const numSensor = widget.sensors?.length ?? 0;
    const container = document.getElementById("line-chart-canvas-container");
    const canvas = container.querySelector("canvas");
    canvas.style.width = 40 * (numSensor + 1) + "px";

    handleAddExtraCollectingSensor(widget.id);
  };

  const deleteColumnHandler = () => {
    const numSensor = widget.sensors?.length ?? 1;
    if (numSensor <= 1) return;
    const deletedColumn = numSensor - 1;
    const deleteSensorIndex = deletedColumn - 1;

    const container = document.getElementById("line-chart-canvas-container");
    const canvas = container.querySelector("canvas");
    canvas.style.width = 40 * (numSensor - 1) + "px";

    handleDeleteExtraCollectingSensor(widget.id, deleteSensorIndex);
  };

  //========================= OPTIONS FUNCTIONS =========================
  const onChooseOptionHandler = (optionId) => {
    switch (optionId) {
      case SCALE_FIT_OPTION:
        scaleToFixHandler(chartInstanceRef.current, axisRef, xAxis);
        break;
      case NOTE_OPTION:
        addNoteHandler(sensorRef.current);
        break;
      case INTERPOLATE_OPTION:
        interpolateHandler(chartInstanceRef.current, hiddenDataRunIds);
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
      case ADD_COLUMN_OPTION:
        addColumnHandler();
        break;
      case DELETE_COLUMN_OPTION:
        deleteColumnHandler();
        break;
      default:
        break;
    }
  };

  return (
    <div className="line-chart-wapper">
      <div className="line-chart">
        {widget.sensors.map((sensor, sensorIndex) => (
          <div key={`line-sensor-selector-${pageId}-${sensorIndex}`} className="sensor-selector-wrapper">
            <div className="sensor-select-vertical-mount-container">
              <SensorSelector
                selectedSensor={sensor}
                onChange={(sensor) => changeSelectedSensor({ sensor, sensorIndex })}
                onSelectUserInit={onSelectUserUnit}
                definedSensors={xAxis.id === FIRST_COLUMN_DEFAULT_OPT ? false : definedSensors}
              ></SensorSelector>
            </div>
          </div>
        ))}

        <div id="line-chart-canvas-container" className="canvas-container">
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

        {xAxis.id !== FIRST_COLUMN_DEFAULT_OPT && (
          <div className="data-run-sensors">
            <Button raised popoverOpen=".popover-data-run-sensors" disabled={isRunning}>
              Button
            </Button>
          </div>
        )}
      </div>

      <PopoverDataRunSensors unitId={xAxis.id}></PopoverDataRunSensors>

      <div className="expandable-options">
        <ExpandableOptions expandIcon={lineChartIcon} options={expandOptions} onChooseOption={onChooseOptionHandler} />
      </div>
      {prompt}
    </div>
  );
};

LineChart = forwardRef(LineChart);
export default LineChart;
