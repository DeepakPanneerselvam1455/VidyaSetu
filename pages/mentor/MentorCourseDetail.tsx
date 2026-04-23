
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import * as api from '../../lib/api';
import { Course, CourseMaterial } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import Dialog from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { cn } from '../../lib/utils';
import MentorQuizManagement from './MentorQuizManagement';
import MentorGradingView from './MentorGradingView';

type Tab = 'quizzes' | 'materials' | 'grading';

const MentorCourseDetail: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const location = useLocation();
    const [course, setCourse] = useState<Course | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const queryParams = new URLSearchParams(location.search);
    const initialTab = queryParams.get('tab') as Tab | null;
    const [activeTab, setActiveTab] = useState<Tab>(initialTab || 'quizzes');

    const fetchCourse = useCallback(async () => {
        if (!courseId) return;
        setIsLoading(true);
        try {
            const courseData = await api.getCourseById(courseId);
            setCourse(courseData);
        } catch (error) {
            console.error("Failed to fetch course details", error);
        } finally {
            setIsLoading(false);
        }
    }, [courseId]);

    useEffect(() => {
        fetchCourse();
    }, [fetchCourse]);

    if (isLoading) {
        return <div className="text-center p-8">Loading course...</div>;
    }

    if (!course) {
        return <div className="text-center p-8">Course not found.</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <Link to="/mentor/courses" className="text-sm hover:underline" style={{ color: 'var(--primary)' }}>← Back to Courses</Link>
                <h1 className="text-4xl font-bold tracking-tight mt-1">{course.title}</h1>
                <p className="text-lg mt-1" style={{ color: 'var(--text-secondary)' }}>{course.description}</p>
            </div>

            {/* Tab Navigation */}
            <div style={{ borderBottom: '1px solid var(--border-color)' }}>
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('quizzes')}
                        className="tab-themed whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
                        style={activeTab === 'quizzes' ? { borderColor: 'var(--primary)', color: 'var(--primary)' } : { borderColor: 'transparent', color: 'var(--text-secondary)' }}
                    >
                        Quizzes
                    </button>
                    <button
                        onClick={() => setActiveTab('materials')}
                        className="tab-themed whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
                        style={activeTab === 'materials' ? { borderColor: 'var(--primary)', color: 'var(--primary)' } : { borderColor: 'transparent', color: 'var(--text-secondary)' }}
                    >
                        Materials
                    </button>
                     <button
                        onClick={() => setActiveTab('grading')}
                        className="tab-themed whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
                        style={activeTab === 'grading' ? { borderColor: 'var(--primary)', color: 'var(--primary)' } : { borderColor: 'transparent', color: 'var(--text-secondary)' }}
                    >
                        Grading
                    </button>
                </nav>
            </div>
            
            {/* Tab Content */}
            <div>
                {activeTab === 'quizzes' && <MentorQuizManagement isTabView={true} course={course} />}
                {activeTab === 'materials' && <CourseMaterialsView course={course} onUpdate={fetchCourse} />}
                {activeTab === 'grading' && <MentorGradingView course={course} />}
            </div>
        </div>
    );
};


