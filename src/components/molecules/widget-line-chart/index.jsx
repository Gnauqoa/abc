import React, { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import Chart from "chart.js/auto";
import zoomPlugin from "chartjs-plugin-zoom";
import $ from "jquery";
import ExpandableOptions from "../expandable-options";

import SensorSelector from "../popup-sensor-selector";
import SensorServices from "../../../services/sensor-service";

import "./index.scss";

Chart.register(zoomPlugin);

import lineChartIcon from "../../../img/expandable-options/line.png";
import interpolateIcon from "../../../img/expandable-options/interpolate.png";
import autoScaleIcon from "../../../img/expandable-options/auto-scale.png";
import noteIcon from "../../../img/expandable-options/note.png";

const X_FORMAT_FLOATING = 3;
const X_DEFAULT_UNIT = "s";

const SCALE_FIT_OPTION = 0;
const NOTE_OPTION = 1;
const INTERPOLATE_OPTION = 2;

const X_UPPER_LOWER_BOUND = 2;
const Y_UPPER_LOWER_BOUND = 5;

const X_MIN_VALUE = -10;

const expandableOptions = [
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
  },
];

// ======================================= CHART UTILS =======================================
const roundXValue = (value) => {
  return Math.round(value * Math.pow(10, X_FORMAT_FLOATING)) / Math.pow(10, X_FORMAT_FLOATING);
};

// chartData: chartInstance.data.datasets
const getMaxMinAxises = ({ chartData }) => {
  let maxX;
  let maxY;
  let minX;
  let minY;

  chartData.forEach((dataset) => {
    const data = dataset.data;
    data.forEach((d, index) => {
      if (index === 0) {
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

const calculateSuggestMaxX = ({ chartData, pageStep, firstPageStep }) => {
  const { maxX } = getMaxMinAxises({
    chartData,
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

// ======================================= CHART FUNCTIONS =======================================
const getChartJsPlugin = ({ valueLabelContainerRef }) => {
  return {
    afterDraw: (chart, args, options) => {
      const { ctx } = chart;
      let xAxis = chart.scales["x"];
      let yAxis = chart.scales["y"];
      valueLabelContainerRef.current.style.top = `${yAxis.top + 5}px`;
      valueLabelContainerRef.current.style.left = `${xAxis.left + 5}px`;
      ctx.save();
      ctx.restore();
    },
  };
};

/**
 *
 * @param {{chartData: Array.<{name: string, data: Array<{x, y}>}>}} param0
 */
const createChartJsData = ({ chartData = [] }) => {
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
  chartData.forEach((s) => {
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
    chartDataParam.datasets.push({
      label: s.name,
      data: dataList,
    });
  });

  /**For testing */
  // chartData.forEach((s, index) => {
  //   const dataList = [];
  //   let firstPoint = null;

  //   s.data.forEach((d, dataIndex) => {
  //     if (dataIndex == 0) {
  //       const firstData = s.data[0];
  //       firstPoint = {
  //         x: firstData.x,
  //         y: firstData.y,
  //       };
  //     }
  //     dataList.push({
  //       x: d.x - firstPoint.x,
  //       y: parseFloat(d.y) + 10,
  //     });
  //   });
  //   chartDataParam.datasets.push({
  //     label: s.name + "test",
  //     data: dataList,
  //   });
  // });

  return chartDataParam;
};

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
const updateChart = ({ chartInstance, data, axisRef }) => {
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
        text: axisRef.current.xUnit,
        text: `(${X_DEFAULT_UNIT})`,
        align: "end",
      },
    },
  };

  if (stepSize) {
    chartInstance.options.scales.x.ticks.stepSize = stepSize;
  }

  chartInstance.update();
};

const createChartDataAndParseXAxis = ({ chartData }) => {
  const result = chartData.map((dataSeries) => {
    return {
      name: dataSeries.name,
      data: dataSeries.data.map((item) => {
        return {
          x: roundXValue(parseFloat(item.x)),
          y: item.y,
        };
      }),
    };
  });

  return result;
};

const roundAndGetSignificantDigitString = ({ n }) => {
  if (typeof n === "number") {
    return n.toString();
  } else if (typeof n === "string") {
    return roundXValue(parseFloat(n)).toString();
  } else {
    return NaN;
  }
};

const getCustomTooltipFunc = ({ axisRef }) => {
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

// ======================================= EXPANDED OPTIONS FUNCTIONS =======================================
const scaleToFixHandler = (chartInstance, axisRef) => {
  if (!chartInstance.data || !Array.isArray(chartInstance.data.datasets) || chartInstance.data.datasets.length <= 0) {
    return;
  }
  const { maxX, minX, maxY, minY } = getMaxMinAxises({ chartData: chartInstance.data.datasets });

  chartInstance.options.animation = true;
  chartInstance.options.scales = {
    y: {
      min: minY - Y_UPPER_LOWER_BOUND,
      suggestedMax: maxY + Y_UPPER_LOWER_BOUND,
      title: {
        color: "orange",
        display: false,
        text: axisRef.current.yUnit,
      },
    },
    x: {
      type: "linear",
      suggestedMin: 0,
      suggestedMax: maxX + X_UPPER_LOWER_BOUND,
      ticks: {},
      title: {
        color: "orange",
        display: true,
        text: axisRef.current.xUnit,
        text: `(${X_DEFAULT_UNIT})`,
        align: "end",
      },
    },
  };
  chartInstance.update();
};

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

  let valueContainerElRef = useRef();
  let xElRef = useRef();
  let yElRef = useRef();

  useImperativeHandle(ref, () => ({
    clearData: () => {},
    setCurrentData: ({ data }) => {
      const xValue = roundAndGetSignificantDigitString({ n: data.x });
      xElRef.current.innerText = `${xValue}(${X_DEFAULT_UNIT})`;
      yElRef.current.innerText = `${data.y}(${axisRef.current.yUnit || ""})`;
    },
    setChartData: ({ xUnit, yUnit, chartData = [] }) => {
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
        //Customize chart options
        animation: false,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
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
        },
      },
      plugins: [chartJsPlugin],
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
        break;
      case INTERPOLATE_OPTION:
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
