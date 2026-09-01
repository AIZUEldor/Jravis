"use client";
import { FormEvent, useEffect, useState } from "react";

const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
type User = { id: string; name: string; email: string };
type CommandResult = { status: "planned" | "clarification_required"; brain: { intent: string; confidence: number; clarificationQuestion?: string }; plan: { id: string; summary: string; status: string; steps: { description: string; capability: { name: string; risk: string } }[] } };

export default function Home() {
  const [token, setToken] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [auth, setAuth] = useState({ name: "", email: "", password: "" });
  const [text, setText] = useState("");
  const [result, setResult] = useState<CommandResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem("jravis_session");
    if (!saved) return;
    fetch(`${api}/v1/auth/me`, { headers: { authorization: `Bearer ${saved}` } }).then(async (response) => {
      if (!response.ok) throw new Error(); setToken(saved); setUser(await response.json());
    }).catch(() => sessionStorage.removeItem("jravis_session"));
  }, []);

  async function authenticate(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch(`${api}/v1/auth/${authMode}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(authMode === "register" ? auth : { email: auth.email, password: auth.password }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error?.message ?? "Kirish amalga oshmadi");
      sessionStorage.setItem("jravis_session", data.token); setToken(data.token); setUser(data.user);
    } catch (value) { setError(value instanceof Error ? value.message : "Xatolik"); } finally { setBusy(false); }
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setResult(null);
    try {
      const response = await fetch(`${api}/v1/commands`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify({ text, source: "text" }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error?.message ?? "Buyruq qabul qilinmadi");
      setResult(data); setText("");
    } catch (value) { setError(value instanceof Error ? value.message : "Xatolik"); } finally { setBusy(false); }
  }

  async function decide(approved: boolean) {
    if (!result) return; setBusy(true); setError("");
    try {
      const response = await fetch(`${api}/v1/plans/${result.plan.id}/decision`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify({ approved }) });
      const plan = await response.json(); if (!response.ok) throw new Error(plan.error?.message ?? "Qaror bajarilmadi");
      setResult({ ...result, plan });
    } catch (value) { setError(value instanceof Error ? value.message : "Xatolik"); } finally { setBusy(false); }
  }

  function logout() {
    void fetch(`${api}/v1/auth/logout`, { method: "POST", headers: { authorization: `Bearer ${token}` } });
    sessionStorage.removeItem("jravis_session"); setToken(""); setUser(null); setResult(null);
  }

  if (!user) return <main><section className="authCard"><div className="brand">JRAVIS <span>●</span></div><p className="eyebrow">XAVFSIZ SHAXSIY YORDAMCHI</p><h2>{authMode === "register" ? "Hisob yarating" : "Xush kelibsiz"}</h2><p className="lead">Har bir reja, ruxsat va bajarilgan amal faqat sizning hisobingizga bog‘lanadi.</p><form className="authForm" onSubmit={authenticate}>{authMode === "register" && <input placeholder="Ismingiz" value={auth.name} onChange={(event) => setAuth({ ...auth, name: event.target.value })} required/>}<input type="email" placeholder="Email" value={auth.email} onChange={(event) => setAuth({ ...auth, email: event.target.value })} required/><input type="password" placeholder="Parol (kamida 10 belgi va raqam)" value={auth.password} onChange={(event) => setAuth({ ...auth, password: event.target.value })} minLength={10} required/><button disabled={busy}>{busy ? "Kutilmoqda…" : authMode === "register" ? "Hisob yaratish →" : "Kirish →"}</button></form>{error && <p className="error">{error}</p>}<button className="linkButton" onClick={() => setAuthMode(authMode === "register" ? "login" : "register")}>{authMode === "register" ? "Hisobingiz bormi? Kirish" : "Yangi hisob yaratish"}</button></section></main>;

  return <main><section className="hero"><header><div className="brand">JRAVIS <span>●</span></div><div className="profile"><span>{user.name}</span><button className="linkButton" onClick={logout}>Chiqish</button></div></header><p className="eyebrow">MARKAZIY MIYA · COMMAND ROUTER</p><h1>Ayting. Yozing.<br/><em>Jravis yo‘naltiradi.</em></h1><p className="lead">Buyruq tahlil qilinadi, kerakli capability tanlanadi va bajarishdan oldin sizga reja ko‘rsatiladi.</p><form onSubmit={submit}><textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Masalan: Telegramda @username ga uchrashuv vaqtini yubor..." required/><button disabled={busy}>{busy ? "Tahlil qilinmoqda…" : "Reja tuzish →"}</button></form>{error && <p className="error">{error}</p>}{result && <div className="brainResult"><div className="brainMeta"><b>{result.brain.intent}</b><span>{Math.round(result.brain.confidence * 100)}% ishonch</span></div>{result.status === "clarification_required" ? <p className="question">{result.brain.clarificationQuestion}</p> : <><p>{result.plan.summary}</p><ul>{result.plan.steps.map((step) => <li key={step.capability.name}><span>{step.description}</span><small>{step.capability.name} · {step.capability.risk}</small></li>)}</ul>{result.plan.status === "awaiting_approval" && <div className="actions"><button className="deny" onClick={() => void decide(false)}>Bekor qilish</button><button onClick={() => void decide(true)}>Tasdiqlash va bajarish</button></div>}<p className={`status ${result.plan.status}`}>{result.plan.status}</p></>}</div>}</section></main>;
}
