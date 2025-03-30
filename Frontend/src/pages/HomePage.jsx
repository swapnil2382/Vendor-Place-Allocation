// src/pages/HomePage.jsx
import MapComponent from "./MapComponent";
import useFetchStalls from "./useFetchStalls";

function HomePage() {
  const { stalls, loading, error } = useFetchStalls();

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Hero Section */}
      <header className="text-center py-20 bg-blue-500 text-white">
        <h2 className="text-4xl font-bold">Welcome to Vendor Marketplace</h2>
        <p className="mt-2 text-lg">A platform to manage your marketplace vendors efficiently.</p>
      </header>

      {/* Project Info */}
      <section className="max-w-4xl mx-auto my-10 p-6 bg-white shadow rounded">
        <h3 className="text-2xl font-bold mb-3">About the Project</h3>
        <p className="text-gray-700">
          Our vendor management system helps vendors register, manage their shops, and mark attendance using QR codes.
          Admins can monitor vendors and allocate marketplace spots efficiently.
        </p>
      </section>

      {/* Weekly Market Stalls Map */}
      <section className="max-w-5xl mx-auto my-10 p-6 bg-white shadow rounded">
        <h3 className="text-2xl font-bold mb-3">Weekly Market Stalls Map</h3>
        <div className="w-full h-[600px] shadow-lg rounded-lg overflow-hidden">
          {loading ? (
            <p className="text-gray-700 text-center">Loading stalls...</p>
          ) : error ? (
            <p className="text-red-500 text-center">Error: {error}</p>
          ) : (
            <MapComponent stalls={stalls} />
          )}
        </div>
      </section>

    </div>
  );
}

export default HomePage;
