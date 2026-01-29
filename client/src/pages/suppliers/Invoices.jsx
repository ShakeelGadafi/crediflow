import { useEffect, useState, useCallback } from 'react';
import apiClient from '../../api/apiClient';
import { Plus, FileText, Search, Calendar, X, Download, Eye, ChevronDown, Upload, AlertCircle, Pencil, Trash2 } from 'lucide-react';
import Button from '../../components/Button';
import Badge from '../../components/Badge';

export default function Invoices() {
    const [activeTab, setActiveTab] = useState('all');
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    
    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    
    // Attachment Viewer
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerUrl, setViewerUrl] = useState('');
    const [viewerType, setViewerType] = useState('');
    
    // New Invoice State
    const [newInvoice, setNewInvoice] = useState({
        supplier_name: '', grn_no: '', invoice_no: '', 
        amount: '', invoice_date: new Date().toISOString().split('T')[0], credit_days: 30, notes: ''
    });
    const [attachment, setAttachment] = useState(null);
    
    // Edit Invoice State
    const [editModal, setEditModal] = useState({ open: false, invoice: null });
    const [editInvoice, setEditInvoice] = useState({
        supplier_name: '', grn_no: '', invoice_no: '', 
        amount: '', invoice_date: '', credit_days: 30, notes: ''
    });
    
    // Delete Invoice State
    const [deleteModal, setDeleteModal] = useState({ open: false, invoice: null });
    const [actionLoading, setActionLoading] = useState(false);

    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        try {
            let url = '/api/suppliers/invoices';
            const params = new URLSearchParams();
            
            // Tab-specific URLs
            if (activeTab === 'due_soon') {
                url = '/api/suppliers/invoices/due-soon';
            } else if (activeTab === 'overdue') {
                url = '/api/suppliers/invoices/overdue';
            } else if (activeTab === 'paid') {
                params.append('status', 'PAID');
            }
            
            // Apply filters for 'all' and 'paid' tabs
            if (activeTab === 'all' || activeTab === 'paid') {
                if (dateFrom) params.append('from', dateFrom);
                if (dateTo) params.append('to', dateTo);
                if (searchQuery) params.append('search', searchQuery);
            }
            
            const queryString = params.toString();
            if (queryString) url += `?${queryString}`;
            
            const res = await apiClient.get(url);
            setInvoices(res.data);
        } catch (e) { 
            console.error(e); 
        } finally { 
            setLoading(false); 
        }
    }, [activeTab, searchQuery, dateFrom, dateTo]);

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    const handleCreate = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        Object.keys(newInvoice).forEach(key => formData.append(key, newInvoice[key]));
        if (attachment) formData.append('attachment', attachment);

        try {
            await apiClient.post('/api/suppliers/invoices', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setShowModal(false);
            setNewInvoice({ supplier_name: '', grn_no: '', invoice_no: '', amount: '', invoice_date: new Date().toISOString().split('T')[0], credit_days: 30, notes: '' });
            setAttachment(null);
            fetchInvoices();
        } catch (e) { alert('Failed to create invoice'); }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await apiClient.patch(`/api/suppliers/invoices/${id}/status`, { status: newStatus });
            // Optimistic update
            setInvoices(prevInvoices => 
                prevInvoices.map(inv => 
                    inv.id === id 
                        ? { ...inv, status: newStatus, paid_date: newStatus === 'PAID' ? new Date().toISOString() : null } 
                        : inv
                )
            );
        } catch(e) { 
            alert("Failed to update status"); 
            fetchInvoices(); // Reload on error
        }
    };

    const openEditModal = (invoice) => {
        setEditInvoice({
            supplier_name: invoice.supplier_name || '',
            grn_no: invoice.grn_no || '',
            invoice_no: invoice.invoice_no || '',
            amount: invoice.amount || '',
            invoice_date: invoice.invoice_date ? new Date(invoice.invoice_date).toISOString().split('T')[0] : '',
            credit_days: invoice.credit_days || 30,
            notes: invoice.notes || ''
        });
        setEditModal({ open: true, invoice });
    };

    const handleEditInvoice = async (e) => {
        e.preventDefault();
        if (!editModal.invoice) return;
        setActionLoading(true);
        try {
            await apiClient.put(`/api/suppliers/invoices/${editModal.invoice.id}`, editInvoice);
            setEditModal({ open: false, invoice: null });
            fetchInvoices();
        } catch (e) {
            alert('Failed to update invoice');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteInvoice = async () => {
        if (!deleteModal.invoice) return;
        setActionLoading(true);
        try {
            await apiClient.delete(`/api/suppliers/invoices/${deleteModal.invoice.id}`);
            setDeleteModal({ open: false, invoice: null });
            fetchInvoices();
        } catch (e) {
            alert('Failed to delete invoice');
        } finally {
            setActionLoading(false);
        }
    };

    const clearFilters = () => {
        setSearchQuery('');
        setDateFrom('');
        setDateTo('');
    };

    const openAttachment = (url) => {
        const fullUrl = `${import.meta.env.VITE_API_URL}${url}`;
        const ext = url.split('.').pop().toLowerCase();
        
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
            setViewerType('image');
        } else if (ext === 'pdf') {
            setViewerType('pdf');
        } else {
            // Fallback: open in new tab
            window.open(fullUrl, '_blank');
            return;
        }
        
        setViewerUrl(fullUrl);
        setViewerOpen(true);
    };

    const closeViewer = () => {
        setViewerOpen(false);
        setViewerUrl('');
        setViewerType('');
    };

    // Group invoices by month (for PAID tab)
    const groupByMonth = (invoiceList) => {
        const grouped = {};
        invoiceList.forEach(inv => {
            const date = new Date(inv.paid_date || inv.invoice_date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
            
            if (!grouped[monthKey]) {
                grouped[monthKey] = { label: monthLabel, invoices: [] };
            }
            grouped[monthKey].invoices.push(inv);
        });
        
        return Object.keys(grouped)
            .sort((a, b) => b.localeCompare(a)) // Most recent first
            .map(key => grouped[key]);
    };

    // ESC key handler
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && viewerOpen) {
                closeViewer();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [viewerOpen]);

    const StatusDropdown = ({ invoice }) => {
        const [isOpen, setIsOpen] = useState(false);
        const statuses = ['PAID', 'UNPAID', 'PENDING'];
        
        const getVariant = (status) => {
            if (status === 'PAID') return 'success';
            if (status === 'PENDING') return 'warning';
            return 'danger';
        };
        
        return (
            <div className="relative">
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors ${
                        invoice.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 
                        invoice.status === 'PENDING' ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' :
                        'bg-red-50 text-red-700 hover:bg-red-100'
                    }`}
                >
                    {invoice.status}
                    <ChevronDown className="w-3 h-3" />
                </button>
                
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
                        <div className="absolute right-0 mt-1 w-28 bg-white rounded-lg shadow-lg z-20 border border-gray-100 py-1 animate-scaleIn origin-top-right">
                            {statuses.map(status => (
                                <button
                                    key={status}
                                    onClick={() => {
                                        handleStatusChange(invoice.id, status);
                                        setIsOpen(false);
                                    }}
                                    className={`block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 ${
                                        status === invoice.status ? 'font-medium bg-gray-50' : ''
                                    }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        );
    };

    const monthGroups = activeTab === 'paid' ? groupByMonth(invoices) : [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Supplier Invoices</h1>
                    <p className="text-sm text-gray-500 mt-1">Track supplier payments and due dates</p>
                </div>
                <Button onClick={() => setShowModal(true)} icon={Plus}>
                    Add Invoice
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
                {[
                    { key: 'all', label: 'All' },
                    { key: 'due_soon', label: 'Due Soon' },
                    { key: 'overdue', label: 'Overdue' },
                    { key: 'paid', label: 'Paid' }
                ].map(tab => (
                    <button 
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)} 
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                            activeTab === tab.key 
                                ? 'bg-white text-gray-900 shadow-sm' 
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Filters (only for 'all' and 'paid' tabs) */}
            {(activeTab === 'all' || activeTab === 'paid') && (
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search GRN or Invoice No"
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        
                        <div className="relative">
                            <Calendar className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="date"
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                        </div>
                        
                        <div className="relative">
                            <Calendar className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="date"
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />
                        </div>
                        
                        <Button variant="ghost" onClick={clearFilters} icon={X}>
                            Clear Filters
                        </Button>
                    </div>
                </div>
            )}

            {/* Invoice List */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-gray-200 border-t-indigo-600"></div>
                </div>
            ) : activeTab === 'paid' && monthGroups.length > 0 ? (
                // Grouped by Month View (PAID tab)
                <div className="space-y-6">
                    {monthGroups.map((group, idx) => (
                        <div key={idx} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 rounded-lg">
                                    <Calendar className="w-4 h-4 text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900">{group.label}</h3>
                                    <p className="text-xs text-gray-500">{group.invoices.length} invoice(s)</p>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-100">
                                    <thead>
                                        <tr className="bg-gray-50/50">
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Supplier</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Invoice # / GRN</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Paid Date</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {group.invoices.map(inv => (
                                            <InvoiceRow 
                                                key={inv.id} 
                                                invoice={inv} 
                                                onViewAttachment={openAttachment}
                                                StatusDropdown={StatusDropdown}
                                                onEdit={openEditModal}
                                                onDelete={(inv) => setDeleteModal({ open: true, invoice: inv })}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                // Regular Table View
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead>
                                <tr className="bg-gray-50/80">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Supplier</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Invoice # / GRN</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Due Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {invoices.map(inv => (
                                    <InvoiceRow 
                                        key={inv.id} 
                                        invoice={inv} 
                                        onViewAttachment={openAttachment}
                                        StatusDropdown={StatusDropdown}
                                        onEdit={openEditModal}
                                        onDelete={(inv) => setDeleteModal({ open: true, invoice: inv })}
                                    />
                                ))}
                                {invoices.length === 0 && (
                                    <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center">
                                            <FileText className="w-12 h-12 text-gray-300 mb-2" />
                                            <p className="font-medium">No invoices found</p>
                                            <p className="text-sm">Try adjusting your filters or add a new invoice</p>
                                        </div>
                                    </td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add Invoice Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl animate-scaleIn">
                        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Add New Invoice</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Enter supplier invoice details</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-180px)]">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Supplier Name</label>
                                <input required type="text" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" 
                                    placeholder="Enter supplier name"
                                    value={newInvoice.supplier_name} onChange={e => setNewInvoice({...newInvoice, supplier_name: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Invoice #</label>
                                    <input required type="text" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" 
                                        placeholder="INV-001"
                                        value={newInvoice.invoice_no} onChange={e => setNewInvoice({...newInvoice, invoice_no: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">GRN #</label>
                                    <input type="text" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" 
                                        placeholder="GRN-001"
                                        value={newInvoice.grn_no} onChange={e => setNewInvoice({...newInvoice, grn_no: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">LKR</span>
                                    <input required type="number" step="0.01" className="w-full border border-gray-200 rounded-lg pl-12 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" 
                                        placeholder="0.00"
                                        value={newInvoice.amount} onChange={e => setNewInvoice({...newInvoice, amount: e.target.value})}
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Invoice Date</label>
                                    <input required type="date" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" 
                                        value={newInvoice.invoice_date} onChange={e => setNewInvoice({...newInvoice, invoice_date: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Credit Days</label>
                                    <input required type="number" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" 
                                        placeholder="30"
                                        value={newInvoice.credit_days} onChange={e => setNewInvoice({...newInvoice, credit_days: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Attachment</label>
                                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-indigo-300 transition-colors">
                                    <input type="file" className="hidden" id="invoice-attachment"
                                        onChange={e => setAttachment(e.target.files[0])}
                                    />
                                    <label htmlFor="invoice-attachment" className="cursor-pointer">
                                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm text-gray-600">
                                            {attachment ? attachment.name : 'Click to upload or drag and drop'}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">PDF, PNG, JPG up to 10MB</p>
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                                <textarea rows="3" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow resize-none" 
                                    placeholder="Add any additional notes..."
                                    value={newInvoice.notes} onChange={e => setNewInvoice({...newInvoice, notes: e.target.value})}
                                />
                            </div>
                        </form>
                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                            <Button onClick={handleCreate}>Save Invoice</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Attachment Viewer Modal */}
            {viewerOpen && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={closeViewer}>
                    <button 
                        onClick={closeViewer}
                        className="absolute top-6 right-6 text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl p-3"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    
                    <div className="max-w-6xl max-h-[90vh] w-full animate-scaleIn" onClick={(e) => e.stopPropagation()}>
                        {viewerType === 'image' && (
                            <img 
                                src={viewerUrl} 
                                alt="Invoice Attachment" 
                                className="max-w-full max-h-[90vh] mx-auto rounded-xl shadow-2xl"
                            />
                        )}
                        {viewerType === 'pdf' && (
                            <iframe 
                                src={viewerUrl} 
                                className="w-full h-[90vh] rounded-xl shadow-2xl bg-white"
                                title="PDF Viewer"
                            />
                        )}
                    </div>
                    
                    <a
                        href={viewerUrl}
                        download
                        className="absolute bottom-6 right-6 bg-white text-gray-900 px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-gray-100 transition-colors shadow-lg font-medium"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Download className="w-4 h-4" />
                        Download
                    </a>
                </div>
            )}

            {/* Edit Invoice Modal */}
            {editModal.open && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl animate-scaleIn">
                        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Edit Invoice</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Update invoice details</p>
                            </div>
                            <button onClick={() => setEditModal({ open: false, invoice: null })} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleEditInvoice} className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-180px)]">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Supplier Name</label>
                                <input required type="text" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" 
                                    value={editInvoice.supplier_name} onChange={e => setEditInvoice({...editInvoice, supplier_name: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Invoice #</label>
                                    <input required type="text" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" 
                                        value={editInvoice.invoice_no} onChange={e => setEditInvoice({...editInvoice, invoice_no: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">GRN #</label>
                                    <input type="text" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" 
                                        value={editInvoice.grn_no} onChange={e => setEditInvoice({...editInvoice, grn_no: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">LKR</span>
                                    <input required type="number" step="0.01" className="w-full border border-gray-200 rounded-lg pl-12 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" 
                                        value={editInvoice.amount} onChange={e => setEditInvoice({...editInvoice, amount: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Invoice Date</label>
                                    <input required type="date" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" 
                                        value={editInvoice.invoice_date} onChange={e => setEditInvoice({...editInvoice, invoice_date: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Credit Days</label>
                                    <input required type="number" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" 
                                        value={editInvoice.credit_days} onChange={e => setEditInvoice({...editInvoice, credit_days: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                                <textarea rows="3" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow resize-none" 
                                    value={editInvoice.notes} onChange={e => setEditInvoice({...editInvoice, notes: e.target.value})}
                                />
                            </div>
                        </form>
                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                            <Button variant="ghost" onClick={() => setEditModal({ open: false, invoice: null })}>Cancel</Button>
                            <Button onClick={handleEditInvoice} disabled={actionLoading}>{actionLoading ? 'Saving...' : 'Save Changes'}</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Invoice Confirmation Modal */}
            {deleteModal.open && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-xl w-full max-w-md shadow-2xl animate-scaleIn overflow-hidden">
                        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-900">Delete Invoice</h2>
                            <button onClick={() => setDeleteModal({ open: false, invoice: null })} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-600">
                                Are you sure you want to delete invoice <strong>{deleteModal.invoice?.invoice_no}</strong> from <strong>{deleteModal.invoice?.supplier_name}</strong>? 
                                This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                            <Button variant="ghost" onClick={() => setDeleteModal({ open: false, invoice: null })}>Cancel</Button>
                            <Button variant="danger" onClick={handleDeleteInvoice} disabled={actionLoading}>{actionLoading ? 'Deleting...' : 'Delete Invoice'}</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Separate component for invoice row to avoid repetition
function InvoiceRow({ invoice, onViewAttachment, StatusDropdown, onEdit, onDelete }) {
    const isPaid = invoice.status === 'PAID';
    const isOverdue = new Date(invoice.due_date) < new Date() && invoice.status === 'UNPAID';
    
    return (
        <tr className="hover:bg-indigo-50/30 transition-colors">
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-semibold">
                        {invoice.supplier_name?.charAt(0)?.toUpperCase() || 'S'}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{invoice.supplier_name}</span>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{invoice.invoice_no}</div>
                <div className="text-xs text-gray-500">GRN: {invoice.grn_no || 'N/A'}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-semibold text-gray-900">
                    LKR {Number(invoice.amount).toLocaleString()}
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                {isPaid && invoice.paid_date ? (
                    <div>
                        <div className="text-sm font-medium text-gray-900">
                            {new Date(invoice.paid_date).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-emerald-600">Paid</div>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5">
                        <span className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                            {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}
                        </span>
                        {isOverdue && <AlertCircle className="w-4 h-4 text-red-500" />}
                    </div>
                )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <StatusDropdown invoice={invoice} />
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-1">
                    {invoice.attachment_url && (
                        <button 
                            onClick={() => onViewAttachment(invoice.attachment_url)} 
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" 
                            title="View Attachment"
                        >
                            <Eye className="w-4 h-4"/>
                        </button>
                    )}
                    {invoice.notes && (
                        <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title={invoice.notes}>
                            <FileText className="w-4 h-4"/>
                        </button>
                    )}
                    <button 
                        onClick={() => onEdit(invoice)} 
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" 
                        title="Edit Invoice"
                    >
                        <Pencil className="w-4 h-4"/>
                    </button>
                    <button 
                        onClick={() => onDelete(invoice)} 
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                        title="Delete Invoice"
                    >
                        <Trash2 className="w-4 h-4"/>
                    </button>
                </div>
            </td>
        </tr>
    );
}
