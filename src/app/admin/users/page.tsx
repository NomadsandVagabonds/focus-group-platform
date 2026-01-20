// User Management UI
'use client';

import { useState, useEffect } from 'react';

interface User {
    id: string;
    email: string;
    full_name?: string;
    role: 'admin' | 'editor' | 'viewer';
    is_active: boolean;
    last_login?: string;
    created_at: string;
}

interface UserPermission {
    id: string;
    survey_id: string;
    permission_level: 'view' | 'edit' | 'admin';
    surveys?: {
        id: string;
        title: string;
        status: string;
    };
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPermissionsModal, setShowPermissionsModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });

    // Invite modal state
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteName, setInviteName] = useState('');
    const [inviteRole, setInviteRole] = useState<'admin' | 'editor' | 'viewer'>('viewer');

    useEffect(() => {
        fetchUsers();
    }, [searchQuery, roleFilter, pagination.page]);

    async function fetchUsers() {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
            });
            if (roleFilter !== 'all') {
                params.append('role', roleFilter);
            }
            if (searchQuery) {
                params.append('search', searchQuery);
            }

            const response = await fetch(`/api/users?${params}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch users');
            }

            setUsers(data.users);
            setPagination(prev => ({
                ...prev,
                total: data.total,
                totalPages: data.totalPages,
            }));
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleInviteUser() {
        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: inviteEmail,
                    full_name: inviteName,
                    role: inviteRole,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to invite user');
            }

            setShowInviteModal(false);
            setInviteEmail('');
            setInviteName('');
            setInviteRole('viewer');
            fetchUsers();
        } catch (err: any) {
            setError(err.message);
        }
    }

    async function handleUpdateUser() {
        if (!selectedUser) return;

        try {
            const response = await fetch(`/api/users/${selectedUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: selectedUser.full_name,
                    role: selectedUser.role,
                    is_active: selectedUser.is_active,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update user');
            }

            setShowEditModal(false);
            setSelectedUser(null);
            fetchUsers();
        } catch (err: any) {
            setError(err.message);
        }
    }

    async function handleDeleteUser(userId: string) {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete user');
            }

            fetchUsers();
        } catch (err: any) {
            setError(err.message);
        }
    }

    async function fetchUserPermissions(userId: string) {
        try {
            const response = await fetch(`/api/users/${userId}/permissions`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch permissions');
            }

            setUserPermissions(data.permissions);
        } catch (err: any) {
            setError(err.message);
        }
    }

    function openEditModal(user: User) {
        setSelectedUser({ ...user });
        setShowEditModal(true);
    }

    function openPermissionsModal(user: User) {
        setSelectedUser(user);
        fetchUserPermissions(user.id);
        setShowPermissionsModal(true);
    }

    function getRoleBadgeClass(role: string) {
        switch (role) {
            case 'admin': return 'role-admin';
            case 'editor': return 'role-editor';
            case 'viewer': return 'role-viewer';
            default: return '';
        }
    }

    function getPermissionBadgeClass(level: string) {
        switch (level) {
            case 'admin': return 'permission-admin';
            case 'edit': return 'permission-edit';
            case 'view': return 'permission-view';
            default: return '';
        }
    }

    if (loading && users.length === 0) {
        return <div className="loading">Loading users...</div>;
    }

    return (
        <div className="users-page">
            <header className="page-header">
                <h1>User Management</h1>
                <p className="subtitle">Manage users and their permissions</p>
            </header>

            {error && (
                <div className="error-banner">
                    {error}
                    <button onClick={() => setError(null)}>Dismiss</button>
                </div>
            )}

            <div className="toolbar">
                <div className="toolbar-left">
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                    </select>
                    <span className="user-count">{pagination.total} users</span>
                </div>
                <div className="toolbar-right">
                    <button
                        className="btn-primary"
                        onClick={() => setShowInviteModal(true)}
                    >
                        Invite User
                    </button>
                </div>
            </div>

            <div className="users-table-wrapper">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Last Login</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className={!user.is_active ? 'inactive' : ''}>
                                <td>
                                    <div className="user-info">
                                        <span className="user-name">{user.full_name || 'No name'}</span>
                                        <span className="user-email">{user.email}</span>
                                    </div>
                                </td>
                                <td>
                                    <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td>
                                    <span className={`status-badge ${user.is_active ? 'status-active' : 'status-inactive'}`}>
                                        {user.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>
                                    {user.last_login
                                        ? new Date(user.last_login).toLocaleDateString()
                                        : 'Never'}
                                </td>
                                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                <td>
                                    <div className="action-buttons">
                                        <button
                                            className="btn-icon"
                                            onClick={() => openEditModal(user)}
                                            title="Edit user"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="btn-icon"
                                            onClick={() => openPermissionsModal(user)}
                                            title="View permissions"
                                        >
                                            Permissions
                                        </button>
                                        <button
                                            className="btn-icon btn-danger"
                                            onClick={() => handleDeleteUser(user.id)}
                                            title="Delete user"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan={6} className="empty-state">
                                    No users found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {pagination.totalPages > 1 && (
                <div className="pagination">
                    <button
                        disabled={pagination.page <= 1}
                        onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                    >
                        Previous
                    </button>
                    <span>Page {pagination.page} of {pagination.totalPages}</span>
                    <button
                        disabled={pagination.page >= pagination.totalPages}
                        onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Invite User Modal */}
            {showInviteModal && (
                <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2>Invite User</h2>

                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                placeholder="user@example.com"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                value={inviteName}
                                onChange={(e) => setInviteName(e.target.value)}
                                placeholder="John Doe"
                            />
                        </div>

                        <div className="form-group">
                            <label>Role</label>
                            <select
                                value={inviteRole}
                                onChange={(e) => setInviteRole(e.target.value as any)}
                            >
                                <option value="viewer">Viewer - Can view surveys and responses</option>
                                <option value="editor">Editor - Can edit surveys</option>
                                <option value="admin">Admin - Full access to all features</option>
                            </select>
                        </div>

                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setShowInviteModal(false)}>
                                Cancel
                            </button>
                            <button className="btn-primary" onClick={handleInviteUser}>
                                Send Invite
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && selectedUser && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h2>Edit User</h2>

                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                value={selectedUser.email}
                                disabled
                            />
                        </div>

                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                value={selectedUser.full_name || ''}
                                onChange={(e) => setSelectedUser({ ...selectedUser, full_name: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Role</label>
                            <select
                                value={selectedUser.role}
                                onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value as any })}
                            >
                                <option value="viewer">Viewer</option>
                                <option value="editor">Editor</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={selectedUser.is_active}
                                    onChange={(e) => setSelectedUser({ ...selectedUser, is_active: e.target.checked })}
                                />
                                Active
                            </label>
                        </div>

                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setShowEditModal(false)}>
                                Cancel
                            </button>
                            <button className="btn-primary" onClick={handleUpdateUser}>
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Permissions Modal */}
            {showPermissionsModal && selectedUser && (
                <div className="modal-overlay" onClick={() => setShowPermissionsModal(false)}>
                    <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
                        <h2>Permissions for {selectedUser.full_name || selectedUser.email}</h2>

                        <div className="permissions-list">
                            {userPermissions.length === 0 ? (
                                <p className="empty-text">No survey-specific permissions.</p>
                            ) : (
                                <table className="permissions-table">
                                    <thead>
                                        <tr>
                                            <th>Survey</th>
                                            <th>Status</th>
                                            <th>Permission</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {userPermissions.map(permission => (
                                            <tr key={permission.id}>
                                                <td>{permission.surveys?.title || 'Unknown Survey'}</td>
                                                <td>
                                                    <span className={`status-badge status-${permission.surveys?.status}`}>
                                                        {permission.surveys?.status || '-'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`permission-badge ${getPermissionBadgeClass(permission.permission_level)}`}>
                                                        {permission.permission_level}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setShowPermissionsModal(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .users-page {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 2rem;
                }

                .page-header {
                    margin-bottom: 2rem;
                }

                .page-header h1 {
                    font-family: 'EB Garamond', Georgia, serif;
                    font-size: 2rem;
                    font-weight: 500;
                    color: #1a1d24;
                    margin: 0 0 0.5rem 0;
                }

                .subtitle {
                    color: #666;
                    margin: 0;
                }

                .error-banner {
                    background: #fef2f2;
                    border: 1px solid #c94a4a;
                    color: #c94a4a;
                    padding: 1rem;
                    border-radius: 4px;
                    margin-bottom: 1rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .error-banner button {
                    background: none;
                    border: none;
                    color: #c94a4a;
                    cursor: pointer;
                    text-decoration: underline;
                }

                .toolbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                    gap: 1rem;
                    flex-wrap: wrap;
                }

                .toolbar-left, .toolbar-right {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .search-input {
                    padding: 0.5rem 1rem;
                    border: 1px solid #e0ddd8;
                    border-radius: 4px;
                    width: 250px;
                    font-size: 0.875rem;
                }

                .filter-select {
                    padding: 0.5rem 1rem;
                    border: 1px solid #e0ddd8;
                    border-radius: 4px;
                    background: white;
                    font-size: 0.875rem;
                }

                .user-count {
                    color: #666;
                    font-size: 0.875rem;
                }

                .btn-primary, .btn-secondary, .btn-icon {
                    padding: 0.5rem 1rem;
                    border-radius: 4px;
                    font-size: 0.875rem;
                    cursor: pointer;
                    border: none;
                    transition: all 0.2s;
                }

                .btn-primary {
                    background: #c94a4a;
                    color: white;
                }

                .btn-primary:hover {
                    background: #b43939;
                }

                .btn-secondary {
                    background: #f5f3ef;
                    color: #1a1d24;
                    border: 1px solid #e0ddd8;
                }

                .btn-secondary:hover {
                    background: #e8e5df;
                }

                .btn-icon {
                    background: none;
                    padding: 0.25rem 0.5rem;
                    color: #666;
                }

                .btn-icon:hover {
                    color: #1a1d24;
                    background: #f5f3ef;
                }

                .btn-icon.btn-danger:hover {
                    color: #c94a4a;
                    background: #fef2f2;
                }

                .users-table-wrapper {
                    overflow-x: auto;
                    border: 1px solid #e0ddd8;
                    border-radius: 4px;
                }

                .users-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.875rem;
                }

                .users-table th, .users-table td {
                    padding: 0.75rem 1rem;
                    text-align: left;
                    border-bottom: 1px solid #e0ddd8;
                }

                .users-table th {
                    background: #f5f3ef;
                    font-weight: 600;
                    color: #1a1d24;
                }

                .users-table tr:hover {
                    background: #fafaf9;
                }

                .users-table tr.inactive {
                    opacity: 0.6;
                }

                .user-info {
                    display: flex;
                    flex-direction: column;
                }

                .user-name {
                    font-weight: 500;
                    color: #1a1d24;
                }

                .user-email {
                    font-size: 0.75rem;
                    color: #666;
                }

                .role-badge, .status-badge, .permission-badge {
                    display: inline-block;
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    font-weight: 500;
                    text-transform: uppercase;
                }

                .role-admin {
                    background: #fef3c7;
                    color: #92400e;
                }

                .role-editor {
                    background: #e0e7ff;
                    color: #3730a3;
                }

                .role-viewer {
                    background: #f3f4f6;
                    color: #374151;
                }

                .status-active {
                    background: #dcfce7;
                    color: #166534;
                }

                .status-inactive {
                    background: #fee2e2;
                    color: #991b1b;
                }

                .permission-admin {
                    background: #fef3c7;
                    color: #92400e;
                }

                .permission-edit {
                    background: #e0e7ff;
                    color: #3730a3;
                }

                .permission-view {
                    background: #f3f4f6;
                    color: #374151;
                }

                .action-buttons {
                    display: flex;
                    gap: 0.25rem;
                }

                .empty-state, .empty-text {
                    text-align: center;
                    color: #666;
                    padding: 2rem;
                }

                .pagination {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 1rem;
                    margin-top: 1rem;
                }

                .pagination button {
                    padding: 0.5rem 1rem;
                    border: 1px solid #e0ddd8;
                    border-radius: 4px;
                    background: white;
                    cursor: pointer;
                }

                .pagination button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }

                .modal {
                    background: white;
                    border-radius: 8px;
                    padding: 2rem;
                    max-width: 500px;
                    width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                }

                .modal-wide {
                    max-width: 700px;
                }

                .modal h2 {
                    font-family: 'EB Garamond', Georgia, serif;
                    font-size: 1.5rem;
                    margin: 0 0 1.5rem 0;
                }

                .form-group {
                    margin-bottom: 1rem;
                }

                .form-group label {
                    display: block;
                    font-weight: 500;
                    margin-bottom: 0.5rem;
                    color: #1a1d24;
                }

                .form-group input, .form-group select {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #e0ddd8;
                    border-radius: 4px;
                    font-size: 1rem;
                }

                .form-group input:disabled {
                    background: #f5f3ef;
                    color: #666;
                }

                .checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                }

                .checkbox-label input {
                    width: auto;
                }

                .permissions-list {
                    margin-bottom: 1.5rem;
                }

                .permissions-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.875rem;
                }

                .permissions-table th, .permissions-table td {
                    padding: 0.75rem;
                    text-align: left;
                    border-bottom: 1px solid #e0ddd8;
                }

                .permissions-table th {
                    background: #f5f3ef;
                    font-weight: 600;
                }

                .modal-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.75rem;
                    margin-top: 1.5rem;
                }

                .loading {
                    text-align: center;
                    padding: 3rem;
                    color: #666;
                }
            `}</style>
        </div>
    );
}
