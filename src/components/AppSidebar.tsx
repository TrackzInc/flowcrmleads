import { LayoutDashboard, Wallet, Users, Target, CheckSquare } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const items = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Caixa', url: '/caixa', icon: Wallet },
  { title: 'Contatos', url: '/contatos', icon: Users },
  { title: 'Leads', url: '/leads', icon: Target },
  { title: 'Tarefas', url: '/tarefas', icon: CheckSquare },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();

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
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
