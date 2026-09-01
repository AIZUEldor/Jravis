"use client";
import { FormEvent, useState } from "react";

type Result = { id: string; intent: string; summary: string };
export default function Home() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setResult(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/v1/commands`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text, source: "text" }) });
      if (!response.ok) throw new Error("Buyruq yuborilmadi");
      setResult(await response.json()); setText("");
    } finally { setBusy(false); }
  }
  return <main><section className="hero"><div className="brand">JRAVIS <span>●</span></div><p className="eyebrow">SIZNING RAQAMLI IKKINCHI MIYANGIZ</p><h1>Ayting. Yozing.<br/><em>Jravis bajaradi.</em></h1><p className="lead">Vazifalar, eslatmalar, qaydlar va murakkab jarayonlarni bitta tabiiy buyruq bilan boshqaring.</p><form onSubmit={submit}><textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Masalan: Ertaga soat 9:00 da uchrashuvni eslat..." required/><button disabled={busy}>{busy ? "Qabul qilinmoqda…" : "Buyruqni bajarish →"}</button></form>{result && <div className="result"><b>{result.intent}</b><span>{result.summary}</span></div>}<div className="features"><article>01<br/><b>Ovoz va matn</b><small>Istalgan usulda buyruq bering</small></article><article>02<br/><b>Aqlli xotira</b><small>Muhim kontekstni bir joyda saqlang</small></article><article>03<br/><b>Avtomatlashtirish</b><small>Takroriy ishlarni Jravisga bering</small></article></div></section></main>;
}

