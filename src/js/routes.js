import Landing from "../pages/landing";
import EdlHome from "../pages/edl/home";

var routes = [
  {
    path: "/",
    component: Landing,
  },
  {
    path: "/edl",
    component: EdlHome,
  },
  {
    path: "/edl/:id",
    component: EdlHome,
  },
  {
    path: "(.*)",
    component: Landing,
  },
];

export default routes;
