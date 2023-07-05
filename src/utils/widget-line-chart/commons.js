import $ from "jquery";
import chartUtils from "./chartjs-utils";
import { round } from "mathjs";

import interpolateIcon from "../../img/expandable-options/line-interpolate.png";
import autoScaleIcon from "../../img/expandable-options/line-auto-scale.png";
import noteIcon from "../../img/expandable-options/line-note.png";
import statisticIcon from "../../img/expandable-options/line-statistic.png";
import selectedStatisticIcon from "../../img/expandable-options/line-statistic-selected.png";
import selectionIcon from "../../img/expandable-options/line-selection.png";
import selectedSelectionIcon from "../../img/expandable-options/line-selection-selected.png";
import showOffDataPointIcon from "../../img/expandable-options/line-show-off-datapoint.png";
import selectedShowOffDataPointIcon from "../../img/expandable-options/line-show-off-datapoint-selected.png";
import addColumnIcon from "../../img/expandable-options/add-column.png";
import deleteColumnIcon from "../../img/expandable-options/delete-column.png";

import DataManagerIST from "../../services/data-manager";
import SensorServicesIST from "../../services/sensor-service";
import { FIRST_COLUMN_DEFAULT_OPT } from "../widget-table-chart/commons";
import { createSensorInfo } from "../core";
import { createHiddenDataLineId } from "./legend-plugin";

// ============== DECLARE CONSTANTS ==============
// OPTIONS
export const SCALE_FIT_OPTION = 0;
export const NOTE_OPTION = 1;
export const INTERPOLATE_OPTION = 2;
export const STATISTIC_OPTION = 3;
export const SELECTION_OPTION = 4;
export const SHOW_OFF_DATA_POINT_MARKER = 5;
export const ADD_COLUMN_OPTION = 6;
export const DELETE_COLUMN_OPTION = 7;

export const OPTIONS_WITH_SELECTED = [STATISTIC_OPTION, SELECTION_OPTION, SHOW_OFF_DATA_POINT_MARKER];

export const X_FORMAT_FLOATING = 3;
export const X_DEFAULT_UNIT = "s";

// SCALE FEATURES
export const X_UPPER_LOWER_MARGIN = 2;
export const Y_UPPER_LOWER_MARGIN_SCALE = 0.1;
export const X_MIN_VALUE = 0;
export const Y_MIN_VALUE = 5;

// INTERPOLATE FEATURES
export const INTERPOLATE_VALUE = 0.4;

// LABEL NOTE FEATURES
export const PREFIX_LABEL_NOTE = "label-note";
export const LABEL_NOTE_BACKGROUND = chartUtils.transparentize(chartUtils.CHART_COLORS.red, 0.5);
export const LABEL_NOTE_BACKGROUND_ACTIVE = chartUtils.CHART_COLORS.red;
export const LABEL_NOTE_BORDER = "#C12553";

// STATISTIC NOTE FEATURES
export const PREFIX_STATISTIC_NOTE = "statistic-note";
export const STATISTIC_NOTE_BACKGROUND = chartUtils.transparentize(chartUtils.CHART_COLORS.grey, 0.8);
export const STATISTIC_NOTE_BORDER = chartUtils.CHART_COLORS.black;

export const PREFIX_LINEAR_REGRESSION = "linear-regression-annotation";
export const LINEAR_REGRESSION_BACKGROUND = "rgb(100, 149, 237)";

export const STATISTIC_NOTE_TYPE = 0;
export const LABEL_NOTE_TYPE = 1;

// ELEMENTS INTERACTIONS
export const ALLOW_ENTER_LEAVE_ANNOTATIONS = [PREFIX_LABEL_NOTE, PREFIX_STATISTIC_NOTE];
export const ALLOW_CLICK_ANNOTATIONS = [PREFIX_LABEL_NOTE];

// RANGE SELECTION OPTIONS
export const RANGE_SELECTION_ANNOTATION_ID = "range-selection-annotation";
export const RANGE_SELECTION_BACKGROUND = chartUtils.transparentize(chartUtils.CHART_COLORS.red, 0.8);
export const RANGE_SELECTION_BORDER = chartUtils.CHART_COLORS.red;

// DATA POINTS
export const POINT_STYLE = "circle";
export const POINT_RADIUS = 5;
export const POINT_HOVER_RADIUS = 10;

