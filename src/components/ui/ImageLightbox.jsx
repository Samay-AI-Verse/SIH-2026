import { useState } from "react";
import { X, ExternalLink, Download, ZoomIn, ZoomOut, RotateCw } from "lucide-react";

export function ImageLightbox({ imageUrl, title = "Payment Proof Screenshot", onClose }) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!imageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 text-white">
        <div>
          <h3 className="font-display text-2xl text-gold">{title}</h3>
          <p className="text-xs font-bold text-slate-300">Click and inspect UPI / Cash payment receipt details</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Controls */}
          <button
            onClick={() => setScale((prev) => Math.min(prev + 0.25, 3))}
            className="rounded-xl border border-white/20 bg-white/10 p-2 text-white hover:bg-white/20 transition"
            title="Zoom In"
          >
            <ZoomIn size={18} />
          </button>
          <button
            onClick={() => setScale((prev) => Math.max(prev - 0.25, 0.5))}
            className="rounded-xl border border-white/20 bg-white/10 p-2 text-white hover:bg-white/20 transition"
            title="Zoom Out"
          >
            <ZoomOut size={18} />
          </button>
          <button
            onClick={() => setRotation((prev) => (prev + 90) % 360)}
            className="rounded-xl border border-white/20 bg-white/10 p-2 text-white hover:bg-white/20 transition"
            title="Rotate"
          >
            <RotateCw size={18} />
          </button>

          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-xl border border-gold bg-gold/20 px-3 py-2 text-xs font-black text-gold hover:bg-gold hover:text-web transition"
            title="Open in new tab"
          >
            <ExternalLink size={14} /> Open Full <span className="hidden sm:inline">Image</span>
          </a>

          <button
            onClick={onClose}
            className="rounded-full border-2 border-white/40 bg-white/10 p-2 text-white hover:bg-rose-600 transition"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Image Container */}
      <div className="relative max-w-5xl max-h-[80vh] w-full h-full flex items-center justify-center overflow-auto p-4">
        <img
          src={imageUrl}
          alt={title}
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
            transition: "transform 0.2s ease-out",
          }}
          className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl border-4 border-web/40 cursor-grab active:cursor-grabbing"
        />
      </div>
    </div>
  );
}
