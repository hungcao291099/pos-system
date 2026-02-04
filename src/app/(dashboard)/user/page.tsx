"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Shield,
    MoreHorizontal,
    Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";

interface User {
    id: number;
    username: string;
    email: string;
    fullName: string;
    isActive: boolean;
    roles: { id: number; name: string }[];
    createdAt: string;
}

interface Role {
    id: number;
    name: string;
}

export default function UserPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showRolesDialog, setShowRolesDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        username: "",
        password: "",
        email: "",
        fullName: "",
        isActive: true,
    });

    const fetchUsers = async () => {
        try {
            const response = await fetch(`/api/users?search=${search}`);
            const data = await response.json();
            if (data.success) {
                setUsers(data.data.items);
            }
        } catch (error) {
            toast.error("Không thể tải danh sách người dùng");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const response = await fetch("/api/roles?all=true");
            const data = await response.json();
            if (data.success) {
                setRoles(data.data);
            }
        } catch (error) {
            console.error("Error fetching roles:", error);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, [search]);

    const handleCreate = async () => {
        if (!formData.username || !formData.password) {
            toast.error("Vui lòng nhập tên đăng nhập và mật khẩu");
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (data.success) {
                toast.success("Tạo người dùng thành công");
                setShowCreateDialog(false);
                setFormData({ username: "", password: "", email: "", fullName: "", isActive: true });
                fetchUsers();
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Không thể tạo người dùng");
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdate = async () => {
        if (!selectedUser) return;

        setIsSaving(true);
        try {
            const response = await fetch(`/api/users/${selectedUser.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.email,
                    fullName: formData.fullName,
                    isActive: formData.isActive,
                    password: formData.password || undefined,
                }),
            });
            const data = await response.json();
            if (data.success) {
                toast.success("Cập nhật người dùng thành công");
                setShowEditDialog(false);
                fetchUsers();
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Không thể cập nhật người dùng");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedUser) return;

        setIsSaving(true);
        try {
            const response = await fetch(`/api/users/${selectedUser.id}`, {
                method: "DELETE",
            });
            const data = await response.json();
            if (data.success) {
                toast.success("Xóa người dùng thành công");
                setShowDeleteDialog(false);
                fetchUsers();
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Không thể xóa người dùng");
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateRoles = async () => {
        if (!selectedUser) return;

        setIsSaving(true);
        try {
            const response = await fetch(`/api/users/${selectedUser.id}/roles`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ roleIds: selectedRoleIds }),
            });
            const data = await response.json();
            if (data.success) {
                toast.success("Cập nhật vai trò thành công");
                setShowRolesDialog(false);
                fetchUsers();
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Không thể cập nhật vai trò");
        } finally {
            setIsSaving(false);
        }
    };

    const openEditDialog = (user: User) => {
        setSelectedUser(user);
        setFormData({
            username: user.username,
            password: "",
            email: user.email || "",
            fullName: user.fullName || "",
            isActive: user.isActive,
        });
        setShowEditDialog(true);
    };

    const openRolesDialog = (user: User) => {
        setSelectedUser(user);
        setSelectedRoleIds(user.roles.map((r) => r.id));
        setShowRolesDialog(true);
    };

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Quản lý người dùng</h1>
                    <p className="text-slate-500">Quản lý tài khoản người dùng trong hệ thống</p>
                </div>
                <Button
                    onClick={() => {
                        setFormData({ username: "", password: "", email: "", fullName: "", isActive: true });
                        setShowCreateDialog(true);
                    }}
                    className="bg-blue-500 hover:bg-blue-600"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm người dùng
                </Button>
            </motion.div>

            <Card className="border-0 shadow-md">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Tìm kiếm người dùng..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tên đăng nhập</TableHead>
                                <TableHead>Họ tên</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Vai trò</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                                    </TableRow>
                                ))
                            ) : users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                                        Không có người dùng nào
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.username}</TableCell>
                                        <TableCell>{user.fullName || "-"}</TableCell>
                                        <TableCell>{user.email || "-"}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-1 flex-wrap">
                                                {user.roles.map((role) => (
                                                    <Badge key={role.id} variant="secondary">
                                                        {role.name}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.isActive ? "default" : "secondary"}>
                                                {user.isActive ? "Hoạt động" : "Vô hiệu"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => openEditDialog(user)}>
                                                        <Edit className="w-4 h-4 mr-2" />
                                                        Chỉnh sửa
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => openRolesDialog(user)}>
                                                        <Shield className="w-4 h-4 mr-2" />
                                                        Phân quyền
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setSelectedUser(user);
                                                            setShowDeleteDialog(true);
                                                        }}
                                                        className="text-red-600"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Xóa
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Create Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Thêm người dùng mới</DialogTitle>
                        <DialogDescription>Tạo tài khoản người dùng mới trong hệ thống</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Tên đăng nhập *</Label>
                            <Input
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Mật khẩu *</Label>
                            <Input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Họ tên</Label>
                            <Input
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                            Hủy
                        </Button>
                        <Button onClick={handleCreate} disabled={isSaving}>
                            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Tạo mới
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
                        <DialogDescription>Cập nhật thông tin tài khoản</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Tên đăng nhập</Label>
                            <Input value={formData.username} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label>Mật khẩu mới (để trống nếu không đổi)</Label>
                            <Input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Họ tên</Label>
                            <Input
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                checked={formData.isActive}
                                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked as boolean })}
                            />
                            <Label>Kích hoạt tài khoản</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                            Hủy
                        </Button>
                        <Button onClick={handleUpdate} disabled={isSaving}>
                            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Cập nhật
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Roles Dialog */}
            <Dialog open={showRolesDialog} onOpenChange={setShowRolesDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Phân quyền vai trò</DialogTitle>
                        <DialogDescription>
                            Chọn các vai trò cho {selectedUser?.username}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                        {roles.map((role) => (
                            <div key={role.id} className="flex items-center gap-2">
                                <Checkbox
                                    checked={selectedRoleIds.includes(role.id)}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            setSelectedRoleIds([...selectedRoleIds, role.id]);
                                        } else {
                                            setSelectedRoleIds(selectedRoleIds.filter((id) => id !== role.id));
                                        }
                                    }}
                                />
                                <Label>{role.name}</Label>
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRolesDialog(false)}>
                            Hủy
                        </Button>
                        <Button onClick={handleUpdateRoles} disabled={isSaving}>
                            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Lưu thay đổi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xác nhận xóa</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn xóa người dùng {selectedUser?.username}? Hành động này không thể hoàn tác.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Hủy
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isSaving}>
                            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Xóa
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
