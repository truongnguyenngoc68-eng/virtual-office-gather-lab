import { useState, useRef } from "react";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onUploadComplete: (fileUrl: string, fileData: any) => void;
  maxSize?: number; // in bytes
  acceptedTypes?: string[];
}

const FileUpload = ({
  onFileSelect,
  onUploadComplete,
  maxSize = 10 * 1024 * 1024, // 10MB default
  acceptedTypes = ["image/*", "application/pdf", "text/*"],
}: FileUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize) {
      setError(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
      return;
    }

    // Validate file type
    const isValidType = acceptedTypes.some((type) => {
      if (type.endsWith("/*")) {
        return file.type.startsWith(type.slice(0, -1));
      }
      return file.type === type;
    });

    if (!isValidType) {
      setError("File type not allowed");
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      onFileSelect(file);

      // Upload file
      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(percentComplete);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          onUploadComplete(response.file.url, response.file);
          setIsUploading(false);
          setUploadProgress(0);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        } else {
          setError("Upload failed");
          setIsUploading(false);
        }
      });

      xhr.addEventListener("error", () => {
        setError("Upload failed");
        setIsUploading(false);
      });

      xhr.open(
        "POST",
        `${
          import.meta.env.VITE_SERVER_URL || "http://localhost:5001"
        }/api/uploads`
      );
      xhr.send(formData);
    } catch {
      setError("Upload failed");
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative inline-block">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        accept={acceptedTypes.join(",")}
        style={{ display: "none" }}
      />
      <button
        type="button"
        className="bg-transparent border-none cursor-pointer text-xl p-2 text-[#72767d] transition-colors duration-200 rounded flex items-center justify-center hover:text-[#dcddde] hover:bg-[#3c3f44] disabled:opacity-60 disabled:cursor-not-allowed"
        onClick={handleClick}
        disabled={isUploading}
        title="Upload file"
      >
        {isUploading ? (
          <span className="flex items-center gap-1 text-xs">
            <span className="animate-spin">⏳</span>
            {Math.round(uploadProgress)}%
          </span>
        ) : (
          <span>📎</span>
        )}
      </button>
      {error && (
        <div className="absolute bottom-full left-0 bg-[#f04747] text-white px-2 py-1 rounded text-xs whitespace-nowrap mb-1 z-[1000]">
          {error}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
