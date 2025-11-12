

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { User } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button, buttonVariants } from '../../components/ui/Button';
import Dialog from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { logActivity } from '../../lib/activityLog';
import { checkPasswordStrength } from '../../lib/utils';
import PasswordStrengthMeter from '../../components/ui/PasswordStrengthMeter';

type SortKey = 'name' | 'email' | 'role' | 'createdAt';

const AdminUserManagement: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);

    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' }>({ key: 'createdAt', direction: 'descending' });

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const allUsers = await api.getUsers();
            setUsers(allUsers);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const processedUsers = useMemo(() => {
        let filteredUsers = [...users];

        if (searchTerm) {
            filteredUsers = filteredUsers.filter(user =>
                user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (sortConfig !== null) {
            filteredUsers.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return filteredUsers;
    }, [users, sortConfig, searchTerm]);
    
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, itemsPerPage]);

    // Pagination calculations
    const totalPages = Math.ceil(processedUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedUsers = processedUsers.slice(startIndex, startIndex + itemsPerPage);


    const requestSort = (key: SortKey) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key: SortKey) => {
        if (!sortConfig || sortConfig.key !== key) return null;
        return <span className="ml-1 text-xs">{sortConfig.direction === 'ascending' ? '▲' : '▼'}</span>;
    };

    const handleEditClick = (user: User) => {
        setSelectedUser(user);
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (user: User) => {
        setSelectedUser(user);
        setIsDeleteModalOpen(true);
    };
    
    const handleResetPasswordClick = (user: User) => {
        setSelectedUser(user);
        setIsResetPasswordModalOpen(true);
    };

    const getRoleBadgeVariant = (role: User['role']): 'destructive' | 'secondary' | 'success' => {
        if (role === 'admin') return 'destructive'; // Red for high-privilege
        if (role === 'mentor') return 'secondary';   // Neutral gray for mentor
        return 'success'; // Green for student, indicating learning/growth
    }
    
    const TableHeader: React.FC<{ sortKey: SortKey; children: React.ReactNode }> = ({ sortKey, children }) => (
        <th scope="col" className="px-6 py-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors" onClick={() => requestSort(sortKey)}>
            <div className="flex items-center">
                {children}
                {getSortIndicator(sortKey)}
            </div>
        </th>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight dark:text-white">User Management</h1>
                    <p className="text-slate-500 dark:text-slate-300">View, create, edit, and delete users.</p>
                </div>
                <Link to="/admin/users/create" className={buttonVariants()}>Create User</Link>
            </div>
            
            <div className="flex items-center">
                 <Input 
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="max-w-xs"
                />
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-white">
                                <tr>
                                    <TableHeader sortKey="name">Name</TableHeader>
                                    <TableHeader sortKey="email">Email</TableHeader>
                                    <TableHeader sortKey="role">Role</TableHeader>
                                    <TableHeader sortKey="createdAt">Joined On</TableHeader>
                                    <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="text-center p-8">Loading users...</td>
                                    </tr>
                                ) : paginatedUsers.length > 0 ? (
                                    paginatedUsers.map(user => (
                                        <tr key={user.id} className="bg-white border-b dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600">
                                            <td className="px-6 py-4 font-medium">{user.name}</td>
                                            <td className="px-6 py-4">{user.email}</td>
                                            <td className="px-6 py-4">
                                                <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">
                                                    {user.role === 'mentor' ? 'Instructor' : user.role}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">{new Date(user.createdAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex gap-1 justify-end">
                                                    <Button aria-label={`Edit ${user.name}`} variant="ghost" size="icon" onClick={() => handleEditClick(user)}>
                                                        <EditIcon className="w-[14px] h-[14px]" />
                                                    </Button>
                                                    <Button aria-label={`Reset password for ${user.name}`} title={`Reset password for ${user.name}`} variant="ghost" size="icon" onClick={() => handleResetPasswordClick(user)}>
                                                        <KeyIcon className="w-[14px] h-[14px]" />
                                                    </Button>
                                                    <Button 
                                                        aria-label={`Delete ${user.name}`} 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => handleDeleteClick(user)}
                                                        disabled={user.id === currentUser?.id}
                                                        title={user.id === currentUser?.id ? "You cannot delete your own account." : `Delete ${user.name}`}
                                                    >
                                                        <TrashIcon className="w-[14px] h-[14px] text-red-500" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="text-center p-8 text-slate-500 dark:text-slate-300">
                                            <div className="flex flex-col items-center gap-2">
                                                <UserSearchIcon className="w-[38px] h-[38px] text-slate-400" />
                                                <span className="font-semibold">No users found</span>
                                                <span>Try adjusting your search term.</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 dark:text-white">
                        Showing <strong>{startIndex + 1}</strong>-<strong>{Math.min(startIndex + itemsPerPage, processedUsers.length)}</strong> of <strong>{processedUsers.length}</strong> users
                    </span>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-500 dark:text-white">Page {currentPage} of {totalPages}</span>
                        <div className="flex gap-2">
                             <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            
            {selectedUser && (
                <>
                    <EditUserDialog isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onUserUpdated={fetchUsers} user={selectedUser} />
                    <DeleteUserDialog isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onUserDeleted={fetchUsers} user={selectedUser} />
                    <ResetPasswordDialog isOpen={isResetPasswordModalOpen} onClose={() => setIsResetPasswordModalOpen(false)} onPasswordReset={() => setIsResetPasswordModalOpen(false)} user={selectedUser} />
                </>
            )}
        </div>
    );
};


// --- Dialog Components ---

interface EditUserDialogProps { isOpen: boolean; onClose: () => void; onUserUpdated: () => void; user: User; }
const EditUserDialog: React.FC<EditUserDialogProps> = ({ isOpen, onClose, onUserUpdated, user }) => {
    const { user: adminUser } = useAuth();
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [role, setRole] = useState(user.role);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    
    useEffect(() => {
        if (isOpen) {
            setName(user.name);
            setEmail(user.email);
            setRole(user.role);
            setError('');
        }
    }, [user, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        try {
            if (role !== user.role) {
                logActivity('user_role_change', `${user.name}'s role was changed from ${user.role} to ${role}.`, {
                    userId: user.id,
                    userName: user.name,
                    adminId: adminUser?.id,
                    adminName: adminUser?.name,
                    oldRole: user.role,
                    newRole: role
                });
            }
            await api.updateUser({ ...user, name, email, role });
            onUserUpdated();
            onClose();
        } catch(err) {
            setError('Failed to update user.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Edit User">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="edit-name" className="block text-sm font-medium mb-1">Full Name</label>
                    <Input id="edit-name" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div>
                    <label htmlFor="edit-email" className="block text-sm font-medium mb-1">Email Address</label>
                    <Input id="edit-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled />
                    <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">Email cannot be changed.</p>
                </div>
                <div>
                    <label htmlFor="edit-role" className="block text-sm font-medium mb-1">Role</label>
                    <Select id="edit-role" value={role} onChange={e => setRole(e.target.value as any)} required>
                        <option value="student">Student</option>
                        <option value="mentor">Instructor</option>
                        <option value="admin">Admin</option>
                    </Select>
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Changes'}</Button>
                </div>
            </form>
        </Dialog>
    );
}

interface DeleteUserDialogProps { isOpen: boolean; onClose: () => void; onUserDeleted: () => void; user: User; }
const DeleteUserDialog: React.FC<DeleteUserDialogProps> = ({ isOpen, onClose, onUserDeleted, user }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleDelete = async () => {
        setIsSubmitting(true);
        try {
            await api.deleteUser(user.id);
            onUserDeleted();
            onClose();
        } catch (err) {
            console.error("Failed to delete user", err);
            // Optionally set an error state to show in the dialog
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Delete User"
            description={`Are you sure you want to delete ${user.name}? This action is permanent.`}
        >
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>{isSubmitting ? 'Deleting...' : 'Delete User'}</Button>
            </div>
        </Dialog>
    );
}

interface ResetPasswordDialogProps { isOpen: boolean; onClose: () => void; onPasswordReset: () => void; user: User; }
const ResetPasswordDialog: React.FC<ResetPasswordDialogProps> = ({ isOpen, onClose, onPasswordReset, user }) => {
    const { user: adminUser } = useAuth();
    const [newPassword, setNewPassword] = useState('');
    const [passwordStrength, setPasswordStrength] = useState({ score: 0, level: 'none' as const, text: '' });
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [isConfirming, setIsConfirming] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setNewPassword('');
            setConfirmPassword('');
            setError('');
            setShowNewPassword(false);
            setShowConfirmPassword(false);
            setIsConfirming(false);
        }
    }, [isOpen]);

     useEffect(() => {
        setPasswordStrength(checkPasswordStrength(newPassword));
    }, [newPassword]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (passwordStrength.score < 3) {
            setError('Password is too weak. Please choose a stronger password.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        setIsConfirming(true);
    };

    const handleConfirmReset = async () => {
        setIsSubmitting(true);
        setError('');
        try {
            await api.resetPassword(user.id, newPassword);
            logActivity('user_password_reset', `Password for ${user.name} was reset by an administrator.`, {
                userId: user.id,
                userName: user.name,
                adminId: adminUser?.id,
                adminName: adminUser?.name,
            });
            onPasswordReset();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to reset password.');
            setIsConfirming(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isPasswordWeak = newPassword.length > 0 && passwordStrength.score < 3;

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            title="Reset Password"
            description={isConfirming ? 'Please confirm this critical action.' : `Set a new password for ${user.name}.`}
        >
            {!isConfirming ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        {/* FIX: Corrected typo `classNam e` to `className`. */}
                        <label htmlFor="new-password" className="block text-sm font-medium mb-1">New Password</label>
                        <div className="relative">
                            <Input id="new-password" type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} required aria-describedby="password-reset-help" />
                            <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700">
                                {showNewPassword ? <EyeOffIcon className="w-[18px] h-[18px]" /> : <EyeIcon className="w-[18px] h-[18px]" />}
                            </button>
                        </div>
                        <PasswordStrengthMeter level={passwordStrength.level} text={passwordStrength.text} />
                    </div>
                    <div>
                        <label htmlFor="confirm-password" className="block text-sm font-medium mb-1">Confirm New Password</label>
                        <div className="relative">
                            <Input id="confirm-password" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700">
                                {showConfirmPassword ? <EyeOffIcon className="w-[18px] h-[18px]" /> : <EyeIcon className="w-[18px] h-[18px]" />}
                            </button>
                        </div>
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                     {isPasswordWeak && (
                        <p className="text-xs text-orange-500">Password must be at least 'Medium' strength.</p>
                    )}
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting || isPasswordWeak}>Reset Password</Button>
                    </div>
                </form>
            ) : (
                <div className="space-y-6">
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-600 rounded-md">
                        <h4 className="font-semibold text-yellow-800 dark:text-yellow-300">Warning</h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-400">
                            Are you sure you want to reset the password for <strong className="font-semibold">{user.name}</strong>?
                            This action cannot be undone.
                        </p>
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsConfirming(false)} disabled={isSubmitting}>Go Back</Button>
                        <Button variant="destructive" onClick={handleConfirmReset} disabled={isSubmitting}>
                            {isSubmitting ? 'Resetting...' : 'Confirm Reset'}
                        </Button>
                    </div>
                </div>
            )}
        </Dialog>
    );
};


// --- Icon Components ---
const EditIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
// FIX: Add KeyIcon definition.
const KeyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-4.73-4.73" />
    <path d="m15 2-3.5 3.5" />
    <circle cx="6.5" cy="17.5" r="4.5" />
  </svg>
);
// FIX: Add TrashIcon definition.
const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);
// FIX: Add UserSearchIcon definition.
const UserSearchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="10" r="4" />
    <path d="M10 16c-3.9 0-7 2-7 4" />
    <circle cx="17" cy="17" r="3" />
    <path d="m21 21-1.9-1.9" />
  </svg>
);
// FIX: Add EyeIcon and EyeOffIcon definitions.
const EyeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
);
const EyeOffIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
);

export default AdminUserManagement;
