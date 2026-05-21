import {
  useQuery,
} from "@tanstack/react-query";

import {
  getNotifications,
} from "../../services/notificationService";

function NotificationsPage() {
  const { data } = useQuery({
    queryKey: ["notifications"],

    queryFn:
      getNotifications,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">
        Notifications
      </h1>

      {data?.map((item) => (
        <div
          key={item.id}
          className="
            bg-white p-5
            rounded-2xl shadow-sm
          "
        >
          <h3 className="font-semibold">
            {item.title}
          </h3>

          <p className="text-gray-500">
            {item.message}
          </p>
        </div>
      ))}
    </div>
  );
}

export default NotificationsPage;