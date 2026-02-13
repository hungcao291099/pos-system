"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Plus,
    Search,
    Edit,
    Trash2,
    MoreHorizontal,
    Loader2,
    Map,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function AreaManagementPage() {
    const [areas, setAreas] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [selectedArea, setSelectedArea] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [newName, setNewName] = useState("");

    const fetchAreas = async () => {
        try {
            const response = await fetch("/api/areas");
            const data = await response.json();
            if (data.success) {
                setAreas(data.data);
            }
        } catch (error) {
            toast.error("Không thể tải danh sách khu vực");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAreas();
    }, []);

    const handleUpdate = async () => {
        if (!selectedArea || !newName) {
            toast.error("Vui lòng nhập tên khu vực");
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch("/api/areas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "rename",
                    oldName: selectedArea,
                    newName: newName,
                }),
            });
            const data = await response.json();
            if (data.success) {
                toast.success("Cập nhật khu vực thành công");
                setShowEditDialog(false);
                fetchAreas();
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Không thể cập nhật khu vực");
        } finally {
            setIsSaving(false);
        }
    };

    const openEditDialog = (area: string) => {
        setSelectedArea(area);
        setNewName(area);
        setShowEditDialog(true);
    };

    const filteredAreas = areas.filter(a =>
        a.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Map className="w-7 h-7" />
                        Quản lý khu vực
                    </h1>
                    <p className="text-slate-500">Quản lý các khu vực trong cửa hàng</p>
                </div>
            </motion.div>

            <Card className="border-0 shadow-md">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Tìm kiếm khu vực..."
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
                                <TableHead>Tên khu vực</TableHead>
                                <TableHead className="w-24 text-right">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredAreas.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center text-slate-500 py-8">
                                        Không có khu vực nào
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredAreas.map((area) => (
                                    <TableRow key={area}>
                                        <TableCell className="font-medium">
                                            <Badge variant="outline" className="text-sm px-3 py-1 bg-blue-50 text-blue-700 border-blue-100">
                                                {area}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openEditDialog(area)}
                                                className="text-slate-500 hover:text-blue-600"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Đổi tên khu vực</DialogTitle>
                        <DialogDescription>
                            Tất cả bàn thuộc khu vực <span className="font-medium text-slate-900">{selectedArea}</span> sẽ được cập nhật sang tên mới.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="newName">Tên khu vực mới</Label>
                            <Input
                                id="newName"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                autoFocus
                            />
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
        </div>
    );
}
