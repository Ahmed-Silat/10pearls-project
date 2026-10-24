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
            <Route path="/" element={<Dashboard />} />
            {/* </Route> */}
            <Route path="/user-profile" element={<UserProfile />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
