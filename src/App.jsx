import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://uypunathqfvyhuiiisov.supabase.co",
  "sb_publishable_oyW3D5yURCp60CzPuPAfLQ_pcXf4_BI"
);

const C = { bg: "#0A0E1A", card: "#111827", border: "#1E2A3A", accent: "#00D4FF", warm: "#FF6B35", green: "#00E676", text: "#F0F4FF", muted: "#6B7FA3", pill: "#1A2540", sidebar: "#0D1421" };
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
const Avatar = ({ initials, size = 36 }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", background: `linear-gradient(135deg,${C.accent}33,${C.warm}33)`, border: `1.5px solid ${C.accent}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.35, fontWeight: 700, color: C.accent, flexShrink: 0 }}>{initials}</div>
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

const TERMS = `1. Acceptance of Terms\nBy creating an account on UniSwap, you agree to be bound by these Terms of Use.\n\n2. Eligibility\nUniSwap is exclusively for students and staff with a valid campus email address.\n\n3. User Conduct\nYou agree not to post false, misleading, or fraudulent listings. All items must be legal and permitted on campus.\n\n4. Transactions\nUniSwap is a marketplace platform only. We do not process payments or guarantee transactions. Meet in safe, public campus locations.\n\n5. Account Termination\nWe reserve the right to suspend accounts that violate these terms or engage in fraudulent activity.\n\n6. Limitation of Liability\nUniSwap is not liable for any loss or dispute arising from transactions between users.\n\n7. Changes to Terms\nWe may update these terms at any time. Continued use constitutes acceptance.\n\nLast updated: February 2026`;
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
      if (session?.user) { setUser(session.user); fetchProfile(session.user.id); }
      else { setUser(null); setProfile(null); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (uid) => {
    try {
      const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
      setProfile(data || { full_name: "User", email: "", matric_number: "", rating: 0 });
    } catch { setProfile({ full_name: "User", email: "", matric_number: "", rating: 0 }); }
  };

  const handleSignUp = async () => {
    if (!fullName || !email || !password || !matric) return showToast("Please fill all fields", "error");
    if (!email.includes("@")) return showToast("Please enter a valid email", "error");
    if (!acceptedTerms) return showToast("Please accept Terms & Privacy Policy", "error");
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

          {authScreen === "signup" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ fontFamily: "'Syne',sans-serif", color: C.text, fontSize: 22, fontWeight: 800 }}>Create account</div>
              <Input placeholder="Full name" value={fullName} onChange={e => setFullName(e.target.value)} />
              <Input placeholder="School email (.edu.ng)" value={email} onChange={e => setEmail(e.target.value)} />
              <Input placeholder="Matric number" value={matric} onChange={e => setMatric(e.target.value)} />
              <div style={{ position: "relative" }}>
                <Input type={showPassword ? "text" : "password"} placeholder="Create password" value={password} onChange={e => setPassword(e.target.value)} style={{ paddingRight: 48 }} />
                <div onClick={() => setShowPassword(p => !p)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: C.muted, display: "flex" }}><EyeIcon open={showPassword} /></div>
              </div>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                <div onClick={() => { setAcceptedTerms(p => !p); setAcceptedPrivacy(p => !p); }} style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${acceptedTerms ? C.accent : C.muted}`, background: acceptedTerms ? C.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1, transition: "all .2s" }}>
                  {acceptedTerms && <span style={{ color: "#000", fontSize: 13, fontWeight: 800 }}>✓</span>}
                </div>
                <span style={{ color: C.muted, fontSize: 13, lineHeight: 1.5 }}>I agree to the <span onClick={e => { e.stopPropagation(); setModal("terms"); }} style={{ color: C.accent, fontWeight: 600, textDecoration: "underline", cursor: "pointer" }}>Terms of Use</span> and <span onClick={e => { e.stopPropagation(); setModal("privacy"); }} style={{ color: C.accent, fontWeight: 600, textDecoration: "underline", cursor: "pointer" }}>Privacy Policy</span></span>
              </label>
              <Btn primary onClick={handleSignUp} style={{ opacity: acceptedTerms ? 1 : 0.5 }}>{loading ? "Creating…" : "Join UniSwap 🚀"}</Btn>
              <div style={{ textAlign: "center", color: C.muted, fontSize: 14, cursor: "pointer" }} onClick={() => { setAuthScreen("login"); setLoginStep("email"); }}>← Back to login</div>
            </div>
          )}

          <div style={{ marginTop: 24, padding: 12, background: `${C.accent}0D`, borderRadius: 12, border: `1px solid ${C.accent}1A`, textAlign: "center" }}>
            <div style={{ fontSize: 12, color: C.muted }}>🔒 Only verified campus emails allowed</div>
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
    { id: "profile",  icon: "👤", label: "Profile" },
  ];

  const handleTabChange = (id) => { setTab(id); setSelectedListing(null); setSelectedChat(null); };

  return (
    <div className="app-shell">
      <style>{GLOBAL_CSS}</style>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      <Toast {...toast} />
      {modal && <Modal type={modal} onClose={() => setModal(null)} />}

      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
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
            <Avatar initials={initials} size={34} />
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
              <div>
                <div style={{ color: C.muted, fontSize: 14, marginBottom: 2 }}>Good day 👋</div>
                <div className="page-title">Marketplace</div>
              </div>
              <Avatar initials={initials} size={42} />
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
                        <div onClick={e => { e.stopPropagation(); setLiked(p => ({ ...p, [l.id]: !p[l.id] })); }} style={{ position: "absolute", top: 8, right: 8, background: `${C.bg}DD`, borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, cursor: "pointer" }}>{liked[l.id] ? "❤️" : "🤍"}</div>
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
                <div onClick={e => { e.stopPropagation(); setLiked(p => ({ ...p, [selectedListing.id]: !p[selectedListing.id] })); }} style={{ marginLeft: "auto", fontSize: 22, cursor: "pointer" }}>{liked[selectedListing.id] ? "❤️" : "🤍"}</div>
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
                  <div style={{ marginTop: 20, padding: 16, background: C.pill, borderRadius: 16, display: "flex", alignItems: "center", gap: 14 }}>
                    <Avatar initials={(selectedListing.profiles?.full_name || "??").slice(0, 2).toUpperCase()} size={46} />
                    <div>
                      <div style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>{selectedListing.profiles?.full_name || "Unknown"}</div>
                      <div style={{ color: C.green, fontSize: 12, marginTop: 2 }}>✓ Campus verified seller</div>
                    </div>
                  </div>
                  {selectedListing.description && <div style={{ marginTop: 16, color: C.muted, fontSize: 14, lineHeight: 1.8, paddingBottom: 20 }}>{selectedListing.description}</div>}
                </div>
              </div>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 20px 28px", background: C.card, borderTop: `1px solid ${C.border}`, display: "flex", gap: 12 }}>
                {selectedListing.seller_id !== user?.id && <Btn style={{ flex: 1 }} onClick={() => startChat(selectedListing)}>💬 Message Seller</Btn>}
                <Btn primary style={{ flex: 1 }}>Buy Now</Btn>
              </div>
            </div>
          );
        })()}

        {/* ─── MESSAGES ─── */}
        {tab === "messages" && !selectedChat && (
          <>
            <div className="page-header"><div className="page-title">Messages</div></div>
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
            <div className="page-header"><div className="page-title">Sell an Item</div></div>
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
            <div className="page-header"><div className="page-title">Profile</div></div>
            <div className="form-page">

              {/* Profile card */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 24, padding: "28px 24px", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                  <Avatar initials={initials} size={72} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Syne',sans-serif", color: C.text, fontSize: 20, fontWeight: 800 }}>{profile?.full_name || "User"}</div>
                    <div style={{ color: C.muted, fontSize: 13, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile?.email || user?.email}</div>
                    <div style={{ color: C.muted, fontSize: 13, marginTop: 2 }}>Matric: {profile?.matric_number || "—"}</div>
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
              </div>

              {/* Tab switcher: Menu / My Listings */}
              <div style={{ display: "flex", background: C.pill, borderRadius: 14, padding: 4, marginBottom: 20, gap: 4 }}>
                {[["menu", "⚙️ Account"], ["listings", "📦 My Listings"]].map(([id, label]) => (
                  <div key={id} onClick={() => setProfileTab(id)} style={{ flex: 1, textAlign: "center", padding: "10px 0", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", background: profileTab === id ? C.card : "transparent", color: profileTab === id ? C.text : C.muted, border: profileTab === id ? `1px solid ${C.border}` : "1px solid transparent", transition: "all .2s" }}>{label}</div>
                ))}
              </div>

              {/* ── ACCOUNT MENU ── */}
              {profileTab === "menu" && (
                <>
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, overflow: "hidden", marginBottom: 20 }}>
                    {[["🛒","Purchases"],["❤️","Saved Items"],["⭐","Reviews"],["🔔","Notifications"],["⚙️","Settings"],["🆘","Support"]].map(([icon, label], i, arr) => (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", borderBottom: i < arr.length - 1 ? `1px solid ${C.border}22` : "none", cursor: "pointer", transition: "background .15s" }} onMouseEnter={e => e.currentTarget.style.background = C.pill} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <span style={{ fontSize: 20, width: 28 }}>{icon}</span>
                        <span style={{ color: C.text, fontSize: 15, fontWeight: 500 }}>{label}</span>
                        <span style={{ marginLeft: "auto", color: C.muted, fontSize: 18 }}>›</span>
                      </div>
                    ))}
                  </div>
                  <Btn danger onClick={handleSignOut}>Sign Out</Btn>
                </>
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
