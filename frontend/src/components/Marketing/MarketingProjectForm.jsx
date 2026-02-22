import React, { useState, useEffect } from 'react';
import { MdClose, MdAdd, MdDelete, MdCheckCircle, MdWarning, MdInfo } from 'react-icons/md';
import * as ClientsService from '../../services/ClientsServices';
import * as ToolsService from '../../services/ToolsServices';
import * as SettingsService from '../../services/SettingsServices';
import styles from './MarketingProjectForm.module.css';

const DEFAULT_SERVICES = [
    'Shooting Session',
    'Video Editing',
    'Ads Management',
    'Copywriting',
    'Social Media Management'
];

const MarketingProjectForm = ({ onSubmit, onClose, editData = null }) => {
    const [clients, setClients] = useState([]);
    const [tools, setTools] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);

    const [formData, setFormData] = useState({
        campaignName: '',
        client: '',
        projectDate: new Date().toISOString().split('T')[0],
        services: [],
        totalBudget: 0,
        toolsUsage: [],
        teamAssignment: [],
        revenueDistribution: {
            toolsShare: 50,
            teamShare: 30,
            caisseShare: 20
        }
    });

    const [newService, setNewService] = useState({
        name: '',
        amount: '',
        quantity: ''
    });

    const [customService, setCustomService] = useState('');
    const [showCustomService, setShowCustomService] = useState(false);

    useEffect(() => {
        fetchData();
        if (editData) {
            setFormData({
                campaignName: editData.campaignName || '',
                client: editData.client?._id || editData.client || '',
                projectDate: editData.projectDate
                    ? new Date(editData.projectDate).toISOString().split('T')[0]
                    : new Date().toISOString().split('T')[0],
                services: editData.services || [],
                totalBudget: editData.totalBudget || 0,
                toolsUsage: editData.toolsUsage?.map(t => ({
                    tool: t.tool?._id || t.tool,
                    usagePercentage: t.usagePercentage
                })) || [],
                teamAssignment: editData.teamAssignment?.map(a => ({
                    member: a.member?._id || a.member,
                    contributionPercentage: a.contributionPercentage
                })) || [],
                revenueDistribution: {
                    toolsShare: editData.revenueDistribution?.toolsShare || 50,
                    teamShare: editData.revenueDistribution?.teamShare || 30,
                    caisseShare: editData.revenueDistribution?.caisseShare || 20
                }
            });
        }
    }, [editData]);

    useEffect(() => {
        calculateTotalBudget();
    }, [formData.services]);

    const fetchData = async () => {
        try {
            const [clientsData, toolsData, membersData] = await Promise.all([
                ClientsService.getClients(),
                ToolsService.getTools(),
                SettingsService.getTeamMembers()
            ]);
            setClients(clientsData);
            setTools(toolsData);
            setTeamMembers(membersData);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const calculateTotalBudget = () => {
        const total = formData.services.reduce((sum, service) =>
            sum + (service.amount * service.quantity), 0
        );
        setFormData(prev => ({ ...prev, totalBudget: total }));
    };

    const getTotalToolsPercentage = () => {
        return formData.toolsUsage.reduce((sum, t) => sum + Number(t.usagePercentage || 0), 0);
    };

    const getTotalTeamPercentage = () => {
        return formData.teamAssignment.reduce((sum, t) => sum + Number(t.contributionPercentage || 0), 0);
    };

    const getDistributionTotal = () => {
        return Number(formData.revenueDistribution.toolsShare || 0) +
            Number(formData.revenueDistribution.teamShare || 0) +
            Number(formData.revenueDistribution.caisseShare || 0);
    };

    const handleDistributionChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            revenueDistribution: {
                ...prev.revenueDistribution,
                [field]: Number(value)
            }
        }));
    };

    const handleAddService = () => {
        if (newService.name && newService.amount && newService.quantity) {
            const serviceToAdd = {
                name: newService.name,
                amount: Number(newService.amount),
                quantity: Number(newService.quantity),
                total: Number(newService.amount) * Number(newService.quantity)
            };
            setFormData(prev => ({
                ...prev,
                services: [...prev.services, serviceToAdd]
            }));
            setNewService({ name: '', amount: '', quantity: '' });
            setShowCustomService(false);
            setCustomService('');
        }
    };

    const handleRemoveService = (index) => {
        setFormData(prev => ({
            ...prev,
            services: prev.services.filter((_, i) => i !== index)
        }));
    };

    const handleAddTool = () => {
        setFormData(prev => ({
            ...prev,
            toolsUsage: [...prev.toolsUsage, { tool: '', usagePercentage: '' }]
        }));
    };

    const handleToolChange = (index, field, value) => {
        const updated = [...formData.toolsUsage];
        updated[index][field] = value;
        setFormData(prev => ({ ...prev, toolsUsage: updated }));
    };

    const handleRemoveTool = (index) => {
        setFormData(prev => ({
            ...prev,
            toolsUsage: prev.toolsUsage.filter((_, i) => i !== index)
        }));
    };

    const handleAddTeamMember = () => {
        setFormData(prev => ({
            ...prev,
            teamAssignment: [...prev.teamAssignment, { member: '', contributionPercentage: '' }]
        }));
    };

    const handleTeamMemberChange = (index, field, value) => {
        const updated = [...formData.teamAssignment];
        updated[index][field] = value;
        setFormData(prev => ({ ...prev, teamAssignment: updated }));
    };

    const handleRemoveTeamMember = (index) => {
        setFormData(prev => ({
            ...prev,
            teamAssignment: prev.teamAssignment.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate distribution total
        const distributionTotal = getDistributionTotal();
        if (distributionTotal !== 100) {
            alert('Revenue distribution percentages must total exactly 100%');
            return;
        }

        // Validate services
        if (formData.services.length === 0) {
            alert('Please add at least one service');
            return;
        }

        // Validate tools
        if (formData.toolsUsage.length === 0) {
            alert('Please add at least one tool');
            return;
        }

        const totalToolUsage = getTotalToolsPercentage();
        if (totalToolUsage !== 100) {
            alert('Total tool usage percentage must equal exactly 100%');
            return;
        }

        // Validate team
        if (formData.teamAssignment.length === 0) {
            alert('Please add at least one team member');
            return;
        }

        const totalTeamContribution = getTotalTeamPercentage();
        if (totalTeamContribution !== 100) {
            alert('Total team contribution percentage must equal exactly 100%');
            return;
        }

        onSubmit(formData);
    };

    const toolsTotal = getTotalToolsPercentage();
    const teamTotal = getTotalTeamPercentage();
    const distributionTotal = getDistributionTotal();
    const isToolsValid = toolsTotal === 100;
    const isTeamValid = teamTotal === 100;
    const isDistributionValid = distributionTotal === 100;
    const isFormValid = formData.services.length > 0 &&
        formData.toolsUsage.length > 0 &&
        formData.teamAssignment.length > 0 &&
        isToolsValid &&
        isTeamValid &&
        isDistributionValid;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <div className={styles.headerContent}>
                        <h2>{editData ? 'Edit Marketing Campaign' : 'Create Marketing Campaign'}</h2>
                        <p>{editData ? 'Update campaign details and resources' : 'Fill in the campaign details and assign resources'}</p>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <MdClose />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {/* Basic Information */}
                    <div className={styles.basicInfo}>
                        <div className={styles.row}>
                            <div className={styles.formGroup}>
                                <label>Campaign Name *</label>
                                <input
                                    type="text"
                                    value={formData.campaignName}
                                    onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
                                    placeholder="Enter campaign name"
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Project Date *</label>
                                <input
                                    type="date"
                                    value={formData.projectDate}
                                    onChange={(e) => setFormData({ ...formData, projectDate: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Client *</label>
                            <select
                                value={formData.client}
                                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                                required
                            >
                                <option value="">Select a client</option>
                                {clients.map(client => (
                                    <option key={client._id} value={client._id}>
                                        {client.businessName} - {client.ownerName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Revenue Distribution */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h3>Revenue Distribution</h3>
                            <div className={`${styles.percentageBadge} ${!isDistributionValid ? styles.invalid : styles.valid}`}>
                                {distributionTotal}% / 100%
                                {isDistributionValid ? <MdCheckCircle /> : <MdWarning />}
                            </div>
                        </div>

                        <div className={styles.cardBody}>
                            <div className={styles.infoBox}>
                                <MdInfo />
                                <span>Customize how the project revenue will be distributed</span>
                            </div>

                            <div className={styles.distributionInputs}>
                                <div className={styles.distributionField}>
                                    <label>Tools & Charges</label>
                                    <div className={styles.percentageInputLarge}>
                                        <input
                                            type="number"
                                            value={formData.revenueDistribution.toolsShare}
                                            onChange={(e) => handleDistributionChange('toolsShare', e.target.value)}
                                            min="0"
                                            max="100"
                                            required
                                        />
                                        <span className={styles.percentSymbol}>%</span>
                                    </div>
                                    <p className={styles.fieldDescription}>Split between tools based on usage</p>
                                </div>

                                <div className={styles.distributionField}>
                                    <label>Team Share</label>
                                    <div className={styles.percentageInputLarge}>
                                        <input
                                            type="number"
                                            value={formData.revenueDistribution.teamShare}
                                            onChange={(e) => handleDistributionChange('teamShare', e.target.value)}
                                            min="0"
                                            max="100"
                                            required
                                        />
                                        <span className={styles.percentSymbol}>%</span>
                                    </div>
                                    <p className={styles.fieldDescription}>Split between team members</p>
                                </div>

                                <div className={styles.distributionField}>
                                    <label>Redix Caisse</label>
                                    <div className={styles.percentageInputLarge}>
                                        <input
                                            type="number"
                                            value={formData.revenueDistribution.caisseShare}
                                            onChange={(e) => handleDistributionChange('caisseShare', e.target.value)}
                                            min="0"
                                            max="100"
                                            required
                                        />
                                        <span className={styles.percentSymbol}>%</span>
                                    </div>
                                    <p className={styles.fieldDescription}>Reserved for daily operations</p>
                                </div>
                            </div>

                            {!isDistributionValid && (
                                <div className={styles.warningBox}>
                                    <MdWarning />
                                    <span>Total must equal 100%. Current: {distributionTotal}%</span>
                                </div>
                            )}

                            {formData.totalBudget > 0 && (
                                <div className={styles.previewDistribution}>
                                    <h4>Preview (Based on {formData.totalBudget.toFixed(2)} TND)</h4>
                                    <div className={styles.previewGrid}>
                                        <div className={styles.previewItem}>
                                            <span className={styles.previewLabel}>Tools & Charges</span>
                                            <span className={styles.previewValue}>
                                                {((formData.totalBudget * formData.revenueDistribution.toolsShare) / 100).toFixed(2)} TND
                                            </span>
                                        </div>
                                        <div className={styles.previewItem}>
                                            <span className={styles.previewLabel}>Team Share</span>
                                            <span className={styles.previewValue}>
                                                {((formData.totalBudget * formData.revenueDistribution.teamShare) / 100).toFixed(2)} TND
                                            </span>
                                        </div>
                                        <div className={styles.previewItem}>
                                            <span className={styles.previewLabel}>Redix Caisse</span>
                                            <span className={styles.previewValue}>
                                                {((formData.totalBudget * formData.revenueDistribution.caisseShare) / 100).toFixed(2)} TND
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Services Section */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h3>Services *</h3>
                            <span className={styles.badge}>{formData.services.length} services</span>
                        </div>

                        <div className={styles.cardBody}>
                            <div className={styles.serviceInputGrid}>
                                <select
                                    className={styles.serviceSelect}
                                    value={newService.name}
                                    onChange={(e) => {
                                        if (e.target.value === 'custom') {
                                            setShowCustomService(true);
                                            setNewService({ ...newService, name: '' });
                                        } else {
                                            setNewService({ ...newService, name: e.target.value });
                                            setShowCustomService(false);
                                        }
                                    }}
                                >
                                    <option value="">Select service type</option>
                                    {DEFAULT_SERVICES.map(service => (
                                        <option key={service} value={service}>{service}</option>
                                    ))}
                                    <option value="custom">+ Custom Service</option>
                                </select>

                                {showCustomService && (
                                    <input
                                        type="text"
                                        placeholder="Enter custom service name"
                                        value={customService}
                                        onChange={(e) => {
                                            setCustomService(e.target.value);
                                            setNewService({ ...newService, name: e.target.value });
                                        }}
                                        className={styles.customInput}
                                    />
                                )}

                                <input
                                    type="number"
                                    placeholder="Price"
                                    value={newService.amount}
                                    onChange={(e) => setNewService({ ...newService, amount: e.target.value })}
                                    min="0"
                                    step="0.01"
                                />

                                <input
                                    type="number"
                                    placeholder="Quantity"
                                    value={newService.quantity}
                                    onChange={(e) => setNewService({ ...newService, quantity: e.target.value })}
                                    min="1"
                                />

                                <button
                                    type="button"
                                    onClick={handleAddService}
                                    className={styles.iconBtn}
                                    disabled={!newService.name || !newService.amount || !newService.quantity}
                                >
                                    <MdAdd />
                                </button>
                            </div>

                            {formData.services.length > 0 && (
                                <div className={styles.servicesList}>
                                    {formData.services.map((service, index) => (
                                        <div key={index} className={styles.serviceItem}>
                                            <div className={styles.serviceContent}>
                                                <span className={styles.serviceName}>{service.name}</span>
                                                <div className={styles.serviceCalc}>
                                                    <span className={styles.calcDetail}>
                                                        {service.amount} TND × {service.quantity}
                                                    </span>
                                                    <span className={styles.calcTotal}>
                                                        = {service.total.toFixed(2)} TND
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveService(index)}
                                                className={styles.deleteIconBtn}
                                            >
                                                <MdDelete />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className={styles.totalBar}>
                                <span>Total Budget</span>
                                <span className={styles.totalAmount}>{formData.totalBudget.toFixed(2)} TND</span>
                            </div>
                        </div>
                    </div>

                    {/* Tools Usage Section */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h3>Tools Usage *</h3>
                            <div className={`${styles.percentageBadge} ${!isToolsValid ? styles.invalid : styles.valid}`}>
                                {toolsTotal}% / 100%
                                {isToolsValid ? <MdCheckCircle /> : <MdWarning />}
                            </div>
                        </div>

                        <div className={styles.cardBody}>
                            <button
                                type="button"
                                onClick={handleAddTool}
                                className={styles.addRowBtn}
                            >
                                <MdAdd /> Add Tool
                            </button>

                            {formData.toolsUsage.length > 0 && (
                                <div className={styles.assignmentList}>
                                    {formData.toolsUsage.map((toolUsage, index) => (
                                        <div key={index} className={styles.assignmentRow}>
                                            <select
                                                value={toolUsage.tool}
                                                onChange={(e) => handleToolChange(index, 'tool', e.target.value)}
                                                className={styles.selectFlex}
                                                required
                                            >
                                                <option value="">Select tool</option>
                                                {tools.map(tool => (
                                                    <option key={tool._id} value={tool._id}>
                                                        {tool.name} ({tool.category})
                                                    </option>
                                                ))}
                                            </select>

                                            <div className={styles.percentageInput}>
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    value={toolUsage.usagePercentage}
                                                    onChange={(e) => handleToolChange(index, 'usagePercentage', e.target.value)}
                                                    min="0"
                                                    max="100"
                                                    required
                                                />
                                                <span className={styles.percentSymbol}>%</span>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleRemoveTool(index)}
                                                className={styles.deleteIconBtn}
                                            >
                                                <MdDelete />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {formData.toolsUsage.length > 0 && (
                                <div className={`${styles.progressBar} ${!isToolsValid ? styles.invalid : ''}`}>
                                    <div
                                        className={styles.progressFill}
                                        style={{ width: `${Math.min(toolsTotal, 100)}%` }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Team Assignment Section */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h3>Team Assignment *</h3>
                            <div className={`${styles.percentageBadge} ${!isTeamValid ? styles.invalid : styles.valid}`}>
                                {teamTotal}% / 100%
                                {isTeamValid ? <MdCheckCircle /> : <MdWarning />}
                            </div>
                        </div>

                        <div className={styles.cardBody}>
                            <button
                                type="button"
                                onClick={handleAddTeamMember}
                                className={styles.addRowBtn}
                            >
                                <MdAdd /> Add Team Member
                            </button>

                            {formData.teamAssignment.length > 0 && (
                                <div className={styles.assignmentList}>
                                    {formData.teamAssignment.map((assignment, index) => (
                                        <div key={index} className={styles.assignmentRow}>
                                            <select
                                                value={assignment.member}
                                                onChange={(e) => handleTeamMemberChange(index, 'member', e.target.value)}
                                                className={styles.selectFlex}
                                                required
                                            >
                                                <option value="">Select team member</option>
                                                {teamMembers.map(member => (
                                                    <option key={member._id} value={member._id}>
                                                        {member.name} ({member.role})
                                                    </option>
                                                ))}
                                            </select>

                                            <div className={styles.percentageInput}>
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    value={assignment.contributionPercentage}
                                                    onChange={(e) => handleTeamMemberChange(index, 'contributionPercentage', e.target.value)}
                                                    min="0"
                                                    max="100"
                                                    required
                                                />
                                                <span className={styles.percentSymbol}>%</span>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleRemoveTeamMember(index)}
                                                className={styles.deleteIconBtn}
                                            >
                                                <MdDelete />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {formData.teamAssignment.length > 0 && (
                                <div className={`${styles.progressBar} ${!isTeamValid ? styles.invalid : ''}`}>
                                    <div
                                        className={styles.progressFill}
                                        style={{ width: `${Math.min(teamTotal, 100)}%` }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className={styles.formActions}>
                        <button type="button" className={styles.cancelBtn} onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={!isFormValid}
                        >
                            {editData ? 'Update Campaign' : 'Create Campaign'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MarketingProjectForm;
