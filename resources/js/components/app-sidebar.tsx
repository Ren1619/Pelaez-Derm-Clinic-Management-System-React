import { Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    ArrowLeftRight,
    CalendarClock,
    Boxes,
    Building2,
    FolderGit2,
    LayoutGrid,
    MessageSquareText,
    Sparkles,
    ShoppingCart,
    ScrollText,
    Settings2,
    Tags,
    UserRound,
    Users,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { index as appointmentsIndex } from '@/routes/appointments';
import { index as branchesIndex } from '@/routes/branches';
import { index as categoriesIndex } from '@/routes/categories';
import { index as distributionsIndex } from '@/routes/distributions';
import { index as feedbackIndex } from '@/routes/feedback';
import { index as inventoryIndex } from '@/routes/inventory';
import { index as logsIndex } from '@/routes/logs';
import { index as patientsIndex } from '@/routes/patients';
import { index as posIndex } from '@/routes/pos';
import { index as reportsIndex } from '@/routes/reports';
import { index as servicesIndex } from '@/routes/services';
import { index as staffIndex } from '@/routes/staff';
import { index as systemSettingsIndex } from '@/routes/system-settings';
import type { Auth, NavItem } from '@/types';

type StaffModule = Auth['permissions']['modules'][number];
type ModuleNavItem = NavItem & { module: StaffModule };

const mainNavItems: ModuleNavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
        module: 'dashboard',
    },
    {
        title: 'Patients Records',
        href: patientsIndex(),
        icon: UserRound,
        module: 'patients',
    },
    {
        title: 'Appointments',
        href: appointmentsIndex(),
        icon: CalendarClock,
        module: 'appointments',
    },
    {
        title: 'Services',
        href: servicesIndex(),
        icon: Sparkles,
        module: 'services',
    },
    {
        title: 'Point of Sale',
        href: posIndex(),
        icon: ShoppingCart,
        module: 'point_of_sale',
    },
    {
        title: 'Inventory',
        href: inventoryIndex(),
        icon: Boxes,
        module: 'inventory',
    },
    {
        title: 'Distribution',
        href: distributionsIndex(),
        icon: ArrowLeftRight,
        module: 'distribution',
    },
    {
        title: 'Categories',
        href: categoriesIndex(),
        icon: Tags,
        module: 'categories',
    },
    {
        title: 'Staff',
        href: staffIndex(),
        icon: Users,
        module: 'staff',
    },
    {
        title: 'Branches',
        href: branchesIndex(),
        icon: Building2,
        module: 'branches',
    },
    {
        title: 'Feedback',
        href: feedbackIndex(),
        icon: MessageSquareText,
        module: 'feedback',
    },
    {
        title: 'Reports',
        href: reportsIndex(),
        icon: BookOpen,
        module: 'reports',
    },
    {
        title: 'Logs',
        href: logsIndex(),
        icon: ScrollText,
        module: 'logs',
    },
    {
        title: 'System Settings',
        href: systemSettingsIndex(),
        icon: Settings2,
        module: 'system_settings',
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: FolderGit2,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const allowedItems = mainNavItems.filter((item) =>
        auth.permissions.modules.includes(item.module),
    );
    const landingPage = allowedItems[0]?.href ?? dashboard();

    return (
        <Sidebar collapsible="icon" variant="inset" className="print:hidden">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={landingPage} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={allowedItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
