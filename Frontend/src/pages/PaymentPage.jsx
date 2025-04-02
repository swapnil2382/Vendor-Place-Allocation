import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const PaymentPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { stallId } = location.state || {};

  const handlePayment = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("token");

    try {
      const response = await axios.post(
        `http://localhost:5000/api/vendors/claim-stall/${stallId}`,
        { paymentConfirmed: true }, // Simulate payment success
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Payment successful, stall booked:", response.data);
      navigate("/vendor-dashboard", {
        state: {
          bookingReceipt: {
            stallName: response.data.stall.name,
            coordinates: `${response.data.stall.lat},${response.data.stall.lng}`,
            bookingDate: new Date().toLocaleString(),
            vendorId: response.data.stall.vendorID,
          },
        },
      });
    } catch (err) {
      setError(
        "Payment failed: " + (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold mb-4">Complete Payment</h1>
      <p className="mb-4">Pay to book your stall. Amount: ₹500 (example)</p>
      {error && <p className="text-red-500">{error}</p>}
      <button
        onClick={handlePayment}
        disabled={loading}
        className={`px-6 py-2 rounded-md text-white ${
          loading ? "bg-gray-400" : "bg-green-500 hover:bg-green-600"
        }`}
      >
        {loading ? "Processing..." : "Pay Now"}
      </button>
    </div>
  );
};

export default PaymentPage;
