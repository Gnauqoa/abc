import React, { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import "./line_chart.scss";
import Chart from "chart.js/auto";
import zoomPlugin from "chartjs-plugin-zoom";
import $ from "jquery";

Chart.register(zoomPlugin);

import SensorSelector from "../popup-sensor-selector";
import SensorServices from "../../../services/sensor-service";

const defaultXUnit = "s",
  roundX = 3;
const roundXValue = (value) => {
  return Math.round(value * Math.pow(10, roundX)) / Math.pow(10, roundX);
};
const log = (text, data) => {
  let debug = true;
  if (debug) {
    console.log(text);
    if (data) {
      console.dir(data);
    }
  }
};
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
      // if (dataIndex == 2) {
      //   dataList.push({
      //     x: d.x - firstPoint.x,
      //     y: d.y,
      //   });
      // }
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

const getMaxX = ({ chartData }) => {
  let max = 0;
  chartData.forEach((s) => {
    if (s.data.length > 0) {
      const lastData = s.data[s.data.length - 1],
        firstData = s.data[0],
        xValue = roundXValue(lastData.x - firstData.x);
      if (xValue > max) {
        max = xValue;
      }
    }
  });

  return max;
};

const calculateSuggestMaxX = ({ chartData, pageStep, firstPageStep }) => {
  const maxX = getMaxX({
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
  const pageStep = 5,
    firstPageStep = 10;
  let suggestedMaxX = calculateSuggestMaxX({
      chartData: data,
      pageStep,
      firstPageStep,
    }),
    stepSize;

  if (!suggestedMaxX) {
    suggestedMaxX = pageStep;
  }

  stepSize = suggestedMaxX / 10;

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
        //text: axisRef.current.xUnit,
        text: `(${defaultXUnit})`,
        align: "end",
      },
    },
  };
  if (stepSize) {
    //log("chart step size", stepSize);
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
          innerHtml += `<tr><td>x=${xValue}(${defaultXUnit})</td></tr>`;
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

let LineChart = (props, ref) => {
  const { widget, handleSensorChange } = props;
  const { sensor } = widget;
  const chartEl = useRef(),
    chartInstanceRef = useRef(),
    sensorRef = useRef({}),
    axisRef = useRef({
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

  let valueContainerElRef = useRef(),
    xElRef = useRef(),
    yElRef = useRef();

  useImperativeHandle(ref, () => ({
    clearData: () => {},
    setCurrentData: ({ data }) => {
      const xValue = roundAndGetSignificantDigitString({ n: data.x });
      xElRef.current.innerText = `${xValue}(${defaultXUnit})`;
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
              x: { min: 0 },
              y: { min: 0 },
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
      xUnit: defaultXUnit,
      yUnit: "",
    });
  }, []);

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
        <canvas ref={chartEl} />
        <div className="current-value-sec" ref={valueContainerElRef}>
          <div className="value-container">
            x=<span ref={xElRef}></span>
          </div>
          <div className="value-container">
            y=<span ref={yElRef}></span>
          </div>
        </div>
      </div>
    </div>
  );
};

LineChart = forwardRef(LineChart);
export default LineChart;
