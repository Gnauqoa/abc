
import HomePage from '../pages/home.jsx';

var routes = [
  {
    path: '/',
    component: HomePage,
  },
  {
    path: '(.*)',
    component: HomePage,
  },
];

export default routes;
