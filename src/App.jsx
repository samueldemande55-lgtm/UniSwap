import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://uypunathqfvyhuiiisov.supabase.co",
  "sb_publishable_oyW3D5yURCp60CzPuPAfLQ_pcXf4_BI"
);

const C = { bg: "#0A0E1A", card: "#111827", border: "#1E2A3A", accent: "#00D4FF", warm: "#FF6B35", green: "#00E676", text: "#F0F4FF", muted: "#6B7FA3", pill: "#1A2540" };
const CATEGORIES = ["All","Books","Electronics","Appliances","Furniture","Tools","Music","Accessories"];

const css = (...args) => Object.assign({}, ...args);
const getImages = (listing) => {
  try {
    const urls = listing?.image_urls;
    if (!urls) return [];
    if (Array.isArray(urls)) return urls;
    if (typeof urls === "string") return JSON.parse(urls);
    return [];
  } catch { return []; }
};
const Pill = ({ children, active, color = C.accent, onClick }) => (<div onClick={onClick} style={{ background: active ? color : C.pill, color: active ? "#000" : C.muted, border: `1px solid ${active ? color : C.border}`, borderRadius: 20, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", transition: "all .2s" }}>{children}</div>);
const Input = ({ style, ...props }) => (<input style={css({ background: C.pill, border: `1px solid ${C.border}`, borderRadius: 12, padding: "13px 16px", color: C.text, fontSize: 15, width: "100%", outline: "none", boxSizing: "border-box" }, style)} {...props} />);
const Btn = ({ primary, style, children, ...props }) => (<button style={css({ background: primary ? `linear-gradient(135deg,${C.accent},#0099CC)` : C.pill, color: primary ? "#000" : C.text, border: "none", borderRadius: 14, padding: "14px 20px", fontSize: 15, fontWeight: 700, cursor: "pointer", width: "100%", transition: "all .2s" }, style)} {...props}>{children}</button>);
const Avatar = ({ initials, size = 36 }) => (<div style={{ width: size, height: size, borderRadius: "50%", background: `linear-gradient(135deg,${C.accent}33,${C.warm}33)`, border: `1.5px solid ${C.accent}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.35, fontWeight: 700, color: C.accent, flexShrink: 0 }}>{initials}</div>);
const Loader = () => (<div style={{ display: "flex", justifyContent: "center", padding: 40 }}><div style={{ width: 32, height: 32, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>);
const Toast = ({ msg, type }) => msg ? (<div style={{ position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)", background: type === "error" ? "#FF5555" : C.green, color: "#000", borderRadius: 20, padding: "10px 20px", fontSize: 13, fontWeight: 700, zIndex: 9999, whiteSpace: "nowrap", boxShadow: "0 8px 24px rgba(0,0,0,.4)" }}>{msg}</div>) : null;

const EyeIcon = ({ open }) => open ? (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
) : (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
);

const TERMS_CONTENT = `1. Acceptance of Terms\nBy creating an account on UniSwap, you agree to be bound by these Terms of Use.\n\n2. Eligibility\nUniSwap is exclusively for students and staff with a valid campus email address.\n\n3. User Conduct\nYou agree not to post false, misleading, or fraudulent listings. All items must be legal and permitted on campus.\n\n4. Transactions\nUniSwap is a marketplace platform only. We do not process payments or guarantee transactions. Meet in safe, public campus locations.\n\n5. Account Termination\nWe reserve the right to suspend accounts that violate these terms or engage in fraudulent activity.\n\n6. Limitation of Liability\nUniSwap is not liable for any loss or dispute arising from transactions between users.\n\n7. Changes to Terms\nWe may update these terms at any time. Continued use constitutes acceptance.\n\nLast updated: February 2026`;
const PRIVACY_CONTENT = `1. Information We Collect\nWe collect your full name, campus email, matric number, and information from your listings and messages.\n\n2. How We Use Your Information\nTo verify your campus identity, display your profile, and facilitate buying and selling.\n\n3. Data Sharing\nWe do not sell your personal data. Your info is only visible to users you interact with directly.\n\n4. Data Storage\nAll data is securely stored on Supabase with industry-standard encryption.\n\n5. Your Rights\nYou may request deletion of your account at any time via the Support section.\n\n6. Security\nWe take reasonable measures to protect your data. Use a strong, unique password.\n\n7. Contact\nFor privacy concerns, reach us via the Support section in the app.\n\nLast updated: February 2026`;

const Modal = ({ type, onClose }) => {
  const isTerms = type === "terms";
  const content = isTerms ? TERMS_CONTENT : PRIVACY_CONTENT;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "flex-end", padding: 16 }}>
      <div style={{ background: C.card, borderRadius: "24px 24px 16px 16px", width: "100%", maxWidth: 375, maxHeight: "80vh", display: "flex", flexDirection: "column", border: `1px solid ${C.border}` }}>
        <div style={{ padding: "20px 20px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "'Syne',sans-serif", color: C.text, fontSize: 18, fontWeight: 800 }}>{isTerms ? "📄 Terms of Use" : "🔐 Privacy Policy"}</div>
          <div onClick={onClose} style={{ background: C.pill, borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.muted, fontSize: 16 }}>✕</div>
        </div>
        <div style={{ overflowY: "auto", padding: "16px 20px", flex: 1 }}>
          {content.split("\n\n").map((para, i) => (<div key={i} style={{ marginBottom: 14, color: /^\d+\./.test(para) ? C.accent : C.muted, fontSize: /^\d+\./.test(para) ? 14 : 13, fontWeight: /^\d+\./.test(para) ? 700 : 400, lineHeight: 1.7 }}>{para}</div>))}
        </div>
        <div style={{ padding: "14px 20px 20px", borderTop: `1px solid ${C.border}` }}>
          <div onClick={onClose} style={{ background: `linear-gradient(135deg,${C.accent},#0099CC)`, color: "#000", borderRadius: 14, padding: "13px", fontSize: 15, fontWeight: 700, cursor: "pointer", textAlign: "center" }}>Got it ✓</div>
        </div>
      </div>
    </div>
  );
};

export default function UniSwap() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [tab, setTab] = useState("home");
  const [authScreen, setAuthScreen] = useState("login"); // login | signup
  const [loginStep, setLoginStep] = useState("email");
  const [listings, setListings] = useState([]);
  const [chats, setChats] = useState([]);
  const [activeCat, setActiveCat] = useState("All");
  const [selectedListing, setSelectedListing] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "ok" });
  const [liked, setLiked] = useState({});
  const [modal, setModal] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);
  const msgEndRef = useRef(null);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [matric, setMatric] = useState("");
  const [sellTitle, setSellTitle] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [sellCat, setSellCat] = useState("Books");
  const [sellCond, setSellCond] = useState("Good");
  const [sellDesc, setSellDesc] = useState("");
  const [sellPhotos, setSellPhotos] = useState([]); // file objects
  const [sellPhotosPreviews, setSellPhotosPreviews] = useState([]); // base64 previews
  const [uploadProgress, setUploadProgress] = useState(0);
  const photoInputRef = useRef(null);

  const showToast = (msg, type = "ok") => { setToast({ msg, type }); setTimeout(() => setToast({ msg: "", type: "ok" }), 3000); };

  // ── Auth listener ──────────────────────────────────────────────────────────
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      }
      setAuthReady(true);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (uid) => {
    try {
      const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
      setProfile(data || { full_name: "User", email: "", matric_number: "", rating: 0 });
    } catch {
      setProfile({ full_name: "User", email: "", matric_number: "", rating: 0 });
    }
  };

  // ── Auth actions ───────────────────────────────────────────────────────────
  const handleSignUp = async () => {
    if (!fullName || !email || !password || !matric) return showToast("Please fill all fields", "error");
    if (!email.includes("@")) return showToast("Please enter a valid email address", "error");
    if (!acceptedTerms || !acceptedPrivacy) return showToast("Please accept Terms & Privacy Policy", "error");
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) { showToast(error.message, "error"); return; }
      if (data?.user) {
        await supabase.from("profiles").insert({ id: data.user.id, full_name: fullName, email, matric_number: matric, rating: 0 });
        setProfile({ full_name: fullName, email, matric_number: matric, rating: 0 });
        showToast("Account created! Welcome 🎉");
      }
    } catch { showToast("Connection error. Try again.", "error"); }
    finally { setLoading(false); }
  };

  const handleLogin = async () => {
    if (!email || !password) return showToast("Enter email and password", "error");
    if (!email.includes("@")) return showToast("Please enter a valid email, not a matric number", "error");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) showToast("Invalid email or password. Try again.", "error");
    } catch { showToast("Connection error. Try again.", "error"); }
    finally { setLoading(false); }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setTab("home");
    setAuthScreen("login");
    setLoginStep("email");
  };

  // ── Listings ───────────────────────────────────────────────────────────────
  useEffect(() => { if (user) fetchListings(); }, [user, activeCat]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      let q = supabase.from("listings").select("*, profiles(full_name)").eq("is_sold", false).order("created_at", { ascending: false });
      if (activeCat !== "All") q = q.eq("category", activeCat);
      const { data } = await q;
      setListings(data || []);
    } catch { setListings([]); }
    finally { setLoading(false); }
  };

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files);
    const remaining = 5 - sellPhotos.length;
    const selected = files.slice(0, remaining);
    if (files.length > remaining) showToast(`Max 5 photos. Only ${remaining} slot(s) left.`, "error");
    const newFiles = [...sellPhotos, ...selected];
    setSellPhotos(newFiles);
    // Generate previews
    selected.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setSellPhotosPreviews(p => [...p, ev.target.result]);
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index) => {
    setSellPhotos(p => p.filter((_, i) => i !== index));
    setSellPhotosPreviews(p => p.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (listingId) => {
    const urls = [];
    for (let i = 0; i < sellPhotos.length; i++) {
      const file = sellPhotos[i];
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${listingId}/${i}.${ext}`;
      const { error } = await supabase.storage.from("listings").upload(path, file, { upsert: true });
      if (!error) {
        const { data } = supabase.storage.from("listings").getPublicUrl(path);
        urls.push(data.publicUrl);
      }
      setUploadProgress(Math.round(((i + 1) / sellPhotos.length) * 100));
    }
    return urls;
  };

  const handlePostListing = async () => {
    if (!sellTitle || !sellPrice) return showToast("Title and price required", "error");
    setLoading(true);
    setUploadProgress(0);
    try {
      // Insert listing first to get ID
      const { data: listing, error } = await supabase.from("listings").insert({
        title: sellTitle, price: parseInt(sellPrice), category: sellCat,
        condition: sellCond, description: sellDesc, seller_id: user.id, is_sold: false,
        image_urls: []
      }).select().single();
      if (error) { showToast(error.message, "error"); return; }

      // Upload photos if any
      let imageUrls = [];
      if (sellPhotos.length > 0) {
        imageUrls = await uploadPhotos(listing.id);
        // Store as JSON array — compatible with jsonb column
        await supabase.from("listings").update({ image_urls: JSON.stringify(imageUrls) }).eq("id", listing.id);
      }

      showToast("Listing posted! 🎉");
      setSellTitle(""); setSellPrice(""); setSellDesc("");
      setSellPhotos([]); setSellPhotosPreviews([]); setUploadProgress(0);
      fetchListings(); setTab("home");
    } catch { showToast("Failed to post. Try again.", "error"); }
    finally { setLoading(false); }
  };

  // ── Messages ───────────────────────────────────────────────────────────────
  useEffect(() => { if (tab === "messages" && user) fetchChats(); }, [tab, user]);
  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

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
    if (!msgInput.trim() || !selectedListing) return;
    const { data } = await supabase.from("messages").insert({ sender_id: user.id, receiver_id: selectedListing.seller_id, listing_id: selectedListing.id, content: msgInput, is_read: false }).select().single();
    if (data) setMessages(p => [...p, data]);
    setMsgInput("");
  };

  const startChat = async (listing) => {
    setSelectedListing(listing);
    const { data } = await supabase.from("messages").select("*").eq("listing_id", listing.id).or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).order("created_at", { ascending: true });
    setMessages(data || []);
    setSelectedChat({ listing_id: listing.id, listings: { title: listing.title } });
    setTab("messages");
  };

  // ── Styles ─────────────────────────────────────────────────────────────────
  const S = {
    root: { fontFamily: "'DM Sans',sans-serif", background: C.bg, minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", padding: 20 },
    phone: { width: 375, minHeight: 720, maxHeight: 820, background: C.card, borderRadius: 36, overflow: "hidden", border: `1px solid ${C.border}`, boxShadow: "0 40px 100px rgba(0,0,0,.7)", position: "relative", display: "flex", flexDirection: "column" },
    scroll: { flex: 1, overflowY: "auto", paddingBottom: 90 },
    bottomNav: { position: "absolute", bottom: 0, left: 0, right: 0, background: "#0D1421", borderTop: `1px solid ${C.border}`, display: "flex", padding: "10px 0 20px" },
  };

  const initials = profile?.full_name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (!authReady) return (
    <div style={S.root}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      <div style={{ ...S.phone, alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 800, background: `linear-gradient(135deg,${C.accent},${C.warm})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 24 }}>UniSwap</div>
          <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    </div>
  );

  // ── Auth screens ───────────────────────────────────────────────────────────
  if (!user) return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bg}; }
        .auth-wrapper { display: flex; min-height: 100vh; }
        .auth-banner { display: none; }
        .auth-form-side { flex: 1; display: flex; align-items: center; justify-content: center; padding: 24px; }
        .auth-card { width: 100%; max-width: 420px; background: ${C.card}; border-radius: 28px; padding: 36px 32px; border: 1px solid ${C.border}; box-shadow: 0 24px 80px rgba(0,0,0,0.5); }
        @media (max-width: 480px) {
          .auth-form-side { padding: 0; align-items: stretch; }
          .auth-card { border-radius: 0; min-height: 100vh; padding: 48px 24px 32px; box-shadow: none; border: none; display: flex; flex-direction: column; justify-content: center; }
        }
        @media (min-width: 900px) {
          .auth-banner { display: flex; flex: 1; flex-direction: column; align-items: center; justify-content: center; padding: 48px; background: linear-gradient(160deg, #0D1421 0%, #111827 100%); border-right: 1px solid ${C.border}; position: relative; overflow: hidden; }
          .auth-form-side { flex: 0 0 480px; overflow-y: auto; }
          .auth-card { box-shadow: none; border: none; background: transparent; }
        }
      `}</style>
      <Toast {...toast} />
      {modal && <Modal type={modal} onClose={() => setModal(null)} />}

      <div className="auth-wrapper">

        {/* LEFT BANNER — visible on desktop only */}
        <div className="auth-banner">
          <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: `${C.accent}08`, top: -100, left: -100 }} />
          <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: `${C.warm}08`, bottom: -50, right: -50 }} />
          <div style={{ textAlign: "center", position: "relative", zIndex: 1, maxWidth: 400 }}>
            <div style={{ fontSize: 72, marginBottom: 20 }}>🛒</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 48, fontWeight: 800, background: `linear-gradient(135deg,${C.accent},${C.warm})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 16 }}>UniSwap</div>
            <div style={{ color: C.muted, fontSize: 18, lineHeight: 1.7, marginBottom: 40 }}>The trusted campus marketplace for students to buy, sell and swap items safely.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[["🔒", "Campus emails only — verified & safe"],["⚡", "Post a listing in under 60 seconds"],["💬", "Chat directly with buyers & sellers"],["🎓", "Built exclusively for campus life"]].map(([icon, text]) => (
                <div key={text} style={{ display: "flex", alignItems: "center", gap: 14, background: `${C.accent}0D`, border: `1px solid ${C.accent}22`, borderRadius: 14, padding: "12px 16px" }}>
                  <span style={{ fontSize: 22 }}>{icon}</span>
                  <span style={{ color: C.text, fontSize: 14, fontWeight: 500 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT FORM SIDE */}
        <div className="auth-form-side">
          <div className="auth-card">

            {/* Logo — shown on mobile & tablet only (hidden on desktop where banner shows it) */}
            <div style={{ marginBottom: 32, textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🛒</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 800, background: `linear-gradient(135deg,${C.accent},${C.warm})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>UniSwap</div>
              <div style={{ color: C.muted, fontSize: 14, marginTop: 4 }}>Your campus marketplace</div>
            </div>

            {/* LOGIN */}
            {authScreen === "login" && loginStep === "email" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ fontFamily: "'Syne',sans-serif", color: C.text, fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Welcome back</div>
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
                <div style={{ fontFamily: "'Syne',sans-serif", color: C.text, fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Enter password</div>
                <div style={{ color: C.muted, fontSize: 14 }}>{email}</div>
                <div style={{ position: "relative" }}>
                  <Input type={showPassword ? "text" : "password"} placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} style={{ paddingRight: 48 }} />
                  <div onClick={() => setShowPassword(p => !p)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: C.muted, display: "flex" }}>
                    <EyeIcon open={showPassword} />
                  </div>
                </div>
                <Btn primary onClick={handleLogin}>{loading ? "Signing in…" : "Sign In"}</Btn>
                <div style={{ textAlign: "center", color: C.muted, fontSize: 14, cursor: "pointer" }} onClick={() => setLoginStep("email")}>← Use a different email</div>
              </div>
            )}

            {/* SIGNUP */}
            {authScreen === "signup" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ fontFamily: "'Syne',sans-serif", color: C.text, fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Create account</div>
                <Input placeholder="Full name" value={fullName} onChange={e => setFullName(e.target.value)} />
                <Input placeholder="School email (.edu.ng)" value={email} onChange={e => setEmail(e.target.value)} />
                <Input placeholder="Matric number" value={matric} onChange={e => setMatric(e.target.value)} />
                <div style={{ position: "relative" }}>
                  <Input type={showPassword ? "text" : "password"} placeholder="Create password" value={password} onChange={e => setPassword(e.target.value)} style={{ paddingRight: 48 }} />
                  <div onClick={() => setShowPassword(p => !p)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: C.muted, display: "flex" }}>
                    <EyeIcon open={showPassword} />
                  </div>
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <div onClick={() => { setAcceptedTerms(p => !p); setAcceptedPrivacy(p => !p); }} style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${acceptedTerms ? C.accent : C.muted}`, background: acceptedTerms ? C.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .2s" }}>
                    {acceptedTerms && <span style={{ color: "#000", fontSize: 13, fontWeight: 800 }}>✓</span>}
                  </div>
                  <span style={{ color: C.muted, fontSize: 13 }}>I agree to the <span onClick={e => { e.stopPropagation(); setModal("terms"); }} style={{ color: C.accent, fontWeight: 600, textDecoration: "underline", cursor: "pointer" }}>Terms of Use</span> and <span onClick={e => { e.stopPropagation(); setModal("privacy"); }} style={{ color: C.accent, fontWeight: 600, textDecoration: "underline", cursor: "pointer" }}>Privacy Policy</span></span>
                </label>
                <Btn primary onClick={handleSignUp} style={{ opacity: acceptedTerms ? 1 : 0.5 }}>{loading ? "Creating…" : "Join UniSwap 🚀"}</Btn>
                <div style={{ textAlign: "center", color: C.muted, fontSize: 14, cursor: "pointer" }} onClick={() => { setAuthScreen("login"); setLoginStep("email"); }}>← Back to login</div>
              </div>
            )}

            <div style={{ marginTop: 24, padding: 12, background: `${C.accent}0D`, borderRadius: 12, border: `1px solid ${C.accent}22`, textAlign: "center" }}>
              <div style={{ fontSize: 12, color: C.muted }}>🔒 Only verified campus emails allowed. Safe & trusted.</div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );

  // ── Chat detail ────────────────────────────────────────────────────────────
  if (selectedChat && tab === "messages") return (
    <div style={S.root}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      <div style={S.phone}>
        <div style={{ padding: "14px 20px 12px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ cursor: "pointer", color: C.accent, fontSize: 20 }} onClick={() => setSelectedChat(null)}>←</span>
          <Avatar initials="??" size={38} />
          <div><div style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>Chat</div><div style={{ color: C.muted, fontSize: 12 }}>Re: {selectedChat?.listings?.title}</div></div>
          <div style={{ marginLeft: "auto", background: `${C.green}22`, color: C.green, fontSize: 11, padding: "4px 10px", borderRadius: 20, fontWeight: 600 }}>Active</div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
          {messages.length === 0 && <div style={{ textAlign: "center", color: C.muted, padding: 40, fontSize: 14 }}>No messages yet. Say hi! 👋</div>}
          {messages.map(m => {
            const isMe = m.sender_id === user.id;
            return (
              <div key={m.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: 12 }}>
                <div style={{ maxWidth: "72%", background: isMe ? `linear-gradient(135deg,${C.accent},#0099CC)` : C.pill, color: isMe ? "#000" : C.text, borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px", padding: "10px 14px", fontSize: 14 }}>
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

  // ── Listing detail ─────────────────────────────────────────────────────────
  if (selectedListing && tab === "home") {
  const imgs = getImages(selectedListing);
  return (
    <div style={S.root}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      <div style={S.phone}>
        <div style={{ padding: "14px 20px 12px", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ cursor: "pointer", color: C.accent, fontSize: 20 }} onClick={() => { setSelectedListing(null); setActivePhoto(0); }}>←</span>
          <span style={{ color: C.text, fontWeight: 700 }}>Listing Detail</span>
        </div>
        <div style={{ flex: 1, overflowY: "auto", paddingBottom: 100 }}>

          {/* Photo gallery */}
          {imgs.length > 0 ? (
            <div>
              <div style={{ height: 220, overflow: "hidden", position: "relative", background: C.pill }}>
                <img src={imgs[activePhoto]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                {imgs.length > 1 && (
                  <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6 }}>
                    {imgs.map((_, i) => (
                      <div key={i} onClick={() => setActivePhoto(i)} style={{ width: i === activePhoto ? 20 : 6, height: 6, borderRadius: 3, background: i === activePhoto ? C.accent : "#ffffff88", transition: "all .2s", cursor: "pointer" }} />
                    ))}
                  </div>
                )}
                {activePhoto > 0 && <div onClick={() => setActivePhoto(p => p - 1)} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", fontSize: 16 }}>‹</div>}
                {activePhoto < imgs.length - 1 && <div onClick={() => setActivePhoto(p => p + 1)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", fontSize: 16 }}>›</div>}
              </div>
              {imgs.length > 1 && (
                <div style={{ display: "flex", gap: 8, padding: "10px 16px", overflowX: "auto" }}>
                  {imgs.map((url, i) => (
                    <div key={i} onClick={() => setActivePhoto(i)} style={{ width: 52, height: 52, borderRadius: 10, overflow: "hidden", border: `2px solid ${i === activePhoto ? C.accent : "transparent"}`, flexShrink: 0, cursor: "pointer" }}>
                      <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: `${C.accent}11`, height: 200, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 80 }}>📦</div>
          )}

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
          {selectedListing.seller_id !== user?.id && (<Btn style={{ flex: 1 }} onClick={() => startChat(selectedListing)}>💬 Message Seller</Btn>)}
          <Btn primary style={{ flex: 1 }}>Buy Now</Btn>
        </div>
      </div>
    </div>
  );
  }

  // ── Main app ───────────────────────────────────────────────────────────────
  return (
    <div style={S.root}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      <Toast {...toast} />
      <div style={S.phone}>

        {/* HOME */}
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
                {listings.map(l => {
                  const imgs = getImages(l);
                  return (
                  <div key={l.id} onClick={() => setSelectedListing(l)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, overflow: "hidden", cursor: "pointer" }}>
                    <div style={{ background: `${C.accent}11`, height: 90, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 42, position: "relative", overflow: "hidden" }}>
                      {imgs[0] ? <img src={imgs[0]} alt={l.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span>📦</span>}
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
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MESSAGES */}
        {tab === "messages" && !selectedChat && (
          <div style={S.scroll}>
            <div style={{ padding: "16px 20px 12px" }}>
              <div style={{ fontFamily: "'Syne',sans-serif", color: C.text, fontSize: 22, fontWeight: 800, marginBottom: 16 }}>Messages</div>
            </div>
            {chats.length === 0 ? (
              <div style={{ textAlign: "center", color: C.muted, padding: 60, fontSize: 14 }}>No conversations yet.<br />Browse listings and message a seller!</div>
            ) : chats.map(c => (
              <div key={c.id} onClick={() => openChat(c)} style={{ padding: "14px 20px", display: "flex", gap: 14, alignItems: "center", cursor: "pointer", borderBottom: `1px solid ${C.border}22` }}>
                <Avatar initials="??" size={46} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>{c.listings?.title}</div>
                    <div style={{ color: C.muted, fontSize: 12 }}>{new Date(c.created_at).toLocaleDateString()}</div>
                  </div>
                  <div style={{ color: C.muted, fontSize: 13, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.content}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SELL */}
        {tab === "sell" && (
          <div style={S.scroll}>
            <div style={{ padding: "20px" }}>
              <div style={{ fontFamily: "'Syne',sans-serif", color: C.text, fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Sell an Item</div>
              <div style={{ color: C.muted, fontSize: 14, marginBottom: 24 }}>Turn your unused stuff into cash 💰</div>

              {/* Photo Upload Area */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ color: C.muted, fontSize: 12, marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Photos ({sellPhotos.length}/5)</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {/* Photo previews */}
                  {sellPhotosPreviews.map((src, i) => (
                    <div key={i} style={{ position: "relative", width: 80, height: 80, borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}` }}>
                      <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <div onClick={() => removePhoto(i)} style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.7)", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", fontSize: 11, fontWeight: 700 }}>✕</div>
                      {i === 0 && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: `${C.accent}CC`, fontSize: 9, fontWeight: 700, color: "#000", textAlign: "center", padding: "2px 0" }}>MAIN</div>}
                    </div>
                  ))}
                  {/* Add photo button */}
                  {sellPhotos.length < 5 && (
                    <div onClick={() => photoInputRef.current?.click()} style={{ width: 80, height: 80, borderRadius: 12, border: `2px dashed ${C.accent}66`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", background: `${C.accent}0A`, gap: 4 }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      <span style={{ color: C.accent, fontSize: 10, fontWeight: 600 }}>Add</span>
                    </div>
                  )}
                </div>
                <input ref={photoInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handlePhotoSelect} />
                <div style={{ color: C.muted, fontSize: 11, marginTop: 8 }}>First photo is the main thumbnail. Max 5 photos.</div>
              </div>

              {/* Upload progress */}
              {loading && uploadProgress > 0 && uploadProgress < 100 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ color: C.muted, fontSize: 12 }}>Uploading photos…</span>
                    <span style={{ color: C.accent, fontSize: 12, fontWeight: 700 }}>{uploadProgress}%</span>
                  </div>
                  <div style={{ background: C.pill, borderRadius: 10, height: 6, overflow: "hidden" }}>
                    <div style={{ background: `linear-gradient(135deg,${C.accent},#0099CC)`, height: "100%", width: `${uploadProgress}%`, borderRadius: 10, transition: "width .3s" }} />
                  </div>
                </div>
              )}

              {[["Item Name", sellTitle, setSellTitle, "text", "e.g. Calculus Textbook"], ["Price (₦)", sellPrice, setSellPrice, "number", "e.g. 4500"]].map(([label, val, setter, type, ph]) => (
                <div key={label} style={{ marginBottom: 14 }}>
                  <div style={{ color: C.muted, fontSize: 12, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
                  <Input type={type} placeholder={ph} value={val} onChange={e => setter(e.target.value)} />
                </div>
              ))}
              <div style={{ marginBottom: 14 }}>
                <div style={{ color: C.muted, fontSize: 12, marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Category</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{["Books","Electronics","Appliances","Furniture","Tools","Music","Accessories"].map(c => <Pill key={c} active={sellCat === c} onClick={() => setSellCat(c)}>{c}</Pill>)}</div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ color: C.muted, fontSize: 12, marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Condition</div>
                <div style={{ display: "flex", gap: 8 }}>{["New","Good","Fairly Used"].map(c => <Pill key={c} active={sellCond === c} color={C.green} onClick={() => setSellCond(c)}>{c}</Pill>)}</div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ color: C.muted, fontSize: 12, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Description</div>
                <textarea style={{ background: C.pill, border: `1px solid ${C.border}`, borderRadius: 12, padding: "13px 16px", color: C.text, fontSize: 14, width: "100%", height: 80, resize: "none", outline: "none", boxSizing: "border-box" }} placeholder="Describe condition, pickup spot…" value={sellDesc} onChange={e => setSellDesc(e.target.value)} />
              </div>
              <Btn primary onClick={handlePostListing}>{loading ? `${uploadProgress > 0 ? `Uploading ${uploadProgress}%…` : "Posting…"}` : "🚀 Post Listing"}</Btn>
            </div>
          </div>
        )}

        {/* PROFILE */}
        {tab === "profile" && (
          <div style={S.scroll}>
            <div style={{ padding: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
                <Avatar initials={initials} size={72} />
                <div style={{ fontFamily: "'Syne',sans-serif", color: C.text, fontSize: 20, fontWeight: 800, marginTop: 12 }}>{profile?.full_name || "User"}</div>
                <div style={{ color: C.muted, fontSize: 14 }}>{profile?.email || user?.email}</div>
                <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Matric: {profile?.matric_number || "—"}</div>
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

        {/* BOTTOM NAV */}
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
