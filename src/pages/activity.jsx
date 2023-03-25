import React, { useRef, useState, useEffect } from "react";
import { Page, Navbar, Button, NavLeft, NavRight, f7ready } from "framework7-react";
import { v4 as uuidv4 } from "uuid";

import BackButton from "../components/back-button";
import RoundButton from "../components/round-button";
import dialog from "../components/dialog";
import storeService from "../services/store-service";
import LineChart from "../components/widgets/line_chart";

import {
  LAYOUT_CHART,
  LAYOUT_TABLE,
  LAYOUT_NUMBER,
  LAYOUT_TABLE_CHART,
  LAYOUT_NUMBER_CHART,
  LAYOUT_NUMBER_TABLE,
} from "../js/constants";

const MANUAL = "manual";
const activityService = new storeService("activity");

const useDemoChart = ({ layout, chartLayoutChartRef, dataRunRef }) => {
  useEffect(() => {
    let testSimInterval;
    if (layout == LAYOUT_CHART) {
      f7ready((f7) => {
        //dataRunRef.current.push(secondDataRunRef.current);
        dataRunRef.current.push({
          name: "run1",
          data: [],
        });
        let startTick = Date.now();

        testSimInterval = setInterval(() => {
          let currentTick = Date.now();
          const firstData = dataRunRef.current[0].data;

          const labelNum = currentTick - startTick,
            dataValue = Math.floor(Math.random() * 100).toFixed(0);

          // if(labelNum > 10000) {
          //     clearInterval(testSimInterval);
          // }
          firstData.push({
            x: labelNum,
            y: dataValue,
          });
          /*For passing realtime data to chart when it is not played*/

          chartLayoutChartRef.current.setCurrentData({
            data: {
              x: labelNum,
              y: dataValue,
            },
          });
          chartLayoutChartRef.current.setChartData({
            chartData: dataRunRef.current,
            xUnit: "ms",
            yUnit: "",
            maxHz: 10,
          });
        }, 1000);
      });
    }

    return () => {
      clearInterval(testSimInterval);
      //log("chart page is cleaned up");
    };
  }, []);
};

export default ({ f7route, f7router }) => {
  const layout = f7route.params.layout;
  let initActivity;
  if (layout) {
    initActivity = {
      id: uuidv4(),
      name: "",
      layout: layout,
      sampleMode: MANUAL,
    };
  } else {
    const id = f7route.params.id;
    initActivity = activityService.find(id);
    if (!initActivity) {
      f7router.navigate("/");
    }
  }

  const [activity, setActivity] = useState(initActivity);
  const chartLayoutChartRef = useRef(),
    dataRunRef = useRef([]);

  useDemoChart({
    layout,
    chartLayoutChartRef,
    dataRunRef,
  });

  function handleActivityNameChange(e) {
    setActivity({
      ...activity,
      name: e.target.value,
    });
  }

  function handleActivityDelete(e) {
    dialog.question(
      "Xác nhận",
      `Bạn có chắc chắn muốn xóa hoạt động này không?`,
      () => {
        activityService.delete(activity.id);
        f7router.navigate("/");
      },
      () => {}
    );
  }

  function handleActivitySave() {
    if (activity.name.length) {
      activityService.save(activity);
    } else {
      dialog.prompt(
        "Bạn có muốn lưu lại những thay đổi này không?",
        "Tên hoạt động",
        (name) => {
          const updatedActivity = {
            ...activity,
            name,
          };
          setActivity(updatedActivity);
          activityService.save(updatedActivity);
        },
        () => {},
        activity.name
      );
    }
  }

  function handleRun() {
    console.log("Run...");
  }

  return (
    <Page className="bg-color-regal-blue">
      <Navbar className="custom-dashboards-navbar">
        <NavLeft>
          <BackButton link="/" />
          <RoundButton icon="add" color="#42C63F" onClick={() => f7router.navigate("/layout")} />
          <RoundButton icon="close" color="#FF0000" onClick={handleActivityDelete} />
        </NavLeft>
        <NavRight>
          <input
            value={activity.name}
            type="text"
            name="name"
            onChange={handleActivityNameChange}
            className="activity-name"
          />
          <RoundButton icon="save" onClick={handleActivitySave} />
          <RoundButton icon="settings" />
        </NavRight>
      </Navbar>
      <div className="page-content display-flex justify-content-center align-items-center">
        {layout == LAYOUT_CHART ? <LineChart ref={chartLayoutChartRef} /> : null}

        <RoundButton icon="play_arrow" color="#45A3DB" onClick={handleRun} />
      </div>
    </Page>
  );
};