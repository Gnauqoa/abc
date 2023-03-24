import React, { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import "./line_chart.scss";
import Chart from "chart.js/auto";
const log = (text, data) => {
    let debug = true;
    if (debug) {
        console.log(text);
        if (data) {
            console.dir(data);
        }
    }
}
const chartJsPlugin = {
    afterDraw: (chart, args, options) => {
        log("after chart draw");
        const { ctx } = chart;
        let xAxis = chart.scales['x'];
        let yAxis = chart.scales['y'];
        let maxValue = Math.max(...chart.data.datasets[0].data);
        let minValue = Math.min(...chart.data.datasets[0].data);
        if(chart.data.datasets.length > 0) {
            const dataset = chart.data.datasets[chart.data.datasets.length - 1];
            if(dataset.data.length > 0) {
                const data = dataset.data[dataset.data.length - 1];
                log("draw last data", data);
                ctx.save();
                ctx.textAlign = 'center';
                ctx.font = '14px Arial';
                ctx.fillStyle = '#000000';
                ctx.textAlign = 'left';
                ctx.fillText(`x=${data.x} y=${data.y}`, xAxis.left + 5, yAxis.top + 5);
                
                //ctx.fillText('Dagens laveste temperatur = ' + minValue + 'Â°C', xAxis.left + 5, yAxis.top + 18);
                ctx.restore();
            }
            
        }
        
    }
}
const buildChartData = ({
    dataList = [],
    labelList = [],
    legend = ""
}) => {
    const data = {
        //Bring in data
        labels: labelList,
        datasets: [
            {
                label: legend,
                data: dataList,
            }
        ]
    }
    return data;
}

const checkDataChangeAndUpdate = ({
    currentDataListRef,
    currentLabelListRef,
    newDataList,
    newLabelList
}) => {
    const result = {
        isUpdated: false,
        newDataItemList: [],
        newLabelItemList: []
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
}

const createChartDataParam = () => {
    return {
        //Bring in data
        labels: [],
        datasets: [
            {
                yAxisID: "y",
                label: "",
                data: [],
            }
        ]
    };
}
/**
 * 
 * @param {{chartData: Array.<{name: string, data: Array<{x, y}>}>}} param0 
 */
const createChartJsData = ({
    chartData = []
}) => {
    let chartDataParam = {
        //Bring in data
        labels: [],
        datasets: [
            {
                label: "",
                data: [],
            }
        ]
    };

    chartDataParam.datasets = [];

    chartData.forEach((s, index) => {
        const dataList = [], labelList = [];
        s.data.forEach(d => {
            //dataList.push(d.y);
            //labelList.push(d.x);
            dataList.push({
                x: d.x,
                y: d.y
            });
        });
        chartDataParam.datasets.push({
            label: s.name,
            data: dataList
        });

    });

    return chartDataParam;
}
/**
 * var chartData = {
  datasets: [
    {
    label: 'Dataset 1',
    yAxisID: 'YLEFT',
    data: [
      {
        x: 10,
        y: 15
      },
      {
        x: 15,
        y: 25
      },
            {
        x: 55,
        y: 8
      }
    ],
    borderColor: "#6fbf3b",
    backgroundColor: '#6fbf3b',
    fill: false,
    borderWidth: 4
  },
  {
    yAxisID: 'YRIGHT',
    data: [
      {
        x: 15,
        y: 15
      },
      {
        x: 25,
        y: 23
      },
            {
        x: 65,
        y: 8
      }
    ],
    label: 'Dataset 2 (' + 3 + ')',
    borderColor: "#2a97f6",
    fill: false,
    borderWidth: 4
  }
 ]
};
 * 
 */

/**
 * data: [{
 * name:string,
 * data: {
 * x: 0,
 * y:0
 * }
 * }]
 * 
 */
const updateChart = ({
    chartInstance,
    data,
    xUnit,
    yUnit,
    maxHz
}) => {
    log("chart instance", chartInstance);
    log("chart instance data", chartInstance.data);
    // newDataItemList.forEach(item => {
    //     chartInstance.data.datasets[0].data.push(item);
    // });

    // newLabelItemList.forEach(item => {
    //     chartInstance.data.labels.push(item);
    // });
    // data.forEach((d, index) => {
    //     chartInstance.data.datasets[0].data

    // });
    // const currentChartDataLength = chartInstance.data.datasets[0].data.length;
    // for (let i = 0; i < currentChartDataLength; i++) {
    //     const element = array[i];

    // }

    chartInstance.data = createChartJsData({
        chartData: data
    });
    chartInstance.options = {
        //Customize chart options
        animation: false,
        scales: {
            y: {
                title: {
                    color: 'orange',
                    display: true,
                    text: yUnit
                }
            },
            x: {
                type: 'linear',
                ticks: {
                    // forces step size to be 50 units
                    stepSize: ((1/maxHz)*1000).toFixed(0)
                },
                title: {
                    color: 'orange',
                    display: true,
                    text: xUnit,
                    align: "end"
                }
            }
        }
    };

    chartInstance.update();
}
const findDataSeries = ({
    charData = [],
    name
}) => {
    const existingSeries = charData.find(d => d.name == name);
    return existingSeries;
}
const addOrUpdateChart = ({
    currentDataListRef,
    chartInstanceRef,
    dataSeries
}) => {
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
        index: 0
    });
}

let LineChart = (props, ref) => {
    log("line chart render");
    const { dataList, labelList } = props;
    const chartEl = useRef(),
        chartInstanceRef = useRef();

    let currentDataListRef = useRef([]),
        currentLabelListRef = useRef([]),
        checkDataResult;


    log("chart instance ref at constructor", chartInstanceRef.current);

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
        clearData: () => {

        },
        setChartData: ({
            sensorId,
            xUnit,
            yUnit,
            maxHz,
            chartData = []
        }) => {
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
                maxHz
            });
        },
        addOrUpdateChart: ({
            name,
            data = []
        }) => {
            /**
             * name: "run1"
             * data: [{x,y}, ...]
             */
            addOrUpdateChart({
                currentDataListRef,
                chartInstanceRef,
                dataSeries: {
                    name,
                    data
                }
            });

        }
    }));
    useEffect(() => {
        const data = createChartJsData({
            chartData: [{
                name: "",
                data: []
            }]
        });
        //const myChartRef = chartEl.current.getContext("2d");
        chartInstanceRef.current = new Chart(chartEl.current, {
            type: "line",
            data: data,
            options: {
                //Customize chart options
                animation: false
            },
            plugins: [chartJsPlugin]
        });

    }, []);

    return (
        <div className="line-chart-wapper">
            <canvas
                ref={chartEl}
            />
        </div>
    )
}

LineChart = forwardRef(LineChart);
export default LineChart;