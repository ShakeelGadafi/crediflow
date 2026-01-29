import { useEffect, useState, useMemo } from 'react';
import apiClient from '../../api/apiClient';
import { Plus, ChevronDown, ChevronRight, Calendar, ArrowLeft, ArrowRight, FileText, Trash2, Eye, X, BarChart2, List } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../../components/Button';

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

            // 2. Filter children - ONLY show sections that have actual expenses this month
            const subTree = rawSubTree.filter(cat => cat.items.length > 0);

            // 3. Calculate Section Total
            const dbSectionTotal = subTree.reduce((sum, cat) => sum + cat.total, 0);
            
            return {
                ...dbSec,
                subSections: subTree,
                total: dbSectionTotal
            };
        })
        // 4. Filter Sections - ONLY show categories that have sections with expenses
        .filter(sec => sec.subSections.length > 0);
        
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
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                 <div className="flex items-center gap-4">
                    <button onClick={handlePrevMonth} className="p-2.5 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex flex-col items-center">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                             <Calendar className="w-6 h-6 text-indigo-600"/>
                             {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h2>
                        <span className="text-emerald-600 font-bold text-lg mt-1">
                            Total: LKR {processedData.monthTotal.toLocaleString()}
                        </span>
                    </div>
                    <button onClick={handleNextMonth} className="p-2.5 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors">
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex gap-3 mt-4 md:mt-0">
                    <Link to="all" className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 font-medium text-sm transition-colors">
                        <List className="w-4 h-4"/> All Records
                    </Link>
                    <Link to="summary" className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 font-medium text-sm transition-colors">
                        <BarChart2 className="w-4 h-4"/> Summary
                    </Link>
                    
                    {/* Add New Dropdown */}
                    <div className="relative group">
                        <Button icon={Plus}>Add New</Button>
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-2 border border-gray-100 hidden group-hover:block z-10 animate-scaleIn origin-top-right">
                            <button onClick={() => setShowCreateCategoryModal(true)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 w-full text-left transition-colors">
                                Create Category
                            </button>
                            <button onClick={() => setShowCreateSectionModal(true)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 w-full text-left transition-colors">
                                Create Section
                            </button>
                            <button onClick={() => openAddItem()} className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 w-full text-left transition-colors">
                                Add Item
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Tree */}
            <div className="space-y-6">
                 {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-gray-200 border-t-indigo-600"></div>
                    </div>
                 ) : processedData.tree.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl border-2 border-gray-100 border-dashed">
                        <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-600 font-medium">No Categories found</p>
                        <p className="text-gray-400 text-sm mt-1">Click "Add New" → "Create Category" to start</p>
                    </div>
                 ) : processedData.tree.map((catNode) => (
                     /* GREEN CONTAINER (Category) */
                     <div key={catNode.id} className="bg-gradient-to-b from-emerald-50 to-white rounded-2xl overflow-hidden shadow-sm border border-emerald-100">
                        {/* Category Header */}
                        <div 
                            className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-4 flex justify-between items-center text-white cursor-pointer group"
                            onClick={() => setExpandedDbSections(p => ({...p, [catNode.id]: !p[catNode.id]}))}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-white/20 rounded-lg">
                                    {expandedDbSections[catNode.id] ? <ChevronDown className="w-5 h-5"/> : <ChevronRight className="w-5 h-5"/>}
                                </div>
                                <h3 className="text-xl font-bold">{catNode.name}</h3>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-xl font-bold">
                                    LKR {catNode.total.toLocaleString()}
                                </span>
                                {/* Delete Category Button */}
                                <button 
                                    onClick={(e) => handleDeleteCategory(catNode.id, catNode.name, e)}
                                    className="p-2 bg-white/10 hover:bg-red-500 rounded-lg text-white transition-colors opacity-0 group-hover:opacity-100"
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
                                    <div className="text-center text-emerald-600/70 py-6 border-2 border-dashed border-emerald-200 rounded-xl">
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
                                            className="bg-gradient-to-r from-rose-400 to-rose-300 px-4 py-3 flex justify-between items-center text-white cursor-pointer hover:from-rose-500 hover:to-rose-400 transition-all group"
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
                <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
                    <button 
                        onClick={() => setViewingAttachment(null)} 
                        className="absolute top-6 right-6 p-3 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl transition-colors"
                    >
                        <X className="w-6 h-6"/>
                    </button>
                    <div className="max-w-5xl w-full h-[85vh] animate-scaleIn">
                        {viewingAttachment.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) ? (
                            <img src={viewingAttachment} alt="Bill Attachment" className="max-w-full max-h-full mx-auto object-contain rounded-xl shadow-2xl"/>
                        ) : (
                            <iframe src={viewingAttachment} className="w-full h-full border-none rounded-xl bg-white shadow-2xl" title="Attachment Viewer"/>
                        )}
                    </div>
                </div>
            )}

            {/* 1. Create Category Modal */}
            {showCreateCategoryModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl animate-scaleIn overflow-hidden">
                        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Create New Category</h3>
                                <p className="text-sm text-gray-500 mt-0.5">Add a new expense category</p>
                            </div>
                            <button onClick={() => setShowCreateCategoryModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateCategory} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category Name</label>
                                <input 
                                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow"
                                    value={newCategoryName}
                                    onChange={e => setNewCategoryName(e.target.value)}
                                    required
                                    placeholder="e.g. Kandy Branch"
                                />
                            </div>
                        </form>
                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                            <Button variant="ghost" onClick={() => setShowCreateCategoryModal(false)}>Cancel</Button>
                            <button onClick={handleCreateCategory} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium text-sm transition-colors">Create</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Create Section Modal */}
            {showCreateSectionModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl animate-scaleIn overflow-hidden">
                        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Create New Section</h3>
                                <p className="text-sm text-gray-500 mt-0.5">Add a section to a category</p>
                            </div>
                            <button onClick={() => setShowCreateSectionModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateSection} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Parent Category</label>
                                <select 
                                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-shadow"
                                    value={newSectionData.parentId}
                                    onChange={e => setNewSectionData({...newSectionData, parentId: e.target.value})}
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {dbSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Section Name</label>
                                <input 
                                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-shadow"
                                    value={newSectionData.name}
                                    onChange={e => setNewSectionData({...newSectionData, name: e.target.value})}
                                    required
                                    placeholder="e.g. Food"
                                />
                            </div>
                        </form>
                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                            <Button variant="ghost" onClick={() => setShowCreateSectionModal(false)}>Cancel</Button>
                            <button onClick={handleCreateSection} className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 font-medium text-sm transition-colors">Create</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Add Item Modal */}
            {showAddItemModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-xl w-full max-w-md shadow-2xl animate-scaleIn overflow-hidden">
                        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Add Item</h3>
                                <p className="text-sm text-gray-500 mt-0.5">Record a new expense</p>
                            </div>
                            <button onClick={() => setShowAddItemModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                         <form onSubmit={handleCreateItem} className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                                    <select 
                                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                                        value={newItem.parentId}
                                        onChange={e => setNewItem({...newItem, parentId: e.target.value, subId: ''})}
                                        required
                                    >
                                        <option value="">Select</option>
                                        {dbSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Section</label>
                                    <select 
                                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
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
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
                                <input 
                                    type="date"
                                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                                    value={newItem.expense_date}
                                    onChange={e => setNewItem({...newItem, expense_date: e.target.value})}
                                    required 
                                />
                             </div>

                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                                <input 
                                    type="text"
                                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                                    value={newItem.description}
                                    onChange={e => setNewItem({...newItem, description: e.target.value})}
                                    placeholder="Enter description"
                                />
                             </div>

                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">LKR</span>
                                    <input 
                                        type="number"
                                        step="0.01"
                                        className="w-full border border-gray-200 rounded-lg pl-12 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                                        value={newItem.amount}
                                        onChange={e => setNewItem({...newItem, amount: e.target.value})}
                                        required 
                                        placeholder="0.00"
                                    />
                                </div>
                             </div>

                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Attachment</label>
                                <input 
                                    type="file"
                                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    onChange={e => setAttachment(e.target.files[0])}
                                />
                             </div>
                         </form>
                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                            <Button variant="ghost" onClick={() => setShowAddItemModal(false)}>Cancel</Button>
                            <Button onClick={handleCreateItem}>Add Item</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
