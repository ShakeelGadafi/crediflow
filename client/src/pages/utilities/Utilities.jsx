import { useEffect, useState } from 'react';
import apiClient from '../../api/apiClient';
import { Plus, CheckCircle, Calendar, FileText, Search, Filter, Download } from 'lucide-react';

export default function Utilities() {
    const [activeTab, setActiveTab] = useState('monthly'); // 'monthly' | 'all'
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

    const fetchBills = async () => {
        setLoading(true);
        try {
            const params = {};
            if (activeTab === 'all') {
                if (search) params.search = search;
                if (dateRange.start) params.startDate = dateRange.start;
                if (dateRange.end) params.endDate = dateRange.end;
            }
            // For monthly view, we might want to fetch everything or a wide range. 
            // For now, let's fetch all and filter/group client-side for "monthly" 
            // and use server-side filtering for "all" to demonstrate the feature.
            
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
    }, [activeTab]); // Refetch when tab changes or filters are applied? 
    // Usually for search/filter we trigger on button click or debounce, but for simplicity let's rely on a "Apply" or effect dependency.
    // Let's add a separate useEffect or manual trigger for filters in 'all' tab.

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
        if (!confirm("Are you sure?")) return;
        try {
            await apiClient.patch(`/api/utilities/${id}/mark-paid`);
            fetchBills();
        } catch(e) { alert("Failed to mark paid"); }
    };

    // Grouping for Monthly View
    const groupedBills = bills.reduce((acc, bill) => {
        const date = new Date(bill.due_date);
        const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!acc[monthYear]) acc[monthYear] = [];
        acc[monthYear].push(bill);
        return acc;
    }, {});

    // Sort months? 
    // Object keys order isn't guaranteed, but map iteration usually follows insertion order or we can sort keys.
    const sortedMonths = Object.keys(groupedBills).sort((a, b) => {
        // Parse "Month Year" back to date to compare
        return new Date(b) - new Date(a); // Descending (latest first)
    });

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Utility Bills</h1>
                <button 
                  onClick={() => setShowModal(true)} 
                  className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center hover:bg-indigo-700"
                >
                    <Plus className="w-4 h-4 mr-2" /> Add Bill
                </button>
            </div>

            {/* Tabs */}
            <div className="mb-4 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('monthly')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'monthly'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Monthly View
                    </button>
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'all'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        All Data (Search & Filter)
                    </button>
                </nav>
            </div>

            {/* New Bill Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">Add Utility Bill</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Branch Name</label>
                                <input type="text" required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={newBill.branch_name}
                                    onChange={e => setNewBill({...newBill, branch_name: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Bill Type</label>
                                    <input type="text" required placeholder="e.g. Electricity"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={newBill.bill_type}
                                        onChange={e => setNewBill({...newBill, bill_type: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Bill No</label>
                                    <input type="text" placeholder="Optional"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={newBill.bill_no}
                                        onChange={e => setNewBill({...newBill, bill_no: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Amount</label>
                                    <input type="number" required step="0.01"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={newBill.amount}
                                        onChange={e => setNewBill({...newBill, amount: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Due Date</label>
                                    <input type="date" required
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={newBill.due_date}
                                        onChange={e => setNewBill({...newBill, due_date: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Notes</label>
                                <textarea rows="2"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={newBill.notes}
                                    onChange={e => setNewBill({...newBill, notes: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Attachment</label>
                                <input type="file"
                                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                    onChange={e => setAttachment(e.target.files[0])}
                                />
                            </div>
                            <div className="flex justify-end space-x-2 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-md hover:bg-gray-50">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {activeTab === 'all' && (
                <div className="mb-6 bg-white p-4 rounded-lg shadow space-y-4">
                    <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search by Branch, Type or Bill No..." 
                                    className="pl-9 w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <input 
                                type="date" 
                                className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                                value={dateRange.start}
                                onChange={e => setDateRange({...dateRange, start: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <input 
                                type="date" 
                                className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                                value={dateRange.end}
                                onChange={e => setDateRange({...dateRange, end: e.target.value})}
                            />
                        </div>
                        <button type="submit" className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center">
                            <Filter className="w-4 h-4 mr-2" /> Filter
                        </button>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="text-center py-10">Loading...</div>
            ) : (
                <div className="space-y-6">
                    {activeTab === 'monthly' ? (
                        sortedMonths.length === 0 ? <p className="text-gray-500">No bills found.</p> :
                        sortedMonths.map(month => (
                            <div key={month} className="bg-white shadow rounded-lg overflow-hidden">
                                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                                        <Calendar className="w-5 h-5 mr-2 text-indigo-500" />
                                        {month}
                                    </h3>
                                </div>
                                <BillsTable bills={groupedBills[month]} handleMarkPaid={handleMarkPaid} />
                            </div>
                        ))
                    ) : (
                        <div className="bg-white shadow rounded-lg overflow-hidden">
                            <BillsTable bills={bills} handleMarkPaid={handleMarkPaid} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function BillsTable({ bills, handleMarkPaid }) {
    if (!bills?.length) return <div className="p-6 text-center text-gray-500">No data available</div>;

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bill Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bill No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {bills.map(b => (
                        <tr key={b.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{b.branch_name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{b.bill_type}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{b.bill_no || '-'}</td>
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
                                    <button onClick={() => handleMarkPaid(b.id)} className="text-green-600 hover:text-green-900" title="Mark Paid">
                                        <CheckCircle className="w-5 h-5"/>
                                    </button>
                                )}
                                <a 
                                    href={`${import.meta.env.VITE_API_URL}/api/utilities/${b.id}/calendar.ics?token=${localStorage.getItem('token')}`} 
                                    className="text-blue-600 hover:text-blue-900"
                                    title="Download Calendar Event"
                                >
                                    <Download className="w-5 h-5" />
                                </a>
                                {b.attachment_url && (
                                    <a 
                                        href={`${import.meta.env.VITE_API_URL}${b.attachment_url}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-gray-600 hover:text-gray-900"
                                        title="View Attachment"
                                    >
                                        <FileText className="w-5 h-5" />
                                    </a>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
