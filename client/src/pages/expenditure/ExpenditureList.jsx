import { useEffect, useState } from 'react';
import apiClient from '../../api/apiClient';
import { Link } from 'react-router-dom';
import { Plus, Settings, BarChart2, X } from 'lucide-react';
import Button from '../../components/Button';
import Table from '../../components/Table';

export default function ExpenditureList() {
    const [items, setItems] = useState([]);
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    
    const [newItem, setNewItem] = useState({ 
        section_id: '', category_id: '', amount: '', description: '', expense_date: new Date().toISOString().split('T')[0]
    });
    const [sectionCategories, setSectionCategories] = useState([]);
    const [attachment, setAttachment] = useState(null);

    useEffect(() => {
        fetchData();
        fetchSections();
    }, []);

    const fetchData = async () => {
        try {
            const res = await apiClient.get('/api/expenditure');
            setItems(res.data);
            setLoading(false);
        } catch (e) { console.error(e); setLoading(false); }
    };

    const fetchSections = async () => {
        try {
            const res = await apiClient.get('/api/expenditure/sections');
            setSections(res.data);
        } catch (e) { console.error(e); }
    };

    const handleSectionChange = async (sectionId) => {
        setNewItem({...newItem, section_id: sectionId, category_id: ''});
        try {
            const res = await apiClient.get(`/api/expenditure/sections/${sectionId}/categories`);
            setSectionCategories(res.data);
        } catch(e) { console.error(e); }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        Object.keys(newItem).forEach(key => formData.append(key, newItem[key]));
        if (attachment) formData.append('attachment', attachment);

        try {
            await apiClient.post('/api/expenditure', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setShowModal(false);
            setNewItem({ section_id: '', category_id: '', amount: '', description: '', expense_date: new Date().toISOString().split('T')[0] });
            setAttachment(null);
            fetchData();
        } catch (e) { alert('Failed to add expenditure'); }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Expenditure</h1>
                    <p className="text-sm text-gray-500 mt-1">Track and manage daily expenses</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link to="sections">
                        <Button variant="secondary" icon={Settings} size="sm">
                            Sections
                        </Button>
                    </Link>
                    <Link to="summary">
                        <Button variant="secondary" icon={BarChart2} size="sm">
                            Summary
                        </Button>
                    </Link>
                    <Button onClick={() => setShowModal(true)} icon={Plus}>
                        Add Expenditure
                    </Button>
                </div>
            </div>

            {/* Table */}
            <Table 
                loading={loading}
                columns={[
                    { 
                        header: 'Date', 
                        render: (row) => (
                            <span className="text-gray-900 font-medium">
                                {new Date(row.expense_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                        )
                    },
                    { 
                        header: 'Section', 
                        render: (row) => (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                                {row.section_name}
                            </span>
                        )
                    },
                    { header: 'Category', render: (row) => <span className="text-gray-600">{row.category_name}</span> },
                    { header: 'Description', render: (row) => <span className="text-gray-600">{row.description || '—'}</span> },
                    { 
                        header: 'Amount', 
                        render: (row) => <span className="font-semibold text-gray-900">${Number(row.amount).toLocaleString()}</span>
                    }
                ]}
                data={items}
                emptyMessage="No expenditure records found."
            />

            {/* Add Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scaleIn">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-900">Add Expenditure</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Section</label>
                                <select 
                                    required 
                                    className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                                    value={newItem.section_id} 
                                    onChange={e => handleSectionChange(e.target.value)}
                                >
                                    <option value="">Select Section</option>
                                    {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                                <select 
                                    required 
                                    className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-400" 
                                    value={newItem.category_id} 
                                    onChange={e => setNewItem({...newItem, category_id: e.target.value})}
                                    disabled={!newItem.section_id}
                                >
                                    <option value="">Select Category</option>
                                    {sectionCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount</label>
                                    <input 
                                        required 
                                        type="number" 
                                        step="0.01" 
                                        className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                                        value={newItem.amount} 
                                        onChange={e => setNewItem({...newItem, amount: e.target.value})}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
                                    <input 
                                        required 
                                        type="date" 
                                        className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                                        value={newItem.expense_date} 
                                        onChange={e => setNewItem({...newItem, expense_date: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                                <input 
                                    type="text" 
                                    className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                                    value={newItem.description} 
                                    onChange={e => setNewItem({...newItem, description: e.target.value})}
                                    placeholder="Optional description"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Attachment</label>
                                <input 
                                    type="file" 
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" 
                                    onChange={e => setAttachment(e.target.files[0])}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <Button type="button" onClick={() => setShowModal(false)} variant="ghost">Cancel</Button>
                                <Button type="submit">Save Expenditure</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
