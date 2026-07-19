import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Leaf } from "lucide-react";
import { supabase, formatKwanza, type Categoria, type Item } from "@/lib/supabase";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MenuTerra — Menu Digital" },
      { name: "description", content: "Descubra o nosso menu fresco e sazonal." },
    ],
  }),
  component: MenuPublico,
});

function MenuPublico() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [itens, setItens] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    (async () => {
      const [cats, its] = await Promise.all([
        supabase
          .from("categorias")
          .select("*")
          .eq("esta_ativa", true)
          .order("ordem", { ascending: true }),
        supabase.from("itens").select("*"),
      ]);
      if (cats.data) setCategorias(cats.data as Categoria[]);
      if (its.data) setItens(its.data as Item[]);
      if (cats.data && cats.data.length) setActiveCat((cats.data[0] as Categoria).id);
      setLoading(false);
    })();
  }, []);

  const filteredItens = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return itens;
    return itens.filter((i) => i.nome.toLowerCase().includes(q));
  }, [itens, query]);

  const scrollToCat = (id: string) => {
    setActiveCat(id);
    const el = sectionRefs.current[id];
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 140;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#F5F8F3] to-[#EBF0E5]">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="flex items-center justify-between pt-8 pb-6">
          <div className="flex items-center gap-2">
            <div className="grid place-items-center w-10 h-10 rounded-full bg-emerald-600 text-white shadow-sm">
              <Leaf className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              MenuTerra
            </span>
          </div>
        </header>

        {/* Hero title */}
        <div className="pb-6">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            O nosso menu
          </h1>
          <p className="text-slate-500 mt-1">
            Ingredientes frescos, feito com cuidado todos os dias.
          </p>
        </div>

        {/* Search */}
        <div className="relative pb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar pratos..."
            className="w-full bg-white rounded-2xl pl-12 pr-4 py-4 text-slate-900 placeholder:text-slate-400 shadow-[0_8px_30px_rgba(0,0,0,0.02)] border border-slate-100 outline-none focus:border-emerald-300 transition"
          />
        </div>
      </div>

      {/* Sticky category nav */}
      <div className="sticky top-0 z-20 bg-gradient-to-b from-white/95 via-white/85 to-white/70 backdrop-blur-md">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-3 py-3 overflow-x-auto whitespace-nowrap scrollbar-none">
            {categorias.map((c) => {
              const isActive = activeCat === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => scrollToCat(c.id)}
                  className={
                    "px-4 py-2 rounded-full text-sm font-medium transition border " +
                    (isActive
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-white text-slate-600 border-slate-100 hover:border-emerald-200")
                  }
                >
                  {c.nome}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 pt-4">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse flex items-center gap-4 p-4 bg-white/60 rounded-2xl"
              >
                <div className="w-20 h-20 rounded-full bg-emerald-50" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-2/3" />
                  <div className="h-3 bg-slate-100 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          categorias.map((c) => {
            const catItens = filteredItens.filter((i) => i.categoria_id === c.id);
            if (catItens.length === 0 && query.trim()) return null;
            return (
              <section
                key={c.id}
                ref={(el: HTMLElement | null) => {
                  sectionRefs.current[c.id] = el;
                }}
                className="pt-8"
              >
                <div className="flex items-baseline gap-2 pb-4">
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                    {c.nome}
                  </h2>
                  <span className="text-slate-400 text-sm">
                    {`• ${catItens.length} ${catItens.length === 1 ? "item" : "itens"}`}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {catItens.map((it) => (
                    <MenuItemCard key={it.id} item={it} onSelect={setSelectedItem} />
                  ))}
                  {catItens.length === 0 && (
                    <p className="text-slate-400 text-sm">Sem itens nesta categoria.</p>
                  )}
                </div>
              </section>
            );
          })
        )}

        {!loading && filteredItens.length === 0 && query.trim() && (
          <div className="text-center py-16 text-slate-500">
            Nenhum prato encontrado para "{query}".
          </div>
        )}
      </main>

      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        {selectedItem && (
          <DialogContent className="max-w-md overflow-hidden p-0 rounded-3xl border-0 shadow-2xl bg-white w-[92vw] sm:w-full">
            {selectedItem.imagem_url ? (
              <div className="w-full h-56 sm:h-64 relative">
                <img
                  src={selectedItem.imagem_url}
                  alt={selectedItem.nome}
                  className="w-full h-full object-cover"
                />
                {!selectedItem.esta_disponivel && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] grid place-items-center">
                    <span className="text-white font-medium px-4 py-2 bg-slate-900/80 rounded-full text-xs tracking-wide">
                      Esgotado por hoje
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-32 bg-gradient-to-br from-emerald-50 via-emerald-100 to-white grid place-items-center border-b border-slate-100">
                <Leaf className="w-10 h-10 text-emerald-400" />
              </div>
            )}
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <DialogTitle className="text-xl font-bold text-slate-900 leading-snug">
                  {selectedItem.nome}
                </DialogTitle>
                <span className="shrink-0 text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 px-3.5 py-1 rounded-full text-base">
                  {formatKwanza(selectedItem.preco)}
                </span>
              </div>
              
              {selectedItem.descricao && (
                <div className="mt-4">
                  <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Detalhes</h4>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                    {selectedItem.descricao}
                  </p>
                </div>
              )}

              {!selectedItem.esta_disponivel && !selectedItem.imagem_url && (
                <span className="inline-block mt-4 text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200 rounded-full px-2.5 py-0.5">
                  Esgotado por hoje
                </span>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

function MenuItemCard({ item, onSelect }: { item: Item; onSelect: (item: Item) => void }) {
  const esgotado = !item.esta_disponivel;
  return (
    <div
      onClick={() => onSelect(item)}
      className={
        "flex items-center gap-4 w-full p-3 rounded-2xl bg-white/70 border border-white transition hover:bg-white hover:shadow-sm cursor-pointer " +
        (esgotado ? "opacity-60" : "")
      }
    >
      <div className="shrink-0 relative">
        {item.imagem_url ? (
          <img
            src={item.imagem_url}
            alt={item.nome}
            className={
              "w-20 h-20 md:w-24 md:h-24 rounded-full object-cover shadow-md " +
              (esgotado ? "grayscale" : "")
            }
          />
        ) : (
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full shadow-md bg-gradient-to-br from-emerald-100 via-emerald-50 to-white grid place-items-center">
            <Leaf className="w-8 h-8 text-emerald-400" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-slate-900 leading-snug">{item.nome}</h3>
          <span className="shrink-0 text-emerald-700 font-bold bg-emerald-50/80 border border-emerald-100 px-3 py-0.5 rounded-full text-sm">
            {formatKwanza(item.preco)}
          </span>
        </div>
        {item.descricao && (
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">
            {item.descricao}
          </p>
        )}
        {esgotado && (
          <span className="inline-block mt-2 text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5">
            Esgotado por hoje
          </span>
        )}
      </div>
    </div>
  );
}