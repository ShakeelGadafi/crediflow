import { useEffect, useState } from 'react';
import apiClient from '../../api/apiClient';
import { Link } from 'react-router-dom';
import { Plus, Users, Search, ArrowRight, Trash2, Pencil } from 'lucide-react';
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
    const [deleteModal, setDeleteModal] = useState({ open: false, customer: null });
    const [deleting, setDeleting] = useState(false);
    const [editModal, setEditModal] = useState({ open: false, customer: null });
    const [editCustomer, setEditCustomer] = useState({ full_name: '', phone: '', address: '' });
    const [saving, setSaving] = useState(false);

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

    const handleDelete = async () => {
        if (!deleteModal.customer) return;
        setDeleting(true);
        try {
            await apiClient.delete(`/api/credit/customers/${deleteModal.customer.id}`);
            setDeleteModal({ open: false, customer: null });
            fetchCustomers();
        } catch (e) {
            alert('Failed to delete customer');
        } finally {
            setDeleting(false);
        }
    };

    const openEditModal = (customer) => {
        setEditCustomer({ 
            full_name: customer.full_name || '', 
            phone: customer.phone || '', 
            address: customer.address || '' 
        });
        setEditModal({ open: true, customer });
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        if (!editModal.customer) return;
        setSaving(true);
        try {
            await apiClient.put(`/api/credit/customers/${editModal.customer.id}`, editCustomer);
            setEditModal({ open: false, customer: null });
            fetchCustomers();
        } catch (e) {
            alert('Failed to update customer');
        } finally {
            setSaving(false);
        }
    };

    if (loading && customers.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-gray-200 border-t-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Credit Customers</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage customer accounts and outstanding balances</p>
                </div>
                <Button onClick={() => setShowModal(true)} icon={Plus}>
                    Add Customer
                </Button>
            </div>

            {/* Search */}
            <div className="max-w-md">
                <Input 
                    placeholder="Search by name or phone..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    icon={Search}
                />
            </div>

            {/* Table */}
            <Table 
                loading={loading}
                columns={[
                    { 
                        header: 'Customer', 
                        accessor: 'full_name', 
                        render: (row) => (
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                                    {row.full_name?.charAt(0)?.toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{row.full_name}</p>
                                    <p className="text-xs text-gray-500">{row.phone || 'No phone'}</p>
                                </div>
                            </div>
                        )
                    },
                    { header: 'Address', accessor: 'address', hideOnMobile: true, render: (row) => <span className="text-gray-600">{row.address || '—'}</span> },
                    { 
                        header: 'Outstanding', 
                        render: (row) => (
                            <span className={`font-semibold ${Number(row.total_unpaid) > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                ${Number(row.total_unpaid || 0).toLocaleString()}
                            </span>
                        )
                    },
                    { 
                        header: '', 
                        render: (row) => (
                            <div className="flex items-center gap-2 sm:gap-3">
                                <Link 
                                    to={`/credit/customers/${row.id}`} 
                                    className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                                >
                                    <span className="hidden sm:inline">View Details</span>
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                                <button
                                    onClick={() => openEditModal(row)}
                                    className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                    title="Edit customer"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setDeleteModal({ open: true, customer: row })}
                                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete customer"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        )
                    },
                ]}
                data={customers}
                emptyMessage="No customers found. Add your first customer to get started."
            />

            {/* Delete Confirmation Modal */}
            <Modal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, customer: null })} title="Delete Customer">
                <div className="space-y-4">
                    <p className="text-gray-600">
                        Are you sure you want to delete <strong>{deleteModal.customer?.full_name}</strong>? 
                        This will also delete all their bills and cannot be undone.
                    </p>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <Button type="button" onClick={() => setDeleteModal({ open: false, customer: null })} variant="ghost">
                            Cancel
                        </Button>
                        <Button type="button" onClick={handleDelete} variant="danger" disabled={deleting}>
                            {deleting ? 'Deleting...' : 'Delete Customer'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Add Customer Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Customer">
                <form onSubmit={handleCreate} className="space-y-5">
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
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
                        <textarea 
                            className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" 
                            rows="3"
                            value={newCustomer.address} 
                            onChange={e => setNewCustomer({...newCustomer, address: e.target.value})}
                            placeholder="Enter address"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <Button type="button" onClick={() => setShowModal(false)} variant="ghost">
                            Cancel
                        </Button>
                        <Button type="submit">
                            Add Customer
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Edit Customer Modal */}
            <Modal isOpen={editModal.open} onClose={() => setEditModal({ open: false, customer: null })} title="Edit Customer">
                <form onSubmit={handleEdit} className="space-y-5">
                    <Input
                        label="Full Name"
                        type="text"
                        value={editCustomer.full_name}
                        onChange={e => setEditCustomer({...editCustomer, full_name: e.target.value})}
                        required
                        placeholder="Enter customer name"
                        icon={Users}
                    />
                    <Input
                        label="Phone"
                        type="tel"
                        value={editCustomer.phone}
                        onChange={e => setEditCustomer({...editCustomer, phone: e.target.value})}
                        placeholder="Enter phone number"
                    />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
                        <textarea 
                            className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" 
                            rows="3"
                            value={editCustomer.address} 
                            onChange={e => setEditCustomer({...editCustomer, address: e.target.value})}
                            placeholder="Enter address"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <Button type="button" onClick={() => setEditModal({ open: false, customer: null })} variant="ghost">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
