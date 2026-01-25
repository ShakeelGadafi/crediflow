import { useEffect, useState } from 'react';
import apiClient from '../../api/apiClient';
import { Plus, CheckCircle, Calendar, FileText } from 'lucide-react';

export default function Utilities() {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newBill, setNewBill] = useState({ name: '', amount: '', due_date: '' });
    const [attachment, setAttachment] = useState(null);

    const fetchBills = async () => {
        try {
            const res = await apiClient.get('/api/utilities');
            setBills(res.data);
        } catch (e) { console.error(e); } 
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchBills();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name', newBill.name);
        formData.append('amount', newBill.amount);
        formData.append('due_date', newBill.due_date);
        if (attachment) formData.append('attachment', attachment);

        try {
            await apiClient.post('/api/utilities', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setShowModal(false);
            setNewBill({ name: '', amount: '', due_date: '' });
            setAttachment(null);
            fetchBills();
        } catch (e) { alert('Failed to create utility bill'); }
    };

    const handleMarkPaid = async (id) => {
        if (!confirm("Are you sure?")) return;
        try {
            await apiClient.patch(`/api/utilities/${id}/mark-paid`);
            fetchBills();
        } catch(e) { alert("Failed to mark paid"); }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Utility Bills</h1>
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utility Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {bills.map(b => (
                            <tr key={b.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{b.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">${Number(b.amount).toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(b.due_date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${b.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {b.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm flex space-x-3">
                                    {b.status === 'UNPAID' && (
                                        <button onClick={() => handleMarkPaid(b.id)} className="text-green-600 hover:text-green-900 flex items-center" title="Mark Paid">
                                            <CheckCircle className="w-4 h-4"/>
                                        </button>
                                    )}
                                    <a 
                                        href={`${import.meta.env.VITE_API_URL}/api/utilities/${b.id}/calendar.ics?token=${localStorage.getItem('token')}`} 
                                        // Usually authenticated endpoints need token passed in query or stored as cookie for direct link. 
                                        // But safer is to fetch blob and download. 
                                        // However, backend route just checks generic auth. Let's try direct link with token or fetch download.
                                        // Prompt mentioned: GET /api/utilities/:id/calendar.ics
                                        // I'll implement fetch download to include headers.
                                        onClick={(e) => {
                                            e.preventDefault();
                                            // Handle download
                                            apiClient.get(`/api/utilities/${b.id}/calendar.ics`, { responseType: 'blob' })
                                                .then(response => {
                                                    const url = window.URL.createObjectURL(new Blob([response.data]));
                                                    const link = document.createElement('a');
                                                    link.href = url;
                                                    link.setAttribute('download', `${b.name}_reminder.ics`);
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    link.remove();
                                                });
                                        }}
                                        className="text-blue-600 hover:text-blue-900 flex items-center cursor-pointer" title="Add to Calendar"
                                    >
                                        <Calendar className="w-4 h-4"/>
                                    </a>
                                    {b.attachment_url && (
                                        <a href={`${import.meta.env.VITE_API_URL}${b.attachment_url}`} target="_blank" rel="noreferrer" className="text-gray-600 hover:text-gray-900" title="View Attachment">
                                            <FileText className="w-4 h-4"/>
                                        </a>
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
                        <h2 className="text-xl font-bold mb-4">Add Utility Bill</h2>
                        <form onSubmit={handleCreate}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Utility Name</label>
                                <input required type="text" className="w-full border rounded p-2" 
                                    value={newBill.name} onChange={e => setNewBill({...newBill, name: e.target.value})}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Amount</label>
                                <input required type="number" step="0.01" className="w-full border rounded p-2" 
                                    value={newBill.amount} onChange={e => setNewBill({...newBill, amount: e.target.value})}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Due Date</label>
                                <input required type="date" className="w-full border rounded p-2" 
                                     value={newBill.due_date} onChange={e => setNewBill({...newBill, due_date: e.target.value})}
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
        </div>
    );
}
