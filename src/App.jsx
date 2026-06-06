import { useState, useEffect, useCallback } from "react";
import {
  Home, Search, Star, User, Phone, MapPin, Bed, Bath,
  LogOut, Plus, ArrowLeft, Building2, CheckCircle, AlertCircle,
  Heart, MessageCircle, Bell, Users, ChevronRight, Send,
  X, Check, FileText, BellOff
} from "lucide-react";

// ─── API Layer ────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

async function apiFetch(path, options = {}, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LOCALITIES = ["Koramangala", "Indiranagar", "HSR Layout", "BTM Layout", "Whitefield", "Jayanagar", "JP Nagar", "Marathahalli"];
const amenityIcons  = { wifi: "📶", parking: "🚗", "power-backup": "⚡", water: "💧", security: "🔒" };
const amenityLabels = { wifi: "Wi-Fi", parking: "Parking", "power-backup": "Power Backup", water: "24hr Water", security: "Security" };

// ─── UI Helpers ───────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );
}

function ErrMsg({ message, onRetry }) {
  return (
    <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center my-4">
      <AlertCircle size={24} className="text-red-400 mx-auto mb-2" />
      <p className="text-red-600 text-sm">{message}</p>
      {onRetry && <button onClick={onRetry} className="mt-2 text-blue-600 text-sm font-medium">Try again</button>}
    </div>
  );
}

function Stars({ value, size = "sm" }) {
  return (
    <span className={`flex gap-0.5 ${size === "lg" ? "text-xl" : "text-sm"}`}>
      {[1,2,3,4,5].map(i => <span key={i} style={{ color: i <= Math.round(value) ? "#f59e0b" : "#d1d5db" }}>★</span>)}
    </span>
  );
}

function Badge({ label, color = "blue" }) {
  const colors = { blue: "bg-blue-100 text-blue-700", green: "bg-green-100 text-green-700", amber: "bg-amber-100 text-amber-700", red: "bg-red-100 text-red-700", gray: "bg-gray-100 text-gray-600" };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[color]}`}>{label}</span>;
}

function RatingBar({ label, value }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-32 text-gray-500 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div className="bg-amber-400 h-2 rounded-full" style={{ width: `${(value / 5) * 100}%` }} />
      </div>
      <span className="w-4 text-gray-700 font-medium text-right">{value}</span>
    </div>
  );
}

// ─── Landing ──────────────────────────────────────────────────────────────────

function LandingPage({ onLogin }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-800 to-blue-600 text-white flex flex-col">
      <nav className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 size={28} className="text-amber-400" />
          <span className="text-2xl font-bold">FlatMate <span className="text-amber-400">India</span></span>
        </div>
        <button onClick={onLogin} className="bg-white text-blue-700 font-semibold px-5 py-2 rounded-xl hover:bg-blue-50 transition">Sign In</button>
      </nav>
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12">
        <div className="text-6xl mb-4">🏡</div>
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">Know Your Owner.<br />Know Your Tenant.</h1>
        <p className="text-blue-200 text-lg max-w-xl mb-8">India's first trust-based rental platform. Verified profiles, bidirectional reviews, in-app chat — before you sign anything.</p>
        <div className="flex flex-wrap gap-3 justify-center mb-10">
          {["✅ Aadhaar-verified","⭐ Bidirectional reviews","💬 In-app chat","📋 Application tracking","🔔 Notifications"].map(f => (
            <span key={f} className="bg-white/10 border border-white/20 px-4 py-2 rounded-full text-sm">{f}</span>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={() => onLogin("owner")} className="bg-amber-400 hover:bg-amber-300 text-gray-900 font-bold px-8 py-3 rounded-xl text-lg transition">I'm a Property Owner</button>
          <button onClick={() => onLogin("tenant")} className="bg-white/10 hover:bg-white/20 border border-white/30 font-bold px-8 py-3 rounded-xl text-lg transition">I'm Looking to Rent</button>
        </div>
      </div>
      <div className="grid grid-cols-3 border-t border-white/10 text-center">
        {[["1,200+","Verified Owners"],["8,500+","Tenant Profiles"],["4,300+","Active Listings"]].map(([n,l]) => (
          <div key={l} className="py-6 border-r border-white/10 last:border-0">
            <div className="text-2xl font-extrabold text-amber-400">{n}</div>
            <div className="text-blue-300 text-sm mt-1">{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────

function LoginPage({ preRole, onSuccess }) {
  const [role, setRole]       = useState(preRole || "tenant");
  const [phone, setPhone]     = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [step, setStep]       = useState(1);
  const [otp, setOtp]         = useState("");
  const [name, setName]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleSendOtp = async () => {
    if (phone.length !== 10) { setError("Enter a valid 10-digit mobile number"); return; }
    if (!aadhaar)            { setError("Enter Aadhaar number"); return; }
    setError(""); setLoading(true);
    try {
      await apiFetch("/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ phone, aadhaar, role }),
      });
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length < 4) { setError("Enter the OTP"); return; }
    setError(""); setLoading(true);
    try {
      const data = await apiFetch("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ phone, otp, aadhaar, role, name: name || undefined }),
      });
      localStorage.setItem("fmi_token", data.token);
      onSuccess(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="flex items-center gap-2 mb-6">
          <Building2 size={24} className="text-blue-600" />
          <span className="text-xl font-bold text-gray-800">FlatMate <span className="text-blue-600">India</span></span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Sign In</h2>
        <p className="text-gray-500 text-sm mb-6">Enter your details to continue</p>
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          {["owner","tenant"].map(r => (
            <button key={r} onClick={() => setRole(r)} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${role === r ? "bg-white shadow text-blue-700" : "text-gray-500"}`}>
              {r === "owner" ? "🏠 I'm an Owner" : "🔍 I'm a Tenant"}
            </button>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name (optional for new users)</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name"
                className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
              <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                <span className="px-3 py-3 bg-gray-50 text-gray-500 text-sm border-r border-gray-300">+91</span>
                <input type="tel" maxLength={10} value={phone} onChange={e => setPhone(e.target.value.replace(/\D/,""))} placeholder="9876543210" className="flex-1 px-3 py-3 text-sm outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Aadhaar Number</label>
              <input value={aadhaar} onChange={e => setAadhaar(e.target.value)} placeholder="XXXX XXXX XXXX"
                className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="text-xs text-gray-400 mt-1">Masked in your public profile. OTP: <strong>1234</strong></p>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button onClick={handleSendOtp} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl transition">
              {loading ? "Sending…" : "Send OTP"}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">OTP sent to +91 {phone} — demo OTP is <strong>1234</strong></div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
              <input type="text" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/,""))} placeholder="_ _ _ _"
                className="w-full border border-gray-300 rounded-xl px-3 py-3 text-center text-2xl tracking-widest outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button onClick={handleVerify} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl transition">
              {loading ? "Verifying…" : "Verify & Continue"}
            </button>
            <button onClick={() => setStep(1)} className="w-full text-gray-500 text-sm">← Back</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Owner Dashboard ──────────────────────────────────────────────────────────

