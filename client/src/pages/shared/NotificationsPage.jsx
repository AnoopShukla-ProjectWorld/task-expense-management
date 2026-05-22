import {
  useQuery,
} from "@tanstack/react-query";

import {
  getNotifications,
} from "../../services/notificationService";

function NotificationsPage() {
  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)]">
          Notifications
        </h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">Stay updated with automatic system logs and transaction updates</p>
      </div>

      <div className="space-y-4">
        {data?.length === 0 ? (
          <div className="glass-panel p-8 text-center rounded-2xl text-[var(--text-secondary)]">
            No notifications to display.
          </div>
        ) : (
          data?.map((item) => (
            <div
              key={item.id}
              className={`glass-panel p-5 rounded-2xl shadow-md transition-all duration-300 hover:shadow-lg border border-[var(--border-color)] border-l-4 ${
                item.is_read 
                  ? "border-l-transparent" 
                  : "border-l-[var(--accent-blue)]"
              }`}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-[var(--text-primary)] text-base tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                    {item.message}
                  </p>
                </div>
                {item.created_at && (
                  <span className="text-3xs text-[var(--text-secondary)]/60 font-extrabold whitespace-nowrap uppercase tracking-wider bg-[var(--bg-primary)]/50 px-2.5 py-1 rounded-lg border border-[var(--border-color)]">
                    {new Date(item.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default NotificationsPage;