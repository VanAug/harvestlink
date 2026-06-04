import { useEffect, useState } from "react";
import { Bell, Check, CheckCheck, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/layout/PageShell";
import { apiGet, apiPatch, apiPost, getNotificationRoute } from "../lib/api";

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const data = await apiGet("/notifications");
      setNotifications(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function markRead(id) {
    try {
      const updated = await apiPatch(`/notifications/${id}/read`, {});
      setNotifications((current) =>
        current.map((n) => (n.id === updated.id ? updated : n))
      );
    } catch {
      // ignore
    }
  }

  async function handleNotificationClick(notification) {
    await markRead(notification.id);
    navigate(getNotificationRoute(notification));
  }

  async function markAllRead() {
    try {
      await apiPost("/notifications/read-all", {});
      setNotifications((current) =>
        current.map((n) => ({ ...n, is_read: true }))
      );
    } catch {
      // ignore
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <PageShell>
      <main className="mx-auto max-w-4xl px-4 py-12 lg:px-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex rounded-full bg-harvest-soft px-4 py-2 text-sm font-bold text-harvest-green">
              <Bell size={14} className="mr-2" />
              Notifications
            </div>
            <h1 className="mt-4 text-4xl font-black text-harvest-green">Notification Center</h1>
            <p className="mt-2 text-gray-600">
              {loading
                ? "Loading..."
                : `${unreadCount} unread · ${notifications.length} total`}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="inline-flex items-center gap-2 rounded-xl bg-harvest-green px-4 py-2 text-sm font-bold text-white"
            >
              <CheckCheck size={16} />
              Mark All Read
            </button>
          )}
        </div>

        <section className="mt-8 space-y-3">
          {loading ? (
            <div className="rounded-2xl bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
              <Bell size={32} className="mx-auto text-gray-300" />
              <p className="mt-2 font-bold text-gray-500">No notifications yet</p>
              <p className="text-sm text-gray-400">
                You'll see notifications here when events happen on the platform.
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full text-left rounded-2xl border p-4 transition hover:shadow-md ${
                  notification.is_read
                    ? "border-gray-100 bg-white hover:border-harvest-green/20"
                    : "border-harvest-green/20 bg-harvest-soft hover:bg-harvest-green/10"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-harvest-green">
                        {notification.title}
                      </span>
                      {!notification.is_read && (
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {notification.message}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!notification.is_read && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-harvest-green">
                        <Check size={14} />
                      </span>
                    )}
                    <ArrowRight size={16} className="text-gray-400" />
                  </div>
                </div>
              </button>
            ))
          )}
        </section>
      </main>
    </PageShell>
  );
}