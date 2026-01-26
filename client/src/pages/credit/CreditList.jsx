import { useEffect, useState } from 'react';
import apiClient from '../../api/apiClient';
import { Link } from 'react-router-dom';
import { Plus, Users, Search } from 'lucide-react';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Table from '../../components/Table';

export default function CreditList() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newCustomer, setNewCustomer] = useState({ full_name: '', phone: '', address: '' });
    const [search, setSearch] = useState('');

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const params = {};
            if (search) params.search = search;
            const res = await apiClient.get('/api/credit/customers', { params });
            setCustomers(res.data);
        } catch (e) {
             console.error(e);
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCustomers();
        }, 300); // Debounce search
        return () => clearTimeout(timer);
    }, [search]);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await apiClient.post('/api/credit/customers', newCustomer);
            setShowModal(false);
            setNewCustomer({ full_name: '', phone: '', address: '' });
            fetchCustomers();
        } catch (e) { alert('Failed to create customer'); }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Credit Customers</h1>
                    <p className="text-gray-500 mt-1">Manage customer accounts and billing</p>
                </div>
                <Button onClick={() => setShowModal(true)} icon={Plus}>
                    Add Customer
                </Button>
            </div>

            <div className="mb-6">
                <Input 
                    placeholder="Search customers by name or phone..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    icon={Search}
                />
            </div>

            <Table 
                loading={loading}
                columns={[
                    { header: 'Name', accessor: 'full_name', render: (row) => <span className="font-medium text-gray-900">{row.full_name}</span> },
                    { header: 'Phone', accessor: 'phone' },
                    { header: 'Address', accessor: 'address' },
                    { 
                        header: 'Total Unpaid', 
                        render: (row) => <span className="font-semibold text-red-600">${Number(row.total_unpaid || 0).toLocaleString()}</span> 
                    },
                    { 
                        header: 'Actions', 
                        render: (row) => (
                            <Link to={`/credit/customers/${row.id}`} className="text-indigo-600 hover:text-indigo-900 font-medium hover:underline">
                                View Details →
                            </Link>
                        )
                    },
                ]}
                data={customers}
                emptyMessage="No customers found. Add your first customer to get started."
            />

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Customer">
                <form onSubmit={handleCreate} className="space-y-4">
                    <Input
                        label="Full Name"
                        type="text"
                        value={newCustomer.full_name}
                        onChange={e => setNewCustomer({...newCustomer, full_name: e.target.value})}
                        required
                        placeholder="Enter customer name"
                        icon={Users}
                    />
                    <Input
                        label="Phone"
                        type="tel"
                        value={newCustomer.phone}
                        onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
                        placeholder="Enter phone number"
                    />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <textarea 
                            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500" 
                            rows="3"
                            value={newCustomer.address} 
                            onChange={e => setNewCustomer({...newCustomer, address: e.target.value})}
                            placeholder="Enter address"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" onClick={() => setShowModal(false)} variant="secondary">
                            Cancel
                        </Button>
                        <Button type="submit">
                            Add Customer
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
