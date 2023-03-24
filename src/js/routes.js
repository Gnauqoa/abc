import EdlHome from "../pages/home";
import EdlLayout from "../pages/layout";
import EdlActivity from "../pages/activity";
import Chart from "../pages/chart_demo/chart";

var routes = [
  {
    path: "/",
    component: EdlHome,
  },
  {
    path: "/layout",
    component: EdlLayout,
  },
  {
    path: "/layout/:layout",
    component: EdlActivity,
  },
  {
    path: "/edl",
    component: EdlHome,
  },
  {
    path: "/edl/:id",
    component: EdlActivity,
  },
  {
    path: "/chart_test",
    component: Chart,
  },

  {
    path: "(.*)",
    component: EdlHome,
  },
];

export default routes;
