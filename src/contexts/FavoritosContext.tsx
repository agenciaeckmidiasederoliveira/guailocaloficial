import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface FavoritosContextType {
  favoritos: string[];
  loading: boolean;
  toggleFavorito: (empresaId: string) => Promise<boolean>;
  isFavorito: (empresaId: string) => boolean;
  refetch: () => Promise<void>;
}

const FavoritosContext = createContext<FavoritosContextType | undefined>(undefined);

export function FavoritosProvider({ children }: { children: ReactNode }) {
  const [favoritos, setFavoritos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchFavoritos = useCallback(async () => {
    if (!user) {
      setFavoritos([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("favoritos")
        .select("empresa_id")
        .eq("user_id", user.id);

      if (!error && data) {
        setFavoritos(data.map((f) => f.empresa_id));
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("Erro ao buscar favoritos:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFavoritos();
  }, [fetchFavoritos]);

  const toggleFavorito = useCallback(async (empresaId: string): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Faça login",
        description: "Você precisa estar logado para favoritar empresas.",
        variant: "destructive",
      });
      return false;
    }

    // Prevent double-clicking
    if (togglingIds.has(empresaId)) {
      return false;
    }

    setTogglingIds(prev => new Set(prev).add(empresaId));

    const isFav = favoritos.includes(empresaId);

    try {
      if (isFav) {
        const { error } = await supabase
          .from("favoritos")
          .delete()
          .eq("user_id", user.id)
          .eq("empresa_id", empresaId);

        if (!error) {
          setFavoritos((prev) => prev.filter((id) => id !== empresaId));
          toast({ title: "Removido dos favoritos" });
          return true;
        }
      } else {
        const { error } = await supabase
          .from("favoritos")
          .insert({ user_id: user.id, empresa_id: empresaId });

        if (!error) {
          setFavoritos((prev) => [...prev, empresaId]);
          toast({ title: "Adicionado aos favoritos" });
          return true;
        }
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("Erro ao toggle favorito:", err);
      }
    } finally {
      setTogglingIds(prev => {
        const next = new Set(prev);
        next.delete(empresaId);
        return next;
      });
    }

    return false;
  }, [user, favoritos, toast, togglingIds]);

  const isFavorito = useCallback((empresaId: string) => favoritos.includes(empresaId), [favoritos]);

  return (
    <FavoritosContext.Provider value={{ favoritos, loading, toggleFavorito, isFavorito, refetch: fetchFavoritos }}>
      {children}
    </FavoritosContext.Provider>
  );
}

export function useFavoritosContext() {
  const context = useContext(FavoritosContext);
  if (context === undefined) {
    throw new Error("useFavoritosContext must be used within a FavoritosProvider");
  }
  return context;
}
