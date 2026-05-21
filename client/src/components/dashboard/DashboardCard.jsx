import { motion } from "framer-motion";

function DashboardCard({
  title,
  value,
  icon,
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="
        bg-white rounded-2xl
        p-6 shadow-sm
        border border-gray-100
      "
    >
      <div className="flex justify-between">
        <div>
          <p className="text-gray-500">
            {title}
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {value}
          </h2>
        </div>

        <div className="text-4xl text-blue-600">
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

export default DashboardCard;