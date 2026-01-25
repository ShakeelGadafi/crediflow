import { useEffect, useState } from 'react';
import apiClient from '../../api/apiClient';
import { BarChart2, Calendar, ChevronDown, ChevronRight, ChevronLeft, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Summary() {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // Filters
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    useEffect(() => {
        fetchSummary();
    }, [dateFrom, dateTo]);

    const fetchSummary = async () => {
        setLoading(true);
        try {
            const params = {};
            if (dateFrom) params.from = dateFrom;
            if (dateTo) params.to = dateTo;
            
            const res = await apiClient.get('/api/expenditure/summary', { params });
            // API returns: { grand_total, totals_by_month, totals_by_section, totals_by_category }
            setSummary(res.data);
        } catch (e) { console.error(e); } 
        finally { setLoading(false); }
    };

    return (
        <div className="space-y-6">
             {/* Header */}
             <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center gap-3">
                    <Link to="/expenditure" className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <BarChart2 className="w-6 h-6 text-indigo-600"/> Expenditure Summary
                    </h1>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-4 items-end">
                <div>
                     <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">From Date</label>
                     <input 
                        type="date" 
                        className="border border-gray-300 rounded-lg p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                    />
                </div>
                <div>
                     <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">To Date</label>
                     <input 
                        type="date" 
                        className="border border-gray-300 rounded-lg p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                    />
                </div>
                <div>
                    <button 
                        onClick={() => { setDateFrom(''); setDateTo(''); }}
                        className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
                    >
                        Clear Date Filters
                    </button>
                </div>
            </div>

            {loading ? (
                 <div className="text-center py-12 text-gray-500">Loading summary data...</div>
            ) : summary ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Overall Stats */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Total Expenditure</h3>
                         <div className="text-4xl font-bold text-green-600 mb-2">
                            ${Number(summary.grand_total).toLocaleString()}
                        </div>
                        <p className="text-sm text-gray-500">Grand Total for selected period</p>
                    </div>

                    {/* By Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Top Sections</h3>
                        <div className="space-y-3">
                            {summary.totals_by_section.slice(0, 5).map(s => (
                                <div key={s.section_id} className="flex justify-between items-center">
                                    <span className="text-gray-600 font-medium">{s.section_name}</span>
                                    <span className="font-bold text-gray-900">${Number(s.total).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Monthly Breakdown */}
                    <div className="md:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b border-gray-200">
                             <h3 className="text-lg font-semibold text-gray-800">Monthly Breakdown</h3>
                        </div>
                        <div className="divide-y divide-gray-200">
                            {summary.totals_by_month && summary.totals_by_month.length > 0 ? (
                                summary.totals_by_month.map((m) => (
                                    <MonthSummaryRow key={m.month} monthData={m} />
                                ))
                            ) : (
                                <div className="p-6 text-center text-gray-500">No data available for the selected period.</div>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function MonthSummaryRow({ monthData }) {
    const [expanded, setExpanded] = useState(false);
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(false);

    // Format 'YYYY-MM' to 'Month Year'
    const [year, month] = monthData.month.split('-');
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
    const monthLabel = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const fetchDetails = async () => {
        if (details) return;
        setLoading(true);
        try {
            // Fetch month specific data using existing list endpoint
            const from = `${monthData.month}-01`;
            // Calculate last day of month
            const to = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
            
            const res = await apiClient.get('/api/expenditure', { params: { from, to } });
            
            // Group by section for display
            const bySection = {};
            res.data.forEach(item => {
                if (!bySection[item.section_id]) {
                    bySection[item.section_id] = { name: item.section_name, total: 0, items: [] };
                }
                bySection[item.section_id].total += Number(item.amount);
                bySection[item.section_id].items.push(item);
            });
            
            setDetails(Object.values(bySection));
        } catch (e) { console.error(e); } 
        finally { setLoading(false); }
    };

    const toggle = () => {
        if (!expanded) fetchDetails();
        setExpanded(!expanded);
    };

    return (
        <div>
            <div 
                className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={toggle}
            >
                <div className="flex items-center gap-3">
                    {expanded ? <ChevronDown className="w-5 h-5 text-gray-400"/> : <ChevronRight className="w-5 h-5 text-gray-400"/>}
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-indigo-500" />
                        <span className="text-gray-800 font-semibold">{monthLabel}</span>
                    </div>
                </div>
                <div className="font-bold text-gray-900 text-lg">
                    ${Number(monthData.total).toLocaleString()}
                </div>
            </div>

            {expanded && (
                <div className="bg-gray-50 p-4 border-t border-gray-100">
                    {loading ? (
                        <div className="flex justify-center py-4"><span className="animate-pulse text-gray-500">Loading details...</span></div>
                    ) : details ? (
                        <div className="space-y-4 pl-8">
                             {/* Section Breakdown for Month */}
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {details.map(sec => (
                                    <div key={sec.name} className="bg-white p-3 rounded-md shadow-sm border border-gray-200">
                                        <div className="font-medium text-gray-700">{sec.name}</div>
                                        <div className="text-indigo-600 font-bold text-lg">${sec.total.toLocaleString()}</div>
                                        <div className="text-xs text-gray-400 mt-1">{sec.items.length} records</div>
                                    </div>
                                ))}
                             </div>
                        </div>
                    ) : (
                        <div className="pl-8 text-gray-500">No records found.</div>
                    )}
                </div>
            )}
        </div>
    );
}
