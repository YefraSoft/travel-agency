import { useState, useEffect } from "react";

const API_URL = import.meta.env.PUBLIC_API_URL || "http://localhost:8080";
const WHATSAPP = import.meta.env.PUBLIC_WHATSAPP_NUMBER || "+521XXXXXXXXXX";

interface Escalation {
  id: number;
  phone: string;
  reason: string;
  clientQuestion: string;
  context: string | null;
  suggestedAction: string | null;
  status: string;
  createdAt: string;
}

interface ChatMessage {
  type: string;
  content: string;
}

interface ChatData {
  id: number;
  customerId: number | null;
  attendedBy: string;
  closedBy: string | null;
  chatHistory: ChatMessage[];
  contextSummary: string | null;
}

export default function AdminDashboard() {
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [selectedEscalation, setSelectedEscalation] = useState<Escalation | null>(null);
  const [chatData, setChatData] = useState<ChatData | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchEscalations = () => {
    fetch(`${API_URL}/api/rag/escalations/pending`)
      .then((r) => r.json())
      .then((data) => setEscalations(data))
      .catch(() => setEscalations([]));
  };

  useEffect(() => {
    fetchEscalations();
    const interval = setInterval(fetchEscalations, 10000);
    return () => clearInterval(interval);
  }, []);

  const selectEscalation = async (esc: Escalation) => {
    setSelectedEscalation(esc);
    try {
      const res = await fetch(`${API_URL}/api/rag/chats/${encodeURIComponent(esc.phone)}`);
      if (res.ok) {
        const data = await res.json();
        setChatData(data);
      } else {
        setChatData(null);
      }
    } catch {
      setChatData(null);
    }
  };

  const markResolved = async () => {
    if (!selectedEscalation) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/rag/escalations/${selectedEscalation.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved", attendedBy: "admin" }),
      });
      if (!res.ok) throw new Error("No se pudo resolver la escalacion");
      setSelectedEscalation(null);
      setChatData(null);
      fetchEscalations();
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const sendWhatsApp = () => {
    if (!selectedEscalation) return;
    const text = replyMessage || `Hola, soy un asesor de Go Diego. Vi tu consulta: "${selectedEscalation.clientQuestion}". Como puedo ayudarte?`;
    const url = `https://wa.me/${selectedEscalation.phone.replace("+", "")}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-dark">Dashboard — Escalaciones</h1>
        <span className="text-sm text-gray-500">{escalations.length} pendientes</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 p-6" style={{ height: "calc(100vh - 4rem)" }}>
        {/* Left panel: Escalations list */}
        <div className="lg:w-96 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h2 className="font-semibold text-sm text-gray-600">Chats Pendientes</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {escalations.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>No hay escalaciones pendientes</p>
              </div>
            ) : (
              <ul className="divide-y">
                {escalations.map((esc) => (
                  <li
                    key={esc.id}
                    onClick={() => selectEscalation(esc)}
                    className={`p-4 cursor-pointer hover:bg-blue-50 transition ${
                      selectedEscalation?.id === esc.id ? "bg-blue-50 border-l-4 border-primary" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{esc.phone}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        esc.reason === "payment" ? "bg-red-100 text-red-700" :
                        esc.reason === "complex_request" ? "bg-yellow-100 text-yellow-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {esc.reason === "payment" ? "Pago" : esc.reason === "complex_request" ? "Complejo" : "Sin info"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{esc.clientQuestion}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(esc.createdAt).toLocaleString("es-MX")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right panel: Chat view */}
        <div className="flex-1 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
          {selectedEscalation ? (
            <>
              <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">{selectedEscalation.phone}</h2>
                  <p className="text-xs text-gray-500">{selectedEscalation.clientQuestion}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={sendWhatsApp}
                    className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-600 transition flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    </svg>
                    WhatsApp
                  </button>
                  <button
                    onClick={markResolved}
                    disabled={loading}
                    className="bg-primary text-white px-3 py-1.5 rounded-lg text-sm hover:bg-primary-dark transition disabled:opacity-50"
                  >
                    {loading ? "..." : "Resolver"}
                  </button>
                </div>
              </div>

              {/* Chat history */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
                {chatData?.chatHistory?.map((msg, i) => (
                  <div key={i} className={`flex ${msg.type === "HUMAN" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                      msg.type === "HUMAN"
                        ? "bg-primary text-white rounded-br-none"
                        : "bg-white text-gray-700 shadow-sm rounded-bl-none"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {!chatData?.chatHistory?.length && (
                  <p className="text-center text-gray-400 text-sm py-8">Sin historial de chat</p>
                )}
              </div>

              {/* Reply input */}
              <div className="border-t p-3 flex gap-2">
                <input
                  type="text"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Escribe un mensaje para enviar por WhatsApp..."
                  className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={sendWhatsApp}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
                >
                  Enviar
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>Selecciona una escalacion para ver el chat</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
