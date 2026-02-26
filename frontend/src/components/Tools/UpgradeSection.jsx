import React, { useState, useEffect, useCallback } from 'react';
import {
    MdAdd, MdEdit, MdDelete, MdCheckBox, MdCheckBoxOutlineBlank,
    MdShoppingCart, MdOpenInNew, MdAttachMoney, MdBuild,
    MdHistory, MdSearch, MdClose, MdArrowUpward, MdArrowDownward,
    MdStar, MdStarBorder, MdViewModule, MdViewList
} from 'react-icons/md';
import * as UpgradeService from '../../services/UpgradeServices';
import * as ToolsService from '../../services/ToolsServices';
import styles from './UpgradeSection.module.css';

const CATEGORIES = ['General', 'Camera', 'Lighting', 'Studio', 'Audio', 'Accessory', 'Gimbal', 'Cable', 'Power', 'Monitor', 'Storage', 'Protection', 'Software', 'Furniture', 'Other'];

const emptyForm = { name: '', price: '', imageUrl: '', category: 'General', productUrl: '', notes: '', quantity: 1, status: 'wishlist' };

const UpgradeSection = () => {
    const [items, setItems] = useState([]);
    const [fund, setFund] = useState({ investmentFund: 0, investmentHistory: [], toolPayoffRevenue: 0, totalToolCost: 0 });
    const [tools, setTools] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [statusFilter, setStatusFilter] = useState('wishlist');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [favoriteOnly, setFavoriteOnly] = useState(false);

    // View mode
    const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

    // Selection
    const [selected, setSelected] = useState(new Set());

    // Modals
    const [itemForm, setItemForm] = useState(null);  // null | { mode: 'add'|'edit', data: {} }
    const [buyModal, setBuyModal] = useState(null);  // null | { item } or { items: [...] }
    const [fundModal, setFundModal] = useState(null); // null | 'deposit' | 'withdraw' | 'history'

    // Fund form
    const [fundAmount, setFundAmount] = useState('');
    const [fundDesc, setFundDesc] = useState('');
    const [fundSaving, setFundSaving] = useState(false);
    const [fundMsg, setFundMsg] = useState('');

    // Toast
    const [toast, setToast] = useState(null); // { message, type: 'success'|'error' }
    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    }, []);

    // Buy modal state
    const [buyAs, setBuyAs] = useState('tool');
    const [buyTargetTool, setBuyTargetTool] = useState('');
    const [buyCategory, setBuyCategory] = useState('General');
    const [buyLoading, setBuyLoading] = useState(false);
    const [buyMsg, setBuyMsg] = useState('');

    const loadAll = useCallback(async () => {
        setLoading(true);
        try {
            const [its, fundData, toolList] = await Promise.all([
                UpgradeService.getUpgradeItems(),
                UpgradeService.getUpgradeFund(),
                ToolsService.getTools()
            ]);
            setItems(its);
            setFund(fundData);
            setTools(toolList);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadAll(); }, [loadAll]);

    // Filtered items
    const filtered = items
        .filter(item => {
            const matchStatus = statusFilter === 'all' || item.status === statusFilter;
            const matchCat = categoryFilter === 'All' || item.category === categoryFilter;
            const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.category.toLowerCase().includes(search.toLowerCase());
            const matchFav = !favoriteOnly || item.isFavorite;
            return matchStatus && matchCat && matchSearch && matchFav;
        })
        .sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0)); // favorites first

    const allCategories = ['All', ...new Set(items.map(i => i.category).filter(Boolean))];
    const wishlistCount = items.filter(i => i.status === 'wishlist').length;
    const purchasedCount = items.filter(i => i.status === 'purchased').length;
    const favoritesCount = items.filter(i => i.isFavorite).length;
    const totalWishlistCost = items.filter(i => i.status === 'wishlist').reduce((s, i) => s + (i.price * (i.quantity || 1)), 0);
    const totalBudget = (fund.investmentFund || 0) + (fund.toolPayoffRevenue || 0);
    const selectedArr = filtered.filter(i => selected.has(i._id) && i.status === 'wishlist');
    const selectedCost = selectedArr.reduce((s, i) => s + (i.price * (i.quantity || 1)), 0);

    // ── Handlers ─────────────────────────────────────────────
    const toggleSelect = (id) => {
        setSelected(prev => {
            const n = new Set(prev);
            n.has(id) ? n.delete(id) : n.add(id);
            return n;
        });
    };

    const toggleSelectAll = () => {
        const wishlist = filtered.filter(i => i.status === 'wishlist');
        if (selected.size === wishlist.length && wishlist.every(i => selected.has(i._id))) {
            setSelected(new Set());
        } else {
            setSelected(new Set(wishlist.map(i => i._id)));
        }
    };

    const openAddForm = () => setItemForm({ mode: 'add', data: { ...emptyForm } });
    const openEditForm = (item) => setItemForm({ mode: 'edit', data: { ...item, price: item.price.toString(), quantity: item.quantity || 1 } });

    const toggleFavorite = async (id) => {
        try {
            const res = await UpgradeService.toggleFavoriteItem(id);
            setItems(prev => prev.map(i => i._id === id ? { ...i, isFavorite: res.isFavorite } : i));
        } catch (e) {
            console.error(e);
        }
    };

    const handleFormSave = async () => {
        const d = itemForm.data;
        if (!d.name || !d.price) return;
        try {
            const payload = { ...d, price: Number(d.price), quantity: Number(d.quantity) || 1 };
            if (itemForm.mode === 'add') {
                await UpgradeService.createUpgradeItem(payload);
            } else {
                await UpgradeService.updateUpgradeItem(d._id, payload);
            }
            setItemForm(null);
            loadAll();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this item from the wishlist?')) return;
        await UpgradeService.deleteUpgradeItem(id);
        loadAll();
    };

    const openBuy = (item) => { setBuyModal({ items: [item] }); setBuyAs('tool'); setBuyTargetTool(''); setBuyCategory(item.category || 'General'); setBuyMsg(''); };
    const openBuySelected = () => { setBuyModal({ items: selectedArr }); setBuyAs('tool'); setBuyTargetTool(''); setBuyCategory('General'); setBuyMsg(''); };

    const handleBuy = async () => {
        if (!buyModal?.items?.length) return;
        setBuyLoading(true);
        setBuyMsg('');
        try {
            for (const item of buyModal.items) {
                await UpgradeService.purchaseUpgradeItem(item._id, {
                    purchasedAs: buyAs,
                    toolId: buyAs === 'subtool' ? buyTargetTool : undefined,
                    newToolCategory: buyCategory,
                });
            }
            setSelected(new Set());
            setBuyModal(null);
            loadAll();
        } catch (e) {
            setBuyMsg(e.response?.data?.message || 'Error purchasing item');
        } finally {
            setBuyLoading(false);
        }
    };

    const handleFundAction = async (type) => {
        if (!fundAmount || parseFloat(fundAmount) <= 0) return;
        setFundSaving(true);
        setFundMsg('');
        try {
            const fn = type === 'deposit' ? UpgradeService.addFundDeposit : UpgradeService.subtractFund;
            const res = await fn({ amount: parseFloat(fundAmount), description: fundDesc || undefined });
            setFund(prev => ({ ...prev, investmentFund: res.investmentFund, investmentHistory: res.investmentHistory }));
            setFundAmount('');
            setFundDesc('');
            setFundModal(null);
            showToast(
                type === 'deposit'
                    ? `✓ ${parseFloat(fundAmount).toLocaleString()} TND added to Investment Fund`
                    : `✓ ${parseFloat(fundAmount).toLocaleString()} TND subtracted from Investment Fund`
            );
        } catch (e) {
            setFundMsg(e.response?.data?.message || 'An error occurred');
        } finally {
            setFundSaving(false);
        }
    };

    // ── Render ────────────────────────────────────────────────
    return (
        <div className={styles.container}>
            {/* ── Toast ── */}
            {toast && (
                <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
                    {toast.message}
                </div>
            )}
            {/* ── Capital Summary ── */}
            <div className={styles.capitalsRow}>
                {/* Capital 1: Investment Fund */}
                <div className={`${styles.capitalCard} ${styles.capitalInvestment}`}>
                    <div className={styles.capitalHeader}>
                        <div className={styles.capitalIconWrap}>
                            <MdAttachMoney />
                        </div>
                        <div>
                            <p className={styles.capitalLabel}>Capital 1 — Investment Fund</p>
                            <p className={styles.capitalDesc}>Team contributions for upgrades</p>
                        </div>
                    </div>
                    <div className={styles.capitalAmount}>
                        {(fund.investmentFund || 0).toLocaleString('fr-TN', { minimumFractionDigits: 2 })} <span>TND</span>
                    </div>
                    <div className={styles.capitalActions}>
                        <button className={styles.capitalBtn} onClick={() => setFundModal('deposit')}>
                            <MdArrowUpward /> Add
                        </button>
                        <button className={`${styles.capitalBtn} ${styles.capitalBtnSubtract}`} onClick={() => setFundModal('withdraw')}>
                            <MdArrowDownward /> Subtract
                        </button>
                        <button className={`${styles.capitalBtn} ${styles.capitalBtnHistory}`} onClick={() => setFundModal('history')}>
                            <MdHistory /> History
                        </button>
                    </div>
                </div>

                {/* Capital 2: Tools Payoff Revenue */}
                <div className={`${styles.capitalCard} ${styles.capitalPayoff}`}>
                    <div className={styles.capitalHeader}>
                        <div className={`${styles.capitalIconWrap} ${styles.payoffIcon}`}>
                            <MdBuild />
                        </div>
                        <div>
                            <p className={styles.capitalLabel}>Capital 2 — Tools Payoff Revenue</p>
                            <p className={styles.capitalDesc}>Revenue generated from all tools</p>
                        </div>
                    </div>
                    <div className={`${styles.capitalAmount} ${styles.payoffAmount}`}>
                        {(fund.toolPayoffRevenue || 0).toLocaleString('fr-TN', { minimumFractionDigits: 2 })} <span>TND</span>
                    </div>
                    <div className={styles.capitalMeta}>
                        <span>Tools cost: {(fund.totalToolCost || 0).toLocaleString()} TND</span>
                    </div>
                </div>

                {/* Total Budget */}
                <div className={`${styles.capitalCard} ${styles.capitalTotal}`}>
                    <div className={styles.capitalHeader}>
                        <div className={`${styles.capitalIconWrap} ${styles.totalIcon}`}>
                            <MdShoppingCart />
                        </div>
                        <div>
                            <p className={styles.capitalLabel}>Total Available Budget</p>
                            <p className={styles.capitalDesc}>Fund + Payoff Revenue</p>
                        </div>
                    </div>
                    <div className={`${styles.capitalAmount} ${styles.totalAmount}`}>
                        {totalBudget.toLocaleString('fr-TN', { minimumFractionDigits: 2 })} <span>TND</span>
                    </div>
                    <div className={styles.capitalMeta}>
                        <span className={(totalBudget - totalWishlistCost) < 0 ? styles.negative : styles.positive}>
                            After wishlist: {(totalBudget - totalWishlistCost).toLocaleString(undefined, { minimumFractionDigits: 2 })} TND
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Header ── */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h2 className={styles.title}>🛒 Upgrade Wishlist</h2>
                    <div className={styles.quickStats}>
                        <span className={styles.qStat}>{wishlistCount} to buy</span>
                        <span className={styles.qStat}>{purchasedCount} purchased</span>
                        {favoritesCount > 0 && <span className={styles.qStatFav}>⭐ {favoritesCount} favorites</span>}
                        <span className={styles.qStatHighlight}>{totalWishlistCost.toLocaleString()} TND needed</span>
                    </div>
                </div>
                <div className={styles.headerRight}>
                    {selected.size > 0 && (
                        <button className={styles.buySelectedBtn} onClick={openBuySelected}>
                            <MdShoppingCart /> Buy Selected ({selected.size}) — {selectedCost.toLocaleString()} TND
                        </button>
                    )}
                    <div className={styles.viewToggle}>
                        <button className={`${styles.viewBtn} ${viewMode === 'cards' ? styles.viewBtnActive : ''}`} onClick={() => setViewMode('cards')} title="Card view"><MdViewModule /></button>
                        <button className={`${styles.viewBtn} ${viewMode === 'table' ? styles.viewBtnActive : ''}`} onClick={() => setViewMode('table')} title="Table view"><MdViewList /></button>
                    </div>
                    <button className={styles.addBtn} onClick={openAddForm}>
                        <MdAdd /> Add Product
                    </button>
                </div>
            </div>

            {/* ── Filters ── */}
            <div className={styles.filtersRow}>
                <div className={styles.searchWrap}>
                    <MdSearch className={styles.searchIcon} />
                    <input
                        className={styles.searchInput}
                        placeholder="Search products..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className={styles.statusTabs}>
                    {[['all', 'All'], ['wishlist', '⏳ To Buy'], ['purchased', '✅ Purchased']].map(([v, l]) => (
                        <button key={v} className={`${styles.tab} ${statusFilter === v ? styles.tabActive : ''}`} onClick={() => setStatusFilter(v)}>{l}</button>
                    ))}
                    <button
                        className={`${styles.tab} ${styles.tabFav} ${favoriteOnly ? styles.tabFavActive : ''}`}
                        onClick={() => setFavoriteOnly(p => !p)}
                    >
                        {favoriteOnly ? <MdStar className={styles.starOnInline} /> : <MdStarBorder className={styles.starOffInline} />}
                        Favorites {favoritesCount > 0 && `(${favoritesCount})`}
                    </button>
                </div>
                <div className={styles.catScrollRow}>
                    {allCategories.map(cat => (
                        <button key={cat} className={`${styles.catTab} ${categoryFilter === cat ? styles.catTabActive : ''}`} onClick={() => setCategoryFilter(cat)}>{cat}</button>
                    ))}
                </div>
            </div>

            {/* ── Select all (wishlist) ── */}
            {statusFilter !== 'purchased' && filtered.some(i => i.status === 'wishlist') && (
                <div className={styles.selectAllRow}>
                    <label className={styles.selectAllLabel}>
                        <input
                            type="checkbox"
                            checked={filtered.filter(i => i.status === 'wishlist').every(i => selected.has(i._id)) && filtered.some(i => i.status === 'wishlist')}
                            onChange={toggleSelectAll}
                        />
                        Select all wishlist items
                    </label>
                </div>
            )}

            {/* ── Grid ── */}
            {loading ? (
                <div className={styles.loading}>Loading upgrade items…</div>
            ) : filtered.length === 0 ? (
                <div className={styles.empty}>
                    <span>🛍️</span>
                    <p>No products found. Add your first upgrade item!</p>
                </div>
            ) : viewMode === 'table' ? (
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th style={{width:32}}></th>
                                <th>Product</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Qty</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(item => {
                                const isPurchased = item.status === 'purchased';
                                const isSelected = selected.has(item._id);
                                return (
                                    <tr key={item._id} className={`${styles.tRow} ${item.isFavorite ? styles.tRowFav : ''} ${isSelected ? styles.tRowSelected : ''}`}>
                                        <td>
                                            <button className={styles.starBtn} onClick={() => toggleFavorite(item._id)}>
                                                {item.isFavorite ? <MdStar className={styles.starOn} /> : <MdStarBorder className={styles.starOff} />}
                                            </button>
                                        </td>
                                        <td>
                                            <div className={styles.tNameCell}>
                                                {item.imageUrl && <img src={item.imageUrl} alt={item.name} className={styles.tThumb} onError={e => { e.target.src='https://placehold.co/40x40?text=?'; }} />}
                                                <div>
                                                    <span className={styles.tName}>{item.name}</span>
                                                    {item.notes && <span className={styles.tNotes}>{item.notes}</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td><span className={styles.tCat}>{item.category}</span></td>
                                        <td className={styles.tPrice}>{item.price.toLocaleString()} TND</td>
                                        <td>{item.quantity || 1}</td>
                                        <td className={styles.tPrice}>{(item.price * (item.quantity || 1)).toLocaleString()} TND</td>
                                        <td><span className={isPurchased ? styles.tBadgePurchased : styles.tBadgeWishlist}>{isPurchased ? '✅ Purchased' : '⏳ To buy'}</span></td>
                                        <td>
                                            <div className={styles.tableActions}>
                                                {!isPurchased && (
                                                    <>
                                                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(item._id)} className={styles.tCheck} />
                                                        <button className={styles.buyBtn} onClick={() => openBuy(item)} title="Buy"><MdShoppingCart /></button>
                                                    </>
                                                )}
                                                {item.productUrl && <a href={item.productUrl} target="_blank" rel="noopener noreferrer" className={styles.linkBtn}><MdOpenInNew /></a>}
                                                <button className={styles.editBtn} onClick={() => openEditForm(item)} title="Edit"><MdEdit /></button>
                                                <button className={styles.deleteBtn} onClick={() => handleDelete(item._id)} title="Delete"><MdDelete /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className={styles.grid}>
                    {filtered.map(item => {
                        const isSelected = selected.has(item._id);
                        const isPurchased = item.status === 'purchased';
                        return (
                            <div key={item._id} className={`${styles.card} ${isSelected ? styles.cardSelected : ''} ${isPurchased ? styles.cardPurchased : ''} ${item.isFavorite ? styles.cardFav : ''}`}>
                                {/* Favorite button */}
                                <button className={styles.favBtn} onClick={() => toggleFavorite(item._id)} title={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
                                    {item.isFavorite ? <MdStar className={styles.starOn} /> : <MdStarBorder className={styles.starOff} />}
                                </button>
                                {/* Checkbox (wishlist only) */}
                                {!isPurchased && (
                                    <button className={styles.cardCheckbox} onClick={() => toggleSelect(item._id)}>
                                        {isSelected ? <MdCheckBox className={styles.checkOn} /> : <MdCheckBoxOutlineBlank className={styles.checkOff} />}
                                    </button>
                                )}
                                {isPurchased && <div className={styles.purchasedBadge}>✅ Purchased</div>}

                                {/* Image */}
                                <div className={styles.imageWrap}>
                                    {item.imageUrl ? (
                                        <img
                                            src={item.imageUrl}
                                            alt={item.name}
                                            className={styles.cardImage}
                                            onError={e => { e.target.src = 'https://placehold.co/300x200?text=No+Image'; }}
                                        />
                                    ) : (
                                        <div className={styles.noImage}>📦</div>
                                    )}
                                    {item.productUrl && (
                                        <a href={item.productUrl} target="_blank" rel="noopener noreferrer" className={styles.extLink} onClick={e => e.stopPropagation()}>
                                            <MdOpenInNew />
                                        </a>
                                    )}
                                    {item.quantity > 1 && <span className={styles.qtyBadge}>×{item.quantity}</span>}
                                </div>

                                {/* Content */}
                                <div className={styles.cardContent}>
                                    <span className={styles.cardCategory}>{item.category}</span>
                                    <h3 className={styles.cardName}>{item.name}</h3>
                                    {item.notes && <p className={styles.cardNotes}>{item.notes}</p>}
                                    <div className={styles.cardFooter}>
                                        <div className={styles.priceBlock}>
                                            <span className={styles.cardPrice}>{item.price.toLocaleString()} TND</span>
                                            {item.quantity > 1 && <span className={styles.cardSubtotal}>= {(item.price * item.quantity).toLocaleString()} TND</span>}
                                        </div>
                                        <div className={styles.cardActions}>
                                            {!isPurchased && (
                                                <button className={styles.buyBtn} onClick={() => openBuy(item)} title="Buy / Add to tools">
                                                    <MdShoppingCart />
                                                </button>
                                            )}
                                            <button className={styles.editBtn} onClick={() => openEditForm(item)} title="Edit">
                                                <MdEdit />
                                            </button>
                                            <button className={styles.deleteBtn} onClick={() => handleDelete(item._id)} title="Delete">
                                                <MdDelete />
                                            </button>
                                        </div>
                                    </div>
                                    {isPurchased && item.purchasedToolRef && (
                                        <p className={styles.purchasedInfo}>
                                            Added as {item.purchasedAs} → {item.purchasedToolRef.name}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Add/Edit Item Form Modal ── */}
            {itemForm && (
                <div className={styles.overlay} onClick={() => setItemForm(null)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>{itemForm.mode === 'add' ? '➕ Add Product' : '✏️ Edit Product'}</h3>
                            <button className={styles.modalClose} onClick={() => setItemForm(null)}><MdClose /></button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.formGrid}>
                                <div className={styles.formField}>
                                    <label>Name *</label>
                                    <input type="text" value={itemForm.data.name} onChange={e => setItemForm(p => ({ ...p, data: { ...p.data, name: e.target.value } }))} placeholder="Product name" />
                                </div>
                                <div className={styles.formField}>
                                    <label>Price (TND) *</label>
                                    <input type="number" value={itemForm.data.price} onChange={e => setItemForm(p => ({ ...p, data: { ...p.data, price: e.target.value } }))} min="0" step="0.01" placeholder="0.00" />
                                </div>
                                <div className={styles.formField}>
                                    <label>Quantity</label>
                                    <input type="number" value={itemForm.data.quantity} onChange={e => setItemForm(p => ({ ...p, data: { ...p.data, quantity: e.target.value } }))} min="1" />
                                </div>
                                <div className={styles.formField}>
                                    <label>Category</label>
                                    <select value={itemForm.data.category} onChange={e => setItemForm(p => ({ ...p, data: { ...p.data, category: e.target.value } }))}>
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className={`${styles.formField} ${styles.fullWidth}`}>
                                    <label>Image URL</label>
                                    <input type="url" value={itemForm.data.imageUrl} onChange={e => setItemForm(p => ({ ...p, data: { ...p.data, imageUrl: e.target.value } }))} placeholder="https://..." />
                                </div>
                                <div className={`${styles.formField} ${styles.fullWidth}`}>
                                    <label>Product URL (external link)</label>
                                    <input type="url" value={itemForm.data.productUrl} onChange={e => setItemForm(p => ({ ...p, data: { ...p.data, productUrl: e.target.value } }))} placeholder="https://shop.example.com/..." />
                                </div>
                                <div className={`${styles.formField} ${styles.fullWidth}`}>
                                    <label>Notes</label>
                                    <textarea value={itemForm.data.notes} onChange={e => setItemForm(p => ({ ...p, data: { ...p.data, notes: e.target.value } }))} rows={2} placeholder="Optional notes..." />
                                </div>
                                {/* Live image preview */}
                                {itemForm.data.imageUrl && (
                                    <div className={`${styles.formField} ${styles.fullWidth}`}>
                                        <label>Image preview</label>
                                        <img src={itemForm.data.imageUrl} alt="preview" className={styles.imagePreview} onError={e => { e.target.src = 'https://placehold.co/300x150?text=Invalid+URL'; }} />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.cancelBtn} onClick={() => setItemForm(null)}>Cancel</button>
                            <button className={styles.saveBtn} onClick={handleFormSave} disabled={!itemForm.data.name || !itemForm.data.price}>
                                {itemForm.mode === 'add' ? 'Add Product' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Buy Modal ── */}
            {buyModal && (
                <div className={styles.overlay} onClick={() => setBuyModal(null)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>🛒 Purchase {buyModal.items.length > 1 ? `${buyModal.items.length} Items` : `"${buyModal.items[0]?.name}"`}</h3>
                            <button className={styles.modalClose} onClick={() => setBuyModal(null)}><MdClose /></button>
                        </div>
                        <div className={styles.modalBody}>
                            {buyModal.items.length > 1 && (
                                <div className={styles.buyItemsList}>
                                    {buyModal.items.map(i => <div key={i._id} className={styles.buyListItem}>• {i.name} — {i.price.toLocaleString()} TND</div>)}
                                </div>
                            )}
                            <p className={styles.buyTotalLine}>
                                Total cost: <strong>{buyModal.items.reduce((s, i) => s + (i.price * (i.quantity || 1)), 0).toLocaleString()} TND</strong>
                            </p>
                            <div className={styles.buyTypeRow}>
                                <label className={`${styles.buyTypeOption} ${buyAs === 'tool' ? styles.buyTypeActive : ''}`} onClick={() => setBuyAs('tool')}>
                                    <input type="radio" name="buyAs" value="tool" checked={buyAs === 'tool'} readOnly /> Add as New Tool
                                    <span className={styles.buyTypeHint}>Creates a new standalone tool entry</span>
                                </label>
                                <label className={`${styles.buyTypeOption} ${buyAs === 'subtool' ? styles.buyTypeActive : ''}`} onClick={() => setBuyAs('subtool')}>
                                    <input type="radio" name="buyAs" value="subtool" checked={buyAs === 'subtool'} readOnly /> Add as Sub-Tool
                                    <span className={styles.buyTypeHint}>Attaches to an existing tool</span>
                                </label>
                            </div>
                            {buyAs === 'tool' && (
                                <div className={styles.formField}>
                                    <label>Category for new tool</label>
                                    <select value={buyCategory} onChange={e => setBuyCategory(e.target.value)}>
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            )}
                            {buyAs === 'subtool' && (
                                <div className={styles.formField}>
                                    <label>Target Tool *</label>
                                    <select value={buyTargetTool} onChange={e => setBuyTargetTool(e.target.value)}>
                                        <option value="">— Select tool —</option>
                                        {tools.map(t => <option key={t._id} value={t._id}>{t.name} ({t.category})</option>)}
                                    </select>
                                </div>
                            )}
                            {buyMsg && <p className={styles.buyMsg}>{buyMsg}</p>}
                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.cancelBtn} onClick={() => setBuyModal(null)}>Cancel</button>
                            <button
                                className={styles.confirmBuyBtn}
                                onClick={handleBuy}
                                disabled={buyLoading || (buyAs === 'subtool' && !buyTargetTool)}
                            >
                                {buyLoading ? 'Processing…' : `✅ Confirm Purchase`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Fund Deposit / Withdraw Modal ── */}
            {(fundModal === 'deposit' || fundModal === 'withdraw') && (
                <div className={styles.overlay} onClick={() => setFundModal(null)}>
                    <div className={`${styles.modal} ${styles.modalSmall}`} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>{fundModal === 'deposit' ? '➕ Add to Investment Fund' : '➖ Subtract from Investment Fund'}</h3>
                            <button className={styles.modalClose} onClick={() => setFundModal(null)}><MdClose /></button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.fundBalanceDisplay}>
                                Current balance: <strong>{(fund.investmentFund || 0).toLocaleString()} TND</strong>
                            </div>
                            <div className={styles.formField}>
                                <label>Amount (TND) *</label>
                                <input type="number" value={fundAmount} onChange={e => setFundAmount(e.target.value)} min="0.01" step="0.01" placeholder="0.00" autoFocus />
                            </div>
                            <div className={styles.formField}>
                                <label>Description (optional)</label>
                                <input type="text" value={fundDesc} onChange={e => setFundDesc(e.target.value)} placeholder={fundModal === 'deposit' ? 'e.g. Monthly team contribution' : 'e.g. Used for camera purchase'} />
                            </div>
                            {fundMsg && <p className={styles.fundMsg}>{fundMsg}</p>}
                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.cancelBtn} onClick={() => setFundModal(null)}>Cancel</button>
                            <button
                                className={fundModal === 'deposit' ? styles.saveBtn : styles.deductBtn}
                                onClick={() => handleFundAction(fundModal)}
                                disabled={fundSaving || !fundAmount || parseFloat(fundAmount) <= 0}
                            >
                                {fundSaving ? '…' : fundModal === 'deposit' ? '➕ Add' : '➖ Subtract'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Fund History Modal ── */}
            {fundModal === 'history' && (
                <div className={styles.overlay} onClick={() => setFundModal(null)}>
                    <div className={`${styles.modal} ${styles.modalMedium}`} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3><MdHistory style={{ verticalAlign: 'middle', marginRight: 6 }} />Investment Fund History</h3>
                            <button className={styles.modalClose} onClick={() => setFundModal(null)}><MdClose /></button>
                        </div>
                        <div className={styles.modalBody}>
                            {fund.investmentHistory.length === 0 ? (
                                <p className={styles.historyEmpty}>No history yet.</p>
                            ) : (
                                <div className={styles.historyList}>
                                    {fund.investmentHistory.map((entry, i) => (
                                        <div key={i} className={styles.historyRow}>
                                            <span className={`${styles.histAmt} ${entry.amount < 0 ? styles.negative : styles.positive}`}>
                                                {entry.amount > 0 ? '+' : ''}{entry.amount.toLocaleString()} TND
                                            </span>
                                            <span className={styles.histDesc}>{entry.description}</span>
                                            <span className={styles.histDate}>{new Date(entry.date).toLocaleDateString()}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UpgradeSection;
