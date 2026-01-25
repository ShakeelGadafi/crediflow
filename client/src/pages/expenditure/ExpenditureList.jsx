import { useEffect, useState } from 'react';
import apiClient from '../../api/apiClient';
import { Link } from 'react-router-dom';
import { Plus, Settings, BarChart2 } from 'lucide-react';

export default function ExpenditureList() {
    const [items, setItems] = useState([]);
    const [sections, setSections] = useState([]);
    const [categories, setCategories] = useState([]); // All categories or fetched on demand? Fetching all for simplicity if list is small, or by section.
    // Better to fetch categories when section is selected. 
    // But for list display, backend usually joins names.
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

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Expenditure</h1>
                <div className="flex gap-2">
                    <Link to="sections" className="px-4 py-2 border rounded flex items-center hover:bg-gray-50">
                        <Settings className="w-4 h-4 mr-2"/> Sections
                    </Link>
                    <Link to="summary" className="px-4 py-2 border rounded flex items-center hover:bg-gray-50">
                        <BarChart2 className="w-4 h-4 mr-2"/> Summary
                    </Link>
                    <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center hover:bg-indigo-700">
                        <Plus className="w-4 h-4 mr-2" /> Add Expenditure
                    </button>
                </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {items.map(i => (
                            <tr key={i.id}>
                                <td className="px-6 py-4 text-sm text-gray-900">{new Date(i.expense_date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{i.section_name}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{i.category_name}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{i.description}</td>
                                <td className="px-6 py-4 text-sm font-medium">${Number(i.amount).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-96">
                        <h2 className="text-xl font-bold mb-4">Add Expenditure</h2>
                        <form onSubmit={handleCreate}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Section</label>
                                <select required className="w-full border rounded p-2" 
                                    value={newItem.section_id} 
                                    onChange={e => handleSectionChange(e.target.value)}
                                >
                                    <option value="">Select Section</option>
                                    {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Category</label>
                                <select required className="w-full border rounded p-2" 
                                    value={newItem.category_id} 
                                    onChange={e => setNewItem({...newItem, category_id: e.target.value})}
                                    disabled={!newItem.section_id}
                                >
                                    <option value="">Select Category</option>
                                    {sectionCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Amount</label>
                                <input required type="number" step="0.01" className="w-full border rounded p-2" 
                                    value={newItem.amount} onChange={e => setNewItem({...newItem, amount: e.target.value})}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Date</label>
                                <input required type="date" className="w-full border rounded p-2" 
                                    value={newItem.expense_date} onChange={e => setNewItem({...newItem, expense_date: e.target.value})}
                                />
                            </div>
                             <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <input type="text" className="w-full border rounded p-2" 
                                    value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})}
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
