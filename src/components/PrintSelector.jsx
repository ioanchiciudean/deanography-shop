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

const btn = (active) => ({
  background: "none",
  border: `1px solid ${active ? "#666" : "#222"}`,
  color: active ? "#fff" : "#555",
  cursor: "pointer",
  transition: "all 0.15s",
});

export default function ProductSelector({ imageUrl, title, slug, digitalPrice }) {
  const [type, setType] = useState("digital");
  const [sizeIdx, setSizeIdx] = useState(0);
  const [borderIdx, setBorderIdx] = useState(2);
  const [textPosition, setTextPosition] = useState("bottom");
  const [customText, setCustomText] = useState(title);
  const [editingText, setEditingText] = useState(false);
  const [loading, setLoading] = useState(false);

  const size = SIZES[sizeIdx];
  const showDigital = type === "digital" || type === "both";
  const showPrint = type === "print" || type === "both";

  const BOTH_DISCOUNT = 0.85;
  const totalPrice = (() => {
    if (type === "digital") return digitalPrice;
    if (type === "print") return size.price;
    return Math.round((digitalPrice + size.price) * BOTH_DISCOUNT);
  })();

  async function handleBuy() {
    setLoading(true);
    let label = title;
    if (type === "print") label = `${title} — Print ${size.label} (${BORDERS[borderIdx].label}${textPosition !== "none" ? `, title ${textPosition}: "${customText}"` : ""})`;
    if (type === "both") label = `${title} — Digital + Print ${size.label} (${BORDERS[borderIdx].label}${textPosition !== "none" ? `, title ${textPosition}: "${customText}"` : ""})`;
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: label, price: totalPrice, slug }),
    });
    const { url } = await res.json();
    window.location.href = url;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* Type selector */}
      <div>
        <p style={{ fontSize: 9, letterSpacing: "0.4em", textTransform: "uppercase", color: "#555", marginBottom: 12 }}>
          What would you like?
        </p>
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

          {/* Size */}
          <div>
            <p style={{ fontSize: 9, letterSpacing: "0.35em", textTransform: "uppercase", color: "#555", marginBottom: 10 }}>Size</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {SIZES.map((s, i) => (
                <button key={i} onClick={() => setSizeIdx(i)} style={{
                  ...btn(sizeIdx === i),
                  padding: "10px 14px", fontSize: 11,
                  textAlign: "left", display: "flex", justifyContent: "space-between",
                }}>
                  <span>{s.label}</span>
                  <span style={{ color: sizeIdx === i ? "#aaa" : "#444" }}>{s.price}€</span>
                </button>
              ))}
            </div>
          </div>

          {/* Border */}
          <div>
            <p style={{ fontSize: 9, letterSpacing: "0.35em", textTransform: "uppercase", color: "#555", marginBottom: 10 }}>Border</p>
            <div style={{ display: "flex", gap: 6 }}>
              {BORDERS.map((b, i) => (
                <button key={i} onClick={() => setBorderIdx(i)} style={{
                  ...btn(borderIdx === i),
                  padding: "9px 12px", fontSize: 10, flex: 1,
                }}>
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title on print */}
          <div>
            <p style={{ fontSize: 9, letterSpacing: "0.35em", textTransform: "uppercase", color: "#555", marginBottom: 10 }}>Title on print</p>
            <div style={{ display: "flex", gap: 6, marginBottom: textPosition !== "none" ? 10 : 0 }}>
              {TEXT_POSITIONS.map((p) => (
                <button key={p.id} onClick={() => setTextPosition(p.id)} style={{
                  ...btn(textPosition === p.id),
                  padding: "8px 10px", fontSize: 10, flex: 1,
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
                    color: "#fff", padding: "9px 12px", fontSize: 11,
                    letterSpacing: "0.05em", outline: "none", boxSizing: "border-box",
                  }}
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

          {/* Print includes */}
          <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: 16, display: "flex", flexDirection: "column", gap: 5 }}>
            <p style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: "0.35em", marginBottom: 6 }}>Print includes</p>
            {["Hahnemühle Photo Rag 308gsm", "Rolled in archival tube", "Signed & numbered", "Ships in 5–7 days"].map((item, i) => (
              <p key={i} style={{ fontSize: 11, color: "#888", margin: 0 }}>✓ {item}</p>
            ))}
          </div>

        </div>
      )}

      {/* Price + CTA */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, paddingTop: 4 }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 32, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{totalPrice}€</span>
          {type === "both" && (
            <span style={{ fontSize: 10, color: "#555", letterSpacing: "0.2em", marginTop: 4 }}>
              vs {digitalPrice + size.price}€ separately
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
  );
}