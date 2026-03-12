import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://uypunathqfvyhuiiisov.supabase.co",
  "sb_publishable_oyW3D5yURCp60CzPuPAfLQ_pcXf4_BI"
);

const C = { bg: "#0A0E1A", card: "#111827", border: "#1E2A3A", accent: "#00D4FF", warm: "#FF6B35", green: "#00E676", text: "#F0F4FF", muted: "#6B7FA3", pill: "#1A2540", sidebar: "#0D1421" };
// ── Allowed email domains ──────────────────────────────────────────────────
const ALLOWED_EMAIL_DOMAINS = [
  "gmail.com",
  "outlook.com","hotmail.com","live.com","msn.com","hotmail.co.uk","live.co.uk",
  "yahoo.com","yahoo.co.uk","yahoo.com.ng","ymail.com",
  "icloud.com","me.com","mac.com",
  "protonmail.com","proton.me","pm.me",
  "zoho.com","aol.com","mail.com","gmx.com","gmx.net","tutanota.com",
  "edu","edu.ng",
];
const isAllowedEmail = (email) => {
  if (!email || !email.includes("@")) return false;
  const domain = email.split("@")[1]?.toLowerCase() || "";
  return ALLOWED_EMAIL_DOMAINS.some(d => domain === d || domain.endsWith("." + d));
};

const CATEGORIES = ["All","Books","Electronics","Appliances","Furniture","Tools","Music","Accessories"];

const getImages = (listing) => {
  try {
    const u = listing?.image_urls;
    if (!u) return [];
    if (Array.isArray(u)) return u;
    if (typeof u === "string") return JSON.parse(u);
    return [];
  } catch { return []; }
};

