import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const LicenseApplication = ({ vendor = {} }) => {
  const [formData, setFormData] = useState({
    aadhaarID: "",
    gstNumber: "",
    panNumber: "",
    yearsInBusiness: "",
    businessName: "",
    businessDescription: "",
    shopPhoto: null,
    vendorPhoto: null,
  });

  const [licenseStatus, setLicenseStatus] = useState("not issued");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [vendorData, setVendorData] = useState(null);
  const certificateRef = useRef(null);

  // For image loading state tracking
  const [imagesLoaded, setImagesLoaded] = useState({
    emblem: false,
    seal: false,
    vendorPhoto: false,
  });

  const fetchVendorData = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/vendors/me", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      const data = res.data;
      setVendorData(data);

      if (data.license) {
        setLicenseStatus(data.license.status);
        setFormData({
          aadhaarID: data.license?.documents?.aadhaarID || "",
          gstNumber: data.license?.documents?.gstNumber || "",
          panNumber: data.license?.documents?.panNumber || "",
          yearsInBusiness: data.license?.documents?.yearsInBusiness || "",
          businessName: data.license?.documents?.businessName || "",
          businessDescription:
            data.license?.documents?.businessDescription || "",
          shopPhoto: null,
          vendorPhoto: null,
        });
      } else {
        setLicenseStatus("not issued");
      }
    } catch (error) {
      console.error("Error fetching vendor details:", error);
      setError("❌ Failed to fetch vendor details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorData();
  }, []);

  // Helper function to get proper image URL with error handling
  const getImageUrl = (path) => {
    if (!path) return null;

    // If already a full URL, return it
    if (path.startsWith("http")) return path;

    // If it's a relative path from uploads folder
    if (path.includes("/uploads/")) return `http://localhost:5000${path}`;

    // Default case - assume it's just a filename
    return `http://localhost:5000/uploads/${path}`;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.files[0] });
  };

  const applyForLicense = async () => {
    if (
      !formData.aadhaarID ||
      !formData.panNumber ||
      !formData.businessName ||
      !formData.shopPhoto ||
      !formData.vendorPhoto
    ) {
      setError("❌ Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key]) formDataToSend.append(key, formData[key]);
      });

      await axios.post(
        "http://localhost:5000/api/vendors/apply-license",
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setMessage("✅ License application submitted successfully!");
      setLicenseStatus("requested");
      fetchVendorData();
    } catch (err) {
      console.error("❌ Error applying for license:", err);
      setError("❌ Failed to apply. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to handle image load success
  const handleImageLoad = (imageType) => {
    setImagesLoaded((prev) => ({ ...prev, [imageType]: true }));
    console.log(`${imageType} loaded successfully`);
  };

  // Function to handle image load errors
  const handleImageError = (imageType, e) => {
    console.error(`Error loading ${imageType} image:`, e);
    // Set a placeholder or fallback image
    if (imageType === "emblem") {
      e.target.src = "http://localhost:5000/images/placeholder.png";
    } else if (imageType === "seal") {
      e.target.src = "http://localhost:5000/images/placeholder.png";
    } else if (imageType === "vendorPhoto") {
      e.target.src = "http://localhost:5000/images/placeholder.png";
    }
    e.target.alt = "Image not available";

    // Still mark as loaded to not block PDF generation
    setImagesLoaded((prev) => ({ ...prev, [imageType]: true }));
  };

  // Updated function to properly handle images for PDF export
  const prepareCanvasForExport = async () => {
    try {
      const element = certificateRef.current;

      // Make sure all images are loaded before generating canvas
      const allImagesLoaded = Object.values(imagesLoaded).every(
        (status) => status === true
      );
      if (!allImagesLoaded) {
        console.log("Waiting for images to load before generating PDF...");
        setMessage("Waiting for images to load...");
        // Wait a bit for images to load
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      // Convert all images in the certificate to data URLs
      const images = element.querySelectorAll("img");
      await Promise.all(
        Array.from(images).map(async (img) => {
          try {
            // Skip if already a data URL
            if (img.src.startsWith("data:")) return;

            // For images from our server, convert them to data URLs to avoid CORS issues
            if (img.src.includes("localhost") || img.src.includes("http")) {
              const response = await fetch(img.src, {
                credentials: "include",
                mode: "cors",
              });
              const blob = await response.blob();
              const reader = new FileReader();

              return new Promise((resolve) => {
                reader.onloadend = () => {
                  img.src = reader.result;
                  resolve();
                };
                reader.readAsDataURL(blob);
              });
            }
          } catch (e) {
            console.warn("Error processing image:", e);
            // Only use placeholder as a fallback if image fetching fails
            img.style.backgroundColor = "#f0f0f0";
            img.style.border = "1px solid #ddd";
            img.alt = "Image Unavailable";
          }
        })
      );

      // Create canvas with proper options
      return await html2canvas(element, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true,
        allowTaint: true,
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          const elements = clonedDoc.querySelectorAll("*");
          elements.forEach((el) => {
            try {
              // Fix any problematic color styles
              const computedStyle = window.getComputedStyle(el);
              if (
                computedStyle.color.includes("oklch") ||
                (computedStyle.color.includes("rgb") &&
                  computedStyle.color.includes("calc"))
              ) {
                el.style.color = "#000000";
              }
              if (
                computedStyle.backgroundColor &&
                (computedStyle.backgroundColor.includes("oklch") ||
                  computedStyle.backgroundColor.includes("calc"))
              ) {
                el.style.backgroundColor = "#ffffff";
              }

              // Fix borders with calc() or oklch
              if (
                computedStyle.borderColor &&
                (computedStyle.borderColor.includes("oklch") ||
                  computedStyle.borderColor.includes("calc"))
              ) {
                el.style.borderColor = "#cccccc";
              }
            } catch (e) {
              console.warn("Style processing error:", e);
            }
          });
        },
      });
    } catch (error) {
      console.error("Canvas preparation error:", error);
      throw error;
    }
  };

  const downloadCertificate = async () => {
    try {
      setMessage("Generating PDF, please wait...");

      const canvas = await prepareCanvasForExport();
      const imgData = canvas.toDataURL("image/png");

      // Create PDF
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth() - 20; // 10mm margin on each side
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 10, 10, pdfWidth, pdfHeight);
      pdf.save(
        `Vendor_License_${
          vendorData?.license?.licenseNumber || "Certificate"
        }.pdf`
      );

      setMessage("PDF downloaded successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Error generating PDF:", err);
      setError("Failed to generate PDF. Please try again later.");
      setTimeout(() => setError(""), 5000);
    }
  };

  const printCertificate = async () => {
    try {
      setMessage("Preparing certificate for printing...");

      const canvas = await prepareCanvasForExport();
      const imgData = canvas.toDataURL("image/png");

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        setError("Pop-up blocked. Please allow pop-ups for printing.");
        return;
      }

      printWindow.document.write(`
                <html>
                    <head>
                        <title>License Certificate</title>
                        <style>
                            body { margin: 0; padding: 20px; }
                            img { max-width: 100%; height: auto; }
                            @media print {
                                body { margin: 0; padding: 0; }
                            }
                        </style>
                    </head>
                    <body>
                        <img src="${imgData}" alt="License Certificate" />
                        <script>
                            window.onload = function() {
                                setTimeout(function() {
                                    window.print();
                                    setTimeout(function() { window.close(); }, 100);
                                }, 500);
                            }
                        </script>
                    </body>
                </html>
            `);
      printWindow.document.close();

      setMessage("Print dialog opened.");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Error printing certificate:", err);
      setError("Failed to print certificate. Please try again later.");
      setTimeout(() => setError(""), 5000);
    }
  };

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  // Process vendor photo URL properly
  const vendorPhotoUrl = vendorData?.license?.documents?.vendorPhoto
    ? getImageUrl(vendorData.license.documents.vendorPhoto)
    : vendorData?.license?.vendorPhotoUrl
    ? getImageUrl(vendorData.license.vendorPhotoUrl)
    : null;

  return (
    <div className="bg-green-100 p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-green-800">
        Business License Application
      </h3>

      {error && <p className="text-red-500 font-semibold mt-2">{error}</p>}
      {message && (
        <p className="text-green-600 font-semibold mt-2">{message}</p>
      )}

      {licenseStatus === "not issued" ? (
        <>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <input
              type="text"
              name="aadhaarID"
              value={formData.aadhaarID}
              onChange={handleChange}
              placeholder="Aadhaar ID *"
              className="border p-2 rounded"
            />
            <input
              type="text"
              name="panNumber"
              value={formData.panNumber}
              onChange={handleChange}
              placeholder="PAN Number *"
              className="border p-2 rounded"
            />
            <input
              type="text"
              name="gstNumber"
              value={formData.gstNumber}
              onChange={handleChange}
              placeholder="GST Number (if applicable)"
              className="border p-2 rounded"
            />
            <input
              type="number"
              name="yearsInBusiness"
              value={formData.yearsInBusiness}
              onChange={handleChange}
              placeholder="Years in Business"
              className="border p-2 rounded"
            />
            <input
              type="text"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              placeholder="Business Name *"
              className="border p-2 rounded"
            />
            <textarea
              name="businessDescription"
              value={formData.businessDescription}
              onChange={handleChange}
              placeholder="Business Description"
              className="border p-2 rounded"
            ></textarea>
            <div>
              <label className="block text-sm font-medium">Shop Photo *</label>
              <input
                type="file"
                name="shopPhoto"
                onChange={handleFileChange}
                accept="image/*"
                className="border p-2 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">
                Vendor Photo *
              </label>
              <input
                type="file"
                name="vendorPhoto"
                onChange={handleFileChange}
                accept="image/*"
                className="border p-2 rounded"
              />
            </div>
          </div>

          <button
            onClick={applyForLicense}
            className={`mt-4 px-4 py-2 rounded-md text-white ${
              loading
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600"
            }`}
            disabled={loading}
          >
            {loading ? "Applying..." : "Apply for License"}
          </button>
        </>
      ) : licenseStatus === "requested" ? (
        <p className="text-yellow-500 font-semibold mt-2">
          ⏳ Not Confirmed Yet - Waiting for Admin Approval...
        </p>
      ) : vendorData?.license ? (
        <div className="mt-2">
          <p className="text-green-600 font-semibold mb-4">
            ✅ License Approved!
          </p>
          {/* Updated Certificate Design with actual images */}
          <div
            ref={certificateRef}
            className="border-8 border-yellow-600 p-6 bg-white shadow-md text-left flex flex-col"
            style={{ fontFamily: "Arial, sans-serif" }}
          >
            {/* Header Section with government emblem */}
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-3xl font-bold text-black">
                  Government of India
                </h2>
                <p className="text-lg text-gray-600 italic">
                  Ministry of Commerce and Industry
                </p>
                <p className="text-sm text-gray-500">
                  Business Regulatory Authority
                </p>
              </div>
              <img
                src="http://localhost:5000/images/govt-emblem.png"
                alt="Government Emblem"
                className="w-16 h-16 object-contain"
                crossOrigin="anonymous"
                onLoad={() => handleImageLoad("emblem")}
                onError={(e) => handleImageError("emblem", e)}
              />
            </div>

            <hr className="border-t-2 border-gray-300 my-4 w-full" />

            {/* Certificate Title */}
            <h3 className="text-2xl font-semibold text-center text-black mb-6">
              Certificate of Vendor License
            </h3>

            {/* Vendor Photo - Using actual vendor photo */}
            <div className="flex justify-center mb-6">
              {vendorPhotoUrl ? (
                <img
                  src={vendorPhotoUrl}
                  alt="Vendor Photo"
                  className="w-32 h-32 border-4 border-gray-600 shadow-lg rounded-full object-cover"
                  crossOrigin="anonymous"
                  onLoad={() => handleImageLoad("vendorPhoto")}
                  onError={(e) => handleImageError("vendorPhoto", e)}
                />
              ) : (
                <div className="w-32 h-32 border-4 border-gray-600 shadow-lg rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-center text-gray-600">
                    No Photo Available
                  </span>
                </div>
              )}
            </div>

            {/* Vendor Information */}
            <div className="grid grid-cols-2 gap-4 text-lg mb-6">
              <p>
                <strong>License No:</strong> {vendorData.license.licenseNumber}
              </p>
              <p>
                <strong>Vendor Name:</strong> {vendorData.name}
              </p>
              <p>
                <strong>Shop ID:</strong> {vendorData.shopID}
              </p>
              <p>
                <strong>Business Name:</strong>{" "}
                {vendorData.license.documents.businessName}
              </p>
              <p>
                <strong>Business Category:</strong>{" "}
                {vendorData.category || "N/A"}
              </p>
              <p>
                <strong>GST Number:</strong>{" "}
                {vendorData.license.documents.gstNumber || "Not Provided"}
              </p>
              <p>
                <strong>Aadhaar ID:</strong>{" "}
                {vendorData.license.documents.aadhaarID || "N/A"}
              </p>
              <p>
                <strong>PAN Number:</strong>{" "}
                {vendorData.license.documents.panNumber || "N/A"}
              </p>
              <p>
                <strong>Years in Business:</strong>{" "}
                {vendorData.license.documents.yearsInBusiness || "N/A"}
              </p>
              <p>
                <strong>Issued On:</strong>{" "}
                {new Date(vendorData.license.approvedAt).toLocaleDateString()}
              </p>
              <p className="col-span-2">
                <strong>Business Description:</strong>{" "}
                {vendorData.license.documents.businessDescription ||
                  "Not Provided"}
              </p>
            </div>

            {/* Approval Section with seal */}
            <div className="mt-auto">
              <div className="flex justify-center mb-4">
                <img
                  src="http://localhost:5000/images/official-seal.png"
                  alt="Official Seal"
                  className="w-24 h-24 object-contain"
                  crossOrigin="anonymous"
                  onLoad={() => handleImageLoad("seal")}
                  onError={(e) => handleImageError("seal", e)}
                />
              </div>
              <p className="text-green-600 font-bold text-xl text-center mb-2">
                ✅ Approved by Government Authority
              </p>
              <p className="text-sm text-gray-600 text-center italic">
                This certificate is issued to the above-named vendor under the
                authority of the Government of India.
              </p>
              <p className="text-sm text-gray-600 text-center mt-2">
                <strong>Authorized Signatory</strong>
              </p>
            </div>
          </div>

          {/* Buttons for Download and Print */}
          <div className="mt-4 flex justify-center gap-4">
            <button
              onClick={downloadCertificate}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Download as PDF
            </button>
            <button
              onClick={printCertificate}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Print Certificate
            </button>
          </div>
        </div>
      ) : (
        <p className="text-red-500 font-semibold mt-2">
          ❌ License data unavailable.
        </p>
      )}
    </div>
  );
};

export default LicenseApplication;
