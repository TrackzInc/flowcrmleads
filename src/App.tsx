import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardPage from "./pages/DashboardPage";
import CaixaPage from "./pages/CaixaPage";
import ContatosPage from "./pages/ContatosPage";
import LeadsPage from "./pages/LeadsPage";
import TarefasPage from "./pages/TarefasPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/caixa" element={<CaixaPage />} />
          <Route path="/contatos" element={<ContatosPage />} />
          <Route path="/leads" element={<LeadsPage />} />
          <Route path="/tarefas" element={<TarefasPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
