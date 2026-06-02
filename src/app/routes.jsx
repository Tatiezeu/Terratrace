import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import LandingPage from "./App";
import AppLayout from "./components/layouts/AppLayout";
import ErrorPage from "../pages/ErrorPage";
import LoginPage from "../pages/LoginPage";
import RegistrationPage from "../pages/RegistrationPage";
import EmailVerificationPage from "../pages/EmailVerificationPage";
import ActivateAccountPage from "../pages/ActivateAccountPage";
import { Skeleton } from "./components/ui/skeleton";

// Premium Skeleton Dashboard Fallback Component
const SkeletonDashboard = () => (
  <div className="space-y-8 p-6 animate-pulse w-full max-w-7xl mx-auto font-['Montserrat']">
    {/* Title Section */}
    <div className="flex justify-between items-center pb-4 border-b border-white/10">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 rounded-xl bg-gray-200 dark:bg-white/10" />
        <Skeleton className="h-4 w-64 rounded-xl bg-gray-100 dark:bg-white/5" />
      </div>
      <Skeleton className="h-10 w-32 rounded-xl bg-gray-200 dark:bg-white/10" />
    </div>

    {/* Stat Card Grid */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="border border-gray-100 dark:border-white/10 rounded-2xl p-5 space-y-4 bg-white/60 dark:bg-white/5">
          <Skeleton className="h-10 w-10 rounded-xl bg-gray-200 dark:bg-white/10" />
          <Skeleton className="h-6 w-24 rounded-lg bg-gray-200 dark:bg-white/10" />
          <Skeleton className="h-4 w-32 rounded-lg bg-gray-100 dark:bg-white/5" />
        </div>
      ))}
    </div>

    {/* Main Content Sections */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 border border-gray-100 dark:border-white/10 rounded-2xl p-6 space-y-6 bg-white/60 dark:bg-white/5">
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-36 rounded-lg bg-gray-200 dark:bg-white/10" />
          <Skeleton className="h-8 w-20 rounded-lg bg-gray-100 dark:bg-white/5" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-white/5">
              <div className="space-y-2">
                <Skeleton className="h-5 w-40 rounded-md bg-gray-200 dark:bg-white/10" />
                <Skeleton className="h-3.5 w-24 rounded-md bg-gray-100 dark:bg-white/5" />
              </div>
              <Skeleton className="h-7 w-16 rounded-full bg-gray-200 dark:bg-white/10" />
            </div>
          ))}
        </div>
      </div>
      <div className="border border-gray-100 dark:border-white/10 rounded-2xl p-6 space-y-6 bg-white/60 dark:bg-white/5">
        <Skeleton className="h-6 w-32 rounded-lg bg-gray-200 dark:bg-white/10" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 items-center">
              <Skeleton className="h-10 w-10 rounded-full bg-gray-200 dark:bg-white/10 shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-full rounded-md bg-gray-200 dark:bg-white/10" />
                <Skeleton className="h-3 w-2/3 rounded-md bg-gray-100 dark:bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Helper function to wrap with Suspense
const withSuspense = (Component) => {
  const Wrapped = (props) => (
    <Suspense fallback={<SkeletonDashboard />}>
      <Component {...props} />
    </Suspense>
  );
  Wrapped.displayName = `withSuspense(${Component.displayName || Component.name || 'Component'})`;
  return Wrapped;
};

// Lazy loaded page components
const ClientDashboard = withSuspense(lazy(() => import("../pages/ClientDashboard")));
const LandPlotsPage = withSuspense(lazy(() => import("../pages/LandPlotsPage")));
const MyLandPlotsPage = withSuspense(lazy(() => import("../pages/MyLandPlotsPage")));
const LRODashboard = withSuspense(lazy(() => import("../pages/LRODashboard")));
const NotaryDashboard = withSuspense(lazy(() => import("../pages/NotaryDashboard")));
const SuperAdminDashboard = withSuspense(lazy(() => import("../pages/SuperAdminDashboard")));
const NoticeBoardPage = withSuspense(lazy(() => import("../pages/NoticeBoardPage")));
const ProfilePage = withSuspense(lazy(() => import("../pages/ProfilePage")));
const NotificationsPage = withSuspense(lazy(() => import("../pages/NotificationsPage")));
const SettingsPage = withSuspense(lazy(() => import("../pages/SettingsPage")));
const ApplicationTracking = withSuspense(lazy(() => import("../pages/ApplicationTracking")));
const ResetPasswordPage = withSuspense(lazy(() => import("../pages/ResetPasswordPage")));

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
    path: "/activate",
    Component: ActivateAccountPage,
    errorElement: <ErrorPage />,
  },
  {
    path: "/reset-password",
    Component: ResetPasswordPage,
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
      { path: "applications", Component: ApplicationTracking },
    ],
  },
]);
