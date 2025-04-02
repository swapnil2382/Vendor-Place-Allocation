import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const PaymentPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState({
    amount: 500, // Example amount in INR
    currency: "INR",
    stallName: "Loading...",
  });
  const navigate = useNavigate();
  const location = useLocation();
  const { stallId } = location.state || {};

  // Fetch stall details on mount (optional enhancement)
  useEffect(() => {
    if (!stallId) {
      setError("No stall selected. Please go back and select a stall.");
      return;
    }
    // Simulate fetching stall details (replace with real API call if available)
    const fetchStallDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `http://localhost:5000/api/stalls/${stallId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setPaymentDetails((prev) => ({
          ...prev,
          stallName: response.data.name || "Unknown Stall",
        }));
      } catch (err) {
        setError("Failed to load stall details.");
      }
    };
    fetchStallDetails();
  }, [stallId]);

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    const token = localStorage.getItem("token");
    if (!token) {
      setError("You must be logged in to make a payment.");
      setLoading(false);
      return;
    }

    try {
      // Simulate payment gateway (e.g., Razorpay, Stripe) - Replace with actual integration
      const paymentSuccess = await simulatePaymentGateway({
        amount: paymentDetails.amount,
        currency: paymentDetails.currency,
      });

      if (!paymentSuccess) {
        throw new Error("Payment declined by gateway.");
      }

      // Claim stall after payment success
      const response = await axios.post(
        `http://localhost:5000/api/vendors/claim-stall/${stallId}`,
        { paymentConfirmed: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Payment successful, stall booked:", response.data);

      // Navigate to dashboard with booking receipt
      navigate("/vendor-dashboard", {
        state: {
          bookingReceipt: {
            stallName: response.data.stall.name,
            coordinates: `${response.data.stall.lat},${response.data.stall.lng}`,
            bookingDate: new Date().toLocaleString(),
            vendorId: response.data.stall.vendorID,
            transactionId: `TXN${Date.now()}`, // Example transaction ID
          },
        },
      });
    } catch (err) {
      setError(
        "Payment failed: " + (err.response?.data?.message || err.message)
      );
      console.error("Payment error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Mock payment gateway simulation (replace with real integration)
  const simulatePaymentGateway = async ({ amount, currency }) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true); // Simulate success (can randomly fail for testing: Math.random() > 0.2)
      }, 2000); // Simulate network delay
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          Complete Your Payment
        </h1>

        {/* Payment Summary */}
        <div className="mb-6">
          <p className="text-lg text-gray-700">
            Stall: <span className="font-semibold">{paymentDetails.stallName}</span>
          </p>
          <p className="text-lg text-gray-700">
            Amount: <span className="font-semibold">₹{paymentDetails.amount}</span> ({paymentDetails.currency})
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Pay to secure your stall booking.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* Pay Button */}
        <button
          onClick={handlePayment}
          disabled={loading || !stallId}
          className={`w-full py-3 rounded-md text-white font-semibold transition-colors ${
            loading || !stallId
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-500 hover:bg-green-600"
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin h-5 w-5 mr-2 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8h8a8 8 0 11-16 0z"
                />
              </svg>
              Processing...
            </span>
          ) : (
            "Pay Now"
          )}
        </button>

        {/* Additional Info */}
        <p className="text-sm text-gray-500 mt-4 text-center">
          Payments are securely processed. Contact support if you face issues.
        </p>
      </div>
    </div>
  );
};

export default PaymentPage;