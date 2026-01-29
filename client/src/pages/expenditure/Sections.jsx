import { useEffect, useState } from 'react';
import apiClient from '../../api/apiClient';
import { Link } from 'react-router-dom';
import { Plus, List, ArrowLeft, Layers, ChevronRight, X } from 'lucide-react';
import Button from '../../components/Button';

export default function Sections() {
    const [sections, setSections] = useState([]);
    const [newSection, setNewSection] = useState('');
    const [showModal, setShowModal] = useState(false);

    const fetchSections = async () => {
        try {
            const res = await apiClient.get('/api/expenditure/sections');
            setSections(res.data);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        fetchSections();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await apiClient.post('/api/expenditure/sections', { name: newSection });
            setShowModal(false);
            setNewSection('');
            fetchSections();
        } catch(e) { alert('Failed to create section'); }
    };

    return (
        <div className="space-y-6">
            <Link to="/expenditure" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors text-sm">
                <ArrowLeft className="w-4 h-4" /> Back to Expenditure
            </Link>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Expenditure Sections</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage sections and their categories</p>
                </div>
                <Button onClick={() => setShowModal(true)} icon={Plus}>
                    Add Section
                </Button>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <ul className="divide-y divide-gray-100">
                    {sections.map(s => (
                        <li key={s.id} className="px-6 py-4 flex justify-between items-center hover:bg-indigo-50/30 transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 rounded-lg">
                                    <Layers className="w-4 h-4 text-indigo-600" />
                                </div>
                                <span className="font-medium text-gray-900">{s.name}</span>
                            </div>
                            <Link to={`/expenditure/sections/${s.id}/categories`} className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
                                <List className="w-4 h-4"/> Manage Categories
                                <ChevronRight className="w-4 h-4 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                            </Link>
                        </li>
                    ))}
                    {sections.length === 0 && (
                        <li className="px-6 py-12 text-center">
                            <Layers className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                            <p className="font-medium text-gray-500">No sections found</p>
                            <p className="text-sm text-gray-400 mt-1">Create your first section to organize expenditures</p>
                        </li>
                    )}
                </ul>
            </div>

            {/* Add Section Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-xl w-full max-w-md shadow-2xl animate-scaleIn overflow-hidden">
                        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Add Section</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Create a new expenditure section</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Section Name</label>
                                <input required type="text" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow" 
                                    placeholder="Enter section name"
                                    value={newSection} onChange={e => setNewSection(e.target.value)}
                                />
                            </div>
                        </form>
                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                            <Button onClick={handleCreate}>Save Section</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
