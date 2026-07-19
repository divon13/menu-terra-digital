import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type Categoria = {
  id: string;
  nome: string;
  ordem: number;
  esta_ativa: boolean;
};

export type Item = {
  id: string;
  categoria_id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  imagem_url: string | null;
  esta_disponivel: boolean;
};

export const formatKwanza = (value: number) =>
  new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA" }).format(
    Number(value ?? 0),
  );