import { Navigate, Outlet } from "react-router-dom";

/** Login and signup pages: someone who is already signed in is sent to their contacts instead. */
export default function PublicOnlyRoutes() {
  const token = localStorage.getItem("userData");
  return token ? <Navigate to="/" replace /> : <Outlet />;
}
