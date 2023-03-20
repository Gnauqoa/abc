import React, { useEffect, useRef, useref } from "react";
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
const updateChart = ({
    chartInstance,
    newDataItemList,
    newLabelItemList
}) => {
    log("chart instance", chartInstance);
    log("chart instance data", chartInstance.data);
    newDataItemList.forEach(item => {
        chartInstance.data.datasets[0].data.push(item);
    });

    newLabelItemList.forEach(item => {
        chartInstance.data.labels.push(item);
    });


    chartInstance.update();
}

export default (props) => {
    log("line chart render");
    const { dataList, labelList } = props;
    const chartEl = useRef(),
        chartInstanceRef = useRef();

    let currentDataListRef = useRef([]),
        currentLabelListRef = useRef([]),
        checkDataResult;


        log("chart instance ref at constructor", chartInstanceRef.current);

    checkDataResult = checkDataChangeAndUpdate({
        currentDataListRef,
        currentLabelListRef,
        newDataList: dataList,
        newLabelList: labelList
    });
    if (checkDataResult.isUpdated && chartInstanceRef.current) {
        updateChart({
            chartInstance: chartInstanceRef.current,
            newDataItemList: checkDataResult.newDataItemList,
            newLabelItemList: checkDataResult.newLabelItemList
        });
    }
    useEffect(() => {
        const data = buildChartData({
            dataList: currentDataListRef.current,
            labelList: currentLabelListRef.current
        });
        //const myChartRef = chartEl.current.getContext("2d");
        chartInstanceRef.current = new Chart(chartEl.current, {
            type: "line",
            data: data,
            options: {
                //Customize chart options
            }
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