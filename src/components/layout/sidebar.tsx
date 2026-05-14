'use client'

import {
  LayoutDashboard,
  Users,
  Monitor,
  Settings,
  FileBarChart,
  ClipboardCheck,
  History,
  UserCircle,
  LogOut,
  Fingerprint,
  MapPin,
  Clock,
  UserCheck,
  Tag,
  Eye,
} from 'lucide-react'
import { useAuthStore, useAppStore } from '@/store'
import type { AppView } from '@/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface NavItem {
  title: string
  view: AppView
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

// Admin nav groups
const mainItems: NavItem[] = [
  {
    title: 'Dashboard',
    view: 'admin-dashboard',
    icon: LayoutDashboard,
  },
]

const managementItems: NavItem[] = [
  {
    title: 'Kelola Pegawai',
    view: 'admin-employees',
    icon: Users,
  },
  {
    title: 'Monitoring Absensi',
    view: 'admin-attendance',
    icon: Monitor,
  },
  {
    title: 'Izin / Cuti / Dinas',
    view: 'admin-leaves',
    icon: ClipboardCheck,
  },
  {
    title: 'Tipe Cuti/Izin',
    view: 'admin-leave-types',
    icon: Tag,
  },
]

const reportItems: NavItem[] = [
  {
    title: 'Laporan',
    view: 'admin-reports',
    icon: FileBarChart,
  },
  {
    title: 'Laporan Pegawai',
    view: 'admin-employee-report',
    icon: UserCheck,
  },
]

const settingItems: NavItem[] = [
  {
    title: 'Lokasi Kantor',
    view: 'admin-offices',
    icon: MapPin,
  },
  {
    title: 'Jam Kerja',
    view: 'admin-shifts',
    icon: Clock,
  },
  {
    title: 'Pengaturan',
    view: 'admin-settings',
    icon: Settings,
  },
]

const employeeNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    view: 'employee-dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Riwayat Absensi',
    view: 'employee-history',
    icon: History,
  },
  {
    title: 'Monitor Kehadiran',
    view: 'employee-monitoring',
    icon: Eye,
  },
  {
    title: 'Pengajuan Izin/Cuti',
    view: 'employee-leaves',
    icon: ClipboardCheck,
  },
  {
    title: 'Profil',
    view: 'employee-profile',
    icon: UserCircle,
  },
]

