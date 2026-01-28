import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { Plus, CheckCircle, FileText, X, RotateCcw } from 'lucide-react';

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

    if (loading) return <div>Loading...</div>;
    if (!customer) return <div>Customer not found.</div>;

    const totalUnpaid = bills.filter(b => b.status === 'UNPAID').reduce((sum, b) => sum + Number(b.amount), 0);

    return (
        <div>
            <div className="flex items-center mb-6">
                <Link to="/credit/customers" className="text-gray-500 hover:text-gray-700 mr-4">← Back</Link>
                <h1 className="text-2xl font-bold flex-1">{customer.full_name}</h1>
                <div className="text-xl font-semibold bg-red-50 text-red-700 px-4 py-2 rounded">
                    Total Unpaid: ${totalUnpaid.toLocaleString()}
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow mb-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-gray-500 text-sm">Phone</p>
                        <p className="font-medium">{customer.phone || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm">Address</p>
                        <p className="font-medium">{customer.address || 'N/A'}</p>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Bills</h2>
                <button 
                  onClick={() => setShowModal(true)} 
                  className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center hover:bg-indigo-700"
                >
                    <Plus className="w-4 h-4 mr-2" /> Add Bill
                </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bill No</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attachment</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {bills.map(b => (
                            <tr key={b.id}>
                                <td className="px-6 py-4 text-sm text-gray-900">{new Date(b.created_at).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{b.bill_no || '-'}</td>
                                <td className="px-6 py-4 text-sm font-medium">${Number(b.amount).toLocaleString()}</td>
                                <td className="px-6 py-4 text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${b.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {b.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {b.attachment_url ? (
                                        <button 
                                            onClick={() => setPreviewUrl(`${import.meta.env.VITE_API_URL}${b.attachment_url}`)}
                                            className="text-indigo-600 hover:text-indigo-900 flex items-center"
                                        >
                                            <FileText className="w-4 h-4 mr-1"/> View
                                        </button>
                                    ) : '-'}
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    {b.status === 'UNPAID' ? (
                                        <button onClick={() => handleMarkPaid(b.id)} className="text-green-600 hover:text-green-900 flex items-center">
                                            <CheckCircle className="w-4 h-4 mr-1"/> Mark Paid
                                        </button>
                                    ) : (
                                        <button onClick={() => handleMarkUnpaid(b.id)} className="text-orange-600 hover:text-orange-900 flex items-center">
                                            <RotateCcw className="w-4 h-4 mr-1"/> Mark Unpaid
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-96">
                        <h2 className="text-xl font-bold mb-4">Add Bill</h2>
                        <form onSubmit={handleAddBill}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Bill Number</label>
                                <input type="text" className="w-full border rounded p-2" 
                                    value={billNo} onChange={e => setBillNo(e.target.value)}
                                    placeholder="Optional"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Amount</label>
                                <input required type="number" step="0.01" className="w-full border rounded p-2" 
                                    value={amount} onChange={e => setAmount(e.target.value)}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Bill Date</label>
                                <input type="date" className="w-full border rounded p-2" 
                                    value={billDate} onChange={e => setBillDate(e.target.value)}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Attachment</label>
                                <input type="file" className="w-full border rounded p-2" 
                                    onChange={e => setAttachment(e.target.files[0])}
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {previewUrl && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setPreviewUrl(null)}>
                    <div className="bg-white rounded-lg p-2 max-w-4xl max-h-full overflow-auto relative" onClick={e => e.stopPropagation()}>
                        <button 
                            onClick={() => setPreviewUrl(null)}
                            className="absolute top-2 right-2 p-1 bg-gray-200 rounded-full hover:bg-gray-300 z-10"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <img src={previewUrl} alt="Attachment" className="max-w-full max-h-[90vh] object-contain" />
                    </div>
                </div>
            )}
        </div>
    );
}
