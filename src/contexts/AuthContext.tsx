"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface User {
    id: number;
    username: string;
    email: string;
    fullName: string;
    avatar?: string;
    isActive: boolean;
}

interface Role {
    id: number;
    name: string;
    description?: string;
}

interface Menu {
    id: number;
    name: string;
    path: string;
    icon: string;
    sortOrder: number;
    children?: Menu[];
}

interface AuthContextType {
    user: User | null;
    roles: Role[];
    permissions: string[];
    menus: Menu[];
    isAdmin: boolean;
    isLoading: boolean;
    login: (username: string, password: string, rememberMe?: boolean) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    hasPermission: (resource: string, action: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<string[]>([]);
    const [menus, setMenus] = useState<Menu[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = useCallback(async () => {
        try {
            const response = await fetch("/api/auth/me");
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setUser(data.data.user);
                    setRoles(data.data.roles);
                    setPermissions(data.data.permissions);
                    setMenus(data.data.menus);
                    setIsAdmin(data.data.isAdmin);
                    return;
                }
            }
            // Try to refresh token
            const refreshResponse = await fetch("/api/auth/refresh", {
                method: "POST",
            });
            if (refreshResponse.ok) {
                // Retry getting user data
                const retryResponse = await fetch("/api/auth/me");
                if (retryResponse.ok) {
                    const data = await retryResponse.json();
                    if (data.success) {
                        setUser(data.data.user);
                        setRoles(data.data.roles);
                        setPermissions(data.data.permissions);
                        setMenus(data.data.menus);
                        setIsAdmin(data.data.isAdmin);
                        return;
                    }
                }
            }
            // Clear state if refresh failed
            setUser(null);
            setRoles([]);
            setPermissions([]);
            setMenus([]);
            setIsAdmin(false);
        } catch (error) {
            console.error("Error refreshing user:", error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    const login = async (username: string, password: string, rememberMe = false) => {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password, rememberMe }),
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || "Login failed");
        }

        await refreshUser();
        router.push("/home");
    };

    const logout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        setUser(null);
        setRoles([]);
        setPermissions([]);
        setMenus([]);
        setIsAdmin(false);
        router.push("/login");
    };

    const hasPermission = (resource: string, action: string): boolean => {
        if (isAdmin) return true;
        return permissions.includes(`${resource}:${action}`);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                roles,
                permissions,
                menus,
                isAdmin,
                isLoading,
                login,
                logout,
                refreshUser,
                hasPermission,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
