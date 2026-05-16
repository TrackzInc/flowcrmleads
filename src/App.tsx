 import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
 import ProspectAiPage from "./pages/ProspectAiPage";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import DashboardPage from "./pages/DashboardPage";
import CaixaPage from "./pages/CaixaPage";
import ContatosPage from "./pages/ContatosPage";
import LeadsPage from "./pages/LeadsPage";
import TarefasPage from "./pages/TarefasPage";
import ProspeccaoPage from "./pages/ProspeccaoPage";
import ServicosPage from "./pages/ServicosPage";
import CalendarioPage from "./pages/CalendarioPage";
import AutomacoesPage from "./pages/AutomacoesPage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<AuthRoute><AuthPage /></AuthRoute>} />
    <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
    <Route path="/caixa" element={<ProtectedRoute><CaixaPage /></ProtectedRoute>} />
    <Route path="/contatos" element={<ProtectedRoute><ContatosPage /></ProtectedRoute>} />
    <Route path="/leads" element={<ProtectedRoute><LeadsPage /></ProtectedRoute>} />
    <Route path="/prospeccao" element={<ProtectedRoute><ProspeccaoPage /></ProtectedRoute>} />
    <Route path="/tarefas" element={<ProtectedRoute><TarefasPage /></ProtectedRoute>} />
    <Route path="/servicos" element={<ProtectedRoute><ServicosPage /></ProtectedRoute>} />
    <Route path="/calendario" element={<ProtectedRoute><CalendarioPage /></ProtectedRoute>} />
     <Route path="/automacoes" element={<ProtectedRoute><AutomacoesPage /></ProtectedRoute>} />
     <Route path="/prospectai" element={<ProtectedRoute><ProspectAiPage /></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
