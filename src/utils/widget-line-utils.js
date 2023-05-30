import $ from "jquery";
import chartUtils from "./chartjs-utils";

import interpolateIcon from "../img/expandable-options/interpolate.png";
import autoScaleIcon from "../img/expandable-options/auto-scale.png";
import noteIcon from "../img/expandable-options/note.png";
import statisticIcon from "../img/expandable-options/line-statistic.png";
import selectedStatisticIcon from "../img/expandable-options/line-statistic-selected.png";
import selectionIcon from "../img/expandable-options/line-selection.png";
import selectedSelectionIcon from "../img/expandable-options/line-selection-selected.png";

export const X_FORMAT_FLOATING = 3;
export const X_DEFAULT_UNIT = "s";

export const SCALE_FIT_OPTION = 0;
export const NOTE_OPTION = 1;
export const INTERPOLATE_OPTION = 2;
export const STATISTIC_OPTION = 3;
export const SELECTION_OPTION = 4;

export const OPTIONS_WITH_SELECTED = [STATISTIC_OPTION, SELECTION_OPTION];

export const X_UPPER_LOWER_MARGIN = 2;
export const Y_UPPER_LOWER_MARGIN_SCALE = 0.1;
export const X_MIN_VALUE = 0;
export const Y_MIN_VALUE = 5;

export const INTERPOLATE_VALUE = 0.4;

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
    id: STATISTIC_OPTION,
    icon: statisticIcon,
    selectedIcon: selectedStatisticIcon,
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
];

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
      if (maxX === undefined && maxY === undefined && minX === undefined && minY === undefined) {
        maxX = d.x;
        minX = d.x;
        maxY = d.y;
        minY = d.y;
        return;
      }

      minX = Math.min(minX, d.x);
      maxX = Math.max(maxX, d.x);
      minY = Math.min(minY, d.y);
      maxY = Math.max(maxY, d.y);
    });
  });

  return {
    maxX: maxX,
    minX: minX,
    maxY: maxY,
    minY: minY,
  };
};

export const calculateSuggestMaxX = ({ chartDatas, pageStep, firstPageStep }) => {
  const { maxX } = getMaxMinAxises({
    chartDatas: chartDatas,
  });

  let suggestMaxX;
  if (maxX <= firstPageStep) {
    suggestMaxX = firstPageStep;
  } else {
    const numOfPage = Math.ceil((maxX - firstPageStep) / pageStep);
    suggestMaxX = firstPageStep + pageStep * numOfPage;
  }

  return suggestMaxX;
};

export const createChartDataAndParseXAxis = ({ chartDatas }) => {
  const result = chartDatas.map((chartData) => {
    return {
      name: chartData.name,
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
export const createChartJsDatas = ({ chartDatas = [], pointRadius, tension }) => {
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

    const dataset = {
      label: s.name,
      data: dataList,
      pointStyle: "circle",
      pointRadius: 5,
      pointHoverRadius: 10,
      borderColor: chartUtils.namedColor(index),
      backgroundColor: chartUtils.transparentize(chartUtils.namedColor(index), 0.5),
    };

    if (tension) dataset.tension = tension;
    if (pointRadius) dataset.pointRadius = pointRadius;

    chartDataParam.datasets.push(dataset);
  });

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
export const scaleToFixHandler = (chartInstance, axisRef) => {
  if (!chartInstance.data || !Array.isArray(chartInstance.data.datasets) || chartInstance.data.datasets.length <= 0) {
    return;
  }
  const { maxX, minX, maxY, minY } = getMaxMinAxises({ chartDatas: chartInstance.data.datasets });

  const marginUpperLower = parseInt((maxY - minY) * Y_UPPER_LOWER_MARGIN_SCALE);
  chartInstance.options.animation = true;
  chartInstance.options.scales = {
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
      type: "linear",
      suggestedMin: 0,
      suggestedMax: maxX + X_UPPER_LOWER_MARGIN,
      ticks: {},
      title: {
        color: "orange",
        display: true,
        text: `(${X_DEFAULT_UNIT})`,
        align: "end",
      },
    },
  };
  chartInstance.update();
};

export const interpolateHandler = (chartInstance) => {
  const newDatasets = chartInstance.data.datasets.map((dataset) => {
    return {
      ...dataset,
      tension: INTERPOLATE_VALUE,
    };
  });

  chartInstance.data.datasets = [...newDatasets];
  chartInstance.options.animation = true;
  chartInstance.update();
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
