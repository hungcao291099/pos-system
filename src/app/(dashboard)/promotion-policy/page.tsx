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
    Gift,
    X,
    ShoppingCart,
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { NumberInput } from "@/components/ui/number-input";
import { format } from "date-fns";

interface Product {
    id: number;
    name: string;
    code: string;
}

interface PromotionBuyItem {
    id?: number;
    productId: number;
    quantity: number;
    product?: Product;
}

interface PromotionGetItem {
    id?: number;
    productId: number;
    quantity: number;
    discountPercentage: number;
    product?: Product;
}

interface PromotionPolicy {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    buyItems: PromotionBuyItem[];
    getItems: PromotionGetItem[];
}

export default function PromotionPolicyPage() {
    const [policies, setPolicies] = useState<PromotionPolicy[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [selectedPolicy, setSelectedPolicy] = useState<PromotionPolicy | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        endDate: format(new Date(new Date().setMonth(new Date().getMonth() + 1)), "yyyy-MM-dd'T'HH:mm"),
        isActive: true,
        buyItems: [] as { productId: number; quantity: number }[],
        getItems: [] as { productId: number; quantity: number; discountPercentage: number }[],
    });

    const fetchPolicies = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/promotion-policies");
            const data = await response.json();
            if (data.success) {
                setPolicies(data.data);
            }
        } catch (error) {
            toast.error("Không thể tải danh sách chính sách khuyến mãi");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await fetch("/api/products?all=true");
            const data = await response.json();
            if (data.success) {
                setProducts(data.data);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    };

    useEffect(() => {
        fetchPolicies();
        fetchProducts();
    }, []);

    const resetForm = () => {
        setFormData({
            name: "",
            startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
            endDate: format(new Date(new Date().setMonth(new Date().getMonth() + 1)), "yyyy-MM-dd'T'HH:mm"),
            isActive: true,
            buyItems: [],
            getItems: [],
        });
    };

    const handleCreate = async () => {
        if (!formData.name || formData.buyItems.length === 0 || formData.getItems.length === 0) {
            toast.error("Vui lòng nhập đầy đủ thông tin: tên, món mua và món tặng");
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch("/api/promotion-policies", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (data.success) {
                toast.success("Tạo chính sách thành công");
                setShowCreateDialog(false);
                fetchPolicies();
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Không thể tạo chính sách");
        } finally {
            setIsSaving(false);
        }
    };

    const addBuyItem = () => {
        if (products.length === 0) return;
        setFormData({
            ...formData,
            buyItems: [...formData.buyItems, { productId: products[0].id, quantity: 1 }],
        });
    };

    const addGetItem = () => {
        if (products.length === 0) return;
        setFormData({
            ...formData,
            getItems: [...formData.getItems, { productId: products[0].id, quantity: 1, discountPercentage: 100 }],
        });
    };

    return (
        <div className="space-y-6 text-slate-900">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Gift className="w-7 h-7" />
                        Chính sách khuyến mãi
                    </h1>
                    <p className="text-slate-500">Thiết lập các chương trình Mua X Tặng Y</p>
                </div>
                <Button
                    onClick={() => {
                        resetForm();
                        setShowCreateDialog(true);
                    }}
                    className="bg-purple-500 hover:bg-purple-600"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm khuyến mãi
                </Button>
            </motion.div>

            <Card className="border-0 shadow-md">
                <CardHeader className="pb-4 text-slate-800">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Tìm kiếm khuyến mãi..."
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
                                <TableHead>Tên khuyến mãi</TableHead>
                                <TableHead>Điều kiện (Mua)</TableHead>
                                <TableHead>Ưu đãi (Tặng)</TableHead>
                                <TableHead>Thời gian</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                                    </TableRow>
                                ))
                            ) : policies.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                                        Không có chương trình khuyến mãi nào
                                    </TableCell>
                                </TableRow>
                            ) : (
                                policies.map((policy) => (
                                    <TableRow key={policy.id}>
                                        <TableCell className="font-medium">{policy.name}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                {policy.buyItems.map((item, idx) => (
                                                    <span key={idx} className="text-sm">
                                                        {item.quantity} x {item.product?.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                {policy.getItems.map((item, idx) => (
                                                    <span key={idx} className="text-sm text-green-600 font-medium">
                                                        Tặng {item.quantity} x {item.product?.name} ({item.discountPercentage}%)
                                                    </span>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {format(new Date(policy.startDate), "dd/MM/yyyy")} - {format(new Date(policy.endDate), "dd/MM/yyyy")}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={policy.isActive ? "default" : "secondary"}>
                                                {policy.isActive ? "Đang chạy" : "Tạm dừng"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto text-slate-800">
                    <DialogHeader>
                        <DialogTitle>Thiết lập chương trình khuyến mãi</DialogTitle>
                        <DialogDescription>Cấu hình điều kiện Mua X Tặng Y</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label>Tên chương trình *</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="VD: Mua 2 Coffee tặng 1 Bánh"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Từ ngày *</Label>
                                <Input
                                    type="datetime-local"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Đến ngày *</Label>
                                <Input
                                    type="datetime-local"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-lg font-bold flex items-center gap-2">
                                    <ShoppingCart className="w-5 h-5" />
                                    Điều kiện Mua
                                </Label>
                                <Button type="button" variant="outline" size="sm" onClick={addBuyItem}>
                                    <Plus className="w-4 h-4 mr-1" /> Thêm món mua
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {formData.buyItems.map((item, idx) => (
                                    <div key={idx} className="flex gap-2 items-end">
                                        <div className="flex-1 space-y-1">
                                            <Label className="text-xs">Sản phẩm</Label>
                                            <Select
                                                value={item.productId.toString()}
                                                onValueChange={(v) => {
                                                    const newItems = [...formData.buyItems];
                                                    newItems[idx].productId = parseInt(v);
                                                    setFormData({ ...formData, buyItems: newItems });
                                                }}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {products.map(p => (
                                                        <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="w-24 space-y-1">
                                            <Label className="text-xs">Số lượng</Label>
                                            <NumberInput
                                                value={item.quantity}
                                                onChange={(v) => {
                                                    const newItems = [...formData.buyItems];
                                                    newItems[idx].quantity = v;
                                                    setFormData({ ...formData, buyItems: newItems });
                                                }}
                                            />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500"
                                            onClick={() => {
                                                setFormData({ ...formData, buyItems: formData.buyItems.filter((_, i) => i !== idx) });
                                            }}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-lg font-bold flex items-center gap-2">
                                    <Gift className="w-5 h-5 text-green-600" />
                                    Ưu đãi Tặng
                                </Label>
                                <Button type="button" variant="outline" size="sm" onClick={addGetItem}>
                                    <Plus className="w-4 h-4 mr-1" /> Thêm món tặng
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {formData.getItems.map((item, idx) => (
                                    <div key={idx} className="flex gap-2 items-end bg-green-50/50 p-2 rounded-lg border border-green-100">
                                        <div className="flex-1 space-y-1">
                                            <Label className="text-xs">Sản phẩm tặng</Label>
                                            <Select
                                                value={item.productId.toString()}
                                                onValueChange={(v) => {
                                                    const newItems = [...formData.getItems];
                                                    newItems[idx].productId = parseInt(v);
                                                    setFormData({ ...formData, getItems: newItems });
                                                }}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {products.map(p => (
                                                        <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="w-20 space-y-1">
                                            <Label className="text-xs">Số lượng</Label>
                                            <NumberInput
                                                value={item.quantity}
                                                onChange={(v) => {
                                                    const newItems = [...formData.getItems];
                                                    newItems[idx].quantity = v;
                                                    setFormData({ ...formData, getItems: newItems });
                                                }}
                                            />
                                        </div>
                                        <div className="w-20 space-y-1">
                                            <Label className="text-xs">% Giảm</Label>
                                            <NumberInput
                                                value={item.discountPercentage}
                                                onChange={(v) => {
                                                    const newItems = [...formData.getItems];
                                                    newItems[idx].discountPercentage = v;
                                                    setFormData({ ...formData, getItems: newItems });
                                                }}
                                            />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500"
                                            onClick={() => {
                                                setFormData({ ...formData, getItems: formData.getItems.filter((_, i) => i !== idx) });
                                            }}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Hủy</Button>
                        <Button onClick={handleCreate} disabled={isSaving} className="bg-purple-600 hover:bg-purple-700">
                            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Lưu cấu hình
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
