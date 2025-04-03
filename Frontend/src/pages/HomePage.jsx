// src/pages/HomePage.jsx
import { useNavigate } from "react-router-dom";
import MapComponent from "./MapComponent";
import useFetchStalls from "./useFetchStalls";

// Images (Updated hero image with a reliable Unsplash URL)
const heroImage = "https://images.unsplash.com/photo-1560439514-07b273a5c829?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"; // Reliable marketplace image
const feature1Image = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQCxFj84qqdlbRfX0rJ4BMsMIRXmINcW2Z9ZQ&s"; // Registration
const feature2Image = "https://cdn.prod.website-files.com/6209ea9aee1f965d7fce7c19/649589c64efdd0ac728ff65b_gh-angle-adult-holding-smartphone-1.webp"; // Location check-in
const feature3Image = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQZFcl8NuCMxvFG0KNQUH5nSy4U3yNqMdWwdQ&s"; // Map

function HomePage() {
  const { stalls, loading, error } = useFetchStalls();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Hero Section - Full Width */}
      <header
        className="relative w-full h-[70vh] bg-blue-500 text-white bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Fallback background color if image fails */}
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        <div className="relative z-10 text-center px-4">
          <h2 className="text-5xl md:text-7xl font-extrabold mb-6 drop-shadow-lg">
            VendorSync Marketplace
          </h2>
          <p className="text-xl md:text-3xl max-w-4xl mx-auto mb-8 drop-shadow-md">
            Simplify vendor management, stall booking, and location-based attendance tracking.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="px-10 py-4 bg-white text-blue-500 font-semibold rounded-full shadow-xl hover:bg-gray-100 transition transform hover:scale-110"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Project Info - Full Width */}
      <section className="w-full py-20 bg-white">
        <div className="px-6 md:px-12">
          <h3 className="text-4xl md:text-5xl font-bold mb-10 text-gray-800 text-center">
            Discover VendorSync
          </h3>
          <p className="text-lg md:text-xl text-gray-700 leading-relaxed mb-12 text-center max-w-4xl mx-auto">
            VendorSync empowers vendors to book stalls, mark their arrival at designated locations, and helps admins manage marketplace operations with an intuitive map-based system.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 px-4 md:px-0">
            {/* Feature 1 */}
            <div className="text-center p-6 bg-gray-50 rounded-xl hover:shadow-2xl transition">
              <img
                src={feature1Image}
                alt="Vendor Registration"
                className="w-full h-64 object-cover rounded-lg mb-6 transform hover:scale-105 transition"
                onError={(e) => (e.target.src = "https://via.placeholder.com/600x400?text=Image+Not+Found")}
              />
              <h4 className="text-2xl font-semibold text-gray-800 mb-3">
                Vendor Registration
              </h4>
              <p className="text-gray-600 text-lg">
                A streamlined process for vendors to join and manage their marketplace presence with ease.
              </p>
            </div>
            {/* Feature 2 - Location-Based Attendance */}
            <div className="text-center p-6 bg-gray-50 rounded-xl hover:shadow-2xl transition">
              <img
                src={feature2Image}
                alt="Location-Based Attendance"
                className="w-full h-64 object-cover rounded-lg mb-6 transform hover:scale-105 transition"
                onError={(e) => (e.target.src = "https://via.placeholder.com/600x400?text=Image+Not+Found")}
              />
              <h4 className="text-2xl font-semibold text-gray-800 mb-3">
                Location-Based Attendance
              </h4>
              <p className="text-gray-600 text-lg">
                Vendors can mark their arrival at booked stalls, ensuring accurate location tracking.
              </p>
            </div>
            {/* Feature 3 */}
            <div className="text-center p-6 bg-gray-50 rounded-xl hover:shadow-2xl transition">
              <img
                src={feature3Image}
                alt="Stall Management"
                className="w-full h-64 object-cover rounded-lg mb-6 transform hover:scale-105 transition"
                onError={(e) => (e.target.src = "https://via.placeholder.com/600x400?text=Image+Not+Found")}
              />
              <h4 className="text-2xl font-semibold text-gray-800 mb-3">
                Stall Management
              </h4>
              <p className="text-gray-600 text-lg">
                Interactive tools for admins to assign and oversee marketplace stalls efficiently.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Weekly Market Stalls Map - Full Width */}
      <section className="w-full py-20 bg-gray-100">
        <div className="px-6 md:px-12">
          <h3 className="text-4xl md:text-5xl font-bold mb-10 text-gray-800 text-center">
            Weekly Market Stalls
          </h3>
          {loading ? (
            <p className="text-center text-gray-600 text-xl">
              
            </p>
          ) : error ? (
            <p className="text-center text-red-600 text-xl">Error: {error}</p>
          ) : (
            <div className="w-full h-[70vh] rounded-xl overflow-hidden shadow-2xl">
              <MapComponent
                center={[19.066435205235848, 72.99389000336194]}
                zoom={18}
                stalls={stalls}
                showLocations={true}
              />
            </div>
          )}
          <p className="text-gray-600 text-center mt-8 text-xl max-w-3xl mx-auto">
            Explore stall locations and book your spot with our interactive marketplace map.
          </p>
        </div>
      </section>

      {/* Call to Action - Full Width */}
      <section className="w-full py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="text-center px-6 md:px-12">
          <h3 className="text-4xl md:text-5xl font-bold mb-6 drop-shadow-lg">
            Ready to Transform Your Marketplace?
          </h3>
          <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto drop-shadow-md">
            Join VendorSync today and streamline stall booking and attendance tracking.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="px-10 py-4 bg-white text-blue-600 font-semibold rounded-full shadow-xl hover:bg-gray-100 transition transform hover:scale-110"
          >
            Sign In Now
          </button>
        </div>
      </section>
    </div>
  );
}

export default HomePage;