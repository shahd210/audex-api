import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import AppLayout from "./layouts/AppLayout";
import Dashboard from "./pages/Dashboard";
import Recommendations from "./pages/Recommendations";
import Workflows from "./pages/Workflows";
import Tasks from "./pages/Tasks";
import Login from "./pages/Login";
import WorkflowDetails from "./pages/WorkflowDetails";
import { clearToken, getToken, apiRequest } from "./services/api";

function AuthenticatedApp() {
  const [token, setTokenState] = useState(getToken());
  const [checking, setChecking] = useState(Boolean(getToken()));

  useEffect(() => {
    const handleUnauthorized = () => {
      clearToken();
      setTokenState(null);
      setChecking(false);
    };
    window.addEventListener("audex:unauthorized", handleUnauthorized);

    if (getToken()) {
      apiRequest("/auth/me")
        .then(() => setTokenState(getToken()))
        .catch(() => {
          clearToken();
          setTokenState(null);
        })
        .finally(() => setChecking(false));
    }

    return () => window.removeEventListener("audex:unauthorized", handleUnauthorized);
  }, []);

  if (checking) {
    return <div className="flex min-h-screen items-center justify-center text-slate-500">Checking session...</div>;
  }

  if (!token) {
    return <Login onLogin={() => setTokenState(getToken())} />;
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/recommendations" element={<Recommendations />} />
        <Route path="/workflows" element={<Workflows />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/workflows" element={<Workflows />} />
<Route path="/workflows/:id" element={<WorkflowDetails />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthenticatedApp />
    </BrowserRouter>
  );
}
