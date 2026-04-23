import { createBrowserRouter } from "react-router-dom";
import LandingPage from "./App";
import AppLayout from "./components/layouts/AppLayout";
import ClientDashboard from "../pages/ClientDashboard";
import LandPlotsPage from "../pages/LandPlotsPage";
import MyLandPlotsPage from "../pages/MyLandPlotsPage";
import LRODashboard from "../pages/LRODashboard";
import NotaryDashboard from "../pages/NotaryDashboard";
import SuperAdminDashboard from "../pages/SuperAdminDashboard";
import ProfilePage from "../pages/ProfilePage";
import NotificationsPage from "../pages/NotificationsPage";
import SettingsPage from "../pages/SettingsPage";
import NoticeBoardPage from "../pages/NoticeBoardPage";
import ErrorPage from "../pages/ErrorPage";
import LoginPage from "../pages/LoginPage";
import RegistrationPage from "../pages/RegistrationPage";
import EmailVerificationPage from "../pages/EmailVerificationPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
    errorElement: <ErrorPage />,
  },
  {
    path: "/login",
    Component: LoginPage,
    errorElement: <ErrorPage />,
  },
  {
    path: "/register",
    Component: RegistrationPage,
    errorElement: <ErrorPage />,
  },
  {
    path: "/verify-email",
    Component: EmailVerificationPage,
    errorElement: <ErrorPage />,
  },
  {
    path: "/dashboard",
    Component: AppLayout,
    errorElement: <ErrorPage />,
    children: [
      { index: true, Component: ClientDashboard },
      { path: "land-plots", Component: LandPlotsPage },
      { path: "my-land-plots", Component: MyLandPlotsPage },
      { path: "lro", Component: LRODashboard },
      { path: "notary", Component: NotaryDashboard },
      { path: "admin", Component: SuperAdminDashboard },
      { path: "notices", Component: NoticeBoardPage },
      { path: "profile", Component: ProfilePage },
      { path: "notifications", Component: NotificationsPage },
      { path: "settings", Component: SettingsPage },
    ],
  },
]);
