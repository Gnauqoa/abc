import React, { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import "./line_chart.scss";
import Chart from "chart.js/auto";
import zoomPlugin from "chartjs-plugin-zoom";

Chart.register(zoomPlugin);

import SensorSelector from "../sensor-selector";

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
    });
    chartDataParam.datasets.push({
      label: s.name,
      data: dataList,
    });
  });

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

const calculateSuggestMaxX = ({ chartData, pageStep = 15000 }) => {
  const maxX = getMaxX({
      chartData,
    }),
    numOfPage = Math.ceil(maxX / pageStep);

  return pageStep * numOfPage;
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
const updateChart = ({ chartInstance, data, xUnit, yUnit, maxHz }) => {
  const pageStep = 30000;
  let suggestedMaxX = calculateSuggestMaxX({
      chartData: data,
      pageStep,
    }), stepSize;
  
  if(!suggestedMaxX) {
    suggestedMaxX = pageStep;
  }

  stepSize = Math.round(suggestedMaxX / 10)

  chartInstance.data = createChartJsData({
    chartData: data,
  });

  chartInstance.options.animation = false;

  chartInstance.options.scales = {
    y: {
      min: 0,
      title: {
        color: "orange",
        display: true,
        text: yUnit,
      },
    },
    x: {
      type: "linear",
      suggestedMin : 0,
      suggestedMax: suggestedMaxX,
      ticks: {
        // forces step size to be 50 units
        //stepSize: ((1 / maxHz) * 1000).toFixed(0),
        //stepSize: stepSize
      },
      title: {
        color: "orange",
        display: true,
        text: xUnit,
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

let LineChart = (props, ref) => {
  const { widget, handleSensorChange } = props;
  //log("widget:", widget);
  //const { dataList, labelList } = props;
  const chartEl = useRef(),
    chartInstanceRef = useRef();

  let currentDataListRef = useRef([]),
    currentLabelListRef = useRef([]),
    lastDataRef = useRef({
      x: null,
      y: null,
    }),
    lastPositionOnChart = useRef({
      x: 0,
      y: 0
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
      xElRef.current.innerText = data.x;
      yElRef.current.innerText = data.y;
    },
    setChartData: ({ sensorId, xUnit, yUnit, maxHz, chartData = [] }) => {
      /**
       * chartData = [
       * { name, data: [{x,y}, ...]}
       * ]
       */

      updateChart({
        chartInstance: chartInstanceRef.current,
        data: chartData,
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
      xUnit: "ms",
      yUnit: ""
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
          <div className="value-container">x = &nbsp;<span ref={xElRef}></span></div>
          <div className="value-container">y = &nbsp;<span ref={yElRef}></span></div>
        </div>
      </div>
    </div>
  );
};

LineChart = forwardRef(LineChart);
export default LineChart;
