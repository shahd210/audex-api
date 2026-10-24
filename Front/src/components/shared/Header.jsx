
import { useNavigate } from "react-router-dom";
import searchData from "../../services/searchData";
import { logout } from "../../services/api";
import { useState } from "react";
import {Bell,Search,ChevronDown,UserRound,Settings,LogOut,Check,CheckCheck,X,} from "lucide-react";

const initialNotifications = [
  {
    id: 1,
    title: "New task assigned",
    message: "A new task is waiting for your review.",
    time: "10 minutes ago",
    unread: true,
  },
  {
    id: 2,
    title: "Upcoming deadline",
    message: "A task deadline is approaching.",
    time: "1 hour ago",
    unread: true,
  },
  {
    id: 3,
    title: "Workflow updated",
    message: "A workflow has been updated.",
    time: "Yesterday",
    unread: false,
  },
];

export default function Header({ title = "AUDEX" }) {
  const [activeMenu, setActiveMenu] = useState(null);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [message, setMessage] = useState("");
  const unreadCount = notifications.filter((notification) => notification.unread).length;


const navigate = useNavigate();
const [searchTerm, setSearchTerm] = useState("");

const filteredResults = searchData.filter((item) =>
  item.title.toLowerCase().includes(searchTerm.trim().toLowerCase())
);

function handleSearchSelect(item) {
  navigate(item.path);
  setSearchTerm("");
}


  function toggleMenu(menu) {
    setMessage("");
    setActiveMenu((current) => (current === menu ? null : menu));
  }

  function markAsRead(id) {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? { ...notification, unread: false }
          : notification
      )
    );
  }

  function markAllAsRead() {
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        unread: false,
      }))
    );
  }

  async function handleProfileAction(action) {
    if (action === "Logout") {
      try {
        await logout();
      } finally {
        window.location.reload();
      }
      return;
    }

    setMessage(`${action} page is not connected yet.`);
  }

  return (
    <header className="relative z-20 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 lg:px-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-indigo-600">
          AUDEX / Workspace
        </p>
        <h2 className="mt-1 text-xl font-semibold text-slate-900">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-3">

<div className="relative hidden sm:block">
  <div className="flex w-64 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
    <Search size={17} className="shrink-0 text-slate-400" />

    <input
      type="search"
      value={searchTerm}
      onChange={(event) => setSearchTerm(event.target.value)}
      placeholder="Search workspace..."
      aria-label="Search workspace"
      className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
    />
  </div>

  {searchTerm.trim() !== "" && (
    <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
      {filteredResults.length > 0 ? (
        filteredResults.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleSearchSelect(item)}
            className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-indigo-50"
          >
            <span className="text-sm font-medium text-slate-800">
              {item.title}
            </span>

            <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-500">
              {item.type}
            </span>
          </button>
        ))
      ) : (
        <p className="p-4 text-sm text-slate-500">
          No matching results found.
        </p>
      )}
    </div>
  )}
</div>


        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleMenu("notifications")}
            aria-label="Notifications"
            aria-expanded={activeMenu === "notifications"}
            className="relative rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-50"
          >
            <Bell size={20} />

            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {activeMenu === "notifications" && (
            <div className="absolute right-0 top-14 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 p-4">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Notifications
                  </h3>
                  <p className="text-xs text-slate-500">
                    {unreadCount} unread
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    title="Mark all as read"
                    aria-label="Mark all as read"
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                  >
                    <CheckCheck size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveMenu(null)}
                    aria-label="Close notifications"
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`border-b border-slate-100 p-4 last:border-0 ${
                      notification.unread ? "bg-indigo-50/60" : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="mt-1 rounded-full bg-indigo-100 p-2 text-indigo-700">
                        <Bell size={16} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-800">
                            {notification.title}
                          </p>

                          {notification.unread && (
                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-600" />
                          )}
                        </div>

                        <p className="mt-1 text-sm text-slate-600">
                          {notification.message}
                        </p>

                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="text-xs text-slate-400">
                            {notification.time}
                          </span>

                          {notification.unread && (
                            <button
                              type="button"
                              onClick={() => markAsRead(notification.id)}
                              className="flex items-center gap-1 text-xs font-medium text-indigo-700 hover:text-indigo-900"
                            >
                              <Check size={14} />
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {notifications.length === 0 && (
                <p className="p-6 text-center text-sm text-slate-500">
                  You have no notifications.
                </p>
              )}
            </div>
          )}
        </div>

        {/* User profile */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleMenu("profile")}
            aria-label="User profile menu"
            aria-expanded={activeMenu === "profile"}
            className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700">
              A
            </div>

            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold text-slate-800">
                Admin User
              </p>
              <p className="text-xs text-slate-500">Administrator</p>
            </div>

            <ChevronDown
              size={16}
              className="hidden text-slate-400 sm:block"
            />
          </button>

          {activeMenu === "profile" && (
            <div className="absolute right-0 top-14 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
              <div className="border-b border-slate-100 p-4">
                <p className="font-semibold text-slate-900">
                  Admin User
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Administrator
                </p>
              </div>

              <div className="p-2">
                <button
                  type="button"
                  onClick={() => handleProfileAction("My Profile")}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <UserRound size={18} />
                  My Profile
                </button>

                <button
                  type="button"
                  onClick={() => handleProfileAction("Settings")}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Settings size={18} />
                  Settings
                </button>

                <button
                  type="button"
                  onClick={() => handleProfileAction("Logout")}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>

              {message && (
                <p
                  role="status"
                  className="border-t border-slate-100 bg-slate-50 p-3 text-xs leading-5 text-slate-600"
                >
                  {message}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
