import React, { useEffect, useState } from "react";
import { std, mean, max, min } from "mathjs";
import { PAGE_SETTINGS } from "../../../utils/widget-table-utils";
import "./index.scss";

const SUMMARIZE_COUNT_TYPE = 0;
const SUMMARIZE_MIN_TYPE = 1;
const SUMMARIZE_MAX_TYPE = 2;
const SUMMARIZE_MEAN_TYPE = 3;
const SUMMARIZE_STD_TYPE = 4;

const SUMMARIZE_OPTIONS = [
  SUMMARIZE_COUNT_TYPE,
  SUMMARIZE_MIN_TYPE,
  SUMMARIZE_MAX_TYPE,
  SUMMARIZE_MEAN_TYPE,
  SUMMARIZE_STD_TYPE,
];

const SUMMARIZE_OPTIONS_CONFIG = {
  [SUMMARIZE_COUNT_TYPE]: {
    label: "Đếm",
    formula: (datas, sensors) => {
      const result = datas.map((dataRuns, dataRunIndex) => {
        if (!Array.isArray(dataRuns) || dataRuns.length === 0) return 0;

        const dataIndex = sensors[dataRunIndex]?.index;
        if (dataIndex === undefined) {
          return 0;
        }

        return dataRuns.filter((dataRunData) => {
          const sensorData = dataRunData.values?.[dataIndex];
          return !Number.isNaN(Number(sensorData));
        }).length;
      });
      return result;
    },
  },

  [SUMMARIZE_MIN_TYPE]: {
    label: "Min",
    formula: (datas, sensors) => {
      const result = datas.map((dataRuns, dataRunIndex) => {
        if (!Array.isArray(dataRuns) || dataRuns.length === 0) return 0;

        const dataIndex = sensors[dataRunIndex]?.index;
        if (dataIndex === undefined) {
          return 0;
        }

        const arrayData = dataRuns
          .map((dataRunData) => {
            const sensorData = dataRunData.values?.[dataIndex];
            const parsedSensorData = Number(sensorData);
            if (!Number.isNaN(parsedSensorData)) return parsedSensorData;
            return false;
          })
          .filter(Boolean);

        return min(...arrayData);
      });
      return result;
    },
  },

  [SUMMARIZE_MAX_TYPE]: {
    label: "Max",
    formula: (datas, sensors) => {
      const result = datas.map((dataRuns, dataRunIndex) => {
        if (!Array.isArray(dataRuns) || dataRuns.length === 0) return 0;

        const dataIndex = sensors[dataRunIndex]?.index;
        if (dataIndex === undefined) {
          return 0;
        }

        const arrayData = dataRuns
          .map((dataRunData) => {
            const sensorData = dataRunData.values?.[dataIndex];
            const parsedSensorData = Number(sensorData);
            if (!Number.isNaN(parsedSensorData)) return parsedSensorData;
            return false;
          })
          .filter(Boolean);

        return max(0, ...arrayData);
      });
      return result;
    },
  },

  [SUMMARIZE_MEAN_TYPE]: {
    label: "Mean",
    formula: (datas, sensors) => {
      const result = datas.map((dataRuns, dataRunIndex) => {
        if (!Array.isArray(dataRuns) || dataRuns.length === 0) return 0;

        const dataIndex = sensors[dataRunIndex]?.index;
        if (dataIndex === undefined) {
          return 0;
        }

        const arrayData = dataRuns
          .map((dataRunData) => {
            const sensorData = dataRunData.values?.[dataIndex];
            const parsedSensorData = Number(sensorData);
            if (!Number.isNaN(parsedSensorData)) return parsedSensorData;
            return false;
          })
          .filter(Boolean);

        return mean(arrayData).toFixed(2);
      });
      return result;
    },
  },

  [SUMMARIZE_STD_TYPE]: {
    label: "σ",
    formula: (datas, sensors) => {
      const result = datas.map((dataRuns, dataRunIndex) => {
        if (!Array.isArray(dataRuns) || dataRuns.length === 0) return 0;

        const dataIndex = sensors[dataRunIndex]?.index;
        if (dataIndex === undefined) {
          return 0;
        }

        const arrayData = dataRuns
          .map((dataRunData) => {
            const sensorData = dataRunData.values?.[dataIndex];
            const parsedSensorData = Number(sensorData);
            if (!Number.isNaN(parsedSensorData)) return parsedSensorData;
            return false;
          })
          .filter(Boolean);

        return std(arrayData).toFixed(2);
      });
      return result;
    },
  },
};

const SummarizedTable = ({ chartLayout, datas, sensors }) => {
  const [summarizeRows, setSummarizeRows] = useState([[]]);
  useEffect(() => {
    const summarizeRows = [];
    for (const type of SUMMARIZE_OPTIONS) {
      const label = SUMMARIZE_OPTIONS_CONFIG[type]?.label;

      let result;
      if (!Array.isArray(datas) || datas.length === 0) result = [0];
      else result = SUMMARIZE_OPTIONS_CONFIG[type]?.formula?.(datas, sensors);

      result !== undefined && summarizeRows.push([label, ...result]);
    }

    setSummarizeRows(summarizeRows);
  }, [datas]);
  return (
    <div className="wapper__chart summarize">
      <table className="wapper__chart__table">
        <tbody className="wapper__chart__table__body">
          {summarizeRows.map((row, rowIndex) => {
            const rowData = row.map((column, columnIndex) => (
              <td key={`summarize-row-${rowIndex}-${columnIndex}`} style={PAGE_SETTINGS[chartLayout]["td"]}>
                <span className="span-value">{column}</span>
              </td>
            ));
            return <tr key={`summarize-row-${rowIndex}`}>{rowData}</tr>;
          })}
        </tbody>
      </table>
    </div>
  );
};

export default SummarizedTable;
