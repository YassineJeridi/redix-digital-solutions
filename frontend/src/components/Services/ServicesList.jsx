import React, { useState, useEffect } from 'react';
import { 
    MdAdd, MdEdit, MdDelete, MdSearch, MdFileDownload, 
    MdFilterList, MdSort, MdChevronLeft, MdChevronRight, MdPayment,
    MdReceiptLong,
} from 'react-icons/md';
import ServiceForm from './ServiceForm';
import DeleteConfirmModal from './DeleteConfirmModal';
import InvoiceForm from '../Invoices/InvoiceForm';
import * as ServicesService from '../../services/ServicesServices';
import * as ClientsService from '../../services/ClientsServices';
import styles from './ServicesList.module.css';

const ServicesList = () => {
    const [services, setServices] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
    const [loading, setLoading] = useState(false);
    
    // Filters and search
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('');
    const [serviceStatus, setServiceStatus] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [clientFilter, setClientFilter] = useState('');
    const [clients, setClients] = useState([]);
    
    // UI state
    const [showForm, setShowForm] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [deletingService, setDeletingService] = useState(null);
    const [userRole, setUserRole] = useState('Admin'); // TODO: Get from context/auth

    useEffect(() => {
        fetchServices();
    }, [pagination.page, category, paymentStatus, serviceStatus, sortBy, sortOrder, clientFilter]);

    useEffect(() => {
        ClientsService.getClients().then(setClients).catch(() => {});
    }, []);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (pagination.page === 1) {
                fetchServices();
            } else {
                setPagination(prev => ({ ...prev, page: 1 }));
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchServices = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                search,
                category,
                paymentStatus,
                serviceStatus,
                sortBy,
                sortOrder,
                clientId: clientFilter
            };
            const data = await ServicesService.getServices(params);
            setServices(data.services || []);
            setPagination(data.pagination || { page: 1, limit: 10, total: 0, pages: 0 });
        } catch (error) {
            console.error('Error fetching services:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddService = async (serviceData) => {
        try {
            await ServicesService.createService(serviceData);
            fetchServices();
            setShowForm(false);
        } catch (error) {
            console.error('Error creating service:', error);
            alert(error.response?.data?.message || 'Error creating service');
        }
    };

    const handleUpdateService = async (serviceData) => {
        try {
            await ServicesService.updateService(editingService._id, serviceData);
            fetchServices();
            setEditingService(null);
            setShowForm(false);
        } catch (error) {
            console.error('Error updating service:', error);
            alert(error.response?.data?.message || 'Error updating service');
        }
    };

    const handleDelete = async (confirmName) => {
        try {
            await ServicesService.deleteService(deletingService._id, confirmName);
            fetchServices();
            setDeletingService(null);
        } catch (error) {
            console.error('Error deleting service:', error);
            throw error;
        }
    };

    const handleEditClick = (service) => {
        setEditingService(service);
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingService(null);
    };

    const handleExportCSV = async () => {
        try {
            await ServicesService.exportToCSV({ category, paymentStatus, serviceStatus });
        } catch (error) {
            console.error('Error exporting CSV:', error);
        }
    };

    const handleExportPDF = async () => {
        try {
            await ServicesService.exportToPDF({ category, paymentStatus, serviceStatus });
        } catch (error) {
            console.error('Error exporting PDF:', error);
        }
    };

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    const getPaymentStatusClass = (status) => {
        switch (status) {
            case 'Done': return styles.statusDone;
            default: return styles.statusPending;
        }
    };

    const getserviceStatusClass = (status) => {
        switch (status) {
            case 'Completed': return styles.statusCompleted;
            case 'In Progress': return styles.statusInProgress;
            case 'Not Started': return styles.statusNotStarted;
            default: return '';
        }
    };

    const canDelete = userRole === 'Admin';
    const canCreateEdit = ['Admin', 'Manager'].includes(userRole);

    const [partialPaymentService, setPartialPaymentService] = useState(null);
    const [partialPaymentAmount, setPartialPaymentAmount] = useState('');

    // Invoice generation
    const [invoicePrefill, setInvoicePrefill] = useState(null);

    const handleGenerateInvoice = (service) => {
        const remaining = service.totalPrice - (service.amountPaid || 0);
        setInvoicePrefill({
            client:        service.client?._id || service.client,
            category:      service.serviceProvided,
            dueDate:       service.endDate,
            notes:         `Service: ${service.projectName}`,
            paymentMethod: 'Bank Transfer',
            lineItems: [{
                _id:         Date.now(),
                description: service.projectName,
                quantity:    1,
                unitPrice:   remaining > 0 ? remaining : service.totalPrice,
                total:       remaining > 0 ? remaining : service.totalPrice,
            }],
        });
    };

    const handleInlinePaymentStatus = async (e, service) => {
        e.stopPropagation();
        const newStatus = e.target.value;
        if (newStatus === service.paymentStatus) return;

        try {
            await ServicesService.updateServiceStatus(service._id, { paymentStatus: newStatus });
            fetchServices();
        } catch (error) {
            console.error('Error updating payment status:', error);
        }
    };

    const handleInlineserviceStatus = async (e, service) => {
        e.stopPropagation();
        const newStatus = e.target.value;
        if (newStatus === service.projectStatus) return;
        try {
            await ServicesService.updateServiceStatus(service._id, { projectStatus: newStatus });
            fetchServices();
        } catch (error) {
            console.error('Error updating service status:', error);
        }
    };

    const handlePartialPayment = async () => {
        if (!partialPaymentService || !partialPaymentAmount || parseFloat(partialPaymentAmount) <= 0) return;
        try {
            await ServicesService.recordPartialPayment(partialPaymentService._id, parseFloat(partialPaymentAmount));
            fetchServices();
            setPartialPaymentService(null);
            setPartialPaymentAmount('');
        } catch (error) {
            console.error('Error recording partial payment:', error);
        }
    };

    return (
        <div className={styles.container}>
            {/* Header with Actions */}
            <div className={styles.header}>
                <div className={styles.searchBar}>
                    <MdSearch className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search by service name or client..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
                <div className={styles.headerActions}>
                    <button className={styles.exportBtn} onClick={handleExportCSV} title="Export CSV">
                        <MdFileDownload /> CSV
                    </button>
                    <button className={styles.exportBtn} onClick={handleExportPDF} title="Export PDF">
                        <MdFileDownload /> PDF
                    </button>
                    {canCreateEdit && (
                        <button className={styles.addBtn} onClick={() => setShowForm(true)}>
                            <MdAdd /> Add service
                        </button>
                    )}
                </div>
            </div>

            {/* Category Filter Tabs */}
            <div className={styles.categoryTabs}>
                <button 
                    className={`${styles.tab} ${category === '' ? styles.activeTab : ''}`}
                    onClick={() => setCategory('')}
                >
                    All services
                </button>
                <button 
                    className={`${styles.tab} ${category === 'Marketing' ? styles.activeTab : ''}`}
                    onClick={() => setCategory('Marketing')}
                >
                    Marketing
                </button>
                <button 
                    className={`${styles.tab} ${category === 'Production' ? styles.activeTab : ''}`}
                    onClick={() => setCategory('Production')}
                >
                    Production
                </button>
                <button 
                    className={`${styles.tab} ${category === 'Development' ? styles.activeTab : ''}`}
                    onClick={() => setCategory('Development')}
                >
                    Development
                </button>
            </div>

            {/* Additional Filters */}
            <div className={styles.filters}>
                <div className={styles.filterGroup}>
                    <label><MdFilterList /> Client:</label>
                    <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}>
                        <option value="">All Clients</option>
                        {clients.map(c => (
                            <option key={c._id} value={c._id}>{c.businessName}</option>
                        ))}
                    </select>
                </div>
                <div className={styles.filterGroup}>
                    <label><MdFilterList /> Payment Status:</label>
                    <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                        <option value="">All</option>
                        <option value="Pending">Pending</option>
                        <option value="Partial">Partial</option>
                        <option value="Done">Done</option>
                    </select>
                </div>
                <div className={styles.filterGroup}>
                    <label><MdFilterList /> service Status:</label>
                    <select value={serviceStatus} onChange={(e) => setServiceStatus(e.target.value)}>
                        <option value="">All</option>
                        <option value="Not Started">Not Started</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                    </select>
                </div>
            </div>

            {/* services Table */}
            {loading ? (
                <div className={styles.loading}>Loading services...</div>
            ) : (
                <>
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th onClick={() => handleSort('projectName')}>
                                        Service Name {sortBy === 'projectName' && (sortOrder === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th onClick={() => handleSort('client')}>
                                        Client {sortBy === 'client' && (sortOrder === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th onClick={() => handleSort('startDate')}>
                                        Start Date {sortBy === 'startDate' && (sortOrder === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th onClick={() => handleSort('endDate')}>
                                        End Date {sortBy === 'endDate' && (sortOrder === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th onClick={() => handleSort('paymentStatus')}>
                                        Payment Status {sortBy === 'paymentStatus' && (sortOrder === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th onClick={() => handleSort('projectStatus')}>
                                        Service Status {sortBy === 'projectStatus' && (sortOrder === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th onClick={() => handleSort('totalPrice')}>
                                        Total Price {sortBy === 'totalPrice' && (sortOrder === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(!services || services.length === 0) ? (
                                    <tr>
                                        <td colSpan="8" className={styles.noData}>No services found</td>
                                    </tr>
                                ) : (
                                    services.map((service) => (
                                        <tr key={service._id} onClick={() => handleEditClick(service)} className={styles.clickableRow}>
                                            <td className={styles.serviceName}>{service.projectName}</td>
                                            <td>{service.client?.businessName || 'N/A'}</td>
                                            <td>{new Date(service.startDate).toLocaleDateString()}</td>
                                            <td>{new Date(service.endDate).toLocaleDateString()}</td>
                                            <td onClick={(e) => e.stopPropagation()}>
                                                <select
                                                    className={`${styles.inlineSelect} ${getPaymentStatusClass(service.paymentStatus)}`}
                                                    value={service.paymentStatus}
                                                    onChange={(e) => handleInlinePaymentStatus(e, service)}
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="Done">Done</option>
                                                </select>
                                                {service.paymentStatus !== 'Done' && (
                                                    <div className={styles.paidInfo}>
                                                        {service.amountPaid || 0}/{service.totalPrice} TND
                                                    </div>
                                                )}
                                            </td>
                                            <td onClick={(e) => e.stopPropagation()}>
                                                <select
                                                    className={`${styles.inlineSelect} ${getserviceStatusClass(service.projectStatus)}`}
                                                    value={service.projectStatus}
                                                    onChange={(e) => handleInlineserviceStatus(e, service)}
                                                >
                                                    <option value="Not Started">Not Started</option>
                                                    <option value="In Progress">In Progress</option>
                                                    <option value="Completed">Completed</option>
                                                </select>
                                            </td>
                                            <td className={styles.price}>{service.totalPrice.toLocaleString()} TND</td>
                                            <td className={styles.actions} onClick={(e) => e.stopPropagation()}>
                                                {canCreateEdit && (
                                                    <button
                                                        onClick={() => handleGenerateInvoice(service)}
                                                        className={styles.invoiceBtn}
                                                        title="Generate Invoice"
                                                    >
                                                        <MdReceiptLong />
                                                    </button>
                                                )}
                                                {canCreateEdit && service.paymentStatus !== 'Done' && (
                                                    <button 
                                                        onClick={() => { setPartialPaymentService(service); setPartialPaymentAmount(''); }} 
                                                        className={styles.paymentBtn}
                                                        title="Record Payment"
                                                    >
                                                        <MdPayment />
                                                    </button>
                                                )}
                                                {canCreateEdit && (
                                                    <button 
                                                        onClick={() => handleEditClick(service)} 
                                                        className={styles.editBtn}
                                                        title="Edit"
                                                    >
                                                        <MdEdit />
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button 
                                                        onClick={() => setDeletingService(service)} 
                                                        className={styles.deleteBtn}
                                                        title="Delete"
                                                    >
                                                        <MdDelete />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className={styles.pagination}>
                            <button 
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                disabled={pagination.page === 1}
                                className={styles.pageBtn}
                            >
                                <MdChevronLeft /> Previous
                            </button>
                            <span className={styles.pageInfo}>
                                Page {pagination.page} of {pagination.pages} ({pagination.total} total)
                            </span>
                            <button 
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                disabled={pagination.page === pagination.pages}
                                className={styles.pageBtn}
                            >
                                Next <MdChevronRight />
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Modals */}
            {showForm && (
                <ServiceForm
                    onSubmit={editingService ? handleUpdateService : handleAddService}
                    onClose={handleCloseForm}
                    editData={editingService}
                    userRole={userRole}
                />
            )}

            {deletingService && (
                <DeleteConfirmModal
                    project={deletingService}
                    onConfirm={handleDelete}
                    onCancel={() => setDeletingService(null)}
                />
            )}

            {invoicePrefill && (
                <InvoiceForm
                    invoice={invoicePrefill}
                    clients={clients}
                    onSave={() => { setInvoicePrefill(null); }}
                    onClose={() => setInvoicePrefill(null)}
                />
            )}

            {partialPaymentService && (
                <div className={styles.partialOverlay} onClick={() => setPartialPaymentService(null)}>
                    <div className={styles.partialModal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.partialHeader}>
                            <div className={styles.partialIconWrap}>
                                <MdPayment />
                            </div>
                            <div>
                                <h3>Record Payment</h3>
                                <p className={styles.partialSubtitle}>{partialPaymentService.projectName}</p>
                            </div>
                            <button className={styles.partialCloseBtn} onClick={() => setPartialPaymentService(null)}>✕</button>
                        </div>

                        <div className={styles.partialBody}>
                            <div className={styles.partialStats}>
                                <div className={styles.partialStat}>
                                    <span className={styles.partialStatLabel}>Total</span>
                                    <span className={styles.partialStatValue}>{partialPaymentService.totalPrice.toLocaleString()} TND</span>
                                </div>
                                <div className={styles.partialStat}>
                                    <span className={styles.partialStatLabel}>Paid</span>
                                    <span className={styles.partialStatValuePaid}>{(partialPaymentService.amountPaid || 0).toLocaleString()} TND</span>
                                </div>
                                <div className={styles.partialStat}>
                                    <span className={styles.partialStatLabel}>Remaining</span>
                                    <span className={styles.partialStatValueRem}>{(partialPaymentService.totalPrice - (partialPaymentService.amountPaid || 0)).toFixed(2)} TND</span>
                                </div>
                            </div>

                            <div className={styles.partialProgressWrap}>
                                <div
                                    className={styles.partialProgressBar}
                                    style={{ width: `${Math.min(((partialPaymentService.amountPaid || 0) / partialPaymentService.totalPrice) * 100, 100)}%` }}
                                />
                            </div>
                            <p className={styles.partialProgressLabel}>
                                {Math.round(((partialPaymentService.amountPaid || 0) / partialPaymentService.totalPrice) * 100)}% paid
                            </p>

                            <label className={styles.partialLabel}>Payment Amount (TND)</label>
                            <input
                                type="number"
                                placeholder="Enter amount..."
                                value={partialPaymentAmount}
                                onChange={(e) => setPartialPaymentAmount(e.target.value)}
                                min="0.01"
                                max={partialPaymentService.totalPrice - (partialPaymentService.amountPaid || 0)}
                                step="0.01"
                                className={styles.partialInput}
                                autoFocus
                            />
                        </div>

                        <div className={styles.partialActions}>
                            <button className={styles.cancelBtn} onClick={() => setPartialPaymentService(null)}>Cancel</button>
                            <button className={styles.confirmPayBtn} onClick={handlePartialPayment} disabled={!partialPaymentAmount || parseFloat(partialPaymentAmount) <= 0}>
                                <MdPayment /> Confirm Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServicesList;




