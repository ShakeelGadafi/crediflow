import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { Plus, CheckCircle, FileText, X, RotateCcw, ArrowLeft, Phone, MapPin, Upload, Pencil, Trash2 } from 'lucide-react';
import Button from '../../components/Button';
import Badge from '../../components/Badge';

export default function CustomerDetails() {
    const { id } = useParams();
    const [customer, setCustomer] = useState(null);
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [amount, setAmount] = useState('');
    const [billNo, setBillNo] = useState('');
    const [billDate, setBillDate] = useState('');
    const [attachment, setAttachment] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [editBillModal, setEditBillModal] = useState({ open: false, bill: null });
    const [editBillData, setEditBillData] = useState({ bill_no: '', bill_date: '', amount: '' });
    const [deleteBillModal, setDeleteBillModal] = useState({ open: false, bill: null });
    const [actionLoading, setActionLoading] = useState(false);

    const fetchData = async () => {
        try {
            const [custRes, billRes] = await Promise.all([
                apiClient.get(`/api/credit/customers/${id}`),
                apiClient.get(`/api/credit/customers/${id}/bills`)
            ]);
            setCustomer(custRes.data);
            setBills(billRes.data);
        } catch (e) { console.error(e); } 
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleAddBill = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('amount', amount);
        formData.append('bill_no', billNo);
        if (billDate) formData.append('bill_date', billDate);
        if (attachment) {
            formData.append('attachment', attachment);
        }
        
        try {
            await apiClient.post(`/api/credit/customers/${id}/bills`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setShowModal(false);
            setAmount('');
            setBillNo('');
            setBillDate('');
            setAttachment(null);
            fetchData();
        } catch (e) { alert('Failed to add bill'); }
    };

    const handleMarkPaid = async (billId) => {
        if (!confirm("Are you sure you want to mark this bill as PAID?")) return;
        try {
            await apiClient.patch(`/api/credit/bills/${billId}/mark-paid`);
            fetchData();
        } catch(e) { alert("Failed to update status"); }
    };

    const handleMarkUnpaid = async (billId) => {
        if (!confirm("Are you sure you want to mark this bill as UNPAID?")) return;
        try {
            await apiClient.patch(`/api/credit/bills/${billId}/mark-unpaid`);
            fetchData();
        } catch(e) { alert("Failed to update status"); }
    };

    const openEditBillModal = (bill) => {
        setEditBillData({
            bill_no: bill.bill_no || '',
            bill_date: bill.bill_date ? new Date(bill.bill_date).toISOString().split('T')[0] : '',
            amount: bill.amount || ''
        });
        setEditBillModal({ open: true, bill });
    };

    const handleEditBill = async (e) => {
        e.preventDefault();
        if (!editBillModal.bill) return;
        setActionLoading(true);
        try {
            await apiClient.put(`/api/credit/bills/${editBillModal.bill.id}`, editBillData);
            setEditBillModal({ open: false, bill: null });
            fetchData();
        } catch (e) {
            alert('Failed to update bill');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteBill = async () => {
        if (!deleteBillModal.bill) return;
        setActionLoading(true);
        try {
            await apiClient.delete(`/api/credit/bills/${deleteBillModal.bill.id}`);
            setDeleteBillModal({ open: false, bill: null });
            fetchData();
        } catch (e) {
            alert('Failed to delete bill');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-gray-200 border-t-indigo-600"></div>
        </div>
    );
    if (!customer) return (
        <div className="text-center py-12">
            <p className="text-gray-500">Customer not found.</p>
            <Link to="/credit/customers" className="text-indigo-600 hover:text-indigo-700 mt-2 inline-block">
                ← Back to customers
            </Link>
        </div>
    );

    const totalUnpaid = bills.filter(b => b.status === 'UNPAID').reduce((sum, b) => sum + Number(b.amount), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <Link to="/credit/customers" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors text-sm">
                    <ArrowLeft className="w-4 h-4" /> Back to Customers
                </Link>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-200">
                        {customer.full_name?.charAt(0)?.toUpperCase() || 'C'}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{customer.full_name}</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Customer Details</p>
                    </div>
                </div>
                <div className="bg-red-50 border border-red-100 px-5 py-3 rounded-xl">
                    <p className="text-xs text-red-600 font-medium">Total Unpaid</p>
                    <p className="text-xl font-bold text-red-700">LKR {totalUnpaid.toLocaleString()}</p>
                </div>
            </div>

            {/* Customer Info Card */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                            <Phone className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Phone</p>
                            <p className="text-sm font-medium text-gray-900 mt-0.5">{customer.phone || 'Not provided'}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                            <MapPin className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Address</p>
                            <p className="text-sm font-medium text-gray-900 mt-0.5">{customer.address || 'Not provided'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bills Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-lg font-semibold text-gray-900">Bills History</h2>
                <Button onClick={() => setShowModal(true)} icon={Plus}>
                    Add Bill
                </Button>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead>
                        <tr className="bg-gray-50/80">
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Bill No</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Attachment</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {bills.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                    <FileText className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                                    <p className="font-medium">No bills yet</p>
                                    <p className="text-sm mt-1">Add the first bill for this customer</p>
                                </td>
                            </tr>
                        ) : bills.map(b => (
                            <tr key={b.id} className="hover:bg-indigo-50/30 transition-colors">
                                <td className="px-6 py-4 text-sm text-gray-900">{new Date(b.created_at).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{b.bill_no || '-'}</td>
                                <td className="px-6 py-4 text-sm font-semibold text-gray-900">LKR {Number(b.amount).toLocaleString()}</td>
                                <td className="px-6 py-4">
                                    <Badge variant={b.status === 'PAID' ? 'success' : 'danger'} dot>
                                        {b.status}
                                    </Badge>
                                </td>
                                <td className="px-6 py-4">
                                    {b.attachment_url ? (
                                        <button 
                                            onClick={() => setPreviewUrl(`${import.meta.env.VITE_API_URL}${b.attachment_url}`)}
                                            className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                                        >
                                            <FileText className="w-4 h-4"/> View
                                        </button>
                                    ) : <span className="text-gray-400 text-sm">-</span>}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        {b.status === 'UNPAID' ? (
                                            <button onClick={() => handleMarkPaid(b.id)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Mark Paid">
                                                <CheckCircle className="w-4 h-4"/>
                                            </button>
                                        ) : (
                                            <button onClick={() => handleMarkUnpaid(b.id)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Mark Unpaid">
                                                <RotateCcw className="w-4 h-4"/>
                                            </button>
                                        )}
                                        <button onClick={() => openEditBillModal(b)} className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit Bill">
                                            <Pencil className="w-4 h-4"/>
                                        </button>
                                        <button onClick={() => setDeleteBillModal({ open: true, bill: b })} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Bill">
                                            <Trash2 className="w-4 h-4"/>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add Bill Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-xl w-full max-w-md shadow-2xl animate-scaleIn overflow-hidden">
                        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Add Bill</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Add a new bill for this customer</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAddBill} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Bill Number</label>
                                <input type="text" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" 
                                    value={billNo} onChange={e => setBillNo(e.target.value)}
                                    placeholder="Optional"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">LKR</span>
                                    <input required type="number" step="0.01" className="w-full border border-gray-200 rounded-lg pl-12 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" 
                                        value={amount} onChange={e => setAmount(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Bill Date</label>
                                <input type="date" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" 
                                    value={billDate} onChange={e => setBillDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Attachment</label>
                                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-indigo-300 transition-colors">
                                    <input type="file" className="hidden" id="bill-attachment"
                                        onChange={e => setAttachment(e.target.files[0])}
                                    />
                                    <label htmlFor="bill-attachment" className="cursor-pointer">
                                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm text-gray-600">
                                            {attachment ? attachment.name : 'Click to upload'}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">PDF, PNG, JPG up to 10MB</p>
                                    </label>
                                </div>
                            </div>
                        </form>
                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                            <Button onClick={handleAddBill}>Save Bill</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Attachment Preview Modal */}
            {previewUrl && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={() => setPreviewUrl(null)}>
                    <button 
                        onClick={() => setPreviewUrl(null)}
                        className="absolute top-6 right-6 text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl p-3"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <div className="max-w-4xl max-h-full animate-scaleIn" onClick={e => e.stopPropagation()}>
                        <img src={previewUrl} alt="Attachment" className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" />
                    </div>
                </div>
            )}

            {/* Edit Bill Modal */}
            {editBillModal.open && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-xl w-full max-w-md shadow-2xl animate-scaleIn overflow-hidden">
                        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Edit Bill</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Update bill details</p>
                            </div>
                            <button onClick={() => setEditBillModal({ open: false, bill: null })} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleEditBill} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Bill Number</label>
                                <input type="text" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" 
                                    value={editBillData.bill_no} onChange={e => setEditBillData({...editBillData, bill_no: e.target.value})}
                                    placeholder="Optional"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">LKR</span>
                                    <input required type="number" step="0.01" className="w-full border border-gray-200 rounded-lg pl-12 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" 
                                        value={editBillData.amount} onChange={e => setEditBillData({...editBillData, amount: e.target.value})}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Bill Date</label>
                                <input type="date" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" 
                                    value={editBillData.bill_date} onChange={e => setEditBillData({...editBillData, bill_date: e.target.value})}
                                />
                            </div>
                        </form>
                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                            <Button variant="ghost" onClick={() => setEditBillModal({ open: false, bill: null })}>Cancel</Button>
                            <Button onClick={handleEditBill} disabled={actionLoading}>{actionLoading ? 'Saving...' : 'Save Changes'}</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Bill Confirmation Modal */}
            {deleteBillModal.open && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-xl w-full max-w-md shadow-2xl animate-scaleIn overflow-hidden">
                        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-900">Delete Bill</h2>
                            <button onClick={() => setDeleteBillModal({ open: false, bill: null })} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-600">
                                Are you sure you want to delete this bill of <strong>LKR {Number(deleteBillModal.bill?.amount || 0).toLocaleString()}</strong>? 
                                This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                            <Button variant="ghost" onClick={() => setDeleteBillModal({ open: false, bill: null })}>Cancel</Button>
                            <Button variant="danger" onClick={handleDeleteBill} disabled={actionLoading}>{actionLoading ? 'Deleting...' : 'Delete Bill'}</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
