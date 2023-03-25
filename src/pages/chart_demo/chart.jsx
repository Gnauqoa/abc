import "./chart.scss";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { Page, Link, Navbar, NavTitle, NavLeft, Block, f7ready } from "framework7-react";
import LineChart from "../../components/widgets/line_chart";

const log = (text, data) => {
  let debug = true;
  if (debug) {
    console.log(text);
    if (data) {
      console.dir(data);
    }
  }
};
// const defaultDataRun = {
//     labelList: ["100", "600", "1100", "1600", "2100"],
//     dataList: [86, 67, 91, 10, 1]
// };
const defaultDataRun = {
  labelList: ["1"],
  dataList: [1],
};
export default (props) => {
  log("chart props", props);
  const { f7router, id: activityId } = props;
  log("activity id", activityId);

  const dataRunRef = useRef([]);

  const secondDataRunRef = useRef({
    name: "run2",
    data: [
      {
        x: 50,
        y: 100,
      },
      {
        x: 100,
        y: 90,
      },
      {
        x: 150,
        y: 200,
      },
      {
        x: 200,
        y: 10,
      },
      {
        x: 250,
        y: 15,
      },
      {
        x: 1050,
        y: 100,
      },
      {
        x: 2050,
        y: 120,
      },
      {
        x: 3050,
        y: 130,
      },
    ],
  });

  const goBackCallback = useCallback(() => {
    f7router.back();
  }, []);
  const chartRef = useRef();
  useEffect(() => {
    /**Simulate data */
    let testSimInterval;
    f7ready((f7) => {
      dataRunRef.current.push(secondDataRunRef.current);
      dataRunRef.current.push({
        name: "run1",
        data: [],
      });
      let startTick = Date.now();

      testSimInterval = setInterval(() => {
        let currentTick = Date.now();

        //chartRef.current.setData(dataHere);
        const firstData = dataRunRef.current[1].data;

        const labelNum = currentTick - startTick,
          dataValue = Math.floor(Math.random() * 100).toFixed(0);

        if (labelNum > 10000) {
          clearInterval(testSimInterval);
        }

        firstData.push({
          x: labelNum,
          y: dataValue,
        });
        // dataRunRef.current[1].data = [{
        //     x: 0,
        //     y: dataValue
        // }]
        chartRef.current.setChartData({
          chartData: dataRunRef.current,
          xUnit: "ms",
          yUnit: "yUnit",
          maxHz: 10,
        });
        //newState.labelList.push(labelNum + "");
        //newState.dataList.push(dataValue);
        log("finished setting state");

        // setFirstDataRunState((prevState) => {
        //     log("previous chart state", prevState)
        //     const newState = {
        //         labelList: prevState.labelList,
        //         dataList: prevState.dataList
        //     };

        //     const labelNum = currentTick - startTick,
        //         dataValue = Math.floor(Math.random() * 100).toFixed(0);

        //     newState.labelList.push(labelNum + "");
        //     newState.dataList.push(dataValue);

        //     log("finished setting state");
        //     return newState;
        // });
      }, 100);
    });

    return () => {
      clearInterval(testSimInterval);
      log("chart page is cleaned up");
    };
  }, []);
  return (
    <Page className="bg-color-regal-blue custom-dashboards">
      <Navbar className="custom-dashboards-navbar">
        <NavLeft>
          <Link
            iconIos="material:arrow_back"
            iconMd="material:arrow_back"
            className="back-icon"
            onClick={goBackCallback}
          />
        </NavLeft>
        <NavTitle>Chart</NavTitle>
      </Navbar>

      <Block className="chart-content">
        <LineChart ref={chartRef} />
      </Block>
    </Page>
  );
};
