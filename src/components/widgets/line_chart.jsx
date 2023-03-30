import React, { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import "./line_chart.scss";
import Chart from "chart.js/auto";
import zoomPlugin from "chartjs-plugin-zoom";
import $ from "jquery";

Chart.register(zoomPlugin);

import SensorSelector from "../sensor-selector";
import sensorList from "../../services/sensor-service";

const defaultXUnit = "ms";
const log = (text, data) => {
  let debug = true;
  if (debug) {
    console.log(text);
    if (data) {
      console.dir(data);
    }
  }
};
const getChartJsPlugin = ({ lastDataRef, valueLabelContainerRef }) => {
  return {
    afterDraw: (chart, args, options) => {
      const { ctx } = chart;
      let xAxis = chart.scales["x"];
      let yAxis = chart.scales["y"];

      // lastPosition.current = {
      //   x: xAxis.left,
      //   y: yAxis.top
      // };
      const data = lastDataRef.current;
      valueLabelContainerRef.current.style.top = `${yAxis.top + 5}px`;
      valueLabelContainerRef.current.style.left = `${xAxis.left + 5}px`;
      ctx.save();
      // ctx.textAlign = "center";
      // ctx.font = "16px Arial";
      // ctx.fillStyle = "#000000";
      // ctx.textAlign = "left";
      // ctx.fillText(`x=${data.x || 0} y=${data.y || 0}`, xAxis.left + 5, yAxis.top + 5);

      ctx.restore();
    },
  };
};
const buildChartData = ({ dataList = [], labelList = [], legend = "" }) => {
  const data = {
    //Bring in data
    labels: labelList,
    datasets: [
      {
        label: legend,
        data: dataList,
      },
    ],
  };
  return data;
};

const checkDataChangeAndUpdate = ({ currentDataListRef, currentLabelListRef, newDataList, newLabelList }) => {
  const result = {
    isUpdated: false,
    newDataItemList: [],
    newLabelItemList: [],
  };
  if (newDataList && newLabelList) {
    if (newDataList.length == 0 && newLabelList.length == 0) {
      result.isUpdated = true;
      currentDataListRef.current = [];
      currentLabelListRef.current = [];
    } else if (newDataList.length > currentDataListRef.current.length) {
      for (let index = currentDataListRef.current.length; index < newDataList.length; index++) {
        const data = newDataList[index],
          label = newLabelList[index];
        currentDataListRef.current.push(data);
        result.newDataItemList.push(data);
        currentLabelListRef.current.push(label);
        result.newLabelItemList.push(label);
      }

      result.isUpdated = true;
    }
  }

  return result;
};

const createChartDataParam = () => {
  return {
    //Bring in data
    labels: [],
    datasets: [
      {
        yAxisID: "y",
        label: "",
        data: [],
      },
    ],
  };
};
/**
 *
 * @param {{chartData: Array.<{name: string, data: Array<{x, y}>}>}} param0
 */
const createChartJsData = ({ chartData = [] }) => {
  let chartDataParam = {
    //Bring in data
    labels: [],
    datasets: [
      {
        label: "",
        data: [],
      },
    ],
  };

  chartDataParam.datasets = [];

  chartData.forEach((s, index) => {
    const dataList = [];
    let firstPoint = null;

    s.data.forEach((d, dataIndex) => {
      if (dataIndex == 0) {
        const firstData = s.data[0];
        firstPoint = {
          x: firstData.x,
          y: firstData.y,
        };
      }
      dataList.push({
        x: d.x - firstPoint.x,
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
        xValue = lastData.x - firstData.x;
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
const updateChart = ({ chartInstance, data, axisRef, maxHz }) => {
  const pageStep = 5000, firstPageStep = 10000;
  let suggestedMaxX = calculateSuggestMaxX({
      chartData: data,
      pageStep,
      firstPageStep
    }),
    stepSize;

  if (!suggestedMaxX) {
    suggestedMaxX = pageStep;
  }

  stepSize = Math.round(suggestedMaxX / 10);

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
const findDataSeries = ({ charData = [], name }) => {
  const existingSeries = charData.find((d) => d.name == name);
  return existingSeries;
};
const addOrUpdateChart = ({ currentDataListRef, chartInstanceRef, dataSeries }) => {
  /**
   * name: "run1"
   * data: [{x,y}, ...]
   */
  // let existingDataSeries = findDataSeries({
  //     charData: currentDataListRef.current,
  //     name: dataSeries.name
  // });
  // if(existingDataSeries) {

  // } else {
  //     currentDataListRef.current.push();
  // }
  //currentDataListRef.current
  // currentDataListRef.current.push({
  //     name,
  //     data
  // });
  updateChart({
    chartInstance: chartInstanceRef.current,
    data: dataSeries.data,
    index: 0,
  });
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
      const titleLines = tooltipModel.title || [];
      const bodyLines = tooltipModel.body.map(getBody);
      // const label = context.dataset.label || '',
      // xValue = context.parsed.x,
      // yValue = context.parsed.y;

      //let innerHtml = "<thead>";
      // titleLines.forEach(function (title) {
      //   innerHtml += "<tr><th>" + title + "</th></tr>";
      // });
      //innerHtml += "</thead><tbody>";

      // titleLines.forEach(function (title) {
      //   innerHtml += "<tr><th>" + title + "</th></tr>";
      // });
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

          //log("dataset background color:", colors);
          let span = "";
          span = `<tr><td><span style="${style}"></span><span>${dataSetName}</span></td></tr>`;
          innerHtml += span;
          innerHtml += `<tr><td>x=${xValue}(${axisRef.current.xUnit || defaultXUnit})</td></tr>`;
          innerHtml += `<tr><td>y=${yValue}(${axisRef.current.yUnit || ""})</td></tr>`;
        }
        // let style = "background:" + colors.backgroundColor;
        // style += "; border-color:" + colors.borderColor;
        // style += "; border-width: 2px";
        // const span = '<span style="' + style + '">' + body + "</span>";
        // innerHtml += "<tr><td>" + span + "</td></tr>";
        // innerHtml += `<tr><td>x=${xValue}</td></tr>`;
        // innerHtml += `<tr><td>y=${yValue}</td></tr>`;
        //log("tooltip body line:", body);
      });
      innerHtml += "</tbody>";

      let tableRoot = tooltipEl.querySelector("table");
      tableRoot.innerHTML = innerHtml;
    }

    const position = context.chart.canvas.getBoundingClientRect();
    //const bodyFont = Chart.helpers.toFont(tooltipModel.options.bodyFont);
    //log("tooltip body font: ", tooltipModel.options.bodyFont);
    // Display, position, and set styles for font

    const windowWidth = $(window).width();
    let suggestedX = position.left + window.pageXOffset + tooltipModel.caretX + 10,
      tooltipWidth = $(tooltipEl).outerWidth();
    if (suggestedX + tooltipWidth > windowWidth) {
      suggestedX -= tooltipWidth + 10;
    }
    //log("window width", windowWidth);

    tooltipEl.style.opacity = 1;
    tooltipEl.style.position = "absolute";
    tooltipEl.style.left = `${suggestedX}px`;
    tooltipEl.style.top = position.top + window.pageYOffset + tooltipModel.caretY + "px";
    tooltipEl.style.zIndex = 9999;
    //tooltipEl.style.font = bodyFont.string;
    tooltipEl.style.fontFamily = "Arial";
    tooltipEl.style.fontSize = "14px";
    tooltipEl.style.padding = tooltipModel.padding + "px " + tooltipModel.padding + "px";
    tooltipEl.style.pointerEvents = "none";

    //log("tooltip caret:", { cx: tooltipModel.caretX, cy: tooltipModel.caretY });
  };
};

let LineChart = (props, ref) => {
  const { widget, handleSensorChange } = props;
  //log("widget:", widget);
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
    const existingSensorData = sensorList.find((s) => s.id === sensorRef.current.id),
      sensorDetailData = existingSensorData.data[sensorRef.current.index];
    sensorRef.current.sensorDetailData = sensorDetailData;
    axisRef.current.yUnit = sensorDetailData.unit;
    axisRef.current.yMin = sensorDetailData.min;
    axisRef.current.yMax = sensorDetailData.max;
    //axisRef.current.yMax = 3;
    //log("axis ref current", axisRef.current);
  }

  let currentDataListRef = useRef([]),
    currentLabelListRef = useRef([]),
    lastDataRef = useRef({
      x: null,
      y: null,
    }),
    lastPositionOnChart = useRef({
      x: 0,
      y: 0,
    }),
    valueContainerElRef = useRef(),
    xElRef = useRef(),
    yElRef = useRef();

  // checkDataResult = checkDataChangeAndUpdate({
  //     currentDataListRef,
  //     currentLabelListRef,
  //     newDataList: dataList,
  //     newLabelList: labelList
  // });
  // if (checkDataResult.isUpdated && chartInstanceRef.current) {
  //     updateChart({
  //         chartInstance: chartInstanceRef.current,
  //         newDataItemList: checkDataResult.newDataItemList,
  //         newLabelItemList: checkDataResult.newLabelItemList
  //     });
  // }
  useImperativeHandle(ref, () => ({
    clearData: () => {},
    setCurrentData: ({ data }) => {
      //lastDataRef.current = data;
      xElRef.current.innerText = `${data.x}(${axisRef.current.xUnit || defaultXUnit})`;
      yElRef.current.innerText = `${data.y}(${axisRef.current.yUnit || ""})`;
    },
    setChartData: ({ sensorId, xUnit, yUnit, maxHz, chartData = [] }) => {
      /**
       * chartData = [
       * { name, data: [{x,y}, ...]}
       * ]
       */

      axisRef.current.xUnit = xUnit;
      updateChart({
        chartInstance: chartInstanceRef.current,
        data: chartData,
        axisRef,
        xUnit,
        yUnit,
        maxHz,
      });
    },
    addOrUpdateChart: ({ name, data = [] }) => {
      /**
       * name: "run1"
       * data: [{x,y}, ...]
       */
      addOrUpdateChart({
        currentDataListRef,
        chartInstanceRef,
        dataSeries: {
          name,
          data,
        },
      });
    },
  }));
  useEffect(() => {
    // const intervalTest = setInterval(()=>{
    //   log("label position", lastPositionOnChart.current);

    // }, 1000);
    const data = createChartJsData({
      chartData: [
        {
          name: "",
          data: [],
        },
      ],
    });
    const chartJsPlugin = getChartJsPlugin({ lastDataRef, valueLabelContainerRef: valueContainerElRef });
    //const myChartRef = chartEl.current.getContext("2d");
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
            //yAlign: "center",
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
              // onPanStart({ chart, point }) {
              //     log("on pan");
              //     const area = chart.chartArea;
              //     const w25 = area.width * 0.25;
              //     const h25 = area.height * 0.25;
              //     if (point.x < area.left + w25 || point.x > area.right - w25
              //         || point.y < area.top + h25 || point.y > area.bottom - h25) {
              //         return false; // abort
              //     }
              // },
            },
            limits: {
              // x: {min: 0, max: 200, minRange: 50},
              // y: {min: 0, max: 200, minRange: 50}
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

    // return () => {
    //   clearInterval(intervalTest);

    // };
  }, []);

  return (
    <div className="line-chart-wapper">
      <div className="sensor-select-container">
        <SensorSelector
          selectedSensor={widget.sensor}
          onChange={(sensor) => handleSensorChange(widget.id, sensor)}
        ></SensorSelector>
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