export const expandableOptions = [
  {
    id: SCALE_FIT_OPTION,
    icon: autoScaleIcon,
  },
  {
    id: NOTE_OPTION,
    icon: noteIcon,
  },
  {
    id: INTERPOLATE_OPTION,
    icon: interpolateIcon,
    size: "70%",
  },
  {
    id: SHOW_OFF_DATA_POINT_MARKER,
    icon: showOffDataPointIcon,
    selectedIcon: selectedShowOffDataPointIcon,
    selected: false,
    size: "70%",
  },
  {
    id: SELECTION_OPTION,
    icon: selectionIcon,
    selectedIcon: selectedSelectionIcon,
    selected: false,
    size: "70%",
  },
  {
    id: STATISTIC_OPTION,
    icon: statisticIcon,
    selectedIcon: selectedStatisticIcon,
    selected: false,
    size: "70%",
  },
  {
    id: ADD_COLUMN_OPTION,
    icon: addColumnIcon,
    selected: false,
  },
  {
    id: DELETE_COLUMN_OPTION,
    icon: deleteColumnIcon,
    selected: false,
  },
];

export const SAMPLE_LABEL_NOTE = {
  type: "label",
  backgroundColor: LABEL_NOTE_BACKGROUND,
  borderRadius: 6,
  borderWidth: 1,
  borderColor: LABEL_NOTE_BORDER,
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

export const SAMPLE_STATISTIC_NOTE = {
  type: "label",
  backgroundColor: STATISTIC_NOTE_BACKGROUND,
  textAlign: "left",
  borderRadius: 6,
  borderWidth: 1,
  borderColor: STATISTIC_NOTE_BORDER,
  padding: {
    top: 20,
    left: 12,
    right: 12,
    bottom: 20,
  },
  content: [""],
  callout: {
    display: true,
    borderColor: "black",
  },
  xValue: 0,
  yValue: 0,
  display: true,
};

export const SAMPLE_LINEAR_ANNOTATION = {
  type: "line",
  borderColor: "rgb(100, 149, 237)",
  borderDash: [6, 6],
  borderDashOffset: 0,
  borderWidth: 3,
  xScaleID: "x",
  yScaleID: "y",
  // xMax: 8,
  // xMin: 5,
  // yMax: 110,
  // yMin: 110,
};

export const SAMPLE_RANGE_SELECTION_ANNOTATION = {
  type: "box",
  borderColor: RANGE_SELECTION_BORDER,
  borderWidth: 2,
  label: {
    display: true,
  },
  xScaleID: "x",
  yScaleID: "y",
  // xMax: "April",
  // xMin: "February",
  // yMax: 90,
  // yMin: 10,
};

export const hiddenDataLineIds = new Set();

// ======================================= CHART UTILS =======================================
const roundXValue = (value) => {
  return Math.round(value * Math.pow(10, X_FORMAT_FLOATING)) / Math.pow(10, X_FORMAT_FLOATING);
};

// chartData: chartInstance.data.datasets
/**
 * Calculates the maximum and minimum values of x and y axes from the given chart datas.
 *
 * @param {Object} options - The options object.
 * @param {Array<ChartData>} options.chartDatas - The array of chart datas.
 * @returns {Object} An object containing the maximum and minimum values of x and y axes.
 * @property {number} maxX - The maximum value of the x-axis.
 * @property {number} minX - The minimum value of the x-axis.
 * @property {number} maxY - The maximum value of the y-axis.
 * @property {number} minY - The minimum value of the y-axis.
 */
export const getMaxMinAxises = ({ chartDatas }) => {
  let maxX;
  let maxY;
  let minX;
  let minY;

  chartDatas.forEach((dataset) => {
    dataset.data.forEach((d) => {
      if (typeof d === "object") {
        if (maxX === undefined && maxY === undefined && minX === undefined && minY === undefined) {
          maxX = d.x;
          minX = d.x;
          maxY = d.y;
          minY = d.y;
          return;
        }

        minY = Math.min(minY, d.y);
        maxY = Math.max(maxY, d.y);
        minX = Math.min(minX, d.x);
        maxX = Math.max(maxX, d.x);
      } else {
        if (maxY === undefined && minY === undefined) {
          maxY = d;
          minY = d;
          return;
        }

        minY = Math.min(minY, d);
        maxY = Math.max(maxY, d);
      }
    });
  });

  return {
    maxX: maxX,
    minX: minX,
    maxY: maxY,
    minY: minY,
  };
};

export const calculateSuggestXYAxis = ({ chartDatas, pageStep, firstPageStep }) => {
  const { maxX, maxY } = getMaxMinAxises({
    chartDatas: chartDatas,
  });

  let suggestMaxX;
  if (maxX <= firstPageStep) {
    suggestMaxX = firstPageStep;
  } else {
    const numOfPage = Math.ceil((maxX - firstPageStep) / pageStep);
    suggestMaxX = firstPageStep + pageStep * numOfPage;
  }

  return { suggestMaxX, suggestMaxY: maxY };
};

export const createChartDataAndParseXAxis = ({ chartDatas }) => {
  const result = chartDatas.map((chartData) => {
    return {
      ...chartData,
      data: chartData.data.map((item) => {
        return {
          x: roundXValue(parseFloat(item.x)),
          y: item.y,
        };
      }),
    };
  });

  return result;
};

/** Creates Chart.js data object for rendering charts.
 * @param {Object} options - Options for creating the chart data.
 * @param {Array<{name: string, data: Array<{x, y}>}>} options.chartDatas - Array of chart data objects.
 * @param {number} options.pointRadius - Point radius for the chart data.
 * @param {number} options.tension - Tension value for the chart data.
 * @param {Array} options.hiddenDataLineIds - Array of hidden data run IDs.
 * @returns {Object} - Chart.js data object.
 */
export const createChartJsDatas = ({ chartDatas = [], pointRadius, tension, hiddenDataLineIds }) => {
  let chartDataParam = {
    labels: [],
    datasets: [
      {
        label: "",
        data: [],
      },
    ],
  };

  chartDataParam.datasets = [];
  chartDatas.forEach((chartData, index) => {
    const dataList = [];
    let firstPoint = null;
    const yAxisID = chartData.yAxis?.id ? chartData.yAxis.id : "y";

    chartData.data.forEach((d, dataIndex) => {
      if (dataIndex == 0) {
        const firstData = chartData.data[0];
        firstPoint = {
          x: roundXValue(firstData.x),
          y: firstData.y,
        };
      }
      dataList.push({
        x: roundXValue(d.x - firstPoint.x),
        y: d.y,
      });
    });

    const dataset = {
      label: chartData.name,
      data: dataList,
      dataRunId: chartData.dataRunId,
      borderColor: chartUtils.namedColor(index),
      backgroundColor: chartUtils.transparentize(chartUtils.namedColor(index), 0.5),
      yAxis: chartData.yAxis,
      yAxisID: yAxisID,
    };

    if (tension) dataset.tension = tension;
    if (pointRadius) dataset.pointRadius = pointRadius;

    chartDataParam.datasets.push(dataset);
  });

  return chartDataParam;
};

export const createChartJsDatasForCustomXAxis = ({ chartDatas = [], pointRadius, tension }) => {
  let chartDataParam = {};
  chartDataParam.datasets = [];

  chartDatas.forEach((chartData, chartDataIndex) => {
    const dataList = chartData.data;
    const yAxisID = chartData.yAxis?.id ? chartData.yAxis.id : "y";

    const dataset = {
      label: chartData.name,
      data: dataList,
      borderColor: chartUtils.namedColor(chartDataIndex),
      backgroundColor: chartUtils.transparentize(chartUtils.namedColor(chartDataIndex), 0.5),
      yAxis: chartData.yAxis,
      yAxisID: yAxisID,
    };

    if (tension) dataset.tension = tension;
    if (pointRadius) dataset.pointRadius = pointRadius;

    chartDataParam.datasets.push(dataset);
  });

  console.log("chartDataParam: ", chartDataParam);
  return chartDataParam;
};

export const roundAndGetSignificantDigitString = ({ n }) => {
  if (typeof n === "number") {
    return n.toString();
  } else if (typeof n === "string") {
    return roundXValue(parseFloat(n)).toString();
  } else {
    return NaN;
  }
};

export const getCustomTooltipFunc = ({ axisRef }) => {
  return (context) => {
    let tooltipEl = document.getElementById("chartjs-tooltip");

    // Create element on first render
    if (!tooltipEl) {
      tooltipEl = document.createElement("div");
      tooltipEl.classList.add("chartjs-tooltip-custom");
      tooltipEl.id = "chartjs-tooltip";
      tooltipEl.innerHTML = "<table></table>";
      document.body.appendChild(tooltipEl);
    }

    // Hide if no tooltip
    const tooltipModel = context.tooltip;
    if (tooltipModel.opacity === 0) {
      tooltipEl.style.opacity = 0;
      return;
    }

    // Set caret Position
    tooltipEl.classList.remove("above", "below", "no-transform");
    if (tooltipModel.yAlign) {
      tooltipEl.classList.add(tooltipModel.yAlign);
    } else {
      tooltipEl.classList.add("no-transform");
    }

    function getBody(bodyItem) {
      return bodyItem.lines;
    }

    // Set Text
    if (tooltipModel.body) {
      const bodyLines = tooltipModel.body.map(getBody);
      let innerHtml = "<tbody>";
      bodyLines.forEach(function (body, i) {
        const colors = tooltipModel.labelColors[i];
        let bodyValues = [];
        if (body && body.length > 0) {
          bodyValues = body[0].split("|");
          const dataSetName = bodyValues[0],
            xValue = bodyValues[1],
            yValue = bodyValues[2];
          let style = `display: inline-block; background: ${colors.borderColor};`;
          style += `border-color: ${colors.borderColor};`;
          style += "border-width: 2px; width: 10px; height: 10px; margin-right: 3px;";
          let span = "";
          span = `<tr><td><span style="${style}"></span><span>${dataSetName}</span></td></tr>`;
          innerHtml += span;
          innerHtml += `<tr><td>x=${xValue}(${X_DEFAULT_UNIT})</td></tr>`;
          innerHtml += `<tr><td>y=${yValue}(${axisRef.current.yUnit || ""})</td></tr>`;
        }
      });
      innerHtml += "</tbody>";

      let tableRoot = tooltipEl.querySelector("table");
      tableRoot.innerHTML = innerHtml;
    }

    const position = context.chart.canvas.getBoundingClientRect();
    const windowWidth = $(window).width();
    let suggestedX = position.left + window.pageXOffset + tooltipModel.caretX + 10,
      tooltipWidth = $(tooltipEl).outerWidth();
    if (suggestedX + tooltipWidth > windowWidth) {
      suggestedX -= tooltipWidth + 10;
    }

    tooltipEl.style.opacity = 1;
    tooltipEl.style.position = "absolute";
    tooltipEl.style.left = `${suggestedX}px`;
    tooltipEl.style.top = position.top + window.pageYOffset + tooltipModel.caretY + "px";
    tooltipEl.style.zIndex = 9999;
    tooltipEl.style.fontFamily = "Arial";
    tooltipEl.style.fontSize = "14px";
    tooltipEl.style.padding = tooltipModel.padding + "px " + tooltipModel.padding + "px";
    tooltipEl.style.pointerEvents = "none";
  };
};

export const getChartJsPlugin = ({ valueLabelContainerRef }) => {
  return {
    afterDraw: (chart, args, options) => {
      try {
        const { ctx } = chart;
        let xAxis = chart.scales["x"];
        let yAxis = chart.scales["y"];
        valueLabelContainerRef.current.style.top = `${yAxis.top + 5}px`;
        valueLabelContainerRef.current.style.left = `${xAxis.left + 5}px`;
        ctx.save();
        ctx.restore();
      } catch (e) {}
    },
  };
};

// ======================================= START EXPANDED OPTIONS FUNCTIONS =======================================
export const scaleToFixHandler = (chartInstance, axisRef, xAxis) => {
  if (!chartInstance.data || !Array.isArray(chartInstance.data.datasets) || chartInstance.data.datasets.length <= 0) {
    return;
  }

  const isDefaultXAxis = xAxis.id === FIRST_COLUMN_DEFAULT_OPT;
  const { maxX, minX, maxY, minY } = getMaxMinAxises({ chartDatas: chartInstance.data.datasets });
  console.log("maxX, minX, maxY, minY, marginUpperLower: ", maxX, minX, maxY, minY);
  const scales = {
    x: {
      ticks: {},
      title: {
        color: "orange",
        display: true,
        text: `(${X_DEFAULT_UNIT})`,
        align: "end",
      },
    },
  };

  for (const dataset of chartInstance.data.datasets) {
    const yAxisInfo = dataset.yAxis.info;
    scales[dataset.yAxis.id] = {
      ...yAxisInfo,
      suggestedMin: minY,
      suggestedMax: maxY,
    };
  }

  if (isDefaultXAxis) {
    scales.x.type = "linear";
    scales.x.suggestedMin = 0;
    scales.x.suggestedMax = maxX + X_UPPER_LOWER_MARGIN;
  }

  chartInstance.options.animation = true;
  chartInstance.options.scales = scales;
  chartInstance.update();

  // Reset the chart options to the default
  chartInstance.options.animation = false;
};

export const interpolateHandler = (chartInstance, hiddenDataLineIds) => {
  const newDatasets = chartInstance.data.datasets.map((dataset) => {
    return {
      ...dataset,
      tension: INTERPOLATE_VALUE,
    };
  });

  chartInstance.data.datasets = [...newDatasets];
  chartInstance.options.animation = true;
  chartInstance.update();

  for (let index = 0; index < chartInstance.data.datasets.length; index++) {
    const dataRunId = chartInstance.data.datasets[index]?.dataRunId;
    const sensorInfo = chartInstance.data.datasets[index]?.sensorInfo;
    const hiddenDataLineId = createHiddenDataLineId({ dataRunId, sensorInfo });
    if (hiddenDataLineIds.has(hiddenDataLineId)) {
      chartInstance.hide(index);
    }
  }

  // Reset the chart options to the default
  chartInstance.options.animation = false;
};

// ======================================= END EXPANDED OPTIONS FUNCTIONS =======================================
export const prepareContentNote = (str) => {
  const words = str.split(" ");
  const result = [];
  let currentString = "";

  for (let i = 0; i < words.length; i++) {
    if ((currentString + words[i]).length <= 20) {
      currentString += words[i] + " ";
    } else {
      result.push(currentString.trim());
      currentString = words[i] + " ";
    }
  }

  // Push any remaining words
  if (currentString.length > 0) {
    result.push(currentString.trim());
  }

  return result;
};

export const clearAllSelectedPoints = (chart) => {
  chart.data.datasets.forEach((dataset) => {
    const backgroundColor = dataset.backgroundColor;
    const borderColor = dataset.borderColor;

    const newPointBackgroundColor = Array.from({ length: dataset.data.length }, () => backgroundColor);
    const newPointBorderColor = Array.from({ length: dataset.data.length }, () => borderColor);

    dataset.pointBackgroundColor = newPointBackgroundColor;
    dataset.pointBorderColor = newPointBorderColor;
  });
};

// ======================================= START RANGE SELECTION OPTIONS FUNCTIONS =======================================
export const calculateBoxRange = ({ chartInstance, startElement, endElement }) => {
  const startXValue = chartInstance.scales.x.getValueForPixel(startElement.x);
  const startYValue = chartInstance.scales.y.getValueForPixel(startElement.y);
  const endXValue = chartInstance.scales.x.getValueForPixel(endElement.x);
  const endYValue = chartInstance.scales.y.getValueForPixel(endElement.y);

  return {
    startXValue: round(startXValue, 1),
    endXValue: round(endXValue, 1),
    startYValue: round(startYValue, 1),
    endYValue: round(endYValue, 1),
  };
};

// ======================================= CONVERT CHART DATA UTILS =======================================
/**
 * @typedef {Object} YAxisInfo
 * @property {string} info - Used for draw y axis in the chart.
 * @property {number} sensorInfo - `${sensorId}-${sensorIndex}`.
 * @property {number} id - index === 0 ? "y" : `y${index}`.
 */

/**
 * @typedef {Object} DataPoint
 * @property {number} x - The x-axis value.
 * @property {number|string} y - The y-axis value.
 */

/**
 * @typedef {Object} ChartData
 * @property {string} name - The name of the data run.
 * @property {Array<DataPoint>} data - The data points for the chart.
 * @property {string} dataRunId - The ID of the data run.
 * @property {YAxisInfo} yAxis - The labels associated with the data.
 */

/**
 * Retrieves chart data for the specified sensor.
 * @param {Object} options - The options for retrieving chart data.
 * @param {Object} options.sensor - The sensor object.
 * @param {number} options.defaultSensorIndex - The default sensor index.
 * @returns {Object} - The chart data.
 * @property {Array<ChartData>} chartDatas - The array of chart data.
 * @property {Array<string>} dataRunIds - The IDs of the data runs.
 */
export const getChartDatas = ({ sensors, unitId }) => {
  const chartDatas = [];
  const dataRunIds = [];
  const result = {
    chartDatas: chartDatas,
    dataRunIds: dataRunIds,
  };

  const isDefaultXAxis = [FIRST_COLUMN_DEFAULT_OPT].includes(unitId);
  const userInput = DataManagerIST.getUseInputCustomUnit({ unitId });
  let dataRunPreviews = DataManagerIST.getActivityDataRunPreview();

  for (const dataRunPreview of dataRunPreviews) {
    const allSelectedSensorsData = [];
    sensors?.forEach((sensor, index) => {
      const yAxisID = createYAxisId({ index });
      const sensorId = sensor.id;
      const sensorIndex = sensor.index;
      const sensorInfo = SensorServicesIST.getSensorInfo(sensorId);
      let sensorSubInfo = null,
        sensorName = "",
        data = [],
        numEmptyInput = 0;

      if (sensorInfo) {
        sensorSubInfo = sensorInfo.data[sensorIndex];
        sensorName = `${sensorSubInfo?.name} (${sensorSubInfo?.unit})`;
        const chartData = DataManagerIST.getWidgetDatasRunData(dataRunPreview.id, [sensorId])[0] || [];

        // If x axis is the time series, number of data points equals number of chartData points
        // Otherwise, get the min of the chartData points and user inputs
        const numDataPoints = isDefaultXAxis ? chartData.length : Math.min(chartData.length, userInput.length);

        for (let index = 0; index < numDataPoints; index++) {
          const d = chartData[index];
          let xValue;
          if (isDefaultXAxis) {
            xValue = d.time;
          } else {
            // This code make the difference xValue when user inputs type ""
            const input = userInput[index] || "";
            if (input !== "") xValue = input;
            else {
              numEmptyInput += 1;
              xValue = input + " ".repeat(numEmptyInput);
            }
          }

          const dataPoint = {
            x: xValue,
            y: d.values[sensorIndex] || "",
          };
          data.push(dataPoint);
        }
      } else {
        return;
      }

      const yAxisInfo = createYAxisLineChart(sensorSubInfo);
      allSelectedSensorsData.push(data);

      chartDatas.push({
        name: `${dataRunPreview.name} - ${sensorName}`,
        data: data,
        dataRunId: dataRunPreview.id,
        yAxis: {
          info: yAxisInfo,
          sensorInfo: createSensorInfo(sensor),
          id: yAxisID,
        },
      });
    });

    dataRunIds.push(dataRunPreview.id);
  }

  result.chartDatas = chartDatas;
  result.dataRunIds = dataRunIds;
  return result;
};

/**
 * @typedef {Object} SensorInfo
 * @property {string} id - The name of the data run.
 * @property {string} name - The name of the data run.
 * @property {string} unit - The name of the data run.
 * @property {number} min - The name of the data run.
 * @property {number} max - The name of the data run.
 * @property {number} formatFloatingPoint - The name of the data run.
 */

/**
 * Creates the configuration object for the Y-axis of a line chart.
 *
 * @param {SensorInfo} sensorInfo - Information about the sensor.
 * @param {number} sensorInfo.min - The minimum value for the axis (optional).
 * @param {number} sensorInfo.max - The maximum value for the axis (optional).
 * @param {string} sensorInfo.unit - The unit of measurement for the axis (optional).
 * @returns {Object} The configuration object for the Y-axis of the line chart.
 */
export const createYAxisLineChart = (sensorInfo) => {
  const minValue = sensorInfo?.min ? sensorInfo.min : 0;
  const maxValue = sensorInfo?.max ? sensorInfo.max : 1.0;
  const unitValue = sensorInfo?.unit ? sensorInfo.unit : "";

  return {
    position: "left",
    suggestedMin: minValue,
    suggestedMax: maxValue,
    title: {
      color: "orange",
      display: true,
      text: unitValue,
    },
  };
};
export const createYAxisId = ({ index }) => {
  return index === 0 ? "y" : `y${index}`;
};
