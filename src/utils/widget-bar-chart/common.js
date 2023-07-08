import chartUtils from "../chartjs-utils";

import DataManagerIST from "../../services/data-manager";
import SensorServicesIST from "../../services/sensor-service";
import { FIRST_COLUMN_DEFAULT_OPT } from "../widget-table-chart/commons";
import { dataset } from "dom7";

const sampleLabels = chartUtils.months({ count: 7 });
const sampleData = {
  labels: sampleLabels,
  datasets: [
    {
      label: "Dataset 1",
      data: sampleLabels.map(() => {
        return chartUtils.rand(-100, 100);
      }),
      backgroundColor: chartUtils.CHART_COLORS.red,
    },
    {
      label: "Dataset 2",
      data: [1],
      backgroundColor: chartUtils.CHART_COLORS.blue,
    },
    {
      label: "Dataset 3",
      data: [4],
      backgroundColor: chartUtils.CHART_COLORS.green,
    },
  ],
};

export const getBarChartDatas = ({ sensor, unitId }) => {
  const result = {
    labels: [],
    datasets: [],
  };

  const isDefaultXAxis = [FIRST_COLUMN_DEFAULT_OPT].includes(unitId);
  const userInput = DataManagerIST.getUseInputCustomUnit({ unitId });
  const sensorInfo = SensorServicesIST.getSensorInfo(sensor.id);
  if (!sensorInfo) {
    return [];
  }

  let dataRunPreviews = DataManagerIST.getActivityDataRunPreview();
  for (let chartDataIndex = 0; chartDataIndex < dataRunPreviews.length; chartDataIndex++) {
    const dataRunPreview = dataRunPreviews[chartDataIndex];
    const data = [];
    const label = [];
    const chartData = DataManagerIST.getWidgetDatasRunData(dataRunPreview.id, [sensor.id])[0] || [];
    const numDataPoints = isDefaultXAxis ? chartData.length : Math.min(chartData.length, userInput.length);

    let numEmptyInput;

    for (let index = 0; index < numDataPoints; index++) {
      const d = chartData[index];
      let xValue;
      const yValue = d.values[sensor.index] || "";
      if (isDefaultXAxis) xValue = d.time;
      else {
        // This code make the difference xValue when user inputs type ""
        const input = userInput[index] || "";
        if (input !== "") xValue = input;
        else {
          numEmptyInput += 1;
          xValue = input + " ".repeat(numEmptyInput);
        }
      }

      label.push(xValue);
      data.push({
        x: xValue,
        y: yValue,
      });
    }

    const dataset = {
      label: dataRunPreview.name,
      data: data,
      backgroundColor: chartUtils.namedColor(chartDataIndex),
      maxBarThickness: 60,
    };

    if (label.length > result.labels.length) {
      result.labels = label;
    }
    result.datasets.push(dataset);
  }
  return result;
};
