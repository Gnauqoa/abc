import EdlHome from "../pages/home";
import EdlLayout from "../pages/layout";
import General from "../pages/general/prcm";

var routes = [
  {
    path: "/",
    component: EdlHome,
  },
  {
    path: "/general/prcm",
    component: General,
  },
  {
    path: '/general/(.*)',
    component: General,
  },
  {
    path: "(.*)",
    component: EdlHome,
  },
];

export default routes;
