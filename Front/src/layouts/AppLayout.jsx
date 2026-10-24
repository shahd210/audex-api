
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/shared/Sidebar";
import Header from "../components/shared/Header";

const pageTitles = {
  "/": "Dashboard",
  "/recommendations": "Recommendations",
  "/workflows": "Workflows",
  "/tasks": "Tasks",
};

export default function AppLayout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="min-w-0 flex-1">
          <Header title={pageTitles[pathname] ?? "AUDEX"} />

          <main className="p-5 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
