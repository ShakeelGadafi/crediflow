import { useEffect, useState, useMemo } from 'react';
import apiClient from '../../api/apiClient';
import { Plus, ChevronDown, ChevronRight, Calendar, ArrowLeft, ArrowRight, FileText, Trash2, Eye, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ExpenditureMonthView() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    
    // DB Sections -> UI "Categories"
    const [dbSections, setDbSections] = useState([]);
    
    // DB Categories -> UI "Sections"
    const [dbCategoriesMap, setDbCategoriesMap] = useState({}); // { [sectionId]: [categories] }
    
    // DB Expenditures -> UI "Items"
    const [expenditures, setExpenditures] = useState([]);
    
    const [loading, setLoading] = useState(true);
    
    // UI State
    const [expandedDbSections, setExpandedDbSections] = useState({}); // Toggles main Card
    const [expandedDbCategories, setExpandedDbCategories] = useState({}); // Toggles internal Accordion
    const [viewingAttachment, setViewingAttachment] = useState(null); // URL for modal
    
    // --- Modals ---
    // 1. Add Category (DB Section)
    const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    // 2. Add Section (DB Category)
    const [showCreateSectionModal, setShowCreateSectionModal] = useState(false);
    const [newSectionData, setNewSectionData] = useState({ parentId: '', name: '' });

    // 3. Add Item (DB Expenditure)
    const [showAddItemModal, setShowAddItemModal] = useState(false);
    const [newItem, setNewItem] = useState({ 
        parentId: '', // DB section_id
        subId: '',    // DB category_id
        amount: '', 
        description: '', 
        expense_date: '' 
    });
    const [attachment, setAttachment] = useState(null);

    // Initial Load
    useEffect(() => {
        fetchDbSections();
    }, []);

    // Month Change Load
    useEffect(() => {
        fetchExpendituresForMonth();
        const y = currentMonth.getFullYear();
        const m = String(currentMonth.getMonth() + 1).padStart(2, '0');
        setNewItem(prev => ({ ...prev, expense_date: `${y}-${m}-01` }));
    }, [currentMonth]);

    // Fetch DB Sections (UI Categories)
    const fetchDbSections = async () => {
        try {
            const res = await apiClient.get('/api/expenditure/sections');
            setDbSections(res.data);
            
            // Expand all by default
            const initialExpanded = {};
            res.data.forEach(s => initialExpanded[s.id] = true);
            setExpandedDbSections(initialExpanded);

            // Fetch DB Categories (UI Sections) for each DB Section
            // We do this in parallel for efficiency
            const map = {};
            await Promise.all(res.data.map(async (sec) => {
                try {
                    const catRes = await apiClient.get(`/api/expenditure/sections/${sec.id}/categories`);
                    map[sec.id] = catRes.data;
                } catch (err) {
                    console.error(`Failed to fetch categories for section ${sec.id}`, err);
                    map[sec.id] = [];
                }
            }));
            setDbCategoriesMap(map);
            
            // Default expand inner sub-sections too
             const initialInnerExpanded = {};
             Object.values(map).flat().forEach(c => initialInnerExpanded[c.id] = true);
             setExpandedDbCategories(initialInnerExpanded);
             
        } catch (e) { console.error(e); }
    };

    const fetchExpendituresForMonth = async () => {
        setLoading(true);
        const y = currentMonth.getFullYear();
        const m = currentMonth.getMonth();
        const from = new Date(y, m, 1).toISOString().split('T')[0];
        const to = new Date(y, m + 1, 0).toISOString().split('T')[0];

        try {
            const res = await apiClient.get('/api/expenditure', { params: { from, to } });
            setExpenditures(res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    // --- Handlers ---

    const handleCreateCategory = async (e) => { // User "Category" -> DB Section
        e.preventDefault();
        try {
            await apiClient.post('/api/expenditure/sections', { name: newCategoryName });
            setNewCategoryName('');
            setShowCreateCategoryModal(false);
            fetchDbSections(); // Refresh all
        } catch (e) { alert('Failed to create category'); }
    };

    const handleCreateSection = async (e) => { // User "Section" -> DB Category
        e.preventDefault();
        try {
             // DB: POST /sections/:id/categories
            await apiClient.post(`/api/expenditure/sections/${newSectionData.parentId}/categories`, { 
                name: newSectionData.name 
            });
            setNewSectionData({ parentId: '', name: '' });
            setShowCreateSectionModal(false);
            fetchDbSections(); // Refresh tree
        } catch (e) { alert('Failed to create section'); }
    };

    const handleCreateItem = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        // Map UI IDs to DB fields
        formData.append('section_id', newItem.parentId);
        formData.append('category_id', newItem.subId);
        formData.append('amount', newItem.amount);
        formData.append('description', newItem.description);
        formData.append('expense_date', newItem.expense_date);
        
        if (attachment) formData.append('attachment', attachment);

        try {
            await apiClient.post('/api/expenditure', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setShowAddItemModal(false);
            setAttachment(null);
            fetchExpendituresForMonth();
        } catch (e) { alert('Failed to add item'); }
    };

    // DELETE HANDLERS
    const handleDeleteCategory = async (id, name, e) => {
        e.stopPropagation();
        if(!window.confirm(`Are you sure you want to delete Category "${name}"?\n\nWARNING: This will delete ALL sections and items contained within it!`)) return;
        try {
            await apiClient.delete(`/api/expenditure/sections/${id}`);
            fetchDbSections(); // Refresh
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to delete category');
        }
    };

    const handleDeleteSection = async (id, name, e) => {
        e.stopPropagation();
        if(!window.confirm(`Are you sure you want to delete Section "${name}"?\n\nWARNING: This will delete ALL items in this section!`)) return;
        try {
            await apiClient.delete(`/api/expenditure/categories/${id}`);
            fetchDbSections(); // Refresh
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to delete section');
        }
    };

    const handleDeleteItem = async (id) => {
        if(!window.confirm('Are you sure you want to delete this item?')) return;
        try {
            await apiClient.delete(`/api/expenditure/${id}`);
            fetchExpendituresForMonth(); // Refresh items
        } catch (err) {
            console.error(err);
            alert('Failed to delete item');
        }
    };

    // --- Helpers ---
    
    // Pre-process data for rendering
    // We need: DB Section -> DB Category -> List of Expenditures
    const processedData = useMemo(() => {
        let monthTotal = 0;

        // Helper to check creation date
        const isCreatedInCurrentMonth = (dateStr) => {
            if (!dateStr) return false;
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return false;
            return d.getMonth() === currentMonth.getMonth() && 
                   d.getFullYear() === currentMonth.getFullYear();
        };
        
        const tree = dbSections.map(dbSec => {
            const myDbCats = dbCategoriesMap[dbSec.id] || [];
        
            // 1. Process children first
            const rawSubTree = myDbCats.map(dbCat => {
                // Find items for this DB Section + DB Category
                const items = expenditures.filter(e => 
                    e.section_id === dbSec.id && e.category_id === dbCat.id
                );
                
                const subTotal = items.reduce((sum, i) => sum + Number(i.amount), 0);
                
                return {
                    ...dbCat,
                    items,
                    total: subTotal
                };
            });

            // 2. Filter children (Show if has Items OR Created this month)
            const subTree = rawSubTree.filter(cat => 
                cat.total > 0 || isCreatedInCurrentMonth(cat.created_at)
            );

            // 3. Calculate Section Total
            const dbSectionTotal = subTree.reduce((sum, cat) => sum + cat.total, 0);
            
            return {
                ...dbSec,
                subSections: subTree,
                total: dbSectionTotal
            };
        })
        // 4. Filter Sections (Show if has Children OR Created this month)
        .filter(sec => sec.subSections.length > 0 || isCreatedInCurrentMonth(sec.created_at));
        
        monthTotal = tree.reduce((sum, sec) => sum + sec.total, 0);
        
        return { tree, monthTotal };
    }, [dbSections, dbCategoriesMap, expenditures, currentMonth]);

    const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

    const openAddItem = (parentId = '', subId = '') => {
        setNewItem(prev => ({ 
            ...prev, 
            parentId: parentId || (dbSections.length > 0 ? dbSections[0].id : ''),
            subId: subId || '' 
        }));
        setShowAddItemModal(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                 <div className="flex items-center space-x-4">
                    <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex flex-col items-center">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                             <Calendar className="w-6 h-6 text-indigo-600"/>
                             {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h2>
                        <span className="text-green-600 font-bold text-lg">
                            Total: ${processedData.monthTotal.toLocaleString()}
                        </span>
                    </div>
                    <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex gap-3">
                     <Link to="all" className="px-4 py-2 border border-gray-300 rounded-lg flex items-center hover:bg-gray-50 text-gray-700 font-medium">
                        <FileText className="w-4 h-4 mr-2"/> All Records
                    </Link>
                    <Link to="summary" className="px-4 py-2 border border-gray-300 rounded-lg flex items-center hover:bg-gray-50 text-gray-700 font-medium">
                        <FileText className="w-4 h-4 mr-2"/> Summary
                    </Link>
                    
                    {/* Add New Dropdown */}
                    <div className="relative group">
                         <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700 font-medium shadow-sm">
                            <Plus className="w-4 h-4 mr-2" /> Add New
                        </button>
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-200 hidden group-hover:block z-10">
                            <button onClick={() => setShowCreateCategoryModal(true)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                                Create Category
                            </button>
                            <button onClick={() => setShowCreateSectionModal(true)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                                Create Section
                            </button>
                            <button onClick={() => openAddItem()} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                                Add Item
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Tree */}
            <div className="space-y-6">
                 {loading ? <div className="text-center py-10">Loading...</div> : processedData.tree.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-200 border-dashed">
                        No Categories found. Click "Add New" -> "Create Category" to start.
                    </div>
                 ) : processedData.tree.map((catNode) => (
                     /* GREEN CONTAINER (Category) */
                     <div key={catNode.id} className="bg-emerald-50 rounded-2xl overflow-hidden shadow-sm border border-emerald-100">
                        {/* Category Header */}
                        <div 
                            className="bg-emerald-600 px-6 py-4 flex justify-between items-center text-white cursor-pointer group"
                            onClick={() => setExpandedDbSections(p => ({...p, [catNode.id]: !p[catNode.id]}))}
                        >
                            <div className="flex items-center gap-2">
                                {expandedDbSections[catNode.id] ? <ChevronDown className="w-6 h-6"/> : <ChevronRight className="w-6 h-6"/>}
                                <h3 className="text-xl font-bold">{catNode.name}</h3>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-xl font-bold">
                                    ${catNode.total.toLocaleString()}
                                </span>
                                {/* Delete Category Button */}
                                <button 
                                    onClick={(e) => handleDeleteCategory(catNode.id, catNode.name, e)}
                                    className="p-1.5 bg-emerald-700 hover:bg-red-600 rounded text-emerald-100 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                                    title="Delete Category"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        
                        {/* Category Body */}
                        {expandedDbSections[catNode.id] && (
                            <div className="p-6 space-y-4">
                                {catNode.subSections.length === 0 ? (
                                    <div className="text-center text-emerald-600/70 py-4 border-2 border-dashed border-emerald-200 rounded-lg">
                                        No sections in this category. 
                                        <button 
                                            onClick={() => {
                                                setNewSectionData({ parentId: catNode.id, name: '' }); 
                                                setShowCreateSectionModal(true);
                                            }}
                                            className="ml-2 font-bold underline hover:text-emerald-800"
                                        >
                                            Create Section
                                        </button>
                                    </div>
                                ) : catNode.subSections.map(secNode => (
                                    /* RED BAR (Section) */
                                    <div key={secNode.id} className="rounded-xl overflow-hidden border border-rose-100 shadow-sm bg-white">
                                        <div 
                                            className="bg-rose-400 px-4 py-2 flex justify-between items-center text-white cursor-pointer hover:bg-rose-500 transition-colors group"
                                            onClick={() => setExpandedDbCategories(p => ({...p, [secNode.id]: !p[secNode.id]}))}
                                        >
                                            <div className="flex items-center gap-2">
                                                 {expandedDbCategories[secNode.id] ? <ChevronDown className="w-5 h-5"/> : <ChevronRight className="w-5 h-5"/>}
                                                 <span className="font-semibold text-lg">{secNode.name}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold">${secNode.total.toLocaleString()}</span>
                                                {/* Delete Section Button */}
                                                <button 
                                                    onClick={(e) => handleDeleteSection(secNode.id, secNode.name, e)}
                                                    className="p-1 bg-rose-500 hover:bg-red-700 rounded text-rose-100 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Delete Section"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {expandedDbCategories[secNode.id] && (
                                            /* ITEM LIST */
                                            <div className="bg-slate-50 p-4">
                                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                                    <table className="min-w-full divide-y divide-gray-200">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                                                                <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Description</th>
                                                                <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Amount</th>
                                                                <th className="px-4 py-2 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200">
                                                            {secNode.items.map(item => (
                                                                <tr key={item.id} className="hover:bg-gray-50 group">
                                                                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                                                                        {new Date(item.expense_date).toLocaleDateString()}
                                                                    </td>
                                                                    <td className="px-4 py-3 text-sm text-gray-800">
                                                                        {item.description || '-'}
                                                                    </td>
                                                                    <td className="px-4 py-3 text-sm font-bold text-gray-900">
                                                                        ${Number(item.amount).toLocaleString()}
                                                                    </td>
                                                                    <td className="px-4 py-3 text-right flex justify-end gap-2 items-center">
                                                                        {item.attachment_url && (
                                                                            <button 
                                                                                onClick={() => setViewingAttachment(`${import.meta.env.VITE_API_URL}${item.attachment_url}`)}
                                                                                className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                                                                                title="View Bill"
                                                                            >
                                                                                <Eye className="w-4 h-4" />
                                                                            </button>
                                                                        )}
                                                                        <button 
                                                                            onClick={() => handleDeleteItem(item.id)}
                                                                            className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                            title="Delete Item"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            {secNode.items.length === 0 && (
                                                                <tr>
                                                                    <td colSpan="4" className="px-4 py-6 text-center text-gray-500 text-sm">
                                                                        No items.
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                <div className="mt-2 text-right">
                                                    <button 
                                                        onClick={() => openAddItem(catNode.id, secNode.id)}
                                                        className="text-sm font-medium text-rose-600 hover:text-rose-800 inline-flex items-center"
                                                    >
                                                        <Plus className="w-4 h-4 mr-1"/> Add Item to {secNode.name}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                     </div>
                 ))}
            </div>

            {/* --- MODALS --- */}
            
            {/* Attachment Viewer Modal */}
            {viewingAttachment && (
                <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-lg w-full max-w-5xl h-[85vh] flex flex-col relative shadow-2xl">
                        <button 
                            onClick={() => setViewingAttachment(null)} 
                            className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300 transition-colors z-10 flex flex-col items-center"
                        >
                            <X className="w-8 h-8"/>
                            <span className="text-xs">Close</span>
                        </button>
                        <div className="flex-1 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center relative">
                             {viewingAttachment.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) ? (
                                 <img src={viewingAttachment} alt="Bill Attachment" className="max-w-full max-h-full object-contain shadow-lg"/>
                             ) : (
                                 <iframe src={viewingAttachment} className="w-full h-full border-none" title="Attachment Viewer"/>
                             )}
                        </div>
                    </div>
                </div>
            )}

            {/* 1. Create Category Modal */}
            {showCreateCategoryModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-xl w-full max-w-sm shadow-2xl">
                        <h3 className="text-xl font-bold mb-4 text-emerald-800">Create New Category</h3>
                        <form onSubmit={handleCreateCategory} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Category Name</label>
                                <input 
                                    className="w-full mt-1 border border-gray-300 rounded-lg p-2.5 focus:ring-emerald-500 focus:border-emerald-500"
                                    value={newCategoryName}
                                    onChange={e => setNewCategoryName(e.target.value)}
                                    required
                                    placeholder="e.g. Kandy Branch"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowCreateCategoryModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 2. Create Section Modal */}
            {showCreateSectionModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-xl w-full max-w-sm shadow-2xl">
                        <h3 className="text-xl font-bold mb-4 text-rose-800">Create New Section</h3>
                        <form onSubmit={handleCreateSection} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Parent Category</label>
                                <select 
                                    className="w-full mt-1 border border-gray-300 rounded-lg p-2.5 focus:ring-rose-500 focus:border-rose-500"
                                    value={newSectionData.parentId}
                                    onChange={e => setNewSectionData({...newSectionData, parentId: e.target.value})}
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {dbSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Section Name</label>
                                <input 
                                    className="w-full mt-1 border border-gray-300 rounded-lg p-2.5 focus:ring-rose-500 focus:border-rose-500"
                                    value={newSectionData.name}
                                    onChange={e => setNewSectionData({...newSectionData, name: e.target.value})}
                                    required
                                    placeholder="e.g. Food"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowCreateSectionModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 3. Add Item Modal */}
            {showAddItemModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl">
                         <h3 className="text-xl font-bold mb-4 text-indigo-800">Add Item</h3>
                         <form onSubmit={handleCreateItem} className="space-y-4">
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Category</label>
                                    <select 
                                        className="w-full mt-1 border border-gray-300 rounded-lg p-2.5"
                                        value={newItem.parentId}
                                        onChange={e => setNewItem({...newItem, parentId: e.target.value, subId: ''})}
                                        required
                                    >
                                        <option value="">Select</option>
                                        {dbSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Section</label>
                                    <select 
                                        className="w-full mt-1 border border-gray-300 rounded-lg p-2.5"
                                        value={newItem.subId}
                                        onChange={e => setNewItem({...newItem, subId: e.target.value})}
                                        required
                                        disabled={!newItem.parentId}
                                    >
                                        <option value="">Select</option>
                                        {(dbCategoriesMap[newItem.parentId] || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                             </div>
                             
                             <div>
                                <label className="block text-sm font-medium text-gray-700">Date</label>
                                <input 
                                    type="date"
                                    className="w-full mt-1 border border-gray-300 rounded-lg p-2.5"
                                    value={newItem.expense_date}
                                    onChange={e => setNewItem({...newItem, expense_date: e.target.value})}
                                    required 
                                />
                             </div>

                             <div>
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <input 
                                    type="text"
                                    className="w-full mt-1 border border-gray-300 rounded-lg p-2.5"
                                    value={newItem.description}
                                    onChange={e => setNewItem({...newItem, description: e.target.value})}
                                />
                             </div>

                             <div>
                                <label className="block text-sm font-medium text-gray-700">Amount</label>
                                <input 
                                    type="number"
                                    step="0.01"
                                    className="w-full mt-1 border border-gray-300 rounded-lg p-2.5"
                                    value={newItem.amount}
                                    onChange={e => setNewItem({...newItem, amount: e.target.value})}
                                    required 
                                />
                             </div>

                             <div>
                                <label className="block text-sm font-medium text-gray-700">Attachment</label>
                                <input 
                                    type="file"
                                    className="w-full mt-1 border border-gray-300 rounded-lg p-2.5 text-sm"
                                    onChange={e => setAttachment(e.target.files[0])}
                                />
                             </div>

                             <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowAddItemModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Add Item</button>
                            </div>
                         </form>
                    </div>
                </div>
            )}
        </div>
    );
}
