
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Lightbulb,
  GitBranch,
  ListTodo,
  GraduationCap,
} from "lucide-react";

const links = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  {
    label: "Recommendations",
    path: "/recommendations",
    icon: Lightbulb,
  },
  { label: "Workflows", path: "/workflows", icon: GitBranch },
  { label: "Tasks", path: "/tasks", icon: ListTodo },
];

export default function Sidebar() {
  return (
    <aside className="flex min-h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-5">
      <div className="mb-10 flex items-center gap-3">
        <div className="rounded-xl bg-indigo-600 p-2 text-white">
          <GraduationCap size={25} />
        </div>

        <div>
          <h1 className="text-xl font-bold tracking-wide text-slate-900">
            AUDEX
          </h1>
          <p className="text-xs text-slate-500">
            School Intelligence
          </p>
        </div>
      </div>

      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Workspace
      </p>

      <nav className="space-y-2">
        {links.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`
            }
          >
            <Icon size={19} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto rounded-xl bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-800">
          AUDEX Workspace
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Manage recommendations, workflows, and execution.
        </p>
      </div>
    </aside>
  );
}
