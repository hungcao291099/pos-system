"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Home,
    Users,
    Shield,
    Menu as MenuIcon,
    Lock,
    User,
    ChevronDown,
    ChevronRight,
    LucideIcon,
    Package,
    Truck,
    Users2,
    Ruler,
    Layers,
    Warehouse,
    History,
    PackagePlus,
    PackageMinus,
    LayoutGrid,
    ShoppingCart,
    ChefHat,
    Settings,
    Gift,
    Tag,
    Percent,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface MenuItem {
    id: number;
    name: string;
    path: string;
    icon: string;
    parentId?: number;
    children?: MenuItem[];
}

const iconMap: { [key: string]: LucideIcon } = {
    Home,
    Users,
    Shield,
    Menu: MenuIcon,
    Lock,
    User,
    Package,
    Truck,
    Users2,
    Ruler,
    Layers,
    Warehouse,
    History,
    PackagePlus,
    PackageMinus,
    LayoutGrid,
    ShoppingCart,
    ChefHat,
    Settings,
    Gift,
    Tag,
    Percent,
};

export function Sidebar() {
    const pathname = usePathname();
    const { menus, isLoading } = useAuth();
    const { isExpanded } = useSidebar();
    const [expandedMenus, setExpandedMenus] = React.useState<number[]>([]);

    const toggleMenu = (menuId: number) => {
        setExpandedMenus((prev) =>
            prev.includes(menuId)
                ? prev.filter((id) => id !== menuId)
                : [...prev, menuId]
        );
    };

    // Use menus directly from AuthContext as they are already a tree
    const menuTree = menus;

    // Expand parent menus that contain the active path
    React.useEffect(() => {
        const getParentIds = (items: MenuItem[], targetPath: string): number[] => {
            for (const item of items) {
                if (item.path === targetPath) return [];
                if (item.children && item.children.length > 0) {
                    const childResult = getParentIds(item.children, targetPath);
                    if (childResult.length > 0 || item.children.some(c => c.path === targetPath)) {
                        return [item.id, ...childResult];
                    }
                }
            }
            return [];
        };

        if (pathname && menus.length > 0) {
            const parentIds = getParentIds(menus, pathname);
            if (parentIds.length > 0) {
                setExpandedMenus(prev => {
                    const newIds = parentIds.filter(id => !prev.includes(id));
                    return newIds.length > 0 ? [...prev, ...newIds] : prev;
                });
            }
        }
    }, [pathname, menus]);

    const renderMenuItem = (item: MenuItem, depth = 0) => {
        const IconComponent = iconMap[item.icon] || Home;
        const isDirectActive = pathname === item.path;
        const hasChildren = item.children && item.children.length > 0;

        // Check if any child is active
        const isChildActive = (menu: MenuItem): boolean => {
            if (!menu.children) return false;
            return menu.children.some(child =>
                pathname === child.path || isChildActive(child)
            );
        };

        const isActive = isDirectActive || isChildActive(item);
        const isMenuExpanded = expandedMenus.includes(item.id);

        return (
            <div key={item.id}>
                {hasChildren ? (
                    <button
                        onClick={() => toggleMenu(item.id)}
                        className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                            isActive
                                ? "bg-blue-50 text-blue-600 font-semibold"
                                : "hover:bg-blue-50 text-slate-600 hover:text-blue-600",
                            !isExpanded && "justify-center px-3"
                        )}
                        style={{ paddingLeft: isExpanded ? `${16 + depth * 16}px` : undefined }}
                    >
                        <IconComponent className="w-5 h-5 flex-shrink-0" />
                        {isExpanded && (
                            <span className="flex-1 text-left text-sm font-medium whitespace-nowrap overflow-hidden">
                                {item.name}
                            </span>
                        )}
                        {isExpanded && (
                            <motion.div
                                animate={{ rotate: isMenuExpanded ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ChevronDown className="w-4 h-4" />
                            </motion.div>
                        )}
                    </button>
                ) : (
                    <Link
                        href={item.path}
                        className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                            isActive
                                ? "bg-blue-500 text-white shadow-md"
                                : "hover:bg-blue-50 text-slate-600 hover:text-blue-600",
                            !isExpanded && "justify-center px-3"
                        )}
                        style={{ paddingLeft: isExpanded ? `${16 + depth * 16}px` : undefined }}
                    >
                        <IconComponent className="w-5 h-5 flex-shrink-0" />
                        {isExpanded && (
                            <span className="text-sm font-medium whitespace-nowrap overflow-hidden">
                                {item.name}
                            </span>
                        )}
                    </Link>
                )}

                {/* Render children */}
                <AnimatePresence>
                    {hasChildren && isMenuExpanded && isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            {item.children!.map((child) => renderMenuItem(child, depth + 1))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    return (
        <motion.aside
            initial={false}
            animate={{ width: isExpanded ? 256 : 80 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="h-screen bg-white border-r border-slate-200 flex flex-col will-change-[width]"
        >
            {/* Logo */}
            <div className="h-16 flex items-center justify-center border-b border-slate-200">
                <motion.div
                    initial={{ scale: 1 }}
                    animate={{ scale: isExpanded ? 1 : 0.8 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-2"
                >
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold">P</span>
                    </div>
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="font-bold text-lg text-slate-800"
                            >
                                POS System
                            </motion.span>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {isLoading ? (
                    <div className="space-y-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-11 w-full rounded-lg" />
                        ))}
                    </div>
                ) : (
                    menuTree.map((item) => renderMenuItem(item))
                )}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200">
                <div className={cn(
                    "text-xs text-slate-400 text-center",
                    !isExpanded && "hidden"
                )}>
                    © 2024 POS System
                </div>
            </div>
        </motion.aside>
    );
}
