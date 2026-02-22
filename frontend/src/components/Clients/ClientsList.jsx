import React, { useState, useEffect } from 'react';
import { MdAdd, MdEdit, MdDelete, MdPerson, MdEmail, MdPhone, MdLocationOn, MdViewModule, MdViewList, MdSearch } from 'react-icons/md';
import ClientForm from './ClientForm';
import * as ClientsService from '../../services/ClientsServices';
import styles from './ClientsList.module.css';

const ClientsList = () => {
    const [clients, setClients] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [viewMode, setViewMode] = useState('table');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const data = await ClientsService.getClients();
            setClients(data);
        } catch (error) {
            console.error('Error fetching clients:', error);
        }
    };

    const handleAddClient = async (clientData) => {
        try {
            await ClientsService.createClient(clientData);
            fetchClients();
            setShowForm(false);
        } catch (error) {
            console.error('Error creating client:', error);
        }
    };

    const handleUpdateClient = async (clientData) => {
        try {
            await ClientsService.updateClient(editingClient._id, clientData);
            fetchClients();
            setEditingClient(null);
            setShowForm(false);
        } catch (error) {
            console.error('Error updating client:', error);
        }
    };

    const handleDeleteClient = async (clientId) => {
        if (window.confirm('Are you sure you want to delete this client?')) {
            try {
                await ClientsService.deleteClient(clientId);
                fetchClients();
            } catch (error) {
                console.error('Error deleting client:', error);
            }
        }
    };

    const handleEditClick = (client) => {
        setEditingClient(client);
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingClient(null);
    };

    const filteredClients = clients.filter((c) => {
        const q = searchQuery.toLowerCase();
        return (
            c.businessName?.toLowerCase().includes(q) ||
            c.ownerName?.toLowerCase().includes(q) ||
            c.email?.toLowerCase().includes(q)
        );
    });

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1></h1>
                <div className={styles.headerActions}>
                    <div className={styles.searchBox}>
                        <MdSearch className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Search clients…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
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
                        <MdAdd /> Add Client
                    </button>
                </div>
            </div>

            {showForm && (
                <ClientForm
                    onSubmit={editingClient ? handleUpdateClient : handleAddClient}
                    onClose={handleCloseForm}
                    editData={editingClient}
                    customTypes={[
                        ...new Set(
                            clients
                                .filter(c => c.businessType === 'Others' && c.customBusinessType?.trim())
                                .map(c => c.customBusinessType.trim())
                        )
                    ]}
                />
            )}

            {viewMode === 'cards' ? (
                <div className={styles.clientsGrid}>
                    {filteredClients.map((client) => (
                        <div key={client._id} className={styles.clientCard}>
                            <div className={styles.cardHeader}>
                                <div className={styles.profileSection}>
                                    <div className={styles.avatar}>
                                        {client.profileImage ? (
                                            <img src={client.profileImage} alt={client.ownerName} />
                                        ) : (
                                            <MdPerson />
                                        )}
                                    </div>
                                    <div className={styles.nameSection}>
                                        <h3>{client.businessName}</h3>
                                        <p className={styles.ownerName}>{client.ownerName}</p>
                                    </div>
                                </div>
                                <div className={styles.actions}>
                                    <button onClick={() => handleEditClick(client)} className={styles.editBtn}>
                                        <MdEdit />
                                    </button>
                                    <button onClick={() => handleDeleteClient(client._id)} className={styles.deleteBtn}>
                                        <MdDelete />
                                    </button>
                                </div>
                            </div>

                            <div className={styles.cardBody}>
                                <div className={styles.infoItem}>
                                    <MdEmail className={styles.icon} />
                                    <span>{client.email}</span>
                                </div>

                                <div className={styles.infoItem}>
                                    <MdPhone className={styles.icon} />
                                    <span>{client.phone}</span>
                                </div>

                                {client.address && (
                                    <div className={styles.infoItem}>
                                        <MdLocationOn className={styles.icon} />
                                        <span>{client.address}</span>
                                    </div>
                                )}

                                {client.notes && (
                                    <div className={styles.notes}>
                                        <p>{client.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Client</th>
                                <th>Owner</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Business Type</th>
                                <th>Matricule Fiscale</th>
                                <th>Address</th>
                                <th>Notes</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClients.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className={styles.noData}>No clients found</td>
                                </tr>
                            ) : (
                                filteredClients.map((client) => (
                                    <tr key={client._id} className={styles.tableRow}>
                                        <td>
                                            <div className={styles.tableClient}>
                                                <div className={styles.tableAvatar}>
                                                    {client.profileImage ? (
                                                        <img src={client.profileImage} alt={client.ownerName} />
                                                    ) : (
                                                        <MdPerson />
                                                    )}
                                                </div>
                                                <span className={styles.businessName}>{client.businessName}</span>
                                            </div>
                                        </td>
                                        <td>{client.ownerName}</td>
                                        <td>
                                            <a href={`mailto:${client.email}`} className={styles.emailLink}>{client.email}</a>
                                        </td>
                                        <td>{client.phone}</td>
                                        <td>{client.businessType === 'Others' ? (client.customBusinessType || 'Others') : (client.businessType || '—')}</td>
                                        <td>{client.matriculeFiscale || '—'}</td>
                                        <td>{client.address || '—'}</td>
                                        <td className={styles.notesCell}>{client.notes || '—'}</td>
                                        <td>
                                            <div className={styles.tableActions}>
                                                <button onClick={() => handleEditClick(client)} className={styles.editBtn}>
                                                    <MdEdit />
                                                </button>
                                                <button onClick={() => handleDeleteClient(client._id)} className={styles.deleteBtn}>
                                                    <MdDelete />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ClientsList;
