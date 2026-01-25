import { useEffect, useState } from 'react';
import apiClient from '../../api/apiClient';
import { Link } from 'react-router-dom';

export default function Summary() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const res = await apiClient.get('/api/expenditure/summary');
                setStats(res.data);
            } catch (e) { console.error(e); } 
            finally { setLoading(false); }
        };
        fetchSummary();
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <div>
             <div className="flex items-center mb-6">
                <Link to="/expenditure" className="text-gray-500 hover:text-gray-700 mr-4">← Back</Link>
                <h1 className="text-2xl font-bold">Expenditure Summary</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-indigo-600">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Total Expenditure</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">${Number(stats?.total_amount || 0).toLocaleString()}</p>
                </div>
                
                {/* Add more detailed breakdown if API provides it */}
                <div className="bg-white p-6 rounded-lg shadow">
                     <h3 className="text-lg font-bold mb-4">Breakdown by Section</h3>
                     <ul className="space-y-2">
                        {stats?.by_section?.map((s, idx) => (
                            <li key={idx} className="flex justify-between border-b pb-2">
                                <span>{s.section_name}</span>
                                <span className="font-semibold">${Number(s.total).toLocaleString()}</span>
                            </li>
                        ))}
                         {!stats?.by_section && <p className="text-gray-500">No breakdown available.</p>}
                     </ul>
                </div>
            </div>
        </div>
    );
}
