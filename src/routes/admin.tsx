import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { Leaf, LogOut, Plus, Pencil, Trash2, Loader2, ExternalLink, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";
import { supabase, formatEUR, type Categoria, type Item } from "@/lib/supabase";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin")({
  ssr: false,
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (!data.session) navigate({ to: "/login" });
      else setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate({ to: "/login" });
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-to-b from-white via-[#F5F8F3] to-[#EBF0E5]">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#F5F8F3] to-[#EBF0E5]">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="flex items-center justify-between pb-8 flex-wrap gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <div className="grid place-items-center w-10 h-10 rounded-full bg-emerald-600 text-white shadow-sm shrink-0">
              <Leaf className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold tracking-tight text-slate-900">MenuTerra</p>
              <p className="text-xs text-slate-500">Painel de gestão</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl hover:bg-white transition"
            >
              <ExternalLink className="w-4 h-4" />
              Ver menu
            </Link>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
              }}
              className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl hover:bg-white transition"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </header>

        <Tabs defaultValue="categorias" className="w-full">
          <TabsList className="bg-white/70 border border-slate-100 rounded-2xl p-1 h-auto">
            <TabsTrigger
              value="categorias"
              className="rounded-xl px-4 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
            >
              Categorias
            </TabsTrigger>
            <TabsTrigger
              value="itens"
              className="rounded-xl px-4 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
            >
              Pratos &amp; Bebidas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="categorias" className="mt-6">
            <CategoriasPanel />
          </TabsContent>
          <TabsContent value="itens" className="mt-6">
            <ItensPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ------------------- CATEGORIAS -------------------

