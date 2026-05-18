import { useState, useEffect } from "react";

interface TravelPackage {
  id: number;
  name: string;
  pricePerPerson: number;
  currency: string;
  personsIncluded: number;
}

interface Travel {
  id: number;
  name: string;
  slug: string;
  destination: string;
  type: string;
  minPrice: number | null;
  coverImage?: { url: string; altText: string };
  packages: TravelPackage[];
  highlights: { icon: string; label: string }[];
}

const API_URL = import.meta.env.PUBLIC_API_URL || "http://localhost:8080";

export default function TravelCards() {
  const [travels, setTravels] = useState<Travel[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetch(`${API_URL}/api/travels`)
      .then((r) => r.json())
      .then((data) => {
        setTravels(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const types = ["all", "ALL_INCLUSIVE", "CRUISE", "CUSTOM"];
  const typeLabels: Record<string, string> = {
    all: "Todos",
    ALL_INCLUSIVE: "Todo Incluido",
    CRUISE: "Cruceros",
    CUSTOM: "A la Medida",
  };

  const filtered = filter === "all" ? travels : travels.filter((t) => t.type === filter);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <section id="viajes" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-dark mb-4">Nuestros Viajes</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Descubre destinos increibles con paquetes diseñados para ti
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              filter === t
                ? "bg-primary text-white"
                : "bg-white text-gray-600 hover:bg-gray-100 border"
            }`}
          >
            {typeLabels[t]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((travel) => (
          <article
            key={travel.id}
            className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition group"
          >
            <a href={`/viajes/${travel.slug}`} className="h-48 bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center relative overflow-hidden block">
              {travel.coverImage ? (
                <img
                  src={travel.coverImage.url}
                  alt={travel.coverImage.altText}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              ) : (
                <span className="text-6xl">
                  {travel.type === "CRUISE" ? "🚢" : travel.type === "CUSTOM" ? "🗺️" : "🏖️"}
                </span>
              )}
              <div className="absolute top-3 right-3 bg-white/90 px-3 py-1 rounded-full text-xs font-semibold text-primary">
                {typeLabels[travel.type]}
              </div>
            </a>

            <div className="p-6">
              <h3 className="text-xl font-bold text-dark mb-2 line-clamp-2">
                <a href={`/viajes/${travel.slug}`} className="hover:text-primary transition">
                  {travel.name}
                </a>
              </h3>
              <p className="text-gray-500 text-sm mb-4 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                {travel.destination}
              </p>

              {travel.highlights && travel.highlights.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {travel.highlights.slice(0, 3).map((h, i) => (
                    <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {h.label}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <span className="text-sm text-gray-500">Desde</span>
                  <p className="text-2xl font-bold text-primary">
                    ${travel.minPrice?.toLocaleString() ?? "0"}
                    <span className="text-sm font-normal text-gray-500"> MXN</span>
                  </p>
                  <span className="text-xs text-gray-400">por persona</span>
                </div>
                <div className="flex flex-col gap-2">
                  <a
                    href={`/viajes/${travel.slug}`}
                    className="bg-primary text-white px-5 py-2.5 rounded-lg hover:bg-primary-dark transition text-sm font-medium text-center"
                  >
                    Ver detalles
                  </a>
                  <a
                    href={`/#chat`}
                    className="border border-primary text-primary px-5 py-2.5 rounded-lg hover:bg-blue-50 transition text-sm font-medium text-center"
                  >
                    Cotizar
                  </a>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No hay viajes disponibles en esta categoria</p>
        </div>
      )}
    </section>
  );
}
