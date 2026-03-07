import { useState, useEffect } from "react";

const SIZES = [
  { label: "30 × 40 cm", price: 79 },
  { label: "40 × 50 cm", price: 119 },
  { label: "50 × 70 cm", price: 169 },
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

export default function ProductSelector({ imageUrl, title, slug, digitalPrice }) {
  const [type, setType] = useState("digital");
  const [sizeIdx, setSizeIdx] = useState(0);
  const [borderIdx, setBorderIdx] = useState(2);
  const [loading, setLoading] = useState(false);
  const [textPosition, setTextPosition] = useState("bottom");
  const [customText, setCustomText] = useState(title);
  const [editingText, setEditingText] = useState(false);
  const [naturalRatio, setNaturalRatio] = useState(null);

  const size = SIZES[sizeIdx];
  const border = BORDERS[borderIdx];
  const showDigital = type === "digital" || type === "both";
  const showPrint = type === "print" || type === "both";

  const BOTH_DISCOUNT = 0.85;
  const totalPrice = (() => {
    if (type === "digital") return digitalPrice;
    if (type === "print") return size.price;
    return Math.round((digitalPrice + size.price) * BOTH_DISCOUNT);
  })();

  useEffect(() => {
    const img = new Image();
    img.onload = () => setNaturalRatio(img.naturalWidth / img.naturalHeight);
    img.src = imageUrl;
  }, [imageUrl]);

  const maxSize = 260;
  const ratio = naturalRatio ?? 3 / 4;
  const isLandscape = ratio > 1;
  const displayW = isLandscape ? maxSize : maxSize * ratio;
  const displayH = isLandscape ? maxSize / ratio : maxSize;
  const borderPx = (border.value / 100) * displayH;
  const photoH = displayH - borderPx * 2;
  const photoW = displayW - borderPx * 2;

  const textTop = textPosition === "top" ? borderPx + photoH * 0.06 : 
                  textPosition === "center" ? borderPx + photoH * 0.45 : 
                  borderPx + photoH * 0.82;

  async function handleBuy() {
    setLoading(true);
    let label = title;
    if (type === "print") label = `${title} — Print ${size.label} (${border.label})`;
    if (type === "both") label = `${title} — Digital + Print ${size.label} (${border.label})`;
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: label, price: totalPrice, slug }),
    });
    const { url } = await res.json();
    window.location.href = url;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Type selector */}
      <div>
        <p style={{ fontSize: 9, letterSpacing: "0.4em", textTransform: "uppercase", color: "#555", marginBottom: 12 }}>
          What would you like?
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          {TYPES.map((t) => (
            <button key={t.id} onClick={() => setType(t.id)} style={{
              flex: 1, background: "none",
              border: `1px solid ${type === t.id ? "#888" : "#222"}`,
              color: type === t.id ? "#fff" : "#555",
              padding: "12px 8px", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              transition: "all 0.15s", position: "relative",
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
        <div style={{ border: "1px solid #1a1a1a", padding: 14, display: "flex", flexDirection: "column", gap: 6 }}>
          <p style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: "0.35em", marginBottom: 4 }}>Digital file</p>
          {["High resolution JPEG", "Instant download after purchase", "Personal use license"].map((item, i) => (
            <p key={i} style={{ fontSize: 11, color: "#888", margin: 0 }}>✓ {item}</p>
          ))}
        </div>
      )}

      {/* Print options */}
      {showPrint && (
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>

          {/* Preview */}
          <div style={{ flexShrink: 0 }}>
            <div style={{
              width: displayW + 14, height: displayH + 14,
              background: "#111", border: "2px solid #1e1e1e",
              boxShadow: "0 12px 40px rgba(0,0,0,0.7)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{
                width: displayW, height: displayH,
                background: "#f5f2ee", position: "relative",
                overflow: "hidden", transition: "all 0.3s ease",
              }}>
                <img src={imageUrl} alt={title} style={{
                  position: "absolute", top: borderPx, left: borderPx,
                  width: photoW, height: photoH,
                  objectFit: "cover", transition: "all 0.3s ease", display: "block",
                }} />
                {textPosition !== "none" && customText && (
                  <div style={{
                    position: "absolute",
                    top: textTop,
                    left: borderPx, width: photoW,
                    textAlign: "center",
                    fontFamily: "Helvetica Neue, Helvetica, sans-serif",
                    fontSize: 8, letterSpacing: "0.4em",
                    fontWeight: 300, textTransform: "uppercase",
                    color: "rgba(240,235,225,0.85)",
                    pointerEvents: "none",
                    textShadow: "0 1px 3px rgba(0,0,0,0.5)",
                    transition: "top 0.3s ease",
                  }}>
                    {customText}
                  </div>
                )}
              </div>
            </div>
            <p style={{ fontSize: 9, color: "#444", letterSpacing: "0.3em", textTransform: "uppercase", marginTop: 8, textAlign: "center" }}>
              {size.label} · {border.label}
            </p>
          </div>

          {/* Controls */}
          <div style={{ flex: 1, minWidth: 180, display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Size */}
            <div>
              <p style={{ fontSize: 9, letterSpacing: "0.35em", textTransform: "uppercase", color: "#555", marginBottom: 8 }}>Size</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {SIZES.map((s, i) => (
                  <button key={i} onClick={() => setSizeIdx(i)} style={{
                    background: "none", border: `1px solid ${sizeIdx === i ? "#666" : "#222"}`,
                    color: sizeIdx === i ? "#fff" : "#555",
                    padding: "9px 12px", cursor: "pointer", fontSize: 11,
                    textAlign: "left", display: "flex", justifyContent: "space-between", transition: "all 0.15s",
                  }}>
                    <span>{s.label}</span>
                    <span style={{ color: sizeIdx === i ? "#aaa" : "#444" }}>{s.price}€</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Border */}
            <div>
              <p style={{ fontSize: 9, letterSpacing: "0.35em", textTransform: "uppercase", color: "#555", marginBottom: 8 }}>Border</p>
              <div style={{ display: "flex", gap: 5 }}>
                {BORDERS.map((b, i) => (
                  <button key={i} onClick={() => setBorderIdx(i)} style={{
                    background: "none", border: `1px solid ${borderIdx === i ? "#666" : "#222"}`,
                    color: borderIdx === i ? "#fff" : "#555",
                    padding: "8px 10px", cursor: "pointer", fontSize: 10, flex: 1, transition: "all 0.15s",
                  }}>
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Text on print */}
            <div>
              <p style={{ fontSize: 9, letterSpacing: "0.35em", textTransform: "uppercase", color: "#555", marginBottom: 8 }}>Title on print</p>
              <div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
                {TEXT_POSITIONS.map((p) => (
                  <button key={p.id} onClick={() => setTextPosition(p.id)} style={{
                    background: "none", border: `1px solid ${textPosition === p.id ? "#666" : "#222"}`,
                    color: textPosition === p.id ? "#fff" : "#555",
                    padding: "6px 8px", cursor: "pointer", fontSize: 10, flex: 1, transition: "all 0.15s",
                  }}>
                    {p.label}
                  </button>
                ))}
              </div>
              {textPosition !== "none" && (
                editingText ? (
                  <input
                    autoFocus
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    onBlur={() => setEditingText(false)}
                    style={{
                      width: "100%", background: "#111", border: "1px solid #333",
                      color: "#fff", padding: "7px 10px", fontSize: 11,
                      letterSpacing: "0.05em", outline: "none", boxSizing: "border-box",
                    }}
                  />
                ) : (
                  <button onClick={() => setEditingText(true)} style={{
                    width: "100%", background: "none", border: "1px solid #1a1a1a",
                    color: customText ? "#888" : "#444", padding: "7px 10px",
                    fontSize: 11, textAlign: "left", cursor: "pointer",
                    letterSpacing: "0.05em",
                  }}>
                    {customText || "Click to add title…"}
                  </button>
                )
              )}
            </div>

            {/* Print includes */}
            <div style={{ border: "1px solid #1a1a1a", padding: 12, display: "flex", flexDirection: "column", gap: 5 }}>
              <p style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: "0.35em", marginBottom: 2 }}>Print includes</p>
              {["Hahnemühle Photo Rag 308gsm", "Rolled in archival tube", "Signed & numbered", "Ships in 5–7 days"].map((item, i) => (
                <p key={i} style={{ fontSize: 11, color: "#888", margin: 0 }}>✓ {item}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Price + CTA */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, paddingTop: 8 }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 30, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{totalPrice}€</span>
          {type === "both" && (
            <span style={{ fontSize: 10, color: "#666", letterSpacing: "0.2em", marginTop: 3 }}>
              vs {digitalPrice + size.price}€ separately
            </span>
          )}
        </div>
        <button onClick={handleBuy} disabled={loading} style={{
          flex: 1, background: loading ? "#222" : "#fff",
          color: loading ? "#555" : "#000", border: "none",
          padding: "14px 20px", fontSize: 11, fontWeight: 700,
          letterSpacing: "0.3em", textTransform: "uppercase",
          cursor: loading ? "not-allowed" : "pointer", transition: "all 0.15s",
        }}>
          {loading ? "Loading..." : type === "digital" ? "Buy Digital" : type === "print" ? "Order Print" : "Get Both"}
        </button>
      </div>

    </div>
  );
}