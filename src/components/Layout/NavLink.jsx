import { NavLink as RouterLink } from "react-router-dom";

export default function NavLink({ to, icon: Icon, label }) {
  return (
    <RouterLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium 
        ${isActive ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"}`
      }
    >
      <Icon className="h-4 w-4" />
      {label}
    </RouterLink>
  );
}
