import { useEffect, useState, useCallback } from 'react';
import apiClient from '../../api/apiClient';
import { FileText, Search, Filter, X, ChevronLeft, ChevronRight, Calendar, ArrowLeft, Eye, List } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../../components/Button';

export default function ExpenditureAll() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Filters
    const [filters, setFilters] = useState({
        from: '',
        to: '',
        sectionId: '',
        categoryId: ''
    });

    const [sections, setSections] = useState([]);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        fetchSections();
        fetchItems();
    }, []);

    const fetchSections = async () => {
        try {
            const res = await apiClient.get('/api/expenditure/sections');
            setSections(res.data);
        } catch (e) { console.error(e); }
    };

    // Fetch categories when section changes
    useEffect(() => {
        if (filters.sectionId) {
            apiClient.get(`/api/expenditure/sections/${filters.sectionId}/categories`)
                .then(res => setCategories(res.data))
                .catch(console.error);
        } else {
            setCategories([]);
        }
    }, [filters.sectionId]);

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            // Remove empty filters
            const params = {};
            if (filters.from) params.from = filters.from;
            if (filters.to) params.to = filters.to;
            if (filters.sectionId) params.sectionId = filters.sectionId;
            if (filters.categoryId) params.categoryId = filters.categoryId;

            const res = await apiClient.get('/api/expenditure', { params });
            setItems(res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [filters]);

    useEffect(() => {
        // Debounce or just fetch on filter change? 
        // For date range, maybe wait a bit. For dropdowns, immediate.
        // Let's rely on explicit "Apply" or just immediate effects. Immediate is nicer for small datasets.
        const timer = setTimeout(() => {
             fetchItems();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchItems]);

    const clearFilters = () => {
        setFilters({ from: '', to: '', sectionId: '', categoryId: '' });
    };

    return (
        <div className="space-y-6">
            <Link to="/expenditure" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors text-sm">
                <ArrowLeft className="w-4 h-4" /> Back to Expenditure
            </Link>

            <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-200">
                    <List className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">All Expenditure Records</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Complete list of all expenses</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-sm text-gray-500 font-medium">
                    <Filter className="w-4 h-4" /> Filter Records
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="relative">
                        <Calendar className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="date" 
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            value={filters.from}
                            onChange={e => setFilters({...filters, from: e.target.value})}
                            placeholder="From Date"
                        />
                    </div>
                    <div className="relative">
                        <Calendar className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="date" 
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            value={filters.to}
                            onChange={e => setFilters({...filters, to: e.target.value})}
                            placeholder="To Date"
                        />
                    </div>
                    <div>
                        <select 
                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            value={filters.sectionId}
                            onChange={e => setFilters({...filters, sectionId: e.target.value, categoryId: ''})}
                        >
                            <option value="">All Sections</option>
                            {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <select 
                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            value={filters.categoryId}
                            onChange={e => setFilters({...filters, categoryId: e.target.value})}
                            disabled={!filters.sectionId}
                        >
                            <option value="">All Categories</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <Button variant="ghost" onClick={clearFilters} icon={X} className="w-full justify-center">
                            Clear Filters
                        </Button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead>
                            <tr className="bg-gray-50/80">
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Section</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Attachment</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center">
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-gray-200 border-t-indigo-600"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center">
                                        <FileText className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                                        <p className="font-medium text-gray-500">No records found</p>
                                        <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
                                    </td>
                                </tr>
                            ) : items.map((item) => (
                                <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {new Date(item.expense_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {item.section_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {item.category_name}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                                        {item.description || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                        LKR {Number(item.amount).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        {item.attachment_url && (
                                            <a 
                                                href={`${import.meta.env.VITE_API_URL}${item.attachment_url}`} 
                                                target="_blank" 
                                                className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                                            >
                                                <Eye className="w-4 h-4" /> View
                                            </a>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
