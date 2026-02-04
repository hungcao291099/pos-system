"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Menu,
    Bell,
    User,
    LogOut,
    Settings,
    ChevronDown,
    X,
} from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface Notification {
    id: number;
    title: string;
    message: string;
    time: string;
    read: boolean;
}

export function Topbar() {
    const { toggleSidebar } = useSidebar();
    const { user, isLoading, logout } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([
        {
            id: 1,
            title: "Chào mừng",
            message: "Chào mừng bạn đến với POS System!",
            time: "Vừa xong",
            read: false,
        },
    ]);
    const [showNotifications, setShowNotifications] = useState(false);

    const unreadCount = notifications.filter((n) => !n.read).length;

    const markAsRead = (id: number) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
    };

    const clearNotification = (id: number) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 shadow-sm">
            {/* Left section */}
            <div className="flex items-center gap-4">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleSidebar}
                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                    <Menu className="w-5 h-5 text-slate-600" />
                </motion.button>
            </div>

            {/* Right section */}
            <div className="flex items-center gap-3">
                {/* Notifications */}
                <div className="relative">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                        <Bell className="w-5 h-5 text-slate-600" />
                        {unreadCount > 0 && (
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium"
                            >
                                {unreadCount}
                            </motion.span>
                        )}
                    </motion.button>

                    <AnimatePresence>
                        {showNotifications && (
                            <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50"
                            >
                                <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="font-semibold text-slate-800">Thông báo</h3>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowNotifications(false)}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-6 text-center text-slate-500">
                                            Không có thông báo mới
                                        </div>
                                    ) : (
                                        notifications.map((notification) => (
                                            <motion.div
                                                key={notification.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className={`p-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${!notification.read ? "bg-blue-50" : ""
                                                    }`}
                                                onClick={() => markAsRead(notification.id)}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1">
                                                        <h4 className="font-medium text-sm text-slate-800">
                                                            {notification.title}
                                                        </h4>
                                                        <p className="text-xs text-slate-500 mt-1">
                                                            {notification.message}
                                                        </p>
                                                        <span className="text-xs text-slate-400 mt-1 block">
                                                            {notification.time}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            clearNotification(notification.id);
                                                        }}
                                                        className="p-1 hover:bg-slate-200 rounded"
                                                    >
                                                        <X className="w-3 h-3 text-slate-400" />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* User Menu */}
                {isLoading ? (
                    <div className="flex items-center gap-2">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <Skeleton className="w-24 h-4" />
                    </div>
                ) : (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src={user?.avatar} />
                                    <AvatarFallback className="bg-blue-500 text-white text-sm">
                                        {user?.fullName
                                            ? getInitials(user.fullName)
                                            : user?.username?.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium text-slate-700 hidden md:block">
                                    {user?.fullName || user?.username}
                                </span>
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                            </motion.button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>
                                <div className="flex flex-col">
                                    <span className="font-medium">{user?.fullName || user?.username}</span>
                                    <span className="text-xs text-slate-500">{user?.email}</span>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/account" className="flex items-center gap-2 cursor-pointer">
                                    <User className="w-4 h-4" />
                                    <span>Tài khoản</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/account" className="flex items-center gap-2 cursor-pointer">
                                    <Settings className="w-4 h-4" />
                                    <span>Cài đặt</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => logout()}
                                className="text-red-600 focus:text-red-600 cursor-pointer"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                <span>Đăng xuất</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </header>
    );
}
