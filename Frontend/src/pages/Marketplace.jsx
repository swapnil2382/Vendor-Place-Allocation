import { useState, useEffect } from "react";
import axios from "axios";

function Marketplace() {
    const [vendors, setVendors] = useState([]);
    const [search, setSearch] = useState("");

    useEffect(() => {
        
        const fetchVendors = async () => {
            const res = await axios.get("/api/vendors/marketplace");
            setVendors(res.data);
        };

        fetchVendors();
    }, []);

    const filteredVendors = vendors.filter(vendor =>
        vendor.name.toLowerCase().includes(search.toLowerCase()) ||
        vendor.category.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-5">
            <h2 className="text-2xl font-bold">Marketplace</h2>

            <input 
                type="text" 
                placeholder="Search vendors by name or category..." 
                className="mt-4 p-2 border rounded w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

            <ul className="mt-4">
                {filteredVendors.map((vendor) => (
                    <li key={vendor._id} className="mt-2 p-2 border rounded">
                        <p><strong>Name:</strong> {vendor.name}</p>
                        <p><strong>Category:</strong> {vendor.category}</p>
                        <p><strong>Location:</strong> {vendor.location}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Marketplace;
