import React, { useState, useEffect } from 'react';
import { MdSearch, MdAdd, MdExpandMore, MdExpandLess, MdEdit, MdDelete } from 'react-icons/md';
import MarketingProjectForm from './MarketingProjectForm';
import * as MarketingService from '../../services/MarketingServices';
import styles from './MarketingProjectsList.module.css';

const MarketingProjectsList = () => {
    const [projects, setProjects] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [expandedProject, setExpandedProject] = useState(null);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const data = await MarketingService.getMarketingProjects();
            setProjects(data || []);
        } catch (error) {
            console.error('Error fetching projects:', error);
            setProjects([]);
        }
    };

    const handleAddProject = async (projectData) => {
        try {
            await MarketingService.createMarketingProject(projectData);
            fetchProjects();
            setShowForm(false);
        } catch (error) {
            console.error('Error creating project:', error);
            alert('Failed to create project. Please try again.');
        }
    };

    const handleUpdateProject = async (projectData) => {
        try {
            await MarketingService.updateMarketingProject(editingProject._id, projectData);
            fetchProjects();
            setEditingProject(null);
            setShowForm(false);
        } catch (error) {
            console.error('Error updating project:', error);
            alert('Failed to update project. Please try again.');
        }
    };

    const handleDeleteProject = async (projectId) => {
        if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            try {
                await MarketingService.deleteMarketingProject(projectId);
                fetchProjects();
            } catch (error) {
                console.error('Error deleting project:', error);
                alert('Failed to delete project. Please try again.');
            }
        }
    };

    const handleEditClick = (project) => {
        setEditingProject(project);
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingProject(null);
    };

    const filteredProjects = projects.filter((project) =>
        project.campaignName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleExpand = (projectId) => {
        setExpandedProject(expandedProject === projectId ? null : projectId);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.searchBar}>
                    <MdSearch className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search marketing projects..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
                <button className={styles.addBtn} onClick={() => setShowForm(true)}>
                    <MdAdd /> Add Project
                </button>
            </div>

            {showForm && (
                <MarketingProjectForm
                    onSubmit={editingProject ? handleUpdateProject : handleAddProject}
                    onClose={handleCloseForm}
                    editData={editingProject}
                />
            )}

            <div className={styles.projectsList}>
                {filteredProjects.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>No marketing projects found. Create your first project!</p>
                    </div>
                ) : (
                    filteredProjects.map((project) => (
                        <div key={project._id} className={styles.projectCard}>
                            <div className={styles.cardHeader} onClick={() => toggleExpand(project._id)}>
                                <div className={styles.headerLeft}>
                                    <h3>{project.campaignName}</h3>
                                    <p className={styles.clientName}>
                                        Client: {project.client?.businessName || 'N/A'}
                                    </p>
                                </div>
                                <div className={styles.cardHeaderRight}>
                                    <span className={styles.budget}>
                                        {project.totalBudget?.toLocaleString()} TND
                                    </span>
                                    <div className={styles.actionButtons}>
                                        <button
                                            className={styles.editBtn}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditClick(project);
                                            }}
                                            title="Edit project"
                                        >
                                            <MdEdit />
                                        </button>
                                        <button
                                            className={styles.deleteBtn}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteProject(project._id);
                                            }}
                                            title="Delete project"
                                        >
                                            <MdDelete />
                                        </button>
                                    </div>
                                    <button className={styles.expandBtn}>
                                        {expandedProject === project._id ? <MdExpandLess /> : <MdExpandMore />}
                                    </button>
                                </div>
                            </div>

                            {expandedProject === project._id && (
                                <div className={styles.cardDetails}>
                                    {/* Revenue Distribution */}
                                    <div className={styles.detailSection}>
                                        <h4>Revenue Distribution</h4>
                                        <div className={styles.distributionGrid}>
                                            <div className={styles.distributionItem}>
                                                <span className={styles.label}>
                                                    Tools Share ({project.revenueDistribution?.toolsShare || 50}%)
                                                </span>
                                                <span className={styles.value}>
                                                    {(project.revenueDistribution?.toolsAmount || 0).toFixed(2)} TND
                                                </span>
                                            </div>
                                            <div className={styles.distributionItem}>
                                                <span className={styles.label}>
                                                    Team Share ({project.revenueDistribution?.teamShare || 30}%)
                                                </span>
                                                <span className={styles.value}>
                                                    {(project.revenueDistribution?.teamAmount || 0).toFixed(2)} TND
                                                </span>
                                            </div>
                                            <div className={styles.distributionItem}>
                                                <span className={styles.label}>
                                                    Redix Caisse ({project.revenueDistribution?.caisseShare || 20}%)
                                                </span>
                                                <span className={styles.value}>
                                                    {(project.revenueDistribution?.caisseAmount || 0).toFixed(2)} TND
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Services */}
                                    <div className={styles.detailSection}>
                                        <h4>Services</h4>
                                        <div className={styles.servicesList}>
                                            {project.services?.map((service, idx) => (
                                                <div key={idx} className={styles.serviceItem}>
                                                    <span className={styles.serviceName}>{service.name}</span>
                                                    <span className={styles.serviceDetails}>
                                                        {service.amount} TND × {service.quantity} = {service.total} TND
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Tools Usage */}
                                    {project.toolsUsage?.length > 0 && (
                                        <div className={styles.detailSection}>
                                            <h4>Tools Usage & Revenue</h4>
                                            <div className={styles.usageList}>
                                                {project.toolsUsage.map((tool, idx) => (
                                                    <div key={idx} className={styles.usageItem}>
                                                        <div className={styles.usageInfo}>
                                                            <span className={styles.toolName}>
                                                                {tool.tool?.name || 'Unknown Tool'}
                                                            </span>
                                                            <span className={styles.toolCategory}>
                                                                {tool.tool?.category}
                                                            </span>
                                                        </div>
                                                        <div className={styles.usageStats}>
                                                            <span className={styles.percentage}>
                                                                {tool.usagePercentage}%
                                                            </span>
                                                            <span className={styles.revenue}>
                                                                {(tool.allocatedRevenue || 0).toFixed(2)} TND
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Team Assignment */}
                                    {project.teamAssignment?.length > 0 && (
                                        <div className={styles.detailSection}>
                                            <h4>Team Assignment & Revenue</h4>
                                            <div className={styles.usageList}>
                                                {project.teamAssignment.map((assignment, idx) => (
                                                    <div key={idx} className={styles.usageItem}>
                                                        <div className={styles.usageInfo}>
                                                            <span className={styles.toolName}>
                                                                {assignment.member?.name || 'Unknown Member'}
                                                            </span>
                                                            <span className={styles.toolCategory}>
                                                                {assignment.member?.role}
                                                            </span>
                                                        </div>
                                                        <div className={styles.usageStats}>
                                                            <span className={styles.percentage}>
                                                                {assignment.contributionPercentage}%
                                                            </span>
                                                            <span className={styles.revenue}>
                                                                {(assignment.allocatedRevenue || 0).toFixed(2)} TND
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default MarketingProjectsList;
