import { useMemo } from 'react';
import { LayoutDashboard, Wallet, Users, Target, CheckSquare, LogOut, Crosshair, Briefcase, CalendarDays, Download } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { useContacts } from '@/hooks/useStore';
import { isOverdue } from '@/lib/helpers';
import { Button } from '@/components/ui/button';
import { ExportButton } from '@/components/ExportButton';
import logoImg from '@/assets/logo.png';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

const items = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Caixa', url: '/caixa', icon: Wallet },
  { title: 'Contatos', url: '/contatos', icon: Users },
  { title: 'Leads', url: '/leads', icon: Target },
  { title: 'Prospecção', url: '/prospeccao', icon: Crosshair },
  { title: 'Tarefas', url: '/tarefas', icon: CheckSquare },
  { title: 'Calendário', url: '/calendario', icon: CalendarDays },
  { title: 'Serviços', url: '/servicos', icon: Briefcase },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { signOut, user } = useAuth();
  const { data: contacts = [] } = useContacts();

  const overdueLeadsCount = useMemo(() => {
    return contacts.filter(c => c.is_lead && c.next_contact_date && isOverdue(c.next_contact_date)).length;
  }, [contacts]);

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="pt-4">
        <div className={`px-4 pb-4 ${collapsed ? 'text-center' : ''}`}>
          <h1 className={`font-bold text-sidebar-primary ${collapsed ? 'text-sm' : 'text-xl'}`}>
            {collapsed ? 'F' : 'FlowCRM'}
          </h1>
          {!collapsed && <p className="text-xs text-sidebar-muted mt-0.5">Seu negócio em controle</p>}
        </div>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="hover:bg-sidebar-accent/50 relative"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                      {item.url === '/leads' && overdueLeadsCount > 0 && (
                        <span className="ml-auto flex items-center">
                          <span className="bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                            {overdueLeadsCount}
                          </span>
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-3">
        {!collapsed && <ExportButton />}
        {!collapsed && user && (
          <p className="text-xs text-sidebar-muted truncate my-2">{user.email}</p>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 mr-2 shrink-0" />
          {!collapsed && 'Sair'}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
