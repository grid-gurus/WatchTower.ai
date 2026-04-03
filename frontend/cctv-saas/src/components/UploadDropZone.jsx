import { useState } from "react";

export default function UploadDropZone() {
    const [dragging, setDragging] = useState(false);

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);

        const file = e.dataTransfer.files[0];
        console.log("Uploaded file:", file);
    };

    return (
        <div
            onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-10 text-center transition ${dragging
                ? "border-cyan-400 bg-white/[0.05]"
                : "border-white/10"
                }`}
        >
            <p className="text-gray-400">
                Drag & drop video here or click to upload
            </p>
        </div>
    );
}