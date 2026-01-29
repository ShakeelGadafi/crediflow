import { useEffect, useState } from 'react';
import apiClient from '../../api/apiClient';
import { Plus, CheckCircle, Calendar, FileText, Search, Filter, Download, X, RotateCcw, Pencil, Trash2 } from 'lucide-react';
import Button from '../../components/Button';
import Badge from '../../components/Badge';

export default function Utilities() {
    const [activeTab, setActiveTab] = useState('monthly');
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    
    // Filters for "All Data" tab
    const [search, setSearch] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    // New Bill Form State
    const [newBill, setNewBill] = useState({
        branch_name: '',
        bill_type: '',
        bill_no: '',
        amount: '',
        due_date: '',
        notes: ''
    });
    const [attachment, setAttachment] = useState(null);

    // Edit Bill State
    const [editModal, setEditModal] = useState({ open: false, bill: null });
    const [editBill, setEditBill] = useState({
        branch_name: '', bill_type: '', bill_no: '', amount: '', due_date: '', notes: ''
    });

    // Delete Bill State
    const [deleteModal, setDeleteModal] = useState({ open: false, bill: null });
    const [actionLoading, setActionLoading] = useState(false);

    const fetchBills = async () => {
        setLoading(true);
        try {
            const params = {};
            if (activeTab === 'all') {
                if (search) params.search = search;
                if (dateRange.start) params.startDate = dateRange.start;
                if (dateRange.end) params.endDate = dateRange.end;
            }
            
            const res = await apiClient.get('/api/utilities', { params });
            setBills(res.data);
        } catch (e) { 
            console.error(e); 
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => {
        fetchBills();
    }, [activeTab]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchBills();
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        Object.keys(newBill).forEach(key => formData.append(key, newBill[key]));
        if (attachment) formData.append('attachment', attachment);

        try {
            await apiClient.post('/api/utilities', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setShowModal(false);
            setNewBill({ branch_name: '', bill_type: '', bill_no: '', amount: '', due_date: '', notes: '' });
            setAttachment(null);
            fetchBills();
        } catch (e) { alert('Failed to create utility bill'); }
    };

    const handleMarkPaid = async (id) => {
        if (!confirm("Are you sure you want to mark this bill as PAID?")) return;
        try {
            await apiClient.patch(`/api/utilities/${id}/mark-paid`);
            fetchBills();
        } catch(e) { alert("Failed to mark paid"); }
    };

    const handleMarkUnpaid = async (id) => {
        if (!confirm("Are you sure you want to mark this bill as UNPAID?")) return;
        try {
            await apiClient.patch(`/api/utilities/${id}/mark-unpaid`);
            fetchBills();
        } catch(e) { alert("Failed to mark unpaid"); }
    };

    const openEditModal = (bill) => {
        setEditBill({
            branch_name: bill.branch_name || '',
            bill_type: bill.bill_type || '',
            bill_no: bill.bill_no || '',
            amount: bill.amount || '',
            due_date: bill.due_date ? new Date(bill.due_date).toISOString().split('T')[0] : '',
            notes: bill.notes || ''
        });
        setEditModal({ open: true, bill });
    };

    const handleEditBill = async (e) => {
        e.preventDefault();
        if (!editModal.bill) return;
        setActionLoading(true);
        try {
            await apiClient.put(`/api/utilities/${editModal.bill.id}`, editBill);
            setEditModal({ open: false, bill: null });
            fetchBills();
        } catch (e) {
            alert('Failed to update bill');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteBill = async () => {
        if (!deleteModal.bill) return;
        setActionLoading(true);
        try {
            await apiClient.delete(`/api/utilities/${deleteModal.bill.id}`);
            setDeleteModal({ open: false, bill: null });
            fetchBills();
        } catch (e) {
            alert('Failed to delete bill');
        } finally {
            setActionLoading(false);
        }
    };

    // Grouping for Monthly View
    const groupedBills = bills.reduce((acc, bill) => {
        const date = new Date(bill.due_date);
        const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!acc[monthYear]) acc[monthYear] = [];
        acc[monthYear].push(bill);
        return acc;
    }, {});

    const sortedMonths = Object.keys(groupedBills).sort((a, b) => {
        return new Date(b) - new Date(a);
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Utility Bills</h1>
                    <p className="text-sm text-gray-500 mt-1">Track and manage utility payments</p>
                </div>
                <Button onClick={() => setShowModal(true)} icon={Plus}>
                    Add Bill
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
                <button
                    onClick={() => setActiveTab('monthly')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                        activeTab === 'monthly'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    Monthly View
                </button>
                <button
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                        activeTab === 'all'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    All Data
                </button>
            </div>

            {/* Add Bill Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scaleIn">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-900">Add Utility Bill</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Branch Name</label>
                                <input type="text" required
                                    className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={newBill.branch_name}
                                    onChange={e => setNewBill({...newBill, branch_name: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Bill Type</label>
                                    <input type="text" required placeholder="e.g. Electricity"
                                        className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        value={newBill.bill_type}
                                        onChange={e => setNewBill({...newBill, bill_type: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Bill No</label>
                                    <input type="text" placeholder="Optional"
                                        className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        value={newBill.bill_no}
                                        onChange={e => setNewBill({...newBill, bill_no: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount</label>
                                    <input type="number" required step="0.01"
                                        className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        value={newBill.amount}
                                        onChange={e => setNewBill({...newBill, amount: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date</label>
                                    <input type="date" required
                                        className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        value={newBill.due_date}
                                        onChange={e => setNewBill({...newBill, due_date: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                                <textarea rows="2"
                                    className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={newBill.notes}
                                    onChange={e => setNewBill({...newBill, notes: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Attachment</label>
                                <input type="file"
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                    onChange={e => setAttachment(e.target.files[0])}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <Button type="button" onClick={() => setShowModal(false)} variant="ghost">Cancel</Button>
                                <Button type="submit">Save Bill</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Bill Modal */}
            {editModal.open && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scaleIn">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-900">Edit Utility Bill</h2>
                            <button onClick={() => setEditModal({ open: false, bill: null })} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleEditBill} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Branch Name</label>
                                <input type="text" required
                                    className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={editBill.branch_name}
                                    onChange={e => setEditBill({...editBill, branch_name: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Bill Type</label>
                                    <input type="text" required placeholder="e.g. Electricity"
                                        className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        value={editBill.bill_type}
                                        onChange={e => setEditBill({...editBill, bill_type: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Bill No</label>
                                    <input type="text" placeholder="Optional"
                                        className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        value={editBill.bill_no}
                                        onChange={e => setEditBill({...editBill, bill_no: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount</label>
                                    <input type="number" required step="0.01"
                                        className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        value={editBill.amount}
                                        onChange={e => setEditBill({...editBill, amount: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date</label>
                                    <input type="date" required
                                        className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        value={editBill.due_date}
                                        onChange={e => setEditBill({...editBill, due_date: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                                <textarea rows="2"
                                    className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={editBill.notes}
                                    onChange={e => setEditBill({...editBill, notes: e.target.value})}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <Button type="button" onClick={() => setEditModal({ open: false, bill: null })} variant="ghost">Cancel</Button>
                                <Button type="submit" disabled={actionLoading}>
                                    {actionLoading ? 'Saving...' : 'Update Bill'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModal.open && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-scaleIn">
                        <div className="p-6 text-center">
                            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Bill</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Are you sure you want to delete the {deleteModal.bill?.bill_type} bill for {deleteModal.bill?.branch_name}? This action cannot be undone.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <Button variant="ghost" onClick={() => setDeleteModal({ open: false, bill: null })}>
                                    Cancel
                                </Button>
                                <Button variant="danger" onClick={handleDeleteBill} disabled={actionLoading}>
                                    {actionLoading ? 'Deleting...' : 'Delete'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Search/Filter for All Data tab */}
            {activeTab === 'all' && (
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Search</label>
                            <div className="relative">
                                <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search by Branch, Type or Bill No..." 
                                    className="pl-10 w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
                            <input 
                                type="date" 
                                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                value={dateRange.start}
                                onChange={e => setDateRange({...dateRange, start: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
                            <input 
                                type="date" 
                                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                value={dateRange.end}
                                onChange={e => setDateRange({...dateRange, end: e.target.value})}
                            />
                        </div>
                        <Button type="submit" variant="secondary" icon={Filter}>
                            Filter
                        </Button>
                    </form>
                </div>
            )}

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-gray-200 border-t-indigo-600"></div>
                </div>
            ) : (
                <div className="space-y-6">
                    {activeTab === 'monthly' ? (
                        sortedMonths.length === 0 ? (
                            <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
                                <p className="text-gray-500">No bills found.</p>
                            </div>
                        ) : (
                            sortedMonths.map(month => (
                                <div key={month} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                                        <div className="p-2 bg-indigo-100 rounded-lg">
                                            <Calendar className="w-4 h-4 text-indigo-600" />
                                        </div>
                                        <h3 className="text-sm font-semibold text-gray-900">{month}</h3>
                                    </div>
                                    <BillsTable bills={groupedBills[month]} handleMarkPaid={handleMarkPaid} handleMarkUnpaid={handleMarkUnpaid} onEdit={openEditModal} onDelete={(b) => setDeleteModal({ open: true, bill: b })} />
                                </div>
                            ))
                        )
                    ) : (
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                            <BillsTable bills={bills} handleMarkPaid={handleMarkPaid} handleMarkUnpaid={handleMarkUnpaid} onEdit={openEditModal} onDelete={(b) => setDeleteModal({ open: true, bill: b })} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function BillsTable({ bills, handleMarkPaid, handleMarkUnpaid, onEdit, onDelete }) {
    if (!bills?.length) return <div className="p-16 text-center text-gray-500">No data available</div>;

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
                <thead>
                    <tr className="bg-gray-50/50">
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Branch</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Bill Type</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">Bill No</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">Due Date</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {bills.map(b => (
                        <tr key={b.id} className="hover:bg-indigo-50/30 transition-colors">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{b.branch_name}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{b.bill_type}</td>
                            <td className="px-6 py-4 text-sm text-gray-500 hidden sm:table-cell">{b.bill_no || '—'}</td>
                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">${Number(b.amount).toLocaleString()}</td>
                            <td className="px-6 py-4 text-sm text-gray-600 hidden md:table-cell">
                                {new Date(b.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="px-6 py-4">
                                <Badge variant={b.status === 'PAID' ? 'success' : 'warning'} dot>
                                    {b.status}
                                </Badge>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-1">
                                    {b.status === 'UNPAID' ? (
                                        <button 
                                            onClick={() => handleMarkPaid(b.id)} 
                                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" 
                                            title="Mark Paid"
                                        >
                                            <CheckCircle className="w-4 h-4"/>
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => handleMarkUnpaid(b.id)} 
                                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" 
                                            title="Mark Unpaid"
                                        >
                                            <RotateCcw className="w-4 h-4"/>
                                        </button>
                                    )}
                                    <a 
                                        href={`${import.meta.env.VITE_API_URL}/api/utilities/${b.id}/calendar.ics?token=${localStorage.getItem('token')}`} 
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors hidden sm:block"
                                        title="Download Calendar Event"
                                    >
                                        <Download className="w-4 h-4" />
                                    </a>
                                    {b.attachment_url && (
                                        <a 
                                            href={`${import.meta.env.VITE_API_URL}${b.attachment_url}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                                            title="View Attachment"
                                        >
                                            <FileText className="w-4 h-4" />
                                        </a>
                                    )}
                                    <button 
                                        onClick={() => onEdit(b)} 
                                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" 
                                        title="Edit Bill"
                                    >
                                        <Pencil className="w-4 h-4"/>
                                    </button>
                                    <button 
                                        onClick={() => onDelete(b)} 
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                                        title="Delete Bill"
                                    >
                                        <Trash2 className="w-4 h-4"/>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
