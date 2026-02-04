"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Key, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function AccountPage() {
    const { user, roles, refreshUser } = useAuth();
    const [isUpdating, setIsUpdating] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const [profileData, setProfileData] = useState({
        fullName: user?.fullName || "",
        email: user?.email || "",
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const handleUpdateProfile = async () => {
        setIsUpdating(true);
        try {
            const response = await fetch(`/api/users/${user?.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(profileData),
            });
            const data = await response.json();
            if (data.success) {
                toast.success("Cập nhật thông tin thành công");
                refreshUser();
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Không thể cập nhật thông tin");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleChangePassword = async () => {
        if (!passwordData.newPassword || !passwordData.confirmPassword) {
            toast.error("Vui lòng nhập đầy đủ thông tin");
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("Mật khẩu xác nhận không khớp");
            return;
        }
        if (passwordData.newPassword.length < 6) {
            toast.error("Mật khẩu phải có ít nhất 6 ký tự");
            return;
        }

        setIsChangingPassword(true);
        try {
            const response = await fetch(`/api/users/${user?.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: passwordData.newPassword }),
            });
            const data = await response.json();
            if (data.success) {
                toast.success("Đổi mật khẩu thành công");
                setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Không thể đổi mật khẩu");
        } finally {
            setIsChangingPassword(false);
        }
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
        <div className="max-w-4xl mx-auto space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-2xl font-bold text-slate-800">Tài khoản</h1>
                <p className="text-slate-500">Quản lý thông tin cá nhân và bảo mật</p>
            </motion.div>

            {/* Profile Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Card className="border-0 shadow-md">
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <Avatar className="w-20 h-20">
                                <AvatarImage src={user?.avatar} />
                                <AvatarFallback className="bg-blue-500 text-white text-2xl">
                                    {user?.fullName
                                        ? getInitials(user.fullName)
                                        : user?.username?.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-xl">{user?.fullName || user?.username}</CardTitle>
                                <CardDescription>@{user?.username}</CardDescription>
                                <div className="flex gap-2 mt-2">
                                    {roles.map((role) => (
                                        <Badge key={role.id} variant="secondary">
                                            {role.name}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                </Card>
            </motion.div>

            {/* Profile Information */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card className="border-0 shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Thông tin cá nhân
                        </CardTitle>
                        <CardDescription>Cập nhật thông tin cá nhân của bạn</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Tên đăng nhập</Label>
                                <Input value={user?.username || ""} disabled />
                            </div>
                            <div className="space-y-2">
                                <Label>Họ và tên</Label>
                                <Input
                                    value={profileData.fullName}
                                    onChange={(e) =>
                                        setProfileData({ ...profileData, fullName: e.target.value })
                                    }
                                    placeholder="Nhập họ tên"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        type="email"
                                        value={profileData.email}
                                        onChange={(e) =>
                                            setProfileData({ ...profileData, email: e.target.value })
                                        }
                                        className="pl-9"
                                        placeholder="example@email.com"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={handleUpdateProfile} disabled={isUpdating}>
                                {isUpdating ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4 mr-2" />
                                )}
                                Lưu thay đổi
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Security */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <Card className="border-0 shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Key className="w-5 h-5" />
                            Bảo mật
                        </CardTitle>
                        <CardDescription>Đổi mật khẩu tài khoản</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Mật khẩu hiện tại</Label>
                                <Input
                                    type="password"
                                    value={passwordData.currentPassword}
                                    onChange={(e) =>
                                        setPasswordData({ ...passwordData, currentPassword: e.target.value })
                                    }
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Mật khẩu mới</Label>
                                <Input
                                    type="password"
                                    value={passwordData.newPassword}
                                    onChange={(e) =>
                                        setPasswordData({ ...passwordData, newPassword: e.target.value })
                                    }
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Xác nhận mật khẩu</Label>
                                <Input
                                    type="password"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) =>
                                        setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                                    }
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={handleChangePassword} disabled={isChangingPassword}>
                                {isChangingPassword ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Key className="w-4 h-4 mr-2" />
                                )}
                                Đổi mật khẩu
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
