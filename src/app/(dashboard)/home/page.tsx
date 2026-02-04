"use client";

import React from "react";
import { motion } from "framer-motion";
import {
    Users,
    ShoppingCart,
    DollarSign,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

const stats = [
    {
        title: "Tổng khách hàng",
        value: "1,234",
        change: "+12.5%",
        trend: "up",
        icon: Users,
        color: "blue",
    },
    {
        title: "Đơn hàng hôm nay",
        value: "56",
        change: "+8.2%",
        trend: "up",
        icon: ShoppingCart,
        color: "green",
    },
    {
        title: "Doanh thu",
        value: "45.2M",
        change: "-2.4%",
        trend: "down",
        icon: DollarSign,
        color: "purple",
    },
    {
        title: "Tăng trưởng",
        value: "23.5%",
        change: "+5.1%",
        trend: "up",
        icon: TrendingUp,
        color: "orange",
    },
];

const colorClasses: { [key: string]: { bg: string; text: string; icon: string } } = {
    blue: {
        bg: "bg-blue-50",
        text: "text-blue-600",
        icon: "bg-blue-500",
    },
    green: {
        bg: "bg-green-50",
        text: "text-green-600",
        icon: "bg-green-500",
    },
    purple: {
        bg: "bg-purple-50",
        text: "text-purple-600",
        icon: "bg-purple-500",
    },
    orange: {
        bg: "bg-orange-50",
        text: "text-orange-600",
        icon: "bg-orange-500",
    },
};

export default function HomePage() {
    const { user } = useAuth();

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg"
            >
                <h1 className="text-2xl font-bold">
                    Xin chào, {user?.fullName || user?.username}! 👋
                </h1>
                <p className="text-blue-100 mt-1">
                    Chào mừng bạn trở lại với POS System
                </p>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => {
                    const colors = colorClasses[stat.color];
                    const Icon = stat.icon;
                    const TrendIcon = stat.trend === "up" ? ArrowUpRight : ArrowDownRight;

                    return (
                        <motion.div
                            key={stat.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className={`p-3 rounded-xl ${colors.icon}`}>
                                            <Icon className="w-6 h-6 text-white" />
                                        </div>
                                        <div
                                            className={`flex items-center gap-1 text-sm font-medium ${stat.trend === "up" ? "text-green-600" : "text-red-600"
                                                }`}
                                        >
                                            <TrendIcon className="w-4 h-4" />
                                            {stat.change}
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <p className="text-sm text-slate-500">{stat.title}</p>
                                        <p className="text-2xl font-bold text-slate-800 mt-1">
                                            {stat.value}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Card className="border-0 shadow-md h-full">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-slate-800">
                                Hoạt động gần đây
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-4 p-3 rounded-lg bg-slate-50"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                            <Users className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-slate-800">
                                                Người dùng mới đăng ký
                                            </p>
                                            <p className="text-xs text-slate-500">2 phút trước</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <Card className="border-0 shadow-md h-full">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-slate-800">
                                Thao tác nhanh
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: "Thêm người dùng", icon: Users, color: "blue" },
                                    { label: "Tạo đơn hàng", icon: ShoppingCart, color: "green" },
                                    { label: "Xem báo cáo", icon: TrendingUp, color: "purple" },
                                    { label: "Cài đặt", icon: DollarSign, color: "orange" },
                                ].map((action, i) => {
                                    const colors = colorClasses[action.color];
                                    const Icon = action.icon;
                                    return (
                                        <motion.button
                                            key={i}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className={`p-4 rounded-xl ${colors.bg} hover:shadow-md transition-all flex flex-col items-center gap-2`}
                                        >
                                            <div className={`p-2 rounded-lg ${colors.icon}`}>
                                                <Icon className="w-5 h-5 text-white" />
                                            </div>
                                            <span className={`text-sm font-medium ${colors.text}`}>
                                                {action.label}
                                            </span>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