// --- Materials Management View ---
const CourseMaterialsView: React.FC<{ course: Course; onUpdate: () => void }> = ({ course, onUpdate }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState<CourseMaterial | null>(null);
    
    // Quick add state
    const [quickTitle, setQuickTitle] = useState('');
    const [quickUrl, setQuickUrl] = useState('');
    const [isQuickAdding, setIsQuickAdding] = useState(false);

    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const handleAddMaterial = async (newMaterial: Omit<CourseMaterial, 'id'>) => {
        const materialWithId: CourseMaterial = { ...newMaterial, id: `mat-${Date.now()}`};
        const updatedMaterials = [...course.materials, materialWithId];
        await api.updateCourse({ ...course, materials: updatedMaterials });
        onUpdate();
    };

    const handleQuickAddVideo = async () => {
        if (!quickTitle || !quickUrl) return;
        setIsQuickAdding(true);
        try {
            await handleAddMaterial({
                title: quickTitle,
                url: quickUrl,
                type: 'video'
            });
            setQuickTitle('');
            setQuickUrl('');
        } catch (error) {
            console.error("Quick add failed", error);
        } finally {
            setIsQuickAdding(false);
        }
    };
    
    const handleUpdateMaterial = async (updatedMaterial: CourseMaterial) => {
        const updatedMaterials = course.materials.map(m => m.id === updatedMaterial.id ? updatedMaterial : m);
        await api.updateCourse({ ...course, materials: updatedMaterials });
        onUpdate();
        setSelectedMaterial(null);
    };

    const handleDeleteMaterial = async () => {
        if (!selectedMaterial) return;
        const updatedMaterials = course.materials.filter(m => m.id !== selectedMaterial.id);
        await api.updateCourse({ ...course, materials: updatedMaterials });
        onUpdate();
        setSelectedMaterial(null);
    };
    
    const openEditDialog = (material: CourseMaterial) => {
        setSelectedMaterial(material);
        setIsEditModalOpen(true);
    };
    
    const openDeleteDialog = (material: CourseMaterial) => {
        setSelectedMaterial(material);
        setIsDeleteModalOpen(true);
    };
    
    const handleReorderMaterials = async (reorderedMaterials: CourseMaterial[]) => {
        try {
            await api.updateCourse({ ...course, materials: reorderedMaterials });
            onUpdate();
        } catch (error) {
            console.error("Failed to save reordered materials", error);
        }
    };

    const handleDragSort = () => {
        if (dragItem.current === null || dragOverItem.current === null) return;
        
        const newMaterials = [...course.materials];
        const draggedItemContent = newMaterials.splice(dragItem.current, 1)[0];
        newMaterials.splice(dragOverItem.current, 0, draggedItemContent);
        
        dragItem.current = null;
        dragOverItem.current = null;
        
        handleReorderMaterials(newMaterials);
    };

    return (
        <div className="space-y-6">
            {/* ── Quick Add Video Material Card ── */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                {/* Accent stripe */}
                <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

                <div className="flex flex-col lg:flex-row gap-4 p-5">
                    {/* Left: label + inputs */}
                    <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                            <VideoIcon className="w-4 h-4 text-indigo-500 shrink-0" />
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                Quick Add Video Material
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                                type="text"
                                placeholder="Video Title (e.g., Intro to JSX)"
                                value={quickTitle}
                                onChange={e => setQuickTitle(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 shadow-sm transition-colors duration-150 hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <input
                                type="url"
                                placeholder="Video URL (YouTube, Vimeo, etc.)"
                                value={quickUrl}
                                onChange={e => setQuickUrl(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 shadow-sm transition-colors duration-150 hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Right: action buttons */}
                    <div className="flex items-end gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={handleQuickAddVideo}
                            disabled={isQuickAdding || !quickTitle || !quickUrl}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 shadow-sm w-full lg:w-auto justify-center"
                        >
                            <VideoIcon className="w-4 h-4" />
                            {isQuickAdding ? 'Adding…' : 'Add Video'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsAddModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-sm w-full lg:w-auto justify-center"
                        >
                            <PlusIcon className="w-4 h-4" />
                            Other Material
                        </button>
                    </div>
                </div>
            </div>

            {course.materials.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {course.materials.map((material, index) => (
                        <Card 
                            key={material.id}
                            draggable
                            onDragStart={() => (dragItem.current = index)}
                            onDragEnter={() => (dragOverItem.current = index)}
                            onDragEnd={handleDragSort}
                            onDragOver={(e) => e.preventDefault()}
                            className="cursor-grab active:cursor-grabbing transition-shadow card-themed"
                        >
                            <CardHeader className="flex flex-row items-start gap-4">
                                <GripVerticalIcon className="w-5 h-5 shrink-0 mt-1 cursor-grab" style={{ color: 'var(--text-muted)' }} />
                                {getMaterialIcon(material.type)}
                                <div className="flex-1 overflow-hidden">
                                    <CardTitle className="text-lg">{material.title}</CardTitle>
                                    <CardDescription className="truncate" title={material.url}>{material.url}</CardDescription>
                                </div>
                            </CardHeader>
                            <CardFooter className="flex justify-end gap-1">
                                <Button variant="ghost" size="sm" onClick={() => window.open(material.url, '_blank')}>View</Button>
                                <Button variant="ghost" size="sm" onClick={() => openEditDialog(material)}>Edit</Button>
                                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => openDeleteDialog(material)}>Delete</Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm py-16 px-6 text-center">
                    {/* Icon bubble */}
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 border border-indigo-100 mb-5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500">
                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                            <line x1="10" y1="9" x2="8" y2="9"/>
                        </svg>
                    </div>

                    {/* Text */}
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Materials Yet</h3>
                    <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
                        Add your first video, PDF, or link using the quick-add bar above, or click below to upload any type of material.
                    </p>

                    {/* CTA */}
                    <button
                        type="button"
                        onClick={() => setIsAddModalOpen(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 shadow-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Add Material
                    </button>
                </div>
            )}
            <AddMaterialDialog
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSave={handleAddMaterial}
            />
             {selectedMaterial && (
                <>
                    <EditMaterialDialog
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        onSave={handleUpdateMaterial}
                        material={selectedMaterial}
                    />
                    <DeleteMaterialDialog
                        isOpen={isDeleteModalOpen}
                        onClose={() => setIsDeleteModalOpen(false)}
                        onDelete={handleDeleteMaterial}
                        material={selectedMaterial}
                    />
                </>
            )}
        </div>
    );
};


// --- Material Form Component (reusable for Add/Edit) ---
const MaterialForm: React.FC<{
    material?: CourseMaterial;
    onSave: (material: Omit<CourseMaterial, 'id'> | CourseMaterial) => Promise<void>;
    onClose: () => void;
    isSaving: boolean;
}> = ({ material, onSave, onClose, isSaving }) => {
    const [title, setTitle] = useState(material?.title || '');
    const [type, setType] = useState<CourseMaterial['type']>(material?.type || 'link');
    const [url, setUrl] = useState(material?.url || '');
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUrl(e.target.files[0].name); // Mock file handling
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !url) {
            setError('Please provide a title and a resource URL/file.');
            return;
        }
        setError('');
        const saveData = material ? { ...material, title, type, url } : { title, type, url };
        await onSave(saveData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <Input placeholder="e.g., Chapter 1 Reading" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <Select value={type} onChange={e => { setType(e.target.value as any); setUrl(''); }}>
                    <option value="link">General Link</option>
                    <option value="pdf">PDF Document</option>
                    <option value="video">Video URL</option>
                </Select>
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">
                    {type === 'pdf' ? 'File' : type === 'video' ? 'Video URL' : 'Link URL'}
                </label>
                 {type === 'pdf' ? (
                    <Input type="file" onChange={handleFileChange} required accept=".pdf" />
                ) : (
                    <Input 
                        placeholder={type === 'video' ? "https://youtube.com/..." : "https://example.com"} 
                        value={url} 
                        onChange={e => setUrl(e.target.value)} 
                        required 
                    />
                )}
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
                <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Material'}</Button>
            </div>
        </form>
    );
};


// --- Add/Edit/Delete Material Dialogs ---
interface AddMaterialDialogProps { isOpen: boolean; onClose: () => void; onSave: (material: Omit<CourseMaterial, 'id'>) => Promise<void>; }
const AddMaterialDialog: React.FC<AddMaterialDialogProps> = ({ isOpen, onClose, onSave }) => {
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveWrapper = async (data: Omit<CourseMaterial, 'id'> | CourseMaterial) => {
        setIsSaving(true);
        try {
            await onSave(data as Omit<CourseMaterial, 'id'>);
            onClose();
        } catch (err) {
            console.error(err); // Or set an error state
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Add New Material">
            <MaterialForm onSave={handleSaveWrapper} onClose={onClose} isSaving={isSaving} />
        </Dialog>
    );
};

interface EditMaterialDialogProps { isOpen: boolean; onClose: () => void; onSave: (material: CourseMaterial) => Promise<void>; material: CourseMaterial; }
const EditMaterialDialog: React.FC<EditMaterialDialogProps> = ({ isOpen, onClose, onSave, material }) => {
    const [isSaving, setIsSaving] = useState(false);
    
    const handleSaveWrapper = async (data: Omit<CourseMaterial, 'id'> | CourseMaterial) => {
        setIsSaving(true);
        try {
            await onSave(data as CourseMaterial);
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Edit Material">
            <MaterialForm material={material} onSave={handleSaveWrapper} onClose={onClose} isSaving={isSaving} />
        </Dialog>
    );
};

interface DeleteMaterialDialogProps { isOpen: boolean; onClose: () => void; onDelete: () => Promise<void>; material: CourseMaterial; }
const DeleteMaterialDialog: React.FC<DeleteMaterialDialogProps> = ({ isOpen, onClose, onDelete, material }) => {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await onDelete();
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setIsDeleting(false);
        }
    };
    
    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Delete Material" description={`Are you sure you want to delete "${material.title}"? This cannot be undone.`}>
            <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={onClose} disabled={isDeleting}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>{isDeleting ? 'Deleting...' : 'Delete'}</Button>
            </div>
        </Dialog>
    );
};


const getMaterialIcon = (type: CourseMaterial['type']) => {
    switch(type) {
        case 'link': return <LinkIcon className="w-6 h-6 text-blue-500 shrink-0 mt-1" />;
        case 'pdf': return <FileTextIcon className="w-6 h-6 text-red-500 shrink-0 mt-1" />;
        case 'video': return <VideoIcon className="w-6 h-6 text-purple-500 shrink-0 mt-1" />;
        default: return null;
    }
}

// Icons
const LinkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path>
    </svg>
);
const FileTextIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
);
const VideoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m22 8-6 4 6 4V8Z"></path>
        <rect width="14" height="12" x="2" y="6" rx="2" ry="2"></rect>
    </svg>
);
const GripVerticalIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1" /><circle cx="9" cy="5" r="1" /><circle cx="9" cy="19" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="15" cy="5" r="1" /><circle cx="15" cy="19" r="1" /></svg>
const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;


export default MentorCourseDetail;
