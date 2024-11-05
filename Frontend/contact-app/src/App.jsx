import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import Login from "./components/login-signup/Login";
import SignUp from "./components/login-signup/SignUp";
import PrivateRoutes from "./routes/PrivateRoutes";
import Dashboard from "./components/dashboard/Dashboard";
import UserProfile from "./components/user-profile/UserProfile";
import Header from "./components/header/Header";
import Pagination from "./components/pagination/Pagination";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route element={<PrivateRoutes />}>
          <Route element={<Header />}>
            {/* <Route element={<Pagination />}> */}
            <Route path="/" element={<Dashboard />} />
            {/* </Route> */}
            <Route path="/user-profile" element={<UserProfile />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
