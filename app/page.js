'use client'
import { useState, useRef, useEffect } from "react";

const SUPABASE_URL = "https://aywhqcqxvrtsdgwbzbzf.supabase.co";
const SUPABASE_KEY = "sb_publishable_wbyckKwJ6Srk3O_VZsxZug_HXGHjyG-";

async function dbQuery(method, table, body = null, filter = "") {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${filter}`, {
    method,
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": method === "POST" ? "return=representation" : "return=representation"
    },
    body: body ? JSON.stringify(body) : undefined
  });
  return res.json();
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

function playRickyVoice() {
  try {
    const audio = new Audio('/clarity-voice.mp3');
    audio.volume = 0.9;
    audio.play();
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

const getSystemPrompt = (name, project, why) => `Tu es Clarity, un compagnon IA bienveillant conçu exclusivement pour les entrepreneurs TDAH.

INFORMATIONS SUR L'UTILISATEUR :
- Prénom : ${name}
- Projet / Rêve : ${project}  
- Pourquoi profond : ${why}

C'est l'ANCRE de ${name}. Tu t'en souviens toujours.

TON RÔLE :
- Tu es comme un ami proche qui comprend VRAIMENT le TDAH
- Tu aides ${name} à rester connecté à sa vision : "${project}"
- Quand tu détectes qu'il dérive, tu le ramènes doucement
- Tu ne juges JAMAIS

TON STYLE :
- Appelle-le par son prénom parfois
- Parle comme un vrai ami
- Phrases courtes
- UNE seule question à la fois
- Célèbre les petites victoires

LANGUE : Réponds toujours dans la langue de l'utilisateur.
RÉPONSES : Courtes, 2-4 phrases max.`;

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
  const [listening, setListening] = useState(false);
  const [showVoiceReward, setShowVoiceReward] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [streak, setStreak] = useState(0);
  const [todayTask, setTodayTask] = useState("");
  const [todayDone, setTodayDone] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [streak, setStreak] = useState(0);
  const [todayVictory, setTodayVictory] = useState("");
  const [victoryInput, setVictoryInput] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    playWelcomeSound();
    // Auto-login from saved session
    try {
      // Auto-fill remembered email
      const rememberedEmail = document.cookie.split('; ').find(r => r.startsWith('clarity_email='));
      if (rememberedEmail) {
        const em = decodeURIComponent(rememberedEmail.split('=')[1]);
        setEmail(em);
        setRememberMe(true);
      }
    } catch(e) {}
    try {
      const cookieVal = document.cookie.split('; ').find(r => r.startsWith('clarity_session='));
      const saved = cookieVal ? decodeURIComponent(cookieVal.split('=').slice(1).join('=')) : null;
      if (saved) {
        const session = JSON.parse(saved);
        if (session.userId && session.name && session.project && session.why) {
          setUserId(session.userId);
          setName(session.name);
          setProject(session.project);
          setWhy(session.why);
          setPlan(session.plan || 'free');
          setMessageCount(session.messageCount || 0);
          // Load messages
          dbQuery("GET", "messages", null, `?user_id=eq.${session.userId}&order=created_at.asc&limit=50`).then(msgs => {
            if (msgs && msgs.length > 0) {
              setMessages(msgs.map(m => ({ role: m.role, content: m.content })));
            } else {
              setMessages([{ role: "assistant", content: `Bon retour ${session.name} ! 💙 On continue sur "${session.project}" ?` }]);
            }
            setScreen("chat");
          });
        }
      }
    } catch(e) {}
  }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.lang = 'fr-FR'; r.continuous = false; r.interimResults = false;
    r.onstart = () => setListening(true);
    r.onresult = (e) => { setInput(e.results[0][0].transcript); setListening(false); };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    r.start(); recognitionRef.current = r;
  };

  const handleSignup = async () => {
    if (!email.includes("@") || password.length < 6) { setAuthError("Email invalide ou mot de passe trop court"); return; }
    setAuthError("");
    const existing = await dbQuery("GET", "users", null, `?email=eq.${encodeURIComponent(email)}&select=id,name,project,why,message_count,plan`);
    if (existing && existing.length > 0) {
      setAuthError("Cet email existe déjà. Connecte-toi !");
      return;
    }
    const result = await dbQuery("POST", "users", { email, password, message_count: 0, plan: "free" });
    if (result && result[0]) {
      setUserId(result[0].id);
      setScreen("onboarding");
    } else { setAuthError("Erreur création compte. Réessaie."); }
  };

  const handleLogin = async () => {
    if (!email.includes("@") || password.length < 6) { setAuthError("Email invalide ou mot de passe trop court"); return; }
    setAuthError("");
    const result = await dbQuery("GET", "users", null, `?email=eq.${encodeURIComponent(email)}&password=eq.${encodeURIComponent(password)}&select=id,name,project,why,message_count,plan`);
    if (result && result.length > 0) {
      const u = result[0];
      // Save email if remember me
      if (rememberMe) {
        try { const d = new Date(); d.setFullYear(d.getFullYear()+1); document.cookie = `clarity_email=${encodeURIComponent(email)}; expires=${d.toUTCString()}; path=/`; } catch(e) {}
      } else {
        try { document.cookie = 'clarity_email=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/'; } catch(e) {}
      }
      setUserId(u.id);
      setMessageCount(u.message_count || 0);
      setPlan(u.plan || "free");
      if (u.name && u.project && u.why) {
        setName(u.name); setProject(u.project); setWhy(u.why);
        setScreen("chat");
        // Load conversation history
      const msgHistory = await dbQuery("GET", "messages", null, `?user_id=eq.${u.id}&order=created_at.asc&limit=50`);
      if (msgHistory && msgHistory.length > 0) {
        setMessages(msgHistory.map(m => ({ role: m.role, content: m.content })));
      } else {
        setMessages([{ role: "assistant", content: `Bon retour ${u.name} ! 💙 On reprend là où on était. C'est quoi la prochaine étape pour "${u.project}" ?` }]);
      }
      } else { setScreen("onboarding"); }
    } else { setAuthError("Email ou mot de passe incorrect."); }
  };

  const handleOnboardingNext = async () => {
    if (!currentInput.trim()) return;
    let newName = name, newProject = project, newWhy = why;
    if (onboardingStep === 0) { newName = currentInput.trim(); setName(newName); }
    if (onboardingStep === 1) { newProject = currentInput.trim(); setProject(newProject); }
    if (onboardingStep === 2) {
      newWhy = currentInput.trim(); setWhy(newWhy);
      if (userId) {
        const today = new Date().toDateString();
        await dbQuery("PATCH", "users", { name: newName, project: newProject, why: newWhy, streak: 1, last_login: today }, `?id=eq.${userId}`);
        setStreak(1);
        try { const d = new Date(); d.setFullYear(d.getFullYear()+1); document.cookie = `clarity_session=${encodeURIComponent(JSON.stringify({ userId, name: newName, project: newProject, why: newWhy, plan: 'free', messageCount: 0 }))}; expires=${d.toUTCString()}; path=/`; } catch(e) {}
      }
      setScreen("chat");
      setLoading(true);
      try {
        const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [{ role: "user", content: `Je m'appelle ${newName}, mon projet c'est ${newProject} et mon pourquoi c'est ${newWhy}.` }], system: getSystemPrompt(newName, newProject, newWhy) }) });
        const data = await res.json();
        setMessages([{ role: "assistant", content: data.content }]);
        setMessageCount(1);
        if (userId) await dbQuery("PATCH", "users", { message_count: 1 }, `?id=eq.${userId}`);
      } catch { setMessages([{ role: "assistant", content: `Bienvenue ${newName} ! Je suis là. 💙` }]); }
      setLoading(false);
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
      // Play Ricky's voice if micro-victory detected
      const victoryKeywords = ['bravo', 'felicitation', 'félicitation', 'excellent', 'parfait', 'super', 'victoire', 'accompli', 'termine', 'terminé', 'fini', 'complete', 'complété', 'bien joue', 'fier', 'fiere', 'proud', 'congrat', 'amazing', 'great', 'fantastic', 'incroyable', 'genial', 'génial', 'raison d', 'bien fait', 'continue', 'avance'];
      const hasVictory = victoryKeywords.some(k => reply.toLowerCase().includes(k));
      if (hasVictory) {
        setTimeout(() => setShowVoiceReward(true), 1000);
      }
      // Save both messages to DB
      if (userId) {
        await dbQuery("POST", "messages", { user_id: userId, role: "user", content: userMsg });
        await dbQuery("POST", "messages", { user_id: userId, role: "assistant", content: reply });
      }
    } catch { setMessages([...newMessages, { role: "assistant", content: "Petite erreur, réessaie ! 🔄" }]); }
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
    header: { padding: "14px 20px", background: "rgba(6,8,16,0.95)", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10 },
    btn: { background: "linear-gradient(135deg,#2D7DD2,#5B9FE8)", color: "white", border: "none", padding: "16px", borderRadius: 100, fontSize: 16, fontWeight: 600, cursor: "pointer", width: "100%", maxWidth: 300, display: "block", margin: "0 auto" },
    btnGhost: { background: "transparent", color: "rgba(255,255,255,0.4)", border: "none", padding: "14px", borderRadius: 100, fontSize: 14, cursor: "pointer", width: "100%", maxWidth: 300, display: "block", margin: "0 auto" },
    btnOutline: { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.1)", padding: "14px", borderRadius: 100, fontSize: 15, cursor: "pointer", width: "100%" },
    input: { background: "#111827", border: "1px solid rgba(45,125,210,0.3)", borderRadius: 12, padding: "14px 16px", fontSize: 15, color: "white", fontFamily: "system-ui,sans-serif", outline: "none", width: "100%", boxSizing: "border-box" },
  };

  const startVoiceMode = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Utilise Chrome pour le mode vocal !"); return; }
    setVoiceMode(true);
    startVoiceListen();
  };

  const startVoiceListen = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.lang = 'fr-FR'; r.continuous = false; r.interimResults = false;
    r.onstart = () => setIsListeningVoice(true);
    r.onresult = async (e) => {
      setIsListeningVoice(false);
      const transcript = e.results[0][0].transcript;
      if (!transcript.trim()) return;
      const newMessages = [...messages, { role: "user", content: transcript }];
      setMessages(newMessages);
      setIsSpeaking(true);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newMessages.map(m => ({ role: m.role, content: m.content })),
            system: getSystemPrompt(name, project, why)
          }),
        });
        const data = await res.json();
        const reply = data.content;
        setMessages([...newMessages, { role: "assistant", content: reply }]);
        // Speak with ElevenLabs or browser TTS
        try {
          const ttsRes = await fetch("/api/speak", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: reply })
          });
          if (ttsRes.ok) {
            const blob = await ttsRes.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio.onended = () => { setIsSpeaking(false); setTimeout(startVoiceListen, 500); };
            audio.play();
          } else { throw new Error('TTS failed'); }
        } catch {
          // Fallback to browser TTS
          const utterance = new SpeechSynthesisUtterance(reply);
          utterance.lang = 'fr-FR';
          utterance.rate = 0.9;
          utterance.onend = () => { setIsSpeaking(false); setTimeout(startVoiceListen, 500); };
          window.speechSynthesis.speak(utterance);
        }
      } catch { setIsSpeaking(false); }
    };
    r.onerror = () => { setIsListeningVoice(false); };
    r.onend = () => setIsListeningVoice(false);
    r.start();
  };

  const onboardingQuestions = [
    { q: "C'est quoi ton prénom ?", hint: "Juste ton prénom 😊" },
    { q: "C'est quoi ton projet ou rêve en ce moment ?", hint: "Même si c'est flou, dis-moi ce qui t'allume." },
    { q: "Pourquoi tu veux vraiment bâtir ça ?", hint: "Pas la réponse smart. La vraie réponse du fond de toi." },
  ];

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
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[["🌀","Tu changes d'idée avant même de finir"],["🔥","T'as commencé 10 projets, fini zéro"],["😮‍💨","Tu sais que t'as du potentiel mais tu sais pas quoi en faire"],["💭","Les autres outils te donnent encore plus à gérer"]].map(([emoji,text],i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "14px 16px" }}>
              <span style={{ fontSize: 20 }}>{emoji}</span>
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", flex: 1 }}>{text}</span>
              <span style={{ fontSize: 12, color: "#38BDF8", fontWeight: 600, opacity: 0.7, flexShrink: 0 }}>C'est moi</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: "48px 28px", background: "#060810" }}>
        <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: -1, marginBottom: 8 }}>Comment Clarity t'aide.</div>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", marginBottom: 32, fontWeight: 300 }}>Pas un outil de productivité. Un compagnon.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {[
            { num:"01", title:"L'Ancre", tag:"CORE", desc:"Clarity apprend ton pourquoi profond. Quand tu veux tout abandonner, il te rappelle pourquoi t'as commencé.", demo:"Hey, tu te souviens pourquoi t'as commencé ? Tu voulais être libre. Ça vaut encore quelque chose ? 🎯" },
            { num:"02", title:"Le Détecteur", tag:"IA", desc:"Il reconnaît quand ton cerveau part ailleurs — et te ramène doucement, sans jugement.", demo:"Je remarque que c'est la 3e nouvelle idée cette semaine 👀 On continue sur ton projet ?" },
            { num:"03", title:"La Micro-Victoire", tag:"DAILY", desc:"Une seule chose par jour. Célébrée quand c'est fait.", demo:"Aujourd'hui une seule chose 🎯 Quelle est la chose qui va faire avancer ton projet le plus ?" },
          ].map((f,i) => (
            <div key={i} style={{ padding:"24px 0", borderBottom: i<2?"1px solid rgba(255,255,255,0.05)":"none" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                <span style={{ fontSize:32, fontWeight:900, color:"rgba(255,255,255,0.05)" }}>{f.num}</span>
                <span style={{ fontSize:17, fontWeight:800 }}>{f.title}</span>
                <span style={{ fontSize:10, fontWeight:600, background:"rgba(45,125,210,0.2)", color:"#A8C8F0", border:"1px solid rgba(45,125,210,0.25)", padding:"2px 8px", borderRadius:100 }}>{f.tag}</span>
              </div>
              <p style={{ fontSize:14, color:"rgba(255,255,255,0.4)", lineHeight:1.65, marginBottom:12 }}>{f.desc}</p>
              <div style={{ background:"rgba(45,125,210,0.15)", border:"1px solid rgba(45,125,210,0.2)", borderRadius:"14px 14px 14px 3px", padding:"10px 14px", fontSize:13, color:"rgba(255,255,255,0.7)", lineHeight:1.55 }}>{f.demo}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding:"40px 28px", background:"#0D1117" }}>
        <div style={{ fontSize:19, fontWeight:700, lineHeight:1.45, marginBottom:12 }}>"Enfin quelque chose qui comprend que mon cerveau est pas brisé — il est juste <span style={{color:"#38BDF8"}}>différent</span>."</div>
        <div style={{ fontSize:13, color:"rgba(255,255,255,0.35)" }}>— Marc L., entrepreneur TDAH · Montréal</div>
      </div>

      {/* ERIC STORY */}
      <div style={{ padding:"56px 28px", background:"#060810" }}>
        <div style={{ fontSize:11, fontWeight:600, color:"#5B9FE8", letterSpacing:"2.5px", textTransform:"uppercase", marginBottom:12 }}>Qui a créé Clarity ?</div>
        <div style={{ fontSize:26, fontWeight:900, letterSpacing:-1, lineHeight:1.15, marginBottom:28 }}>Fait par quelqu'un<br/>qui a vécu ça.</div>
        <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:28, background:"rgba(45,125,210,0.08)", border:"1px solid rgba(45,125,210,0.15)", borderRadius:20, padding:20 }}>
          <div style={{ width:64, height:64, borderRadius:"50%", background:"linear-gradient(135deg,#2D7DD2,#38BDF8)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, flexShrink:0 }}>✈️</div>
          <div>
            <div style={{ fontWeight:800, fontSize:17 }}>Eric Thomas</div>
            <div style={{ fontSize:12, color:"#38BDF8", letterSpacing:1, marginTop:2 }}>FONDATEUR · TDAH · 30+ PAYS</div>
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {[
            {icon:"🌍", text:"J'ai voyagé dans plus de 30 pays à la recherche de ma passion. Mon cerveau TDAH avait besoin de mouvement pour exister."},
            {icon:"💼", text:"J'ai lancé 3 entreprises — et abandonné les 3. Pas par paresse. Parce que sans passion, mon cerveau s'éteint."},
            {icon:"😔", text:"Pendant des années, j'ai cherché un outil qui me comprend vraiment. Pas la médication. Quelque chose qui reste là quand mon cerveau veut partir ailleurs."},
            {icon:"💙", text:"Clarity, c'est ce que j'aurais voulu avoir. Je l'ai bâti pour toi."},
          ].map((item,i) => (
            <div key={i} style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
              <span style={{ fontSize:22, flexShrink:0, marginTop:2 }}>{item.icon}</span>
              <p style={{ fontSize:15, color:"rgba(255,255,255,0.6)", lineHeight:1.7, margin:0, fontWeight:300 }}>{item.text}</p>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding:"64px 28px", background:"#060810", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", width:500, height:400, background:"radial-gradient(ellipse,rgba(45,125,210,0.1) 0%,transparent 65%)", top:"50%", left:"50%", transform:"translate(-50%,-50%)", pointerEvents:"none" }} />
        <div style={{ fontSize:30, fontWeight:900, letterSpacing:-1, lineHeight:1.15, marginBottom:12, position:"relative" }}>T'as assez attendu.<br/>Commence maintenant.</div>
        <p style={{ fontSize:15, color:"rgba(255,255,255,0.4)", marginBottom:32, fontWeight:300, position:"relative" }}>Gratuit. 2 minutes. Aucune carte requise.</p>
        <button style={{ ...s.btn, position:"relative" }} onClick={() => setScreen("signup")}>Oui, c'est moi — essayer →</button>
        <div style={{ marginTop:56, paddingTop:24, borderTop:"1px solid rgba(255,255,255,0.06)", display:"flex", justifyContent:"space-between", fontSize:11, color:"rgba(255,255,255,0.2)" }}>
          <span>Clarity.</span><span>Fait avec 💙 pour les TDAH</span><span>© 2026</span>
        </div>
      </div>
    </div>
  );

  if (screen === "signup" || screen === "login") return (
    <div style={{ ...s.wrap, justifyContent:"center", padding:"40px 24px" }}>
      <div style={{ marginBottom:32, textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
        <ClarityLogo size={56} />
        <div style={{ fontSize:26, fontWeight:900 }}>Clarity<span style={{color:"#2D7DD2"}}>.</span></div>
        <div style={{ color:"rgba(255,255,255,0.45)", fontSize:15 }}>{screen==="signup"?"Crée ton compte gratuit":"Bon retour 👋"}</div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <input style={s.input} type="email" placeholder="Ton email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={handleKey}/>
        <input style={s.input} type="password" placeholder="Mot de passe (min 6 caractères)" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={handleKey}/>
        {authError && <div style={{color:"#f87171",fontSize:13,textAlign:"center"}}>{authError}</div>}
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"4px 0"}}>
          <input type="checkbox" id="remember" checked={rememberMe} onChange={e=>setRememberMe(e.target.checked)} style={{width:18,height:18,accentColor:"#2D7DD2",cursor:"pointer"}}/>
          <label htmlFor="remember" style={{fontSize:14,color:"rgba(255,255,255,0.5)",cursor:"pointer"}}>Se souvenir de mon email</label>
        </div>
        <button style={{...s.btn,marginTop:8,maxWidth:"100%"}} onClick={screen==="signup"?handleSignup:handleLogin}>
          {screen==="signup"?"Créer mon compte →":"Se connecter →"}
        </button>
        <button style={s.btnOutline} onClick={()=>setScreen(screen==="signup"?"login":"signup")}>
          {screen==="signup"?"J'ai déjà un compte":"Créer un compte"}
        </button>
        <button style={{background:"none",border:"none",color:"rgba(255,255,255,0.3)",fontSize:13,cursor:"pointer",marginTop:8}} onClick={()=>setScreen("landing")}>← Retour</button>
      </div>
    </div>
  );

  if (screen === "onboarding") return (
    <div style={s.wrap}>
      <div style={s.header}><ClarityLogo size={36}/><div style={{fontWeight:900,fontSize:18}}>Clarity<span style={{color:"#2D7DD2"}}>.</span></div></div>
      <div style={{flex:1,padding:"40px 24px",display:"flex",flexDirection:"column",justifyContent:"center"}}>
        <div style={{display:"flex",gap:8,marginBottom:36}}>
          {[0,1,2].map(i=><div key={i} style={{flex:1,height:4,borderRadius:2,background:i<=onboardingStep?"linear-gradient(90deg,#2D7DD2,#38BDF8)":"rgba(255,255,255,0.1)"}}/>)}
        </div>
        <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginBottom:12,letterSpacing:1}}>Question {onboardingStep+1} sur 3</div>
        <div style={{fontSize:24,fontWeight:800,lineHeight:1.3,marginBottom:10}}>{onboardingQuestions[onboardingStep].q}</div>
        <div style={{fontSize:14,color:"rgba(255,255,255,0.4)",marginBottom:28}}>{onboardingQuestions[onboardingStep].hint}</div>
        <textarea autoFocus value={currentInput} onChange={e=>setCurrentInput(e.target.value)} onKeyDown={handleKey} placeholder="Écris ta réponse..." rows={3} style={{...s.input,resize:"none",marginBottom:16,lineHeight:1.6}}/>
        <button style={{...s.btn,maxWidth:"100%",opacity:currentInput.trim()?1:0.4}} onClick={handleOnboardingNext} disabled={!currentInput.trim()}>
          {onboardingStep<2?"Continuer →":"Commencer avec Clarity 💙"}
        </button>
      </div>
    </div>
  );

  if (screen === "upgrade") return (
    <div style={{...s.wrap,overflowY:"auto",padding:"40px 24px"}}>
      <div style={{textAlign:"center",marginBottom:32}}>
        <ClarityLogo size={56}/>
        <div style={{fontSize:24,fontWeight:800,marginBottom:8,marginTop:16}}>T'as utilisé tes 10 messages gratuits !</div>
        <div style={{color:"rgba(255,255,255,0.45)",fontSize:15}}>Passe au Pro pour continuer.</div>
      </div>
      {[
        {plan:"free",name:"Gratuit",price:"0$",period:"pour toujours",features:["10 messages / jour","Onboarding TDAH","Accès communauté"],current:true},
        {plan:"pro",name:"Pro",price:"19$",period:"/ mois",features:["Messages illimités","Détecteur de dérive IA","Voix de Clarity","Support prioritaire"],featured:true},
        {plan:"business",name:"Business",price:"49$",period:"/ mois",features:["Tout le plan Pro","Accountability partner","Sessions focus guidées","Rapport hebdomadaire"]},
      ].map((p,i)=>(
        <div key={i} style={{background:p.featured?"linear-gradient(160deg,#0d1f3c,#091529)":"#111827",border:p.featured?"1px solid rgba(45,125,210,0.4)":"1px solid rgba(255,255,255,0.07)",borderRadius:20,padding:"24px",marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",letterSpacing:1,textTransform:"uppercase"}}>{p.name}</div>
              <div style={{fontSize:32,fontWeight:900,color:p.featured?"#38BDF8":"white"}}>{p.price}<span style={{fontSize:14,color:"rgba(255,255,255,0.4)"}}> {p.period}</span></div>
            </div>
            {p.featured&&<div style={{background:"linear-gradient(135deg,#2D7DD2,#38BDF8)",color:"white",fontSize:11,fontWeight:700,padding:"4px 12px",borderRadius:100}}>⚡ Populaire</div>}
          </div>
          <ul style={{listStyle:"none",marginBottom:16,padding:0}}>
            {p.features.map((f,j)=><li key={j} style={{fontSize:14,color:"rgba(255,255,255,0.6)",padding:"5px 0",display:"flex",gap:8}}><span style={{color:"#38BDF8"}}>✓</span>{f}</li>)}
          </ul>
          <button style={{...(p.featured?{...s.btn,maxWidth:"100%"}:s.btnOutline)}} onClick={()=>{setPlan(p.plan);setMessageCount(0);setScreen("chat");}}>
            {p.current?"Continuer gratuit":`Choisir ${p.name}`}
          </button>
        </div>
      ))}
    </div>
  );

  // DASHBOARD
  if (screen === "chat" && showDashboard) return (
    <div style={{...s.wrap, overflowY:"auto"}}>
      <div style={s.header}>
        <ClarityLogo size={36}/>
        <div style={{flex:1}}>
          <div style={{fontWeight:900,fontSize:16}}>Clarity<span style={{color:"#2D7DD2"}}>.</span></div>
          <div style={{fontSize:11,color:"#38BDF8"}}>Bon retour {name} 👋</div>
        </div>
        <button onClick={()=>setShowDashboard(false)} style={{background:"linear-gradient(135deg,#2D7DD2,#5B9FE8)",border:"none",color:"white",padding:"8px 16px",borderRadius:100,fontSize:12,fontWeight:600,cursor:"pointer"}}>
          Parler à Clarity →
        </button>
      </div>

      <div style={{padding:"28px 20px",display:"flex",flexDirection:"column",gap:16}}>
        
        {/* Streak */}
        <div style={{background:"linear-gradient(135deg,#0a1628,#0d1f3c)",border:"1px solid rgba(45,125,210,0.3)",borderRadius:20,padding:"20px 24px",display:"flex",alignItems:"center",gap:16}}>
          <div style={{fontSize:44,lineHeight:1}}>{streak >= 7 ? "🔥" : streak >= 3 ? "⚡" : "✨"}</div>
          <div>
            <div style={{fontSize:32,fontWeight:900,color:"#38BDF8",lineHeight:1}}>{streak}</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,0.5)",marginTop:4}}>
              {streak === 0 ? "Commence aujourd'hui !" : streak === 1 ? "Premier jour — continue !" : `jour${streak > 1 ? "s" : ""} de suite 🔥`}
            </div>
          </div>
        </div>

        {/* Project anchor */}
        <div style={{background:"#111827",border:"1px solid rgba(255,255,255,0.07)",borderRadius:20,padding:"20px 24px"}}>
          <div style={{fontSize:11,color:"#5B9FE8",letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>Ton ancre</div>
          <div style={{fontSize:17,fontWeight:700,marginBottom:6}}>{project || "Pas encore défini"}</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",fontStyle:"italic"}}>"{why || "..."}"</div>
        </div>

        {/* Micro victoire du jour */}
        <div style={{background:"#111827",border:"1px solid rgba(255,255,255,0.07)",borderRadius:20,padding:"20px 24px"}}>
          <div style={{fontSize:11,color:"#5B9FE8",letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>🎯 Ta micro-victoire du jour</div>
          {todayVictory ? (
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:"rgba(56,189,248,0.2)",border:"1px solid #38BDF8",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>✓</div>
              <div style={{fontSize:15,color:"rgba(255,255,255,0.8)"}}>{todayVictory}</div>
            </div>
          ) : (
            <div>
              <div style={{fontSize:14,color:"rgba(255,255,255,0.4)",marginBottom:12}}>C'est quoi ta seule chose aujourd'hui ?</div>
              <div style={{display:"flex",gap:8}}>
                <input 
                  value={victoryInput}
                  onChange={e=>setVictoryInput(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter"&&victoryInput.trim()){setTodayVictory(victoryInput.trim());setVictoryInput("");}}}
                  placeholder="Ex: Envoyer mon premier email à 5 clients..."
                  style={{flex:1,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(45,125,210,0.3)",borderRadius:12,padding:"12px 14px",fontSize:14,color:"white",fontFamily:"system-ui",outline:"none"}}
                />
                <button 
                  onClick={()=>{if(victoryInput.trim()){setTodayVictory(victoryInput.trim());setVictoryInput("");}}}
                  style={{background:"linear-gradient(135deg,#2D7DD2,#5B9FE8)",border:"none",borderRadius:12,padding:"12px 16px",color:"white",fontSize:14,cursor:"pointer",fontWeight:600}}>
                  ✓
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Messages count */}
        {plan === "free" && (
          <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:16,padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:14,fontWeight:600}}>Messages restants</div>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>Plan gratuit</div>
            </div>
            <div style={{fontSize:28,fontWeight:900,color:messageCount>=8?"#f87171":"#38BDF8"}}>{10-messageCount}</div>
          </div>
        )}

        {/* CTA */}
        <button onClick={()=>setShowDashboard(false)} style={{...s.btn,maxWidth:"100%",padding:"16px"}}>
          💙 Parler à Clarity maintenant
        </button>
      </div>
    </div>
  );

  // DASHBOARD
  if (screen === "chat" && showDashboard) return (
    <div style={{...s.wrap, overflowY:"auto"}}>
      <div style={{...s.header}}>
        <ClarityLogo size={36}/>
        <div style={{flex:1}}>
          <div style={{fontWeight:900,fontSize:16}}>Clarity<span style={{color:"#2D7DD2"}}>.</span></div>
          <div style={{fontSize:11,color:"#38BDF8"}}>Bonjour {name} 👋</div>
        </div>
        <button onClick={()=>setShowDashboard(false)} style={{background:"linear-gradient(135deg,#2D7DD2,#5B9FE8)",border:"none",color:"white",padding:"8px 16px",borderRadius:100,fontSize:13,fontWeight:600,cursor:"pointer"}}>Chat →</button>
      </div>

      <div style={{padding:"24px 20px",display:"flex",flexDirection:"column",gap:16}}>

        {/* Streak */}
        <div style={{background:"linear-gradient(135deg,#0d1f3c,#091529)",border:"1px solid rgba(45,125,210,0.3)",borderRadius:20,padding:"20px",display:"flex",alignItems:"center",gap:16}}>
          <div style={{fontSize:48,lineHeight:1}}>{streak >= 7 ? "🔥" : streak >= 3 ? "⚡" : "✨"}</div>
          <div>
            <div style={{fontSize:28,fontWeight:900,color:streak>=7?"#f97316":streak>=3?"#38BDF8":"white"}}>{streak} jour{streak>1?"s":""}</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,0.4)"}}>{streak===0?"Commence aujourd'hui !":streak>=7?"Tu es en feu ! Continue !":streak>=3?"Belle série, continue !":"Tu reviens, c'est déjà énorme."}</div>
          </div>
        </div>

        {/* Projet */}
        <div style={{background:"#111827",border:"1px solid rgba(255,255,255,0.07)",borderRadius:20,padding:"20px"}}>
          <div style={{fontSize:11,color:"#5B9FE8",letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>Ton projet</div>
          <div style={{fontSize:17,fontWeight:700,marginBottom:6}}>{project || "Pas encore défini"}</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",fontStyle:"italic"}}>"{why && why.length > 60 ? why.slice(0,60)+"..." : why}"</div>
        </div>

        {/* Micro-victoire du jour */}
        <div style={{background:"#111827",border:"1px solid rgba(255,255,255,0.07)",borderRadius:20,padding:"20px"}}>
          <div style={{fontSize:11,color:"#5B9FE8",letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>🎯 Micro-victoire du jour</div>
          {!todayTask ? (
            <div>
              <div style={{fontSize:14,color:"rgba(255,255,255,0.45)",marginBottom:12}}>C'est quoi ta seule chose aujourd'hui ?</div>
              <div style={{display:"flex",gap:8}}>
                <input
                  placeholder="Ex: Envoyer un email à 3 personnes TDAH..."
                  style={{flex:1,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(45,125,210,0.3)",borderRadius:10,padding:"10px 14px",fontSize:13,color:"white",outline:"none",fontFamily:"system-ui"}}
                  onKeyDown={(e)=>{
                    if(e.key==="Enter" && e.target.value.trim()){
                      const task = e.target.value.trim();
                      setTodayTask(task);
                      try{localStorage.setItem('clarity_today_task',task);localStorage.setItem('clarity_task_date',new Date().toDateString());localStorage.setItem('clarity_task_done','false');}catch(err){}
                    }
                  }}
                />
                <button style={{background:"linear-gradient(135deg,#2D7DD2,#5B9FE8)",border:"none",color:"white",padding:"10px 16px",borderRadius:10,cursor:"pointer",fontSize:13,fontWeight:600}}
                  onClick={(e)=>{
                    const input = e.target.previousSibling;
                    if(input && input.value.trim()){
                      const task = input.value.trim();
                      setTodayTask(task);
                      try{localStorage.setItem('clarity_today_task',task);localStorage.setItem('clarity_task_date',new Date().toDateString());localStorage.setItem('clarity_task_done','false');}catch(err){}
                    }
                  }}>OK</button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{fontSize:15,color:todayDone?"rgba(255,255,255,0.4)":"white",textDecoration:todayDone?"line-through":"none",marginBottom:12}}>{todayTask}</div>
              {!todayDone ? (
                <button onClick={()=>{setTodayDone(true);try{localStorage.setItem('clarity_task_done','true');}catch(err){}}} style={{background:"linear-gradient(135deg,#2D7DD2,#38BDF8)",border:"none",color:"white",padding:"12px 24px",borderRadius:100,fontSize:14,fontWeight:600,cursor:"pointer",width:"100%"}}>
                  ✅ C'est fait !
                </button>
              ) : (
                <div style={{background:"rgba(56,189,248,0.1)",border:"1px solid rgba(56,189,248,0.3)",borderRadius:12,padding:"12px",textAlign:"center",fontSize:14,color:"#38BDF8",fontWeight:600}}>
                  🎉 Micro-victoire accomplie ! Ricky est fier de toi.
                </div>
              )}
            </div>
          )}
        </div>

        {/* CTA chat */}
        <button onClick={()=>setShowDashboard(false)} style={{background:"linear-gradient(135deg,#2D7DD2,#5B9FE8)",border:"none",color:"white",padding:"16px",borderRadius:100,fontSize:16,fontWeight:600,cursor:"pointer",boxShadow:"0 6px 24px rgba(45,125,210,0.3)"}}>
          💙 Parler à Clarity
        </button>

      </div>
    </div>
  );

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <ClarityLogo size={36}/>
        <div style={{flex:1}}>
          <div style={{fontWeight:900,fontSize:16}}>Clarity<span style={{color:"#2D7DD2"}}>.</span></div>
          <div style={{fontSize:11,color:"#38BDF8",display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:"#38BDF8",boxShadow:"0 0 6px #38BDF8"}}/>
            En ligne
          </div>
        </div>
        {plan==="free"&&(
          <div style={{fontSize:11,color:messageCount>=8?"#f87171":"rgba(255,255,255,0.3)",background:"rgba(255,255,255,0.05)",padding:"4px 10px",borderRadius:100,cursor:"pointer"}} onClick={()=>setScreen("upgrade")}>
            {10-messageCount} msg
          </div>
        )}
        <button onClick={()=>{try{localStorage.removeItem('clarity_session');}catch(e){}setScreen("landing");setMessages([]);setName("");setProject("");setWhy("");setUserId(null);}} style={{background:"none",border:"none",color:"rgba(255,255,255,0.2)",fontSize:11,cursor:"pointer",padding:"4px 8px"}}>⎋</button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"24px 16px",display:"flex",flexDirection:"column",gap:12}}>
        {messages.map((msg,i)=>(
          <div key={i} style={{display:"flex",justifyContent:msg.role==="user"?"flex-end":"flex-start",alignItems:"flex-end",gap:8}}>
            {msg.role==="assistant"&&<ClarityLogo size={28}/>}
            <div style={{maxWidth:"78%",padding:"12px 16px",borderRadius:msg.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px",background:msg.role==="user"?"linear-gradient(135deg,#2D7DD2,#5B9FE8)":"#111827",border:msg.role==="assistant"?"1px solid rgba(255,255,255,0.07)":"none",fontSize:15,lineHeight:1.65,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading&&(
          <div style={{display:"flex",alignItems:"flex-end",gap:8}}>
            <ClarityLogo size={28}/>
            <div style={{background:"#111827",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"18px 18px 18px 4px",padding:"14px 18px",display:"flex",gap:5}}>
              {[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:"#5B9FE8",animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}
            </div>
          </div>
        )}
        {showVoiceReward && (
          <div style={{display:"flex",justifyContent:"center",margin:"8px 0"}}>
            <button onClick={()=>{
              const audio = new Audio('data:audio/mp3;base64,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AAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAQAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAABxzdHNjAAAAAAAAAAEAAAABAAACRgAAAAEAAAAYY282NAAAAAAAAAABAAAAAAAAACg=');
              audio.volume = 1.0;
              audio.play();
              setShowVoiceReward(false);
            }} style={{background:"linear-gradient(135deg,#2D7DD2,#38BDF8)",border:"none",borderRadius:100,padding:"12px 24px",color:"white",fontSize:14,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:8,boxShadow:"0 4px 20px rgba(45,125,210,0.4)"}}>
              🎙️ Message de Ricky pour toi
            </button>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>
      {voiceMode && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"#060810",zIndex:200,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:28}}>
          <style>{`
            @keyframes vp1{0%,100%{transform:scale(1);opacity:0.15}50%{transform:scale(1.15);opacity:0.35}}
            @keyframes vp2{0%,100%{transform:scale(1);opacity:0.2}50%{transform:scale(1.1);opacity:0.45}}
            @keyframes vp3{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
            @keyframes vspeak{0%,100%{transform:scale(1)}25%{transform:scale(1.1)}75%{transform:scale(0.93)}}
          `}</style>
          <div style={{position:"absolute",width:"100%",height:"100%",background:"radial-gradient(circle at 50% 45%,rgba(45,125,210,0.08) 0%,transparent 60%)",pointerEvents:"none"}}/>
          <div style={{position:"relative",width:200,height:200,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{position:"absolute",width:200,height:200,borderRadius:"50%",border:"1px solid rgba(45,125,210,0.15)",animation:(isListeningVoice||isSpeaking)?"vp1 2s ease-in-out infinite":"none"}}/>
            <div style={{position:"absolute",width:155,height:155,borderRadius:"50%",border:"1px solid rgba(45,125,210,0.2)",animation:(isListeningVoice||isSpeaking)?"vp2 1.5s ease-in-out infinite":"none"}}/>
            <div style={{position:"absolute",width:110,height:110,borderRadius:"50%",background:"rgba(45,125,210,0.1)",animation:(isListeningVoice||isSpeaking)?"vp3 1.2s ease-in-out infinite":"none"}}/>
            <div style={{width:80,height:80,borderRadius:"50%",background:"linear-gradient(135deg,#2D7DD2,#38BDF8)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 48px rgba(45,125,210,0.5)",fontSize:32,animation:isSpeaking?"vspeak 0.5s ease-in-out infinite":"none"}}>
              {isListeningVoice?"👂":isSpeaking?"💬":"💙"}
            </div>
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:22,fontWeight:800,marginBottom:8}}>{isListeningVoice?"Je t'écoute...":isSpeaking?"Clarity parle...":"Mode vocal"}</div>
            <div style={{fontSize:14,color:"rgba(255,255,255,0.4)"}}>{isListeningVoice?"Parle maintenant":isSpeaking?"...":"Appuie sur le micro"}</div>
          </div>
          {!isListeningVoice&&!isSpeaking&&(
            <button onClick={startVoiceListen} style={{width:80,height:80,borderRadius:"50%",background:"linear-gradient(135deg,#2D7DD2,#38BDF8)",border:"none",cursor:"pointer",fontSize:32,boxShadow:"0 8px 40px rgba(45,125,210,0.5)"}}>🎤</button>
          )}
          <button onClick={()=>{setVoiceMode(false);setIsListeningVoice(false);setIsSpeaking(false);window.speechSynthesis?.cancel();}} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.45)",padding:"12px 28px",borderRadius:100,fontSize:14,cursor:"pointer"}}>
            Fermer
          </button>
        </div>
      )}
      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0);opacity:0.4}30%{transform:translateY(-6px);opacity:1}}`}</style>
      <div style={{padding:"12px 16px 24px",background:"rgba(6,8,16,0.95)",borderTop:"1px solid rgba(255,255,255,0.07)"}}>
        <div style={{display:"flex",gap:10,alignItems:"flex-end",background:"#111827",border:`1px solid ${listening?"rgba(255,80,80,0.4)":"rgba(45,125,210,0.25)"}`,borderRadius:24,padding:"8px 8px 8px 16px"}}>
          <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKey} placeholder={listening?"Clarity t'écoute...":"Écris ou parle..."} rows={1}
            style={{flex:1,background:"transparent",border:"none",outline:"none",color:"white",fontSize:15,resize:"none",fontFamily:"system-ui,sans-serif",lineHeight:1.5,maxHeight:120,overflowY:"auto",padding:"6px 0",caretColor:"#2D7DD2"}}/>
          <button onClick={listening?()=>{recognitionRef.current?.stop();setListening(false);}:startListening}
            style={{width:38,height:38,borderRadius:"50%",border:"none",cursor:"pointer",background:listening?"linear-gradient(135deg,#f87171,#ef4444)":"rgba(255,255,255,0.08)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <span style={{fontSize:16}}>{listening?"⏹":"🎤"}</span>
          </button>
          <button onClick={sendMessage} disabled={!input.trim()||loading}
            style={{width:38,height:38,borderRadius:"50%",border:"none",cursor:input.trim()&&!loading?"pointer":"default",background:input.trim()&&!loading?"linear-gradient(135deg,#2D7DD2,#5B9FE8)":"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M14 8L2 2l3 6-3 6 12-6z" fill={input.trim()&&!loading?"white":"rgba(255,255,255,0.25)"}/></svg>
          </button>
        </div>
        <p style={{fontSize:11,color:"rgba(255,255,255,0.15)",textAlign:"center",marginTop:10}}>Clarity · For ADHD Minds 💙</p>
      </div>
    </div>
  );
}
