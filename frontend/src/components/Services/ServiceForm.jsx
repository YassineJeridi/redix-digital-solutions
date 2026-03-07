import React, { useState, useEffect } from "react";
import {
  MdClose,
  MdSave,
  MdAdd,
  MdEdit,
  MdBusiness,
  MdAttachMoney,
  MdGroup,
  MdBuildCircle,
  MdPieChart,
  MdCampaign,
} from "react-icons/md";
import * as ClientsService from "../../services/ClientsServices";
import * as ToolsServices from "../../services/ToolsServices";
import * as SettingsServices from "../../services/SettingsServices";
import styles from "./ServiceForm.module.css";

const ServiceForm = ({ onSubmit, onClose, editData, userRole }) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Dropdown options
  const [clients, setClients] = useState([]);
  const [tools, setTools] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);

  // Form data
  const [formData, setFormData] = useState({
    serviceName: "",
    client: "",
    startDate: "",
    endDate: "",
    paymentStatus: "Pending",
    serviceStatus: "Not Started",
    totalPrice: "",
    serviceProvided: "Marketing",
    revenueDistribution: {
      toolsAndCharges: 30,
      teamShare: 50,
      redixCaisse: 20,
    },
    marketing: {
      videosCount: 0,
      postsCount: 0,
      shootingSessionsCount: 0,
    },
    production: {
      videosCount: 0,
      picturesCount: 0,
      shootingSessionsCount: 0,
    },
    development: {
      description: "",
      platform: "Web",
      typeComplexity: "Vitrine",
    },
    toolsUsage: [],
    teamMembers: [],
    teamMemberShares: [], // { memberId, percentage, amount }
    adsFees: { enabled: false, amountUSD: "", usdToTND: 3.5 },
  });

  useEffect(() => {
    fetchDropdownData();

    if (editData) {
      setFormData({
        serviceName: editData.projectName || editData.serviceName || "",
        client: editData.client?._id || "",
        startDate: editData.startDate
          ? new Date(editData.startDate).toISOString().split("T")[0]
          : "",
        endDate: editData.endDate
          ? new Date(editData.endDate).toISOString().split("T")[0]
          : "",
        paymentStatus: editData.paymentStatus || "Pending",
        serviceStatus:
          editData.projectStatus || editData.serviceStatus || "Not Started",
        totalPrice: editData.totalPrice || "",
        serviceProvided: editData.serviceProvided || "Marketing",
        revenueDistribution: editData.revenueDistribution || {
          toolsAndCharges: 30,
          teamShare: 50,
          redixCaisse: 20,
        },
        marketing: editData.marketing || {
          videosCount: 0,
          postsCount: 0,
          shootingSessionsCount: 0,
        },
        production: editData.production || {
          videosCount: 0,
          picturesCount: 0,
          shootingSessionsCount: 0,
        },
        development: editData.development || {
          description: "",
          platform: "Web",
          typeComplexity: "Vitrine",
        },
        toolsUsage:
          editData.toolsUsage?.map((t) => ({
            tool: t.tool._id || t.tool,
            percentage: t.percentage,
          })) || [],
        teamMembers: editData.teamMembers?.map((m) => m._id || m) || [],
        teamMemberShares:
          editData.teamMemberShares?.map((s) => ({
            memberId: s.memberId._id || s.memberId,
            percentage: s.percentage,
            amount: s.amount,
          })) || [],
        adsFees: editData.adsFees
          ? {
              enabled: editData.adsFees.enabled || false,
              amountUSD: editData.adsFees.amountUSD || "",
              usdToTND: editData.adsFees.usdToTND ?? 3.5,
            }
          : { enabled: false, amountUSD: "", usdToTND: 3.5 },
      });
    }
  }, [editData]);

  const fetchDropdownData = async () => {
    try {
      const [clientsData, toolsData, membersData] = await Promise.all([
        ClientsService.getClients(),
        ToolsServices.getTools(),
        SettingsServices.getTeamMembers(),
      ]);
      setClients(clientsData);
      setTools(toolsData.filter((t) => t.status === "active"));
      setTeamMembers(membersData);
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleNestedChange = (category, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };

  const handleAdsFeeChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      adsFees: { ...prev.adsFees, [field]: value },
    }));
  };

  const handleRevenueChange = (field, value) => {
    const numValue = parseFloat(value) || 0;
    setFormData((prev) => ({
      ...prev,
      revenueDistribution: {
        ...prev.revenueDistribution,
        [field]: numValue,
      },
    }));
  };

  const calculateRevenueTotal = () => {
    const { toolsAndCharges, teamShare, redixCaisse } =
      formData.revenueDistribution;
    return toolsAndCharges + teamShare + redixCaisse;
  };

  const handleToolUsageChange = (toolId, percentage) => {
    setFormData((prev) => {
      const existing = prev.toolsUsage.find((t) => t.tool === toolId);
      let newToolsUsage;
      if (existing) {
        newToolsUsage = prev.toolsUsage.map((t) =>
          t.tool === toolId
            ? { ...t, percentage: parseFloat(percentage) || 0 }
            : t,
        );
      } else {
        newToolsUsage = [
          ...prev.toolsUsage,
          { tool: toolId, percentage: parseFloat(percentage) || 0 },
        ];
      }
      return { ...prev, toolsUsage: newToolsUsage };
    });
  };

  // Calculate tool percentages based on purchase price ratio
  const calcToolPercentages = (toolsUsageList) => {
    if (toolsUsageList.length === 0) return toolsUsageList;
    const totalCost = toolsUsageList.reduce((sum, tu) => {
      const tool = tools.find((t) => t._id === tu.tool);
      return sum + (tool?.purchasePrice || 0);
    }, 0);
    if (totalCost === 0) {
      // Fallback to equal distribution if all prices are 0
      const equalPct = Math.round((100 / toolsUsageList.length) * 100) / 100;
      return toolsUsageList.map((t) => ({ ...t, percentage: equalPct }));
    }
    return toolsUsageList.map((tu) => {
      const tool = tools.find((t) => t._id === tu.tool);
      const price = tool?.purchasePrice || 0;
      const pct = Math.round((price / totalCost) * 10000) / 100;
      return { ...tu, percentage: pct };
    });
  };

  const toggleToolUsage = (toolId) => {
    setFormData((prev) => {
      const existing = prev.toolsUsage.find((t) => t.tool === toolId);
      let newToolsUsage;
      if (existing) {
        newToolsUsage = prev.toolsUsage.filter((t) => t.tool !== toolId);
      } else {
        newToolsUsage = [...prev.toolsUsage, { tool: toolId, percentage: 0 }];
      }
      newToolsUsage = calcToolPercentages(newToolsUsage);
      return { ...prev, toolsUsage: newToolsUsage };
    });
  };

  const removeToolUsage = (toolId) => {
    setFormData((prev) => {
      let newToolsUsage = prev.toolsUsage.filter((t) => t.tool !== toolId);
      newToolsUsage = calcToolPercentages(newToolsUsage);
      return { ...prev, toolsUsage: newToolsUsage };
    });
  };

  const calculateToolsTotal = () => {
    return formData.toolsUsage.reduce((sum, t) => sum + (t.percentage || 0), 0);
  };

  const handleTeamMemberToggle = (memberId) => {
    setFormData((prev) => {
      const isSelected = prev.teamMembers.includes(memberId);
      let newTeamMembers, newShares;

      if (isSelected) {
        newTeamMembers = prev.teamMembers.filter((id) => id !== memberId);
        newShares = prev.teamMemberShares.filter(
          (s) => s.memberId !== memberId,
        );
      } else {
        newTeamMembers = [...prev.teamMembers, memberId];
        newShares = [
          ...prev.teamMemberShares,
          { memberId, percentage: 0, amount: 0 },
        ];
      }

      // Auto-distribute equal percentages
      const count = newTeamMembers.length;
      if (count > 0) {
        const equalPct = Math.round((100 / count) * 100) / 100;
        const teamShareTotal =
          (prev.totalPrice * prev.revenueDistribution.teamShare) / 100;
        newShares = newShares.map((s) => ({
          ...s,
          percentage: equalPct,
          amount: Math.round(((teamShareTotal * equalPct) / 100) * 100) / 100,
        }));
      }

      return {
        ...prev,
        teamMembers: newTeamMembers,
        teamMemberShares: newShares,
      };
    });
  };

  const handleTeamMemberShareChange = (memberId, percentage) => {
    const numPercentage = parseFloat(percentage) || 0;
    const teamShare =
      (formData.totalPrice * formData.revenueDistribution.teamShare) / 100;
    const amount = (teamShare * numPercentage) / 100;

    setFormData((prev) => ({
      ...prev,
      teamMemberShares: prev.teamMemberShares.map((s) =>
        s.memberId === memberId
          ? { ...s, percentage: numPercentage, amount }
          : s,
      ),
    }));
  };

  const calculateTeamSharesTotal = () => {
    return formData.teamMemberShares.reduce(
      (sum, s) => sum + (s.percentage || 0),
      0,
    );
  };

  const getTotalTeamAmount = () => {
    return (formData.totalPrice * formData.revenueDistribution.teamShare) / 100;
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.serviceName.trim())
      newErrors.serviceName = "service name is required";
    if (!formData.client) newErrors.client = "Client is required";
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (!formData.endDate) newErrors.endDate = "End date is required";
    if (!formData.totalPrice || formData.totalPrice <= 0)
      newErrors.totalPrice = "Total price must be greater than 0";

    // Date validation
    if (formData.startDate && formData.endDate) {
      if (new Date(formData.endDate) <= new Date(formData.startDate)) {
        newErrors.endDate = "End date must be after start date";
      }
    }

    // Revenue distribution validation
    const revenueTotal = calculateRevenueTotal();
    if (Math.abs(revenueTotal - 100) > 0.01) {
      newErrors.revenueDistribution = `Revenue distribution must total 100% (currently ${revenueTotal.toFixed(2)}%)`;
    }

    // Service-specific validation
    if (formData.serviceProvided === "Development") {
      if (!formData.development.description.trim()) {
        newErrors.developmentDescription =
          "service description is required for Development";
      }
    }

    // Tools usage validation (for Marketing, Production and Development)
    if (
      ["Marketing", "Production", "Development"].includes(
        formData.serviceProvided,
      )
    ) {
      if (formData.toolsUsage.length > 0) {
        const toolsTotal = calculateToolsTotal();
        if (Math.abs(toolsTotal - 100) > 0.01) {
          newErrors.toolsUsage = `Tools usage must total 100% (currently ${toolsTotal.toFixed(2)}%)`;
        }
      }
    }

    // Team member shares validation
    if (formData.teamMembers.length > 0) {
      const sharesTotal = calculateTeamSharesTotal();
      if (Math.abs(sharesTotal - 100) > 0.01) {
        newErrors.teamMemberShares = `Team member shares must total 100% (currently ${sharesTotal.toFixed(2)}%)`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const computedAdsFeesTND = formData.adsFees.enabled
        ? (parseFloat(formData.adsFees.amountUSD) || 0) *
          (parseFloat(formData.adsFees.usdToTND) || 0)
        : 0;
      // Map frontend field names to backend model field names
      const submitData = {
        ...formData,
        projectName: formData.serviceName,
        projectStatus: formData.serviceStatus,
        adsFees: {
          ...formData.adsFees,
          amountUSD: parseFloat(formData.adsFees.amountUSD) || 0,
          usdToTND: parseFloat(formData.adsFees.usdToTND) || 0,
          amountTND: computedAdsFeesTND,
        },
      };
      delete submitData.serviceName;
      delete submitData.serviceStatus;
      await onSubmit(submitData);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  const adsFeesTND = formData.adsFees.enabled
    ? (parseFloat(formData.adsFees.amountUSD) || 0) *
      (parseFloat(formData.adsFees.usdToTND) || 0)
    : 0;
  const effectivePrice = Math.max(
    0,
    (parseFloat(formData.totalPrice) || 0) - adsFeesTND,
  );

  const showToolsUsage = ["Marketing", "Production", "Development"].includes(
    formData.serviceProvided,
  );

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            {editData ? <MdEdit /> : <MdAdd />}
          </div>
          <div className={styles.headerText}>
            <h2>{editData ? "Edit Service" : "Add New Service"}</h2>
            <p>
              {editData
                ? `Editing: ${editData.projectName || editData.serviceName}`
                : "Fill in the details to create a new service project"}
            </p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} type="button">
            <MdClose />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Basic Information */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <MdBusiness /> Basic Information
            </h3>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label>Service Name *</label>
                <input
                  type="text"
                  name="serviceName"
                  value={formData.serviceName}
                  onChange={handleChange}
                  className={errors.serviceName ? styles.error : ""}
                />
                {errors.serviceName && (
                  <span className={styles.errorText}>{errors.serviceName}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Client *</label>
                <select
                  name="client"
                  value={formData.client}
                  onChange={handleChange}
                  className={errors.client ? styles.error : ""}
                >
                  <option value="">Select Client</option>
                  {clients.map((client) => (
                    <option key={client._id} value={client._id}>
                      {client.businessName}
                    </option>
                  ))}
                </select>
                {errors.client && (
                  <span className={styles.errorText}>{errors.client}</span>
                )}
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label>Start Date *</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className={errors.startDate ? styles.error : ""}
                />
                {errors.startDate && (
                  <span className={styles.errorText}>{errors.startDate}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>End Date *</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className={errors.endDate ? styles.error : ""}
                />
                {errors.endDate && (
                  <span className={styles.errorText}>{errors.endDate}</span>
                )}
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label>Service Provided *</label>
                <select
                  name="serviceProvided"
                  value={formData.serviceProvided}
                  onChange={handleChange}
                >
                  <option value="Marketing">Marketing</option>
                  <option value="Production">Production</option>
                  <option value="Development">Development</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Total Price *</label>
                <input
                  type="number"
                  name="totalPrice"
                  value={formData.totalPrice}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className={errors.totalPrice ? styles.error : ""}
                />
                {errors.totalPrice && (
                  <span className={styles.errorText}>{errors.totalPrice}</span>
                )}
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label>Payment Status *</label>
                <select
                  name="paymentStatus"
                  value={formData.paymentStatus}
                  onChange={handleChange}
                >
                  <option value="Pending">Pending</option>
                  <option value="Done">Done</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Service Status *</label>
                <select
                  name="serviceStatus"
                  value={formData.serviceStatus}
                  onChange={handleChange}
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          </section>

          {/* Ads Fees */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <MdCampaign /> Ads Fees
            </h3>
            <div className={styles.adsFeeCheckRow}>
              <input
                type="checkbox"
                id="adsFeesEnabled"
                checked={formData.adsFees.enabled}
                onChange={(e) =>
                  handleAdsFeeChange("enabled", e.target.checked)
                }
              />
              <label htmlFor="adsFeesEnabled">
                Include Ads Fees (deducted before revenue distribution)
              </label>
            </div>
            {formData.adsFees.enabled && (
              <div className={styles.adsFeeSection}>
                <div className={styles.adsFeeRow}>
                  <div className={styles.formGroup}>
                    <label>Ads Spend (USD)</label>
                    <input
                      type="number"
                      value={formData.adsFees.amountUSD}
                      onChange={(e) =>
                        handleAdsFeeChange("amountUSD", e.target.value)
                      }
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>1 USD = ? TND</label>
                    <input
                      type="number"
                      value={formData.adsFees.usdToTND}
                      onChange={(e) =>
                        handleAdsFeeChange("usdToTND", e.target.value)
                      }
                      min="0"
                      step="0.01"
                      placeholder="3.50"
                    />
                  </div>
                </div>
                {adsFeesTND > 0 && (
                  <div className={styles.adsFeeHint}>
                    Ads Fees: <strong>{adsFeesTND.toFixed(2)} TND</strong> —
                    will be added to TND Reserved in Ads page
                    <br />
                    Effective price for distribution:{" "}
                    <strong>{effectivePrice.toFixed(2)} TND</strong>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Revenue Distribution */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <MdPieChart /> Revenue Distribution (must total 100%)
            </h3>
            {errors.revenueDistribution && (
              <div className={styles.errorBox}>
                {errors.revenueDistribution}
              </div>
            )}

            <div className={styles.revenueGrid}>
              <div className={styles.formGroup}>
                <label>Tools & Charges (%)</label>
                <input
                  type="number"
                  value={formData.revenueDistribution.toolsAndCharges}
                  onChange={(e) =>
                    handleRevenueChange("toolsAndCharges", e.target.value)
                  }
                  min="0"
                  max="100"
                  step="0.01"
                />
                <span className={styles.distAmount}>
                  ={" "}
                  {(
                    (effectivePrice *
                      formData.revenueDistribution.toolsAndCharges) /
                    100
                  ).toFixed(2)}{" "}
                  TND
                </span>
              </div>

              <div className={styles.formGroup}>
                <label>Team Share (%)</label>
                <input
                  type="number"
                  value={formData.revenueDistribution.teamShare}
                  onChange={(e) =>
                    handleRevenueChange("teamShare", e.target.value)
                  }
                  min="0"
                  max="100"
                  step="0.01"
                />
                <span className={styles.distAmount}>
                  ={" "}
                  {(
                    (effectivePrice * formData.revenueDistribution.teamShare) /
                    100
                  ).toFixed(2)}{" "}
                  TND
                </span>
              </div>

              <div className={styles.formGroup}>
                <label>Redix Caisse (%)</label>
                <input
                  type="number"
                  value={formData.revenueDistribution.redixCaisse}
                  onChange={(e) =>
                    handleRevenueChange("redixCaisse", e.target.value)
                  }
                  min="0"
                  max="100"
                  step="0.01"
                />
                <span className={styles.distAmount}>
                  ={" "}
                  {(
                    (effectivePrice *
                      formData.revenueDistribution.redixCaisse) /
                    100
                  ).toFixed(2)}{" "}
                  TND
                </span>
              </div>
            </div>

            <div
              className={`${styles.totalBadge} ${Math.abs(calculateRevenueTotal() - 100) < 0.01 ? styles.valid : styles.invalid}`}
            >
              Total: {calculateRevenueTotal().toFixed(2)}%
            </div>
          </section>

          {/* Service-Specific Fields */}
          {formData.serviceProvided === "Marketing" && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Marketing Details</h3>
              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label>Videos Count</label>
                  <input
                    type="number"
                    value={formData.marketing.videosCount}
                    onChange={(e) =>
                      handleNestedChange(
                        "marketing",
                        "videosCount",
                        parseInt(e.target.value) || 0,
                      )
                    }
                    min="0"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Posts Count</label>
                  <input
                    type="number"
                    value={formData.marketing.postsCount}
                    onChange={(e) =>
                      handleNestedChange(
                        "marketing",
                        "postsCount",
                        parseInt(e.target.value) || 0,
                      )
                    }
                    min="0"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Shooting Sessions</label>
                  <input
                    type="number"
                    value={formData.marketing.shootingSessionsCount}
                    onChange={(e) =>
                      handleNestedChange(
                        "marketing",
                        "shootingSessionsCount",
                        parseInt(e.target.value) || 0,
                      )
                    }
                    min="0"
                  />
                </div>
              </div>
            </section>
          )}

          {formData.serviceProvided === "Production" && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Production Details</h3>
              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label>Videos Count</label>
                  <input
                    type="number"
                    value={formData.production.videosCount}
                    onChange={(e) =>
                      handleNestedChange(
                        "production",
                        "videosCount",
                        parseInt(e.target.value) || 0,
                      )
                    }
                    min="0"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Pictures Count</label>
                  <input
                    type="number"
                    value={formData.production.picturesCount}
                    onChange={(e) =>
                      handleNestedChange(
                        "production",
                        "picturesCount",
                        parseInt(e.target.value) || 0,
                      )
                    }
                    min="0"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Shooting Sessions</label>
                  <input
                    type="number"
                    value={formData.production.shootingSessionsCount}
                    onChange={(e) =>
                      handleNestedChange(
                        "production",
                        "shootingSessionsCount",
                        parseInt(e.target.value) || 0,
                      )
                    }
                    min="0"
                  />
                </div>
              </div>
            </section>
          )}

          {formData.serviceProvided === "Development" && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Development Details</h3>
              <div className={styles.formGroup}>
                <label>Service Description *</label>
                <textarea
                  value={formData.development.description}
                  onChange={(e) =>
                    handleNestedChange(
                      "development",
                      "description",
                      e.target.value,
                    )
                  }
                  rows="4"
                  className={errors.developmentDescription ? styles.error : ""}
                />
                {errors.developmentDescription && (
                  <span className={styles.errorText}>
                    {errors.developmentDescription}
                  </span>
                )}
              </div>
              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label>Platform *</label>
                  <select
                    value={formData.development.platform}
                    onChange={(e) =>
                      handleNestedChange(
                        "development",
                        "platform",
                        e.target.value,
                      )
                    }
                  >
                    <option value="Web">Web</option>
                    <option value="Mobile">Mobile</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Type/Complexity *</label>
                  <select
                    value={formData.development.typeComplexity}
                    onChange={(e) =>
                      handleNestedChange(
                        "development",
                        "typeComplexity",
                        e.target.value,
                      )
                    }
                  >
                    <option value="Vitrine">Vitrine</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>
            </section>
          )}

          {/* Tools Usage */}
          {showToolsUsage && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <MdBuildCircle /> Tools Usage (auto-calculated by purchase
                price)
              </h3>
              {errors.toolsUsage && (
                <div className={styles.errorBox}>{errors.toolsUsage}</div>
              )}

              {formData.toolsUsage.length > 0 && (
                <div className={styles.infoBox}>
                  <strong>Total Equipment Cost:</strong>{" "}
                  {formData.toolsUsage
                    .reduce((sum, tu) => {
                      const tool = tools.find((t) => t._id === tu.tool);
                      return sum + (tool?.purchasePrice || 0);
                    }, 0)
                    .toLocaleString()}{" "}
                  TND
                </div>
              )}

              <div className={styles.toolsGrid}>
                {tools.map((tool) => {
                  const usage = formData.toolsUsage.find(
                    (t) => t.tool === tool._id,
                  );
                  return (
                    <div
                      key={tool._id}
                      className={`${styles.toolItem} ${usage ? styles.toolItemActive : ""}`}
                    >
                      <label className={styles.toolLabel}>
                        <input
                          type="checkbox"
                          checked={!!usage}
                          onChange={() => toggleToolUsage(tool._id)}
                        />
                        <div className={styles.toolNamePrice}>
                          <span>{tool.name}</span>
                          <span className={styles.toolPrice}>
                            {(tool.purchasePrice || 0).toLocaleString()} TND
                          </span>
                        </div>
                      </label>
                      {usage && (
                        <span className={styles.toolPercentBadge}>
                          {usage.percentage.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {formData.toolsUsage.length > 0 && (
                <div
                  className={`${styles.totalBadge} ${Math.abs(calculateToolsTotal() - 100) < 0.01 ? styles.valid : styles.invalid}`}
                >
                  Total: {calculateToolsTotal().toFixed(2)}%
                </div>
              )}
            </section>
          )}

          {/* Team Assignment */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <MdGroup /> Team Assignment &amp; Share Distribution (must total
              100%)
            </h3>
            {errors.teamMemberShares && (
              <div className={styles.errorBox}>{errors.teamMemberShares}</div>
            )}

            {formData.teamMembers.length > 0 && (
              <div className={styles.infoBox}>
                <strong>Total Team Share Amount:</strong>{" "}
                {getTotalTeamAmount().toFixed(2)} TND
                <span className={styles.muted}>
                  {" "}
                  (from {formData.revenueDistribution.teamShare}% of{" "}
                  {formData.totalPrice} TND)
                </span>
              </div>
            )}

            <div className={styles.teamGrid}>
              {teamMembers.map((member) => {
                const isSelected = formData.teamMembers.includes(member._id);
                const memberShare = formData.teamMemberShares.find(
                  (s) => s.memberId === member._id,
                );

                return (
                  <div key={member._id} className={styles.teamMemberCard}>
                    <label className={styles.teamMemberHeader}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleTeamMemberToggle(member._id)}
                      />
                      <div className={styles.memberInfo}>
                        <span className={styles.memberName}>{member.name}</span>
                        <span className={styles.memberRole}>{member.role}</span>
                      </div>
                    </label>

                    {isSelected && memberShare && (
                      <div className={styles.memberShareInputs}>
                        <div className={styles.shareInput}>
                          <label>Share %</label>
                          <input
                            type="number"
                            value={memberShare.percentage}
                            onChange={(e) =>
                              handleTeamMemberShareChange(
                                member._id,
                                e.target.value,
                              )
                            }
                            min="0"
                            max="100"
                            step="0.01"
                            placeholder="0"
                          />
                        </div>
                        <div className={styles.shareAmount}>
                          <label>Amount</label>
                          <span className={styles.amountValue}>
                            {memberShare.amount.toFixed(2)} TND
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {formData.teamMembers.length > 0 && (
              <div
                className={`${styles.totalBadge} ${Math.abs(calculateTeamSharesTotal() - 100) < 0.01 ? styles.valid : styles.invalid}`}
              >
                Total Shares: {calculateTeamSharesTotal().toFixed(2)}%
              </div>
            )}
          </section>

          {/* Form Actions */}
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? (
                <span className={styles.spinner} />
              ) : editData ? (
                <MdSave />
              ) : (
                <MdAdd />
              )}
              {loading
                ? "Saving..."
                : editData
                  ? "Update Service"
                  : "Create Service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceForm;
