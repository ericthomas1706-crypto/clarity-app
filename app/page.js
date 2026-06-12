'use client'
import { useState, useRef, useEffect } from "react";

const SUPABASE_URL = "https://aywhqcqxvrtsdgwbzbzf.supabase.co";
const SUPABASE_KEY = "sb_publishable_wbyckKwJ6Srk3O_VZsxZug_HXGHjyG-";

async function dbQuery(method, table, body = null, filter = "") {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${filter}`, {
      method,
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: body ? JSON.stringify(body) : undefined
    });
    return res.json();
  } catch(e) { return null; }
}

function playWelcomeSound() {
  try {
    const c = new (window.AudioContext || window.webkitAudioContext)();
    [130, 196, 261].forEach((f, i) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'sine'; o.frequency.value = f;
      o.connect(g); g.connect(c.destination);
      const t = c.currentTime + i * 0.15;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.08, t + 0.1);
      g.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
      o.start(t); o.stop(t + 1.0);
    });
  } catch(e) {}
}

function ClarityLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{flexShrink:0}}>
      <rect width="100" height="100" rx="22" fill="#0D1117"/>
      <circle cx="50" cy="50" r="30" fill="#091628"/>
      <circle cx="50" cy="50" r="19" fill="#0d2040"/>
      <circle cx="50" cy="50" r="11" fill="#2D7DD2"/>
      <circle cx="50" cy="50" r="5.5" fill="#5BB5F5"/>
      <circle cx="50" cy="50" r="2" fill="white"/>
      <line x1="50" y1="14" x2="50" y2="22" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" opacity="0.7"/>
      <line x1="50" y1="86" x2="50" y2="78" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" opacity="0.7"/>
      <line x1="14" y1="50" x2="22" y2="50" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" opacity="0.7"/>
      <line x1="86" y1="50" x2="78" y2="50" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" opacity="0.7"/>
      <line x1="24" y1="24" x2="30" y2="30" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
      <line x1="76" y1="24" x2="70" y2="30" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
      <line x1="24" y1="76" x2="30" y2="70" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
      <line x1="76" y1="76" x2="70" y2="70" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
    </svg>
  );
}

const getSystemPrompt = (name, project, why) => `Tu es Clarity, un compagnon IA bienveillant pour les entrepreneurs TDAH.
Prénom: ${name}. Projet: ${project}. Pourquoi: ${why}.
Parle comme un ami, phrases courtes, une question à la fois. Célèbre les victoires. Détecte les dérives.
LANGUE: Réponds dans la langue de l'utilisateur. MAX 3 phrases.`;

export default function ClarityApp() {
  const [screen, setScreen] = useState("landing");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userId, setUserId] = useState(null);
  const [name, setName] = useState("");
  const [project, setProject] = useState("");
  const [why, setWhy] = useState("");
  const [plan, setPlan] = useState("free");
  const [messageCount, setMessageCount] = useState(0);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [currentInput, setCurrentInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [streak, setStreak] = useState(1);
  const [todayTask, setTodayTask] = useState("");
  const [todayDone, setTodayDone] = useState(false);
  const [taskInput, setTaskInput] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    playWelcomeSound();
    try {
      const rememberedEmail = document.cookie.split('; ').find(r => r.startsWith('clarity_email='));
      if (rememberedEmail) { setEmail(decodeURIComponent(rememberedEmail.split('=')[1])); setRememberMe(true); }
    } catch(e) {}
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const loadStreak = () => {
    try {
      const today = new Date().toDateString();
      const lastVisit = localStorage.getItem('c_last');
      const saved = parseInt(localStorage.getItem('c_streak') || '1');
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const newStreak = lastVisit === yesterday ? saved + 1 : lastVisit === today ? saved : 1;
      localStorage.setItem('c_last', today);
      localStorage.setItem('c_streak', String(newStreak));
      setStreak(newStreak);
      const taskDate = localStorage.getItem('c_task_date') || '';
      if (taskDate === today) {
        setTodayTask(localStorage.getItem('c_task') || '');
        setTodayDone(localStorage.getItem('c_task_done') === 'true');
      }
    } catch(e) {}
  };

  const handleSignup = async () => {
    if (!email.includes("@") || password.length < 6) { setAuthError("Email invalide ou mot de passe trop court"); return; }
    setAuthError("");
    const existing = await dbQuery("GET", "users", null, `?email=eq.${encodeURIComponent(email)}&select=id`);
    if (existing && existing.length > 0) { setAuthError("Cet email existe déjà. Connecte-toi !"); return; }
    const result = await dbQuery("POST", "users", { email, password, message_count: 0, plan: "free" });
    if (result && result[0]) {
      setUserId(result[0].id);
      saveEmail();
      setScreen("onboarding");
    } else { setAuthError("Erreur. Réessaie."); }
  };

  const handleLogin = async () => {
    if (!email.includes("@") || password.length < 6) { setAuthError("Email invalide ou mot de passe trop court"); return; }
    setAuthError("");
    const result = await dbQuery("GET", "users", null, `?email=eq.${encodeURIComponent(email)}&password=eq.${encodeURIComponent(password)}&select=id,name,project,why,message_count,plan`);
    if (result && result.length > 0) {
      const u = result[0];
      setUserId(u.id);
      setMessageCount(u.message_count || 0);
      setPlan(u.plan || "free");
      saveEmail();
      loadStreak();
      if (u.name && u.project && u.why) {
        setName(u.name); setProject(u.project); setWhy(u.why);
        const msgs = await dbQuery("GET", "messages", null, `?user_id=eq.${u.id}&order=created_at.asc&limit=30`);
        if (msgs && msgs.length > 0) setMessages(msgs.map(m => ({ role: m.role, content: m.content })));
        else setMessages([{ role: "assistant", content: `Bon retour ${u.name} ! 💙` }]);
        setScreen("dashboard");
      } else {
        setScreen("onboarding");
      }
    } else { setAuthError("Email ou mot de passe incorrect."); }
  };

  const saveEmail = () => {
    if (rememberMe) {
      try { const d = new Date(); d.setFullYear(d.getFullYear()+1); document.cookie = `clarity_email=${encodeURIComponent(email)}; expires=${d.toUTCString()}; path=/`; } catch(e) {}
    }
  };

  const handleOnboardingNext = async () => {
    if (!currentInput.trim()) return;
    if (onboardingStep === 0) setName(currentInput.trim());
    if (onboardingStep === 1) setProject(currentInput.trim());
    if (onboardingStep === 2) {
      const fw = currentInput.trim(); setWhy(fw);
      const fn = onboardingStep === 0 ? currentInput.trim() : name;
      const fp = onboardingStep === 1 ? currentInput.trim() : project;
      if (userId) await dbQuery("PATCH", "users", { name: fn, project: fp, why: fw }, `?id=eq.${userId}`);
      loadStreak();
      setLoading(true);
      try {
        const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [{ role: "user", content: `Je m'appelle ${fn}, projet: ${fp}, pourquoi: ${fw}` }], system: getSystemPrompt(fn, fp, fw) }) });
        const data = await res.json();
        setMessages([{ role: "assistant", content: data.content }]);
      } catch { setMessages([{ role: "assistant", content: `Bienvenue ${fn} ! 💙` }]); }
      setLoading(false);
      setScreen("dashboard");
      return;
    }
    setOnboardingStep(onboardingStep + 1);
    setCurrentInput("");
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    if (plan === "free" && messageCount >= 10) { setScreen("upgrade"); return; }
    const userMsg = input.trim(); setInput("");
    const newMessages = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages); setLoading(true);
    const newCount = messageCount + 1; setMessageCount(newCount);
    if (userId) await dbQuery("PATCH", "users", { message_count: newCount }, `?id=eq.${userId}`);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages.map(m => ({ role: m.role, content: m.content })), system: getSystemPrompt(name, project, why) }) });
      const data = await res.json();
      const reply = data.content;
      setMessages([...newMessages, { role: "assistant", content: reply }]);
      if (userId) {
        await dbQuery("POST", "messages", { user_id: userId, role: "user", content: userMsg });
        await dbQuery("POST", "messages", { user_id: userId, role: "assistant", content: reply });
      }
    } catch { setMessages([...newMessages, { role: "assistant", content: "Petite erreur 🔄" }]); }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (screen === "chat") sendMessage();
      else if (screen === "onboarding") handleOnboardingNext();
      else if (screen === "signup") handleSignup();
      else if (screen === "login") handleLogin();
    }
  };

  const s = {
    wrap: { background: "#060810", minHeight: "100vh", fontFamily: "system-ui,sans-serif", color: "white", maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column" },
    header: { padding: "14px 20px", background: "rgba(6,8,16,0.95)", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 10, position: "sticky", top: 0, zIndex: 10 },
    btn: { background: "linear-gradient(135deg,#2D7DD2,#5B9FE8)", color: "white", border: "none", padding: "16px", borderRadius: 100, fontSize: 16, fontWeight: 600, cursor: "pointer", width: "100%", display: "block" },
    btnGhost: { background: "transparent", color: "rgba(255,255,255,0.4)", border: "none", padding: "14px", borderRadius: 100, fontSize: 14, cursor: "pointer", width: "100%", display: "block" },
    btnOutline: { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.1)", padding: "14px", borderRadius: 100, fontSize: 15, cursor: "pointer", width: "100%" },
    input: { background: "#111827", border: "1px solid rgba(45,125,210,0.3)", borderRadius: 12, padding: "14px 16px", fontSize: 15, color: "white", fontFamily: "system-ui,sans-serif", outline: "none", width: "100%", boxSizing: "border-box" },
  };

  const onboardingQuestions = [
    { q: "C'est quoi ton prénom ?", hint: "Juste ton prénom 😊" },
    { q: "C'est quoi ton projet en ce moment ?", hint: "Même flou, dis-moi ce qui t'allume." },
    { q: "Pourquoi tu veux vraiment bâtir ça ?", hint: "La vraie réponse du fond de toi." },
  ];

  // ===== LANDING =====
  if (screen === "landing") return (
    <div style={{ ...s.wrap, overflowY: "auto" }}>
      <div style={{ padding: "64px 28px 48px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 500, height: 500, background: "radial-gradient(circle,rgba(45,125,210,0.1) 0%,transparent 65%)", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />
        <div style={{ marginBottom: 24, position: "relative" }}><ClarityLogo size={72} /></div>
        <h1 style={{ fontSize: 20, fontWeight: 400, color: "rgba(255,255,255,0.5)", marginBottom: 20, lineHeight: 1.55, maxWidth: 300, margin: "0 auto 20px", position: "relative" }}>
          T'as <strong style={{ color: "white" }}>plein d'idées</strong> mais tu finis<br />jamais ce que tu commences ?
        </h1>
        <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: -2, marginBottom: 8, position: "relative" }}>Clarity<span style={{ color: "#2D7DD2" }}>.</span></div>
        <div style={{ fontSize: 11, color: "#38BDF8", letterSpacing: 3, marginBottom: 36, position: "relative" }}>L'IA POUR LES ENTREPRENEURS TDAH</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, position: "relative" }}>
          <button style={s.btn} onClick={() => { playWelcomeSound(); setScreen("signup"); }}>Oui, c'est moi — essayer →</button>
          <button style={s.btnGhost} onClick={() => setScreen("login")}>J'ai déjà un compte</button>
        </div>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 14, position: "relative" }}>Gratuit · 10 messages · Aucune carte requise</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        {[["404M","adultes TDAH\ndans le monde"],["29%","des entrepreneurs\nont le TDAH"],["0","outil fait\npour eux — jusqu'ici"]].map(([n,l],i) => (
          <div key={i} style={{ padding: "24px 12px", textAlign: "center", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#5B9FE8", lineHeight: 1, marginBottom: 6 }}>{n}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.5, whiteSpace: "pre-line" }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: "48px 28px", background: "#0a0f1a" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.3)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 20, textAlign: "center" }}>Ça te parle ?</div>
        {[["🌀","Tu changes d'idée avant même de finir"],["🔥","T'as commencé 10 projets, fini zéro"],["😮‍💨","Tu sais que t'as du potentiel mais tu sais pas quoi en faire"],["💭","Les autres outils te donnent encore plus à gérer"]].map(([emoji,text],i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "14px 16px", marginBottom: 10 }}>
            <span style={{ fontSize: 20 }}>{emoji}</span>
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", flex: 1 }}>{text}</span>
            <span style={{ fontSize: 12, color: "#38BDF8", fontWeight: 600, opacity: 0.7 }}>C'est moi</span>
          </div>
        ))}
      </div>
      <div style={{ padding: "56px 28px", background: "#060810" }}>
        <div style={{ fontSize: 11, color: "#5B9FE8", letterSpacing: "2.5px", textTransform: "uppercase", marginBottom: 12 }}>Qui a créé Clarity ?</div>
        <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: -1, lineHeight: 1.15, marginBottom: 28 }}>Fait par quelqu'un<br/>qui a vécu ça.</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28, background: "rgba(45,125,210,0.08)", border: "1px solid rgba(45,125,210,0.15)", borderRadius: 20, padding: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#2D7DD2,#38BDF8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>✈️</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17 }}>Eric Thomas</div>
            <div style={{ fontSize: 12, color: "#38BDF8", letterSpacing: 1, marginTop: 2 }}>FONDATEUR · TDAH · 30+ PAYS</div>
          </div>
        </div>
        {[["🌍","J'ai voyagé dans plus de 30 pays à la recherche de ma passion."],["💼","J'ai lancé 3 entreprises — et abandonné les 3. Pas par paresse."],["😔","J'ai cherché un outil qui me comprend vraiment. Pas la médication."],["💙","Clarity, c'est ce que j'aurais voulu avoir. Je l'ai bâti pour toi."]].map(([icon,text],i) => (
          <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 16 }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, margin: 0, fontWeight: 300 }}>{text}</p>
          </div>
        ))}
      </div>
      <div style={{ padding: "64px 28px", background: "#060810", textAlign: "center" }}>
        <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: -1, lineHeight: 1.15, marginBottom: 12 }}>T'as assez attendu.<br/>Commence maintenant.</div>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", marginBottom: 32, fontWeight: 300 }}>Gratuit. 2 minutes. Aucune carte requise.</p>
        <button style={s.btn} onClick={() => setScreen("signup")}>Oui, c'est moi — essayer →</button>
        <div style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
          <span>Clarity.</span><span>Fait avec 💙 pour les TDAH</span><span>© 2026</span>
        </div>
      </div>
    </div>
  );

  // ===== AUTH =====
  if (screen === "signup" || screen === "login") return (
    <div style={{ ...s.wrap, justifyContent: "center", padding: "40px 24px" }}>
      <div style={{ marginBottom: 32, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <ClarityLogo size={56} />
        <div style={{ fontSize: 26, fontWeight: 900 }}>Clarity<span style={{ color: "#2D7DD2" }}>.</span></div>
        <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 15 }}>{screen === "signup" ? "Crée ton compte gratuit" : "Bon retour 👋"}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input style={s.input} type="email" placeholder="Ton email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={handleKey} />
        <input style={s.input} type="password" placeholder="Mot de passe (min 6 caractères)" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKey} />
        {authError && <div style={{ color: "#f87171", fontSize: 13, textAlign: "center" }}>{authError}</div>}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input type="checkbox" id="rem" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} style={{ width: 18, height: 18, accentColor: "#2D7DD2", cursor: "pointer" }} />
          <label htmlFor="rem" style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>Se souvenir de mon email</label>
        </div>
        <button style={{ ...s.btn, marginTop: 8 }} onClick={screen === "signup" ? handleSignup : handleLogin}>
          {screen === "signup" ? "Créer mon compte →" : "Se connecter →"}
        </button>
        <button style={s.btnOutline} onClick={() => setScreen(screen === "signup" ? "login" : "signup")}>
          {screen === "signup" ? "J'ai déjà un compte" : "Créer un compte"}
        </button>
        <button style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 13, cursor: "pointer", marginTop: 8 }} onClick={() => setScreen("landing")}>← Retour</button>
      </div>
    </div>
  );

  // ===== ONBOARDING =====
  if (screen === "onboarding") return (
    <div style={s.wrap}>
      <div style={s.header}><ClarityLogo size={36} /><div style={{ fontWeight: 900, fontSize: 18 }}>Clarity<span style={{ color: "#2D7DD2" }}>.</span></div></div>
      <div style={{ flex: 1, padding: "40px 24px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 36 }}>
          {[0, 1, 2].map(i => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= onboardingStep ? "linear-gradient(90deg,#2D7DD2,#38BDF8)" : "rgba(255,255,255,0.1)" }} />)}
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 12, letterSpacing: 1 }}>Question {onboardingStep + 1} sur 3</div>
        <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.3, marginBottom: 10 }}>{onboardingQuestions[onboardingStep].q}</div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 28 }}>{onboardingQuestions[onboardingStep].hint}</div>
        <textarea autoFocus value={currentInput} onChange={e => setCurrentInput(e.target.value)} onKeyDown={handleKey} placeholder="Écris ta réponse..." rows={3}
          style={{ ...s.input, resize: "none", marginBottom: 16, lineHeight: 1.6 }} />
        <button style={{ ...s.btn, opacity: currentInput.trim() ? 1 : 0.4 }} onClick={handleOnboardingNext} disabled={!currentInput.trim()}>
          {onboardingStep < 2 ? "Continuer →" : "Commencer avec Clarity 💙"}
        </button>
      </div>
    </div>
  );

  // ===== DASHBOARD =====
  if (screen === "dashboard") return (
    <div style={{ ...s.wrap, overflowY: "auto" }}>
      <div style={s.header}>
        <ClarityLogo size={36} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 900, fontSize: 16 }}>Clarity<span style={{ color: "#2D7DD2" }}>.</span></div>
          <div style={{ fontSize: 11, color: "#38BDF8" }}>Bonjour {name} 👋</div>
        </div>
        <button onClick={() => setScreen("chat")} style={{ background: "linear-gradient(135deg,#2D7DD2,#5B9FE8)", border: "none", color: "white", padding: "8px 18px", borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Chat →</button>
      </div>
      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Streak */}
        <div style={{ background: "linear-gradient(135deg,#0d1f3c,#091529)", border: "1px solid rgba(45,125,210,0.3)", borderRadius: 20, padding: "20px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 52 }}>{streak >= 7 ? "🔥" : streak >= 3 ? "⚡" : "✨"}</div>
          <div>
            <div style={{ fontSize: 30, fontWeight: 900, color: streak >= 7 ? "#f97316" : "#38BDF8" }}>{streak} jour{streak > 1 ? "s" : ""} de suite</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{streak >= 7 ? "Tu es en feu ! 🔥" : streak >= 3 ? "Belle série, continue !" : "Chaque jour compte."}</div>
          </div>
        </div>

        {/* Projet */}
        <div style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "20px" }}>
          <div style={{ fontSize: 11, color: "#5B9FE8", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>🎯 Ton projet</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{project}</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontStyle: "italic" }}>"{why && why.length > 80 ? why.slice(0, 80) + "..." : why}"</div>
        </div>

        {/* Micro-victoire */}
        <div style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "20px" }}>
          <div style={{ fontSize: 11, color: "#5B9FE8", letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>⚡ Micro-victoire du jour</div>
          {!todayTask ? (
            <div>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", marginBottom: 12 }}>C'est quoi ta seule chose aujourd'hui ?</p>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={taskInput} onChange={e => setTaskInput(e.target.value)}
                  onKeyDown={e => { if(e.key==="Enter" && taskInput.trim()) { setTodayTask(taskInput.trim()); try{localStorage.setItem('c_task',taskInput.trim());localStorage.setItem('c_task_date',new Date().toDateString());localStorage.setItem('c_task_done','false');}catch(err){} setTaskInput(""); }}}
                  placeholder="Ex: Envoyer le lien à 3 personnes..."
                  style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(45,125,210,0.3)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "white", outline: "none", fontFamily: "system-ui" }} />
                <button onClick={() => { if(taskInput.trim()) { setTodayTask(taskInput.trim()); try{localStorage.setItem('c_task',taskInput.trim());localStorage.setItem('c_task_date',new Date().toDateString());localStorage.setItem('c_task_done','false');}catch(err){} setTaskInput(""); }}}
                  style={{ background: "linear-gradient(135deg,#2D7DD2,#5B9FE8)", border: "none", color: "white", padding: "10px 16px", borderRadius: 10, cursor: "pointer", fontWeight: 600 }}>OK</button>
              </div>
            </div>
          ) : !todayDone ? (
            <div>
              <div style={{ fontSize: 15, marginBottom: 14 }}>{todayTask}</div>
              <button onClick={() => { setTodayDone(true); try{localStorage.setItem('c_task_done','true');}catch(e){} }}
                style={{ ...s.btn, background: "linear-gradient(135deg,#059669,#10b981)" }}>✅ C'est fait !</button>
            </div>
          ) : (
            <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 12, padding: "16px", textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🎉</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#10b981" }}>Micro-victoire accomplie !</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>Ricky est fier de toi. 💙</div>
            </div>
          )}
        </div>

        <button onClick={() => setScreen("chat")} style={{ ...s.btn, padding: "18px", fontSize: 17 }}>
          💙 Parler à Clarity
        </button>
      </div>
    </div>
  );

  // ===== UPGRADE =====
  if (screen === "upgrade") return (
    <div style={{ ...s.wrap, overflowY: "auto", padding: "40px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <ClarityLogo size={56} />
        <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, marginTop: 16 }}>T'as utilisé tes 10 messages gratuits !</div>
        <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 15 }}>Passe au Pro pour continuer.</div>
      </div>
      {[
        { plan: "free", name: "Gratuit", price: "0$", period: "pour toujours", features: ["10 messages / jour", "Onboarding TDAH", "Dashboard personnel"] },
        { plan: "pro", name: "Pro", price: "19$", period: "/ mois", features: ["Messages illimités", "Détecteur de dérive IA", "Voix de Clarity", "Support prioritaire"], featured: true },
        { plan: "business", name: "Business", price: "49$", period: "/ mois", features: ["Tout le plan Pro", "Appel avec Eric (30j)", "Sessions focus guidées", "Rapport hebdomadaire"] },
      ].map((p, i) => (
        <div key={i} style={{ background: p.featured ? "linear-gradient(160deg,#0d1f3c,#091529)" : "#111827", border: p.featured ? "1px solid rgba(45,125,210,0.4)" : "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "24px", marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", letterSpacing: 1, textTransform: "uppercase" }}>{p.name}</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: p.featured ? "#38BDF8" : "white" }}>{p.price}<span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}> {p.period}</span></div>
            </div>
            {p.featured && <div style={{ background: "linear-gradient(135deg,#2D7DD2,#38BDF8)", color: "white", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 100 }}>⚡ Populaire</div>}
          </div>
          <ul style={{ listStyle: "none", marginBottom: 16, padding: 0 }}>
            {p.features.map((f, j) => <li key={j} style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", padding: "5px 0", display: "flex", gap: 8 }}><span style={{ color: "#38BDF8" }}>✓</span>{f}</li>)}
          </ul>
          <button style={{ ...(p.featured ? { ...s.btn } : s.btnOutline) }} onClick={() => { setPlan(p.plan); setMessageCount(0); setScreen("dashboard"); }}>
            {p.plan === "free" ? "Continuer gratuit" : `Choisir ${p.name}`}
          </button>
        </div>
      ))}
    </div>
  );

  // ===== CHAT =====
  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <ClarityLogo size={36} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 900, fontSize: 16 }}>Clarity<span style={{ color: "#2D7DD2" }}>.</span></div>
          <div style={{ fontSize: 11, color: "#38BDF8", display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#38BDF8", boxShadow: "0 0 6px #38BDF8" }} />
            En ligne
          </div>
        </div>
        <button onClick={() => setScreen("dashboard")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 20, cursor: "pointer", padding: "4px 8px" }}>🏠</button>
        {plan === "free" && (
          <div style={{ fontSize: 11, color: messageCount >= 8 ? "#f87171" : "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.05)", padding: "4px 10px", borderRadius: 100, cursor: "pointer" }} onClick={() => setScreen("upgrade")}>
            {10 - messageCount} msg
          </div>
        )}
        <button onClick={() => { try { document.cookie = 'clarity_email=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/'; } catch(e) {} setScreen("landing"); setMessages([]); setName(""); setProject(""); setWhy(""); setUserId(null); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.2)", fontSize: 13, cursor: "pointer", padding: "4px 6px" }}>⎋</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 8 }}>
            {msg.role === "assistant" && <ClarityLogo size={28} />}
            <div style={{ maxWidth: "78%", padding: "12px 16px", borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: msg.role === "user" ? "linear-gradient(135deg,#2D7DD2,#5B9FE8)" : "#111827", border: msg.role === "assistant" ? "1px solid rgba(255,255,255,0.07)" : "none", fontSize: 15, lineHeight: 1.65, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
            <ClarityLogo size={28} />
            <div style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "18px 18px 18px 4px", padding: "14px 18px", display: "flex", gap: 5 }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#5B9FE8", animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0);opacity:0.4}30%{transform:translateY(-6px);opacity:1}}`}</style>

      <div style={{ padding: "12px 16px 24px", background: "rgba(6,8,16,0.95)", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", background: "#111827", border: "1px solid rgba(45,125,210,0.25)", borderRadius: 24, padding: "8px 8px 8px 16px" }}>
          <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} placeholder="Écris ici..." rows={1}
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "white", fontSize: 15, resize: "none", fontFamily: "system-ui,sans-serif", lineHeight: 1.5, maxHeight: 120, overflowY: "auto", padding: "6px 0", caretColor: "#2D7DD2" }} />
          <button onClick={sendMessage} disabled={!input.trim() || loading}
            style={{ width: 38, height: 38, borderRadius: "50%", border: "none", cursor: input.trim() && !loading ? "pointer" : "default", background: input.trim() && !loading ? "linear-gradient(135deg,#2D7DD2,#5B9FE8)" : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M14 8L2 2l3 6-3 6 12-6z" fill={input.trim() && !loading ? "white" : "rgba(255,255,255,0.25)"} /></svg>
          </button>
        </div>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.15)", textAlign: "center", marginTop: 10 }}>Clarity · For ADHD Minds 💙</p>
      </div>
    </div>
  );
}
