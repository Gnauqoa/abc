import EdlHome from "../pages/home";
import EdlLayout from "../pages/layout";
import EdlActivity from "../pages/activity";

var routes = [
  {
    path: "/",
    component: EdlHome,
  },
  {
    path: "(.*)",
    component: EdlHome,
  },
];

export default routes;