function NavItemRenderer({ item, isActive, onClick }: { item: NavItem; isActive: boolean; onClick: () => void }) {
  const Icon = item.icon

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        onClick={onClick}
        tooltip={item.title}
        className={`
          group relative transition-all duration-200
          ${
            isActive
              ? 'bg-[#1e40af] text-white font-semibold shadow-lg shadow-blue-500/25 hover:bg-[#1e40af]/90 hover:text-white'
              : 'hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-[#1e40af] dark:hover:text-blue-300'
          }
        `}
      >
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-white" />
        )}
        <Icon className={`size-4 ${isActive ? 'text-white' : ''}`} />
        <span>{item.title}</span>
        {item.badge && (
          <Badge
            variant="secondary"
            className={`ml-auto text-[10px] px-1.5 py-0 h-4 ${
              isActive
                ? 'bg-white/20 text-white border-white/30'
                : 'bg-[#1e40af]/10 text-[#1e40af] dark:bg-blue-900/30 dark:text-blue-300 border-[#1e40af]/20'
            }`}
          >
            {item.badge}
          </Badge>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function AppSidebar() {
  const { user, hasRole, logout } = useAuthStore()
  const { currentView, setCurrentView, sidebarOpen, setSidebarOpen } = useAppStore()

  const isAdmin = hasRole('ADMIN')

  const handleNavClick = (view: AppView) => {
    setCurrentView(view)
    setSidebarOpen(false)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Sidebar
      collapsible="icon"
    >
      {/* Header with branding */}
      <SidebarHeader className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="hover:bg-white/10"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#1e40af] text-white shadow-md">
                <Fingerprint className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold text-[#1e3a8a] dark:text-blue-300">
                  Absensi
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  Sistem Pegawai
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator className="bg-blue-100 dark:bg-blue-900/40" />

      {/* Navigation */}
      <SidebarContent>
        <ScrollArea className="h-full">
          {isAdmin ? (
            <>
              {/* Main */}
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-[#1e40af]/70 dark:text-blue-400/70">
                  Utama
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {mainItems.map((item) => (
                      <NavItemRenderer
                        key={item.view}
                        item={item}
                        isActive={currentView === item.view}
                        onClick={() => handleNavClick(item.view)}
                      />
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              <SidebarSeparator className="bg-blue-100/50 dark:bg-blue-900/30" />

              {/* Management */}
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-[#1e40af]/70 dark:text-blue-400/70">
                  Manajemen
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {managementItems.map((item) => (
                      <NavItemRenderer
                        key={item.view}
                        item={item}
                        isActive={currentView === item.view}
                        onClick={() => handleNavClick(item.view)}
                      />
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              <SidebarSeparator className="bg-blue-100/50 dark:bg-blue-900/30" />

              {/* Reports */}
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-[#1e40af]/70 dark:text-blue-400/70">
                  Laporan
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {reportItems.map((item) => (
                      <NavItemRenderer
                        key={item.view}
                        item={item}
                        isActive={currentView === item.view}
                        onClick={() => handleNavClick(item.view)}
                      />
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              <SidebarSeparator className="bg-blue-100/50 dark:bg-blue-900/30" />

              {/* Settings */}
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-[#1e40af]/70 dark:text-blue-400/70">
                  Pengaturan
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {settingItems.map((item) => (
                      <NavItemRenderer
                        key={item.view}
                        item={item}
                        isActive={currentView === item.view}
                        onClick={() => handleNavClick(item.view)}
                      />
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </>
          ) : (
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-[#1e40af]/70 dark:text-blue-400/70">
                Menu Pegawai
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {employeeNavItems.map((item) => (
                    <NavItemRenderer
                      key={item.view}
                      item={item}
                      isActive={currentView === item.view}
                      onClick={() => handleNavClick(item.view)}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </ScrollArea>
      </SidebarContent>

      <SidebarSeparator className="bg-blue-100 dark:bg-blue-900/40" />

      {/* Footer with user info */}
      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="hover:bg-blue-50 dark:hover:bg-blue-950/50 data-[state=open]:bg-blue-50 dark:data-[state=open]:bg-blue-950/50"
                >
                  <Avatar className="h-8 w-8 ring-2 ring-[#1e40af]/20">
                    <AvatarImage
                      src={user?.photo ?? undefined}
                      alt={user?.nama ?? 'User'}
                    />
                    <AvatarFallback className="bg-[#1e40af] text-white text-xs font-semibold">
                      {user?.nama ? getInitials(user.nama) : '??'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold text-foreground">
                      {user?.nama ?? 'User'}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.nip ?? '-'}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`ml-auto text-[10px] px-1.5 py-0 h-4 border-current ${
                      isAdmin
                        ? 'text-[#1e40af] dark:text-blue-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {isAdmin ? 'Admin' : 'Pegawai'}
                  </Badge>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
              >
                <div className="px-2 py-1.5">
                  <p className="text-sm font-semibold">{user?.nama}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setCurrentView(isAdmin ? 'admin-dashboard' : 'employee-dashboard')}
                  className="cursor-pointer"
                >
                  <LayoutDashboard className="mr-2 size-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setCurrentView('employee-profile')}
                  className="cursor-pointer"
                >
                  <UserCircle className="mr-2 size-4" />
                  Profil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 size-4" />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail className="bg-blue-100 dark:bg-blue-900/40" />
    </Sidebar>
  )
}
