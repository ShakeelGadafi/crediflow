import { useEffect, useState } from 'react';
import apiClient from '../../api/apiClient';
import { Plus, Users, UserCog, UserCheck, UserX, Shield, Check } from 'lucide-react';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import Input from '../../components/Input';

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
    const [modules, setModules] = useState([]);

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
            // Fetch modules and user's current permissions
            // Assuming we added this endpoint
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

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
                <Button onClick={() => setShowCreateModal(true)} icon={Plus}>
                    Add Staff
                </Button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {staff.map(user => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.full_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {user.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex space-x-3">
                                    <button 
                                        onClick={() => openPermissionsModal(user)}
                                        className="text-indigo-600 hover:text-indigo-900 flex items-center"
                                        title="Manage Permissions"
                                    >
                                        <Shield className="w-5 h-5 mr-1" /> Permissions
                                    </button>
                                    <button 
                                        onClick={() => handleToggleStatus(user.id, user.is_active)}
                                        className={`${user.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'} flex items-center`}
                                        title={user.is_active ? "Deactivate User" : "Activate User"}
                                    >
                                        {user.is_active ? <UserX className="w-5 h-5 mr-1" /> : <UserCheck className="w-5 h-5 mr-1" />}
                                        {user.is_active ? 'Deactivate' : 'Activate'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create Staff Modal */}
            <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add New Staff">
                <form onSubmit={handleCreate} className="space-y-4">
                    <Input
                        label="Full Name"
                        required
                        value={newStaff.full_name}
                        onChange={e => setNewStaff({...newStaff, full_name: e.target.value})}
                        placeholder="John Doe"
                    />
                    <Input
                        label="Email"
                        type="email"
                        required
                        value={newStaff.email}
                        onChange={e => setNewStaff({...newStaff, email: e.target.value})}
                        placeholder="john@example.com"
                    />
                    <Input
                        label="Password"
                        type="password"
                        required
                        value={newStaff.password}
                        onChange={e => setNewStaff({...newStaff, password: e.target.value})}
                        placeholder="********"
                    />
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" onClick={() => setShowCreateModal(false)} variant="secondary">Cancel</Button>
                        <Button type="submit">Create Staff</Button>
                    </div>
                </form>
            </Modal>

            {/* Permissions Modal */}
            <Modal isOpen={showPermModal} onClose={() => setShowPermModal(false)} title={`Permissions: ${selectedUser?.full_name}`} size="xl">
                <div className="space-y-4">
                    <p className="text-gray-500 text-sm">Configure access control for each module.</p>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Module</th>
                                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">View</th>
                                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Create</th>
                                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Update</th>
                                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Delete</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {permissions.map(p => (
                                    <tr key={p.module_id}>
                                        <td className="px-4 py-2 text-sm font-medium text-gray-900">{p.name}</td>
                                        <td className="px-4 py-2 text-center">
                                            <input type="checkbox" checked={!!p.can_view} onChange={() => handlePermissionChange(p.module_id, 'can_view')} className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"/>
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <input type="checkbox" checked={!!p.can_create} onChange={() => handlePermissionChange(p.module_id, 'can_create')} className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"/>
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <input type="checkbox" checked={!!p.can_update} onChange={() => handlePermissionChange(p.module_id, 'can_update')} className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"/>
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <input type="checkbox" checked={!!p.can_delete} onChange={() => handlePermissionChange(p.module_id, 'can_delete')} className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"/>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <Button type="button" onClick={() => setShowPermModal(false)} variant="secondary">Close</Button>
                        <Button onClick={savePermissions}>Save Changes</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

