import { createBrowserRouter } from "react-router-dom";
import Home from "../pages/home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import Catalog from "../pages/Catalog";
import Profile from "../pages/Profile";
import Settings from "../pages/Settings";
import Help from "../pages/Help";
import UploadVideo from "../pages/UploadVideo";
import Recommendations from "../pages/Recommendations";
import Dashboard from "../admin/Dashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/catalog",
    element: <Catalog />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/reset-password/:uid/:token",
    element: <ResetPassword />,
  },
  {
    path: "/profile",
    element: <Profile />,
  },
  {
    path: "/settings",
    element: <Settings />,
  },
  {
    path: "/help",
    element: <Help />,
  },
  {
    path: "/upload",
    element: <UploadVideo />,
  },
  {
    path: "/recommendations",
    element: <Recommendations />,
  },
  {
    path: "/admin",
    element: <Dashboard />,
  },
]);
