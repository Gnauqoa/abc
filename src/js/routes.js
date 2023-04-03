import EdlHome from "../pages/home";
import EdlLayout from "../pages/layout";
import EdlActivity from "../pages/activity";

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
    component: EdlActivity,
  },
  {
    path: "/edl/:id",
    component: EdlActivity,
  },
  {
    path: "(.*)",
    component: EdlHome,
  },
];

export default routes;
