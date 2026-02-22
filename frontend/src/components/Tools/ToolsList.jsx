import React, { useState, useEffect } from 'react';
import { MdAdd, MdEdit, MdDelete, MdSearch, MdFilterList, MdViewModule, MdViewList } from 'react-icons/md';
import ToolForm from './ToolForm';
import * as ToolsService from '../../services/ToolsServices';
import styles from './ToolsList.module.css';

const ToolsList = () => {
    const [tools, setTools] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingTool, setEditingTool] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [viewMode, setViewMode] = useState('table');

    useEffect(() => {
        fetchTools();
    }, []);

    const fetchTools = async () => {
        try {
            const data = await ToolsService.getTools();
            setTools(data);
        } catch (error) {
            console.error('Error fetching tools:', error);
        }
    };

    const handleAddTool = async (toolData) => {
        try {
            await ToolsService.createTool(toolData);
            fetchTools();
            setShowForm(false);
        } catch (error) {
            console.error('Error creating tool:', error);
        }
    };

    const handleUpdateTool = async (toolData) => {
        try {
            await ToolsService.updateTool(editingTool._id, toolData);
            fetchTools();
            setEditingTool(null);
            setShowForm(false);
        } catch (error) {
            console.error('Error updating tool:', error);
        }
    };

    const handleDeleteTool = async (toolId) => {
        if (window.confirm('Are you sure you want to delete this tool?')) {
            try {
                await ToolsService.deleteTool(toolId);
                fetchTools();
            } catch (error) {
                console.error('Error deleting tool:', error);
            }
        }
    };

    const handleEditClick = (tool) => {
        setEditingTool(tool);
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingTool(null);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return styles.statusActive;
            case 'maintenance': return styles.statusMaintenance;
            case 'retired': return styles.statusRetired;
            default: return '';
        }
    };

    // Get unique categories
    const categories = [...new Set(tools.map(t => t.category).filter(Boolean))];

    // Filter tools
    const filteredTools = tools.filter(tool => {
        const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (tool.category || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = !categoryFilter || tool.category === categoryFilter;
        const matchesStatus = !statusFilter || tool.status === statusFilter;
        return matchesSearch && matchesCategory && matchesStatus;
    });

    // Summary stats
    const totalValue = tools.reduce((sum, t) => sum + (t.purchasePrice || 0), 0);
    const totalRevenue = tools.reduce((sum, t) => sum + (t.revenueCounter || 0), 0);
    const activeCount = tools.filter(t => t.status === 'active').length;
    const totalReserved = totalValue - totalRevenue;

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.title}>Tools Management</h1>
                <div className={styles.headerRight}>
                    <div className={styles.viewToggle}>
                        <button
                            className={`${styles.viewBtn} ${viewMode === 'cards' ? styles.viewBtnActive : ''}`}
                            onClick={() => setViewMode('cards')}
                            title="Card View"
                        >
                            <MdViewModule />
                        </button>
                        <button
                            className={`${styles.viewBtn} ${viewMode === 'table' ? styles.viewBtnActive : ''}`}
                            onClick={() => setViewMode('table')}
                            title="Table View"
                        >
                            <MdViewList />
                        </button>
                    </div>
                    <button className={styles.addBtn} onClick={() => setShowForm(true)}>
                        <MdAdd /> Add Tool
                    </button>
                </div>
            </div>

            {/* Summary */}
            <div className={styles.summaryRow}>
                <div className={styles.stat}>
                    <span className={styles.statNum}>{tools.length}</span>
                    <span className={styles.statLabel}>Total Tools</span>
                </div>
                <div className={styles.stat}>
                    <span className={styles.statNum}>{activeCount}</span>
                    <span className={styles.statLabel}>Active</span>
                </div>
                <div className={styles.stat}>
                    <span className={styles.statNum}>{totalValue.toLocaleString()} TND</span>
                    <span className={styles.statLabel}>Total Tools Price</span>
                </div>
                <div className={styles.stat}>
                    <span className={styles.statNum}>{totalRevenue.toLocaleString()} TND</span>
                    <span className={styles.statLabel}>Revenue Generated</span>
                </div>
                <div className={styles.stat}>
                    <span className={styles.statNum}>{Math.max(0, totalReserved).toLocaleString()} TND</span>
                    <span className={styles.statLabel}>Money Reserved</span>
                </div>
            </div>

            {/* Search & Filters */}
            <div className={styles.filters}>
                <div className={styles.searchBox}>
                    <MdSearch />
                    <input type="text" placeholder="Search tools..."
                        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <div className={styles.filterGroup}>
                    <MdFilterList />
                    <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                        <option value="">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
                <div className={styles.filterGroup}>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="retired">Retired</option>
                    </select>
                </div>
            </div>

            {showForm && (
                <ToolForm
                    onSubmit={editingTool ? handleUpdateTool : handleAddTool}
                    onClose={handleCloseForm}
                    editData={editingTool}
                />
            )}

            <div className={styles.toolsList}>
                {filteredTools.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>{searchQuery || categoryFilter || statusFilter ? 'No tools match your filters' : 'No tools yet. Add your first tool!'}</p>
                    </div>
                ) : viewMode === 'table' ? (
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Status</th>
                                    <th>Category</th>
                                    <th>Purchase Price</th>
                                    <th>Revenue Generated</th>
                                    <th>Payoff %</th>
                                    <th>Usage</th>
                                    <th>Last Used</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTools.map((tool) => (
                                    <tr key={tool._id} className={styles.tableRow}>
                                        <td className={styles.toolName}>{tool.name}</td>
                                        <td>
                                            <span className={`${styles.status} ${getStatusColor(tool.status)}`}>
                                                {tool.status}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={styles.categoryBadge}>{tool.category || '—'}</span>
                                        </td>
                                        <td>{tool.purchasePrice?.toFixed(2)} TND</td>
                                        <td>{tool.revenueCounter?.toFixed(2)} TND</td>
                                        <td>
                                            <div className={styles.payoffCell}>
                                                <div className={styles.miniBar}>
                                                    <div
                                                        className={styles.miniBarFill}
                                                        style={{ width: `${Math.min(tool.payoffPercentage || 0, 100)}%` }}
                                                    />
                                                </div>
                                                <span>{tool.payoffPercentage?.toFixed(0)}%</span>
                                            </div>
                                        </td>
                                        <td>{tool.usageCount || 0}</td>
                                        <td>{tool.lastUsed ? new Date(tool.lastUsed).toLocaleDateString() : 'Never'}</td>
                                        <td>
                                            <div className={styles.tableActions}>
                                                <button onClick={() => handleEditClick(tool)} className={styles.editBtn}>
                                                    <MdEdit />
                                                </button>
                                                <button onClick={() => handleDeleteTool(tool._id)} className={styles.deleteBtn}>
                                                    <MdDelete />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className={styles.toolsGrid}>
                        {filteredTools.map((tool) => (
                        <div key={tool._id} className={styles.toolCard}>
                            <div className={styles.cardHeader}>
                                <div>
                                    <h3>{tool.name}</h3>
                                    <span className={`${styles.status} ${getStatusColor(tool.status)}`}>
                                        {tool.status}
                                    </span>
                                </div>
                                <div className={styles.actions}>
                                    <button onClick={() => handleEditClick(tool)} className={styles.editBtn}>
                                        <MdEdit />
                                    </button>
                                    <button onClick={() => handleDeleteTool(tool._id)} className={styles.deleteBtn}>
                                        <MdDelete />
                                    </button>
                                </div>
                            </div>

                            <div className={styles.cardBody}>
                                <div className={styles.infoRow}>
                                    <span className={styles.label}>Category:</span>
                                    <span className={styles.categoryBadge}>{tool.category}</span>
                                </div>

                                <div className={styles.infoRow}>
                                    <span className={styles.label}>Purchase Price:</span>
                                    <span className={styles.value}>{tool.purchasePrice?.toFixed(2)} TND</span>
                                </div>

                                <div className={styles.infoRow}>
                                    <span className={styles.label}>Revenue Generated:</span>
                                    <span className={styles.valueHighlight}>
                                        {tool.revenueCounter?.toFixed(2)} TND
                                    </span>
                                </div>

                                <div className={styles.progressSection}>
                                    <div className={styles.progressHeader}>
                                        <span className={styles.label}>Payoff Progress:</span>
                                        <span className={styles.percentage}>{tool.payoffPercentage?.toFixed(0)}%</span>
                                    </div>
                                    <div className={styles.progressBar}>
                                        <div
                                            className={styles.progressFill}
                                            style={{ width: `${Math.min(tool.payoffPercentage || 0, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                <div className={styles.statsGrid}>
                                    <div className={styles.statItem}>
                                        <span className={styles.statItemLabel}>Usage Count</span>
                                        <span className={styles.statItemValue}>{tool.usageCount || 0}</span>
                                    </div>
                                    <div className={styles.statItem}>
                                        <span className={styles.statItemLabel}>Last Used</span>
                                        <span className={styles.statItemValue}>
                                            {tool.lastUsed ? new Date(tool.lastUsed).toLocaleDateString() : 'Never'}
                                        </span>
                                    </div>
                                </div>

                                {tool.subTools && tool.subTools.length > 0 && (
                                    <div className={styles.subToolsSection}>
                                        <h4>Sub-Tools ({tool.subTools.length})</h4>
                                        <div className={styles.subToolsList}>
                                            {tool.subTools.map((subTool, idx) => (
                                                <div key={idx} className={styles.subToolItem}>
                                                    <span className={styles.subToolName}>{subTool.name}</span>
                                                    <span className={styles.subToolPrice}>
                                                        {subTool.purchasePrice} TND {subTool.quantity > 1 ? `× ${subTool.quantity}` : ''}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ToolsList;
