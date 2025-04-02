// src/pages/LicenseApplication.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Default placeholder image (base64 encoded)
const PLACEHOLDER_IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAADGSURBVHhe3dqxDcJQEETRw/7/T6dBsAQLMQtLsbB3P8/PGZgZGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYHhX/AJkmF/1eL2rAAAAAElFTkSuQmCC";

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

  const [imagesLoaded, setImagesLoaded] = useState({
    emblem: false,
    seal: false,
    watermark: false,
    vendorPhoto: false,
  });

  // Fetch vendor data
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
          businessDescription: data.license?.documents?.businessDescription || "",
          shopPhoto: null,
          vendorPhoto: null,
        });
      } else {
        setLicenseStatus("not issued");
      }
    } catch (error) {
      console.error("Error fetching vendor details:", error);
      setError("Failed to fetch vendor details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorData();
  }, []);

  // Helper function to get proper image URL
  const getImageUrl = (path) => {
    if (!path) return PLACEHOLDER_IMAGE;
    if (path.startsWith("http")) return path;
    if (path.includes("/uploads/")) return `http://localhost:5000${path}`;
    return `http://localhost:5000/uploads/${path}`;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 2 * 1024 * 1024) {
      setError("File size must not exceed 2MB.");
      return;
    }
    setFormData({ ...formData, [e.target.name]: file });
  };

  const applyForLicense = async () => {
    if (
      !formData.aadhaarID ||
      !formData.panNumber ||
      !formData.businessName ||
      !formData.shopPhoto ||
      !formData.vendorPhoto
    ) {
      setError("Please fill in all required fields.");
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

      setMessage("License application submitted successfully!");
      setLicenseStatus("requested");
      fetchVendorData();
    } catch (err) {
      console.error("Error applying for license:", err);
      setError("Failed to apply. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Image load/error handlers
  const handleImageLoad = (imageType) => {
    setImagesLoaded((prev) => ({ ...prev, [imageType]: true }));
  };

  const handleImageError = (imageType, e) => {
    console.error(`Error loading ${imageType} image:`, e);
    e.target.src = PLACEHOLDER_IMAGE;
    e.target.alt = `${imageType} not available`;
    setImagesLoaded((prev) => ({ ...prev, [imageType]: true }));
  };

  // Prepare canvas for PDF export with color fallback
  const prepareCanvasForExport = async () => {
    const element = certificateRef.current;
    if (!element) return;

    try {
      // Wait for images to load with a timeout
      const allImagesLoaded = Object.values(imagesLoaded).every((status) => status);
      if (!allImagesLoaded) {
        setMessage("Waiting for images to load...");
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      const images = element.querySelectorAll("img");
      await Promise.all(
        Array.from(images).map(async (img) => {
          if (!img.src.startsWith("data:")) {
            try {
              const response = await fetch(img.src, { mode: "cors" });
              const blob = await response.blob();
              const reader = new FileReader();
              return new Promise((resolve) => {
                reader.onloadend = () => {
                  img.src = reader.result;
                  resolve();
                };
                reader.readAsDataURL(blob);
              });
            } catch (err) {
              console.warn(`Failed to fetch ${img.src}:`, err);
              img.src = PLACEHOLDER_IMAGE;
            }
          }
        })
      );

      return await html2canvas(element, {
        scale: 3,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: true,
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          // Fix unsupported color functions like oklch
          const elements = clonedDoc.querySelectorAll("*");
          elements.forEach((el) => {
            const computedStyle = window.getComputedStyle(el);
            if (computedStyle.color && computedStyle.color.includes("oklch")) {
              el.style.color = "#000000"; // Fallback to black
            }
            if (
              computedStyle.backgroundColor &&
              computedStyle.backgroundColor.includes("oklch")
            ) {
              el.style.backgroundColor = "#ffffff"; // Fallback to white
            }
            if (
              computedStyle.borderColor &&
              computedStyle.borderColor.includes("oklch")
            ) {
              el.style.borderColor = "#000000"; // Fallback to black
            }
          });
        },
      });
    } catch (error) {
      console.error("Canvas preparation error:", error);
      setError("Failed to prepare certificate for export.");
      return null;
    }
  };

  const downloadCertificate = async () => {
    try {
      setMessage("Generating PDF...");
      const canvas = await prepareCanvasForExport();
      if (!canvas) throw new Error("Canvas generation failed");

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth() - 20;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 10, 10, pdfWidth, pdfHeight);
      pdf.save(`Vendor_License_${vendorData?.license?.licenseNumber || "Certificate"}.pdf`);
      setMessage("PDF downloaded successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Error generating PDF:", err);
      setError("Failed to generate PDF.");
      setTimeout(() => setError(""), 5000);
    }
  };

  const printCertificate = async () => {
    try {
      setMessage("Preparing for print...");
      const canvas = await prepareCanvasForExport();
      if (!canvas) throw new Error("Canvas generation failed");

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
              body { margin: 0; padding: 0; }
              img { max-width: 100%; height: auto; }
              @media print {
                body { margin: 0; padding: 0; }
                img { width: 100%; }
              }
            </style>
          </head>
          <body>
            <img src="${imgData}" alt="License Certificate" />
            <script>
              window.onload = function() {
                window.print();
                setTimeout(() => window.close(), 100);
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
      setError("Failed to print certificate.");
      setTimeout(() => setError(""), 5000);
    }
  };

  if (loading) {
    return <div className="text-center text-gray-600">Loading...</div>;
  }

  const vendorPhotoUrl = vendorData?.license?.documents?.vendorPhoto
    ? getImageUrl(vendorData.license.documents.vendorPhoto)
    : vendorData?.license?.vendorPhotoUrl
    ? getImageUrl(vendorData.license.vendorPhotoUrl)
    : PLACEHOLDER_IMAGE;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-md p-8">
        <h3 className="text-2xl font-semibold text-gray-800 mb-6">Business License Application</h3>

        {error && <p className="mb-4 p-2 bg-red-50 text-red-700 border-l-4 border-red-500 rounded">{error}</p>}
        {message && <p className="mb-4 p-2 bg-green-50 text-green-700 border-l-4 border-green-500 rounded">{message}</p>}

        {licenseStatus === "not issued" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-medium mb-1">Aadhaar ID *</label>
              <input
                type="text"
                name="aadhaarID"
                value={formData.aadhaarID}
                onChange={handleChange}
                placeholder="12-digit Aadhaar ID"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">PAN Number *</label>
              <input
                type="text"
                name="panNumber"
                value={formData.panNumber}
                onChange={handleChange}
                placeholder="e.g., ABCDE1234F"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">GST Number</label>
              <input
                type="text"
                name="gstNumber"
                value={formData.gstNumber}
                onChange={handleChange}
                placeholder="GST Number (if applicable)"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Years in Business</label>
              <input
                type="number"
                name="yearsInBusiness"
                value={formData.yearsInBusiness}
                onChange={handleChange}
                placeholder="Years in Business"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Business Name *</label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                placeholder="Business Name"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Business Description</label>
              <textarea
                name="businessDescription"
                value={formData.businessDescription}
                onChange={handleChange}
                placeholder="Business Description"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Shop Photo *</label>
              <input
                type="file"
                name="shopPhoto"
                onChange={handleFileChange}
                accept="image/*"
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
              />
              <p className="text-sm text-gray-500 mt-1">Max size: 2MB</p>
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Vendor Photo *</label>
              <input
                type="file"
                name="vendorPhoto"
                onChange={handleFileChange}
                accept="image/*"
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
              />
              <p className="text-sm text-gray-500 mt-1">Max size: 2MB</p>
            </div>
          </div>
        ) : licenseStatus === "requested" ? (
          <p className="text-yellow-600 font-semibold">License application pending approval by admin...</p>
        ) : vendorData?.license ? (
          <div>
            <p className="text-green-600 font-semibold mb-4">License Approved</p>
            <div
              ref={certificateRef}
              className="relative border-4 border-blue-600 p-8 bg-white shadow-lg text-black"
              style={{ fontFamily: "'Times New Roman', serif", position: "relative", width: "210mm", height: "297mm" }}
            >
              {/* Watermark */}
              <div
                className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none"
                style={{ zIndex: 0 }}
              >
                <img
                  src="http://localhost:5000/images/watermark.png" // Replace with actual watermark URL
                  alt="Government Watermark"
                  className="w-3/4 h-3/4 object-contain"
                  onLoad={() => handleImageLoad("watermark")}
                  onError={(e) => handleImageError("watermark", e)}
                />
              </div>

              {/* Header */}
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-4xl font-bold">Government of India</h2>
                  <p className="text-xl text-gray-700">Ministry of Commerce and Industry</p>
                  <p className="text-sm text-gray-600">Vendor Licensing Authority</p>
                </div>
                <img
                  src="http://localhost:5000/images/govt-emblem.png" // Replace with actual emblem URL
                  alt="Government Emblem"
                  className="w-20 h-20 object-contain"
                  onLoad={() => handleImageLoad("emblem")}
                  onError={(e) => handleImageError("emblem", e)}
                />
              </div>

              <hr className="border-t-2 border-gray-400 mb-8" />

              {/* Certificate Title */}
              <h3 className="text-3xl font-semibold text-center mb-8">Vendor License Certificate</h3>

              {/* Vendor Photo */}
              <div className="flex justify-center mb-8">
                {vendorPhotoUrl ? (
                  <img
                    src={vendorPhotoUrl}
                    alt="Vendor Photo"
                    className="w-40 h-40 border-2 border-gray-500 rounded-full object-cover"
                    onLoad={() => handleImageLoad("vendorPhoto")}
                    onError={(e) => handleImageError("vendorPhoto", e)}
                  />
                ) : (
                  <div className="w-40 h-40 border-2 border-gray-500 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-600">Photo N/A</span>
                  </div>
                )}
              </div>

              {/* Certificate Body */}
              <div className="text-lg space-y-4">
                <p className="text-center">This is to certify that</p>
                <p className="text-center text-2xl font-bold">{vendorData.name}</p>
                <p className="text-center">operating</p>
                <p className="text-center text-xl font-semibold">{vendorData.license.documents.businessName}</p>
                <p className="text-center">has been granted a Vendor License under the authority of the Government of India.</p>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <p><strong>License Number:</strong> {vendorData.license.licenseNumber}</p>
                  <p><strong>Shop ID:</strong> {vendorData.shopID}</p>
                  <p><strong>Aadhaar ID:</strong> {vendorData.license.documents.aadhaarID}</p>
                  <p><strong>PAN Number:</strong> {vendorData.license.documents.panNumber}</p>
                  <p><strong>GST Number:</strong> {vendorData.license.documents.gstNumber || "N/A"}</p>
                  <p><strong>Category:</strong> {vendorData.category || "N/A"}</p>
                  <p><strong>Years in Business:</strong> {vendorData.license.documents.yearsInBusiness || "N/A"}</p>
                  <p><strong>Issued On:</strong> {new Date(vendorData.license.approvedAt).toLocaleDateString()}</p>
                </div>
                <p><strong>Business Description:</strong> {vendorData.license.documents.businessDescription || "N/A"}</p>
              </div>

              {/* Footer */}
              <div className="absolute bottom-8 left-0 right-0 px-8">
                <hr className="border-t-2 border-gray-400 mb-4" />
                <div className="flex justify-between items-center">
                  <div className="text-center">
                    <p className="font-semibold">Authorized Signatory</p>
                    <p className="text-sm text-gray-600">Vendor Licensing Authority</p>
                  </div>
                  <img
                    src="http://localhost:5000/images/official-seal.png" // Replace with actual seal URL
                    alt="Official Seal"
                    className="w-24 h-24 object-contain"
                    onLoad={() => handleImageLoad("seal")}
                    onError={(e) => handleImageError("seal", e)}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-center gap-4">
              <button
                onClick={downloadCertificate}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Download PDF
              </button>
              <button
                onClick={printCertificate}
                className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Print Certificate
              </button>
            </div>
          </div>
        ) : (
          <p className="text-red-600 font-semibold">License data unavailable.</p>
        )}

        {licenseStatus === "not issued" && (
          <button
            onClick={applyForLicense}
            className={`mt-6 w-full py-3 rounded-md text-white font-medium ${
              loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
            disabled={loading}
          >
            {loading ? "Applying..." : "Apply for License"}
          </button>
        )}
      </div>
    </div>
  );
};

export default LicenseApplication;