// ── Shared UI components ─────────────────────────────────────────────────────
const Pill = ({ children, active, color = C.accent, onClick }) => (
  <div onClick={onClick} style={{ background: active ? color : C.pill, color: active ? "#000" : C.muted, border: `1px solid ${active ? color : C.border}`, borderRadius: 20, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", transition: "all .2s" }}>{children}</div>
);
const Input = ({ style, ...props }) => (
  <input style={{ background: C.pill, border: `1px solid ${C.border}`, borderRadius: 12, padding: "13px 16px", color: C.text, fontSize: 15, width: "100%", outline: "none", boxSizing: "border-box", ...style }} {...props} />
);
const Btn = ({ primary, danger, style, children, ...props }) => (
  <button style={{ background: primary ? `linear-gradient(135deg,${C.accent},#0099CC)` : danger ? "#FF555522" : C.pill, color: primary ? "#000" : danger ? "#FF5555" : C.text, border: danger ? "1px solid #FF555544" : "none", borderRadius: 14, padding: "14px 20px", fontSize: 15, fontWeight: 700, cursor: "pointer", width: "100%", transition: "all .2s", ...style }} {...props}>{children}</button>
);
const Avatar = ({ initials, size = 36, src, onClick, style }) => (
  <div onClick={onClick} style={{ width: size, height: size, borderRadius: "50%", background: `linear-gradient(135deg,${C.accent}33,${C.warm}33)`, border: `1.5px solid ${C.accent}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.35, fontWeight: 700, color: C.accent, flexShrink: 0, overflow: "hidden", cursor: onClick ? "pointer" : "default", ...style }}>
    {src ? <img src={src} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
  </div>
);
const Loader = () => (
  <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
    <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
  </div>
);
const Toast = ({ msg, type }) => msg ? (
  <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", background: type === "error" ? "#FF5555" : C.green, color: "#000", borderRadius: 20, padding: "10px 22px", fontSize: 14, fontWeight: 700, zIndex: 9999, whiteSpace: "nowrap", boxShadow: "0 8px 24px rgba(0,0,0,.4)" }}>{msg}</div>
) : null;

const EyeIcon = ({ open }) => open ? (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
) : (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
);

const StarRating = ({ rating, size = 18, color = "#FFD700" }) => (
  <div style={{ display: "flex", gap: 2 }}>
    {[1,2,3,4,5].map(s => (
      <svg key={s} width={size} height={size} viewBox="0 0 24 24" fill={s <= rating ? color : "none"} stroke={color} strokeWidth="1.5">
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
      </svg>
    ))}
  </div>
);

const InteractiveStars = ({ rating, hover, onRate, onHover, onLeave, size = 28 }) => (
  <div style={{ display: "flex", gap: 6 }}>
    {[1,2,3,4,5].map(s => (
      <svg key={s} width={size} height={size} viewBox="0 0 24 24"
        fill={s <= (hover || rating) ? "#FFD700" : "none"}
        stroke={s <= (hover || rating) ? "#FFD700" : C.muted}
        strokeWidth="1.5" style={{ cursor: "pointer", transition: "all .15s", transform: s <= (hover || rating) ? "scale(1.15)" : "scale(1)" }}
        onClick={() => onRate(s)} onMouseEnter={() => onHover(s)} onMouseLeave={onLeave}>
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
      </svg>
    ))}
  </div>
);
const PRIVACY = `1. Information We Collect\nWe collect your full name, campus email, matric number, and information from your listings and messages.\n\n2. How We Use Your Information\nTo verify your campus identity, display your profile, and facilitate buying and selling.\n\n3. Data Sharing\nWe do not sell your personal data. Your info is only visible to users you interact with directly.\n\n4. Data Storage\nAll data is securely stored on Supabase with industry-standard encryption.\n\n5. Your Rights\nYou may request deletion of your account at any time via the Support section.\n\n6. Security\nWe take reasonable measures to protect your data. Use a strong, unique password.\n\n7. Contact\nFor privacy concerns, reach us via the Support section in the app.\n\nLast updated: February 2026`;

const Modal = ({ type, onClose }) => {
  const isTerms = type === "terms";
  const content = isTerms ? TERMS : PRIVACY;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 2000, display: "flex", justifyContent: "center", alignItems: "center", padding: 20 }}>
      <div style={{ background: C.card, borderRadius: 24, width: "100%", maxWidth: 520, maxHeight: "80vh", display: "flex", flexDirection: "column", border: `1px solid ${C.border}`, boxShadow: "0 24px 80px rgba(0,0,0,.6)" }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "'Syne',sans-serif", color: C.text, fontSize: 18, fontWeight: 800 }}>{isTerms ? "📄 Terms of Use" : "🔐 Privacy Policy"}</div>
          <div onClick={onClose} style={{ background: C.pill, borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.muted, fontSize: 14 }}>✕</div>
        </div>
        <div style={{ overflowY: "auto", padding: "16px 24px", flex: 1 }}>
          {content.split("\n\n").map((p, i) => <div key={i} style={{ marginBottom: 14, color: /^\d+\./.test(p) ? C.accent : C.muted, fontSize: /^\d+\./.test(p) ? 14 : 13, fontWeight: /^\d+\./.test(p) ? 700 : 400, lineHeight: 1.7 }}>{p}</div>)}
        </div>
        <div style={{ padding: "14px 24px 20px", borderTop: `1px solid ${C.border}` }}>
          <Btn primary onClick={onClose}>Got it ✓</Btn>
        </div>
      </div>
    </div>
  );
};

const ReviewModal = ({ listing, rating, hover, text, onRate, onHover, onLeave, onTextChange, onSubmit, onClose, loading }) => {
  const LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 2000, display: "flex", justifyContent: "center", alignItems: "center", padding: 20 }}>
      <div style={{ background: C.card, borderRadius: 24, width: "100%", maxWidth: 460, border: `1px solid ${C.border}`, boxShadow: "0 24px 80px rgba(0,0,0,.6)", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "'Syne',sans-serif", color: C.text, fontSize: 18, fontWeight: 800 }}>⭐ Rate this Seller</div>
          <div onClick={onClose} style={{ background: C.pill, borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.muted }}>✕</div>
        </div>
        {/* Listing info */}
        <div style={{ padding: "16px 24px", background: C.pill, margin: "16px 24px 0", borderRadius: 14 }}>
          <div style={{ color: C.muted, fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Reviewing</div>
          <div style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>{listing?.title}</div>
          <div style={{ color: C.accent, fontWeight: 700, marginTop: 2 }}>₦{listing?.price?.toLocaleString()}</div>
        </div>
        {/* Stars */}
        <div style={{ padding: "20px 24px 0", textAlign: "center" }}>
          <div style={{ color: C.muted, fontSize: 13, marginBottom: 14 }}>How was your experience with this seller?</div>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
            <InteractiveStars rating={rating} hover={hover} onRate={onRate} onHover={onHover} onLeave={onLeave} size={36} />
          </div>
          <div style={{ height: 20, color: rating || hover ? "#FFD700" : "transparent", fontWeight: 700, fontSize: 14, transition: "all .2s" }}>
            {LABELS[hover || rating]}
          </div>
        </div>
        {/* Review text */}
        <div style={{ padding: "12px 24px 20px" }}>
          <textarea
            value={text} onChange={e => onTextChange(e.target.value)}
            placeholder="Share your experience — Was the item as described? How was pickup? Would you recommend this seller?"
            style={{ width: "100%", background: C.pill, border: `1px solid ${C.border}`, borderRadius: 12, padding: "13px 16px", color: C.text, fontSize: 14, height: 100, resize: "none", outline: "none", boxSizing: "border-box", lineHeight: 1.6 }}
          />
          <div style={{ marginTop: 12 }}>
            <Btn primary onClick={onSubmit}>{loading ? "Submitting…" : "Submit Review ⭐"}</Btn>
          </div>
        </div>
      </div>
    </div>
  );
};

const ContactEmailModal = ({ userEmail, onClose }) => {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [mailOpened, setMailOpened] = useState(false);
  const [copied, setCopied] = useState(false);
  const [addrCopied, setAddrCopied] = useState(false);
  const canSend = subject.trim().length > 0 && body.trim().length > 0;

  const buildMailto = () => {
    const fullBody = `${body.trim()}\n\n— Sent from UniSwap\nFrom: ${userEmail}`;
    return `mailto:support@uniswap.campus?subject=${encodeURIComponent(subject.trim())}&body=${encodeURIComponent(fullBody)}`;
  };

  const handleOpenMail = () => {
    if (!canSend) return;
    const mailto = buildMailto();

    // Strategy 1: invisible anchor click — most reliable across browsers & mobile
    const a = document.createElement("a");
    a.href = mailto;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Strategy 2: window.open fallback after small delay (catches cases where anchor silently fails)
    setTimeout(() => {
      try { window.open(mailto, "_self"); } catch {}
    }, 300);

    setMailOpened(true);
  };

  const handleCopyEmail = async () => {
    try { await navigator.clipboard.writeText("support@uniswap.campus"); }
    catch {
      const tmp = document.createElement("input");
      tmp.value = "support@uniswap.campus";
      document.body.appendChild(tmp); tmp.select();
      document.execCommand("copy"); document.body.removeChild(tmp);
    }
    setAddrCopied(true);
    setTimeout(() => setAddrCopied(false), 2500);
  };

  const handleCopyMessage = async () => {
    const text = `To: support@uniswap.campus\nSubject: ${subject.trim()}\n\n${body.trim()}\n\n— From: ${userEmail}`;
    try { await navigator.clipboard.writeText(text); }
    catch {
      const tmp = document.createElement("textarea");
      tmp.value = text;
      document.body.appendChild(tmp); tmp.select();
      document.execCommand("copy"); document.body.removeChild(tmp);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 2000, display: "flex", justifyContent: "center", alignItems: "center", padding: 20 }}>
      <div style={{ background: C.card, borderRadius: 24, width: "100%", maxWidth: 480, border: `1px solid ${C.border}`, boxShadow: "0 24px 80px rgba(0,0,0,.6)", overflow: "hidden", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div style={{ fontFamily: "'Syne',sans-serif", color: C.text, fontSize: 18, fontWeight: 800 }}>📧 Email Support</div>
          <div onClick={onClose} style={{ background: C.pill, borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.muted, fontSize: 16 }}>✕</div>
        </div>

        {/* Scrollable body */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>

          {/* To / From */}
          <div style={{ background: C.pill, borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${C.border}22` }}>
              <span style={{ color: C.muted, fontSize: 13, width: 36, flexShrink: 0 }}>To:</span>
              <span style={{ color: C.accent, fontWeight: 700, fontSize: 13, flex: 1 }}>support@uniswap.campus</span>
              <span onClick={handleCopyEmail} style={{ color: addrCopied ? C.green : C.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", transition: "color .2s" }}>
                {addrCopied ? "✓ Copied" : "Copy"}
              </span>
            </div>
            <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: C.muted, fontSize: 13, width: 36, flexShrink: 0 }}>From:</span>
              <span style={{ color: C.text, fontSize: 13 }}>{userEmail}</span>
            </div>
          </div>

          {/* Subject */}
          <div>
            <div style={{ color: C.muted, fontSize: 12, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Subject</div>
            <input
              value={subject} onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Issue with my listing"
              style={{ background: C.pill, border: `1px solid ${subject.trim() ? C.accent + "55" : C.border}`, borderRadius: 12, padding: "12px 16px", color: C.text, fontSize: 14, width: "100%", outline: "none", boxSizing: "border-box", transition: "border .2s" }}
            />
          </div>

          {/* Message */}
          <div>
            <div style={{ color: C.muted, fontSize: 12, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Message</div>
            <textarea
              value={body} onChange={e => setBody(e.target.value)}
              placeholder="Describe your issue in detail…"
              style={{ background: C.pill, border: `1px solid ${body.trim() ? C.accent + "55" : C.border}`, borderRadius: 12, padding: "12px 16px", color: C.text, fontSize: 14, width: "100%", height: 110, resize: "none", outline: "none", boxSizing: "border-box", lineHeight: 1.6, transition: "border .2s" }}
            />
            <div style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>{body.length} characters</div>
          </div>

          {/* Post-open state */}
          {mailOpened && (
            <div style={{ background: `${C.green}15`, border: `1px solid ${C.green}33`, borderRadius: 14, padding: "14px 16px" }}>
              <div style={{ color: C.green, fontSize: 14, fontWeight: 700, marginBottom: 6 }}>✓ Mail app launched!</div>
              <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
                If your mail app didn't open, you can copy the full message below and paste it manually.
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleCopyMessage} style={{ flex: 1, background: copied ? `${C.green}22` : C.pill, color: copied ? C.green : C.text, border: `1px solid ${copied ? C.green + "44" : C.border}`, borderRadius: 10, padding: "9px 0", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .2s" }}>
                  {copied ? "✓ Copied!" : "📋 Copy Message"}
                </button>
                <button onClick={handleOpenMail} style={{ flex: 1, background: C.pill, color: C.accent, border: `1px solid ${C.accent}33`, borderRadius: 10, padding: "9px 0", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  🔄 Try Again
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 24px 24px", display: "flex", gap: 10, flexShrink: 0, borderTop: `1px solid ${C.border}` }}>
          <button onClick={onClose} style={{ flex: 1, background: C.pill, color: C.text, border: "none", borderRadius: 14, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            Cancel
          </button>
          <button
            onClick={handleOpenMail}
            disabled={!canSend}
            style={{ flex: 2, background: canSend ? `linear-gradient(135deg,${C.accent},#0099CC)` : C.border, color: canSend ? "#000" : C.muted, border: "none", borderRadius: 14, padding: "13px", fontSize: 14, fontWeight: 700, cursor: canSend ? "pointer" : "not-allowed", transition: "all .2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <span>📬</span>
            <span>{mailOpened ? "Open Mail Again" : "Open Mail App"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Global CSS injected once ─────────────────────────────────────────────────
const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; background: ${C.bg}; }
  body { font-family: 'DM Sans', sans-serif; color: ${C.text}; -webkit-font-smoothing: antialiased; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }

  /* ── Layout ── */
  .app-shell { display: flex; height: 100vh; overflow: hidden; }

  /* ── Sidebar nav (tablet+desktop) ── */
  .sidebar { width: 220px; background: ${C.sidebar}; border-right: 1px solid ${C.border}; display: flex; flex-direction: column; padding: 24px 12px; flex-shrink: 0; }
  .sidebar-logo { display: flex; align-items: center; gap: 10px; padding: 0 8px; margin-bottom: 32px; }
  .sidebar-logo-text { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; background: linear-gradient(135deg,${C.accent},${C.warm}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .nav-item { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 14px; cursor: pointer; transition: all .2s; margin-bottom: 4px; color: ${C.muted}; font-size: 15px; font-weight: 500; }
  .nav-item:hover { background: ${C.pill}; color: ${C.text}; }
  .nav-item.active { background: ${C.accent}18; color: ${C.accent}; font-weight: 700; }
  .nav-item .nav-icon { font-size: 20px; width: 24px; text-align: center; }

  /* ── Main content area ── */
  .main-content { flex: 1; overflow-y: auto; display: flex; flex-direction: column; min-width: 0; }
  .page-header { padding: 20px 24px 0; display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
  .page-title { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; color: ${C.text}; }

  /* ── Listing grid ── */
  .listing-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; padding: 0 16px 100px; }

  /* ── Bottom nav (mobile only) ── */
  .bottom-nav { display: none; position: fixed; bottom: 0; left: 0; right: 0; background: ${C.sidebar}; border-top: 1px solid ${C.border}; padding: 10px 0 20px; z-index: 100; }
  .bottom-nav-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; cursor: pointer; }

  /* ── Card ── */
  .listing-card { background: ${C.card}; border: 1px solid ${C.border}; border-radius: 18px; overflow: hidden; cursor: pointer; transition: transform .15s, box-shadow .15s; animation: fadeIn .3s ease; }
  .listing-card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,212,255,.08); }

  /* ── Detail / chat panels ── */
  .detail-panel { position: fixed; inset: 0; background: ${C.bg}; z-index: 500; display: flex; flex-direction: column; overflow: hidden; }

  /* ── Sell / profile page ── */
  .form-page { max-width: 680px; margin: 0 auto; padding: 0 20px 120px; width: 100%; }

  /* ── Responsive breakpoints ── */

  /* Tablet: 600–1023px */
  @media (min-width: 600px) {
    .listing-grid { grid-template-columns: repeat(3, 1fr); }
    .bottom-nav { padding-bottom: 16px; }
  }

  /* Desktop: 1024px+ */
  @media (min-width: 1024px) {
    .sidebar { display: flex; }
    .bottom-nav { display: none !important; }
    .main-content { padding-bottom: 0; }
    .listing-grid { grid-template-columns: repeat(4, 1fr); }
    .detail-panel { position: relative; inset: auto; flex: 1; z-index: auto; }
    .page-header { padding: 28px 32px 0; }
    .form-page { max-width: 860px; padding: 0 32px 60px; }
  }

  /* Large desktop: 1280px+ */
  @media (min-width: 1280px) {
    .sidebar { width: 240px; }
    .listing-grid { grid-template-columns: repeat(5, 1fr); }
  }

  /* Mobile only */
  @media (max-width: 1023px) {
    .sidebar { display: none; }
    .bottom-nav { display: flex; }
    .main-content { padding-bottom: 80px; }
  }

  /* Slim tablet sidebar */
  @media (min-width: 768px) and (max-width: 1023px) {
    .sidebar { display: flex; width: 72px; padding: 20px 8px; }
    .sidebar-logo-text, .nav-item span:not(.nav-icon) { display: none; }
    .sidebar-logo { justify-content: center; }
    .nav-item { justify-content: center; padding: 12px; }
    .bottom-nav { display: none; }
    .main-content { padding-bottom: 0; }
  }
`;

export default function UniSwap() {
  const [user, setUser]                 = useState(null);
  const [profile, setProfile]           = useState(null);
  const [authReady, setAuthReady]       = useState(false);
  const [tab, setTab]                   = useState("home");
  const [authScreen, setAuthScreen]     = useState("login");
  const [loginStep, setLoginStep]       = useState("email");
  const [listings, setListings]         = useState([]);
  const [chats, setChats]               = useState([]);
  const [activeCat, setActiveCat]       = useState("All");
  const [selectedListing, setSelectedListing] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages]         = useState([]);
  const [msgInput, setMsgInput]         = useState("");
  const [loading, setLoading]           = useState(false);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [toast, setToast]               = useState({ msg: "", type: "ok" });
  const [liked, setLiked]               = useState({});
  const [modal, setModal]               = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [activePhoto, setActivePhoto]   = useState(0);
  const [searchQuery, setSearchQuery]   = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [newPassword, setNewPassword]   = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [resetSent, setResetSent]       = useState(false);
  const [myListings, setMyListings]     = useState([]);
  const [myListingsLoading, setMyListingsLoading] = useState(false);
  const [myListingsTab, setMyListingsTab] = useState("active"); // active | sold
  const [profileTab, setProfileTab]     = useState("menu"); // menu | listings
  const [reviewModal, setReviewModal]   = useState(null); // listing to review
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover]   = useState(0);
  const [reviewText, setReviewText]     = useState("");
  const [sellerReviews, setSellerReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [editName, setEditName]         = useState("");
  const [editMatric, setEditMatric]     = useState("");
  const [editBio, setEditBio]           = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [avatarUrl, setAvatarUrl]       = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef                  = useRef(null);
  const [savedItems, setSavedItems]     = useState({});
  const [purchases, setPurchases]       = useState([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifPermission, setNotifPermission] = useState("default");
  const [msgAlertsEnabled, setMsgAlertsEnabled] = useState(false);
  const [deleteConfirmStep, setDeleteConfirmStep] = useState(0); // 0=hidden, 1=confirm, 2=type-confirm
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [supportTopic, setSupportTopic] = useState(null); // active support sub-page
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [contactModal, setContactModal] = useState(false);

  // Form state
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [fullName, setFullName]         = useState("");
  const [matric, setMatric]             = useState("");
  const [sellTitle, setSellTitle]       = useState("");
  const [sellPrice, setSellPrice]       = useState("");
  const [sellCat, setSellCat]           = useState("Books");
  const [sellCond, setSellCond]         = useState("Good");
  const [sellDesc, setSellDesc]         = useState("");
  const [sellPhotos, setSellPhotos]     = useState([]);
  const [sellPreviews, setSellPreviews] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [signupStep, setSignupStep]             = useState("form"); // "form" | "otp"
  const signupStepRef                           = useRef("form"); // mirrors signupStep for closure access
  const [otpCode, setOtpCode]                   = useState("");
  const [otpSending, setOtpSending]             = useState(false);
  const [otpResendTimer, setOtpResendTimer]     = useState(0);
  const otpTimerRef                             = useRef(null);

  // ── Deal / Escrow state ──
  const [dealModal, setDealModal]               = useState(null);   // listing being purchased
  const [dealStep, setDealStep]                 = useState(1);      // 1=confirm 2=pay 3=awaiting 4=done
  const [dealQty, setDealQty]                   = useState(1);
  const [dealLoading, setDealLoading]           = useState(false);
  const [sellerConfirmModal, setSellerConfirmModal] = useState(null); // { deal, listing }
  const realtimeRef = useRef(null);

  const msgEndRef   = useRef(null);
  const photoInputRef = useRef(null);

  const showToast = (msg, type = "ok") => { setToast({ msg, type }); setTimeout(() => setToast({ msg: "", type: "ok" }), 3000); };

  // ── Auth ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) { setUser(session.user); fetchProfile(session.user.id); }
      setAuthReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (_e === "PASSWORD_RECOVERY") {
        setUser(session.user);
        setAuthScreen("new-password");
        setAuthReady(true);
        return;
      }
      // While user is on the OTP verification step, ignore SIGNED_IN events —
      // verifyOtp triggers a session but we want to finish the signup flow first.
      if (_e === "SIGNED_IN" && signupStepRef.current === "otp") return;
      if (session?.user) { setUser(session.user); fetchProfile(session.user.id); }
      else { setUser(null); setProfile(null); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (uid) => {
    try {
      const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
      setProfile(data || { full_name: "User", email: "", matric_number: "", rating: 0 });
      if (data?.avatar_url) setAvatarUrl(data.avatar_url + `?t=${Date.now()}`);
    } catch { setProfile({ full_name: "User", email: "", matric_number: "", rating: 0 }); }
  };

  // Step 1 — validate form, register account (Supabase sends OTP automatically)
  const handleSendOtp = async () => {
    if (!fullName || !email || !password || !matric) return showToast("Please fill all fields", "error");
    if (!email.includes("@")) return showToast("Please enter a valid email", "error");
    if (!isAllowedEmail(email)) return showToast("Please use Gmail, Outlook, Yahoo, iCloud or similar", "error");
    if (password.length < 8) return showToast("Password must be at least 8 characters", "error");
    if (!acceptedTerms) return showToast("Please accept Terms & Privacy Policy", "error");
    setOtpSending(true);
    try {
      // signUp() registers the account AND sends the 6-digit OTP to the email.
      // The session is NOT created yet — user stays null until verifyOtp succeeds.
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, matric_number: matric } },
      });
      if (error) { showToast(error.message, "error"); return; }
      // Move to OTP step — guard ref so onAuthStateChange ignores any premature session
      signupStepRef.current = "otp";
      setSignupStep("otp");
      setOtpCode("");
      setOtpResendTimer(60);
      if (otpTimerRef.current) clearInterval(otpTimerRef.current);
      otpTimerRef.current = setInterval(() => {
        setOtpResendTimer(t => { if (t <= 1) { clearInterval(otpTimerRef.current); return 0; } return t - 1; });
      }, 1000);
      showToast("OTP sent! Check your inbox.");
    } catch { showToast("Connection error. Try again.", "error"); }
    finally { setOtpSending(false); }
  };

  // Step 2 — verify the 6-digit OTP Supabase emailed after signUp()
  const handleVerifyOtp = async () => {
    if (otpCode.length < 6) return showToast("Enter the 6-digit code", "error");
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: "signup",   // must match the signUp() flow
      });
      if (error) { showToast("Invalid or expired code. Try again.", "error"); return; }
      if (data?.user) {
        // Insert/upsert profile row
        await supabase.from("profiles")
          .upsert({ id: data.user.id, full_name: fullName, email, matric_number: matric, rating: 0 })
          .catch(() => {});
        // Clear OTP guard and update state — now allow the auth wall to open
        signupStepRef.current = "form";
        setSignupStep("form");
        setOtpCode("");
        setProfile({ full_name: fullName, email, matric_number: matric, rating: 0 });
        setUser(data.user);   // manually set — triggers re-render into main app
        showToast("Account verified! Welcome to UniSwap 🎉");
      }
    } catch { showToast("Connection error. Try again.", "error"); }
    finally { setLoading(false); }
  };

  const handleResendOtp = async () => {
    if (otpResendTimer > 0) return;
    setOtpSending(true);
    try {
      // Re-trigger the signup OTP email
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName, matric_number: matric } },
      });
      if (error) { showToast(error.message, "error"); return; }
      setOtpResendTimer(60);
      if (otpTimerRef.current) clearInterval(otpTimerRef.current);
      otpTimerRef.current = setInterval(() => {
        setOtpResendTimer(t => { if (t <= 1) { clearInterval(otpTimerRef.current); return 0; } return t - 1; });
      }, 1000);
      showToast("New OTP sent!");
    } catch { showToast("Failed to resend. Try again.", "error"); }
    finally { setOtpSending(false); }
  };

  const handleLogin = async () => {
    if (!email || !password) return showToast("Enter email and password", "error");
    if (!email.includes("@")) return showToast("Please enter a valid email", "error");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) showToast("Invalid email or password", "error");
    } catch { showToast("Connection error. Try again.", "error"); }
    finally { setLoading(false); }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setTab("home"); setAuthScreen("login"); setLoginStep("email");
  };

  const handleResetPassword = async () => {
    if (!email) return showToast("Enter your school email first", "error");
    if (!email.includes("@")) return showToast("Please enter a valid email", "error");
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin
      });
      if (error) { showToast(error.message, "error"); }
      else { setResetSent(true); }
    } catch { showToast("Connection error. Try again.", "error"); }
    finally { setLoading(false); }
  };

  const handleNewPassword = async () => {
    if (!newPassword) return showToast("Please enter a new password", "error");
    if (newPassword.length < 6) return showToast("Password must be at least 6 characters", "error");
    if (newPassword !== newPasswordConfirm) return showToast("Passwords do not match", "error");
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) { showToast(error.message, "error"); }
      else {
        showToast("Password updated! Please log in. ✅");
        await supabase.auth.signOut();
        setNewPassword(""); setNewPasswordConfirm("");
        setAuthScreen("login"); setLoginStep("email");
      }
    } catch { showToast("Something went wrong. Try again.", "error"); }
    finally { setLoading(false); }
  };

  const fetchMyListings = async () => {
    setMyListingsLoading(true);
    try {
      const { data } = await supabase.from("listings").select("*").eq("seller_id", user.id).order("created_at", { ascending: false });
      setMyListings(data || []);
    } catch { setMyListings([]); }
    finally { setMyListingsLoading(false); }
  };

  useEffect(() => { if (tab === "profile" && user) fetchMyListings(); }, [tab, user]);

  const handleMarkSold = async (id) => {
    const { error } = await supabase.from("listings").update({ is_sold: true }).eq("id", id);
    if (!error) {
      setMyListings(p => p.map(l => l.id === id ? { ...l, is_sold: true } : l));
      fetchListings();
      showToast("Marked as sold! 🎉");
    } else { showToast("Failed to update. Try again.", "error"); }
  };

  const handleDeleteListing = async (id) => {
    if (!window.confirm("Delete this listing? This cannot be undone.")) return;
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (!error) {
      setMyListings(p => p.filter(l => l.id !== id));
      fetchListings();
      showToast("Listing deleted.");
    } else { showToast("Failed to delete. Try again.", "error"); }
  };

  const handleUpdateProfile = async () => {
    if (!editName.trim()) return showToast("Name cannot be empty", "error");
    if (newPassword || newPasswordConfirm || currentPassword) {
      if (!currentPassword) return showToast("Enter your current password to change it", "error");
      if (newPassword.length < 6) return showToast("New password must be at least 6 characters", "error");
      if (newPassword !== newPasswordConfirm) return showToast("Passwords do not match", "error");
    }
    setLoading(true);
    try {
      // Update bio data
      const updates = { full_name: editName.trim(), matric_number: editMatric.trim(), bio: editBio.trim() };
      const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
      if (error) { showToast(error.message, "error"); return; }
      setProfile(p => ({ ...p, ...updates }));
      // Update password — re-auth first with current password
      if (newPassword) {
        const userEmail = profile?.email || user?.email;
        const { error: reAuthErr } = await supabase.auth.signInWithPassword({ email: userEmail, password: currentPassword });
        if (reAuthErr) { showToast("Current password is incorrect", "error"); return; }
        const { error: pwErr } = await supabase.auth.updateUser({ password: newPassword });
        if (pwErr) { showToast(pwErr.message, "error"); return; }
        setCurrentPassword(""); setNewPassword(""); setNewPasswordConfirm("");
      }
      showToast(newPassword ? "Profile & password updated! ✅" : "Profile updated! ✅");
      setProfileTab("menu");
    } catch { showToast("Failed to update. Try again.", "error"); }
    finally { setLoading(false); }
  };

  const handleAvatarUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return showToast("Please select an image file", "error");
    if (file.size > 3 * 1024 * 1024) return showToast("Image must be under 3MB", "error");
    setAvatarUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `avatars/${user.id}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("listings")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadErr) { showToast("Upload failed: " + uploadErr.message, "error"); return; }
      const { data: { publicUrl } } = supabase.storage.from("listings").getPublicUrl(path);
      const url = `${publicUrl}?t=${Date.now()}`;
      await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
      setAvatarUrl(url);
      setProfile(p => ({ ...p, avatar_url: publicUrl }));
      showToast("Profile picture updated! ✅");
    } catch (e) { showToast("Upload failed: " + (e.message || "Try again."), "error"); }
    finally { setAvatarUploading(false); }
  };

  const fetchPurchases = async () => {
    setPurchasesLoading(true);
    try {
      // Purchases = listings the user has messaged about (as buyer)
      const { data: msgs } = await supabase
        .from("messages")
        .select("listing_id, listings(id, title, price, category, condition, image_urls, is_sold, profiles(full_name))")
        .eq("sender_id", user.id)
        .order("created_at", { ascending: false });
      // Deduplicate by listing_id
      const seen = {};
      const unique = (msgs || []).filter(m => {
        if (!m.listings || seen[m.listing_id]) return false;
        seen[m.listing_id] = true; return true;
      });
      setPurchases(unique.map(m => m.listings));
    } catch { setPurchases([]); }
    finally { setPurchasesLoading(false); }
  };

  // Saved items — persisted in localStorage for instant access
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("uniswap_saved") || "{}");
      setSavedItems(stored);
    } catch { setSavedItems({}); }
  }, []);

  const toggleSaved = (listing) => {
    setSavedItems(prev => {
      const next = { ...prev };
      if (next[listing.id]) { delete next[listing.id]; }
      else { next[listing.id] = listing; }
      try { localStorage.setItem("uniswap_saved", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  // Notification permission
  useEffect(() => {
    if ("Notification" in window) {
      setNotifPermission(Notification.permission);
      setNotifEnabled(Notification.permission === "granted");
    }
  }, []);

  const handleToggleNotifications = async () => {
    if (!("Notification" in window)) return showToast("Notifications not supported on this browser", "error");
    if (notifPermission === "denied") {
      showToast("Notifications blocked. Enable in browser settings.", "error"); return;
    }
    if (!notifEnabled) {
      const result = await Notification.requestPermission();
      setNotifPermission(result);
      if (result === "granted") {
        setNotifEnabled(true);
        setMsgAlertsEnabled(true);
        new Notification("UniSwap notifications enabled 🔔", { body: "You'll now get alerts for new messages and activity.", icon: "/favicon.ico" });
        showToast("Notifications enabled! 🔔");
      } else {
        showToast("Permission denied by browser", "error");
      }
    } else {
      setNotifEnabled(false);
      setMsgAlertsEnabled(false);
      showToast("Notifications turned off");
    }
  };

  const handleToggleMsgAlerts = () => {
    if (!notifEnabled) return showToast("Enable Push Notifications first", "error");
    setMsgAlertsEnabled(p => !p);
    showToast(msgAlertsEnabled ? "Message alerts turned off" : "Message alerts turned on 🔔");
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      // Delete all user data in order
      await supabase.from("messages").delete().or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
      await supabase.from("reviews").delete().or(`seller_id.eq.${user.id},reviewer_id.eq.${user.id}`);
      await supabase.from("listings").delete().eq("seller_id", user.id);
      await supabase.from("profiles").delete().eq("id", user.id);
      // Clear local storage
      try { localStorage.removeItem("uniswap_saved"); } catch {}
      // Sign out — auth account deletion requires admin key so we sign out instead
      await supabase.auth.signOut();
      showToast("Account deleted. Goodbye 👋");
    } catch { showToast("Failed to delete. Contact support.", "error"); }
    finally { setLoading(false); setDeleteConfirmStep(0); setDeleteConfirmText(""); }
  };

  const handleSubmitSupportTicket = async () => {
    if (!supportSubject.trim()) return showToast("Please enter a subject", "error");
    if (!supportMessage.trim() || supportMessage.length < 20) return showToast("Please describe your issue in more detail", "error");
    setLoading(true);
    try {
      await supabase.from("support_tickets").insert({
        user_id: user.id,
        email: profile?.email || user?.email,
        topic: supportTopic?.title,
        subject: supportSubject.trim(),
        message: supportMessage.trim(),
      });
      showToast("Support request sent! We'll respond within 24hrs ✅");
      setSupportSubject(""); setSupportMessage(""); setSupportTopic(null);
    } catch { showToast("Sent! We'll be in touch shortly ✅"); setSupportSubject(""); setSupportMessage(""); setSupportTopic(null); }
    finally { setLoading(false); }
  };

  const fetchSellerReviews = async (sellerId) => {
    setReviewsLoading(true);
    try {
      const { data } = await supabase
        .from("reviews")
        .select("*, profiles!reviewer_id(full_name)")
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false });
      setSellerReviews(data || []);
    } catch { setSellerReviews([]); }
    finally { setReviewsLoading(false); }
  };

  const handleSubmitReview = async () => {
    if (!reviewRating) return showToast("Please select a star rating", "error");
    if (!reviewText.trim()) return showToast("Please write a short review", "error");
    setLoading(true);
    try {
      const { error } = await supabase.from("reviews").insert({
        listing_id: reviewModal.id,
        seller_id: reviewModal.seller_id,
        reviewer_id: user.id,
        rating: reviewRating,
        comment: reviewText.trim(),
      });
      if (error) { showToast(error.message, "error"); return; }
      // Recalculate seller average rating
      const { data: allReviews } = await supabase
        .from("reviews").select("rating").eq("seller_id", reviewModal.seller_id);
      if (allReviews?.length) {
        const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
        await supabase.from("profiles").update({ rating: parseFloat(avg.toFixed(1)) }).eq("id", reviewModal.seller_id);
      }
      showToast("Review submitted! ⭐");
      setReviewModal(null); setReviewRating(0); setReviewText("");
    } catch { showToast("Failed to submit. Try again.", "error"); }
    finally { setLoading(false); }
  };

  // ── Listings ───────────────────────────────────────────────────────────────
  useEffect(() => { if (user) fetchListings(); }, [user, activeCat]);
  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const fetchListings = async () => {
    setListingsLoading(true);
    try {
      let q = supabase.from("listings").select("*, profiles(full_name)").eq("is_sold", false).order("created_at", { ascending: false });
      if (activeCat !== "All") q = q.eq("category", activeCat);
      const { data } = await q;
      setListings(data || []);
    } catch { setListings([]); }
    finally { setListingsLoading(false); }
  };

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files);
    const remaining = 5 - sellPhotos.length;
    const selected = files.slice(0, remaining);
    if (files.length > remaining) showToast(`Max 5 photos. ${remaining} slot(s) left.`, "error");
    setSellPhotos(p => [...p, ...selected]);
    selected.forEach(f => { const r = new FileReader(); r.onload = ev => setSellPreviews(p => [...p, ev.target.result]); r.readAsDataURL(f); });
  };

  const removePhoto = (i) => { setSellPhotos(p => p.filter((_, j) => j !== i)); setSellPreviews(p => p.filter((_, j) => j !== i)); };

  const uploadPhotos = async (lid) => {
    const urls = [];
    for (let i = 0; i < sellPhotos.length; i++) {
      const f = sellPhotos[i];
      const path = `${user.id}/${lid}/${i}.${f.name.split(".").pop()}`;
      const { error } = await supabase.storage.from("listings").upload(path, f, { upsert: true });
      if (!error) { const { data } = supabase.storage.from("listings").getPublicUrl(path); urls.push(data.publicUrl); }
      setUploadProgress(Math.round(((i + 1) / sellPhotos.length) * 100));
    }
    return urls;
  };

  const handlePostListing = async () => {
    if (!sellTitle || !sellPrice) return showToast("Title and price required", "error");
    setLoading(true); setUploadProgress(0);
    try {
      const { data: listing, error } = await supabase.from("listings").insert({ title: sellTitle, price: parseInt(sellPrice), category: sellCat, condition: sellCond, description: sellDesc, seller_id: user.id, is_sold: false, image_urls: [] }).select().single();
      if (error) { showToast(error.message, "error"); return; }
      if (sellPhotos.length > 0) {
        const urls = await uploadPhotos(listing.id);
        await supabase.from("listings").update({ image_urls: JSON.stringify(urls) }).eq("id", listing.id);
      }
      showToast("Listing posted! 🎉");
      setSellTitle(""); setSellPrice(""); setSellDesc(""); setSellPhotos([]); setSellPreviews([]); setUploadProgress(0);
      fetchListings(); setTab("home");
    } catch { showToast("Failed to post. Try again.", "error"); }
    finally { setLoading(false); }
  };

  // ── Messages ───────────────────────────────────────────────────────────────
  useEffect(() => { if (tab === "messages" && user) fetchChats(); }, [tab, user]);

  const fetchChats = async () => {
    try {
      const { data } = await supabase.from("messages").select("*, listings(title)").or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).order("created_at", { ascending: false });
      const seen = {}; const grouped = [];
      (data || []).forEach(m => { if (!seen[m.listing_id]) { seen[m.listing_id] = true; grouped.push(m); } });
      setChats(grouped);
    } catch { setChats([]); }
  };

  const openChat = async (chat) => {
    setSelectedChat(chat);
    const { data } = await supabase.from("messages").select("*").eq("listing_id", chat.listing_id).order("created_at", { ascending: true });
    setMessages(data || []);
  };

  const sendMessage = async () => {
    if (!msgInput.trim() || !selectedChat) return;
    const receiverId = selectedChat.sender_id === user.id ? selectedChat.receiver_id : selectedChat.sender_id;
    const { data } = await supabase.from("messages").insert({ sender_id: user.id, receiver_id: receiverId, listing_id: selectedChat.listing_id, content: msgInput, is_read: false }).select().single();
    if (data) setMessages(p => [...p, data]);
    setMsgInput("");
  };

  const startChat = async (listing) => {
    const chat = { listing_id: listing.id, listings: { title: listing.title }, sender_id: user.id, receiver_id: listing.seller_id };
    setSelectedChat(chat);
    const { data } = await supabase.from("messages").select("*").eq("listing_id", listing.id).or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).order("created_at", { ascending: true });
    setMessages(data || []);
    setTab("messages");
  };

  // ── Realtime: watch deals table for seller confirmation requests ──
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`deals:seller:${user.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "deals",
        filter: `seller_id=eq.${user.id}`,
      }, async (payload) => {
        const deal = payload.new;
        // Fetch listing details to show in confirmation modal
        const { data: listing } = await supabase
          .from("listings")
          .select("*")
          .eq("id", deal.listing_id)
          .single();
        setSellerConfirmModal({ deal, listing });
      })
      .subscribe();
    realtimeRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // ── Deal handlers ──────────────────────────────────────────────────────────
  const handleBuyNow = (listing) => {
    setDealModal(listing);
    setDealStep(1);
    setDealQty(1);
  };

  const handleDealConfirm = () => setDealStep(2);

  const handleDealPaid = async () => {
    setDealStep(3);
    setDealLoading(true);
    try {
      // Insert a deal row — seller's realtime subscription picks this up
      const { error } = await supabase.from("deals").insert({
        listing_id: dealModal.id,
        buyer_id: user.id,
        seller_id: dealModal.seller_id,
        quantity: dealQty,
        amount: dealModal.price * dealQty,
        status: "pending",
      });
      if (error) { showToast("Failed to initiate deal. Try again.", "error"); setDealStep(2); return; }

      // Also send a chat message so there's a conversation thread
      await supabase.from("messages").insert({
        sender_id: user.id,
        receiver_id: dealModal.seller_id,
        listing_id: dealModal.id,
        content: `💰 Payment of ₦${(dealModal.price * dealQty).toLocaleString()} sent for "${dealModal.title}" (Qty: ${dealQty}). Awaiting your confirmation.`,
        is_read: false,
      });
      setDealStep(4);
    } catch { showToast("Connection error. Try again.", "error"); setDealStep(2); }
    finally { setDealLoading(false); }
  };

  const handleSellerConfirm = async () => {
    if (!sellerConfirmModal) return;
    const { deal, listing } = sellerConfirmModal;
    setDealLoading(true);
    try {
      // 1. Update deal status → confirmed
      await supabase.from("deals").update({ status: "confirmed" }).eq("id", deal.id);

      // 2. Mark listing as sold
      await supabase.from("listings").update({ is_sold: true }).eq("id", listing.id);

      // 3. Sync local state — remove from home feed, update my listings
      setListings(prev => prev.filter(l => l.id !== listing.id));
      setMyListings(prev => prev.map(l => l.id === listing.id ? { ...l, is_sold: true } : l));

      // 4. Notify buyer via message
      await supabase.from("messages").insert({
        sender_id: user.id,
        receiver_id: deal.buyer_id,
        listing_id: listing.id,
        content: `✅ Payment confirmed for "${listing.title}"! The listing is now marked as sold. Let's arrange delivery/pickup.`,
        is_read: false,
      });

      showToast("Payment confirmed! Listing marked as sold. ✓");
      setSellerConfirmModal(null);
    } catch { showToast("Error confirming. Try again.", "error"); }
    finally { setDealLoading(false); }
  };

  const handleSellerDispute = async () => {
    if (!sellerConfirmModal) return;
    const { deal, listing } = sellerConfirmModal;
    try {
      // Mark deal as disputed
      await supabase.from("deals").update({ status: "disputed" }).eq("id", deal.id);
    } catch { /* silent */ }
    setSellerConfirmModal(null);
    // Open chat with buyer so they can resolve
    const chat = {
      listing_id: listing.id,
      listings: { title: listing.title },
      sender_id: user.id,
      receiver_id: deal.buyer_id,
    };
    setSelectedChat(chat);
    const { data } = await supabase.from("messages").select("*")
      .eq("listing_id", listing.id)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: true });
    setMessages(data || []);
    setTab("messages");
  };

  const initials = profile?.full_name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  // ── Loading splash ─────────────────────────────────────────────────────────
  if (!authReady) return (
    <div style={{ background: C.bg, height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 24 }}>
      <style>{GLOBAL_CSS}</style>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      <div style={{ fontSize: 56 }}>🛒</div>
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 32, fontWeight: 800, background: `linear-gradient(135deg,${C.accent},${C.warm})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>UniSwap</div>
      <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  // ── Auth screens ───────────────────────────────────────────────────────────
  if (!user) return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex" }}>
      <style>{GLOBAL_CSS}</style>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      <Toast {...toast} />
      {modal && <Modal type={modal} onClose={() => setModal(null)} />}

      {/* Left banner — desktop only */}
      <div style={{ display: "none", flex: 1, background: `linear-gradient(160deg,${C.sidebar},${C.card})`, borderRight: `1px solid ${C.border}`, padding: 48, flexDirection: "column", justifyContent: "center", alignItems: "center", position: "relative", overflow: "hidden" }} className="auth-desktop-banner">
        <style>{`@media(min-width:900px){.auth-desktop-banner{display:flex!important}}`}</style>
        <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: `${C.accent}07`, top: -150, left: -150 }} />
        <div style={{ position: "absolute", width: 350, height: 350, borderRadius: "50%", background: `${C.warm}07`, bottom: -80, right: -80 }} />
        <div style={{ textAlign: "center", position: "relative", zIndex: 1, maxWidth: 420 }}>
          <div style={{ fontSize: 80, marginBottom: 20 }}>🛒</div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 52, fontWeight: 800, background: `linear-gradient(135deg,${C.accent},${C.warm})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 16 }}>UniSwap</div>
          <div style={{ color: C.muted, fontSize: 17, lineHeight: 1.8, marginBottom: 44 }}>The trusted campus marketplace — buy, sell and swap with verified students.</div>
          {[["🔒","Campus emails only — verified & safe"],["⚡","Post a listing in under 60 seconds"],["💬","Chat directly with buyers & sellers"],["🎓","Built exclusively for campus life"]].map(([icon, text]) => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: 14, background: `${C.accent}0D`, border: `1px solid ${C.accent}1A`, borderRadius: 14, padding: "14px 18px", marginBottom: 12, textAlign: "left" }}>
              <span style={{ fontSize: 24 }}>{icon}</span>
              <span style={{ color: C.text, fontSize: 15, fontWeight: 500 }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px", minHeight: "100vh", overflowY: "auto" }}>
        <div style={{ width: "100%", maxWidth: 440, background: C.card, borderRadius: 28, padding: "40px 36px", border: `1px solid ${C.border}`, boxShadow: "0 24px 80px rgba(0,0,0,.5)" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>🛒</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 30, fontWeight: 800, background: `linear-gradient(135deg,${C.accent},${C.warm})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>UniSwap</div>
            <div style={{ color: C.muted, fontSize: 14, marginTop: 6 }}>Your campus marketplace</div>
          </div>

          {authScreen === "login" && loginStep === "email" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ fontFamily: "'Syne',sans-serif", color: C.text, fontSize: 22, fontWeight: 800 }}>Welcome back</div>
              <div>
                <div style={{ color: C.muted, fontSize: 12, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>School Email</div>
                <Input placeholder="you@uniemail.edu.ng" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && setLoginStep("password")} />
              </div>
              <Btn primary onClick={() => setLoginStep("password")}>Continue →</Btn>
              <div style={{ textAlign: "center", color: C.muted, fontSize: 14 }}>New student? <span style={{ color: C.accent, cursor: "pointer", fontWeight: 600 }} onClick={() => setAuthScreen("signup")}>Create account</span></div>
            </div>
          )}

          {authScreen === "login" && loginStep === "password" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ fontFamily: "'Syne',sans-serif", color: C.text, fontSize: 22, fontWeight: 800 }}>Enter password</div>
              <div style={{ color: C.muted, fontSize: 14, wordBreak: "break-all" }}>{email}</div>
              <div style={{ position: "relative" }}>
                <Input type={showPassword ? "text" : "password"} placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} style={{ paddingRight: 48 }} />
                <div onClick={() => setShowPassword(p => !p)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: C.muted, display: "flex" }}><EyeIcon open={showPassword} /></div>
              </div>
              <Btn primary onClick={handleLogin}>{loading ? "Signing in…" : "Sign In"}</Btn>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ color: C.muted, fontSize: 14, cursor: "pointer" }} onClick={() => setLoginStep("email")}>← Different email</div>
                <div style={{ color: C.accent, fontSize: 14, cursor: "pointer", fontWeight: 600 }} onClick={() => setAuthScreen("reset")}>Forgot password?</div>
              </div>
            </div>
          )}

          {/* ── FORGOT PASSWORD ── */}
          {authScreen === "reset" && !resetSent && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ textAlign: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔑</div>
                <div style={{ fontFamily: "'Syne',sans-serif", color: C.text, fontSize: 22, fontWeight: 800 }}>Reset Password</div>
                <div style={{ color: C.muted, fontSize: 14, marginTop: 6, lineHeight: 1.6 }}>Enter your school email and we'll send you a reset link.</div>
              </div>
              <div>
                <div style={{ color: C.muted, fontSize: 12, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>School Email</div>
                <Input placeholder="you@uniemail.edu.ng" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleResetPassword()} />
              </div>
              <Btn primary onClick={handleResetPassword}>{loading ? "Sending…" : "Send Reset Link"}</Btn>
              <div style={{ textAlign: "center", color: C.muted, fontSize: 14, cursor: "pointer" }} onClick={() => { setAuthScreen("login"); setLoginStep("email"); }}>← Back to login</div>
            </div>
          )}

          {/* ── RESET EMAIL SENT ── */}
          {authScreen === "reset" && resetSent && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, textAlign: "center" }}>
              <div style={{ fontSize: 64, marginBottom: 4 }}>📬</div>
              <div style={{ fontFamily: "'Syne',sans-serif", color: C.text, fontSize: 22, fontWeight: 800 }}>Check your email</div>
              <div style={{ color: C.muted, fontSize: 15, lineHeight: 1.7 }}>
                We sent a password reset link to<br />
                <strong style={{ color: C.text }}>{email}</strong>
              </div>
              <div style={{ background: `${C.accent}0D`, border: `1px solid ${C.accent}22`, borderRadius: 14, padding: 16 }}>
                <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7 }}>
                  ✅ Check your inbox and spam folder<br />
                  ✅ Click the link in the email<br />
                  ✅ Set your new password
                </div>
              </div>
              <Btn primary onClick={() => { setAuthScreen("login"); setLoginStep("email"); setResetSent(false); }}>Back to Login</Btn>
              <div style={{ color: C.muted, fontSize: 13, cursor: "pointer" }} onClick={handleResetPassword}>Didn't receive it? <span style={{ color: C.accent, fontWeight: 600 }}>Resend</span></div>
            </div>
          )}

          {/* ── Step 1: Fill details ── */}
          {authScreen === "signup" && signupStep === "form" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ fontFamily: "'Syne',sans-serif", color: C.text, fontSize: 22, fontWeight: 800 }}>Create account</div>
                <div style={{ color: C.muted, fontSize: 13, marginTop: 3 }}>Step 1 of 2 — Your details</div>
              </div>

              <Input placeholder="Full name" value={fullName} onChange={e => setFullName(e.target.value)} />

              <div>
                <Input
                  placeholder="Email (Gmail, Outlook, Yahoo…)"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ borderColor: email && email.includes("@") && !isAllowedEmail(email) ? "#FF5555" : email && isAllowedEmail(email) ? C.green : undefined }}
                />
                {email && email.includes("@") && !isAllowedEmail(email) && (
                  <div style={{ color: "#FF5555", fontSize: 12, marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#FF5555"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                    Use Gmail, Outlook, Yahoo, iCloud or similar
                  </div>
                )}
                {email && isAllowedEmail(email) && (
                  <div style={{ color: C.green, fontSize: 12, marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill={C.green}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5l-4-4 1.41-1.41L10 13.67l6.59-6.59L18 8.5l-8 8z"/></svg>
                    Valid email
                  </div>
                )}
              </div>

              <Input placeholder="Matric number" value={matric} onChange={e => setMatric(e.target.value)} />

              <div>
                <div style={{ position: "relative" }}>
                  <Input type={showPassword ? "text" : "password"} placeholder="Create password (min 8 chars)" value={password} onChange={e => setPassword(e.target.value)} style={{ paddingRight: 48 }} />
                  <div onClick={() => setShowPassword(p => !p)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: C.muted, display: "flex" }}><EyeIcon open={showPassword} /></div>
                </div>
                {password && password.length < 8 && (
                  <div style={{ color: "#FF5555", fontSize: 12, marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#FF5555"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                    At least 8 characters required
                  </div>
                )}
              </div>

              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                <div onClick={() => { setAcceptedTerms(p => !p); setAcceptedPrivacy(p => !p); }} style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${acceptedTerms ? C.accent : C.muted}`, background: acceptedTerms ? C.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1, transition: "all .2s" }}>
                  {acceptedTerms && <span style={{ color: "#000", fontSize: 13, fontWeight: 800 }}>✓</span>}
                </div>
                <span style={{ color: C.muted, fontSize: 13, lineHeight: 1.5 }}>I agree to the <span onClick={e => { e.stopPropagation(); setModal("terms"); }} style={{ color: C.accent, fontWeight: 600, textDecoration: "underline", cursor: "pointer" }}>Terms of Use</span> and <span onClick={e => { e.stopPropagation(); setModal("privacy"); }} style={{ color: C.accent, fontWeight: 600, textDecoration: "underline", cursor: "pointer" }}>Privacy Policy</span></span>
              </label>

              <Btn primary onClick={handleSendOtp} style={{ opacity: acceptedTerms && isAllowedEmail(email) ? 1 : 0.5 }}>
                {otpSending ? "Sending OTP…" : "Continue →"}
              </Btn>
              <div style={{ textAlign: "center", color: C.muted, fontSize: 14, cursor: "pointer" }} onClick={() => { setAuthScreen("login"); setLoginStep("email"); }}>← Back to login</div>
            </div>
          )}

          {/* ── Step 2: OTP verification ── */}
          {authScreen === "signup" && signupStep === "otp" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div style={{ fontFamily: "'Syne',sans-serif", color: C.text, fontSize: 22, fontWeight: 800 }}>Verify your email</div>
                <div style={{ color: C.muted, fontSize: 13, marginTop: 3 }}>Step 2 of 2 — Email verification</div>
              </div>

              {/* Email badge */}
              <div style={{ background: `${C.accent}0D`, border: `1px solid ${C.accent}22`, borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: `${C.accent}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </div>
                <div>
                  <div style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>Code sent to</div>
                  <div style={{ color: C.accent, fontSize: 13, marginTop: 2, wordBreak: "break-all" }}>{email}</div>
                </div>
              </div>

              <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.6 }}>
                Enter the <strong style={{ color: C.text }}>6-digit code</strong> from your inbox. Check your spam folder if needed.
              </div>

              {/* OTP input */}
              <div>
                <Input
                  placeholder="000000"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  style={{ textAlign: "center", letterSpacing: 12, fontSize: 24, fontWeight: 800, borderColor: otpCode.length === 6 ? C.green : undefined }}
                  maxLength={6}
                />
                {otpCode.length === 6 && (
                  <div style={{ color: C.green, fontSize: 12, marginTop: 5, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill={C.green}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5l-4-4 1.41-1.41L10 13.67l6.59-6.59L18 8.5l-8 8z"/></svg>
                    Code complete — tap verify
                  </div>
                )}
              </div>

              <Btn primary onClick={handleVerifyOtp} style={{ opacity: otpCode.length === 6 ? 1 : 0.5 }}>
                {loading ? "Verifying…" : "Verify & Create Account 🎉"}
              </Btn>

              {/* Resend */}
              <div style={{ textAlign: "center", color: C.muted, fontSize: 13 }}>
                Didn't receive it?{" "}
                {otpResendTimer > 0
                  ? <span style={{ color: C.muted }}>Resend in {otpResendTimer}s</span>
                  : <span onClick={handleResendOtp} style={{ color: C.accent, fontWeight: 600, cursor: "pointer" }}>{otpSending ? "Sending…" : "Resend OTP"}</span>
                }
              </div>

              <div style={{ textAlign: "center", color: C.muted, fontSize: 13, cursor: "pointer" }} onClick={() => { setSignupStep("form"); setOtpCode(""); }}>
                ← Change email
              </div>
            </div>
          )}

          <div style={{ marginTop: 24, padding: 12, background: `${C.accent}0D`, borderRadius: 12, border: `1px solid ${C.accent}1A`, textAlign: "center" }}>
            <div style={{ fontSize: 12, color: C.muted, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill={C.accent}><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
              Email verified sign-ups only — your account is protected
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ── New Password screen (after clicking reset email link) ──────────────────
  if (authScreen === "new-password") return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <style>{GLOBAL_CSS}</style>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      <Toast {...toast} />
      <div style={{ width: "100%", maxWidth: 440, background: C.card, borderRadius: 28, padding: "40px 36px", border: `1px solid ${C.border}`, boxShadow: "0 24px 80px rgba(0,0,0,.5)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
          <div style={{ fontFamily: "'Syne',sans-serif", color: C.text, fontSize: 24, fontWeight: 800 }}>Set New Password</div>
          <div style={{ color: C.muted, fontSize: 14, marginTop: 6 }}>Choose a strong password for your account</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div style={{ color: C.muted, fontSize: 12, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>New Password</div>
            <div style={{ position: "relative" }}>
              <Input type={showPassword ? "text" : "password"} placeholder="Enter new password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ paddingRight: 48 }} />
              <div onClick={() => setShowPassword(p => !p)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: C.muted, display: "flex" }}><EyeIcon open={showPassword} /></div>
            </div>
          </div>
          <div>
            <div style={{ color: C.muted, fontSize: 12, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Confirm Password</div>
            <div style={{ position: "relative" }}>
              <Input type={showPassword ? "text" : "password"} placeholder="Repeat new password" value={newPasswordConfirm} onChange={e => setNewPasswordConfirm(e.target.value)} onKeyDown={e => e.key === "Enter" && handleNewPassword()} style={{ paddingRight: 48 }} />
              <div onClick={() => setShowPassword(p => !p)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: C.muted, display: "flex" }}><EyeIcon open={showPassword} /></div>
            </div>
            {/* Password match indicator */}
            {newPasswordConfirm && (
              <div style={{ marginTop: 6, fontSize: 12, color: newPassword === newPasswordConfirm ? C.green : "#FF5555", fontWeight: 600 }}>
                {newPassword === newPasswordConfirm ? "✓ Passwords match" : "✕ Passwords do not match"}
              </div>
            )}
          </div>
          {/* Strength hint */}
          {newPassword && (
            <div style={{ background: C.pill, borderRadius: 10, padding: "10px 14px" }}>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>Password strength</div>
              <div style={{ display: "flex", gap: 4 }}>
                {[6, 8, 10, 12].map(len => (
                  <div key={len} style={{ flex: 1, height: 4, borderRadius: 2, background: newPassword.length >= len ? (len >= 10 ? C.green : len >= 8 ? C.accent : C.warm) : C.border, transition: "background .2s" }} />
                ))}
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>
                {newPassword.length < 6 ? "Too short" : newPassword.length < 8 ? "Weak" : newPassword.length < 10 ? "Good" : "Strong ✓"}
              </div>
            </div>
          )}
          <Btn primary onClick={handleNewPassword}>{loading ? "Updating…" : "Update Password"}</Btn>
        </div>
      </div>
    </div>
  );

  // ── Main app shell ─────────────────────────────────────────────────────────
  const NAV_ITEMS = [
    { id: "home",     icon: "🏠", label: "Home" },
    { id: "messages", icon: "💬", label: "Messages" },
    { id: "sell",     icon: "➕", label: "Sell" },
    { id: "profile",  icon: "👤", label: "Account" },
  ];

  const handleTabChange = (id) => { setTab(id); setSelectedListing(null); setSelectedChat(null); };

  return (
    <div className="app-shell">
      <style>{GLOBAL_CSS}</style>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      <Toast {...toast} />
      {modal && <Modal type={modal} onClose={() => setModal(null)} />}
      {/* ── Buyer Deal Modal ── */}
      {dealModal && (() => {
        const imgs = (() => { try { const u = dealModal.image_urls; if (!u) return []; if (Array.isArray(u)) return u; return JSON.parse(u); } catch { return []; } })();
        const total = dealModal.price * dealQty;
        const steps = ["Confirm", "Payment", "Awaiting"];
        return (
          <div onClick={() => { if (dealStep < 3) { setDealModal(null); setDealStep(1); } }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.78)", zIndex: 9000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            <div onClick={e => e.stopPropagation()} style={{ background: C.card, borderRadius: "22px 22px 0 0", width: "100%", maxWidth: 520, padding: "20px 20px 36px", border: `1px solid ${C.border}`, maxHeight: "92vh", overflowY: "auto" }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: C.border, margin: "0 auto 18px" }} />

              {/* Step indicator */}
              {dealStep < 4 && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 20 }}>
                  {steps.map((s, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, flex: i < 2 ? 1 : 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <div style={{ width: 22, height: 22, borderRadius: "50%", background: dealStep > i+1 ? C.green : dealStep === i+1 ? C.accent : C.pill, color: dealStep > i+1 ? "#000" : dealStep === i+1 ? "#000" : C.muted, fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {dealStep > i+1 ? "✓" : i+1}
                        </div>
                        <span style={{ fontSize: 11, color: dealStep === i+1 ? C.text : C.muted, fontWeight: dealStep === i+1 ? 700 : 400, whiteSpace: "nowrap" }}>{s}</span>
                      </div>
                      {i < 2 && <div style={{ flex: 1, height: 1, background: dealStep > i+1 ? C.green : C.border, minWidth: 8 }} />}
                    </div>
                  ))}
                </div>
              )}

              {/* ── Step 1: Confirm order ── */}
              {dealStep === 1 && (
                <div>
                  <div style={{ fontFamily: "'Syne',sans-serif", color: C.text, fontSize: 20, fontWeight: 800, marginBottom: 16 }}>Confirm Order</div>
                  <div style={{ background: C.pill, borderRadius: 14, padding: 14, marginBottom: 16, display: "flex", gap: 12 }}>
                    {imgs[0] ? <img src={imgs[0]} alt="" style={{ width: 58, height: 58, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                      : <div style={{ width: 58, height: 58, borderRadius: 10, background: C.border, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>📦</div>}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: C.text, fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{dealModal.title}</div>
                      <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{dealModal.condition} · {dealModal.category}</div>
                      <div style={{ color: C.accent, fontWeight: 800, fontSize: 16, marginTop: 4 }}>₦{dealModal.price?.toLocaleString()} each</div>
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ color: C.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Quantity</div>
                    <div style={{ display: "flex", alignItems: "center", background: C.pill, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", height: 44, width: 130 }}>
                      <button onClick={() => setDealQty(q => Math.max(1, q - 1))} style={{ width: 44, height: "100%", background: "transparent", border: "none", color: C.accent, fontSize: 20, fontWeight: 700, cursor: "pointer" }}>−</button>
                      <div style={{ flex: 1, textAlign: "center", color: C.text, fontSize: 15, fontWeight: 700 }}>{dealQty}</div>
                      <button onClick={() => setDealQty(q => Math.min(dealModal.quantity || 99, q + 1))} style={{ width: 44, height: "100%", background: "transparent", border: "none", color: C.accent, fontSize: 20, fontWeight: 700, cursor: "pointer" }}>+</button>
                    </div>
                  </div>
                  <div style={{ background: `${C.accent}0D`, border: `1px solid ${C.accent}22`, borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ color: C.muted, fontSize: 13 }}>Subtotal ({dealQty}x)</span>
                      <span style={{ color: C.text, fontWeight: 600, fontSize: 13 }}>₦{total.toLocaleString()}</span>
                    </div>
                    <div style={{ height: 1, background: C.border, margin: "6px 0" }} />
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>Total</span>
                      <span style={{ color: C.accent, fontWeight: 800, fontSize: 18 }}>₦{total.toLocaleString()}</span>
                    </div>
                  </div>
                  <div style={{ background: `${C.green}0D`, border: `1px solid ${C.green}33`, borderRadius: 12, padding: "10px 14px", marginBottom: 16, display: "flex", gap: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill={C.green} style={{ flexShrink: 0, marginTop: 1 }}><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
                    <span style={{ color: C.green, fontSize: 12, lineHeight: 1.6 }}><strong>Secure deal.</strong> Seller must confirm payment before listing is marked sold.</span>
                  </div>
                  <button onClick={handleDealConfirm} style={{ width: "100%", height: 48, borderRadius: 14, background: `linear-gradient(135deg,${C.accent},#0099CC)`, border: "none", color: "#000", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
                    Continue to Payment →
                  </button>
                </div>
              )}

              {/* ── Step 2: Payment info ── */}
              {dealStep === 2 && (
                <div>
                  <div style={{ fontFamily: "'Syne',sans-serif", color: C.text, fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Make Payment</div>
                  <div style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>Transfer <strong style={{ color: C.accent }}>₦{total.toLocaleString()}</strong> to the seller. Get their bank details via chat first.</div>
                  <div style={{ background: C.pill, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 16px", marginBottom: 14 }}>
                    {[["Item", dealModal.title], ["Quantity", dealQty], ["Total Amount", `₦${total.toLocaleString()}`], ["Payment", "Bank Transfer / Mobile Money"]].map(([label, value]) => (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
                        <span style={{ color: C.muted, fontSize: 13 }}>{label}</span>
                        <span style={{ color: C.text, fontWeight: 600, fontSize: 13, maxWidth: "58%", textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: `${C.warm}15`, border: `1px solid ${C.warm}44`, borderRadius: 12, padding: "10px 14px", marginBottom: 16, display: "flex", gap: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill={C.warm} style={{ flexShrink: 0, marginTop: 1 }}><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
                    <span style={{ color: C.warm, fontSize: 12, lineHeight: 1.6 }}>Only tap "I've Paid" after completing the transfer. The seller will receive a confirmation request.</span>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setDealStep(1)} style={{ flex: 1, height: 46, borderRadius: 12, background: C.pill, border: `1px solid ${C.border}`, color: C.muted, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>← Back</button>
                    <button onClick={handleDealPaid} disabled={dealLoading} style={{ flex: 2, height: 46, borderRadius: 12, background: `linear-gradient(135deg,${C.green},#00AA55)`, border: "none", color: "#000", fontWeight: 800, fontSize: 15, cursor: dealLoading ? "default" : "pointer", opacity: dealLoading ? 0.7 : 1 }}>
                      {dealLoading ? "Sending…" : "I've Paid ✓"}
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step 3: Processing ── */}
              {dealStep === 3 && (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: `${C.accent}22`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                    <div style={{ width: 28, height: 28, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  </div>
                  <div style={{ color: C.text, fontSize: 16, fontWeight: 700 }}>Sending to seller…</div>
                </div>
              )}

              {/* ── Step 4: Done ── */}
              {dealStep === 4 && (
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: `${C.accent}22`, border: `2px solid ${C.accent}44`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 30 }}>⏳</div>
                  <div style={{ fontFamily: "'Syne',sans-serif", color: C.text, fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Awaiting Seller</div>
                  <div style={{ background: `${C.accent}15`, border: `1px solid ${C.accent}33`, borderRadius: 20, padding: "4px 14px", display: "inline-block", marginBottom: 14 }}>
                    <span style={{ color: C.accent, fontSize: 12, fontWeight: 700 }}>Deal recorded · Pending seller confirmation</span>
                  </div>
                  <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 18 }}>
                    The seller has been notified. Once they confirm receipt of payment, the listing will be automatically marked as sold.
                  </div>
                  <div style={{ background: C.pill, borderRadius: 14, padding: "12px 14px", marginBottom: 18, textAlign: "left" }}>
                    {[
                      ["Deal row created in database", C.green],
                      ["Seller notified via real-time alert", C.green],
                      ["Listing marked sold after seller confirms", C.muted],
                      ["Rate seller after deal closes", C.muted],
                    ].map(([tip, col], i) => (
                      <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: i < 3 ? 8 : 0 }}>
                        <div style={{ width: 16, height: 16, borderRadius: "50%", background: col === C.green ? `${C.green}33` : C.border, color: col, fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {col === C.green ? "✓" : "○"}
                        </div>
                        <span style={{ color: col, fontSize: 12 }}>{tip}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => { setDealModal(null); setDealStep(1); startChat(dealModal); }} style={{ flex: 1, height: 46, borderRadius: 12, background: C.pill, border: `1px solid ${C.accent}44`, color: C.accent, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Open Chat</button>
                    <button onClick={() => { setDealModal(null); setDealStep(1); }} style={{ flex: 1, height: 46, borderRadius: 12, background: `linear-gradient(135deg,${C.accent},#0099CC)`, border: "none", color: "#000", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>Done</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── Seller Payment Confirmation Modal ── */}
      {sellerConfirmModal && (() => {
        const { deal, listing } = sellerConfirmModal;
        const imgs = (() => { try { const u = listing?.image_urls; if (!u) return []; if (Array.isArray(u)) return u; return JSON.parse(u); } catch { return []; } })();
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 9100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div style={{ background: C.card, borderRadius: 24, width: "100%", maxWidth: 420, border: `1px solid ${C.border}`, overflow: "hidden" }}>

              {/* Header */}
              <div style={{ background: `${C.green}15`, borderBottom: `1px solid ${C.green}33`, padding: "20px 20px 16px", textAlign: "center" }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: `${C.green}22`, border: `2px solid ${C.green}44`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", fontSize: 24 }}>💰</div>
                <div style={{ fontFamily: "'Syne',sans-serif", color: C.text, fontSize: 19, fontWeight: 800, marginBottom: 4 }}>Payment Confirmation</div>
                <div style={{ color: C.muted, fontSize: 13 }}>A buyer has initiated a deal on your listing</div>
              </div>

              <div style={{ padding: "18px 20px" }}>
                {/* Deal summary card */}
                <div style={{ background: C.pill, borderRadius: 14, padding: 14, marginBottom: 14, display: "flex", gap: 12 }}>
                  {imgs[0] ? <img src={imgs[0]} alt="" style={{ width: 54, height: 54, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                    : <div style={{ width: 54, height: 54, borderRadius: 10, background: C.border, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>📦</div>}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: C.text, fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{listing?.title}</div>
                    <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>Qty: {deal.quantity}</div>
                    <div style={{ color: C.green, fontWeight: 800, fontSize: 17, marginTop: 4 }}>₦{deal.amount?.toLocaleString()}</div>
                  </div>
                </div>

                {/* Question */}
                <div style={{ background: `${C.accent}0D`, border: `1px solid ${C.accent}22`, borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
                  <div style={{ color: C.text, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Have you received ₦{deal.amount?.toLocaleString()}?</div>
                  <div style={{ color: C.muted, fontSize: 12, lineHeight: 1.6 }}>Only confirm if the full payment has been received. This will mark the listing as sold and notify the buyer.</div>
                </div>

                {/* Buttons */}
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={handleSellerDispute} disabled={dealLoading}
                    style={{ flex: 1, height: 48, borderRadius: 14, background: C.pill, border: `1.5px solid #FF555544`, color: "#FF5555", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                    Not Received
                  </button>
                  <button onClick={handleSellerConfirm} disabled={dealLoading}
                    style={{ flex: 1, height: 48, borderRadius: 14, background: `linear-gradient(135deg,${C.green},#00AA55)`, border: "none", color: "#000", fontWeight: 800, fontSize: 15, cursor: dealLoading ? "default" : "pointer", opacity: dealLoading ? 0.7 : 1 }}>
                    {dealLoading ? "Confirming…" : "Yes, Confirm ✓"}
                  </button>
                </div>
                <div style={{ textAlign: "center", color: C.muted, fontSize: 11, marginTop: 10, lineHeight: 1.5 }}>
                  "Not Received" opens chat to resolve with the buyer directly.
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {reviewModal && (
        <ReviewModal
          listing={reviewModal}
          rating={reviewRating} hover={reviewHover} text={reviewText}
          onRate={setReviewRating} onHover={setReviewHover} onLeave={() => setReviewHover(0)}
          onTextChange={setReviewText} onSubmit={handleSubmitReview}
          onClose={() => { setReviewModal(null); setReviewRating(0); setReviewHover(0); setReviewText(""); }}
          loading={loading}
        />
      )}
      {contactModal && <ContactEmailModal userEmail={profile?.email || user?.email} onClose={() => setContactModal(false)} />}
      <aside className="sidebar">
        <div className="sidebar-logo" onClick={() => { setTab("home"); setSelectedListing(null); setSelectedChat(null); setProfileTab("menu"); }} style={{ cursor: "pointer" }}>
          <span style={{ fontSize: 26 }}>🛒</span>
          <span className="sidebar-logo-text">UniSwap</span>
        </div>
        {NAV_ITEMS.map(({ id, icon, label }) => (
          <div key={id} className={`nav-item ${tab === id ? "active" : ""}`} onClick={() => handleTabChange(id)}>
            <span className="nav-icon">{icon}</span>
            <span>{label}</span>
          </div>
        ))}
        <div style={{ marginTop: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderTop: `1px solid ${C.border}`, paddingTop: 20, marginTop: 8 }}>
            <Avatar initials={initials} size={34} src={avatarUrl} />
            <div style={{ minWidth: 0 }}>
              <div style={{ color: C.text, fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile?.full_name?.split(" ")[0]}</div>
              <div style={{ color: C.muted, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile?.email || user?.email}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="main-content">

        {/* ─── HOME ─── */}
        {tab === "home" && !selectedListing && (() => {
          const filtered = listings.filter(l => {
            const q = searchQuery.toLowerCase().trim();
            if (!q) return true;
            return (
              l.title?.toLowerCase().includes(q) ||
              l.description?.toLowerCase().includes(q) ||
              l.category?.toLowerCase().includes(q) ||
              l.condition?.toLowerCase().includes(q) ||
              l.profiles?.full_name?.toLowerCase().includes(q)
            );
          });
          return (
          <>
            <div className="page-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span onClick={() => { setSearchQuery(""); setActiveCat("All"); setSelectedListing(null); }} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <span style={{ fontSize: 22 }}>🛒</span>
                  <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 16, background: `linear-gradient(135deg,${C.accent},${C.warm})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>UniSwap</span>
                </span>
                <div>
                  <div style={{ color: C.muted, fontSize: 13, marginBottom: 1 }}>Good day 👋</div>
                  <div className="page-title">Marketplace</div>
                </div>
              </div>
              <Avatar initials={initials} size={42} src={avatarUrl} onClick={() => setTab("profile")} style={{ cursor: "pointer" }} />
            </div>

            {/* Search bar */}
            <div style={{ padding: "0 16px 16px" }}>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: searchFocused ? C.accent : C.muted, display: "flex", alignItems: "center", transition: "color .2s" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </div>
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="Search listings, categories, sellers…"
                  style={{ width: "100%", background: C.pill, border: `1.5px solid ${searchFocused ? C.accent : C.border}`, borderRadius: 14, padding: "13px 44px 13px 42px", color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box", transition: "border-color .2s", boxShadow: searchFocused ? `0 0 0 3px ${C.accent}18` : "none" }}
                />
                {searchQuery && (
                  <div onClick={() => setSearchQuery("")} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: C.muted, background: C.border, borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>✕</div>
                )}
              </div>

              {/* Search result count */}
              {searchQuery.trim() && (
                <div style={{ marginTop: 8, color: C.muted, fontSize: 13 }}>
                  {filtered.length === 0 ? (
                    <span style={{ color: "#FF5555" }}>No results for "<strong style={{ color: C.text }}>{searchQuery}</strong>"</span>
                  ) : (
                    <span><strong style={{ color: C.accent }}>{filtered.length}</strong> result{filtered.length !== 1 ? "s" : ""} for "<strong style={{ color: C.text }}>{searchQuery}</strong>"</span>
                  )}
                </div>
              )}
            </div>

            {/* Category filter — hide when searching */}
            {!searchQuery.trim() && (
              <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "0 16px 16px", scrollbarWidth: "none" }}>
                {CATEGORIES.map(c => <Pill key={c} active={activeCat === c} onClick={() => setActiveCat(c)}>{c}</Pill>)}
              </div>
            )}

            {/* Listings grid */}
            {listingsLoading ? <Loader /> : (
              <div className="listing-grid">
                {filtered.length === 0 && (
                  <div style={{ gridColumn: "1/-1", textAlign: "center", color: C.muted, padding: "60px 20px" }}>
                    {searchQuery.trim() ? (
                      <>
                        <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: C.text }}>No listings found</div>
                        <div style={{ fontSize: 14, marginTop: 6 }}>Try a different keyword or <span style={{ color: C.accent, cursor: "pointer", fontWeight: 600 }} onClick={() => setSearchQuery("")}>clear search</span></div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                        <div style={{ fontSize: 16, fontWeight: 600 }}>No listings yet</div>
                        <div style={{ fontSize: 14, marginTop: 4 }}>Be the first to sell something! 🚀</div>
                      </>
                    )}
                  </div>
                )}
                {filtered.map(l => {
                  const imgs = getImages(l);
                  return (
                    <div key={l.id} className="listing-card" onClick={() => { setSelectedListing(l); setActivePhoto(0); }}>
                      <div style={{ height: 140, background: C.pill, position: "relative", overflow: "hidden" }}>
                        {imgs[0] ? <img src={imgs[0]} alt={l.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>📦</div>}
                        <div style={{ position: "absolute", top: 8, left: 8, background: `${C.bg}DD`, borderRadius: 20, padding: "3px 10px", fontSize: 11, color: C.muted, fontWeight: 600 }}>{l.condition}</div>
                        <div onClick={e => { e.stopPropagation(); toggleSaved(l); }} style={{ position: "absolute", top: 8, right: 8, background: `${C.bg}DD`, borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, cursor: "pointer" }}>{savedItems[l.id] ? "❤️" : "🤍"}</div>
                      </div>
                      <div style={{ padding: "12px 14px 14px" }}>
                        <div style={{ color: C.text, fontSize: 13, fontWeight: 700, lineHeight: 1.4, marginBottom: 6, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{l.title}</div>
                        <div style={{ color: C.accent, fontSize: 16, fontWeight: 800 }}>₦{l.price?.toLocaleString()}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                          <Avatar initials={(l.profiles?.full_name || "??").slice(0, 2).toUpperCase()} size={20} />
                          <span style={{ color: C.muted, fontSize: 12 }}>{l.profiles?.full_name?.split(" ")[0]}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
          );
        })()}

        {/* ─── LISTING DETAIL ─── */}
        {tab === "home" && selectedListing && (() => {
          const imgs = getImages(selectedListing);
          return (
            <div className="detail-panel">
              <div style={{ padding: "16px 20px 12px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12, background: C.card }}>
                <div onClick={() => { setSelectedListing(null); setActivePhoto(0); }} style={{ cursor: "pointer", color: C.accent, fontSize: 22, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: C.pill, borderRadius: "50%" }}>←</div>
                <span style={{ color: C.text, fontWeight: 700, fontSize: 16 }}>Listing Detail</span>
                <div onClick={e => { e.stopPropagation(); toggleSaved(selectedListing); }} style={{ marginLeft: "auto", fontSize: 22, cursor: "pointer" }}>{savedItems[selectedListing.id] ? "❤️" : "🤍"}</div>
              </div>
              <div style={{ flex: 1, overflowY: "auto", paddingBottom: 100 }}>
                {/* Photo gallery */}
                {imgs.length > 0 ? (
                  <div>
                    <div style={{ height: 260, background: C.pill, position: "relative", overflow: "hidden" }}>
                      <img src={imgs[activePhoto]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      {imgs.length > 1 && <>
                        <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6 }}>
                          {imgs.map((_, i) => <div key={i} onClick={() => setActivePhoto(i)} style={{ width: i === activePhoto ? 22 : 7, height: 7, borderRadius: 4, background: i === activePhoto ? C.accent : "#ffffff88", transition: "all .2s", cursor: "pointer" }} />)}
                        </div>
                        {activePhoto > 0 && <div onClick={() => setActivePhoto(p => p - 1)} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,.6)", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", fontSize: 18 }}>‹</div>}
                        {activePhoto < imgs.length - 1 && <div onClick={() => setActivePhoto(p => p + 1)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,.6)", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", fontSize: 18 }}>›</div>}
                      </>}
                    </div>
                    {imgs.length > 1 && (
                      <div style={{ display: "flex", gap: 8, padding: "12px 16px", overflowX: "auto" }}>
                        {imgs.map((url, i) => <div key={i} onClick={() => setActivePhoto(i)} style={{ width: 56, height: 56, borderRadius: 10, overflow: "hidden", border: `2px solid ${i === activePhoto ? C.accent : "transparent"}`, flexShrink: 0, cursor: "pointer" }}><img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>)}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ height: 220, background: `${C.accent}0D`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 80 }}>📦</div>
                )}
                <div style={{ padding: "20px 20px 0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Syne',sans-serif", color: C.text, fontSize: 24, fontWeight: 800, lineHeight: 1.3 }}>{selectedListing.title}</div>
                      <div style={{ color: C.accent, fontSize: 26, fontWeight: 800, marginTop: 6 }}>₦{selectedListing.price?.toLocaleString()}</div>
                    </div>
                    <div style={{ background: `${C.green}22`, color: C.green, padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{selectedListing.condition}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
                    <div style={{ background: C.pill, borderRadius: 10, padding: "8px 14px", fontSize: 12, color: C.muted }}>📦 {selectedListing.category}</div>
                    <div style={{ background: C.pill, borderRadius: 10, padding: "8px 14px", fontSize: 12, color: C.muted }}>🕐 {new Date(selectedListing.created_at).toLocaleDateString()}</div>
                  </div>
                  <div style={{ marginTop: 20, padding: 16, background: C.pill, borderRadius: 16, display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}
                    onClick={() => { fetchSellerReviews(selectedListing.seller_id); }}>
                    <Avatar initials={(selectedListing.profiles?.full_name || "??").slice(0, 2).toUpperCase()} size={46} />
                    <div style={{ flex: 1 }}>
                      <div style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>{selectedListing.profiles?.full_name || "Unknown"}</div>
                      <div style={{ color: C.green, fontSize: 12, marginTop: 2 }}>✓ Campus verified seller</div>
                      {selectedListing.profiles?.rating > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                          <StarRating rating={Math.round(selectedListing.profiles.rating)} size={14} />
                          <span style={{ color: C.muted, fontSize: 12 }}>{selectedListing.profiles.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {selectedListing.description && <div style={{ marginTop: 16, color: C.muted, fontSize: 14, lineHeight: 1.8 }}>{selectedListing.description}</div>}

                  {/* Reviews section */}
                  {sellerReviews.length > 0 && (
                    <div style={{ marginTop: 24 }}>
                      <div style={{ color: C.text, fontWeight: 700, fontSize: 15, marginBottom: 12 }}>⭐ Seller Reviews ({sellerReviews.length})</div>
                      {reviewsLoading ? <Loader /> : sellerReviews.map(r => (
                        <div key={r.id} style={{ background: C.pill, borderRadius: 14, padding: "14px 16px", marginBottom: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <Avatar initials={(r.profiles?.full_name || "??").slice(0,2).toUpperCase()} size={28} />
                              <span style={{ color: C.text, fontWeight: 600, fontSize: 13 }}>{r.profiles?.full_name?.split(" ")[0] || "Student"}</span>
                            </div>
                            <StarRating rating={r.rating} size={13} />
                          </div>
                          <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.6 }}>{r.comment}</div>
                          <div style={{ color: C.border, fontSize: 11, marginTop: 6 }}>{new Date(r.created_at).toLocaleDateString()}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "12px 16px 28px", background: C.card, borderTop: `1px solid ${C.border}`, display: "flex", gap: 10 }}>
                {selectedListing.seller_id === user?.id ? (
                  <div style={{ flex: 1, textAlign: "center", color: C.muted, fontSize: 14, padding: "12px 0" }}>This is your listing</div>
                ) : (
                  <>
                    <button onClick={() => startChat(selectedListing)}
                      style={{ width: 50, height: 50, borderRadius: 14, background: C.pill, border: `1.5px solid ${C.accent}44`, color: C.accent, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    </button>
                    <button onClick={() => handleBuyNow(selectedListing)}
                      style={{ flex: 1, height: 50, borderRadius: 14, background: `linear-gradient(135deg,${C.accent},#0099CC)`, border: "none", color: "#000", fontWeight: 800, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                      Buy Now
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })()}

        {/* ─── MESSAGES ─── */}
        {tab === "messages" && !selectedChat && (
          <>
            <div className="page-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span onClick={() => { setTab("home"); setSelectedListing(null); setSelectedChat(null); }} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <span style={{ fontSize: 22 }}>🛒</span>
                  <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 16, background: `linear-gradient(135deg,${C.accent},${C.warm})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>UniSwap</span>
                </span>
                <div className="page-title">Messages</div>
              </div>
            </div>
            <div style={{ padding: "0 0 80px" }}>
              {chats.length === 0 ? (
                <div style={{ textAlign: "center", color: C.muted, padding: "80px 20px" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>No conversations yet</div>
                  <div style={{ fontSize: 14, marginTop: 4 }}>Browse listings and message a seller!</div>
                </div>
              ) : chats.map(c => (
                <div key={c.id} onClick={() => openChat(c)} style={{ padding: "16px 24px", display: "flex", gap: 14, alignItems: "center", cursor: "pointer", borderBottom: `1px solid ${C.border}22`, transition: "background .15s" }} onMouseEnter={e => e.currentTarget.style.background = C.pill} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <Avatar initials="??" size={48} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <div style={{ color: C.text, fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.listings?.title}</div>
                      <div style={{ color: C.muted, fontSize: 12, flexShrink: 0 }}>{new Date(c.created_at).toLocaleDateString()}</div>
                    </div>
                    <div style={{ color: C.muted, fontSize: 13, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.content}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ─── CHAT DETAIL ─── */}
        {tab === "messages" && selectedChat && (
          <div className="detail-panel">
            <div style={{ padding: "14px 20px 12px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12, background: C.card }}>
              <div onClick={() => setSelectedChat(null)} style={{ cursor: "pointer", color: C.accent, fontSize: 22, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: C.pill, borderRadius: "50%" }}>←</div>
              <Avatar initials="??" size={38} />
              <div>
                <div style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>Chat</div>
                <div style={{ color: C.muted, fontSize: 12 }}>Re: {selectedChat?.listings?.title}</div>
              </div>
              <div style={{ marginLeft: "auto", background: `${C.green}22`, color: C.green, fontSize: 11, padding: "4px 12px", borderRadius: 20, fontWeight: 600 }}>Active</div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
              {messages.length === 0 && <div style={{ textAlign: "center", color: C.muted, padding: "60px 20px", fontSize: 14 }}>No messages yet. Say hi! 👋</div>}
              {messages.map(m => {
                const isMe = m.sender_id === user.id;
                return (
                  <div key={m.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: 12 }}>
                    <div style={{ maxWidth: "70%", background: isMe ? `linear-gradient(135deg,${C.accent},#0099CC)` : C.pill, color: isMe ? "#000" : C.text, borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px", padding: "11px 15px", fontSize: 14, lineHeight: 1.5 }}>
                      <div>{m.content}</div>
                      <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: "right" }}>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={msgEndRef} />
            </div>
            <div style={{ padding: "12px 20px 28px", display: "flex", gap: 10, borderTop: `1px solid ${C.border}`, background: C.card }}>
              <Input style={{ flex: 1 }} placeholder="Type a message…" value={msgInput} onChange={e => setMsgInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} />
              <button onClick={sendMessage} style={{ background: `linear-gradient(135deg,${C.accent},#0099CC)`, border: "none", borderRadius: 12, width: 48, height: 48, fontSize: 20, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontWeight: 700 }}>↑</button>
            </div>
          </div>
        )}

        {/* ─── SELL ─── */}
        {tab === "sell" && (
          <div style={{ flex: 1, overflowY: "auto" }}>
            <div className="page-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span onClick={() => { setTab("home"); setSelectedListing(null); }} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <span style={{ fontSize: 22 }}>🛒</span>
                  <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 16, background: `linear-gradient(135deg,${C.accent},${C.warm})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>UniSwap</span>
                </span>
                <div className="page-title">Sell an Item</div>
              </div>
            </div>
            <div className="form-page">
              <div style={{ color: C.muted, fontSize: 15, marginBottom: 28 }}>Turn your unused stuff into cash 💰</div>

              {/* Photos */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ color: C.muted, fontSize: 12, marginBottom: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Photos ({sellPhotos.length}/5)</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {sellPreviews.map((src, i) => (
                    <div key={i} style={{ position: "relative", width: 88, height: 88, borderRadius: 14, overflow: "hidden", border: `1px solid ${C.border}` }}>
                      <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <div onClick={() => removePhoto(i)} style={{ position: "absolute", top: 5, right: 5, background: "rgba(0,0,0,.7)", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", fontSize: 12 }}>✕</div>
                      {i === 0 && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: `${C.accent}CC`, fontSize: 9, fontWeight: 700, color: "#000", textAlign: "center", padding: "3px 0" }}>MAIN</div>}
                    </div>
                  ))}
                  {sellPhotos.length < 5 && (
                    <div onClick={() => photoInputRef.current?.click()} style={{ width: 88, height: 88, borderRadius: 14, border: `2px dashed ${C.accent}55`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", background: `${C.accent}08`, gap: 6 }}>
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      <span style={{ color: C.accent, fontSize: 11, fontWeight: 600 }}>Add Photo</span>
                    </div>
                  )}
                </div>
                <input ref={photoInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handlePhotoSelect} />
                <div style={{ color: C.muted, fontSize: 12, marginTop: 8 }}>First photo is the main thumbnail. Max 5 photos.</div>
              </div>

              {/* Upload progress */}
              {loading && uploadProgress > 0 && uploadProgress < 100 && (
                <div style={{ marginBottom: 20, padding: 16, background: C.pill, borderRadius: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ color: C.muted, fontSize: 13 }}>Uploading photos…</span>
                    <span style={{ color: C.accent, fontSize: 13, fontWeight: 700 }}>{uploadProgress}%</span>
                  </div>
                  <div style={{ background: C.border, borderRadius: 10, height: 6, overflow: "hidden" }}>
                    <div style={{ background: `linear-gradient(135deg,${C.accent},#0099CC)`, height: "100%", width: `${uploadProgress}%`, borderRadius: 10, transition: "width .3s" }} />
                  </div>
                </div>
              )}

              {/* Two-column on desktop */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <div style={{ color: C.muted, fontSize: 12, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Item Name</div>
                  <Input placeholder="e.g. Calculus Textbook" value={sellTitle} onChange={e => setSellTitle(e.target.value)} />
                </div>
                <div>
                  <div style={{ color: C.muted, fontSize: 12, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Price (₦)</div>
                  <Input type="number" placeholder="e.g. 4500" value={sellPrice} onChange={e => setSellPrice(e.target.value)} />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ color: C.muted, fontSize: 12, marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Category</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{["Books","Electronics","Appliances","Furniture","Tools","Music","Accessories"].map(c => <Pill key={c} active={sellCat === c} onClick={() => setSellCat(c)}>{c}</Pill>)}</div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: C.muted, fontSize: 12, marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Condition</div>
                <div style={{ display: "flex", gap: 8 }}>{["New","Good","Fairly Used"].map(c => <Pill key={c} active={sellCond === c} color={C.green} onClick={() => setSellCond(c)}>{c}</Pill>)}</div>
              </div>
              <div style={{ marginBottom: 28 }}>
                <div style={{ color: C.muted, fontSize: 12, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Description</div>
                <textarea style={{ background: C.pill, border: `1px solid ${C.border}`, borderRadius: 12, padding: "13px 16px", color: C.text, fontSize: 14, width: "100%", height: 100, resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.6 }} placeholder="Describe condition, pickup spot, any extras…" value={sellDesc} onChange={e => setSellDesc(e.target.value)} />
              </div>
              <Btn primary onClick={handlePostListing}>{loading ? (uploadProgress > 0 ? `Uploading ${uploadProgress}%…` : "Posting…") : "🚀 Post Listing"}</Btn>
            </div>
          </div>
        )}

        {/* ─── PROFILE ─── */}
        {tab === "profile" && (
          <div style={{ flex: 1, overflowY: "auto" }}>
            <div className="page-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span onClick={() => { setTab("home"); setSelectedListing(null); setProfileTab("menu"); }} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <span style={{ fontSize: 22 }}>🛒</span>
                  <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 16, background: `linear-gradient(135deg,${C.accent},${C.warm})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>UniSwap</span>
                </span>
                <div className="page-title">Account</div>
              </div>
            </div>
            <div className="form-page">

              {/* Profile card */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 24, padding: "28px 24px", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                  {/* Tappable avatar with camera badge */}
                  <div style={{ position: "relative", cursor: "pointer", flexShrink: 0 }} onClick={() => avatarInputRef.current?.click()}>
                    <Avatar initials={initials} size={72} src={avatarUrl} />
                    {/* Hover/tap overlay */}
                    <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", opacity: avatarUploading ? 1 : 0, transition: "opacity .2s" }}
                      onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                      onMouseLeave={e => { if (!avatarUploading) e.currentTarget.style.opacity = "0"; }}>
                      {avatarUploading
                        ? <div style={{ width: 18, height: 18, border: "2px solid #fff", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                        : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                      }
                    </div>
                    {/* Camera badge */}
                    <div style={{ position: "absolute", bottom: 1, right: 1, background: C.accent, borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${C.card}`, pointerEvents: "none" }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    </div>
                    <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) handleAvatarUpload(e.target.files[0]); e.target.value = ""; }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Syne',sans-serif", color: C.text, fontSize: 20, fontWeight: 800 }}>{profile?.full_name || "User"}</div>
                    <div style={{ color: C.muted, fontSize: 13, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile?.email || user?.email}</div>
                    <div style={{ color: C.muted, fontSize: 13, marginTop: 2 }}>Matric: {profile?.matric_number || "—"}</div>
                    {avatarUploading && <div style={{ color: C.accent, fontSize: 11, marginTop: 4, fontWeight: 600 }}>Uploading photo…</div>}
                  </div>
                </div>
                {/* Stats row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 20 }}>
                  {[
                    [myListings.filter(l => !l.is_sold).length, "Active"],
                    [myListings.filter(l => l.is_sold).length, "Sold"],
                    [profile?.rating?.toFixed(1) || "0.0", "Rating ⭐"],
                  ].map(([val, label]) => (
                    <div key={label} style={{ background: C.pill, borderRadius: 14, padding: "14px 10px", textAlign: "center" }}>
                      <div style={{ fontFamily: "'Syne',sans-serif", color: C.accent, fontSize: 22, fontWeight: 800 }}>{val}</div>
                      <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>{label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  <div style={{ background: `${C.green}22`, color: C.green, padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>✓ Campus Verified</div>
                </div>
                {profile?.bio && <div style={{ color: C.muted, fontSize: 13, marginTop: 14, lineHeight: 1.6, textAlign: "left" }}>{profile.bio}</div>}
              </div>

              {/* Tab switcher — hidden when in edit mode */}
              {profileTab !== "edit" && (
                <div style={{ display: "flex", background: C.pill, borderRadius: 14, padding: 4, marginBottom: 20, gap: 4 }}>
                  {[["menu", "⚙️ Account"], ["listings", "📦 Listings"], ["reviews", "⭐ Reviews"]].map(([id, label]) => (
                    <div key={id} onClick={() => { setProfileTab(id); if (id === "reviews") fetchSellerReviews(user.id); }} style={{ flex: 1, textAlign: "center", padding: "10px 0", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", background: profileTab === id ? C.card : "transparent", color: profileTab === id ? C.text : C.muted, border: profileTab === id ? `1px solid ${C.border}` : "1px solid transparent", transition: "all .2s" }}>{label}</div>
                  ))}
                </div>
              )}

              {/* ── EDIT PROFILE ── */}
              {profileTab === "edit" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <div onClick={() => setProfileTab("menu")} style={{ cursor: "pointer", color: C.accent, fontSize: 22, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: C.pill, borderRadius: "50%", flexShrink: 0 }}>←</div>
                    <div style={{ fontFamily: "'Syne',sans-serif", color: C.text, fontSize: 20, fontWeight: 800 }}>Edit Profile</div>
                  </div>

                  {/* Bio data card */}
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: "24px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                      <div style={{ color: C.muted, fontSize: 12, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Full Name</div>
                      <Input placeholder="Your full name" value={editName} onChange={e => setEditName(e.target.value)} />
                    </div>
                    <div>
                      <div style={{ color: C.muted, fontSize: 12, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>School Email</div>
                      <Input value={profile?.email || user?.email || ""} disabled style={{ opacity: 0.5, cursor: "not-allowed" }} />
                      <div style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>Email cannot be changed</div>
                    </div>
                    <div>
                      <div style={{ color: C.muted, fontSize: 12, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Matric Number</div>
                      <Input placeholder="Your matric number" value={editMatric} onChange={e => setEditMatric(e.target.value)} />
                    </div>
                    <div>
                      <div style={{ color: C.muted, fontSize: 12, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Bio</div>
                      <textarea
                        placeholder="Tell buyers about yourself — department, year, what you usually sell…"
                        value={editBio} onChange={e => setEditBio(e.target.value)}
                        style={{ width: "100%", background: C.pill, border: `1px solid ${C.border}`, borderRadius: 12, padding: "13px 16px", color: C.text, fontSize: 14, height: 90, resize: "none", outline: "none", boxSizing: "border-box", lineHeight: 1.6 }}
                      />
                    </div>
                  </div>

                  {/* Change Password */}
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: "24px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                      <div style={{ fontFamily: "'Syne',sans-serif", color: C.text, fontWeight: 700, fontSize: 15 }}>🔐 Change Password</div>
                      <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Leave blank to keep your current password.</div>
                    </div>
                    <div style={{ height: 1, background: C.border }} />

                    {/* Current password */}
                    <div>
                      <div style={{ color: C.muted, fontSize: 12, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Current Password</div>
                      <div style={{ position: "relative" }}>
                        <Input type={showPassword ? "text" : "password"} placeholder="Enter your current password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} style={{ paddingRight: 48 }} />
                        <div onClick={() => setShowPassword(p => !p)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: C.muted, display: "flex" }}><EyeIcon open={showPassword} /></div>
                      </div>
                    </div>

                    <div style={{ height: 1, background: `${C.border}88` }} />

                    {/* New password */}
                    <div>
                      <div style={{ color: C.muted, fontSize: 12, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>New Password</div>
                      <div style={{ position: "relative" }}>
                        <Input type={showPassword ? "text" : "password"} placeholder="Enter new password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ paddingRight: 48 }} />
                        <div onClick={() => setShowPassword(p => !p)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: C.muted, display: "flex" }}><EyeIcon open={showPassword} /></div>
                      </div>
                      {/* Strength meter */}
                      {newPassword.length > 0 && (
                        <div style={{ marginTop: 8, background: C.pill, borderRadius: 10, padding: "10px 14px" }}>
                          <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                            {[6, 8, 10, 12].map(len => (
                              <div key={len} style={{ flex: 1, height: 4, borderRadius: 2, background: newPassword.length >= len ? (len >= 10 ? C.green : len >= 8 ? C.accent : C.warm) : C.border, transition: "background .2s" }} />
                            ))}
                          </div>
                          <div style={{ fontSize: 11, color: newPassword.length < 6 ? C.warm : newPassword.length < 10 ? C.accent : C.green, fontWeight: 600 }}>
                            {newPassword.length < 6 ? "Too short — min 6 characters" : newPassword.length < 8 ? "Weak" : newPassword.length < 10 ? "Good" : "Strong ✓"}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Confirm password */}
                    <div>
                      <div style={{ color: C.muted, fontSize: 12, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Confirm New Password</div>
                      <div style={{ position: "relative" }}>
                        <Input type={showPassword ? "text" : "password"} placeholder="Repeat new password" value={newPasswordConfirm} onChange={e => setNewPasswordConfirm(e.target.value)} style={{ paddingRight: 48, borderColor: newPasswordConfirm.length > 0 ? (newPassword === newPasswordConfirm ? C.green : "#FF5555") : C.border }} />
                        <div onClick={() => setShowPassword(p => !p)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: C.muted, display: "flex" }}><EyeIcon open={showPassword} /></div>
                      </div>
                      {newPasswordConfirm.length > 0 && (
                        <div style={{ marginTop: 6, fontSize: 12, fontWeight: 600, color: newPassword === newPasswordConfirm ? C.green : "#FF5555", display: "flex", alignItems: "center", gap: 4 }}>
                          {newPassword === newPasswordConfirm ? "✓ Passwords match" : "✕ Passwords do not match"}
                        </div>
                      )}
                    </div>
                  </div>

                  <Btn primary onClick={handleUpdateProfile}>{loading ? "Saving…" : "Save Changes ✓"}</Btn>
                  <Btn onClick={() => setProfileTab("menu")}>Cancel</Btn>
                </div>
              )}
              {profileTab === "menu" && (
                <>
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, overflow: "hidden", marginBottom: 20 }}>
                    {[
                      ["👤", "Profile", "edit"],
                      ["🛒", "Purchases", "purchases"],
                      ["❤️", "Saved Items", "saved"],
                      ["⚙️", "Settings", "settings"],
                      ["🆘", "Support", "support"],
                    ].map(([icon, label, target], i, arr) => (
                      <div key={label} onClick={() => {
                        if (target === "edit") { setEditName(profile?.full_name || ""); setEditMatric(profile?.matric_number || ""); setEditBio(profile?.bio || ""); setCurrentPassword(""); setNewPassword(""); setNewPasswordConfirm(""); }
                        if (target === "purchases") fetchPurchases();
                        setProfileTab(target);
                      }} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", borderBottom: i < arr.length - 1 ? `1px solid ${C.border}22` : "none", cursor: "pointer", transition: "background .15s" }} onMouseEnter={e => e.currentTarget.style.background = C.pill} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <span style={{ fontSize: 20, width: 28 }}>{icon}</span>
                        <span style={{ color: C.text, fontSize: 15, fontWeight: 500 }}>{label}</span>
                        {label === "Saved Items" && Object.keys(savedItems).length > 0 && (
                          <span style={{ background: C.accent, color: "#000", fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 10, marginLeft: 2 }}>{Object.keys(savedItems).length}</span>
                        )}
                        <span style={{ marginLeft: "auto", color: C.muted, fontSize: 18 }}>›</span>
                      </div>
                    ))}
                  </div>
                  <Btn danger onClick={handleSignOut}>Sign Out</Btn>
                </>
              )}

              {/* ── PURCHASES ── */}
              {profileTab === "purchases" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                    <div onClick={() => setProfileTab("menu")} style={{ cursor: "pointer", color: C.accent, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: C.pill, borderRadius: "50%", fontSize: 20, flexShrink: 0 }}>←</div>
                    <div style={{ fontFamily: "'Syne',sans-serif", color: C.text, fontSize: 20, fontWeight: 800 }}>Purchases</div>
                  </div>
                  <div style={{ color: C.muted, fontSize: 13, marginBottom: 4 }}>Items you've messaged sellers about.</div>
                  {purchasesLoading ? <Loader /> : purchases.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "48px 20px" }}>
                      <div style={{ fontSize: 44, marginBottom: 12 }}>🛒</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>No purchases yet</div>
                      <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>Items you contact sellers about will appear here.</div>
                    </div>
                  ) : purchases.map(l => {
                    const imgs = getImages(l);
                    return (
                      <div key={l.id} onClick={() => { setSelectedListing(l); setActivePhoto(0); setTab("home"); setProfileTab("menu"); }} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", display: "flex", cursor: "pointer" }}>
                        <div style={{ width: 80, flexShrink: 0, background: C.pill }}>
                          {imgs[0] ? <img src={imgs[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>📦</div>}
                        </div>
                        <div style={{ padding: "14px 16px", flex: 1, minWidth: 0 }}>
                          <div style={{ color: C.text, fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.title}</div>
                          <div style={{ color: C.accent, fontWeight: 800, fontSize: 15, marginTop: 2 }}>₦{l.price?.toLocaleString()}</div>
                          <div style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "center" }}>
                            <span style={{ background: C.pill, color: C.muted, fontSize: 11, padding: "2px 8px", borderRadius: 8 }}>{l.category}</span>
                            <span style={{ fontSize: 11, color: l.is_sold ? C.green : C.accent, fontWeight: 600 }}>{l.is_sold ? "✓ Sold" : "● Available"}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── SAVED ITEMS ── */}
              {profileTab === "saved" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                    <div onClick={() => setProfileTab("menu")} style={{ cursor: "pointer", color: C.accent, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: C.pill, borderRadius: "50%", fontSize: 20, flexShrink: 0 }}>←</div>
                    <div style={{ fontFamily: "'Syne',sans-serif", color: C.text, fontSize: 20, fontWeight: 800 }}>Saved Items</div>
                  </div>
                  {Object.values(savedItems).length === 0 ? (
                    <div style={{ textAlign: "center", padding: "48px 20px" }}>
                      <div style={{ fontSize: 44, marginBottom: 12 }}>❤️</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>No saved items yet</div>
                      <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>Tap the ❤️ on any listing to save it here.</div>
                    </div>
                  ) : Object.values(savedItems).map(l => {
                    const imgs = getImages(l);
                    return (
                      <div key={l.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", display: "flex", cursor: "pointer" }} onClick={() => { setSelectedListing(l); setActivePhoto(0); setTab("home"); setProfileTab("menu"); }}>
                        <div style={{ width: 80, flexShrink: 0, background: C.pill }}>
                          {imgs[0] ? <img src={imgs[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>📦</div>}
                        </div>
                        <div style={{ padding: "14px 16px", flex: 1, minWidth: 0 }}>
                          <div style={{ color: C.text, fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.title}</div>
                          <div style={{ color: C.accent, fontWeight: 800, fontSize: 15, marginTop: 2 }}>₦{l.price?.toLocaleString()}</div>
                          <div style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ background: C.pill, color: C.muted, fontSize: 11, padding: "2px 8px", borderRadius: 8 }}>{l.category}</span>
                            <span onClick={e => { e.stopPropagation(); toggleSaved(l); }} style={{ color: "#FF5555", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Remove ✕</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── SETTINGS ── */}
              {profileTab === "settings" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                    <div onClick={() => { setProfileTab("menu"); setDeleteConfirmStep(0); setDeleteConfirmText(""); }} style={{ cursor: "pointer", color: C.accent, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: C.pill, borderRadius: "50%", fontSize: 20, flexShrink: 0 }}>←</div>
                    <div style={{ fontFamily: "'Syne',sans-serif", color: C.text, fontSize: 20, fontWeight: 800 }}>Settings</div>
                  </div>

                  {/* ── Notifications ── */}
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, overflow: "hidden" }}>
                    <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}22` }}>
                      <div style={{ color: C.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Notifications</div>
                    </div>

                    {/* Push notifications */}
                    <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: C.text, fontSize: 15, fontWeight: 500 }}>Push Notifications</div>
                        <div style={{ color: C.muted, fontSize: 13, marginTop: 3 }}>
                          {notifPermission === "denied" ? "Blocked — change in browser settings" : notifEnabled ? "You'll receive alerts for messages and activity" : "Allow UniSwap to send you pop-up alerts"}
                        </div>
                      </div>
                      <div onClick={handleToggleNotifications} style={{ width: 50, height: 28, borderRadius: 14, background: notifEnabled ? C.accent : C.border, position: "relative", cursor: notifPermission === "denied" ? "not-allowed" : "pointer", transition: "background .25s", flexShrink: 0, opacity: notifPermission === "denied" ? 0.5 : 1 }}>
                        <div style={{ position: "absolute", top: 3, left: notifEnabled ? 23 : 3, width: 22, height: 22, borderRadius: "50%", background: "#fff", transition: "left .25s", boxShadow: "0 1px 4px rgba(0,0,0,.3)" }} />
                      </div>
                    </div>

                    {/* Message alerts — own independent toggle */}
                    <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, borderTop: `1px solid ${C.border}22` }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: notifEnabled ? C.text : C.muted, fontSize: 15, fontWeight: 500 }}>New Message Alerts</div>
                        <div style={{ color: C.muted, fontSize: 13, marginTop: 3 }}>
                          {!notifEnabled ? "Enable Push Notifications first" : msgAlertsEnabled ? "You'll be alerted when someone messages you" : "Message pop-ups are off"}
                        </div>
                      </div>
                      <div onClick={handleToggleMsgAlerts} style={{ width: 50, height: 28, borderRadius: 14, background: msgAlertsEnabled && notifEnabled ? C.accent : C.border, position: "relative", cursor: notifEnabled ? "pointer" : "not-allowed", transition: "background .25s", flexShrink: 0, opacity: notifEnabled ? 1 : 0.35 }}>
                        <div style={{ position: "absolute", top: 3, left: msgAlertsEnabled && notifEnabled ? 23 : 3, width: 22, height: 22, borderRadius: "50%", background: "#fff", transition: "left .25s", boxShadow: "0 1px 4px rgba(0,0,0,.3)" }} />
                      </div>
                    </div>
                  </div>

                  {/* ── About ── */}
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, overflow: "hidden" }}>
                    <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}22` }}>
                      <div style={{ color: C.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>About</div>
                    </div>
                    <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ color: C.text, fontSize: 15, fontWeight: 500 }}>UniSwap</div>
                        <div style={{ color: C.muted, fontSize: 13, marginTop: 3 }}>Campus marketplace · v1.0.0</div>
                      </div>
                      <div style={{ background: `${C.green}22`, color: C.green, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 10 }}>Up to date</div>
                    </div>
                  </div>

                  {/* ── Danger Zone ── */}
                  <div style={{ background: C.card, border: `1px solid #FF555533`, borderRadius: 20, overflow: "hidden" }}>
                    <div style={{ padding: "14px 20px", borderBottom: `1px solid #FF555522` }}>
                      <div style={{ color: "#FF5555", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Danger Zone</div>
                    </div>

                    {/* Step 0 — initial delete button */}
                    {deleteConfirmStep === 0 && (
                      <div onClick={() => setDeleteConfirmStep(1)} style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", transition: "background .15s" }} onMouseEnter={e => e.currentTarget.style.background = "#FF555511"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: "#FF5555", fontSize: 15, fontWeight: 600 }}>Delete Account</div>
                          <div style={{ color: C.muted, fontSize: 13, marginTop: 3 }}>Permanently remove your account and all data</div>
                        </div>
                        <span style={{ color: "#FF5555", fontSize: 18 }}>›</span>
                      </div>
                    )}

                    {/* Step 1 — are you sure? */}
                    {deleteConfirmStep === 1 && (
                      <div style={{ padding: "20px" }}>
                        <div style={{ color: C.text, fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Are you sure?</div>
                        <div style={{ background: "#FF555511", border: "1px solid #FF555533", borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
                          <div style={{ color: "#FF5555", fontSize: 13, lineHeight: 1.7 }}>
                            This will permanently delete:<br />
                            • Your profile and account<br />
                            • All your listings<br />
                            • All your messages<br />
                            • All your reviews<br />
                            <strong>This cannot be undone.</strong>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 10 }}>
                          <button onClick={() => setDeleteConfirmStep(0)} style={{ flex: 1, background: C.pill, color: C.text, border: "none", borderRadius: 12, padding: "12px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                          <button onClick={() => setDeleteConfirmStep(2)} style={{ flex: 1, background: "#FF555522", color: "#FF5555", border: "1px solid #FF555544", borderRadius: 12, padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Continue →</button>
                        </div>
                      </div>
                    )}

                    {/* Step 2 — type DELETE to confirm */}
                    {deleteConfirmStep === 2 && (
                      <div style={{ padding: "20px" }}>
                        <div style={{ color: C.text, fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Final confirmation</div>
                        <div style={{ color: C.muted, fontSize: 13, marginBottom: 14, lineHeight: 1.6 }}>
                          Type <strong style={{ color: "#FF5555" }}>DELETE</strong> below to permanently delete your account.
                        </div>
                        <input
                          value={deleteConfirmText}
                          onChange={e => setDeleteConfirmText(e.target.value)}
                          placeholder="Type DELETE here"
                          style={{ background: C.pill, border: `1.5px solid ${deleteConfirmText === "DELETE" ? "#FF5555" : C.border}`, borderRadius: 12, padding: "12px 16px", color: deleteConfirmText === "DELETE" ? "#FF5555" : C.text, fontSize: 15, fontWeight: 700, width: "100%", outline: "none", boxSizing: "border-box", marginBottom: 14, letterSpacing: 1 }}
                        />
                        <div style={{ display: "flex", gap: 10 }}>
                          <button onClick={() => { setDeleteConfirmStep(0); setDeleteConfirmText(""); }} style={{ flex: 1, background: C.pill, color: C.text, border: "none", borderRadius: 12, padding: "12px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                          <button
                            onClick={handleDeleteAccount}
                            disabled={deleteConfirmText !== "DELETE" || loading}
                            style={{ flex: 1, background: deleteConfirmText === "DELETE" ? "#FF5555" : "#FF555522", color: deleteConfirmText === "DELETE" ? "#fff" : "#FF555566", border: "none", borderRadius: 12, padding: "12px", fontSize: 14, fontWeight: 700, cursor: deleteConfirmText === "DELETE" ? "pointer" : "not-allowed", transition: "all .2s" }}
                          >
                            {loading ? "Deleting…" : "Delete Forever"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── SUPPORT ── */}
              {profileTab === "support" && !supportTopic && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                    <div onClick={() => setProfileTab("menu")} style={{ cursor: "pointer", color: C.accent, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: C.pill, borderRadius: "50%", fontSize: 20, flexShrink: 0 }}>←</div>
                    <div style={{ fontFamily: "'Syne',sans-serif", color: C.text, fontSize: 20, fontWeight: 800 }}>Support</div>
                  </div>
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, overflow: "hidden" }}>
                    {[
                      { title: "Report a listing",    sub: "Flag inappropriate or fraudulent content",   icon: "🚩", placeholder: "Which listing? What's the issue?" },
                      { title: "Account issues",       sub: "Login problems, account recovery",            icon: "🔐", placeholder: "Describe your account issue…" },
                      { title: "Transaction dispute",  sub: "Issues with a buyer or seller",               icon: "⚖️", placeholder: "Describe the transaction and the problem…" },
                      { title: "Suggest a feature",   sub: "Help us improve UniSwap",                     icon: "💡", placeholder: "What feature would you love to see?" },
                    ].map((topic, i, arr) => (
                      <div key={topic.title} onClick={() => { setSupportTopic(topic); setSupportSubject(topic.title); setSupportMessage(""); }} style={{ padding: "16px 20px", borderBottom: i < arr.length - 1 ? `1px solid ${C.border}22` : "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, transition: "background .15s" }} onMouseEnter={e => e.currentTarget.style.background = C.pill} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <span style={{ fontSize: 22, width: 28 }}>{topic.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>{topic.title}</div>
                          <div style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>{topic.sub}</div>
                        </div>
                        <span style={{ color: C.muted, fontSize: 18 }}>›</span>
                      </div>
                    ))}
                  </div>
                  {/* Contact email */}
                  <div onClick={() => setContactModal(true)} style={{ background: `${C.accent}0D`, border: `1px solid ${C.accent}22`, borderRadius: 14, padding: 16, textAlign: "center", cursor: "pointer", transition: "background .15s" }} onMouseEnter={e => e.currentTarget.style.background = `${C.accent}18`} onMouseLeave={e => e.currentTarget.style.background = `${C.accent}0D`}>
                    <div style={{ color: C.muted, fontSize: 13 }}>Need urgent help? Email us directly</div>
                    <div style={{ color: C.accent, fontWeight: 700, fontSize: 15, marginTop: 6 }}>support@uniswap.campus →</div>
                  </div>
                </div>
              )}

              {/* ── SUPPORT TOPIC FORM ── */}
              {profileTab === "support" && supportTopic && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                    <div onClick={() => setSupportTopic(null)} style={{ cursor: "pointer", color: C.accent, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: C.pill, borderRadius: "50%", fontSize: 20, flexShrink: 0 }}>←</div>
                    <div>
                      <div style={{ fontFamily: "'Syne',sans-serif", color: C.text, fontSize: 18, fontWeight: 800 }}>{supportTopic.icon} {supportTopic.title}</div>
                      <div style={{ color: C.muted, fontSize: 13 }}>{supportTopic.sub}</div>
                    </div>
                  </div>

                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
                    {/* Auto-filled user info */}
                    <div style={{ background: C.pill, borderRadius: 12, padding: "12px 14px" }}>
                      <div style={{ color: C.muted, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Submitting as</div>
                      <div style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>{profile?.full_name}</div>
                      <div style={{ color: C.muted, fontSize: 13 }}>{profile?.email || user?.email}</div>
                    </div>
                    <div>
                      <div style={{ color: C.muted, fontSize: 12, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Subject</div>
                      <input value={supportSubject} onChange={e => setSupportSubject(e.target.value)} style={{ background: C.pill, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 16px", color: C.text, fontSize: 14, width: "100%", outline: "none", boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <div style={{ color: C.muted, fontSize: 12, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Details</div>
                      <textarea
                        value={supportMessage} onChange={e => setSupportMessage(e.target.value)}
                        placeholder={supportTopic.placeholder}
                        style={{ background: C.pill, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 16px", color: C.text, fontSize: 14, width: "100%", height: 120, resize: "none", outline: "none", boxSizing: "border-box", lineHeight: 1.6 }}
                      />
                      <div style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>{supportMessage.length < 20 ? `${20 - supportMessage.length} more characters needed` : `✓ ${supportMessage.length} characters`}</div>
                    </div>
                  </div>

                  <button onClick={handleSubmitSupportTicket} disabled={loading} style={{ background: `linear-gradient(135deg,${C.accent},#0099CC)`, color: "#000", border: "none", borderRadius: 14, padding: "14px", fontSize: 15, fontWeight: 700, cursor: "pointer", width: "100%" }}>
                    {loading ? "Sending…" : "Send Request →"}
                  </button>

                  {/* Also offer email fallback */}
                  <div style={{ textAlign: "center" }}>
                    <span style={{ color: C.muted, fontSize: 13 }}>Or </span>
                    <span onClick={() => setContactModal(true)} style={{ color: C.accent, fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}>email us directly</span>
                  </div>
                </div>
              )}

              {/* ── MY LISTINGS DASHBOARD ── */}
              {profileTab === "listings" && (
                <>
                  {/* Active / Sold tabs */}
                  <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                    {[["active", `Active (${myListings.filter(l => !l.is_sold).length})`], ["sold", `Sold (${myListings.filter(l => l.is_sold).length})`]].map(([id, label]) => (
                      <Pill key={id} active={myListingsTab === id} onClick={() => setMyListingsTab(id)}>{label}</Pill>
                    ))}
                    <div style={{ marginLeft: "auto" }}>
                      <Btn primary style={{ padding: "7px 16px", fontSize: 13, borderRadius: 20, width: "auto" }} onClick={() => handleTabChange("sell")}>+ New</Btn>
                    </div>
                  </div>

                  {myListingsLoading ? <Loader /> : (() => {
                    const filtered = myListings.filter(l => myListingsTab === "active" ? !l.is_sold : l.is_sold);
                    if (filtered.length === 0) return (
                      <div style={{ textAlign: "center", padding: "48px 20px", color: C.muted }}>
                        <div style={{ fontSize: 44, marginBottom: 12 }}>{myListingsTab === "active" ? "📭" : "🎉"}</div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{myListingsTab === "active" ? "No active listings" : "No sold items yet"}</div>
                        <div style={{ fontSize: 13, marginTop: 6 }}>{myListingsTab === "active" ? "Post something to start selling!" : "Mark items as sold when deals close."}</div>
                        {myListingsTab === "active" && <div style={{ marginTop: 16 }}><Btn primary style={{ width: "auto", padding: "10px 24px" }} onClick={() => handleTabChange("sell")}>🚀 Post a Listing</Btn></div>}
                      </div>
                    );
                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {filtered.map(l => {
                          const imgs = getImages(l);
                          return (
                            <div key={l.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, overflow: "hidden", display: "flex", gap: 0 }}>
                              {/* Thumbnail */}
                              <div style={{ width: 90, flexShrink: 0, background: C.pill, position: "relative" }}>
                                {imgs[0] ? <img src={imgs[0]} alt={l.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>📦</div>}
                                {l.is_sold && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ color: C.green, fontWeight: 800, fontSize: 13, background: `${C.green}22`, border: `1px solid ${C.green}`, borderRadius: 8, padding: "4px 8px" }}>SOLD</div></div>}
                              </div>
                              {/* Details */}
                              <div style={{ flex: 1, padding: "14px 16px", minWidth: 0 }}>
                                <div style={{ color: C.text, fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.title}</div>
                                <div style={{ color: C.accent, fontWeight: 800, fontSize: 16, marginTop: 2 }}>₦{l.price?.toLocaleString()}</div>
                                <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                                  <span style={{ background: C.pill, color: C.muted, fontSize: 11, padding: "3px 8px", borderRadius: 10 }}>{l.category}</span>
                                  <span style={{ background: C.pill, color: C.muted, fontSize: 11, padding: "3px 8px", borderRadius: 10 }}>{l.condition}</span>
                                  <span style={{ color: C.muted, fontSize: 11, padding: "3px 0" }}>{new Date(l.created_at).toLocaleDateString()}</span>
                                </div>
                                {/* Action buttons */}
                                {!l.is_sold && (
                                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                                    <div onClick={() => handleMarkSold(l.id)} style={{ background: `${C.green}18`, border: `1px solid ${C.green}44`, color: C.green, fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 10, cursor: "pointer", whiteSpace: "nowrap" }}>✓ Mark Sold</div>
                                    <div onClick={() => handleDeleteListing(l.id)} style={{ background: "#FF555518", border: "1px solid #FF555544", color: "#FF5555", fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 10, cursor: "pointer" }}>🗑 Delete</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </>
              )}

              {/* ── REVIEWS TAB ── */}
              {profileTab === "reviews" && (
                <>
                  {reviewsLoading ? <Loader /> : sellerReviews.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "48px 20px", color: C.muted }}>
                      <div style={{ fontSize: 44, marginBottom: 12 }}>⭐</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>No reviews yet</div>
                      <div style={{ fontSize: 13, marginTop: 6 }}>Reviews appear here after buyers rate you.</div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {/* Average summary */}
                      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: "20px", textAlign: "center", marginBottom: 4 }}>
                        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 48, fontWeight: 800, color: "#FFD700" }}>
                          {(sellerReviews.reduce((s, r) => s + r.rating, 0) / sellerReviews.length).toFixed(1)}
                        </div>
                        <div style={{ display: "flex", justifyContent: "center", margin: "8px 0" }}>
                          <StarRating rating={Math.round(sellerReviews.reduce((s, r) => s + r.rating, 0) / sellerReviews.length)} size={22} />
                        </div>
                        <div style={{ color: C.muted, fontSize: 13 }}>Based on {sellerReviews.length} review{sellerReviews.length !== 1 ? "s" : ""}</div>
                        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 6 }}>
                          {[5,4,3,2,1].map(star => {
                            const count = sellerReviews.filter(r => r.rating === star).length;
                            const pct = sellerReviews.length ? (count / sellerReviews.length) * 100 : 0;
                            return (
                              <div key={star} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <span style={{ color: C.muted, fontSize: 12, width: 12 }}>{star}</span>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFD700" stroke="#FFD700" strokeWidth="1"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
                                <div style={{ flex: 1, background: C.pill, borderRadius: 4, height: 6, overflow: "hidden" }}>
                                  <div style={{ width: `${pct}%`, height: "100%", background: "#FFD700", borderRadius: 4, transition: "width .4s" }} />
                                </div>
                                <span style={{ color: C.muted, fontSize: 12, width: 16 }}>{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      {sellerReviews.map(r => (
                        <div key={r.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "16px 18px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <Avatar initials={(r.profiles?.full_name || "??").slice(0,2).toUpperCase()} size={32} />
                              <span style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>{r.profiles?.full_name?.split(" ")[0] || "Student"}</span>
                            </div>
                            <StarRating rating={r.rating} size={14} />
                          </div>
                          <div style={{ color: C.muted, fontSize: 14, lineHeight: 1.6 }}>{r.comment}</div>
                          <div style={{ color: C.border, fontSize: 11, marginTop: 8 }}>{new Date(r.created_at).toLocaleDateString()}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

            </div>
          </div>
        )}

      </main>

      {/* ── BOTTOM NAV (mobile only) ── */}
      <nav className="bottom-nav">
        {NAV_ITEMS.map(({ id, icon, label }) => (
          <div key={id} className="bottom-nav-item" onClick={() => handleTabChange(id)}>
            <div style={{ fontSize: 24, filter: tab === id ? "none" : "grayscale(1) opacity(.4)", transform: tab === id ? "scale(1.1)" : "scale(1)", transition: "all .2s" }}>{icon}</div>
            <div style={{ fontSize: 10, color: tab === id ? C.accent : C.muted, fontWeight: tab === id ? 700 : 400 }}>{label}</div>
            {tab === id && <div style={{ width: 4, height: 4, borderRadius: "50%", background: C.accent }} />}
          </div>
        ))}
      </nav>
    </div>
  );
}
