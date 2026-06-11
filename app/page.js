'use client'
import { useState, useRef, useEffect } from "react";

const PLANS = {
  free: { name: "Gratuit", messages: 10, price: 0 },
  pro: { name: "Pro", messages: 999999, price: 19 },
  business: { name: "Business", messages: 999999, price: 49 }
};

const getSystemPrompt = (name, project, why) => `Tu es Clarity, un compagnon IA bienveillant conçu exclusivement pour les entrepreneurs TDAH.

INFORMATIONS SUR L'UTILISATEUR :
- Prénom : ${name}
- Projet / Rêve : ${project}  
- Pourquoi profond : ${why}

C'est l'ANCRE de ${name}. Tu t'en souviens toujours.

TON RÔLE :
- Tu es comme un ami proche qui comprend VRAIMENT le TDAH
- Tu aides ${name} à rester connecté à sa vision : "${project}"
- Quand tu détectes qu'il dérive vers une nouvelle idée, tu le ramènes doucement
- Tu ne juges JAMAIS

TON STYLE :
- Appelle-le par son prénom parfois
- Parle comme un vrai ami, pas un robot
- Phrases courtes
- UNE seule question à la fois
- Célèbre les petites victoires

QUAND IL DÉRIVE :
- Reconnais la nouvelle idée
- Rappelle son ancre : "${why}"
- Demande : "Est-ce que ça s'ajoute à ton projet ou ça le remplace ?"

LANGUE : Toujours en français.
RÉPONSES : Courtes, 2-4 phrases max.`;

