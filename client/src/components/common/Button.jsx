import { motion } from "framer-motion";

function Button({
  children,
  type = "button",
  variant = "primary",
  className = "",
  ...props
}) {
  const variants = {
    primary:
      "bg-blue-600 hover:bg-blue-700 text-white",

    secondary:
      "bg-slate-700 hover:bg-slate-800 text-white",

    danger:
      "bg-red-600 hover:bg-red-700 text-white",
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      type={type}
      className={`
        px-4 py-2 rounded-xl
        font-medium transition-all
        duration-200 shadow-sm
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export default Button;