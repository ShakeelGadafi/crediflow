import React, { useEffect, useState } from 'react';
import apiClient from '../api/apiClient';
import { useAuth } from '../auth/useAuth';
import { TrendingUp, AlertCircle, Calendar, Package, Download, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Button from '../components/Button';

export default function Dashboard() {
    const { user } = useAuth();
    const [creditStats, setCreditStats] = useState(null);
    const [utilityStats, setUtilityStats] = useState(null);
    const [expenditureStats, setExpenditureStats] = useState(null);
    const [supplierStats, setSupplierStats] = useState(null);
    
    const hasPerm = (p) => {
        if (user?.role === 'ADMIN') return true;
        return user?.permissions?.some(perm => perm.permission_name === p) || user?.permissions?.includes(p);
    };

    useEffect(() => {
        const fetchCredit = async () => {
             if (!hasPerm('CREDIT_TO_COME')) return;
             try {
                const res = await apiClient.get('/api/dashboard/credit');
                setCreditStats(res.data);
             } catch(e) { console.error(e); }
        };
        const fetchUtility = async () => {
             if (!hasPerm('DAILY_EXPENDITURE_UTILITIES')) return;
             try {
                const res = await apiClient.get('/api/dashboard/utilities');
                setUtilityStats(res.data);
             } catch(e) { console.error(e); }
        };
        const fetchExpenditure = async () => {
             if (!hasPerm('DAILY_EXPENDITURE_TRACKER')) return;
             try {
                const res = await apiClient.get('/api/dashboard/expenditure');
                setExpenditureStats(res.data);
             } catch(e) { console.error(e); }
        };
        const fetchSupplier = async () => {
             if (!hasPerm('GRN_CREDIT_REMINDER')) return;
             try {
                const res = await apiClient.get('/api/dashboard/suppliers');
                setSupplierStats(res.data);
             } catch(e) { console.error(e); }
        };

        if (user) {
            fetchCredit();
            fetchUtility();
            fetchExpenditure();
            fetchSupplier();
        }
    }, [user]);

    const handleExport = async (type, filename) => {
        try {
            const response = await apiClient.get(`/api/export/${type}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Export failed", error);
            alert("Export failed or permission denied.");
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
    };

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {creditStats && (
                    <StatCard 
                        title="Credit Outstanding" 
                        value={formatCurrency(creditStats.total_outstanding)} 
                        icon={TrendingUp}
                        iconBg="bg-blue-100"
                        iconColor="text-blue-600"
                    />
                )}
                {utilityStats && (
                    <StatCard 
                        title="Utilities Due Soon" 
                        value={utilityStats.due_soon?.length || 0} 
                        icon={Calendar}
                        iconBg="bg-amber-100"
                        iconColor="text-amber-600"
                        subtext={`${formatCurrency(utilityStats.total_unpaid)} unpaid`}
                    />
                )}
                {expenditureStats && (
                    <StatCard 
                        title="Monthly Expenditure" 
                        value={formatCurrency(expenditureStats.total)} 
                        icon={Package}
                        iconBg="bg-emerald-100"
                        iconColor="text-emerald-600"
                    />
                )}
                {supplierStats && (
                    <StatCard 
                        title="Supplier Overdue" 
                        value={supplierStats.overdue_summary?.count || 0} 
                        icon={AlertCircle}
                        iconBg="bg-red-100"
                        iconColor="text-red-600"
                        subtext={`${formatCurrency(supplierStats.overdue_summary?.amount)} amount`}
                        trend="up"
                    />
                )}
            </div>

            {/* Export Section */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                        <Download className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-gray-900">Data Export</h2>
                        <p className="text-sm text-gray-500">Download your data in Excel format</p>
                    </div>
                </div>
                <div className="p-6">
                    <div className="flex flex-wrap gap-3">
                        {hasPerm('CREDIT_TO_COME') && (
                            <Button onClick={() => handleExport('credit-bills.xlsx', 'credit-bills.xlsx')} variant="secondary" size="sm" icon={Download}>
                                Export Credit
                            </Button>
                        )}
                        {hasPerm('DAILY_EXPENDITURE_TRACKER') && (
                            <Button onClick={() => handleExport('expenditures.xlsx', 'expenditures.xlsx')} variant="secondary" size="sm" icon={Download}>
                                Export Expenditure
                            </Button>
                        )}
                        {hasPerm('GRN_CREDIT_REMINDER') && (
                            <Button onClick={() => handleExport('supplier-invoices.xlsx', 'supplier-invoices.xlsx')} variant="secondary" size="sm" icon={Download}>
                                Export Suppliers
                            </Button>
                        )}
                        {hasPerm('DAILY_EXPENDITURE_UTILITIES') && (
                            <Button onClick={() => handleExport('utility-bills.xlsx', 'utility-bills.xlsx')} variant="secondary" size="sm" icon={Download}>
                                Export Utilities
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, iconBg, iconColor, subtext, trend }) {
    return (
        <div className="stat-card group">
            <div className="flex items-start justify-between">
                <div className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl ${iconBg} transition-transform duration-200 group-hover:scale-110`}>
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${iconColor}`} />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-xs font-medium ${trend === 'up' ? 'text-red-600' : 'text-emerald-600'}`}>
                        {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        <span>12%</span>
                    </div>
                )}
            </div>
            
            <div className="mt-3 sm:mt-4">
                <p className="text-lg sm:text-2xl font-bold text-gray-900 tracking-tight truncate">{value}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">{title}</p>
            </div>
            
            {subtext && (
                <p className="text-xs text-gray-400 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100 truncate">{subtext}</p>
            )}
        </div>
    );
}
