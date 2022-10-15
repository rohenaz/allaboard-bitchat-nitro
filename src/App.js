import React from "react";

import { BrowserRouter, Route, Routes } from "react-router-dom";

import LoginPage from "./components/authForm/LoginPage";
import SignupPage from "./components/authForm/SignupPage";
import Dashboard from "./components/dashboard/Dashboard";
import { RequireAuth } from "./routes";
if (typeof window !== "undefined") {
  window.Buffer = window.Buffer || require("buffer").Buffer;
}

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* <Route path="/" element={<HomePage />} /> */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/channels"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/channels/:channel"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/@/:user"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
