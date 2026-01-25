import React, { useEffect, useState } from 'react';
import apiClient from '../api/apiClient';
import { useAuth } from '../auth/useAuth';
import { TrendingUp, AlertCircle, Calendar, Package, Download } from 'lucide-react';
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
        <div>
            <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {creditStats && (
                    <DashboardCard 
                        title="Credit Unpaid Total" 
                        value={formatCurrency(creditStats.total_outstanding)} 
                        color="bg-blue-500" 
                        icon={TrendingUp}
                    />
                )}
                {utilityStats && (
                    <DashboardCard 
                        title="Utilities Due Soon" 
                        value={utilityStats.due_soon?.length || 0} 
                        color="bg-yellow-500" 
                        icon={Calendar}
                        subtext={`${formatCurrency(utilityStats.total_unpaid)} Unpaid`}
                    />
                )}
                {expenditureStats && (
                    <DashboardCard 
                        title="Monthly Expenditure" 
                        value={formatCurrency(expenditureStats.total)} 
                        color="bg-green-500" 
                        icon={Package}
                    />
                )}
                {supplierStats && (
                    <DashboardCard 
                        title="Supplier Overdue" 
                        value={supplierStats.overdue_summary?.count || 0} 
                        color="bg-red-500"
                        icon={AlertCircle}
                        subtext={`Amount: ${formatCurrency(supplierStats.overdue_summary?.amount)}`}
                    />
                )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center mb-4">
                    <Download className="w-5 h-5 text-indigo-600 mr-2" />
                    <h2 className="text-xl font-bold text-gray-800">Data Export</h2>
                </div>
                <div className="flex flex-wrap gap-3">
                    {hasPerm('CREDIT_TO_COME') && <Button onClick={() => handleExport('credit-bills.csv', 'credit-bills.csv')} variant="secondary" icon={Download}>Export Credit</Button>}
                    {hasPerm('DAILY_EXPENDITURE_TRACKER') && <Button onClick={() => handleExport('expenditures.csv', 'expenditures.csv')} variant="secondary" icon={Download}>Export Expenditure</Button>}
                    {hasPerm('GRN_CREDIT_REMINDER') && <Button onClick={() => handleExport('supplier-invoices.csv', 'supplier-invoices.csv')} variant="secondary" icon={Download}>Export Suppliers</Button>}
                    {hasPerm('DAILY_EXPENDITURE_UTILITIES') && <Button onClick={() => handleExport('utility-bills.csv', 'utility-bills.csv')} variant="secondary" icon={Download}>Export Utilities</Button>}
                </div>
            </div>
        </div>
    );
}

function DashboardCard({ title, value, color, subtext, icon: Icon }) {
    return (
        <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md hover:-translate-y-1 relative overflow-hidden group`}>
            {/* Colorful accent at top */}
            <div className={`absolute top-0 left-0 w-full h-1 ${color}`}></div>
            
            <div className="flex justify-between items-start mb-4">
                 <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider">{title}</h3>
                 {Icon && <Icon className="w-5 h-5 text-gray-300 group-hover:text-indigo-500 transition-colors" />}
            </div>
            
            <p className="text-3xl font-extrabold text-gray-800">{value}</p>
            {subtext && <p className="text-sm font-medium text-gray-400 mt-2 flex items-center">{subtext}</p>}
            
            {/* Decoration */}
            <div className="absolute -bottom-4 -right-4 opacity-5 pointer-events-none">
                 <div className={`w-24 h-24 rounded-full ${color.replace('border-', 'bg-')}`}></div>
            </div>
        </div>
    );
}

function ExportButton({ onClick, label }) {
    return (
        <button onClick={onClick} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg shadow-sm hover:bg-gray-50 hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-center">
             <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            {label}
        </button>
    );
}
