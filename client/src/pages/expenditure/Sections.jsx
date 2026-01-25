import { useEffect, useState } from 'react';
import apiClient from '../../api/apiClient';
import { Link } from 'react-router-dom';
import { Plus, List } from 'lucide-react';

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
        <div>
             <div className="flex items-center mb-6">
                <Link to="/expenditure" className="text-gray-500 hover:text-gray-700 mr-4">← Back</Link>
                <h1 className="text-2xl font-bold flex-1">Expenditure Sections</h1>
                <button 
                  onClick={() => setShowModal(true)} 
                  className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center hover:bg-indigo-700"
                >
                    <Plus className="w-4 h-4 mr-2" /> Add Section
                </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <ul className="divide-y divide-gray-200">
                    {sections.map(s => (
                        <li key={s.id} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50">
                            <span className="font-medium text-gray-900">{s.name}</span>
                            <Link to={`/expenditure/sections/${s.id}/categories`} className="text-indigo-600 hover:text-indigo-900 flex items-center">
                                <List className="w-4 h-4 mr-1"/> Manage Categories
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>

             {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-96">
                        <h2 className="text-xl font-bold mb-4">Add Section</h2>
                        <form onSubmit={handleCreate}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Name</label>
                                <input required type="text" className="w-full border rounded p-2" 
                                    value={newSection} onChange={e => setNewSection(e.target.value)}
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
