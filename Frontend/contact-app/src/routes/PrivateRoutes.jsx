import { Navigate, Outlet } from "react-router-dom";

export default function PrivateRoutes() {
  const token = localStorage.getItem("userData");
  return token ? <Outlet /> : <Navigate to="/login" />;
}
