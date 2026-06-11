'use client'
import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `Tu es Clarity, un compagnon IA bienveillant conçu exclusivement pour les entrepreneurs TDAH.

TON RÔLE :
- Tu es comme un ami proche qui comprend VRAIMENT ce que c'est de vivre avec le TDAH
- Tu aides les gens à clarifier leurs idées, rester connectés à leur vision, et avancer sans se perdre
- Tu détectes quand quelqu'un dérive vers une nouvelle idée et tu le ramènes doucement à son ancre
- Tu ne juges JAMAIS

TON STYLE :
- Parle comme un vrai ami, pas comme un robot
- Sois direct, chaleureux, honnête
- Phrases courtes — les cerveaux TDAH n'aiment pas les longs paragraphes
- UNE seule question à la fois maximum
- Célèbre les petites victoires

QUAND QUELQU'UN ARRIVE :
1. Accueille chaleureusement
2. Demande son prénom
3. Demande son projet ou rêve actuel
4. Demande son "pourquoi" profond
5. Note mentalement — c'est son ANCRE

LANGUE : Réponds toujours dans la langue de l'utilisateur.
IMPORTANT : Réponses courtes (2-4 phrases max).`;

export default function ClarityApp() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const startConversation = async () => {
    setStarted(true);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Bonjour" }],
          system: SYSTEM_PROMPT
        }),
      });
      const data = await res.json();
      setMessages([
        { role: "user", content: "Bonjour", hidden: true },
        { role: "assistant", content: data.content },
      ]);
    } catch {
      setMessages([{ role: "assistant", content: "Bonjour ! Je suis Clarity. Comment tu t'appelles ? 👋" }]);
    }
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    const newMessages = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const apiMessages = newMessages.filter(m => !m.hidden).map(m => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, system: SYSTEM_PROMPT }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.content }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Petite erreur, réessaie ! 🔄" }]);
    }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const visible = messages.filter(m => !m.hidden);

  if (!started) return (
    <div style={{background:"#060810",minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 24px",textAlign:"center",fontFamily:"system-ui,sans-serif",color:"white"}}>
      <div style={{position:"absolute",width:400,height:400,background:"radial-gradient(circle,rgba(45,125,210,0.12) 0%,transparent 70%)",top:"50%",left:"50%",transform:"translate(-50%,-50%)",pointerEvents:"none"}}/>
      <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(45,125,210,0.15)",border:"1px solid rgba(45,125,210,0.3)",color:"#A8C8F0",padding:"7px 16px",borderRadius:100,fontSize:12,fontWeight:500,marginBottom:32}}>
        <div style={{width:7,height:7,background:"#38BDF8",borderRadius:"50%",boxShadow:"0 0 8px #38BDF8"}}/>
        Fait par un TDAH, pour les TDAH
      </div>
      <div style={{fontSize:48,fontWeight:900,letterSpacing:-2,lineHeight:1.05,marginBottom:18}}>
        Clarity<span style={{color:"#2D7DD2"}}>.</span>
      </div>
      <p style={{fontSize:18,fontWeight:300,color:"rgba(255,255,255,0.45)",lineHeight:1.65,marginBottom:12,maxWidth:340}}>
        Enfin un outil qui comprend vraiment comment ton cerveau fonctionne.
      </p>
      <p style={{fontSize:14,color:"rgba(255,255,255,0.2)",marginBottom:44,maxWidth:300}}>
        Pour les entrepreneurs TDAH qui ont plein d'idées mais qui ont du mal à rester là.
      </p>
      <button onClick={startConversation} style={{background:"linear-gradient(135deg,#2D7DD2,#5B9FE8)",color:"white",border:"none",padding:"16px 40px",borderRadius:100,fontSize:17,fontWeight:600,cursor:"pointer",boxShadow:"0 8px 32px rgba(45,125,210,0.35)",width:"100%",maxWidth:300}}>
        Commencer maintenant →
      </button>
      <p style={{fontSize:12,color:"rgba(255,255,255,0.2)",marginTop:20}}>Gratuit · Aucune carte requise</p>
    </div>
  );

  return (
    <div style={{background:"#060810",minHeight:"100vh",display:"flex",flexDirection:"column",fontFamily:"system-ui,sans-serif",maxWidth:640,margin:"0 auto",color:"white"}}>
      <div style={{padding:"16px 20px",background:"rgba(6,8,16,0.95)",borderBottom:"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:10}}>
        <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#2D7DD2,#38BDF8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>💙</div>
        <div>
          <div style={{fontWeight:800,fontSize:16}}>Clarity<span style={{color:"#2D7DD2"}}>.</span></div>
          <div style={{fontSize:11,color:"#38BDF8",display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:"#38BDF8",boxShadow:"0 0 6px #38BDF8"}}/>
            En ligne
          </div>
        </div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"24px 16px",display:"flex",flexDirection:"column",gap:12}}>
        {visible.map((msg, i) => (
          <div key={i} style={{display:"flex",justifyContent:msg.role==="user"?"flex-end":"flex-start",alignItems:"flex-end",gap:8}}>
            {msg.role==="assistant" && <div style={{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#2D7DD2,#38BDF8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>💙</div>}
            <div style={{maxWidth:"78%",padding:"12px 16px",borderRadius:msg.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px",background:msg.role==="user"?"linear-gradient(135deg,#2D7DD2,#5B9FE8)":"#111827",border:msg.role==="assistant"?"1px solid rgba(255,255,255,0.07)":"none",fontSize:15,lineHeight:1.65,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{display:"flex",alignItems:"flex-end",gap:8}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#2D7DD2,#38BDF8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>💙</div>
            <div style={{background:"#111827",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"18px 18px 18px 4px",padding:"14px 18px",display:"flex",gap:5}}>
              {[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:"#5B9FE8",animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0);opacity:0.4}30%{transform:translateY(-6px);opacity:1}}`}</style>

      <div style={{padding:"12px 16px 24px",background:"rgba(6,8,16,0.95)",borderTop:"1px solid rgba(255,255,255,0.07)"}}>
        <div style={{display:"flex",gap:10,alignItems:"flex-end",background:"#111827",border:"1px solid rgba(45,125,210,0.25)",borderRadius:24,padding:"8px 8px 8px 16px"}}>
          <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKey} placeholder="Écris ici..." rows={1}
            style={{flex:1,background:"transparent",border:"none",outline:"none",color:"white",fontSize:15,resize:"none",fontFamily:"system-ui,sans-serif",lineHeight:1.5,maxHeight:120,overflowY:"auto",padding:"6px 0",caretColor:"#2D7DD2"}}/>
          <button onClick={sendMessage} disabled={!input.trim()||loading}
            style={{width:38,height:38,borderRadius:"50%",border:"none",cursor:input.trim()&&!loading?"pointer":"default",background:input.trim()&&!loading?"linear-gradient(135deg,#2D7DD2,#5B9FE8)":"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.2s",boxShadow:input.trim()&&!loading?"0 4px 16px rgba(45,125,210,0.3)":"none"}}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M14 8L2 2l3 6-3 6 12-6z" fill={input.trim()&&!loading?"white":"rgba(255,255,255,0.25)"}/>
            </svg>
          </button>
        </div>
        <p style={{fontSize:11,color:"rgba(255,255,255,0.15)",textAlign:"center",marginTop:10}}>Clarity · Pour les cerveaux TDAH 💙</p>
      </div>
    </div>
  );
}
