"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    FileText,
    Calendar,
    User,
    Warehouse,
    CreditCard,
    Banknote,
    ArrowRightLeft,
    Trash2,
    X
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface InvoiceDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    invoice: any; // Using any for now to simplify, will follow SalesInvoice structure
    onCancel?: (id: number) => void;
    isCancelling?: boolean;
}

export function InvoiceDetailDialog({
    open,
    onOpenChange,
    invoice,
    onCancel,
    isCancelling = false,
}: InvoiceDetailDialogProps) {
    if (!invoice) return null;

    const paymentIcons: Record<string, React.ReactNode> = {
        cash: <Banknote className="h-4 w-4" />,
        transfer: <ArrowRightLeft className="h-4 w-4" />,
        credit: <User className="h-4 w-4" />,
    };

    const paymentLabels: Record<string, string> = {
        cash: "Tiền mặt",
        transfer: "Chuyển khoản",
        credit: "Ghi nợ",
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl overflow-hidden p-0 gap-0">
                <DialogHeader className="p-6 bg-slate-50 border-b">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                <FileText className="h-5 w-5 text-primary" />
                                Hóa đơn {invoice.invoiceNumber}
                            </DialogTitle>
                            <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(invoice.invoiceDate).toLocaleString('vi-VN')}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Warehouse className="h-3 w-3" />
                                    {invoice.warehouse?.name}
                                </span>
                            </div>
                        </div>
                        <Badge
                            variant={invoice.status === 'completed' ? 'default' : 'destructive'}
                            className="uppercase text-[10px] font-black tracking-widest px-3 py-1"
                        >
                            {invoice.status === 'completed' ? 'HOÀN TẤT' : 'ĐÃ HỦY'}
                        </Badge>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                    {/* Customer Info */}
                    <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                <User className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Khách hàng</p>
                                <p className="text-sm font-bold text-slate-700">
                                    {invoice.customer?.name || "Khách lẻ"}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Thanh toán</p>
                            <div className="flex items-center gap-1.5 text-sm font-bold text-slate-600 justify-end">
                                {paymentIcons[invoice.paymentMethod]}
                                {paymentLabels[invoice.paymentMethod]}
                            </div>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Chi tiết mặt hàng</h3>
                        <div className="border rounded-2xl overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Sản phẩm</th>
                                        <th className="px-4 py-3 text-center w-24">SL</th>
                                        <th className="px-4 py-3 text-right w-32">Đơn giá</th>
                                        <th className="px-4 py-3 text-right w-32">Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {invoice.details?.map((detail: any) => (
                                        <tr key={detail.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-4">
                                                <p className="font-bold text-slate-700">{detail.product?.name}</p>
                                                <p className="text-[10px] text-slate-400">{detail.product?.code}</p>
                                            </td>
                                            <td className="px-4 py-4 text-center font-medium">{Number(detail.quantity)}</td>
                                            <td className="px-4 py-4 text-right">{Number(detail.unitPrice).toLocaleString()}đ</td>
                                            <td className="px-4 py-4 text-right font-bold">{Number(detail.amount).toLocaleString()}đ</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Calculations */}
                    <div className="flex justify-end pt-4">
                        <div className="w-64 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 font-medium">Tổng tiền:</span>
                                <span className="font-bold text-slate-700">{Number(invoice.totalAmount).toLocaleString()}đ</span>
                            </div>
                            {invoice.paymentMethod === 'cash' && (
                                <>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 font-medium">Khách đưa:</span>
                                        <span className="font-bold text-slate-700">{Number(invoice.cashReceived).toLocaleString()}đ</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 font-medium">Tiền thối:</span>
                                        <span className="font-bold text-emerald-600">{Number(invoice.changeAmount).toLocaleString()}đ</span>
                                    </div>
                                </>
                            )}
                            {invoice.paymentMethod === 'transfer' && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 font-medium">Mã giao dịch:</span>
                                    <span className="font-bold text-slate-700">{invoice.transferCode}</span>
                                </div>
                            )}
                            <Separator />
                            <div className="flex justify-between items-center text-lg">
                                <span className="font-black text-slate-800">TỔNG CỘNG:</span>
                                <span className="font-black text-primary">{Number(invoice.totalAmount).toLocaleString()}đ</span>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 bg-slate-50 border-t flex items-center justify-between sm:justify-between w-full">
                    <div className="flex-1">
                        {invoice.status === 'completed' && onCancel && (
                            <Button
                                variant="ghost"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50 font-bold gap-2"
                                onClick={() => onCancel(invoice.id)}
                                disabled={isCancelling}
                            >
                                <Trash2 className="h-4 w-4" />
                                HỦY HÓA ĐƠN
                            </Button>
                        )}
                    </div>
                    <Button variant="outline" className="font-bold px-8" onClick={() => onOpenChange(false)}>
                        ĐÓNG
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
