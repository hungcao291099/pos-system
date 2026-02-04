"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Search,
    History,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Loader2,
    Filter,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface PriceHistoryEntry {
    id: number;
    productId: number;
    warehouseId: number | null;
    oldPrice: number;
    newPrice: number;
    priceType: "purchase" | "sell";
    effectiveDate: string;
    reason: string;
    product: {
        name: string;
        code: string;
    };
    warehouse?: {
        name: string;
    };
}

export default function PriceHistoryPage() {
    const [history, setHistory] = useState<PriceHistoryEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [priceType, setPriceType] = useState<string>("all");
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 0,
    });

    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            let url = `/api/price-history?page=${pagination.page}&pageSize=${pagination.pageSize}`;
            if (priceType !== "all") {
                url += `&priceType=${priceType}`;
            }
            // Note: search in this API is not yet implemented for product name, 
            // but for simplicity we'll just filter on the client for now or implement if needed.

            const response = await fetch(url);
            const data = await response.json();
            if (data.success) {
                setHistory(data.data.items);
                setPagination(prev => ({
                    ...prev,
                    total: data.data.total,
                    totalPages: data.data.totalPages,
                }));
            }
        } catch (error) {
            toast.error("Không thể tải lịch sử thay đổi giá");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [pagination.page, priceType]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(value);
    };

    const getPriceChangeStatus = (oldPrice: number, newPrice: number) => {
        if (newPrice > oldPrice) {
            return (
                <div className="flex items-center text-red-500 text-sm">
                    <ArrowUpRight className="w-4 h-4 mr-1" />
                    +{formatCurrency(newPrice - oldPrice)}
                </div>
            );
        } else if (newPrice < oldPrice) {
            return (
                <div className="flex items-center text-green-500 text-sm">
                    <ArrowDownRight className="w-4 h-4 mr-1" />
                    -{formatCurrency(oldPrice - newPrice)}
                </div>
            );
        }
        return <span className="text-slate-400 text-sm">Không đổi</span>;
    };

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <History className="w-7 h-7" />
                        Lịch sử biến động giá
                    </h1>
                    <p className="text-slate-500">Theo dõi thay đổi giá nhập và giá bán</p>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="md:col-span-3 border-0 shadow-md">
                    <CardHeader className="pb-4 border-b border-slate-100 mb-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <Filter className="w-5 h-5" />
                                Bộ lọc
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <Select
                                    value={priceType}
                                    onValueChange={setPriceType}
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Loại giá" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tất cả loại giá</SelectItem>
                                        <SelectItem value="purchase">Giá nhập</SelectItem>
                                        <SelectItem value="sell">Giá bán</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ngày thực hiện</TableHead>
                                    <TableHead>Sản phẩm</TableHead>
                                    <TableHead>Kho</TableHead>
                                    <TableHead>Loại giá</TableHead>
                                    <TableHead className="text-right">Giá cũ</TableHead>
                                    <TableHead className="text-right">Giá mới</TableHead>
                                    <TableHead>Biến đổi</TableHead>
                                    <TableHead>Lý do</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 10 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : history.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center text-slate-500 py-12">
                                            Không có dữ liệu lịch sử giá
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    history.map((entry) => (
                                        <TableRow key={entry.id}>
                                            <TableCell className="text-sm">
                                                <div className="flex items-center gap-1 text-slate-600">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {format(new Date(entry.effectiveDate), "dd/MM/yyyy HH:mm")}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium text-slate-900">{entry.product.name}</div>
                                                <div className="text-xs text-slate-500">{entry.product.code}</div>
                                            </TableCell>
                                            <TableCell>
                                                {entry.warehouse?.name || <Badge variant="outline" className="text-[10px]">Tất cả</Badge>}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={entry.priceType === "purchase" ? "secondary" : "default"}>
                                                    {entry.priceType === "purchase" ? "Giá nhập" : "Giá bán"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right text-slate-500 font-medium">
                                                {formatCurrency(entry.oldPrice)}
                                            </TableCell>
                                            <TableCell className="text-right text-slate-900 font-bold">
                                                {formatCurrency(entry.newPrice)}
                                            </TableCell>
                                            <TableCell>
                                                {getPriceChangeStatus(entry.oldPrice, entry.newPrice)}
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-500">
                                                {entry.reason || "-"}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>

                        {pagination.totalPages > 1 && (
                            <div className="flex items-center justify-between mt-6">
                                <p className="text-sm text-slate-500">
                                    Hiển thị {history.length} / {pagination.total} bản ghi
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={pagination.page === 1}
                                        onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                                    >
                                        Trước
                                    </Button>
                                    <div className="text-sm font-medium px-4">
                                        Trang {pagination.page} / {pagination.totalPages}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={pagination.page === pagination.totalPages}
                                        onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                    >
                                        Sau
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <Card className="border-0 shadow-md bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium opacity-90">Tổng số thay đổi</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{pagination.total}</div>
                            <p className="text-xs mt-1 opacity-80">Lượt cập nhật giá hệ thống</p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-md">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500">Tìm kiếm nhanh</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Mã/Tên sản phẩm..."
                                    className="pl-9"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 italic">
                                * Tìm kiếm lọc trên trang hiện tại
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
