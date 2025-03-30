import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom"; // Import useNavigate
import axios from "axios";

function Navbar() {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(localStorage.getItem("role")); // Fetch role from localStorage
    const navigate = useNavigate(); // Initialize navigate

    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem("token");
            if (!token || role !== "vendor") return; // Only fetch vendor details

            try {
                const res = await axios.get("http://localhost:5000/api/vendors/me", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setUser(res.data);
            } catch (err) {
                console.error("Error fetching user:", err);
                localStorage.removeItem("token"); // Remove token if invalid
                setRole(null);
            }
        };

        fetchUser();
    }, [role]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        setUser(null);
        setRole(null);
        navigate("/"); // Redirect to homepage
    };

    return (
        <nav className="bg-blue-600 p-4 flex justify-between items-center">
            <h1 className="text-white text-2xl font-bold">Vendor Marketplace</h1>
            {role ? (
                <div className="flex items-center gap-4">
                    {role === "admin" ? (
                        <span className="text-white font-bold">IND GOVT.</span>
                    ) : (
                        <span className="text-white">{user?.name || "Vendor"}</span>
                    )}
                    <img src="https://via.placeholder.com/40" alt="Profile" className="w-10 h-10 rounded-full" />
                    <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded">
                        Logout
                    </button>
                </div>
            ) : (
                <Link to="/login" className="bg-white text-blue-600 px-4 py-2 rounded">
                    Login
                </Link>
            )}
        </nav>
    );
}

export default Navbar;
