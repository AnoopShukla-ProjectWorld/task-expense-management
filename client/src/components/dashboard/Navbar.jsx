import {
  FaBell,
  FaUserCircle,
} from "react-icons/fa";

function Navbar() {
  return (
    <header
      className="
        bg-white border-b
        px-6 py-4 flex
        justify-between items-center
      "
    >
      <div>
        <h2 className="text-xl font-bold">
          Dashboard
        </h2>
      </div>

      <div className="flex items-center gap-5">
        <button className="text-2xl text-gray-600">
          <FaBell />
        </button>

        <button className="text-3xl text-gray-700">
          <FaUserCircle />
        </button>
      </div>
    </header>
  );
}

export default Navbar;