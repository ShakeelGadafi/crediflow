import { useEffect, useState } from 'react';
import apiClient from '../../api/apiClient';
import { Link, useParams } from 'react-router-dom';
import { Plus, ArrowLeft, FolderOpen, X } from 'lucide-react';
import Button from '../../components/Button';

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
        <div className="space-y-6">
            <Link to="/expenditure/sections" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors text-sm">
                <ArrowLeft className="w-4 h-4" /> Back to Sections
            </Link>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manage Categories</h1>
                    <p className="text-sm text-gray-500 mt-1">Organize expenditure categories</p>
                </div>
                <Button onClick={() => setShowModal(true)} icon={Plus}>
                    Add Category
                </Button>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <ul className="divide-y divide-gray-100">
                    {categories.map(c => (
                        <li key={c.id} className="px-6 py-4 flex items-center gap-3 hover:bg-indigo-50/30 transition-colors">
                            <div className="p-2 bg-indigo-50 rounded-lg">
                                <FolderOpen className="w-4 h-4 text-indigo-600" />
                            </div>
                            <span className="font-medium text-gray-900">{c.name}</span>
                        </li>
                    ))}
                    {categories.length === 0 && (
                        <li className="px-6 py-12 text-center">
                            <FolderOpen className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                            <p className="font-medium text-gray-500">No categories found</p>
                            <p className="text-sm text-gray-400 mt-1">Add your first category to get started</p>
                        </li>
                    )}
                </ul>
            </div>

            {/* Add Category Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-xl w-full max-w-md shadow-2xl animate-scaleIn overflow-hidden">
                        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Add Category</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Create a new expenditure category</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category Name</label>
                                <input required type="text" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" 
                                    placeholder="Enter category name"
                                    value={newCategory} onChange={e => setNewCategory(e.target.value)}
                                />
                            </div>
                        </form>
                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                            <Button onClick={handleCreate}>Save Category</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
