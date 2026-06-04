import { useEffect, useState, useRef } from "react";
import { Bell } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { apiGet, apiPatch, getNotificationRoute } from "../../lib/api";

export default function NotificationBell() {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const bellRef = useRef(null);

  async function fetchUnread() {
    try {
      const data = await apiGet("/notifications/unread-count");
      setUnreadCount(data.count || 0);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Re-fetch when auth changes
  useEffect(() => {
    function onAuth() {
      fetchUnread();
    }
    window.addEventListener("harvestlink-auth-changed", onAuth);
    return () => window.removeEventListener("harvestlink-auth-changed", onAuth);
  }, []);

  const [recent, setRecent] = useState([]);

  async function loadRecent() {
    try {
      const data = await apiGet("/notifications");
      setRecent((data || []).slice(0, 5));
    } catch {
      // ignore
    }
  }

  function handleBellClick() {
    if (!open) {
      loadRecent();
    }
    setOpen(!open);
  }

  return (
    <div className="relative" ref={bellRef}>
      <button
        onClick={handleBellClick}
        className="relative p-1 text-gray-500 hover:text-harvest-green"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-gray-100 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <span className="text-sm font-bold text-harvest-green">Notifications</span>
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-harvest-leaf hover:underline"
            >
              View All
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="px-4 py-5 text-center text-xs text-gray-500">
              No notifications yet
            </div>
          ) : (
            <div className="max-h-64 divide-y divide-gray-100 overflow-y-auto">
              {recent.map((n) => (
                <button
                  key={n.id}
                  onClick={async () => {
                    try {
                      await apiPatch(`/notifications/${n.id}/read`, {});
                      setOpen(false);
                      navigate(getNotificationRoute(n));
                      setTimeout(fetchUnread, 500);
                    } catch {}
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-harvest-soft transition"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-harvest-green">{n.title}</div>
                      <div className="mt-0.5 text-xs text-gray-500 line-clamp-2">{n.message}</div>
                      <div className="mt-0.5 text-[10px] text-gray-400">{new Date(n.created_at).toLocaleString()}</div>
                    </div>
                    {!n.is_read && <div className="mt-1 h-2 w-2 rounded-full bg-red-500 flex-shrink-0" />}
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="border-t border-gray-100 px-4 py-2">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="block rounded-xl bg-harvest-green px-4 py-2 text-center text-xs font-bold text-white"
            >
              Open Notification Center
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}