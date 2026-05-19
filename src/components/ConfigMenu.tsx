import { Settings } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';

export const ConfigMenu = () => (
  <SidebarMenu>
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <NavLink to="/configuracoes/templates">
          <Settings className="mr-2 h-4 w-4" />
          <span>Configurações</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  </SidebarMenu>
);
