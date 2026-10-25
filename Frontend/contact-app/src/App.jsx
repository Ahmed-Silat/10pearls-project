import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import Login from "./components/login-signup/Login";
import SignUp from "./components/login-signup/SignUp";
import ForgotPassword from "./components/login-signup/ForgotPassword";
import PrivateRoutes from "./routes/PrivateRoutes";
import PublicOnlyRoutes from "./routes/PublicOnlyRoutes";
import Dashboard from "./components/dashboard/Dashboard";
import UserProfile from "./components/user-profile/UserProfile";
import Header from "./components/header/Header";
import Pagination from "./components/pagination/Pagination";
import NotFound from "./components/not-found/NotFound";
import RecentlyDeleted from "./components/recently-deleted/RecentlyDeleted";

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors closeButton duration={2000} />
      <Routes>
        <Route element={<PublicOnlyRoutes />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
        </Route>
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route element={<PrivateRoutes />}>
          <Route element={<Header />}>
            {/* <Route element={<Pagination />}> */}
            {/* Keyed so switching sections starts fresh instead of briefly showing the other list. */}
            <Route path="/" element={<Dashboard key="all" view="all" />} />
            <Route path="/favorites" element={<Dashboard key="favorites" view="favorites" />} />
            <Route path="/emergency" element={<Dashboard key="emergency" view="emergency" />} />
            {/* </Route> */}
            <Route path="/user-profile" element={<UserProfile />} />
            <Route path="/recently-deleted" element={<RecentlyDeleted />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
