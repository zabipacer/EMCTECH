import { useEffect } from "react";
import { FaCheck, FaExclamationTriangle, FaInfo, FaTimes } from "react-icons/fa";
import { motion } from "framer-motion";
// Make sure your Toast component is working properly
 function Toast({ message, type = "info", onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: "bg-green-600 text-white",
    error: "bg-red-600 text-white",
    warning: "bg-yellow-600 text-white",
    info: "bg-blue-600 text-white"
  };

  const icons = {
    success: <FaCheck className="text-lg" />,
    error: <FaTimes className="text-lg" />,
    warning: <FaExclamationTriangle className="text-lg" />,
    info: <FaInfo className="text-lg" />
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className={`${styles[type]} px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-80 fixed top-4 right-4 z-50`}
    >
      {icons[type]}
      <span className="flex-1">{message}</span>
      <button
        onClick={onClose}
        className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
      >
        <FaTimes size={14} />
      </button>
    </motion.div>
  );
}

export default Toast;