import React, { useState, useEffect } from "react";
import {
  Page,
  Link,
  Popover,
  BlockTitle,
} from "framework7-react";

import sensors from "../services/sensor-service";
import SensorSelector from "../components/sensor-selector";
import NumberWidget from "../components/number-widget";

export default ({ f7route, f7router }) => {
  const sensorlst = sensors;
  const [count, setCount] = useState(0);

  useEffect(() => {
    setTimeout(function() { 
      if(count < 100) {
        setCount(count + 0.01);
      } else {
        setCount(0);
      }

    }.bind(this), 1)
  });

  const onChange = ({ target }) => setValue(target.value);

  return (
    <Page className="bg-color-regal-blue custom-dashboards">
      <Link popoverOpen=".popover-menu">Click me</Link>
      <NumberWidget valueSensor = { count } floatingPoint='true'></NumberWidget>
      <SensorSelector sensorList = { sensorlst }> </SensorSelector>
      <Popover className="popover-menu">
        <BlockTitle>Choose a type of sensor</BlockTitle>
      </Popover>
    </Page>
  );
};
