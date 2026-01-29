import { useEffect, useState } from 'react';
import apiClient from '../../api/apiClient';
import { BarChart2, Calendar, ChevronDown, ChevronRight, ChevronLeft, ArrowLeft, TrendingUp, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../../components/Button';

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
            <Link to="/expenditure" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors text-sm">
                <ArrowLeft className="w-4 h-4" /> Back to Expenditure
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-200">
                        <BarChart2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Expenditure Summary</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Overview of all expenses</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-wrap gap-4 items-end">
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">From Date</label>
                    <div className="relative">
                        <Calendar className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="date" 
                            className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            value={dateFrom}
                            onChange={e => setDateFrom(e.target.value)}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">To Date</label>
                    <div className="relative">
                        <Calendar className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="date" 
                            className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            value={dateTo}
                            onChange={e => setDateTo(e.target.value)}
                        />
                    </div>
                </div>
                <Button 
                    variant="ghost"
                    onClick={() => { setDateFrom(''); setDateTo(''); }}
                >
                    Clear Filters
                </Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-gray-200 border-t-indigo-600"></div>
                </div>
            ) : summary ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Overall Stats */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-emerald-50 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-emerald-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Total Expenditure</h3>
                        </div>
                        <div className="text-4xl font-bold text-emerald-600 mb-2">
                            LKR {Number(summary.grand_total).toLocaleString()}
                        </div>
                        <p className="text-sm text-gray-500">Grand Total for selected period</p>
                    </div>

                    {/* By Section */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-indigo-50 rounded-lg">
                                <Layers className="w-5 h-5 text-indigo-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Top Sections</h3>
                        </div>
                        <div className="space-y-3">
                            {summary.totals_by_section.slice(0, 5).map(s => (
                                <div key={s.section_id} className="flex justify-between items-center p-3 bg-gray-50/50 rounded-lg">
                                    <span className="text-gray-700 font-medium">{s.section_name}</span>
                                    <span className="font-bold text-gray-900">LKR {Number(s.total).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Monthly Breakdown */}
                    <div className="md:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">Monthly Breakdown</h3>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {summary.totals_by_month && summary.totals_by_month.length > 0 ? (
                                summary.totals_by_month.map((m) => (
                                    <MonthSummaryRow key={m.month} monthData={m} />
                                ))
                            ) : (
                                <div className="p-12 text-center">
                                    <Calendar className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                                    <p className="font-medium text-gray-500">No data available</p>
                                    <p className="text-sm text-gray-400 mt-1">No records for the selected period</p>
                                </div>
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
                className="px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-indigo-50/30 transition-colors"
                onClick={toggle}
            >
                <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg transition-colors ${expanded ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                        {expanded ? 
                            <ChevronDown className={`w-4 h-4 ${expanded ? 'text-indigo-600' : 'text-gray-400'}`}/> : 
                            <ChevronRight className="w-4 h-4 text-gray-400"/>
                        }
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-indigo-500" />
                        <span className="text-gray-900 font-semibold">{monthLabel}</span>
                    </div>
                </div>
                <div className="font-bold text-gray-900 text-lg">
                    LKR {Number(monthData.total).toLocaleString()}
                </div>
            </div>

            {expanded && (
                <div className="bg-gray-50/50 px-6 py-4 border-t border-gray-100">
                    {loading ? (
                        <div className="flex justify-center py-6">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-indigo-600"></div>
                        </div>
                    ) : details && details.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-8">
                            {details.map(sec => (
                                <div key={sec.name} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                    <div className="font-medium text-gray-700">{sec.name}</div>
                                    <div className="text-indigo-600 font-bold text-lg mt-1">LKR {sec.total.toLocaleString()}</div>
                                    <div className="text-xs text-gray-400 mt-1">{sec.items.length} records</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="pl-8 text-gray-500 text-sm">No records found.</div>
                    )}
                </div>
            )}
        </div>
    );
}
