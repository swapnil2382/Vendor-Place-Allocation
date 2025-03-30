import { useState } from "react";
import { QrReader } from "@blackbox-vision/react-qr-reader";

function QRScanner({ onScan }) {
    const [result, setResult] = useState("");

    const handleScan = (data) => {
        if (data) {
            setResult(data);
            onScan(data);
        }
    };

    const handleError = (err) => {
        console.error("QR Scan Error:", err);
    };

    return (
        <div className="p-4 border rounded">
            <QrReader
                constraints={{ facingMode: "environment" }}
                onResult={(result, error) => {
                    if (result) handleScan(result?.text);
                    if (error) handleError(error);
                }}
                containerStyle={{ width: "100%" }}
            />
            <p className="mt-2">Scanned: {result}</p>
        </div>
    );
}

export default QRScanner;
