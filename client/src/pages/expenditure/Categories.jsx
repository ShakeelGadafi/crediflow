import { useEffect, useState } from 'react';
import apiClient from '../../api/apiClient';
import { Link, useParams } from 'react-router-dom';
import { Plus } from 'lucide-react';

export default function Categories() {
    const { id } = useParams();
    const [categories, setCategories] = useState([]);
    const [newCategory, setNewCategory] = useState('');
    const [showModal, setShowModal] = useState(false);

    const fetchCategories = async () => {
        try {
            const res = await apiClient.get(`/api/expenditure/sections/${id}/categories`);
            setCategories(res.data);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        fetchCategories();
    }, [id]);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await apiClient.post(`/api/expenditure/sections/${id}/categories`, { name: newCategory });
            setShowModal(false);
            setNewCategory('');
            fetchCategories();
        } catch(e) { alert('Failed to create category'); }
    };

    return (
        <div>
             <div className="flex items-center mb-6">
                <Link to="/expenditure/sections" className="text-gray-500 hover:text-gray-700 mr-4">← Back</Link>
                <h1 className="text-2xl font-bold flex-1">Manage Categories</h1>
                 <button 
                  onClick={() => setShowModal(true)} 
                  className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center hover:bg-indigo-700"
                >
                    <Plus className="w-4 h-4 mr-2" /> Add Category
                </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <ul className="divide-y divide-gray-200">
                    {categories.map(c => (
                        <li key={c.id} className="px-6 py-4">
                            <span className="font-medium text-gray-900">{c.name}</span>
                        </li>
                    ))}
                    {categories.length === 0 && <li className="px-6 py-4 text-gray-500">No categories found.</li>}
                </ul>
            </div>

             {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-96">
                        <h2 className="text-xl font-bold mb-4">Add Category</h2>
                        <form onSubmit={handleCreate}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Name</label>
                                <input required type="text" className="w-full border rounded p-2" 
                                    value={newCategory} onChange={e => setNewCategory(e.target.value)}
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
