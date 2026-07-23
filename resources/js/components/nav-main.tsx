import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuBadge,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';
import type { NewRecordSummary } from '@/types';

export function NavMain({
    items = [],
    counts = {},
}: {
    items: Array<NavItem & { module?: string }>;
    counts?: NewRecordSummary['counts'];
}) {
    const { isCurrentUrl } = useCurrentUrl();
    const { setOpenMobile } = useSidebar();

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => {
                    const count = item.module
                        ? counts[item.module as keyof typeof counts]
                        : undefined;

                    return (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={isCurrentUrl(item.href)}
                            tooltip={{ children: item.title }}
                        >
                            <Link
                                href={item.href}
                                prefetch
                                onClick={() => setOpenMobile(false)}
                            >
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                        {count !== undefined && count > 0 && (
                            <SidebarMenuBadge
                                aria-label={`${count} new ${item.title.toLocaleLowerCase()} records`}
                                title={`${count} new records`}
                            >
                                {count > 99 ? '99+' : count}
                            </SidebarMenuBadge>
                        )}
                    </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
