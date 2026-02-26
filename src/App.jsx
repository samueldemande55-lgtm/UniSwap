import { useState, useEffect, useRef } from "react";

// ── Supabase client via CDN ──────────────────────────────────────────────────
const SUPABASE_URL = "https://uypunathqfvyhuiiisov.supabase.co";
const SUPABASE_KEY = "sb_publishable_oyW3D5yURCp60CzPuPAfLQ_pcXf4_BI";

// Minimal Supabase REST client (no external dependency needed)
const supabase = (() => {
  const headers = { "Content-Type": "application/json", "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` };
  const rest = (path) => `${SUPABASE_URL}/rest/v1/${path}`;
  const auth = (path) => `${SUPABASE_URL}/auth/v1/${path}`;

  let _session = null;
  const _listeners = [];

  const getSession = async () => {
    const raw = sessionStorage.getItem("sb_session");
    if (raw) { _session = JSON.parse(raw); return { data: { session: _session } }; }
    return { data: { session: null } };
  };

  const signUp = async ({ email, password }) => {
    const res = await fetch(auth("signup"), { method: "POST", headers, body: JSON.stringify({ email, password }) });
    const data = await res.json();
    if (data.access_token) { _session = data; sessionStorage.setItem("sb_session", JSON.stringify(data)); _listeners.forEach(fn => fn("SIGNED_IN", data)); return { data, error: null }; }
    return { data: null, error: { message: data.msg || data.error_description || "Sign up failed" } };
  };

  const signInWithPassword = async ({ email, password }) => {
    const res = await fetch(auth("token?grant_type=password"), { method: "POST", headers, body: JSON.stringify({ email, password }) });
    const data = await res.json();
    if (data.access_token) { _session = data; sessionStorage.setItem("sb_session", JSON.stringify(data)); _listeners.forEach(fn => fn("SIGNED_IN", data)); return { data, error: null }; }
    return { data: null, error: { message: data.msg || data.error_description || "Login failed" } };
  };

  const signOut = async () => { _session = null; sessionStorage.removeItem("sb_session"); _listeners.forEach(fn => fn("SIGNED_OUT", null)); return {}; };

  const onAuthStateChange = (fn) => { _listeners.push(fn); return { data: { subscription: { unsubscribe: () => {} } } }; };

  const authHeaders = () => ({ ...headers, "Authorization": `Bearer ${_session?.access_token || SUPABASE_KEY}` });

  const from = (table) => {
    let _filters = []; let _select = "*"; let _order = null; let _single = false;

    const q = {
      select: (s) => { _select = s; return q; },
      eq: (col, val) => { _filters.push(`${col}=eq.${val}`); return q; },
      or: (str) => { _filters.push(`or=(${str})`); return q; },
      order: (col, { ascending } = {}) => { _order = `${col}.${ascending ? "asc" : "desc"}`; return q; },
      single: () => { _single = true; return q; },
      insert: async (body) => {
        const res = await fetch(`${rest(table)}`, { method: "POST", headers: { ...authHeaders(), "Prefer": "return=representation" }, body: JSON.stringify(body) });
        const data = await res.json();
        return { data: Array.isArray(data) ? data[0] : data, error: res.ok ? null : data };
      },
      update: async (body) => {
        const qs = _filters.length ? "?" + _filters.join("&") : "";
        const res = await fetch(`${rest(table)}${qs}`, { method: "PATCH", headers: { ...authHeaders(), "Prefer": "return=representation" }, body: JSON.stringify(body) });
        const data = await res.json();
        return { data, error: res.ok ? null : data };
      },
      then: async (resolve) => {
        let qs = `?select=${encodeURIComponent(_select)}`;
        if (_filters.length) qs += "&" + _filters.join("&");
        if (_order) qs += `&order=${_order}`;
        if (_single) qs += "&limit=1";
        const res = await fetch(`${rest(table)}${qs}`, { headers: { ...authHeaders(), "Accept": _single ? "application/vnd.pgrst.object+json" : "application/json" } });
        const data = await res.json();
        resolve({ data: data || null, error: res.ok ? null : data });
      }
    };
    // make it awaitable
    q[Symbol.toStringTag] = "Promise";
    return q;
  };

  return { auth: { getSession, signUp, signInWithPassword, signOut, onAuthStateChange, getUser: () => ({ data: { user: _session?.user } }) }, from };
})();

// ── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "#0A0E1A", card: "#111827", border: "#1E2A3A",
  accent: "#00D4FF", warm: "#FF6B35", green: "#00E676", purple: "#A78BFA",
  text: "#F0F4FF", muted: "#6B7FA3", pill: "#1A2540",
};

