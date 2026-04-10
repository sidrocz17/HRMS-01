// src/components/employee/onboarding/DocumentUploadStep.jsx
import { useState } from "react";

const DOCUMENTS = [
  { key: "pan_card", label: "PAN Card", icon: "📄" },
  { key: "aadhar_card", label: "Aadhaar Card", icon: "🆔" },
  { key: "passport", label: "Passport", icon: "📕" },
  { key: "offer_letter", label: "Offer Letter", icon: "📋" },
  { key: "resume", label: "Resume", icon: "📄" },
];

export default function DocumentUploadStep({ data, errors, onFileUpload }) {
  const [uploadProgress, setUploadProgress] = useState({});

  const handleFileChange = (docKey, file) => {
    if (file) {
      // Simulate progress
      setUploadProgress((prev) => ({ ...prev, [docKey]: 0 }));

      const timer = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = (prev[docKey] || 0) + Math.random() * 30;
          if (newProgress >= 100) {
            clearInterval(timer);
            return { ...prev, [docKey]: 100 };
          }
          return { ...prev, [docKey]: newProgress };
        });
      }, 200);

      onFileUpload(docKey, file);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Document Upload
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          Upload supporting documents (all optional)
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {DOCUMENTS.map((doc) => (
            <div
              key={doc.key}
              className="border-2 border-dashed border-gray-200 rounded-xl p-6 hover:border-[#1a2240] transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-3xl">{doc.icon}</div>
                {data[doc.key] && (
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                    ✓ Uploaded
                  </span>
                )}
              </div>

              <h4 className="font-medium text-gray-900 mb-1">{doc.label}</h4>

              {data[doc.key] ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm text-gray-700">
                      {data[doc.key].name || "File selected"}
                    </span>
                  </div>

                  <label className="block w-full">
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) =>
                        handleFileChange(doc.key, e.target.files?.[0])
                      }
                    />
                    <span className="text-xs font-medium text-[#1a2240] cursor-pointer hover:underline">
                      Replace File
                    </span>
                  </label>
                </div>
              ) : (
                <label className="block w-full cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) =>
                      handleFileChange(doc.key, e.target.files?.[0])
                    }
                  />
                  <div className="text-center py-3">
                    <svg
                      className="w-5 h-5 text-gray-400 mx-auto mb-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <p className="text-xs text-gray-500">
                      Click to upload
                    </p>
                  </div>
                </label>
              )}

              {uploadProgress[doc.key] &&
                uploadProgress[doc.key] < 100 && (
                  <div className="mt-2">
                    <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1a2240] transition-all"
                        style={{ width: `${uploadProgress[doc.key]}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.round(uploadProgress[doc.key])}%
                    </p>
                  </div>
                )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