function OwnerDashboard({ user, token, onNavigate }) {
  const [data, setData]       = useState({ properties: [], pendingApps: [], activeTenants: [], unread: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch("/properties/mine", {}, token),
      apiFetch("/applications/received", {}, token),
      apiFetch("/active-tenants", {}, token),
      apiFetch("/notifications", {}, token),
    ]).then(([props, apps, tenants, notifs]) => {
      setData({
        properties: props,
        pendingApps: apps.filter(a => a.status === "pending"),
        activeTenants: tenants,
        unread: notifs.filter(n => !n.read).length,
      });
    }).catch(console.error).finally(() => setLoading(false));
  }, [token]);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-5 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-blue-200 text-sm">Welcome back</p>
            <h2 className="text-2xl font-bold">{user.name || "Owner"}</h2>
            <div className="flex items-center gap-1 mt-1 text-blue-100 text-sm"><MapPin size={13} />{user.locality || "Bengaluru"}</div>
          </div>
          <div className="bg-white/20 rounded-xl p-3 text-center">
            <div className="text-xl font-bold">{user.verified ? "✓" : "—"}</div>
            <div className="text-xs text-blue-200">Verified</div>
          </div>
        </div>
        <div className="flex gap-3 mt-4 text-sm flex-wrap">
          <span className="bg-white/10 px-3 py-1 rounded-full">{data.properties.length} Properties</span>
          {data.pendingApps.length > 0 && <span className="bg-amber-400/80 px-3 py-1 rounded-full font-medium">{data.pendingApps.length} Pending Applications</span>}
          <span className="bg-white/10 px-3 py-1 rounded-full">{data.activeTenants.length} Active Tenants</span>
          {data.unread > 0 && <span className="bg-red-400/80 px-3 py-1 rounded-full">{data.unread} notifications</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { icon:"🏘️", label:"My Properties",   sub:`${data.properties.length} listed`,    action:"owner-properties" },
          { icon:"📋", label:"Applications",     sub:`${data.pendingApps.length} pending`,  action:"owner-applications", badge: data.pendingApps.length },
          { icon:"👥", label:"Active Tenants",   sub:`${data.activeTenants.length} tenants`,action:"active-tenants" },
          { icon:"🔍", label:"Lookup Tenant",    sub:"By phone/Aadhaar",                    action:"owner-lookup" },
          { icon:"➕", label:"Add Property",     sub:"List a new flat",                     action:"add-property" },
          { icon:"👤", label:"My Profile",       sub:"View public profile",                 action:"my-profile" },
        ].map(({ icon, label, sub, action, badge }) => (
          <button key={action} onClick={() => onNavigate(action)} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-left hover:shadow-md transition relative">
            {badge > 0 && <span className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{badge}</span>}
            <div className="text-2xl mb-2">{icon}</div>
            <div className="font-semibold text-gray-800 text-sm">{label}</div>
            <div className="text-gray-400 text-xs">{sub}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Tenant Dashboard ──────────────────────────────────────────────────────────

function TenantDashboard({ user, token, savedProperties, onNavigate }) {
  const [data, setData]       = useState({ apps: [], unread: 0, reports: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch("/applications/mine", {}, token),
      apiFetch("/notifications", {}, token),
      apiFetch(`/reviews/tenant-reports/${user.id}`, {}, token),
    ]).then(([apps, notifs, reports]) => {
      setData({ apps, unread: notifs.filter(n => !n.read).length, reports });
    }).catch(console.error).finally(() => setLoading(false));
  }, [token, user.id]);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-teal-600 to-green-500 rounded-2xl p-5 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-teal-100 text-sm">Welcome back</p>
            <h2 className="text-2xl font-bold">{user.name || "Tenant"}</h2>
            <div className="flex items-center gap-1 mt-1 text-teal-100 text-sm"><MapPin size={13} />{user.locality || "Bengaluru"}</div>
          </div>
          <div className="bg-white/20 rounded-xl p-3 text-center">
            <div className="text-xl font-bold">{user.verified ? "✓" : "—"}</div>
            <div className="text-xs text-teal-100">Verified</div>
          </div>
        </div>
        <div className="flex gap-3 mt-4 text-sm flex-wrap">
          <span className="bg-white/10 px-3 py-1 rounded-full">{savedProperties.length} Saved</span>
          <span className="bg-white/10 px-3 py-1 rounded-full">{data.apps.length} Applications</span>
          {data.unread > 0 && <span className="bg-red-400/80 px-3 py-1 rounded-full">{data.unread} notifications</span>}
          {user.verified && <span className="bg-green-500/30 px-3 py-1 rounded-full">✓ Verified</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { icon:"🔍", label:"Search Flats",     sub:"Find by locality",              action:"tenant-search" },
          { icon:"❤️", label:"Saved Flats",      sub:`${savedProperties.length} saved`,action:"saved-flats" },
          { icon:"📋", label:"My Applications",  sub:`${data.apps.length} submitted`,  action:"my-applications" },
          { icon:"🏠", label:"Lookup Owner",     sub:"By phone/Aadhaar",               action:"tenant-lookup" },
          { icon:"⭐", label:"Write a Review",   sub:"Rate your owner",                action:"write-review" },
          { icon:"👤", label:"My Profile",       sub:"View public profile",            action:"my-profile" },
        ].map(({ icon, label, sub, action }) => (
          <button key={action} onClick={() => onNavigate(action)} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-left hover:shadow-md transition">
            <div className="text-2xl mb-2">{icon}</div>
            <div className="font-semibold text-gray-800 text-sm">{label}</div>
            <div className="text-gray-400 text-xs">{sub}</div>
          </button>
        ))}
      </div>

      {data.reports.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Your Conduct Reports</h3>
          {data.reports.map(r => (
            <div key={r.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-3">
              <div className="flex justify-between items-start mb-2">
                <div><span className="font-medium text-sm text-gray-700">By {r.owner_name}</span><p className="text-xs text-gray-400">{r.date}</p></div>
                <Stars value={r.overall} />
              </div>
              <p className="text-gray-500 text-sm italic">"{r.comment}"</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Owner Properties ─────────────────────────────────────────────────────────

function OwnerProperties({ token, onNavigate }) {
  const [props, setProps]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const load = useCallback(() => {
    setLoading(true);
    apiFetch("/properties/mine", {}, token)
      .then(setProps).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner />;
  if (error)   return <ErrMsg message={error} onRetry={load} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">My Properties</h2>
        <button onClick={() => onNavigate("add-property")} className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium"><Plus size={14} /> Add</button>
      </div>
      {props.length === 0 && (
        <div className="text-center py-16 text-gray-400"><Home size={40} className="mx-auto mb-3 opacity-40" /><p className="font-medium">No properties listed yet</p></div>
      )}
      {props.map(p => (
        <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-start justify-between mb-2">
            <div><h3 className="font-semibold text-gray-900 text-sm">{p.title}</h3><div className="flex items-center gap-1 text-gray-400 text-xs mt-1"><MapPin size={11} />{p.address}</div></div>
            <Badge label={p.available ? "Available" : "Occupied"} color={p.available ? "green" : "amber"} />
          </div>
          <div className="flex gap-4 text-sm text-gray-500 my-3">
            <span><Bed size={13} className="inline mr-1" />{p.bedrooms} BHK</span>
            <span><Bath size={13} className="inline mr-1" />{p.bathrooms} Bath</span>
            <span>📐 {p.area} sqft</span>
          </div>
          <div className="flex items-center justify-between">
            <div><span className="text-blue-700 font-bold text-lg">₹{p.rent?.toLocaleString()}</span><span className="text-gray-400 text-sm">/month</span></div>
            <button onClick={() => onNavigate("property-detail", p.id)} className="text-blue-600 text-sm font-medium">View →</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Add Property ─────────────────────────────────────────────────────────────

function AddPropertyForm({ token, onNavigate }) {
  const [form, setForm] = useState({ title:"", locality:"", address:"", rent:"", deposit:"", bedrooms:"2", bathrooms:"1", area:"", description:"", amenities:[] });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [saved, setSaved]     = useState(false);

  const toggleAmenity = a => setForm(f => ({ ...f, amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a] }));

  const handleSave = async () => {
    if (!form.title || !form.locality || !form.rent) { setError("Title, locality and rent are required"); return; }
    setLoading(true); setError("");
    try {
      await apiFetch("/properties", {
        method: "POST",
        body: JSON.stringify({ ...form, rent: parseInt(form.rent), deposit: parseInt(form.deposit), bedrooms: parseInt(form.bedrooms), bathrooms: parseInt(form.bathrooms), area: parseInt(form.area) || null }),
      }, token);
      setSaved(true);
      setTimeout(() => onNavigate("owner-properties"), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (saved) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <CheckCircle size={56} className="text-green-500 mb-4" />
      <h3 className="text-xl font-bold text-gray-900">Property Listed!</h3>
      <p className="text-gray-500 text-sm mt-2">Your flat is now visible to tenants.</p>
    </div>
  );

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-gray-900">List a Property</h2>
      {[["Property Title","title","2BHK near Metro Station"],["Address","address","Full address"],["Monthly Rent (₹)","rent","20000","number"],["Security Deposit (₹)","deposit","60000","number"],["Area (sqft)","area","900","number"]].map(([label,key,placeholder,type]) => (
        <div key={key}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
          <input type={type||"text"} value={form[key]} onChange={e => setForm(f => ({...f,[key]:e.target.value}))} placeholder={placeholder} className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      ))}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Locality</label>
        <select value={form.locality} onChange={e => setForm(f => ({...f,locality:e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Select locality</option>
          {LOCALITIES.map(l => <option key={l}>{l}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[["bedrooms","Bedrooms",["1","2","3","4"]],["bathrooms","Bathrooms",["1","2","3"]]].map(([key,label,opts]) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <select value={form[key]} onChange={e => setForm(f => ({...f,[key]:e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500">
              {opts.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(amenityLabels).map(([k,v]) => (
            <button key={k} onClick={() => toggleAmenity(k)} className={`px-3 py-1.5 rounded-xl text-sm border transition ${form.amenities.includes(k) ? "bg-blue-50 border-blue-400 text-blue-700 font-medium" : "border-gray-200 text-gray-500"}`}>
              {amenityIcons[k]} {v}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea value={form.description} onChange={e => setForm(f => ({...f,description:e.target.value}))} rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button onClick={handleSave} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl transition">
        {loading ? "Saving…" : "List Property"}
      </button>
    </div>
  );
}

// ─── Owner Applications ───────────────────────────────────────────────────────

function OwnerApplications({ token, onNavigate }) {
  const [apps, setApps]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const load = useCallback(() => {
    setLoading(true);
    apiFetch("/applications/received", {}, token)
      .then(setApps).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status) => {
    try {
      await apiFetch(`/applications/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }, token);
      setApps(a => a.map(x => x.id === id ? { ...x, status } : x));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <Spinner />;
  if (error)   return <ErrMsg message={error} onRetry={load} />;

  const statusColors = { pending:"amber", accepted:"green", rejected:"red" };
  const statusLabels = { pending:"Pending", accepted:"Accepted", rejected:"Rejected" };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Applications</h2>
      {apps.length === 0 && <div className="text-center py-16 text-gray-400"><FileText size={40} className="mx-auto mb-3 opacity-40" /><p className="font-medium">No applications yet</p></div>}
      {apps.map(app => (
        <div key={app.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">For: {app.property_title}</p>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-teal-100 rounded-xl flex items-center justify-center font-bold text-teal-700">{app.tenant_name?.[0]}</div>
                  <div><p className="font-semibold text-gray-900 text-sm">{app.tenant_name}</p><p className="text-xs text-gray-400">+91 {app.tenant_phone}</p></div>
                </div>
              </div>
              <div className="text-right">
                <Badge label={statusLabels[app.status]} color={statusColors[app.status]} />
                <p className="text-xs text-gray-400 mt-1">{app.date}</p>
              </div>
            </div>
            {app.tenant_rating && (
              <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                <Stars value={parseFloat(app.tenant_rating)} /> <span>{app.tenant_rating} from {app.tenant_report_count} report(s)</span>
              </div>
            )}
          </div>
          <div className="px-4 py-3 bg-gray-50"><p className="text-sm text-gray-600 italic">"{app.message}"</p></div>
          <div className="p-4 flex gap-2">
            <button onClick={() => onNavigate("profile", app.tenant_id)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm font-medium">View Profile</button>
            <button onClick={() => onNavigate("chat", { withUserId: app.tenant_id })} className="flex-1 border border-blue-200 text-blue-600 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-1"><MessageCircle size={14} /> Chat</button>
            {app.status === "pending" && (
              <>
                <button onClick={() => updateStatus(app.id, "rejected")} className="px-3 py-2 bg-red-50 text-red-500 rounded-xl"><X size={16} /></button>
                <button onClick={() => updateStatus(app.id, "accepted")} className="px-3 py-2 bg-green-50 text-green-600 rounded-xl"><Check size={16} /></button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Active Tenants ───────────────────────────────────────────────────────────

function ActiveTenants({ token, onNavigate }) {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm]       = useState({ tenant_phone:"", property_id:"", move_in_date:"", monthly_rent:"" });
  const [props, setProps]     = useState([]);
  const [addError, setAddError] = useState("");
  const [adding, setAdding]   = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      apiFetch("/active-tenants", {}, token),
      apiFetch("/properties/mine", {}, token),
    ]).then(([t, p]) => { setTenants(t); setProps(p); }).catch(console.error).finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!form.tenant_phone || !form.property_id || !form.move_in_date || !form.monthly_rent) { setAddError("All fields are required"); return; }
    setAdding(true); setAddError("");
    try {
      const newTenant = await apiFetch("/active-tenants", {
        method: "POST",
        body: JSON.stringify({ ...form, monthly_rent: parseInt(form.monthly_rent) }),
      }, token);
      setTenants(t => [...t, newTenant]);
      setShowAdd(false); setForm({ tenant_phone:"", property_id:"", move_in_date:"", monthly_rent:"" });
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Active Tenants</h2>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium"><Plus size={14} /> Add</button>
      </div>

      {showAdd && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-3">
          <h3 className="font-semibold text-gray-800 text-sm">Record Move-In</h3>
          <input type="tel" maxLength={10} value={form.tenant_phone} onChange={e => setForm(f => ({...f, tenant_phone: e.target.value.replace(/\D/,"")}))} placeholder="Tenant's phone number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          <select value={form.property_id} onChange={e => setForm(f => ({...f, property_id: e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select property</option>
            {props.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
          <input type="date" value={form.move_in_date} onChange={e => setForm(f => ({...f, move_in_date: e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="number" value={form.monthly_rent} onChange={e => setForm(f => ({...f, monthly_rent: e.target.value}))} placeholder="Monthly rent (₹)" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          {addError && <p className="text-red-500 text-xs">{addError}</p>}
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(false)} className="flex-1 border border-gray-200 text-gray-500 py-2 rounded-xl text-sm">Cancel</button>
            <button onClick={handleAdd} disabled={adding} className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-sm font-semibold">{adding ? "Saving…" : "Save"}</button>
          </div>
        </div>
      )}

      {tenants.length === 0 && !showAdd && (
        <div className="text-center py-16 text-gray-400"><Users size={40} className="mx-auto mb-3 opacity-40" /><p className="font-medium">No active tenants recorded</p></div>
      )}

      {tenants.map(at => (
        <div key={at.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-teal-100 rounded-2xl flex items-center justify-center text-xl font-bold text-teal-700">{at.tenant_name?.[0]}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2"><span className="font-semibold text-gray-900">{at.tenant_name}</span>{at.tenant_verified && <span className="text-green-500 text-xs">✓</span>}</div>
              <p className="text-xs text-gray-400 mt-0.5">+91 {at.tenant_phone}</p>
              <p className="text-xs text-gray-500 mt-1">Moved in: {at.move_in_date}</p>
              <p className="text-xs text-gray-500">{at.property_title}</p>
              <p className="text-xs text-gray-500">₹{at.monthly_rent?.toLocaleString()}/month</p>
            </div>
            <Badge label="Active" color="green" />
          </div>
          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
            <button onClick={() => onNavigate("profile", at.tenant_id)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-xs font-medium">Profile</button>
            <button onClick={() => onNavigate("chat", { withUserId: at.tenant_id })} className="flex-1 border border-blue-200 text-blue-600 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1"><MessageCircle size={13} /> Chat</button>
            <button onClick={() => onNavigate("write-report", { tenantId: at.tenant_id })} className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-xs font-medium">Write Report</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tenant / Owner Lookup ─────────────────────────────────────────────────────

function UserLookup({ token, lookingFor, onNavigate }) {
  const [query, setQuery]   = useState("");
  const [type, setType]     = useState("phone");
  const [result, setResult] = useState(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true); setError(""); setSearched(false);
    try {
      const path = type === "phone"
        ? `/users/lookup/phone/${query}`
        : `/users/lookup/aadhaar/${query.replace(/\s|-/g,"").slice(-4)}`;
      const user = await apiFetch(path, {}, token);
      setResult(user.role === lookingFor ? user : null);
      setSearched(true);
    } catch {
      setResult(null); setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const isOwner = lookingFor === "owner";

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Lookup {isOwner ? "Owner" : "Tenant"}</h2>
        <p className="text-gray-500 text-sm mt-1">{isOwner ? "Check an owner's reputation before renting" : "Search by phone or Aadhaar"}</p>
      </div>
      <div className="flex bg-gray-100 rounded-xl p-1">
        {[["phone","📱 Phone"],["aadhaar","🆔 Aadhaar"]].map(([v,l]) => (
          <button key={v} onClick={() => { setType(v); setSearched(false); setResult(null); }} className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${type === v ? "bg-white shadow text-blue-700" : "text-gray-500"}`}>{l}</button>
        ))}
      </div>
      <div className="flex gap-2">
        <input type="text" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()}
          placeholder={type === "phone" ? "10-digit mobile number" : "Aadhaar number"}
          className="flex-1 border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
        <button onClick={handleSearch} disabled={loading} className="bg-blue-600 text-white px-5 rounded-xl disabled:bg-blue-300">
          {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Search size={16} />}
        </button>
      </div>
      {searched && !result && <div className="text-center py-10 text-gray-400"><AlertCircle size={36} className="mx-auto mb-2 opacity-50" /><p className="font-medium text-sm">No {lookingFor} found with this number</p></div>}
      {result && <ProfileCard user={result} token={token} onViewFull={() => onNavigate("profile", result.id)} />}
    </div>
  );
}

function ProfileCard({ user, token, onViewFull }) {
  const isOwner = user.role === "owner";
  const reviews = isOwner ? (user.reviews || []) : (user.reports || []);
  const avg = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.overall, 0) / reviews.length).toFixed(1) : null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className={`p-5 text-white ${isOwner ? "bg-gradient-to-r from-blue-600 to-indigo-600" : "bg-gradient-to-r from-green-500 to-teal-500"}`}>
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold">{user.name?.[0]}</div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">{user.name}</h3>
            <p className="text-sm opacity-80">+91 {user.phone}</p>
            <p className="text-sm opacity-80 flex items-center gap-1 mt-0.5"><MapPin size={12} />{user.locality}</p>
          </div>
          {avg && <div className="text-center bg-white/20 rounded-xl px-3 py-2"><div className="text-xl font-bold">{avg}</div><Stars value={parseFloat(avg)} /></div>}
        </div>
      </div>
      <div className="p-4 space-y-3">
        {reviews.slice(0, 2).map(r => (
          <div key={r.id} className="border border-gray-100 rounded-xl p-3">
            <div className="flex justify-between items-start mb-1">
              <span className="text-sm font-medium text-gray-700">{isOwner ? r.tenant_name : r.owner_name}</span>
              <Stars value={r.overall} />
            </div>
            <p className="text-gray-500 text-sm italic">"{r.comment}"</p>
          </div>
        ))}
        {reviews.length === 0 && <p className="text-gray-400 text-sm text-center py-2">No reviews yet</p>}
        <button onClick={onViewFull} className="w-full text-blue-600 text-sm font-medium py-2 border border-blue-200 rounded-xl hover:bg-blue-50 transition">View Full Profile →</button>
      </div>
    </div>
  );
}

// ─── Flat Search ───────────────────────────────────────────────────────────────

function FlatSearch({ token, savedProperties, onToggleSave, onNavigate }) {
  const [locality, setLocality] = useState("");
  const [maxRent, setMaxRent]   = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (locality) params.set("locality", locality);
    if (maxRent)  params.set("max_rent", maxRent);
    if (bedrooms) params.set("bedrooms", bedrooms);
    try {
      const data = await apiFetch(`/properties?${params}`, {}, token);
      setResults(data); setSearched(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div><h2 className="text-xl font-bold text-gray-900">Search Flats</h2><p className="text-gray-500 text-sm mt-1">Find verified properties by locality</p></div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Locality</label>
          <select value={locality} onChange={e => setLocality(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mt-1 outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Localities</option>
            {LOCALITIES.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Max Rent (₹)</label>
            <input type="number" value={maxRent} onChange={e => setMaxRent(e.target.value)} placeholder="25000" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mt-1 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Bedrooms</label>
            <select value={bedrooms} onChange={e => setBedrooms(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mt-1 outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Any</option>
              {["1","2","3","4"].map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
        </div>
        <button onClick={handleSearch} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2">
          {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Search size={16} /> Search</>}
        </button>
      </div>

      {searched && results.length === 0 && <div className="text-center py-10 text-gray-400"><Home size={36} className="mx-auto mb-2 opacity-40" /><p className="font-medium text-sm">No flats found</p></div>}

      {results.map(p => {
        const isSaved = savedProperties.includes(p.id);
        return (
          <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-5 pt-5 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 mr-2">
                  <h3 className="font-semibold text-gray-900">{p.title}</h3>
                  <div className="flex items-center gap-1 text-gray-400 text-xs mt-1"><MapPin size={11} />{p.address}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => onToggleSave(p.id)} className={`p-2 rounded-xl transition ${isSaved ? "bg-red-50 text-red-500" : "bg-white text-gray-400"}`}>
                    <Heart size={16} fill={isSaved ? "currentColor" : "none"} />
                  </button>
                  <Badge label="Available" color="green" />
                </div>
              </div>
              <div className="flex gap-4 mt-3 text-sm text-gray-500">
                <span><Bed size={13} className="inline mr-1" />{p.bedrooms} BHK</span>
                <span><Bath size={13} className="inline mr-1" />{p.bathrooms} Bath</span>
                {p.area && <span>📐 {p.area} sqft</span>}
              </div>
              {p.amenities?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {p.amenities.map(a => <span key={a} className="text-xs bg-white border border-gray-100 px-2 py-0.5 rounded-full text-gray-500">{amenityIcons[a]} {amenityLabels[a]}</span>)}
                </div>
              )}
            </div>
            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <div><span className="text-blue-700 font-bold text-xl">₹{p.rent?.toLocaleString()}</span><span className="text-gray-400 text-sm">/month</span></div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-700">{p.owner_name?.[0]}</div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">{p.owner_name}</span>
                    {p.owner_verified && <span className="text-green-500 text-xs ml-1">✓</span>}
                    {p.owner_rating && <div className="flex items-center gap-1 text-xs text-gray-400"><Stars value={parseFloat(p.owner_rating)} /> {p.owner_rating}</div>}
                  </div>
                </div>
                <button onClick={() => onNavigate("property-detail", p.id)} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium">View</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Saved Flats ───────────────────────────────────────────────────────────────

function SavedFlats({ token, savedProperties, onToggleSave, onNavigate }) {
  const [flats, setFlats]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (savedProperties.length === 0) { setLoading(false); return; }
    // Fetch each saved property
    Promise.all(savedProperties.map(id => apiFetch(`/properties/${id}`, {}, token).catch(() => null)))
      .then(results => setFlats(results.filter(Boolean)))
      .finally(() => setLoading(false));
  }, [savedProperties, token]);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Saved Flats</h2>
      {flats.length === 0 && <div className="text-center py-16 text-gray-400"><Heart size={40} className="mx-auto mb-3 opacity-40" /><p className="font-medium">No saved flats yet</p><p className="text-sm mt-1">Tap ❤️ on any listing to save it</p></div>}
      {flats.map(p => (
        <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 mr-2">
              <h3 className="font-semibold text-gray-900 text-sm">{p.title}</h3>
              <div className="flex items-center gap-1 text-gray-400 text-xs mt-0.5"><MapPin size={11} />{p.locality}</div>
            </div>
            <button onClick={() => onToggleSave(p.id)} className="p-2 bg-red-50 text-red-400 rounded-xl"><Heart size={16} fill="currentColor" /></button>
          </div>
          <div className="flex items-center justify-between">
            <div><span className="text-blue-700 font-bold">₹{p.rent?.toLocaleString()}</span><span className="text-gray-400 text-sm">/mo</span></div>
            <button onClick={() => onNavigate("property-detail", p.id)} className="text-blue-600 text-sm font-medium">View →</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── My Applications (Tenant) ─────────────────────────────────────────────────

function MyApplications({ token, onNavigate }) {
  const [apps, setApps]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/applications/mine", {}, token).then(setApps).catch(console.error).finally(() => setLoading(false));
  }, [token]);

  if (loading) return <Spinner />;
  const statusColors = { pending:"amber", accepted:"green", rejected:"red" };
  const statusLabels = { pending:"⏳ Pending", accepted:"✅ Accepted", rejected:"❌ Rejected" };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">My Applications</h2>
      {apps.length === 0 && <div className="text-center py-16 text-gray-400"><FileText size={40} className="mx-auto mb-3 opacity-40" /><p className="font-medium">No applications yet</p></div>}
      {apps.map(app => (
        <div key={app.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-semibold text-gray-900 text-sm">{app.property_title}</p>
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><MapPin size={11} />{app.locality}</p>
              <p className="text-xs text-gray-500 mt-0.5">Owner: {app.owner_name}</p>
            </div>
            <div className="text-right">
              <Badge label={statusLabels[app.status]} color={statusColors[app.status]} />
              <p className="text-xs text-gray-400 mt-1">{app.date}</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl px-3 py-2 mb-3"><p className="text-sm text-gray-600 italic">"{app.message}"</p></div>
          <div className="flex gap-2">
            <button onClick={() => onNavigate("property-detail", app.property_id)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-xs font-medium">View Flat</button>
            <button onClick={() => onNavigate("chat", { withUserId: app.owner_id })} className="flex-1 border border-blue-200 text-blue-600 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1"><MessageCircle size={13} /> Chat</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Apply for Flat ────────────────────────────────────────────────────────────

function ApplyFlat({ propertyId, currentUser, token, onNavigate }) {
  const [property, setProperty] = useState(null);
  const [message, setMessage]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError]       = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    apiFetch(`/properties/${propertyId}`, {}, token).then(setProperty).catch(console.error).finally(() => setFetching(false));
  }, [propertyId, token]);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setLoading(true); setError("");
    try {
      await apiFetch("/applications", { method: "POST", body: JSON.stringify({ property_id: propertyId, message }) }, token);
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <Spinner />;
  if (submitted) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <CheckCircle size={56} className="text-green-500 mb-4" />
      <h3 className="text-xl font-bold text-gray-900">Application Sent!</h3>
      <p className="text-gray-500 text-sm mt-2 max-w-xs">The owner will review your application. You can chat with them while you wait.</p>
      <button onClick={() => onNavigate("my-applications")} className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold">My Applications</button>
    </div>
  );

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-gray-900">Apply for Flat</h2>
      {property && <div className="bg-blue-50 rounded-2xl p-4"><p className="font-semibold text-gray-800">{property.title}</p><p className="text-gray-500 text-sm mt-0.5">{property.locality} • ₹{property.rent?.toLocaleString()}/month</p></div>}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Your Message to the Owner</label>
        <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5}
          placeholder="Introduce yourself — profession, reason for moving, duration, references..."
          className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      </div>
      <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-500">
        <p className="font-medium text-gray-700 mb-2">Profile shared with owner:</p>
        <p>👤 {currentUser.name}</p><p>📱 +91 {currentUser.phone}</p><p>📍 {currentUser.locality}</p>
        {currentUser.verified && <p>✅ Aadhaar Verified</p>}
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button onClick={handleSubmit} disabled={!message.trim() || loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition">
        {loading ? "Submitting…" : "Submit Application"}
      </button>
    </div>
  );
}

// ─── Property Detail ───────────────────────────────────────────────────────────

function PropertyDetail({ propertyId, currentUser, token, savedProperties, onToggleSave, onNavigate }) {
  const [p, setP]             = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const isSaved = savedProperties?.includes(propertyId);

  useEffect(() => {
    apiFetch(`/properties/${propertyId}`, {}, token).then(setP).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [propertyId, token]);

  if (loading) return <Spinner />;
  if (error || !p) return <ErrMsg message={error || "Property not found"} />;

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl h-48 flex items-center justify-center text-7xl relative">
        🏢
        {currentUser?.role === "tenant" && (
          <button onClick={() => onToggleSave(p.id)} className={`absolute top-4 right-4 p-3 rounded-xl shadow ${isSaved ? "bg-red-500 text-white" : "bg-white text-gray-400"}`}>
            <Heart size={18} fill={isSaved ? "currentColor" : "none"} />
          </button>
        )}
      </div>
      <div>
        <div className="flex items-start justify-between"><h2 className="text-xl font-bold text-gray-900 flex-1 mr-2">{p.title}</h2><Badge label={p.available ? "Available" : "Occupied"} color={p.available ? "green" : "amber"} /></div>
        <div className="flex items-center gap-1 text-gray-500 text-sm mt-1"><MapPin size={13} />{p.address}</div>
      </div>
      <div className="bg-blue-50 rounded-2xl p-4">
        <div className="flex items-baseline gap-1"><span className="text-3xl font-extrabold text-blue-700">₹{p.rent?.toLocaleString()}</span><span className="text-gray-500">/month</span></div>
        <p className="text-gray-500 text-sm mt-1">Deposit: ₹{p.deposit?.toLocaleString()} • Available: {p.available_from}</p>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        {[["🛏️",`${p.bedrooms} BHK`],["🚿",`${p.bathrooms} Bath`],["📐",`${p.area} sqft`]].map(([icon,label]) => (
          <div key={label} className="bg-white rounded-xl p-3 border border-gray-100"><div className="text-xl mb-1">{icon}</div><div className="text-sm font-medium text-gray-700">{label}</div></div>
        ))}
      </div>
      {p.amenities?.length > 0 && (
        <div><h3 className="font-semibold text-gray-800 mb-2">Amenities</h3>
          <div className="flex flex-wrap gap-2">{p.amenities.map(a => <span key={a} className="flex items-center gap-1 text-sm bg-green-50 text-green-700 border border-green-100 px-3 py-1 rounded-full">{amenityIcons[a]} {amenityLabels[a]}</span>)}</div>
        </div>
      )}
      {p.description && <div><h3 className="font-semibold text-gray-800 mb-2">About</h3><p className="text-gray-600 text-sm leading-relaxed">{p.description}</p></div>}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <h3 className="font-semibold text-gray-800 mb-3">Owner</h3>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-xl font-bold text-blue-700">{p.owner_name?.[0]}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2"><span className="font-semibold text-gray-900">{p.owner_name}</span>{p.owner_verified && <span className="text-green-500 text-sm">✓</span>}</div>
            {p.owner_rating && <div className="flex items-center gap-1 mt-0.5"><Stars value={parseFloat(p.owner_rating)} /><span className="text-sm text-gray-500">{p.owner_rating} ({p.owner_review_count} reviews)</span></div>}
            <p className="text-xs text-gray-400 mt-0.5">Member since {p.owner_joined}</p>
          </div>
        </div>
        <button onClick={() => onNavigate("profile", p.owner_id)} className="w-full mt-3 text-blue-600 text-sm font-medium py-2 border border-blue-200 rounded-xl hover:bg-blue-50 transition">View Owner's Full Profile →</button>
      </div>
      {currentUser?.role === "tenant" && p.available && (
        <div className="flex gap-3">
          <button onClick={() => onNavigate("apply-flat", p.id)} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold">📋 Apply Now</button>
          <button onClick={() => onNavigate("chat", { withUserId: p.owner_id })} className="flex-1 border border-blue-200 text-blue-600 py-3 rounded-xl font-semibold flex items-center justify-center gap-1"><MessageCircle size={16} /> Chat</button>
        </div>
      )}
    </div>
  );
}

// ─── Chat ──────────────────────────────────────────────────────────────────────

function ChatScreen({ currentUser, withUserId, token }) {
  const [other, setOther]     = useState(null);
  const [msgs, setMsgs]       = useState([]);
  const [text, setText]       = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch(`/users/${withUserId}`, {}, token),
      apiFetch(`/messages/${withUserId}`, {}, token),
    ]).then(([user, messages]) => { setOther(user); setMsgs(messages); })
      .catch(console.error).finally(() => setLoading(false));
    // Mark as read
    apiFetch(`/messages/${withUserId}/read`, { method: "PATCH" }, token).catch(() => {});
  }, [withUserId, token]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const msg = await apiFetch(`/messages/${withUserId}`, { method: "POST", body: JSON.stringify({ text: text.trim() }) }, token);
      setMsgs(m => [...m, msg]);
      setText("");
    } catch (err) {
      alert(err.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100vh - 160px)" }}>
      {other && (
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 -mx-4 -mt-4 mb-4">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg font-bold ${other.role === "owner" ? "bg-blue-100 text-blue-700" : "bg-teal-100 text-teal-700"}`}>{other.name?.[0]}</div>
          <div><p className="font-semibold text-gray-900">{other.name}</p><p className="text-xs text-gray-400">{other.role === "owner" ? "Property Owner" : "Tenant"} • {other.locality}</p></div>
        </div>
      )}
      <div className="flex-1 space-y-3 overflow-y-auto pb-4">
        {msgs.length === 0 && <div className="text-center py-12 text-gray-400"><MessageCircle size={36} className="mx-auto mb-2 opacity-40" /><p className="text-sm font-medium">No messages yet</p><p className="text-xs mt-1">Send a message to start</p></div>}
        {msgs.map(msg => {
          const isMe = msg.from_user_id === currentUser.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm ${isMe ? "bg-blue-600 text-white rounded-br-sm" : "bg-gray-100 text-gray-800 rounded-bl-sm"}`}>
                <p>{msg.text}</p>
                <p className={`text-xs mt-1 ${isMe ? "text-blue-200" : "text-gray-400"}`}>{new Date(msg.created_at).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 pt-3 border-t border-gray-100 sticky bottom-0 bg-gray-50 pb-2">
        <input type="text" value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()}
          placeholder="Type a message..." className="flex-1 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
        <button onClick={handleSend} disabled={!text.trim() || sending} className="bg-blue-600 disabled:bg-gray-200 text-white px-4 rounded-2xl transition">
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── Messages List ─────────────────────────────────────────────────────────────

function MessagesList({ token, onNavigate }) {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/messages/threads", {}, token).then(setThreads).catch(console.error).finally(() => setLoading(false));
  }, [token]);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Messages</h2>
      {threads.length === 0 && <div className="text-center py-16 text-gray-400"><MessageCircle size={40} className="mx-auto mb-3 opacity-40" /><p className="font-medium">No messages yet</p></div>}
      {threads.map(t => (
        <button key={t.partner_id} onClick={() => onNavigate("chat", { withUserId: t.partner_id })}
          className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-left hover:shadow-md transition flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0 ${t.partner_role === "owner" ? "bg-blue-100 text-blue-700" : "bg-teal-100 text-teal-700"}`}>{t.partner_name?.[0]}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-900">{t.partner_name}</span>
              <span className="text-xs text-gray-400">{t.last_time ? new Date(t.last_time).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}) : ""}</span>
            </div>
            <p className="text-sm text-gray-500 truncate mt-0.5">{t.last_message}</p>
          </div>
          {t.unread_count > 0 && <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold flex-shrink-0">{t.unread_count}</span>}
          <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
        </button>
      ))}
    </div>
  );
}

// ─── Notifications ─────────────────────────────────────────────────────────────

function NotificationsScreen({ token }) {
  const [notifs, setNotifs]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/notifications", {}, token).then(setNotifs).catch(console.error).finally(() => setLoading(false));
  }, [token]);

  const markAllRead = async () => {
    await apiFetch("/notifications/read-all", { method: "PATCH" }, token).catch(() => {});
    setNotifs(n => n.map(x => ({ ...x, read: true })));
  };

  if (loading) return <Spinner />;
  const typeIcons = { application:"📋", message:"💬", review:"⭐", system:"🔔" };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
        {notifs.some(n => !n.read) && <button onClick={markAllRead} className="text-blue-600 text-sm font-medium">Mark all read</button>}
      </div>
      {notifs.length === 0 && <div className="text-center py-16 text-gray-400"><BellOff size={40} className="mx-auto mb-3 opacity-40" /><p className="font-medium">No notifications</p></div>}
      {notifs.map(n => (
        <div key={n.id} className={`rounded-2xl p-4 border ${n.read ? "bg-white border-gray-100" : "bg-blue-50 border-blue-100"}`}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">{typeIcons[n.type] || "🔔"}</span>
            <div className="flex-1">
              <p className={`text-sm ${n.read ? "text-gray-600" : "text-gray-900 font-medium"}`}>{n.text}</p>
              <p className="text-xs text-gray-400 mt-1">{n.time_ago}</p>
            </div>
            {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Profile Page ──────────────────────────────────────────────────────────────

function ProfilePage({ userId, token }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    apiFetch(`/users/${userId}`, {}, token).then(setUser).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [userId, token]);

  if (loading) return <Spinner />;
  if (error || !user) return <ErrMsg message={error || "User not found"} />;

  const isOwner = user.role === "owner";
  const reviews = isOwner ? (user.reviews || []) : (user.reports || []);
  const avgRating = reviews.length > 0 ? (reviews.reduce((s,r) => s + r.overall, 0) / reviews.length).toFixed(1) : "—";
  const categories = isOwner
    ? { behaviour:"Behaviour", building_condition:"Building Condition", roads:"Roads & Access", security:"Security", cleanliness:"Cleanliness" }
    : { payment_timeliness:"Payment Timeliness", nature:"Nature", cleanliness:"Cleanliness", cooperation:"Cooperation" };
  const catAvg = cat => {
    const vals = reviews.map(r => r[cat]).filter(v => v != null);
    return vals.length > 0 ? (vals.reduce((s,v) => s+v, 0) / vals.length).toFixed(1) : "0";
  };

  return (
    <div className="space-y-5">
      <div className={`rounded-2xl p-5 text-white ${isOwner ? "bg-gradient-to-r from-blue-600 to-indigo-600" : "bg-gradient-to-r from-teal-600 to-green-500"}`}>
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-extrabold">{user.name?.[0]}</div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <Badge label={isOwner ? "Property Owner" : "Tenant"} color={isOwner ? "blue" : "green"} />
            <div className="flex items-center gap-1 mt-2 text-sm opacity-80"><MapPin size={13} />{user.locality}</div>
          </div>
          <div className="text-center bg-white/20 rounded-2xl px-4 py-3">
            <div className="text-3xl font-extrabold">{avgRating}</div>
            {avgRating !== "—" && <Stars value={parseFloat(avgRating)} size="lg" />}
            <div className="text-xs opacity-70 mt-1">{reviews.length} reviews</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4 text-center text-xs">
          {[["📅","Since",user.joined_date],["📱","Mobile",`+91 ${user.phone}`],["🆔","Aadhaar",user.aadhaar_masked]].map(([icon,label,val]) => (
            <div key={label} className="bg-white/10 rounded-xl py-2 px-1"><div>{icon}</div><div className="opacity-70">{label}</div><div className="font-medium truncate">{val}</div></div>
          ))}
        </div>
        {user.verified && <div className="flex items-center gap-2 mt-3 bg-green-500/20 rounded-xl px-3 py-2 text-sm"><CheckCircle size={15} /> Aadhaar verified profile</div>}
      </div>

      {user.about && <div className="bg-white rounded-2xl border border-gray-100 p-4"><h3 className="font-semibold text-gray-800 mb-2">About</h3><p className="text-gray-600 text-sm leading-relaxed">{user.about}</p></div>}

      {reviews.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-800 mb-4">{isOwner ? "Owner Ratings" : "Conduct Ratings"}</h3>
          <div className="space-y-3">{Object.entries(categories).map(([cat,label]) => <RatingBar key={cat} label={label} value={parseFloat(catAvg(cat))} />)}</div>
        </div>
      )}

      {isOwner && user.properties?.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Properties ({user.properties.length})</h3>
          {user.properties.map(p => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-3 mb-2 flex items-center justify-between">
              <div><p className="text-sm font-medium text-gray-800">{p.title}</p><p className="text-xs text-gray-400">{p.locality} • ₹{p.rent?.toLocaleString()}/mo</p></div>
              <Badge label={p.available ? "Available" : "Occupied"} color={p.available ? "green" : "amber"} />
            </div>
          ))}
        </div>
      )}

      <div>
        <h3 className="font-semibold text-gray-800 mb-3">{isOwner ? "Reviews by Tenants" : "Conduct Reports"}{reviews.length > 0 && <span className="text-gray-400 font-normal text-sm ml-2">({reviews.length})</span>}</h3>
        {reviews.length === 0 && <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-2xl"><Star size={28} className="mx-auto mb-2 opacity-30" /><p className="text-sm">No reviews yet</p></div>}
        {reviews.map(r => (
          <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-4 mb-3">
            <div className="flex items-start justify-between mb-2">
              <div><span className="font-medium text-sm text-gray-700">{isOwner ? r.tenant_name : r.owner_name}</span><p className="text-xs text-gray-400">{r.date}</p></div>
              <Stars value={r.overall} />
            </div>
            <p className="text-gray-600 text-sm italic">"{r.comment}"</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Write Review ──────────────────────────────────────────────────────────────

function WriteReview({ currentUser, token, prefill, onNavigate }) {
  const isOwnerWriting = currentUser.role === "owner";
  const [targetId, setTargetId] = useState(prefill?.tenantId || prefill?.ownerId || "");
  const [targetName, setTargetName] = useState("");
  const [ratings, setRatings]   = useState({});
  const [comment, setComment]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]       = useState("");

  const [lookupPhone, setLookupPhone] = useState("");
  const [looking, setLooking]         = useState(false);

  const categories = isOwnerWriting
    ? { payment_timeliness:"Payment Timeliness", nature:"Nature & Behaviour", cleanliness:"Cleanliness", cooperation:"Cooperation" }
    : { behaviour:"Owner Behaviour", building_condition:"Building Condition", roads:"Roads & Access", security:"Security", cleanliness:"Cleanliness" };

  const lookupTarget = async () => {
    if (!lookupPhone || lookupPhone.length !== 10) return;
    setLooking(true);
    try {
      const user = await apiFetch(`/users/lookup/phone/${lookupPhone}`, {}, token);
      const expectedRole = isOwnerWriting ? "tenant" : "owner";
      if (user.role !== expectedRole) { setError(`That number belongs to an ${user.role}, not a ${expectedRole}`); return; }
      setTargetId(user.id); setTargetName(user.name); setError("");
    } catch {
      setError("User not found with this phone number");
    } finally {
      setLooking(false);
    }
  };

  const setRating = (cat, val) => setRatings(r => ({ ...r, [cat]: val }));
  const allRated  = Object.keys(categories).every(c => ratings[c]);

  const handleSubmit = async () => {
    if (!targetId || !allRated || !comment) return;
    setLoading(true); setError("");
    try {
      const endpoint = isOwnerWriting ? "/reviews/tenant-reports" : "/reviews/owner-reviews";
      const body = isOwnerWriting
        ? { tenant_id: targetId, ...ratings, comment }
        : { owner_id:  targetId, ...ratings, comment };
      await apiFetch(endpoint, { method: "POST", body: JSON.stringify(body) }, token);
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <CheckCircle size={56} className="text-green-500 mb-4" />
      <h3 className="text-xl font-bold text-gray-900">Review Submitted!</h3>
      <p className="text-gray-500 text-sm mt-2 max-w-xs">Your review helps build trust in the rental community.</p>
      <button onClick={() => onNavigate("dashboard")} className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold">Back to Dashboard</button>
    </div>
  );

  return (
    <div className="space-y-5">
      <div><h2 className="text-xl font-bold text-gray-900">{isOwnerWriting ? "Write Tenant Report" : "Review Owner"}</h2></div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Find {isOwnerWriting ? "Tenant" : "Owner"} by Phone</label>
        <div className="flex gap-2">
          <input type="tel" maxLength={10} value={lookupPhone} onChange={e => setLookupPhone(e.target.value.replace(/\D/,""))} placeholder="10-digit mobile"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={lookupTarget} disabled={looking} className="bg-blue-600 text-white px-4 rounded-xl text-sm font-medium">
            {looking ? "…" : "Find"}
          </button>
        </div>
        {targetName && <p className="text-green-600 text-sm mt-1 font-medium">✓ Found: {targetName}</p>}
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>

      {targetId && (
        <>
          <div className="space-y-4">
            {Object.entries(categories).map(([cat, label]) => (
              <div key={cat}>
                <div className="flex items-center justify-between mb-1"><label className="text-sm font-medium text-gray-700">{label}</label>{ratings[cat] && <span className="text-amber-500 font-bold text-sm">{ratings[cat]}/5</span>}</div>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setRating(cat, n)} className={`flex-1 py-2 rounded-xl border text-sm font-bold transition ${ratings[cat] >= n ? "bg-amber-400 border-amber-400 text-white" : "border-gray-200 text-gray-400"}`}>{n}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
            <textarea value={comment} onChange={e => setComment(e.target.value)} rows={4} placeholder="Describe your experience…" className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <button onClick={handleSubmit} disabled={!allRated || !comment || loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition">
            {loading ? "Submitting…" : "Submit Review"}
          </button>
        </>
      )}
    </div>
  );
}

// ─── App Shell ─────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen]   = useState("landing");
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken]     = useState(() => localStorage.getItem("fmi_token") || null);
  const [navStack, setNavStack] = useState([]);
  const [extras, setExtras]   = useState({});
  const [savedProperties, setSavedProperties] = useState([]);
  const [appReady, setAppReady] = useState(false);

  // Restore session on mount
  useEffect(() => {
    const saved = localStorage.getItem("fmi_token");
    if (saved) {
      apiFetch("/auth/me", {}, saved)
        .then(user => { setCurrentUser(user); setToken(saved); setScreen("dashboard"); })
        .catch(() => { localStorage.removeItem("fmi_token"); })
        .finally(() => setAppReady(true));
    } else {
      setAppReady(true);
    }
  }, []);

  const navigate = (target, extra) => {
    setNavStack(s => [...s, screen]);
    setExtras(e => ({ ...e, [target]: extra }));
    setScreen(target);
  };

  const goBack = () => {
    const prev = navStack[navStack.length - 1] || "dashboard";
    setNavStack(s => s.slice(0, -1));
    setScreen(prev);
  };

  const handleLogin  = (role) => { setScreen("login"); setExtras(e => ({ ...e, loginRole: role })); };

  const handleLoginSuccess = (user, tok) => {
    setCurrentUser(user); setToken(tok);
    localStorage.setItem("fmi_token", tok);
    setNavStack([]); setScreen("dashboard");
  };

  const handleLogout = () => {
    setCurrentUser(null); setToken(null);
    localStorage.removeItem("fmi_token");
    setScreen("landing"); setNavStack([]);
  };

  const toggleSave = (id) => setSavedProperties(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  if (!appReady) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div>;

  const renderScreen = () => {
    if (screen === "landing") return <LandingPage onLogin={handleLogin} />;
    if (screen === "login")   return <LoginPage preRole={extras.loginRole} onSuccess={handleLoginSuccess} />;
    if (!currentUser || !token) return <LandingPage onLogin={handleLogin} />;

    const isOwner = currentUser.role === "owner";
    const common  = { token, onNavigate: navigate };

    if (screen === "dashboard") return isOwner
      ? <OwnerDashboard user={currentUser} {...common} />
      : <TenantDashboard user={currentUser} savedProperties={savedProperties} {...common} />;

    if (screen === "owner-properties")  return <OwnerProperties {...common} />;
    if (screen === "add-property")      return <AddPropertyForm {...common} />;
    if (screen === "owner-applications")return <OwnerApplications {...common} />;
    if (screen === "active-tenants")    return <ActiveTenants {...common} />;
    if (screen === "owner-lookup")      return <UserLookup lookingFor="tenant" {...common} />;
    if (screen === "tenant-search")     return <FlatSearch savedProperties={savedProperties} onToggleSave={toggleSave} {...common} />;
    if (screen === "saved-flats")       return <SavedFlats savedProperties={savedProperties} onToggleSave={toggleSave} {...common} />;
    if (screen === "my-applications")   return <MyApplications {...common} />;
    if (screen === "apply-flat")        return <ApplyFlat propertyId={extras["apply-flat"]} currentUser={currentUser} {...common} />;
    if (screen === "tenant-lookup")     return <UserLookup lookingFor="owner" {...common} />;
    if (screen === "write-review" || screen === "write-report") return <WriteReview currentUser={currentUser} prefill={extras[screen]} {...common} />;
    if (screen === "property-detail")   return <PropertyDetail propertyId={extras["property-detail"]} currentUser={currentUser} savedProperties={savedProperties} onToggleSave={toggleSave} {...common} />;
    if (screen === "profile" || screen === "my-profile") {
      const uid = screen === "my-profile" ? currentUser.id : extras["profile"];
      return <ProfilePage userId={uid} token={token} />;
    }
    if (screen === "chat")          return <ChatScreen currentUser={currentUser} withUserId={extras["chat"]?.withUserId} token={token} />;
    if (screen === "messages")      return <MessagesList {...common} />;
    if (screen === "notifications") return <NotificationsScreen token={token} />;
    return <div className="text-center py-20 text-gray-400">Screen not found</div>;
  };

  const showShell = currentUser && !["landing","login"].includes(screen);

  const ownerNav  = [
    { icon: Home,          label: "Home",       s: "dashboard" },
    { icon: Building2,     label: "Properties", s: "owner-properties" },
    { icon: MessageCircle, label: "Messages",   s: "messages" },
    { icon: Users,         label: "Tenants",    s: "active-tenants" },
    { icon: User,          label: "Profile",    s: "my-profile" },
  ];
  const tenantNav = [
    { icon: Home,          label: "Home",     s: "dashboard" },
    { icon: Search,        label: "Search",   s: "tenant-search" },
    { icon: Heart,         label: "Saved",    s: "saved-flats" },
    { icon: MessageCircle, label: "Messages", s: "messages" },
    { icon: User,          label: "Profile",  s: "my-profile" },
  ];
  const navItems = currentUser?.role === "owner" ? ownerNav : tenantNav;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {!showShell && renderScreen()}
      {showShell && (
        <div className="max-w-md mx-auto flex flex-col min-h-screen">
          <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {navStack.length > 0 && <button onClick={goBack} className="mr-1 text-gray-500 hover:text-gray-800"><ArrowLeft size={20} /></button>}
              <Building2 size={20} className="text-blue-600" />
              <span className="font-bold text-gray-800">FlatMate <span className="text-blue-600">India</span></span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("notifications")} className="relative text-gray-400 hover:text-gray-700">
                <Bell size={20} />
              </button>
              <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600"><LogOut size={18} /></button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 pb-24">{renderScreen()}</div>

          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 flex z-10">
            {navItems.map(({ icon: Icon, label, s }) => (
              <button key={s} onClick={() => { setNavStack([]); setScreen(s); }}
                className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition ${screen === s ? "text-blue-600" : "text-gray-400"}`}>
                <Icon size={20} strokeWidth={screen === s ? 2.5 : 1.8} />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