const CATEGORIES = ["All","Books","Electronics","Appliances","Furniture","Tools","Music","Accessories"];

// ── Tiny helpers ─────────────────────────────────────────────────────────────
const css = (...args) => Object.assign({}, ...args);
const Pill = ({ children, active, color = C.accent, onClick }) => (
  <div onClick={onClick} style={{ background: active ? color : C.pill, color: active ? "#000" : C.muted, border: `1px solid ${active ? color : C.border}`, borderRadius: 20, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", transition: "all .2s" }}>{children}</div>
);
const Input = ({ style, ...props }) => (
  <input style={css({ background: C.pill, border: `1px solid ${C.border}`, borderRadius: 12, padding: "13px 16px", color: C.text, fontSize: 15, width: "100%", outline: "none", boxSizing: "border-box" }, style)} {...props} />
);
const Btn = ({ primary, style, children, ...props }) => (
  <button style={css({ background: primary ? `linear-gradient(135deg,${C.accent},#0099CC)` : C.pill, color: primary ? "#000" : C.text, border: "none", borderRadius: 14, padding: "14px 20px", fontSize: 15, fontWeight: 700, cursor: "pointer", width: "100%", transition: "all .2s" }, style)} {...props}>{children}</button>
);
const Avatar = ({ initials, size = 36 }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", background: `linear-gradient(135deg,${C.accent}33,${C.warm}33)`, border: `1.5px solid ${C.accent}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.35, fontWeight: 700, color: C.accent, flexShrink: 0 }}>{initials}</div>
);
const Loader = () => (
  <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
    <div style={{ width: 32, height: 32, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);
const Toast = ({ msg, type }) => msg ? (
  <div style={{ position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)", background: type === "error" ? "#FF5555" : C.green, color: "#000", borderRadius: 20, padding: "10px 20px", fontSize: 13, fontWeight: 700, zIndex: 999, whiteSpace: "nowrap", boxShadow: "0 8px 24px rgba(0,0,0,.4)" }}>{msg}</div>
) : null;

const TERMS_CONTENT = `1. Acceptance of Terms
By creating an account on UniSwap, you agree to be bound by these Terms of Use. If you do not agree, please do not use the app.

2. Eligibility
UniSwap is exclusively for students and staff with a valid campus email address. You must be a registered member of the institution to use this platform.

3. User Conduct
You agree not to post false, misleading, or fraudulent listings. All items listed must be legal and permitted on campus. You are solely responsible for the accuracy of your listings.

4. Transactions
UniSwap is a marketplace platform only. We do not process payments or guarantee transactions. All deals are made directly between buyers and sellers. Meet in safe, public campus locations.

5. Account Termination
We reserve the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or misuse the platform.

6. Limitation of Liability
UniSwap is not liable for any loss, damage, or dispute arising from transactions between users.

7. Changes to Terms
We may update these terms at any time. Continued use of the app after changes constitutes acceptance of the new terms.

Last updated: February 2026`;

const PRIVACY_CONTENT = `1. Information We Collect
We collect your full name, campus email address, matric number, and any information you provide when posting listings or sending messages.

2. How We Use Your Information
Your information is used to verify your campus identity, display your profile to other users, and facilitate buying and selling on the platform.

3. Data Sharing
We do not sell your personal data to third parties. Your contact information is only visible to users you interact with directly on the platform.

4. Data Storage
All data is securely stored on Supabase infrastructure with industry-standard encryption. We retain your data for as long as your account is active.

5. Cookies & Sessions
We use session storage to keep you logged in during your browsing session. No tracking cookies are used.

6. Your Rights
You may request deletion of your account and associated data at any time by contacting support through the app.

7. Security
We take reasonable measures to protect your data, but cannot guarantee absolute security. Use a strong, unique password for your account.

8. Contact
For privacy concerns, reach us via the Support section in the app.

Last updated: February 2026`;

const Modal = ({ type, onClose }) => {
  const isTerms = type === "terms";
  const title = isTerms ? "📄 Terms of Use" : "🔐 Privacy Policy";
  const content = isTerms ? TERMS_CONTENT : PRIVACY_CONTENT;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "flex-end", padding: 16 }}>
      <div style={{ background: C.card, borderRadius: "24px 24px 16px 16px", width: "100%", maxWidth: 375, maxHeight: "80vh", display: "flex", flexDirection: "column", border: `1px solid ${C.border}`, boxShadow: "0 -20px 60px rgba(0,0,0,0.5)" }}>
        {/* Header */}
        <div style={{ padding: "20px 20px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div style={{ fontFamily: "'Syne',sans-serif", color: C.text, fontSize: 18, fontWeight: 800 }}>{title}</div>
          <div onClick={onClose} style={{ background: C.pill, borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.muted, fontSize: 16, fontWeight: 700 }}>✕</div>
        </div>
        {/* Scrollable content */}
        <div style={{ overflowY: "auto", padding: "16px 20px", flex: 1 }}>
          {content.split("\n\n").map((para, i) => {
            const isHeading = /^\d+\./.test(para);
            return (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ color: isHeading ? C.accent : C.muted, fontSize: isHeading ? 14 : 13, fontWeight: isHeading ? 700 : 400, lineHeight: 1.7 }}>{para}</div>
              </div>
            );
          })}
        </div>
        {/* Footer */}
        <div style={{ padding: "14px 20px 20px", flexShrink: 0, borderTop: `1px solid ${C.border}` }}>
          <div onClick={onClose} style={{ background: `linear-gradient(135deg,${C.accent},#0099CC)`, color: "#000", borderRadius: 14, padding: "13px", fontSize: 15, fontWeight: 700, cursor: "pointer", textAlign: "center" }}>Got it ✓</div>
        </div>
      </div>
    </div>
  );
};

// ── Main App ─────────────────────────────────────────────────────────────────
export default function UniSwap() {
  const [session, setSession]         = useState(null);
  const [profile, setProfile]         = useState(null);
  const [tab, setTab]                 = useState("home");
  const [screen, setScreen]           = useState("login"); // login | signup | app
  const [loginStep, setLoginStep]     = useState("email");
  const [listings, setListings]       = useState([]);
  const [chats, setChats]             = useState([]);
  const [activeCat, setActiveCat]     = useState("All");
  const [selectedListing, setSelectedListing] = useState(null);
  const [selectedChat, setSelectedChat]       = useState(null);
  const [messages, setMessages]       = useState([]);
  const [msgInput, setMsgInput]       = useState("");
  const [loading, setLoading]         = useState(false);
  const [toast, setToast]             = useState({ msg: "", type: "ok" });
  const [liked, setLiked]             = useState({});
  const msgEndRef = useRef(null);

  // form state
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [fullName, setFullName]       = useState("");
  const [matric, setMatric]           = useState("");
  // sell form
  const [sellTitle, setSellTitle]     = useState("");
  const [sellPrice, setSellPrice]     = useState("");
  const [sellCat, setSellCat]         = useState("Books");
  const [sellCond, setSellCond]       = useState("Good");
  const [sellDesc, setSellDesc]       = useState("");

  const [modal, setModal] = useState(null); // null | "terms" | "privacy"
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const showToast = (msg, type = "ok") => { setToast({ msg, type }); setTimeout(() => setToast({ msg: "", type: "ok" }), 3000); };

  // ── Auth ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) {
        setSession(data.session);
        fetchProfile(data.session.user.id).then(() => setScreen("app"));
      } else {
        setScreen("login");
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) {
        setSession(s);
        fetchProfile(s.user.id).then(() => setScreen("app"));
      } else {
        setSession(null);
        setProfile(null);
        setScreen("login");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (uid) => {
    try {
      const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
      if (data) setProfile(data);
      else setProfile({ full_name: "User", email: "", matric_number: "", rating: 0 });
    } catch (e) {
      setProfile({ full_name: "User", email: "", matric_number: "", rating: 0 });
    }
  };

  const handleSignUp = async () => {
    if (!fullName || !email || !password || !matric) return showToast("Please fill all fields", "error");
    if (!email.includes("@")) return showToast("Please enter a valid school email address", "error");
    if (!acceptedTerms || !acceptedPrivacy) return showToast("Please accept Terms of Use and Privacy Policy", "error");
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) { showToast(error.message, "error"); return; }
      if (data?.user?.id) {
        await supabase.from("profiles").insert({ id: data.user.id, full_name: fullName, email, matric_number: matric, rating: 0 });
        setProfile({ full_name: fullName, email, matric_number: matric, rating: 0 });
      }
      showToast("Account created successfully! 🎉");
    } catch (e) {
      showToast("Something went wrong. Check your connection.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) return showToast("Enter email and password", "error");
    if (!email.includes("@")) return showToast("Please enter a valid email address, not a matric number", "error");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.toLowerCase().includes("invalid") || error.message.toLowerCase().includes("credentials")) {
          showToast("No account found. Please sign up first.", "error");
        } else {
          showToast(error.message, "error");
        }
      }
    } catch (e) {
      showToast("Something went wrong. Check your connection.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => { await supabase.auth.signOut(); setTab("home"); };

  // ── Listings ────────────────────────────────────────────────────────────────
  useEffect(() => { if (screen === "app") fetchListings(); }, [screen, activeCat]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      let q = supabase.from("listings").select("*, profiles(full_name)").eq("is_sold", false).order("created_at", { ascending: false });
      if (activeCat !== "All") q = q.eq("category", activeCat);
      const { data } = await q;
      setListings(data || []);
    } catch (e) {
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePostListing = async () => {
    if (!sellTitle || !sellPrice) return showToast("Title and price are required", "error");
    setLoading(true);
    try {
      const { error } = await supabase.from("listings").insert({ title: sellTitle, price: parseInt(sellPrice), category: sellCat, condition: sellCond, description: sellDesc, seller_id: session.user.id, is_sold: false });
      if (error) { showToast(error.message, "error"); }
      else { showToast("Listing posted! 🎉"); setSellTitle(""); setSellPrice(""); setSellDesc(""); fetchListings(); setTab("home"); }
    } catch (e) {
      showToast("Something went wrong. Try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  // ── Messages ────────────────────────────────────────────────────────────────
  useEffect(() => { if (tab === "messages" && session) fetchChats(); }, [tab, session]);

  const fetchChats = async () => {
    const { data } = await supabase.from("messages").select("*, listings(title), profiles!messages_sender_id_fkey(full_name)").or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`).order("created_at", { ascending: false });
    // group by listing
    const seen = {}; const grouped = [];
    (data || []).forEach(m => { if (!seen[m.listing_id]) { seen[m.listing_id] = true; grouped.push(m); } });
    setChats(grouped);
  };

  const openChat = async (chat) => {
    setSelectedChat(chat);
    const { data } = await supabase.from("messages").select("*, profiles!messages_sender_id_fkey(full_name)").eq("listing_id", chat.listing_id).order("created_at", { ascending: true });
    setMessages(data || []);
    // mark read
    await supabase.from("messages").update({ is_read: true }).eq("listing_id", chat.listing_id).eq("receiver_id", session.user.id);
  };

  const sendMessage = async () => {
    if (!msgInput.trim() || !selectedListing) return;
    const msg = { sender_id: session.user.id, receiver_id: selectedListing.seller_id, listing_id: selectedListing.id, content: msgInput, is_read: false };
    const { data } = await supabase.from("messages").insert(msg).select("*, profiles!messages_sender_id_fkey(full_name)").single();
    if (data) setMessages(p => [...p, data]);
    setMsgInput("");
  };

  const startChatFromListing = async (listing) => {
    setSelectedListing(listing);
    const { data } = await supabase.from("messages").select("*, profiles!messages_sender_id_fkey(full_name)").eq("listing_id", listing.id).or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`).order("created_at", { ascending: true });
    setMessages(data || []);
    setTab("messages");
    setSelectedChat({ listing_id: listing.id, listings: { title: listing.title } });
  };

  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // ── Shared styles ────────────────────────────────────────────────────────────
  const S = {
    root: { fontFamily: "'DM Sans',sans-serif", background: C.bg, minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", padding: 20 },
    phone: { width: 375, minHeight: 720, maxHeight: 820, background: C.card, borderRadius: 36, overflow: "hidden", border: `1px solid ${C.border}`, boxShadow: "0 40px 100px rgba(0,0,0,.7)", position: "relative", display: "flex", flexDirection: "column" },
    statusBar: { padding: "14px 24px 0", display: "flex", justifyContent: "space-between" },
    scroll: { flex: 1, overflowY: "auto", paddingBottom: 90 },
    bottomNav: { position: "absolute", bottom: 0, left: 0, right: 0, background: "#0D1421", borderTop: `1px solid ${C.border}`, display: "flex", padding: "10px 0 20px" },
  };

  const initials = profile?.full_name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  // ════════════════════════════════════════════════════════════════════════════
  // LOGIN SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  if (screen !== "app") return (
    <div style={S.root}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      <Toast {...toast} />
      {modal && <Modal type={modal} onClose={() => setModal(null)} />}
      <div style={S.phone}>
        <div style={S.statusBar}><span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>9:41</span><span style={{ color: C.text, fontSize: 13 }}>●●● 📶 🔋</span></div>
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", justifyContent: "center", padding: "32px 28px" }}>

          {/* Logo */}
          <div style={{ marginBottom: 36, textAlign: "center" }}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>🛒</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 32, fontWeight: 800, background: `linear-gradient(135deg,${C.accent},${C.warm})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>UniSwap</div>
            <div style={{ color: C.muted, fontSize: 14, marginTop: 6 }}>Your campus marketplace</div>
          </div>

          {screen === "login" && loginStep === "email" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><div style={{ color: C.muted, fontSize: 12, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>School Email</div><Input placeholder="you@uniemail.edu.ng" value={email} onChange={e => setEmail(e.target.value)} /></div>
              <Btn primary onClick={() => setLoginStep("password")}>Continue →</Btn>
              <div style={{ textAlign: "center", color: C.muted, fontSize: 13 }}>New student? <span style={{ color: C.accent, cursor: "pointer", fontWeight: 600 }} onClick={() => setScreen("signup")}>Create account</span></div>
            </div>
          )}

          {screen === "login" && loginStep === "password" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ color: C.text, fontSize: 16, fontWeight: 600 }}>Welcome back 👋</div>
              <Input type="password" placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} />
              <Btn primary onClick={handleLogin}>{loading ? "Signing in…" : "Sign In"}</Btn>
              <div style={{ textAlign: "center", color: C.muted, fontSize: 13, cursor: "pointer" }} onClick={() => setLoginStep("email")}>← Back</div>
            </div>
          )}

          {screen === "signup" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ color: C.text, fontSize: 16, fontWeight: 600 }}>Create your account</div>
              <Input placeholder="Full name" value={fullName} onChange={e => setFullName(e.target.value)} />
              <Input placeholder="School email (.edu.ng)" value={email} onChange={e => setEmail(e.target.value)} />
              <Input placeholder="Matric number" value={matric} onChange={e => setMatric(e.target.value)} />
              <Input type="password" placeholder="Create password" value={password} onChange={e => setPassword(e.target.value)} />

              {/* Single checkbox */}
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <div onClick={() => { setAcceptedTerms(p => !p); setAcceptedPrivacy(p => !p); }} style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${acceptedTerms ? C.accent : C.muted}`, background: acceptedTerms ? C.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .2s" }}>
                  {acceptedTerms && <span style={{ color: "#000", fontSize: 13, fontWeight: 800 }}>✓</span>}
                </div>
                <span style={{ color: C.muted, fontSize: 13 }}>I agree to the <span onClick={(e) => { e.stopPropagation(); setModal("terms"); }} style={{ color: C.accent, fontWeight: 600, textDecoration: "underline", cursor: "pointer" }}>Terms of Use</span> and <span onClick={(e) => { e.stopPropagation(); setModal("privacy"); }} style={{ color: C.accent, fontWeight: 600, textDecoration: "underline", cursor: "pointer" }}>Privacy Policy</span></span>
              </label>

              <Btn primary onClick={handleSignUp} style={{ opacity: acceptedTerms && acceptedPrivacy ? 1 : 0.5 }}>{loading ? "Creating…" : "Join UniSwap 🚀"}</Btn>
              <div style={{ textAlign: "center", color: C.muted, fontSize: 13, cursor: "pointer" }} onClick={() => { setScreen("login"); setLoginStep("email"); }}>← Back to login</div>
            </div>
          )}

          <div style={{ marginTop: 24, padding: 14, background: `${C.accent}11`, borderRadius: 12, border: `1px solid ${C.accent}22`, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: C.muted }}>🔒 Only verified campus emails allowed. Safe & trusted.</div>
          </div>
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // CHAT DETAIL
  // ════════════════════════════════════════════════════════════════════════════
  if (selectedChat && tab === "messages") return (
    <div style={S.root}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      <Toast {...toast} />
      <div style={S.phone}>
        <div style={{ padding: "14px 20px 12px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ cursor: "pointer", color: C.accent, fontSize: 20 }} onClick={() => setSelectedChat(null)}>←</span>
          <Avatar initials="??" size={38} />
          <div>
            <div style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>Chat</div>
            <div style={{ color: C.muted, fontSize: 12 }}>Re: {selectedChat?.listings?.title}</div>
          </div>
          <div style={{ marginLeft: "auto", background: `${C.green}22`, color: C.green, fontSize: 11, padding: "4px 10px", borderRadius: 20, fontWeight: 600 }}>Active</div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 0" }}>
          {messages.length === 0 && <div style={{ textAlign: "center", color: C.muted, padding: 40, fontSize: 14 }}>No messages yet. Say hi! 👋</div>}
          {messages.map(m => {
            const isMe = m.sender_id === session.user.id;
            return (
              <div key={m.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: 12 }}>
                <div style={{ maxWidth: "72%", background: isMe ? `linear-gradient(135deg,${C.accent},#0099CC)` : C.pill, color: isMe ? "#000" : C.text, borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px", padding: "10px 14px", fontSize: 14, lineHeight: 1.5 }}>
                  <div>{m.content}</div>
                  <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: "right" }}>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              </div>
            );
          })}
          <div ref={msgEndRef} />
        </div>

        <div style={{ padding: "12px 16px 28px", display: "flex", gap: 10, borderTop: `1px solid ${C.border}`, background: C.card }}>
          <Input style={{ flex: 1 }} placeholder="Type a message…" value={msgInput} onChange={e => setMsgInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} />
          <button onClick={sendMessage} style={{ background: `linear-gradient(135deg,${C.accent},#0099CC)`, border: "none", borderRadius: 12, width: 46, height: 46, fontSize: 18, cursor: "pointer", flexShrink: 0 }}>↑</button>
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // LISTING DETAIL
  // ════════════════════════════════════════════════════════════════════════════
  if (selectedListing && tab === "home") return (
    <div style={S.root}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      <Toast {...toast} />
      <div style={S.phone}>
        <div style={{ padding: "14px 20px 12px", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ cursor: "pointer", color: C.accent, fontSize: 20 }} onClick={() => setSelectedListing(null)}>←</span>
          <span style={{ color: C.text, fontWeight: 700 }}>Listing Detail</span>
        </div>
        <div style={{ flex: 1, overflowY: "auto", paddingBottom: 100 }}>
          <div style={{ background: `${C.accent}11`, height: 200, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 80 }}>📦</div>
          <div style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontFamily: "'Syne',sans-serif", color: C.text, fontSize: 22, fontWeight: 800 }}>{selectedListing.title}</div>
                <div style={{ color: C.accent, fontSize: 24, fontWeight: 700, marginTop: 4 }}>₦{selectedListing.price?.toLocaleString()}</div>
              </div>
              <div style={{ background: `${C.green}22`, color: C.green, padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{selectedListing.condition}</div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
              <div style={{ background: C.pill, borderRadius: 10, padding: "8px 14px", fontSize: 12, color: C.muted }}>📦 {selectedListing.category}</div>
              <div style={{ background: C.pill, borderRadius: 10, padding: "8px 14px", fontSize: 12, color: C.muted }}>🕐 {new Date(selectedListing.created_at).toLocaleDateString()}</div>
            </div>
            <div style={{ marginTop: 20, padding: 16, background: C.pill, borderRadius: 14, display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar initials={(selectedListing.profiles?.full_name || "??").slice(0, 2).toUpperCase()} size={42} />
              <div>
                <div style={{ color: C.text, fontWeight: 700 }}>{selectedListing.profiles?.full_name || "Unknown"}</div>
                <div style={{ color: C.muted, fontSize: 12 }}>Campus verified seller</div>
              </div>
            </div>
            {selectedListing.description && <div style={{ marginTop: 16, color: C.muted, fontSize: 14, lineHeight: 1.7 }}>{selectedListing.description}</div>}
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 20px 28px", background: C.card, borderTop: `1px solid ${C.border}`, display: "flex", gap: 10 }}>
          {selectedListing.seller_id !== session?.user?.id && (
            <Btn style={{ flex: 1 }} onClick={() => startChatFromListing(selectedListing)}>💬 Message Seller</Btn>
          )}
          <Btn primary style={{ flex: 1 }}>Buy Now</Btn>
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // MAIN APP
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div style={S.root}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      <Toast {...toast} />
      <div style={S.phone}>
        <div style={S.statusBar}><span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>9:41</span><span style={{ color: C.text, fontSize: 13 }}>●●● 📶 🔋</span></div>

        {/* ── HOME ── */}
        {tab === "home" && (
          <div style={S.scroll}>
            <div style={{ padding: "16px 20px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <div style={{ color: C.muted, fontSize: 13 }}>Good day 👋</div>
                  <div style={{ fontFamily: "'Syne',sans-serif", color: C.text, fontSize: 22, fontWeight: 800 }}>UniSwap</div>
                </div>
                <Avatar initials={initials} size={40} />
              </div>
              <div style={{ background: C.pill, border: `1px solid ${C.border}`, borderRadius: 14, padding: "12px 16px", display: "flex", gap: 10, alignItems: "center", marginBottom: 20 }}>
                <span>🔍</span><span style={{ color: C.muted, fontSize: 14 }}>Search listings…</span>
              </div>
              <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 20, paddingBottom: 4 }}>
                {CATEGORIES.map(c => <Pill key={c} active={activeCat === c} onClick={() => setActiveCat(c)}>{c}</Pill>)}
              </div>
            </div>

            {loading ? <Loader /> : (
              <div style={{ padding: "0 12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {listings.length === 0 && <div style={{ gridColumn: "1/-1", textAlign: "center", color: C.muted, padding: 40 }}>No listings yet. Be the first to sell! 🚀</div>}
                {listings.map(l => (
                  <div key={l.id} onClick={() => setSelectedListing(l)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, overflow: "hidden", cursor: "pointer" }}>
                    <div style={{ background: `${C.accent}11`, height: 90, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 42, position: "relative" }}>
                      📦
                      <div style={{ position: "absolute", top: 8, right: 8, background: `${C.bg}CC`, borderRadius: 20, padding: "3px 8px", fontSize: 10, color: C.muted }}>{l.condition}</div>
                      <div onClick={e => { e.stopPropagation(); setLiked(p => ({ ...p, [l.id]: !p[l.id] })); }} style={{ position: "absolute", bottom: 8, right: 8, fontSize: 16 }}>{liked[l.id] ? "❤️" : "🤍"}</div>
                    </div>
                    <div style={{ padding: "10px 12px 12px" }}>
                      <div style={{ color: C.text, fontSize: 13, fontWeight: 700, lineHeight: 1.3, marginBottom: 4 }}>{l.title}</div>
                      <div style={{ color: C.accent, fontSize: 15, fontWeight: 700 }}>₦{l.price?.toLocaleString()}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                        <Avatar initials={(l.profiles?.full_name || "??").slice(0, 2).toUpperCase()} size={18} />
                        <span style={{ color: C.muted, fontSize: 11 }}>{l.profiles?.full_name?.split(" ")[0]}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MESSAGES ── */}
        {tab === "messages" && !selectedChat && (
          <div style={S.scroll}>
            <div style={{ padding: "16px 20px 12px" }}>
              <div style={{ fontFamily: "'Syne',sans-serif", color: C.text, fontSize: 22, fontWeight: 800, marginBottom: 16 }}>Messages</div>
            </div>
            {loading ? <Loader /> : chats.length === 0 ? (
              <div style={{ textAlign: "center", color: C.muted, padding: 60, fontSize: 14 }}>No conversations yet.<br />Browse listings and message a seller!</div>
            ) : chats.map(c => (
              <div key={c.id} onClick={() => openChat(c)} style={{ padding: "14px 20px", display: "flex", gap: 14, alignItems: "center", cursor: "pointer", borderBottom: `1px solid ${C.border}22` }}>
                <Avatar initials="??" size={46} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>{c.listings?.title}</div>
                    <div style={{ color: C.muted, fontSize: 12 }}>{new Date(c.created_at).toLocaleDateString()}</div>
                  </div>
                  <div style={{ color: C.muted, fontSize: 13, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.content}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── SELL ── */}
        {tab === "sell" && (
          <div style={S.scroll}>
            <div style={{ padding: "20px" }}>
              <div style={{ fontFamily: "'Syne',sans-serif", color: C.text, fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Sell an Item</div>
              <div style={{ color: C.muted, fontSize: 14, marginBottom: 24 }}>Turn your unused stuff into cash 💰</div>

              <div style={{ background: `${C.accent}11`, border: `2px dashed ${C.accent}44`, borderRadius: 18, height: 130, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginBottom: 20, cursor: "pointer" }}>
                <div style={{ fontSize: 32 }}>📷</div>
                <div style={{ color: C.accent, fontSize: 14, fontWeight: 700, marginTop: 8 }}>Add Photos</div>
                <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>Coming soon</div>
              </div>

              {[["Item Name", sellTitle, setSellTitle, "text", "e.g. Calculus Textbook"], ["Price (₦)", sellPrice, setSellPrice, "number", "e.g. 4500"]].map(([label, val, setter, type, ph]) => (
                <div key={label} style={{ marginBottom: 14 }}>
                  <div style={{ color: C.muted, fontSize: 12, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
                  <Input type={type} placeholder={ph} value={val} onChange={e => setter(e.target.value)} />
                </div>
              ))}

              <div style={{ marginBottom: 14 }}>
                <div style={{ color: C.muted, fontSize: 12, marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Category</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {["Books","Electronics","Appliances","Furniture","Tools","Music","Accessories"].map(c => (
                    <Pill key={c} active={sellCat === c} onClick={() => setSellCat(c)}>{c}</Pill>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ color: C.muted, fontSize: 12, marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Condition</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {["New","Good","Fairly Used"].map(c => (
                    <Pill key={c} active={sellCond === c} color={C.green} onClick={() => setSellCond(c)}>{c}</Pill>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ color: C.muted, fontSize: 12, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Description</div>
                <textarea style={{ background: C.pill, border: `1px solid ${C.border}`, borderRadius: 12, padding: "13px 16px", color: C.text, fontSize: 14, width: "100%", height: 80, resize: "none", outline: "none", boxSizing: "border-box" }} placeholder="Describe condition, pickup spot…" value={sellDesc} onChange={e => setSellDesc(e.target.value)} />
              </div>

              <Btn primary onClick={handlePostListing}>{loading ? "Posting…" : "🚀 Post Listing"}</Btn>
            </div>
          </div>
        )}

        {/* ── PROFILE ── */}
        {tab === "profile" && (
          <div style={S.scroll}>
            <div style={{ padding: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
                <Avatar initials={initials} size={72} />
                <div style={{ fontFamily: "'Syne',sans-serif", color: C.text, fontSize: 20, fontWeight: 800, marginTop: 12 }}>{profile?.full_name || "Loading…"}</div>
                <div style={{ color: C.muted, fontSize: 14 }}>{profile?.email}</div>
                <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Matric: {profile?.matric_number}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                  <div style={{ background: `${C.green}22`, color: C.green, padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>✓ Campus Verified</div>
                  <div style={{ background: C.pill, color: C.muted, padding: "4px 12px", borderRadius: 20, fontSize: 12 }}>⭐ {profile?.rating?.toFixed(1) || "0.0"}</div>
                </div>
              </div>

              {[["📦","My Listings"],["🛒","Purchases"],["❤️","Saved Items"],["⭐","Reviews"],["🔔","Notifications"],["⚙️","Settings"],["🆘","Support"]].map(([icon, label]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 14, padding: "15px 4px", borderBottom: `1px solid ${C.border}22`, cursor: "pointer" }}>
                  <span style={{ fontSize: 20 }}>{icon}</span>
                  <span style={{ color: C.text, fontSize: 15, fontWeight: 500 }}>{label}</span>
                  <span style={{ marginLeft: "auto", color: C.muted }}>›</span>
                </div>
              ))}

              <Btn style={{ marginTop: 24, color: "#FF5555" }} onClick={handleSignOut}>Sign Out</Btn>
            </div>
          </div>
        )}

        {/* ── BOTTOM NAV ── */}
        <div style={S.bottomNav}>
          {[["home","🏠","Home"],["messages","💬","Chats"],["sell","➕","Sell"],["profile","👤","Profile"]].map(([id, icon, label]) => (
            <div key={id} onClick={() => { setTab(id); setSelectedListing(null); setSelectedChat(null); }} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}>
              <div style={{ fontSize: 22, filter: tab === id ? "none" : "grayscale(1) opacity(.4)", transform: tab === id ? "scale(1.1)" : "scale(1)", transition: "all .2s" }}>{icon}</div>
              <div style={{ fontSize: 10, color: tab === id ? C.accent : C.muted, fontWeight: tab === id ? 700 : 400 }}>{label}</div>
              {tab === id && <div style={{ width: 4, height: 4, borderRadius: "50%", background: C.accent }} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
         }
