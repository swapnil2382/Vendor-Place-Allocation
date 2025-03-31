import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

function Navbar() {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(localStorage.getItem("role")); // Fetch role from localStorage
    const navigate = useNavigate(); // Initialize navigate

    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            try {
                let res;
                if (role === "vendor") {
                    res = await axios.get("http://localhost:5000/api/vendors/me", {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                } else if (role === "user") {
                    res = await axios.get("http://localhost:5000/api/users/me", {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                }
                setUser(res?.data);
            } catch (err) {
                console.error("Error fetching user:", err);
                localStorage.removeItem("token");
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
        navigate("/");
    };

    return (
        <nav className="bg-blue-600 p-4 flex justify-between items-center">
            <h1 className="text-white text-2xl font-bold">Vendor Marketplace</h1>

            {role ? (
                <div className="flex items-center gap-4">
                    {role === "admin" ? (
                        <span className="text-white font-bold">IND GOVT.</span>
                    ) : (
                        <div className="flex items-center gap-4">
                            {role === "vendor" && (
                                <>
                                    <Link to="/vendor" className="text-white hover:underline">Home</Link>
                                    <Link to="/vendor/location" className="text-white hover:underline">Location</Link>
                                    <Link to="/vendor/products" className="text-white hover:underline">Products</Link>
                                    <Link to="/vendor/orders" className="text-white hover:underline">Orders</Link>
                                    <Link to="/vendor/license" className="text-white hover:underline">License</Link>
                                </>
                            )}
                            {role === "user" && (
                                <>
                                <Link to="/user" className="text-white hover:underline">Home</Link>
                                <Link to="/cart" className="text-white hover:underline">Cart</Link>
                                </>
                            )}
                            <span className="text-white">{user?.name || "User"}</span>
                            <img src="https://via.placeholder.com/40" alt="Profile" className="w-10 h-10 rounded-full" />
                        </div>
                    )}

                    <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded">
                        Logout
                    </button>
                </div>
            ) : (
                <Link to="/login" className="bg-white text-blue-600 px-4 py-2 rounded">Login</Link>
            )}
        </nav>
    );
}

export default Navbar;
