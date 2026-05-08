import { useEffect, useRef, useState } from "react";
import "./TempRagChat.css";

const INITIAL_MESSAGES = [
  {
    role: "assistant",
    content:
      "Hola, soy el asistente demo de la agencia. Puedo ayudarte a explorar viajes, comparar opciones y preparar una cotizacion inicial. No proceso pagos; para eso siempre te conecto con un asesor humano.",
  },
];

const SUGGESTIONS = [
  "Quiero un viaje familiar a Cancun",
  "Tengo presupuesto de 30 mil para dos personas",
  "Que incluye el crucero por el Caribe?",
  "Como funciona el anticipo y el saldo?",
];

const DEMO_PHONE = "+521234567890";

export default function TempRagChat({ ragApiUrl, phone = DEMO_PHONE }) {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [responseTime, setResponseTime] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text) {
    const message = text.trim();
    if (!message || loading) return;

    const nextMessages = [...messages, { role: "user", content: message }];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const startTime = performance.now();
      const response = await fetch(`${ragApiUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          phone,
          history: messages.filter(
            (item) => item.role === "user" || item.role === "assistant",
          ),
        }),
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      setResponseTime(duration);

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(
          detail || "El servicio RAG no respondio correctamente.",
        );
      }

      const data = await response.json();
      const sourceLabel = data.sources?.length
        ? `\n\nFuentes demo: ${data.sources.join(", ")}`
        : "";
      setMessages([
        ...nextMessages,
        { role: "assistant", content: `${data.answer}${sourceLabel}` },
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error inesperado al consultar el RAG.",
      );
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content:
            "Tuve un problema consultando el demo RAG. Verifica que el servicio Python este activo en el puerto 8001.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function submit(event) {
    event.preventDefault();
    sendMessage(input);
  }

  return (
    <main className="demo-shell">
      <section className="hero-card">
        <p className="eyebrow">Demo privado</p>
        <h1>Asistente RAG para agencia de viajes</h1>
        <p className="hero-copy">
          Prueba una conversacion con datos demo de paquetes, cruceros,
          politicas y FAQs. El objetivo es mostrar como el asistente puede
          atender clientes antes de escalar a un asesor.
        </p>
        <div className="status-row">
          <span>RAG API: {ragApiUrl}</span>
          <span>Pagos: solo asesor humano</span>
        </div>
      </section>

      <section className="chat-panel" aria-label="Chat demo RAG">
        <div className="messages">
          {messages.map((message, index) => (
            <article
              className={`message ${message.role}`}
              key={`${message.role}-${index}`}
            >
              <span>
                {message.role === "assistant" ? "Asistente" : "Cliente"}
              </span>
              <p>{message.content}</p>
            </article>
          ))}
          {loading && (
            <article className="message assistant thinking">
              <span>Asistente</span>
              <p>Consultando conocimiento de viajes...</p>
            </article>
          )}
          <div ref={scrollRef} />
        </div>
        {responseTime && (
          <p className="debug-timer">
            ⏱️ Tiempo de respuesta: {responseTime.toFixed(0)} ms
          </p>
        )}

        <div className="suggestions" aria-label="Preguntas sugeridas">
          {SUGGESTIONS.map((suggestion) => (
            <button
              type="button"
              key={suggestion}
              onClick={() => sendMessage(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>

        {error && <p className="error">{error}</p>}

        <form className="composer" onSubmit={submit}>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Escribe una pregunta sobre destinos, paquetes, pagos o cotizaciones..."
            rows={2}
          />
          <button type="submit" disabled={!input.trim()}>
            Enviar
          </button>
        </form>
      </section>
    </main>
  );
}
