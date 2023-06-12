import $ from "jquery";
import chartUtils from "./chartjs-utils";
import { min, max, std, mean, round } from "mathjs";
import interpolateIcon from "../../img/expandable-options/line-interpolate.png";
import autoScaleIcon from "../../img/expandable-options/line-auto-scale.png";
import noteIcon from "../../img/expandable-options/line-note.png";
import statisticIcon from "../../img/expandable-options/line-statistic.png";
import selectedStatisticIcon from "../../img/expandable-options/line-statistic-selected.png";
import selectionIcon from "../../img/expandable-options/line-selection.png";
import selectedSelectionIcon from "../../img/expandable-options/line-selection-selected.png";
import showOffDataPointIcon from "../../img/expandable-options/line-show-off-datapoint.png";
import selectedShowOffDataPointIcon from "../../img/expandable-options/line-show-off-datapoint-selected.png";
import DataManagerIST from "../../services/data-manager";
import SensorServicesIST from "../../services/sensor-service";
import { FIRST_COLUMN_DEFAULT_OPT } from "../widget-table-chart/commons";
import { DEFAULT_SENSOR_ID, RETURN_DICT_OPTION } from "../../js/constants";

// ============== DECLARE CONSTANTS ==============
// OPTIONS
export const SCALE_FIT_OPTION = 0;
export const NOTE_OPTION = 1;
export const INTERPOLATE_OPTION = 2;
export const STATISTIC_OPTION = 3;
export const SELECTION_OPTION = 4;
export const SHOW_OFF_DATA_POINT_MARKER = 5;

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

export const hiddenDataRunIds = new Set();

// ======================================= CHART UTILS =======================================
const roundXValue = (value) => {
  return Math.round(value * Math.pow(10, X_FORMAT_FLOATING)) / Math.pow(10, X_FORMAT_FLOATING);
};

// chartData: chartInstance.data.datasets
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

/**
 *
 * @param {{chartData: Array.<{name: string, data: Array<{x, y}>}>}} param0
 */
export const createChartJsDatas = ({ chartDatas = [], pointRadius, tension, hiddenDataRunIds }) => {
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
  chartDatas.forEach((s, index) => {
    const dataList = [];
    let firstPoint = null;
    // const isDataRunHidden = hiddenDataRunIds.has(s.dataRunId);
    // console.log(`widget-line-utils_createChartJsDatas_isDataRun_${s.dataRunId}_hidden_${isDataRunHidden}`);

    // if (!isDataRunHidden) {
    s.data.forEach((d, dataIndex) => {
      if (dataIndex == 0) {
        const firstData = s.data[0];
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
    // }

    const dataset = {
      label: s.name,
      data: dataList,
      dataRunId: s.dataRunId,
      // pointStyle: "circle",
      // pointRadius: 5,
      // pointHoverRadius: 10,
      borderColor: chartUtils.namedColor(index),
      backgroundColor: chartUtils.transparentize(chartUtils.namedColor(index), 0.5),
    };

    if (tension) dataset.tension = tension;
    if (pointRadius) dataset.pointRadius = pointRadius;

    chartDataParam.datasets.push(dataset);
  });

  return chartDataParam;
};

export const createChartJsDatasForCustomXAxis = ({ chartDatas = [], pointRadius, tension }) => {
  let chartDataParam = {};
  chartDataParam.labels = [];
  chartDataParam.datasets = [];

  chartDatas.forEach((chartData, chartDataIndex) => {
    if (chartDataIndex === 0) chartDataParam.labels = chartData.labels;
    const dataList = chartData.data;

    const dataset = {
      label: chartData.name,
      data: dataList,
      borderColor: chartUtils.namedColor(chartDataIndex),
      backgroundColor: chartUtils.transparentize(chartUtils.namedColor(chartDataIndex), 0.5),
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

  const isXLabel = xAxis.id !== FIRST_COLUMN_DEFAULT_OPT;
  const { maxX, minX, maxY, minY } = getMaxMinAxises({ chartDatas: chartInstance.data.datasets });
  console.log("isXLabel: ", isXLabel);
  console.log("maxX, minX, maxY, minY: ", maxX, minX, maxY, minY);
  const marginUpperLower = parseInt((maxY - minY) * Y_UPPER_LOWER_MARGIN_SCALE);
  const scales = {
    y: {
      min: minY - marginUpperLower,
      suggestedMax: maxY + marginUpperLower,
      title: {
        color: "orange",
        display: false,
        text: axisRef.current.yUnit,
      },
    },
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

  if (!isXLabel) {
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

export const interpolateHandler = (chartInstance, hiddenDataRunIds) => {
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
    if (hiddenDataRunIds.has(dataRunId)) {
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

export const getChartDatas = ({ sensor, defaultSensorIndex, currentDataRunId }) => {
  let dataRunPreviews = DataManagerIST.getActivityDataRunPreview();
  let currentData = [];
  const dataRunIds = [];

  /* chartDatas: [
      {
        name: dataRunPreview.name,
        dataRunId: dataRunPreview.id,
        data: [
          { x: 1, y: 2 },
          { x: 2, y: 3 },
          ...
        ]
      }, {
        ...
      }
    ]
    */
  const chartDatas = dataRunPreviews.map((dataRunPreview) => {
    let chartData = DataManagerIST.getWidgetDatasRunData(dataRunPreview.id, [sensor.id])[defaultSensorIndex] || [];
    const data = chartData.map((d) => ({ x: d.time, y: d.values[sensor.index] || "" })) || [];
    if (dataRunPreview.id === currentDataRunId) {
      currentData = data;
    }

    dataRunIds.push(dataRunPreview.id);

    return {
      name: dataRunPreview.name,
      data: data,
      dataRunId: dataRunPreview.id,
    };
  });

  return {
    chartDatas: chartDatas,
    currentData: currentData,
    dataRunIds: dataRunIds,
  };
};

export const getChartCustomUnitDatas = ({ unitId, sensors }) => {
  const chartDatas = [];
  const sensorIds = new Set();
  for (const sensor of sensors) {
    if (sensor.id === DEFAULT_SENSOR_ID) continue;
    sensorIds.add(sensor.id);
  }

  if (sensorIds.size === 0) return { chartDatas };

  const datas = DataManagerIST.getChartCustomUnitDatas({
    unitId: unitId,
    sensorIds: sensorIds,
    returnOption: RETURN_DICT_OPTION,
  });

  for (const sensor of sensors) {
    const sensorId = sensor.id;
    const sensorIndex = sensor.index;
    const sensorInfo = SensorServicesIST.getSensorInfo(sensorId);
    const sensorName = `${sensorInfo.data[sensorIndex]?.name} (${sensorInfo.data[sensorIndex]?.unit})`;

    let dataOfSensorIndex = [];
    const data = datas[sensorId]?.data;
    const labels = datas[sensorId]?.labels || [];

    if (data) {
      dataOfSensorIndex = data.map((d) => d[sensorIndex]) || [];
    }

    chartDatas.push({
      name: sensorName,
      data: dataOfSensorIndex,
      labels: labels,
    });
  }
  return { chartDatas };
};
