import { useState, useEffect, useRef } from "react";

const SIZES = [
  { label: "30 × 40 cm", price: 79, name: "Standard Portrait", widthMm: 300, heightMm: 400 },
  { label: "40 × 50 cm", price: 119, name: "Large Portrait", widthMm: 400, heightMm: 500 },
  { label: "50 × 70 cm", price: 169, name: "Statement", widthMm: 500, heightMm: 700 },
];

const BORDERS = [
  { label: "Full bleed", value: 0 },
  { label: "Narrow", value: 4 },
  { label: "Classic", value: 8 },
];

const TYPES = [
  { id: "digital", label: "Digital", sub: "Instant download" },
  { id: "print", label: "Print", sub: "Shipped to you" },
  { id: "both", label: "Both", sub: "Best value" },
];

const TEXT_POSITIONS = [
  { id: "none", label: "None" },
  { id: "top", label: "Top" },
  { id: "center", label: "Center" },
  { id: "bottom", label: "Bottom" },
];

const FONTS = [
  { label: "Minimal Sans", style: { fontFamily: "Helvetica Neue, Helvetica, sans-serif", letterSpacing: "0.35em", fontWeight: 200, fontSize: "clamp(7px, 1vw, 11px)", textTransform: "uppercase" } },
  { label: "Sparse Caps", style: { fontFamily: "Georgia, serif", letterSpacing: "0.4em", fontWeight: 300, fontSize: "clamp(8px, 1.1vw, 12px)", textTransform: "uppercase" } },
  { label: "Thin Serif", style: { fontFamily: "Georgia, serif", letterSpacing: "0.15em", fontWeight: 400, fontSize: "clamp(9px, 1.3vw, 14px)", fontStyle: "italic" } },
];

const btn = (active) => ({
  background: "none",
  border: `1px solid ${active ? "#666" : "#222"}`,
  color: active ? "#fff" : "#555",
  cursor: "pointer",
  transition: "all 0.15s",
});

export default function PhotoDetail({ photo }) {
  const [type, setType] = useState("digital");
  const [sizeIdx, setSizeIdx] = useState(0);
  const [borderIdx, setBorderIdx] = useState(2);
  const [textPosition, setTextPosition] = useState("bottom");
  const [customText, setCustomText] = useState(photo.title);
  const [editingText, setEditingText] = useState(false);
  const [fontIdx, setFontIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showSpecs, setShowSpecs] = useState(false);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [isLandscape, setIsLandscape] = useState(() =>
    photo.imageWidth != null && photo.imageHeight != null
      ? photo.imageWidth > photo.imageHeight
      : false
  );
  const imgRef = useRef(null);

  // Keep isLandscape in sync when photo changes (e.g. client-side navigation to another photo)
  useEffect(() => {
    if (photo.imageWidth != null && photo.imageHeight != null) {
      setIsLandscape(photo.imageWidth > photo.imageHeight);
    }
  }, [photo.imageWidth, photo.imageHeight]);

  useEffect(() => {
    if (imgRef.current) {
      setImgSize({ w: imgRef.current.offsetWidth, h: imgRef.current.offsetHeight });
    }
  }, []);

  // Sync orientation when image loads (handles cached images where onLoad may have already fired)
  useEffect(() => {
    const img = imgRef.current;
    if (!img || !photo.imageUrl) return;
    const syncOrientation = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setIsLandscape(img.naturalWidth > img.naturalHeight);
      }
    };
    if (img.complete) syncOrientation();
    img.addEventListener("load", syncOrientation);
    return () => img.removeEventListener("load", syncOrientation);
  }, [photo.imageUrl]);

  const size = SIZES[sizeIdx];
  const border = BORDERS[borderIdx];
  const showDigital = type === "digital" || type === "both";
  const showPrint = type === "print" || type === "both";

  const BOTH_DISCOUNT = 0.85;
  const totalPrice = (() => {
    if (type === "digital") return photo.price;
    if (type === "print") return size.price;
    return Math.round((photo.price + size.price) * BOTH_DISCOUNT);
  })();

  // Border as fraction of image height
  const borderFrac = border.value / 100;
  const borderPx = imgSize.h * borderFrac;

  // Print specs (for Specs panel, matches original guide)
  const printSpecs = {
    canvas: `${size.label} @ 300 DPI`,
    border: border.value === 0
      ? "No border (full bleed)"
      : `${Math.round((border.value / 100) * size.heightMm)} mm white border`,
    textPos: textPosition === "none"
      ? "No text"
      : textPosition === "top"
        ? "8% from top of photo"
        : textPosition === "center"
          ? "48% from top (centred)"
          : "84% from top of photo",
    textSize: `${Math.round((size.heightMm / 100) * 1.4)} px at 300 DPI (≈ ${Math.round((size.heightMm / 100) * 1.4 * 0.35)} mm)`,
    tracking: FONTS[fontIdx].style.letterSpacing,
    frame: "Thin black aluminium, 8–12 mm profile",
  };

  const PHOTOSHOP_WORKFLOW = [
    "New document at 300 DPI, canvas = print size",
    "Place your photo, leave white border around it",
    "Add text layer on top of the photo (not on border)",
    "Set text color to #E8E3D5 or #FFFFFF, opacity 80–90%",
    "Export as TIFF or high-quality JPEG (quality 12)",
    "Send to lab or print directly",
  ];

  // Text vertical position inside image
  const textTopPct =
    textPosition === "top" ? 8 :
      textPosition === "center" ? 48 :
        84;

  async function handleBuy() {
    setLoading(true);
    let label = photo.title;
    if (type === "print") label = `${photo.title} — Print ${size.label} (${border.label}${textPosition !== "none" ? `, title ${textPosition}: "${customText}"` : ""})`;
    if (type === "both") label = `${photo.title} — Digital + Print ${size.label} (${border.label}${textPosition !== "none" ? `, title ${textPosition}: "${customText}"` : ""})`;
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: label, price: totalPrice, slug: photo.slug }),
    });
    const { url } = await res.json();
    window.location.href = url;
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2.5rem 2rem", display: "grid", gridTemplateColumns: "1fr 420px", gap: "4rem", alignItems: "start" }}>

