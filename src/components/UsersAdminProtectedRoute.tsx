import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface UsersAdminProtectedRouteProps {
  children: React.ReactNode;
}

export default function UsersAdminProtectedRoute({ children }: UsersAdminProtectedRouteProps) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkAdminStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          if (isMounted) {
            setIsAdmin(false);
            setLoading(false);
          }
          return;
        }

        // Verificar se o usuário é admin
        const { data: adminData, error } = await supabase
          .from('admin_users')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (isMounted) {
          if (error) {
            console.error('Erro ao verificar status admin:', error);
            setIsAdmin(false);
          } else {
            setIsAdmin(!!adminData);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Erro na verificação de admin:', error);
        if (isMounted) {
          setIsAdmin(false);
          setLoading(false);
        }
      }
    };

    checkAdminStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-400">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/users-admin/login" replace />;
  }

  return <>{children}</>;
}