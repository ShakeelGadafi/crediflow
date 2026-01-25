import { useEffect, useState, useCallback } from 'react';
import apiClient from '../../api/apiClient';
import { Plus, CheckCircle, FileText, AlertCircle, Search, Calendar, X, Download, Eye, ChevronDown } from 'lucide-react';

export default function Invoices() {
    const [activeTab, setActiveTab] = useState('all'); // all, due_soon, overdue, paid
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
    const [viewerType, setViewerType] = useState(''); // 'image' or 'pdf'
    
    // New Invoice State
    const [newInvoice, setNewInvoice] = useState({
        supplier_name: '', grn_no: '', invoice_no: '', 
        amount: '', invoice_date: new Date().toISOString().split('T')[0], credit_days: 30, notes: ''
    });
    const [attachment, setAttachment] = useState(null);

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
        
        return (
            <div className="relative">
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className={`px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full cursor-pointer ${
                        invoice.status === 'PAID' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 
                        invoice.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' :
                        'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                >
                    {invoice.status}
                    <ChevronDown className="w-3 h-3 ml-1" />
                </button>
                
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
                        <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg z-20 border border-gray-200">
                            {statuses.map(status => (
                                <button
                                    key={status}
                                    onClick={() => {
                                        handleStatusChange(invoice.id, status);
                                        setIsOpen(false);
                                    }}
                                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                                        status === invoice.status ? 'font-bold bg-gray-50' : ''
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
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Supplier Invoices</h1>
                <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700 shadow-sm transition-all">
                    <Plus className="w-4 h-4 mr-2" /> Add Invoice
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b space-x-1 bg-white rounded-t-lg px-4">
                {[
                    { key: 'all', label: 'All Invoices' },
                    { key: 'due_soon', label: 'Due Soon (7 Days)' },
                    { key: 'overdue', label: 'Overdue' },
                    { key: 'paid', label: 'Paid Invoices' }
                ].map(tab => (
                    <button 
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)} 
                        className={`pb-3 pt-4 px-4 font-medium text-sm transition-all ${
                            activeTab === tab.key 
                                ? 'border-b-2 border-indigo-600 text-indigo-600' 
                                : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Filters (only for 'all' and 'paid' tabs) */}
            {(activeTab === 'all' || activeTab === 'paid') && (
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by GRN or Invoice No"
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        
                        {/* Date From */}
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="date"
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                placeholder="From Date"
                            />
                        </div>
                        
                        {/* Date To */}
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="date"
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                placeholder="To Date"
                            />
                        </div>
                        
                        {/* Clear Filters */}
                        <button
                            onClick={clearFilters}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center"
                        >
                            <X className="w-4 h-4 mr-2" />
                            Clear Filters
                        </button>
                    </div>
                </div>
            )}

            {/* Invoice List */}
            {loading ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500">Loading invoices...</p>
                </div>
            ) : activeTab === 'paid' && monthGroups.length > 0 ? (
                // Grouped by Month View (PAID tab)
                <div className="space-y-6">
                    {monthGroups.map((group, idx) => (
                        <div key={idx} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-3 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-800">{group.label}</h3>
                                <p className="text-xs text-gray-500">{group.invoices.length} invoice(s)</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice # / GRN</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {group.invoices.map(inv => (
                                            <InvoiceRow 
                                                key={inv.id} 
                                                invoice={inv} 
                                                onViewAttachment={openAttachment}
                                                StatusDropdown={StatusDropdown}
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
                <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice # / GRN</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {invoices.map(inv => (
                                    <InvoiceRow 
                                        key={inv.id} 
                                        invoice={inv} 
                                        onViewAttachment={openAttachment}
                                        StatusDropdown={StatusDropdown}
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Add New Invoice</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label>
                                <input required type="text" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500" 
                                    value={newInvoice.supplier_name} onChange={e => setNewInvoice({...newInvoice, supplier_name: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Invoice #</label>
                                    <input required type="text" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500" 
                                        value={newInvoice.invoice_no} onChange={e => setNewInvoice({...newInvoice, invoice_no: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">GRN #</label>
                                    <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500" 
                                        value={newInvoice.grn_no} onChange={e => setNewInvoice({...newInvoice, grn_no: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                                <input required type="number" step="0.01" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500" 
                                    value={newInvoice.amount} onChange={e => setNewInvoice({...newInvoice, amount: e.target.value})}
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
                                    <input required type="date" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500" 
                                        value={newInvoice.invoice_date} onChange={e => setNewInvoice({...newInvoice, invoice_date: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Credit Days</label>
                                    <input required type="number" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500" 
                                        value={newInvoice.credit_days} onChange={e => setNewInvoice({...newInvoice, credit_days: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Attachment</label>
                                <input type="file" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500" 
                                    onChange={e => setAttachment(e.target.files[0])}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea rows="3" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500" 
                                     value={newInvoice.notes} onChange={e => setNewInvoice({...newInvoice, notes: e.target.value})}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors">Cancel</button>
                                <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-sm transition-colors">Save Invoice</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Attachment Viewer Modal */}
            {viewerOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4" onClick={closeViewer}>
                    <button 
                        onClick={closeViewer}
                        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full p-2"
                    >
                        <X className="w-8 h-8" />
                    </button>
                    
                    <div className="max-w-6xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
                        {viewerType === 'image' && (
                            <img 
                                src={viewerUrl} 
                                alt="Invoice Attachment" 
                                className="max-w-full max-h-[90vh] mx-auto rounded-lg shadow-2xl"
                            />
                        )}
                        {viewerType === 'pdf' && (
                            <iframe 
                                src={viewerUrl} 
                                className="w-full h-[90vh] rounded-lg shadow-2xl bg-white"
                                title="PDF Viewer"
                            />
                        )}
                    </div>
                    
                    <a
                        href={viewerUrl}
                        download
                        className="absolute bottom-4 right-4 bg-white text-gray-900 px-4 py-2 rounded-lg flex items-center hover:bg-gray-100 transition-colors shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                    </a>
                </div>
            )}
        </div>
    );
}

// Separate component for invoice row to avoid repetition
function InvoiceRow({ invoice, onViewAttachment, StatusDropdown }) {
    const isPaid = invoice.status === 'PAID';
    const isOverdue = new Date(invoice.due_date) < new Date() && invoice.status === 'UNPAID';
    
    return (
        <tr className="hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{invoice.supplier_name}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">Inv: {invoice.invoice_no}</div>
                <div className="text-xs text-gray-500">GRN: {invoice.grn_no || 'N/A'}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-semibold text-gray-900">
                    ${Number(invoice.amount).toLocaleString()}
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">
                    {isPaid && invoice.paid_date ? (
                        <>
                            <div className="text-gray-900 font-medium">
                                {new Date(invoice.paid_date).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-400">Paid</div>
                        </>
                    ) : (
                        <>
                            {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}
                            {isOverdue && <AlertCircle className="w-4 h-4 text-red-500 inline ml-1"/>}
                        </>
                    )}
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <StatusDropdown invoice={invoice} />
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm">
                <div className="flex items-center space-x-3">
                    {invoice.attachment_url && (
                        <button 
                            onClick={() => onViewAttachment(invoice.attachment_url)} 
                            className="text-indigo-600 hover:text-indigo-900 transition-colors" 
                            title="View Attachment"
                        >
                            <Eye className="w-4 h-4"/>
                        </button>
                    )}
                    {invoice.notes && (
                        <span className="text-gray-400" title={invoice.notes}>
                            <FileText className="w-4 h-4"/>
                        </span>
                    )}
                </div>
            </td>
        </tr>
    );
}