export default function ClarityApp() {
  const [screen, setScreen] = useState("landing"); // landing | signup | login | onboarding | chat | upgrade
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const onboardingQuestions = [
    { q: "C'est quoi ton prénom ?", hint: "Juste ton prénom 😊" },
    { q: "C'est quoi ton projet ou rêve en ce moment ?", hint: "Même si c'est flou, dis-moi ce qui t'allume." },
    { q: "Pourquoi tu veux vraiment bâtir ça ?", hint: "Pas la réponse smart. La vraie réponse du fond de toi." },
  ];

  const handleAuth = (type) => {
    if (!email.includes("@") || password.length < 6) {
      setAuthError("Email invalide ou mot de passe trop court (min 6 caractères)");
      return;
    }
    setAuthError("");
    setScreen("onboarding");
  };

  const handleOnboardingNext = async () => {
    if (!currentInput.trim()) return;
    if (onboardingStep === 0) setName(currentInput.trim());
    if (onboardingStep === 1) setProject(currentInput.trim());
    if (onboardingStep === 2) {
      const finalWhy = currentInput.trim();
      setWhy(finalWhy);
      setScreen("chat");
      setLoading(true);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: `Je m'appelle ${name}, mon projet c'est ${project} et mon pourquoi c'est ${finalWhy}.` }],
            system: getSystemPrompt(name, project, finalWhy)
          }),
        });
        const data = await res.json();
        setMessages([{ role: "assistant", content: data.content }]);
        setMessageCount(1);
      } catch {
        setMessages([{ role: "assistant", content: `Bienvenue ${name} ! Je suis là pour t'aider. 💙` }]);
      }
      setLoading(false);
      return;
    }
    setOnboardingStep(onboardingStep + 1);
    setCurrentInput("");
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    if (plan === "free" && messageCount >= PLANS.free.messages) {
      setScreen("upgrade");
      return;
    }
    const userMsg = input.trim();
    setInput("");
    const newMessages = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setLoading(true);
    setMessageCount(c => c + 1);
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
      setMessages([...newMessages, { role: "assistant", content: data.content }]);
      setMessageCount(c => c + 1);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Petite erreur, réessaie ! 🔄" }]);
    }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (screen === "chat") sendMessage();
      else if (screen === "onboarding") handleOnboardingNext();
    }
  };

  const s = {
    wrap: { background: "#060810", minHeight: "100vh", fontFamily: "system-ui,sans-serif", color: "white", maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column" },
    header: { padding: "16px 20px", background: "rgba(6,8,16,0.95)", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10 },
    logo: { fontWeight: 900, fontSize: 18 },
    avatar: { width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#2D7DD2,#38BDF8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 },
    btn: { background: "linear-gradient(135deg,#2D7DD2,#5B9FE8)", color: "white", border: "none", padding: "14px", borderRadius: 100, fontSize: 15, fontWeight: 600, cursor: "pointer", width: "100%", boxShadow: "0 6px 24px rgba(45,125,210,0.3)" },
    btnGhost: { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.1)", padding: "14px", borderRadius: 100, fontSize: 15, fontWeight: 500, cursor: "pointer", width: "100%" },
    input: { background: "#111827", border: "1px solid rgba(45,125,210,0.3)", borderRadius: 12, padding: "14px 16px", fontSize: 15, color: "white", fontFamily: "system-ui,sans-serif", outline: "none", width: "100%", boxSizing: "border-box" },
    card: { background: "#111827", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "24px" },
  };

  // LANDING
  if (screen === "landing") return (
    <div style={{ ...s.wrap, justifyContent: "center", alignItems: "center", padding: "40px 24px", textAlign: "center" }}>
      <div style={{ position: "absolute", width: 400, height: 400, background: "radial-gradient(circle,rgba(45,125,210,0.12) 0%,transparent 70%)", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(45,125,210,0.15)", border: "1px solid rgba(45,125,210,0.3)", color: "#A8C8F0", padding: "7px 16px", borderRadius: 100, fontSize: 12, fontWeight: 500, marginBottom: 32 }}>
        <div style={{ width: 7, height: 7, background: "#38BDF8", borderRadius: "50%", boxShadow: "0 0 8px #38BDF8" }} />
        Fait par un TDAH, pour les TDAH
      </div>
      <div style={{ fontSize: 52, fontWeight: 900, letterSpacing: -2, lineHeight: 1.05, marginBottom: 18 }}>
        Clarity<span style={{ color: "#2D7DD2" }}>.</span>
      </div>
      <p style={{ fontSize: 18, fontWeight: 300, color: "rgba(255,255,255,0.45)", lineHeight: 1.65, marginBottom: 44, maxWidth: 340 }}>
        Enfin un outil qui comprend vraiment comment ton cerveau fonctionne.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 300 }}>
        <button style={s.btn} onClick={() => setScreen("signup")}>Commencer gratuitement →</button>
        <button style={s.btnGhost} onClick={() => setScreen("login")}>J'ai déjà un compte</button>
      </div>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", marginTop: 20 }}>Gratuit · 10 messages · Sans carte</p>
    </div>
  );

  // SIGNUP / LOGIN
  if (screen === "signup" || screen === "login") return (
    <div style={{ ...s.wrap, justifyContent: "center", padding: "40px 24px" }}>
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>Clarity<span style={{ color: "#2D7DD2" }}>.</span></div>
        <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 15 }}>{screen === "signup" ? "Crée ton compte gratuit" : "Connecte-toi"}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input style={s.input} type="email" placeholder="Ton email" value={email} onChange={e => setEmail(e.target.value)} />
        <input style={s.input} type="password" placeholder="Mot de passe (min 6 caractères)" value={password} onChange={e => setPassword(e.target.value)} />
        {authError && <div style={{ color: "#f87171", fontSize: 13, textAlign: "center" }}>{authError}</div>}
        <button style={{ ...s.btn, marginTop: 8 }} onClick={() => handleAuth(screen)}>
          {screen === "signup" ? "Créer mon compte →" : "Se connecter →"}
        </button>
        <button style={s.btnGhost} onClick={() => setScreen(screen === "signup" ? "login" : "signup")}>
          {screen === "signup" ? "J'ai déjà un compte" : "Créer un compte"}
        </button>
        <button style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 13, cursor: "pointer", marginTop: 8 }} onClick={() => setScreen("landing")}>← Retour</button>
      </div>
    </div>
  );

  // ONBOARDING
  if (screen === "onboarding") return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={s.avatar}>💙</div>
        <div style={s.logo}>Clarity<span style={{ color: "#2D7DD2" }}>.</span></div>
      </div>
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

  // UPGRADE
  if (screen === "upgrade") return (
    <div style={{ ...s.wrap, padding: "40px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 40 }}>⚡</div>
        <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>T'as utilisé tes 10 messages gratuits !</div>
        <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 15 }}>Passe au Pro pour continuer avec Clarity.</div>
      </div>
      {[
        { plan: "free", name: "Gratuit", price: "0$", period: "pour toujours", features: ["10 messages / jour", "Onboarding TDAH", "Accès communauté"], current: true },
        { plan: "pro", name: "Pro", price: "19$", period: "/ mois", features: ["Messages illimités", "Détecteur de dérive IA", "Analyse de tes patterns", "Support prioritaire"], featured: true },
        { plan: "business", name: "Business", price: "49$", period: "/ mois", features: ["Tout le plan Pro", "Accountability partner", "Sessions focus guidées", "Rapport hebdomadaire"] },
      ].map((p, i) => (
        <div key={i} style={{ ...s.card, marginBottom: 12, border: p.featured ? "1px solid rgba(45,125,210,0.4)" : "1px solid rgba(255,255,255,0.07)", background: p.featured ? "linear-gradient(160deg,#0d1f3c,#091529)" : "#111827" }}>
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
          <button style={{ ...p.featured ? s.btn : s.btnGhost }} onClick={() => { setPlan(p.plan); setMessageCount(0); setScreen("chat"); }}>
            {p.current ? "Continuer gratuit" : `Choisir ${p.name}`}
          </button>
        </div>
      ))}
    </div>
  );

  // CHAT
  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={s.avatar}>💙</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>Clarity<span style={{ color: "#2D7DD2" }}>.</span></div>
          <div style={{ fontSize: 11, color: "#38BDF8", display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#38BDF8", boxShadow: "0 0 6px #38BDF8" }} />
            En ligne
          </div>
        </div>
        {plan === "free" && (
          <div style={{ fontSize: 11, color: messageCount >= 8 ? "#f87171" : "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.05)", padding: "4px 10px", borderRadius: 100, cursor: "pointer" }} onClick={() => setScreen("upgrade")}>
            {PLANS.free.messages - messageCount} msg restants
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 8 }}>
            {msg.role === "assistant" && <div style={{ ...s.avatar, width: 28, height: 28, fontSize: 12, flexShrink: 0 }}>💙</div>}
            <div style={{ maxWidth: "78%", padding: "12px 16px", borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: msg.role === "user" ? "linear-gradient(135deg,#2D7DD2,#5B9FE8)" : "#111827", border: msg.role === "assistant" ? "1px solid rgba(255,255,255,0.07)" : "none", fontSize: 15, lineHeight: 1.65, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
            <div style={{ ...s.avatar, width: 28, height: 28, fontSize: 12 }}>💙</div>
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
            style={{ width: 38, height: 38, borderRadius: "50%", border: "none", cursor: input.trim() && !loading ? "pointer" : "default", background: input.trim() && !loading ? "linear-gradient(135deg,#2D7DD2,#5B9FE8)" : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M14 8L2 2l3 6-3 6 12-6z" fill={input.trim() && !loading ? "white" : "rgba(255,255,255,0.25)"} /></svg>
          </button>
        </div>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.15)", textAlign: "center", marginTop: 10 }}>Clarity · Pour les cerveaux TDAH 💙</p>
      </div>
    </div>
  );
}
