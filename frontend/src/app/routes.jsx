import { createBrowserRouter, Navigate } from "react-router-dom";
import { RootLayout } from "./RootLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { RoleRedirect } from "./RoleRedirect";
import { StudentDashboardLayout, RiderDashboardLayout, SellerDashboardLayout, AdminDashboardLayout } from "./DashboardLayout";
import { LandingPage } from "../features/landing/LandingPage";
import { SignInPage } from "../features/auth/SignInPage";
import { SignUpPage } from "../features/auth/SignUpPage";
import { StudentDashboard } from "../features/student/StudentDashboard";
import { ShopListPage } from "../features/student/ShopListPage";
import { ShopDetailPage } from "../features/student/ShopDetailPage";
import { CartPage } from "../features/student/CartPage";
import { CheckoutPage } from "../features/student/CheckoutPage";
import { OrderTrackingPage } from "../features/student/OrderTrackingPage";
import { StudentOrdersPage } from "../features/student/StudentOrdersPage";
import { AddressesPage } from "../features/student/AddressesPage";
import { SellerDashboard } from "../features/seller/SellerDashboard";
import { SellerShopsPage } from "../features/seller/SellerShopsPage";
import { CreateShopPage } from "../features/seller/CreateShopPage";
import { SellerMealsPage } from "../features/seller/SellerMealsPage";
import { SellerOrdersPage } from "../features/seller/SellerOrdersPage";
import { SellerFlashDealsPage } from "../features/seller/SellerFlashDealsPage";
import { RiderDashboard } from "../features/rider/RiderDashboard";
import { AdminDashboard } from "../features/admin/AdminDashboard";
import { PendingApprovalPage } from "../features/shared/PendingApprovalPage";
import { ApplySellerPage } from "../features/apply/ApplySellerPage";
import { ApplyRiderPage } from "../features/apply/ApplyRiderPage";
import { NotFoundPage } from "../features/errors/NotFoundPage";
import { AccessDeniedPage } from "../features/errors/AccessDeniedPage";
import { ServerErrorPage } from "../features/errors/ServerErrorPage";
import { TermsPage } from "../features/legal/TermsPage";
import { PrivacyPage } from "../features/legal/PrivacyPage";

const basename = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

export const router = createBrowserRouter(
  [
  {
    path: "/",
    element: <RootLayout />,
    errorElement: (
      <RootLayout>
        <ServerErrorPage />
      </RootLayout>
    ),
    children: [
      { index: true, element: <LandingPage /> },
      { path: "meals", element: <Navigate to="/" replace /> },
      { path: "sign-in", element: <SignInPage /> },
      { path: "sign-in/*", element: <SignInPage /> },
      { path: "sign-up", element: <SignUpPage /> },
      { path: "sign-up/*", element: <SignUpPage /> },
      {
        path: "apply/seller",
        element: (
          <ProtectedRoute>
            <ApplySellerPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "apply/rider",
        element: (
          <ProtectedRoute>
            <ApplyRiderPage />
          </ProtectedRoute>
        ),
      },

      {
        path: "student",
        element: (
          <ProtectedRoute allowedRoles={["STUDENT"]}>
            <StudentDashboardLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <StudentDashboard /> },
          { path: "shops", element: <ShopListPage /> },
          { path: "shops/:shopId", element: <ShopDetailPage /> },
          { path: "cart", element: <CartPage /> },
          { path: "checkout", element: <CheckoutPage /> },
          { path: "addresses", element: <AddressesPage /> },
          { path: "orders", element: <StudentOrdersPage /> },
          { path: "orders/:orderId", element: <OrderTrackingPage /> },
        ],
      },
      {
        path: "seller",
        element: (
          <ProtectedRoute allowedRoles={["SELLER"]}>
            <SellerDashboardLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <SellerDashboard /> },
          { path: "shops", element: <SellerShopsPage /> },
          { path: "shops/new", element: <CreateShopPage /> },
          { path: "shops/:shopId/meals", element: <SellerMealsPage /> },
          { path: "shops/:shopId/orders", element: <SellerOrdersPage /> },
          { path: "shops/:shopId/flash-deals", element: <SellerFlashDealsPage /> },
        ],
      },
      {
        path: "rider",
        element: (
          <ProtectedRoute allowedRoles={["RIDER"]}>
            <RiderDashboardLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <RiderDashboard /> },
        ],
      },

      {
        path: "admin",
        element: (
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminDashboardLayout />
          </ProtectedRoute>
        ),
        children: [{ index: true, element: <AdminDashboard /> }],
      },

      {
        path: "pending",
        element: (
          <ProtectedRoute>
            <PendingApprovalPage />
          </ProtectedRoute>
        ),
      },

      {
        path: "role-redirect",
        element: (
          <ProtectedRoute>
            <RoleRedirect />
          </ProtectedRoute>
        ),
      },

      { path: "access-denied", element: <AccessDeniedPage /> },
      { path: "500", element: <ServerErrorPage /> },
      { path: "terms", element: <TermsPage /> },
      { path: "privacy", element: <PrivacyPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
],
  basename ? { basename } : {}
);
