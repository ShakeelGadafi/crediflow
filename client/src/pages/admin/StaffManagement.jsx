import { useEffect, useState } from 'react';
import apiClient from '../../api/apiClient';
import { Plus, UserCheck, UserX, Shield, Mail, User } from 'lucide-react';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Badge from '../../components/Badge';
import Table from '../../components/Table';

export default function StaffManagement() {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showPermModal, setShowPermModal] = useState(false);
    
    // Create Staff State
    const [newStaff, setNewStaff] = useState({ full_name: '', email: '', password: '' });

    // Permissions State
    const [selectedUser, setSelectedUser] = useState(null);
    const [permissions, setPermissions] = useState([]);

    const fetchStaff = async () => {
        try {
            const res = await apiClient.get('/api/admin/staff');
            setStaff(res.data);
        } catch (e) { console.error(e); } 
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await apiClient.post('/api/admin/staff', newStaff);
            setShowCreateModal(false);
            setNewStaff({ full_name: '', email: '', password: '' });
            fetchStaff();
            alert('Staff member created successfully');
        } catch (e) { 
            alert(e.response?.data?.message || 'Failed to create staff');
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        if (!confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this user?`)) return;
        try {
            await apiClient.patch(`/api/admin/staff/${id}`, { is_active: !currentStatus });
            fetchStaff();
        } catch(e) { alert('Failed to update status'); }
    };

    const openPermissionsModal = async (user) => {
        setSelectedUser(user);
        try {
            const res = await apiClient.get(`/api/admin/staff/${user.id}/permissions`);
            setPermissions(res.data);
            setShowPermModal(true);
        } catch(e) {
            console.error(e);
            alert('Failed to fetch permissions');
        }
    };

    const handlePermissionChange = (moduleId, field) => {
        setPermissions(prev => prev.map(p => {
            if (p.module_id === moduleId) {
                return { ...p, [field]: !p[field] };
            }
            return p;
        }));
    };

    const savePermissions = async () => {
        try {
            const payload = permissions.map(p => ({
                moduleId: p.module_id,
                can_view: p.can_view,
                can_create: p.can_create,
                can_update: p.can_update,
                can_delete: p.can_delete
            }));

            await apiClient.put(`/api/admin/staff/${selectedUser.id}/permissions`, { permissions: payload });
            setShowPermModal(false);
            alert('Permissions updated successfully');
        } catch(e) {
            alert('Failed to update permissions');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage team members and their permissions</p>
                </div>
                <Button onClick={() => setShowCreateModal(true)} icon={Plus}>
                    Add Staff
                </Button>
            </div>

            {/* Table */}
            <Table 
                loading={loading}
                columns={[
                    { 
                        header: 'Staff Member', 
                        render: (row) => (
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                                    {row.full_name?.charAt(0)?.toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{row.full_name}</p>
                                    <p className="text-xs text-gray-500">{row.email}</p>
                                </div>
                            </div>
                        )
                    },
                    { 
                        header: 'Role', 
                        render: (row) => (
                            <Badge variant={row.role === 'ADMIN' ? 'primary' : 'default'}>
                                {row.role}
                            </Badge>
                        )
                    },
                    { 
                        header: 'Status', 
                        render: (row) => (
                            <Badge variant={row.is_active ? 'success' : 'danger'} dot>
                                {row.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                        )
                    },
                    { 
                        header: 'Actions', 
                        render: (row) => (
                            <div className="flex items-center gap-2">
                                <Button 
                                    size="xs"
                                    variant="ghost"
                                    onClick={() => openPermissionsModal(row)}
                                    icon={Shield}
                                >
                                    Permissions
                                </Button>
                                <Button 
                                    size="xs"
                                    variant={row.is_active ? 'ghost' : 'ghost'}
                                    onClick={() => handleToggleStatus(row.id, row.is_active)}
                                    icon={row.is_active ? UserX : UserCheck}
                                    className={row.is_active ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}
                                >
                                    {row.is_active ? 'Deactivate' : 'Activate'}
                                </Button>
                            </div>
                        )
                    }
                ]}
                data={staff}
                emptyMessage="No staff members found."
            />

            {/* Create Staff Modal */}
            <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add New Staff">
                <form onSubmit={handleCreate} className="space-y-5">
                    <Input
                        label="Full Name"
                        required
                        value={newStaff.full_name}
                        onChange={e => setNewStaff({...newStaff, full_name: e.target.value})}
                        placeholder="John Doe"
                        icon={User}
                    />
                    <Input
                        label="Email"
                        type="email"
                        required
                        value={newStaff.email}
                        onChange={e => setNewStaff({...newStaff, email: e.target.value})}
                        placeholder="john@example.com"
                        icon={Mail}
                    />
                    <Input
                        label="Password"
                        type="password"
                        required
                        value={newStaff.password}
                        onChange={e => setNewStaff({...newStaff, password: e.target.value})}
                        placeholder="••••••••"
                    />
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <Button type="button" onClick={() => setShowCreateModal(false)} variant="ghost">Cancel</Button>
                        <Button type="submit">Create Staff</Button>
                    </div>
                </form>
            </Modal>

            {/* Permissions Modal */}
            <Modal isOpen={showPermModal} onClose={() => setShowPermModal(false)} title={`Permissions: ${selectedUser?.full_name}`} size="lg">
                <div className="space-y-5">
                    <p className="text-sm text-gray-500">Configure module access for this staff member.</p>
                    <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead>
                                <tr className="bg-gray-100/80">
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Module</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">View</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Create</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Update</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Delete</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {permissions.map(p => (
                                    <tr key={p.module_id} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.name}</td>
                                        <td className="px-4 py-3 text-center">
                                            <input type="checkbox" checked={!!p.can_view} onChange={() => handlePermissionChange(p.module_id, 'can_view')} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"/>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <input type="checkbox" checked={!!p.can_create} onChange={() => handlePermissionChange(p.module_id, 'can_create')} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"/>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <input type="checkbox" checked={!!p.can_update} onChange={() => handlePermissionChange(p.module_id, 'can_update')} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"/>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <input type="checkbox" checked={!!p.can_delete} onChange={() => handlePermissionChange(p.module_id, 'can_delete')} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"/>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <Button type="button" onClick={() => setShowPermModal(false)} variant="ghost">Cancel</Button>
                        <Button onClick={savePermissions}>Save Changes</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