function CategoriasPanel() {
  const [cats, setCats] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Categoria | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Categoria | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("categorias")
      .select("*")
      .order("ordem", { ascending: true });
    if (error) toast.error("Erro ao carregar categorias", { description: error.message });
    else setCats((data ?? []) as Categoria[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggleActive = async (cat: Categoria) => {
    const next = !cat.esta_ativa;
    setCats((prev) => prev.map((c) => (c.id === cat.id ? { ...c, esta_ativa: next } : c)));
    const { error } = await supabase
      .from("categorias")
      .update({ esta_ativa: next })
      .eq("id", cat.id);
    if (error) {
      toast.error("Erro ao atualizar", { description: error.message });
      load();
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const { error } = await supabase.from("categorias").delete().eq("id", deleting.id);
    if (error) toast.error("Erro ao remover", { description: error.message });
    else {
      toast.success("Categoria removida");
      load();
    }
    setDeleting(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-slate-500">
          {cats.length} {cats.length === 1 ? "categoria" : "categorias"}
        </p>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition"
        >
          <Plus className="w-4 h-4" /> Nova categoria
        </button>
      </div>

      {loading ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
          {cats.length === 0 && (
            <p className="p-8 text-center text-slate-400 text-sm">Sem categorias ainda.</p>
          )}
          {cats.map((c) => (
            <div key={c.id} className="flex items-center gap-4 p-4">
              <div className="w-10 h-10 rounded-full bg-emerald-50 grid place-items-center text-emerald-700 font-semibold shrink-0">
                {c.ordem}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate">{c.nome}</p>
                <p className="text-xs text-slate-500">
                  {c.esta_ativa ? "Visível no menu" : "Oculta"}
                </p>
              </div>
              <Switch checked={c.esta_ativa} onCheckedChange={() => toggleActive(c)} />
              <button
                onClick={() => setEditing(c)}
                className="p-2 rounded-lg hover:bg-slate-50 text-slate-500"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeleting(c)}
                className="p-2 rounded-lg hover:bg-red-50 text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <CategoriaDialog
          categoria={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            load();
          }}
        />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              Atenção: todos os pratos vinculados a "{deleting?.nome}" serão removidos em cascata. Esta ação é irreversível.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CategoriaDialog({
  categoria,
  onClose,
  onSaved,
}: {
  categoria: Categoria | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nome, setNome] = useState(categoria?.nome ?? "");
  const [ordem, setOrdem] = useState<number>(categoria?.ordem ?? 0);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!nome.trim()) {
      toast.error("Nome obrigatório");
      return;
    }
    setSaving(true);
    let error;
    if (categoria) {
      ({ error } = await supabase
        .from("categorias")
        .update({ nome: nome.trim(), ordem })
        .eq("id", categoria.id));
    } else {
      ({ error } = await supabase
        .from("categorias")
        .insert({ nome: nome.trim(), ordem, esta_ativa: true }));
    }
    setSaving(false);
    if (error) {
      toast.error("Erro ao guardar", { description: error.message });
    } else {
      toast.success(categoria ? "Categoria atualizada" : "Categoria criada");
      onSaved();
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{categoria ? "Editar categoria" : "Nova categoria"}</DialogTitle>
          <DialogDescription>Defina o nome e a ordem de exibição.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Nome</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-emerald-400"
              placeholder="Ex: Entradas"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Ordem</label>
            <input
              type="number"
              value={ordem}
              onChange={(e) => setOrdem(parseInt(e.target.value) || 0)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-emerald-400"
            />
          </div>
        </div>
        <DialogFooter>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium inline-flex items-center gap-2 disabled:opacity-60"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Guardar
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ------------------- ITENS -------------------

function ItensPanel() {
  const [itens, setItens] = useState<Item[]>([]);
  const [cats, setCats] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Item | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Item | null>(null);
  const [filterCat, setFilterCat] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    const [i, c] = await Promise.all([
      supabase.from("itens").select("*").order("nome"),
      supabase.from("categorias").select("*").order("ordem"),
    ]);
    if (i.error) toast.error("Erro ao carregar", { description: i.error.message });
    else setItens((i.data ?? []) as Item[]);
    if (c.data) setCats(c.data as Categoria[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggleAvail = async (it: Item) => {
    const next = !it.esta_disponivel;
    setItens((prev) => prev.map((x) => (x.id === it.id ? { ...x, esta_disponivel: next } : x)));
    const { error } = await supabase
      .from("itens")
      .update({ esta_disponivel: next })
      .eq("id", it.id);
    if (error) {
      toast.error("Erro ao atualizar", { description: error.message });
      load();
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    if (deleting.imagem_url && deleting.imagem_url.includes("/menu-images/")) {
      const filePath = deleting.imagem_url.split("/menu-images/")[1];
      if (filePath) {
        await supabase.storage.from("menu-images").remove([filePath]);
      }
    }
    const { error } = await supabase.from("itens").delete().eq("id", deleting.id);
    if (error) toast.error("Erro ao remover", { description: error.message });
    else {
      toast.success("Prato removido");
      load();
    }
    setDeleting(null);
  };

  const filtered = filterCat === "all" ? itens : itens.filter((i) => i.categoria_id === filterCat);

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap">
          <button
            onClick={() => setFilterCat("all")}
            className={
              "px-3 py-1.5 rounded-full text-sm border " +
              (filterCat === "all"
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-slate-600 border-slate-200")
            }
          >
            Todos
          </button>
          {cats.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilterCat(c.id)}
              className={
                "px-3 py-1.5 rounded-full text-sm border " +
                (filterCat === c.id
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white text-slate-600 border-slate-200")
              }
            >
              {c.nome}
            </button>
          ))}
        </div>
        <button
          onClick={() => setCreating(true)}
          disabled={cats.length === 0}
          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-xl transition"
        >
          <Plus className="w-4 h-4" /> Novo prato
        </button>
      </div>

      {cats.length === 0 && !loading && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-4">
          Crie uma categoria antes de adicionar pratos.
        </p>
      )}

      {loading ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((it) => {
            const cat = cats.find((c) => c.id === it.categoria_id);
            return (
              <div
                key={it.id}
                className="flex items-center gap-4 p-3 bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
              >
                {it.imagem_url ? (
                  <img
                    src={it.imagem_url}
                    alt={it.nome}
                    className={
                      "w-16 h-16 rounded-full object-cover shrink-0 " +
                      (!it.esta_disponivel ? "grayscale opacity-70" : "")
                    }
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-100 to-white grid place-items-center shrink-0">
                    <Leaf className="w-6 h-6 text-emerald-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900 truncate">{it.nome}</p>
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    {cat?.nome ?? "—"} · {formatEUR(it.preco)}
                  </p>
                </div>
                <Switch
                  checked={it.esta_disponivel}
                  onCheckedChange={() => toggleAvail(it)}
                />
                <button
                  onClick={() => setEditing(it)}
                  className="p-2 rounded-lg hover:bg-slate-50 text-slate-500"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleting(it)}
                  className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="col-span-full text-center text-slate-400 py-8 text-sm">
              Sem pratos nesta seleção.
            </p>
          )}
        </div>
      )}

      {(creating || editing) && (
        <ItemDialog
          item={editing}
          categorias={cats}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            load();
          }}
        />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover prato?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleting?.nome}" será removido definitivamente, incluindo a imagem associada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ItemDialog({
  item,
  categorias,
  onClose,
  onSaved,
}: {
  item: Item | null;
  categorias: Categoria[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nome, setNome] = useState(item?.nome ?? "");
  const [descricao, setDescricao] = useState(item?.descricao ?? "");
  const [preco, setPreco] = useState<string>(item ? String(item.preco) : "");
  const [categoriaId, setCategoriaId] = useState(item?.categoria_id ?? categorias[0]?.id ?? "");
  const [imagemUrl, setImagemUrl] = useState<string | null>(item?.imagem_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 800,
        fileType: "image/webp",
        useWebWorker: true,
      });
      const rand = Math.random().toString(36).slice(2, 8);
      const filePath = `items/${Date.now()}-${rand}.webp`;
      const { error: upErr } = await supabase.storage
        .from("menu-images")
        .upload(filePath, compressed, {
          contentType: "image/webp",
          upsert: false,
        });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("menu-images").getPublicUrl(filePath);
      // if replacing an existing image, remove the old one from storage
      if (imagemUrl && imagemUrl.includes("/menu-images/")) {
        const oldPath = imagemUrl.split("/menu-images/")[1];
        if (oldPath) supabase.storage.from("menu-images").remove([oldPath]);
      }
      setImagemUrl(data.publicUrl);
      toast.success("Imagem carregada");
    } catch (e: any) {
      toast.error("Erro no upload", { description: e?.message ?? String(e) });
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!nome.trim() || !categoriaId || !preco) {
      toast.error("Nome, categoria e preço são obrigatórios");
      return;
    }
    const precoNum = parseFloat(preco.replace(",", "."));
    if (isNaN(precoNum) || precoNum < 0) {
      toast.error("Preço inválido");
      return;
    }
    setSaving(true);
    const payload = {
      nome: nome.trim(),
      descricao: descricao.trim() || null,
      preco: precoNum,
      categoria_id: categoriaId,
      imagem_url: imagemUrl,
    };
    let error;
    if (item) {
      ({ error } = await supabase.from("itens").update(payload).eq("id", item.id));
    } else {
      ({ error } = await supabase.from("itens").insert({ ...payload, esta_disponivel: true }));
    }
    setSaving(false);
    if (error) toast.error("Erro ao guardar", { description: error.message });
    else {
      toast.success(item ? "Prato atualizado" : "Prato criado");
      onSaved();
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{item ? "Editar prato" : "Novo prato"}</DialogTitle>
          <DialogDescription>
            Imagens são comprimidas automaticamente para WebP (máx. 300KB, 800px).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-emerald-100 to-white grid place-items-center shrink-0 border border-slate-200 hover:border-emerald-300 transition"
            >
              {uploading ? (
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              ) : imagemUrl ? (
                <img src={imagemUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <ImagePlus className="w-6 h-6 text-emerald-500" />
              )}
            </button>
            <div className="text-sm text-slate-500 min-w-0">
              <p className="font-medium text-slate-700">Foto do prato</p>
              <p>Clique na imagem para {imagemUrl ? "substituir" : "carregar"}.</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Nome</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-emerald-400"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Descrição</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-emerald-400 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Preço (EUR)</label>
              <input
                inputMode="decimal"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                placeholder="0.00"
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Categoria</label>
              <select
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-emerald-400 bg-white"
              >
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={saving || uploading}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium inline-flex items-center gap-2 disabled:opacity-60"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Guardar
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}