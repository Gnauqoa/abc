import "./chart.scss";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { Page, Link, Navbar, NavTitle, NavLeft, Block, f7ready } from "framework7-react";
import LineChart from "../../components/charts/line_chart";

const log = (text, data) => {
    let debug = true;
    if (debug) {
        console.log(text);
        if (data) {
            console.dir(data);
        }
    }
}
// const defaultDataRun = {
//     labelList: ["100", "600", "1100", "1600", "2100"],
//     dataList: [86, 67, 91, 10, 1]
// };
const defaultDataRun = {
    labelList: ["1"],
    dataList: [1]
};
export default (props) => {

    log("chart props", props);
    const { f7router, id: activityId } = props;
    log("activity id", activityId);

    const [firstDataRunState, setFirstDataRunState] = useState({
        labelList: [],
        dataList: []
    });

    const goBackCallback = useCallback(() => {
        f7router.back()
    }, []);

    useEffect(() => {
        /**Simulate data */
        let testSimInterval;
        f7ready((f7) => {
            let startTick = Date.now();
           
            testSimInterval = setInterval(() => {
                let currentTick = Date.now();
                setFirstDataRunState((prevState) => {
                    log("previous chart state", prevState)
                    const newState = {
                        labelList: prevState.labelList,
                        dataList: prevState.dataList
                    };

                    const labelNum = currentTick - startTick,
                        dataValue = Math.floor(Math.random() * 100).toFixed(0);

                    newState.labelList.push(labelNum + "");
                    newState.dataList.push(dataValue);

                    log("finished setting state");
                    return newState;
                });
            }, 500);
        });

        return () => {
            clearInterval(testSimInterval);
            log("chart page is cleaned up");
        }
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
                <LineChart dataList={firstDataRunState.dataList} labelList={firstDataRunState.labelList} />
            </Block>
        </Page>
    )
}