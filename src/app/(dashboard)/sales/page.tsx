"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Search,
    Filter,
    Calendar as CalendarIcon,
    Warehouse as WarehouseIcon,
    User,
    ChevronLeft,
    ChevronRight,
    Eye,
    RefreshCcw,
    History,
    FileText,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { InvoiceDetailDialog } from "@/components/sales/InvoiceDetailDialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function SalesPage() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [search, setSearch] = useState("");
    const [warehouseId, setWarehouseId] = useState<string>("all");
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    const fetchWarehouses = async () => {
        try {
            const res = await fetch("/api/warehouses?all=true&type=SALES");
            const data = await res.json();
            if (data.success) setWarehouses(data.data);
        } catch (error) {
            console.error("Error fetching warehouses:", error);
        }
    };

    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                pageSize: pageSize.toString(),
                ...(search && { search }),
                ...(warehouseId !== "all" && { warehouseId }),
            });

            const res = await fetch(`/api/sales?${params.toString()}`);
            const data = await res.json();

            if (data.success) {
                setInvoices(data.data.items);
                setTotal(data.data.total);
            } else {
                toast.error(data.error || "Không thể tải danh sách hóa đơn");
            }
        } catch (error) {
            toast.error("Lỗi kết nối máy chủ");
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, search, warehouseId]);

    useEffect(() => {
        fetchWarehouses();
    }, []);

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    const handleViewDetail = async (id: number) => {
        try {
            const res = await fetch(`/api/sales/${id}`);
            const data = await res.json();
            if (data.success) {
                setSelectedInvoice(data.data);
                setDetailOpen(true);
            } else {
                toast.error(data.error || "Không thể tải chi tiết hóa đơn");
            }
        } catch (error) {
            toast.error("Lỗi kết nối");
        }
    };

    const handleCancelInvoice = async (id: number) => {
        if (!confirm("Bạn có chắc chắn muốn hủy hóa đơn này? Thao tác này sẽ hoàn lại tồn kho.")) return;

        setCancelling(true);
        try {
            const res = await fetch(`/api/sales/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                toast.success("Đã hủy hóa đơn thành công");
                setDetailOpen(false);
                fetchInvoices();
            } else {
                toast.error(data.error || "Không thể hủy hóa đơn");
            }
        } catch (error) {
            toast.error("Lỗi kết nối");
        } finally {
            setCancelling(false);
        }
    };

    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <div className="h-10 w-10 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                            <History className="h-6 w-6" />
                        </div>
                        LỊCH SỬ BÁN HÀNG
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Quản lý và tra cứu các hóa đơn đã phát hành</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => fetchInvoices()}
                        disabled={loading}
                        className="rounded-xl border-slate-200 hover:bg-slate-50 font-bold"
                    >
                        <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        LÀM MỚI
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Tìm theo số hóa đơn..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 rounded-xl border-slate-200 focus:ring-indigo-500"
                            />
                        </div>
                        <Select value={warehouseId} onValueChange={setWarehouseId}>
                            <SelectTrigger className="rounded-xl border-slate-200">
                                <div className="flex items-center gap-2">
                                    <WarehouseIcon className="h-4 w-4 text-slate-400" />
                                    <SelectValue placeholder="Tất cả kho" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="all">Tất cả kho</SelectItem>
                                {warehouses.map((w) => (
                                    <SelectItem key={w.id} value={w.id.toString()}>
                                        {w.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                    <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] py-4 px-6">Số Hóa Đơn</TableHead>
                                    <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] py-4">Ngày Xuất</TableHead>
                                    <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] py-4">Khách Hàng</TableHead>
                                    <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] py-4">Kho Xuất</TableHead>
                                    <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] py-4">Thanh Toán</TableHead>
                                    <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] py-4 text-right">Tổng Tiền</TableHead>
                                    <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] py-4 text-center">Trạng Thái</TableHead>
                                    <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] py-4 text-right px-6">Thao Tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            {Array.from({ length: 8 }).map((_, j) => (
                                                <TableCell key={j} className="py-4 px-6">
                                                    <Skeleton className="h-5 w-full rounded-md" />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : invoices.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-400 space-y-4">
                                                <div className="bg-slate-50 p-6 rounded-full border border-slate-100">
                                                    <FileText className="h-12 w-12 opacity-20" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-lg font-bold text-slate-600">Không tìm thấy hóa đơn nào</p>
                                                    <p className="text-sm opacity-60">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    invoices.map((invoice) => (
                                        <TableRow key={invoice.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <TableCell className="py-4 px-6 font-bold text-indigo-600">
                                                {invoice.invoiceNumber}
                                            </TableCell>
                                            <TableCell className="py-4 text-slate-600 text-xs">
                                                {new Date(invoice.invoiceDate).toLocaleString('vi-VN')}
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                        <User className="h-3.5 w-3.5" />
                                                    </div>
                                                    <span className="font-semibold text-slate-700">{invoice.customer?.name || "Khách lẻ"}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 text-slate-600 font-medium">
                                                {invoice.warehouse?.name}
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <Badge variant="outline" className="rounded-lg font-bold text-[10px] border-slate-200 text-slate-600 bg-white">
                                                    {invoice.paymentMethod === 'cash' ? 'TIỀN MẶT' : invoice.paymentMethod === 'transfer' ? 'CHUYỂN KHOẢN' : 'GHI NỢ'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-4 text-right font-black text-slate-800">
                                                {Number(invoice.totalAmount).toLocaleString()}đ
                                            </TableCell>
                                            <TableCell className="py-4 text-center">
                                                <Badge
                                                    className={`rounded-full px-3 py-0.5 text-[9px] font-black uppercase tracking-tighter
                                                        ${invoice.status === 'completed'
                                                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                                                            : 'bg-red-100 text-red-700 hover:bg-red-100'}`}
                                                >
                                                    {invoice.status === 'completed' ? 'HOÀN TẤT' : 'ĐÃ HỦY'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-4 text-right px-6">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleViewDetail(invoice.id)}
                                                    className="rounded-xl hover:bg-indigo-50 hover:text-indigo-600 font-bold gap-2"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    XEM
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                <div className="p-6 border-t bg-slate-50/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-slate-500 font-medium">
                        Hiển thị <span className="text-slate-800 font-bold">{invoices.length}</span> trên <span className="text-slate-800 font-bold">{total}</span> hóa đơn
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            disabled={page <= 1}
                            onClick={() => setPage(p => p - 1)}
                            className="h-10 w-10 rounded-xl border-slate-200"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <div className="flex items-center gap-1.5 mx-2">
                            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                                const p = i + 1;
                                return (
                                    <Button
                                        key={p}
                                        variant={page === p ? "default" : "ghost"}
                                        onClick={() => setPage(p)}
                                        className={`h-10 w-10 rounded-xl font-bold ${page === p ? 'bg-indigo-500 shadow-md shadow-indigo-200' : 'text-slate-500'}`}
                                    >
                                        {p}
                                    </Button>
                                );
                            })}
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            disabled={page >= totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="h-10 w-10 rounded-xl border-slate-200"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </Card>

            <InvoiceDetailDialog
                open={detailOpen}
                onOpenChange={setDetailOpen}
                invoice={selectedInvoice}
                onCancel={handleCancelInvoice}
                isCancelling={cancelling}
            />
        </div>
    );
}
