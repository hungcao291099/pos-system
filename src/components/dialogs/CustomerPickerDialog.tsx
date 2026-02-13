"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Users2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Customer {
    id: number;
    code: string;
    name: string;
    phone?: string;
    address?: string;
}

interface CustomerPickerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (customer: Customer) => void;
}

export function CustomerPickerDialog({
    open,
    onOpenChange,
    onSelect,
}: CustomerPickerDialogProps) {
    const { user } = useAuth();
    const [search, setSearch] = useState("");
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchCustomers = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/customers`);
            const data = await res.json();

            if (data.success) {
                const items = data.data.items || data.data;
                setCustomers(items);
            }
        } catch (error) {
            console.error("Error fetching customers:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (open) {
            fetchCustomers();
        }
    }, [open, fetchCustomers]);

    const filteredCustomers = customers.filter(
        (c) =>
            c.code.toLowerCase().includes(search.toLowerCase()) ||
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            (c.phone && c.phone.includes(search))
    );

    const handleSelect = (customer: Customer) => {
        onSelect(customer);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users2 className="h-5 w-5" />
                        Chọn khách hàng
                    </DialogTitle>
                </DialogHeader>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Tìm theo mã, tên hoặc số điện thoại..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <div className="flex-1 overflow-auto min-h-[300px]">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-background border-b">
                                <tr>
                                    <th className="text-left p-2">Mã</th>
                                    <th className="text-left p-2">Tên khách hàng</th>
                                    <th className="text-left p-2">Số điện thoại</th>
                                    <th className="text-left p-2">Địa chỉ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCustomers.map((customer) => (
                                    <tr
                                        key={customer.id}
                                        className="border-b cursor-pointer hover:bg-muted/50"
                                        onClick={() => handleSelect(customer)}
                                    >
                                        <td className="p-2 font-mono text-xs">{customer.code}</td>
                                        <td className="p-2">{customer.name}</td>
                                        <td className="p-2">{customer.phone || "-"}</td>
                                        <td className="p-2 truncate max-w-[200px]">
                                            {customer.address || "-"}
                                        </td>
                                    </tr>
                                ))}
                                {filteredCustomers.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="text-center py-8 text-muted-foreground">
                                            Không tìm thấy khách hàng
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Đóng
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