{/* LEFT — sticky image with live preview */}
      <div style={{ position: "sticky", top: 80, alignSelf: "start" }}>
        {/* Frame shadow + frame (from original guide) when print is selected */}
        <div style={{
          position: "relative",
          ...(showPrint && {
            boxShadow: "0 20px 60px rgba(0,0,0,0.8), 0 4px 12px rgba(0,0,0,0.6)",
            background: "#111",
            border: "3px solid #1a1a1a",
            padding: 12,
          }),
        }}>
          {/* Outer container — white background for border, aspect ratio for size */}
          <div style={{
            position: "relative",
            width: "100%",
            aspectRatio: isLandscape
              ? ["4/3", "5/4", "7/5"][sizeIdx]
              : ["3/4", "4/5", "5/7"][sizeIdx],
            background: showPrint ? "#f5f2ee" : "#000",
            transition: "aspect-ratio 0.4s ease, background 0.3s ease",
            overflow: "hidden",
          }}>

            {/* Image — inset by border amount */}
            <img
              ref={imgRef}
              onLoad={() => {
                if (imgRef.current) {
                  const w = imgRef.current.naturalWidth;
                  const h = imgRef.current.naturalHeight;
                  setIsLandscape(w > h);
                  setImgSize({ w: imgRef.current.offsetWidth, h: imgRef.current.offsetHeight });
                }
              }}
              src={photo.imageUrl}
              alt={photo.title}
              style={{
                position: "absolute",
                top: `${showPrint ? borderFrac * 100 : 0}%`,
                left: `${showPrint ? borderFrac * 100 : 0}%`,
                width: `${showPrint ? (1 - borderFrac * 2) * 100 : 100}%`,
                height: `${showPrint ? (1 - borderFrac * 2) * 100 : 100}%`,
                objectFit: "cover",
                display: "block",
                transition: "all 0.35s ease",
              }}
            />

            {/* Title overlay */}
            {showPrint && textPosition !== "none" && customText && (
              <div style={{
                position: "absolute",
                top: `${textTopPct}%`,
                left: `${borderFrac * 100 + 2}%`,
                width: `${(1 - borderFrac * 2) * 100 - 4}%`,
                textAlign: "center",
                ...FONTS[fontIdx].style,
                color: "rgba(240, 235, 225, 0.9)",
                pointerEvents: "none",
                textShadow: "0 1px 4px rgba(0,0,0,0.6)",
                transition: "top 0.3s ease",
              }}>
                {customText}
              </div>
            )}

            {/* Size label */}
            {showPrint && (
              <div style={{
                position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)",
                fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase",
                color: "rgba(80,80,80,0.6)", pointerEvents: "none", whiteSpace: "nowrap",
              }}>
                {size.label} · {size.name} · {BORDERS[borderIdx].label}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT — controls */}
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

        {/* Title + location */}
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, margin: "0 0 8px" }}>{photo.title}</h1>
          <p style={{ fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#6b7280", margin: 0 }}>{photo.location}</p>
        </div>

        {photo.description && (
          <p style={{ color: "#9ca3af", lineHeight: 1.7, fontSize: "0.9rem", margin: 0 }}>{photo.description}</p>
        )}

        {/* Type selector */}
        <div>
          <p style={{ fontSize: 9, letterSpacing: "0.4em", textTransform: "uppercase", color: "#555", marginBottom: 12 }}>What would you like?</p>
          <div style={{ display: "flex", gap: 8 }}>
            {TYPES.map((t) => (
              <button key={t.id} onClick={() => setType(t.id)} style={{
                ...btn(type === t.id),
                flex: 1, padding: "12px 8px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                position: "relative",
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em" }}>{t.label}</span>
                <span style={{ fontSize: 9, color: type === t.id ? "#888" : "#444", letterSpacing: "0.2em", textTransform: "uppercase" }}>{t.sub}</span>
                {t.id === "both" && (
                  <span style={{ position: "absolute", top: -8, right: -1, background: "#fff", color: "#000", fontSize: 8, fontWeight: 700, letterSpacing: "0.15em", padding: "2px 6px", textTransform: "uppercase" }}>−15%</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Digital info */}
        {showDigital && (
          <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: 20, display: "flex", flexDirection: "column", gap: 5 }}>
            <p style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: "0.35em", marginBottom: 8 }}>Digital file</p>
            {["High resolution JPEG", "Instant download after purchase", "Personal use license"].map((item, i) => (
              <p key={i} style={{ fontSize: 11, color: "#888", margin: 0 }}>✓ {item}</p>
            ))}
          </div>
        )}

        {/* Print options */}
        {showPrint && (
          <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: 20, display: "flex", flexDirection: "column", gap: 20 }}>

            <div>
              <p style={{ fontSize: 9, letterSpacing: "0.35em", textTransform: "uppercase", color: "#555", marginBottom: 10 }}>Size</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {SIZES.map((s, i) => (
                  <button key={i} onClick={() => setSizeIdx(i)} style={{
                    ...btn(sizeIdx === i), padding: "10px 14px", fontSize: 11,
                    textAlign: "left", display: "flex", flexDirection: "column", alignItems: "stretch", gap: 2,
                  }}>
                    <span style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 500 }}>{s.label}</span>
                      <span style={{ color: sizeIdx === i ? "#aaa" : "#444", letterSpacing: "0.1em" }}>{s.price}€</span>
                    </span>
                    <span style={{ fontSize: 9, color: "#555", letterSpacing: "0.2em" }}>{s.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p style={{ fontSize: 9, letterSpacing: "0.35em", textTransform: "uppercase", color: "#555", marginBottom: 10 }}>Border</p>
              <div style={{ display: "flex", gap: 6 }}>
                {BORDERS.map((b, i) => (
                  <button key={i} onClick={() => setBorderIdx(i)} style={{
                    ...btn(borderIdx === i), padding: "9px 12px", fontSize: 10, flex: 1,
                  }}>
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p style={{ fontSize: 9, letterSpacing: "0.35em", textTransform: "uppercase", color: "#555", marginBottom: 10 }}>Title on print</p>
              <div style={{ display: "flex", gap: 6, marginBottom: textPosition !== "none" ? 10 : 0 }}>
                {TEXT_POSITIONS.map((p) => (
                  <button key={p.id} onClick={() => setTextPosition(p.id)} style={{
                    ...btn(textPosition === p.id), padding: "8px 10px", fontSize: 10, flex: 1,
                  }}>
                    {p.label}
                  </button>
                ))}
              </div>
              {textPosition !== "none" && (
                editingText ? (
                  <input autoFocus value={customText} onChange={(e) => setCustomText(e.target.value)}
                    onBlur={() => setEditingText(false)}
                    style={{ width: "100%", background: "#111", border: "1px solid #333", color: "#fff", padding: "9px 12px", fontSize: 11, letterSpacing: "0.05em", outline: "none", boxSizing: "border-box" }}
                  />
                ) : (
                  <button onClick={() => setEditingText(true)} style={{
                    width: "100%", background: "none", border: "1px solid #1a1a1a",
                    color: customText ? "#888" : "#444", padding: "9px 12px",
                    fontSize: 11, textAlign: "left", cursor: "pointer",
                    letterSpacing: "0.05em", boxSizing: "border-box",
                  }}>
                    {customText || "Click to add title…"}
                  </button>
                )
              )}
            </div>

            {/* Typography */}
            <div>
              <p style={{ fontSize: 9, letterSpacing: "0.35em", textTransform: "uppercase", color: "#555", marginBottom: 10 }}>Typography</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {FONTS.map((f, i) => (
                  <button key={i} onClick={() => setFontIdx(i)} style={{
                    ...btn(fontIdx === i),
                    padding: "9px 14px", fontSize: 11, textAlign: "left",
                  }}>
                    <span style={{ ...f.style, fontSize: 11, color: fontIdx === i ? "#fff" : "#555" }}>{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: 16, display: "flex", flexDirection: "column", gap: 5 }}>
              <p style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: "0.35em", marginBottom: 6 }}>Print includes</p>
              {["Hahnemühle Photo Rag 308gsm", "Rolled in archival tube", "Signed & numbered", "Ships in 5–7 days"].map((item, i) => (
                <p key={i} style={{ fontSize: 11, color: "#888", margin: 0 }}>✓ {item}</p>
              ))}
            </div>

            {/* Specs — Photoshop / Lightroom */}
            <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: 16 }}>
              <button
                type="button"
                onClick={() => setShowSpecs(!showSpecs)}
                style={{
                  background: "none", border: "none", cursor: "pointer", padding: 0,
                  fontSize: 9, letterSpacing: "0.4em", textTransform: "uppercase", color: "#555",
                  display: "flex", alignItems: "center", gap: 8,
                }}
              >
                {showSpecs ? "▼" : "▶"} Photoshop / Lightroom specs
              </button>
              {showSpecs && (
                <div style={{ marginTop: 16 }}>
                  {[
                    ["Canvas", printSpecs.canvas],
                    ["White border", printSpecs.border],
                    ["Text placement", printSpecs.textPos],
                    ["Approx. text size", printSpecs.textSize],
                    ["Letter spacing", printSpecs.tracking],
                    ["Frame", printSpecs.frame],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", borderBottom: "1px solid #1a1a1a", padding: "10px 0" }}>
                      <div style={{ width: 120, flexShrink: 0, fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: "#555" }}>{k}</div>
                      <div style={{ fontSize: 11, color: "#aaa", letterSpacing: "0.05em" }}>{v}</div>
                    </div>
                  ))}
                  <div style={{ marginTop: 16, padding: 14, border: "1px solid #1a1a1a", background: "#0a0a0a" }}>
                    <p style={{ fontSize: 9, letterSpacing: "0.35em", textTransform: "uppercase", color: "#555", marginBottom: 10 }}>Workflow</p>
                    {PHOTOSHOP_WORKFLOW.map((step, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 9, color: "#444", minWidth: 14 }}>{i + 1}.</span>
                        <span style={{ fontSize: 11, color: "#888", lineHeight: 1.5 }}>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Price + CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, paddingTop: 4 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 32, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{totalPrice}€</span>
            {type === "both" && (
              <span style={{ fontSize: 10, color: "#555", letterSpacing: "0.2em", marginTop: 4 }}>
                vs {photo.price + size.price}€ separately
              </span>
            )}
          </div>
          <button onClick={handleBuy} disabled={loading} style={{
            flex: 1, background: loading ? "#222" : "#fff",
            color: loading ? "#555" : "#000", border: "none",
            padding: "15px 20px", fontSize: 11, fontWeight: 700,
            letterSpacing: "0.3em", textTransform: "uppercase",
            cursor: loading ? "not-allowed" : "pointer", transition: "all 0.15s",
          }}>
            {loading ? "Loading..." : type === "digital" ? "Buy Digital" : type === "print" ? "Order Print" : "Get Both"}
          </button>
        </div>

      </div>
    </div>
  );
}