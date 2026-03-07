import Service from "../models/Service.js";
import AdsSettings from "../models/AdsSettings.js";
import Client from "../models/Client.js";
import TeamMember from "../models/TeamMember.js";
import Tool from "../models/Tool.js";
import FinancialMetrics from "../models/FinancialMetrics.js";
import { logAudit } from "../utils/auditLogger.js";
import { createNotification } from "../utils/notificationService.js";
import { Parser } from "json2csv";
import PDFDocument from "pdfkit";

// Get all projects with filters, search, sort, and pagination
export const getServices = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      category = "",
      sortBy = "createdAt",
      sortOrder = "desc",
      paymentStatus = "",
      projectStatus = "",
      serviceStatus = "",
      clientId = "",
    } = req.query;

    const statusFilter = projectStatus || serviceStatus;

    // Build query
    let query = {};

    // Filter by category (service provided)
    if (category) {
      query.serviceProvided = category;
    }

    // Filter by payment status
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    // Filter by project status
    if (statusFilter) {
      query.projectStatus = statusFilter;
    }

    // Filter by client
    if (clientId) {
      query.client = clientId;
    }

    // For team members, only show projects they're assigned to
    // if (req.user && req.user.role && req.user.role.toLowerCase() === 'team member') {
    //     query.teamMembers = req.user.id;
    // }

    // Execute query with pagination
    let projectsQuery = Service.find(query)
      .populate("client", "businessName ownerName email")
      .populate("teamMembers", "name email role")
      .populate("toolsUsage.tool", "name category")
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    let projects = await projectsQuery;

    // Apply search filter (after fetching with populated fields)
    if (search) {
      const searchLower = search.toLowerCase();
      projects = projects.filter(
        (project) =>
          (project.projectName &&
            project.projectName.toLowerCase().includes(searchLower)) ||
          (project.client &&
            project.client.businessName &&
            project.client.businessName.toLowerCase().includes(searchLower)),
      );
    }

    // Get total count for pagination
    const total = await Service.countDocuments(query);

    res.json({
      services: projects,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get single project by ID
export const getServiceById = async (req, res) => {
  try {
    const project = await Service.findById(req.params.id)
      .populate("client", "businessName ownerName email phone address")
      .populate("teamMembers", "name email role profileImage")
      .populate("toolsUsage.tool", "name category purchasePrice")
      .populate("notes.author", "name email")
      .populate("attachments.uploadedBy", "name email")
      .populate("createdBy", "name email")
      .populate("lastModifiedBy", "name email");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check permissions for team members
    // if (req.user && req.user.role && req.user.role.toLowerCase() === 'team member') {
    //     const isAssigned = Service.teamMembers.some(
    //         member => member._id.toString() === req.user.id.toString()
    //     );
    //     if (!isAssigned) {
    //         return res.status(403).json({ message: 'You are not authorized to access this project' });
    //     }
    // }

    res.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({ message: error.message });
  }
};

// Create new project
export const createService = async (req, res) => {
  try {
    const projectData = {
      ...req.body,
      // createdBy: req.user?.id,
      // lastModifiedBy: req.user?.id
    };

    const project = new Service(projectData);
    await project.save();

    // Populate references
    await project.populate("client teamMembers toolsUsage.tool");

    // Add ads fees to reservedTND only when project is already paid (Done)
    if (
      project.paymentStatus === "Done" &&
      project.adsFees?.enabled &&
      project.adsFees.amountTND > 0
    ) {
      await AdsSettings.findOneAndUpdate(
        {},
        { $inc: { reservedTND: project.adsFees.amountTND } },
        { upsert: true },
      );
    }

    // Distribute tools & charges revenue to tools when payment is Done
    if (
      project.paymentStatus === "Done" &&
      project.toolsUsage &&
      project.toolsUsage.length > 0
    ) {
      const toolsChargesAmount =
        (project.totalPrice *
          (project.revenueDistribution?.toolsAndCharges || 0)) /
        100;
      for (const usage of project.toolsUsage) {
        const tool = await Tool.findById(usage.tool._id || usage.tool);
        if (tool && tool.payoffPercentage < 100) {
          const shareAmount = (toolsChargesAmount * usage.percentage) / 100;
          const remaining = tool.purchasePrice - tool.revenueCounter;
          tool.revenueCounter += Math.min(shareAmount, remaining);
          tool.usageCount = (tool.usageCount || 0) + 1;
          tool.lastUsed = new Date();
          tool.calculatePayoff();
          await tool.save();
        }
      }
    }

    // Add entry to Redix Caisse History when project is created as Done
    if (project.paymentStatus === "Done") {
      const caisseAmount =
        (project.totalPrice * (project.revenueDistribution?.redixCaisse || 0)) /
        100;
      if (caisseAmount > 0) {
        const metricsDoc = await FinancialMetrics.getInstance();
        metricsDoc.depositHistory.push({
          amount: caisseAmount,
          description: `Revenue Distribution — "${project.projectName}"`,
          source: "Service Payment",
          date: new Date(),
        });
        await metricsDoc.save();
      }
    }

    // Auto-add share amounts based on payment status
    if (project.teamMemberShares && project.teamMemberShares.length > 0) {
      for (const share of project.teamMemberShares) {
        const member = await TeamMember.findById(share.memberId);
        if (member && share.amount > 0) {
          if (project.paymentStatus === "Done") {
            // Payment is Done → add to totalReceived
            member.addEarning(
              share.amount,
              project._id,
              `Share from project "${project.projectName}"`,
            );
          } else {
            // Payment is Pending → add to pendingEarnings only
            member.addPendingEarning(
              share.amount,
              project._id,
              `Pending share from project "${project.projectName}"`,
            );
          }
          await member.save();
        }
      }
    }

    // Log audit
    await logAudit(
      {
        action: "create",
        entityType: "Project",
        entityId: project._id,
        details: {
          projectName: project.projectName,
          totalPrice: project.totalPrice,
          paymentStatus: project.paymentStatus,
        },
      },
      req,
    );

    // Send notifications to assigned team members
    if (project.teamMembers && project.teamMembers.length > 0) {
      for (const member of project.teamMembers) {
        await createNotification(
          member._id,
          `You have been assigned to project "${project.projectName}"`,
          "info",
          project._id,
        );
      }
    }

    res.status(201).json(project);
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(400).json({ message: error.message });
  }
};

// Update project
export const updateService = async (req, res) => {
  try {
    const oldProject = await Service.findById(req.params.id).populate(
      "teamMembers",
    );

    if (!oldProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Store old values for comparison
    const oldPaymentStatus = oldProject.paymentStatus;
    const oldProjectStatus = oldProject.projectStatus;
    const oldTeamMembers = oldProject.teamMembers.map((m) => m._id.toString());
    const oldTeamMemberShares = oldProject.teamMemberShares || [];

    // Update project
    const updatedData = {
      ...req.body,
      // lastModifiedBy: req.user?.id
    };

    const project = await Service.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true, runValidators: true },
    ).populate("client teamMembers toolsUsage.tool");

    // Adjust AdsSettings.reservedTND based on adsFees change — only count when payment is Done
    const oldAdsFeesTND = oldProject.adsFees?.enabled
      ? oldProject.adsFees.amountTND || 0
      : 0;
    const newAdsFeesTND = project.adsFees?.enabled
      ? project.adsFees.amountTND || 0
      : 0;
    const oldDone = oldPaymentStatus === "Done";
    const newDone = project.paymentStatus === "Done";
    let adsFeeDiff = 0;
    if (oldDone && newDone) adsFeeDiff = newAdsFeesTND - oldAdsFeesTND;
    else if (!oldDone && newDone) adsFeeDiff = newAdsFeesTND;
    else if (oldDone && !newDone) adsFeeDiff = -oldAdsFeesTND;
    if (Math.abs(adsFeeDiff) > 0.001) {
      await AdsSettings.findOneAndUpdate(
        {},
        { $inc: { reservedTND: adsFeeDiff } },
        { upsert: true },
      );
    }

    // --- Update team member financials based on payment status ---
    const newTeamMemberShares = project.teamMemberShares || [];
    const oldShareMap = {};
    oldTeamMemberShares.forEach((s) => {
      oldShareMap[s.memberId.toString()] = s.amount || 0;
    });
    const newShareMap = {};
    newTeamMemberShares.forEach((s) => {
      newShareMap[s.memberId.toString()] = s.amount || 0;
    });

    const paymentBecameDone =
      project.paymentStatus === "Done" && oldPaymentStatus !== "Done";
    const paymentBecamePending =
      project.paymentStatus !== "Done" && oldPaymentStatus === "Done";

    // Collect all affected member IDs
    const allMemberIds = new Set([
      ...Object.keys(oldShareMap),
      ...Object.keys(newShareMap),
    ]);

    for (const memberId of allMemberIds) {
      const oldAmount = oldShareMap[memberId] || 0;
      const newAmount = newShareMap[memberId] || 0;
      const member = await TeamMember.findById(memberId);
      if (!member) continue;

      if (paymentBecameDone) {
        // Payment just became Done: convert pending to received
        if (oldAmount > 0) {
          member.pendingEarnings = Math.max(
            0,
            member.pendingEarnings - oldAmount,
          );
        }
        if (newAmount > 0) {
          member.addEarning(
            newAmount,
            project._id,
            `Payment confirmed for project "${project.projectName}"`,
          );
        }
      } else if (paymentBecamePending) {
        // Payment reverted to Pending: reverse received, add back to pending
        if (oldAmount > 0) {
          member.reverseEarning(oldAmount, project._id);
        }
        if (newAmount > 0) {
          member.addPendingEarning(newAmount, project._id);
        }
      } else if (project.paymentStatus === "Done") {
        // Already Done, shares changed
        const diff = newAmount - oldAmount;
        if (Math.abs(diff) > 0.01) {
          if (diff > 0) {
            member.addEarning(
              diff,
              project._id,
              `Share increased for project "${project.projectName}"`,
            );
          } else {
            member.reverseEarning(Math.abs(diff), project._id);
          }
        }
      } else {
        // Still Pending, shares changed
        const diff = newAmount - oldAmount;
        if (Math.abs(diff) > 0.01) {
          member.pendingEarnings += diff;
        }
      }

      await member.save();
    }

    // Log audit
    await logAudit(
      {
        action: "update",
        entityType: "Project",
        entityId: project._id,
        details: {
          projectName: project.projectName,
          changes: {
            paymentStatus:
              oldPaymentStatus !== project.paymentStatus
                ? { from: oldPaymentStatus, to: project.paymentStatus }
                : undefined,
            projectStatus:
              oldProjectStatus !== project.projectStatus
                ? { from: oldProjectStatus, to: project.projectStatus }
                : undefined,
          },
        },
      },
      req,
    );

    // Send notifications for status changes
    if (project.paymentStatus !== oldPaymentStatus) {
      // Distribute tools & charges revenue when payment becomes Done
      if (
        project.paymentStatus === "Done" &&
        oldPaymentStatus !== "Done" &&
        project.toolsUsage &&
        project.toolsUsage.length > 0
      ) {
        const toolsChargesAmount =
          (project.totalPrice *
            (project.revenueDistribution?.toolsAndCharges || 0)) /
          100;
        for (const usage of project.toolsUsage) {
          const toolId = usage.tool?._id || usage.tool;
          const tool = await Tool.findById(toolId);
          if (tool && tool.payoffPercentage < 100) {
            const shareAmount = (toolsChargesAmount * usage.percentage) / 100;
            const remaining = tool.purchasePrice - tool.revenueCounter;
            tool.revenueCounter += Math.min(shareAmount, remaining);
            tool.usageCount = (tool.usageCount || 0) + 1;
            tool.lastUsed = new Date();
            tool.calculatePayoff();
            await tool.save();
          }
        }
      }

      // Add entry to Redix Caisse History after Revenue Distribution
      if (project.paymentStatus === "Done" && oldPaymentStatus !== "Done") {
        const caisseAmount =
          (project.totalPrice *
            (project.revenueDistribution?.redixCaisse || 0)) /
          100;
        if (caisseAmount > 0) {
          const metricsDoc = await FinancialMetrics.getInstance();
          metricsDoc.depositHistory.push({
            amount: caisseAmount,
            description: `Revenue Distribution — "${project.projectName}"`,
            source: "service_payment",
            date: new Date(),
          });
          await metricsDoc.save();
        }
      }

      // Notify team members about payment status change
      for (const member of project.teamMembers) {
        await createNotification(
          member._id,
          project.paymentStatus === "Done"
            ? `Payment for "${project.projectName}" is Done. Your earnings have been added!`
            : `Payment status for "${project.projectName}" changed to ${project.paymentStatus}`,
          "success",
          project._id,
        );
      }
    }

    if (project.projectStatus !== oldProjectStatus) {
      // Notify team members
      for (const member of project.teamMembers) {
        await createNotification(
          member._id,
          `Status for "${project.projectName}" changed from ${oldProjectStatus} to ${project.projectStatus}`,
          "info",
          project._id,
        );
      }
    }

    // Check for team assignment changes (notification only)
    const newTeamMembers = project.teamMembers.map((m) => m._id.toString());
    const addedMembers = newTeamMembers.filter(
      (m) => !oldTeamMembers.includes(m),
    );
    const removedMembers = oldTeamMembers.filter(
      (m) => !newTeamMembers.includes(m),
    );

    // Notify newly assigned members
    for (const memberId of addedMembers) {
      await createNotification(
        memberId,
        `You have been assigned to project "${project.projectName}"`,
        "info",
        project._id,
      );
    }

    // Notify removed members
    for (const memberId of removedMembers) {
      await createNotification(
        memberId,
        `You have been removed from project "${project.projectName}"`,
        "warning",
        project._id,
      );
    }

    res.json(project);
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(400).json({ message: error.message });
  }
};

// Delete project
export const deleteService = async (req, res) => {
  try {
    const project = await Service.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Verify project name for confirmation
    const { confirmName } = req.body;
    if (confirmName !== project.projectName) {
      return res
        .status(400)
        .json({ message: "Project name does not match. Deletion cancelled." });
    }

    // Clean up team member financials before deleting
    if (project.teamMemberShares && project.teamMemberShares.length > 0) {
      for (const share of project.teamMemberShares) {
        if (!share.memberId || !share.amount || share.amount <= 0) continue;
        const member = await TeamMember.findById(share.memberId);
        if (!member) continue;

        if (project.paymentStatus === "Done") {
          // Reverse confirmed earnings
          member.reverseEarning(share.amount, project._id);
        } else {
          // Remove pending earnings
          member.pendingEarnings = Math.max(
            0,
            member.pendingEarnings - share.amount,
          );
        }
        await member.save();
      }
    }

    // Delete the project
    await Service.findByIdAndDelete(req.params.id);

    // Log audit
    await logAudit(
      {
        action: "delete",
        entityType: "Project",
        entityId: project._id,
        details: { projectName: project.projectName },
      },
      req,
    );

    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ message: error.message });
  }
};

// Add note to project
export const addNote = async (req, res) => {
  try {
    const { content } = req.body;

    const project = await Service.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    project.notes.push({
      content,
      // author: req.user?.id,
      createdAt: new Date(),
    });

    await project.save();
    await project.populate("notes.author", "name email");

    // Log audit
    await logAudit(
      {
        action: "note_added",
        entityType: "Project",
        entityId: project._id,
        details: { note: content },
      },
      req,
    );

    res.json(project.notes[project.notes.length - 1]);
  } catch (error) {
    console.error("Error adding note:", error);
    res.status(400).json({ message: error.message });
  }
};

// Add attachment to project
export const addAttachment = async (req, res) => {
  try {
    const { fileName, fileUrl, fileSize } = req.body;

    const project = await Service.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    project.attachments.push({
      fileName,
      fileUrl,
      fileSize,
      // uploadedBy: req.user?.id,
      uploadedAt: new Date(),
    });

    await project.save();
    await project.populate("attachments.uploadedBy", "name email");

    // Log audit
    await logAudit(
      {
        action: "attachment_added",
        entityType: "Project",
        entityId: project._id,
        details: { fileName },
      },
      req,
    );

    res.json(project.attachments[project.attachments.length - 1]);
  } catch (error) {
    console.error("Error adding attachment:", error);
    res.status(400).json({ message: error.message });
  }
};

// Export projects to CSV
export const exportToCSV = async (req, res) => {
  try {
    const { category = "", paymentStatus = "", projectStatus = "" } = req.query;

    // Build query
    let query = {};
    if (category) query.serviceProvided = category;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (projectStatus) query.projectStatus = projectStatus;

    // For team members, only export projects they're assigned to
    // if (req.user && req.user.role && req.user.role.toLowerCase() === 'team member') {
    //     query.teamMembers = req.user.id;
    // }

    const projects = await Service.find(query)
      .populate("client", "businessName")
      .populate("teamMembers", "name")
      .lean();

    // Prepare data for CSV
    const csvData = projects.map((project) => ({
      "Project Name": project.projectName,
      Client: project.client?.businessName || "N/A",
      Service: project.serviceProvided,
      "Start Date": new Date(project.startDate).toLocaleDateString(),
      "End Date": new Date(project.endDate).toLocaleDateString(),
      "Payment Status": project.paymentStatus,
      "Project Status": project.projectStatus,
      "Total Price": project.totalPrice,
      "Team Members":
        project.teamMembers?.map((m) => m.name).join(", ") || "N/A",
    }));

    const parser = new Parser();
    const csv = parser.parse(csvData);

    res.header("Content-Type", "text/csv");
    res.attachment(`projects-export-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    console.error("Error exporting to CSV:", error);
    res.status(500).json({ message: error.message });
  }
};

export const exportToPDF = async (req, res) => {
  try {
    const { category = "", paymentStatus = "", projectStatus = "" } = req.query;

    // Build query
    let query = {};
    if (category) query.serviceProvided = category;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (projectStatus) query.projectStatus = projectStatus;

    // For team members, only export projects they're assigned to
    // if (req.user && req.user.role && req.user.role.toLowerCase() === 'team member') {
    //     query.teamMembers = req.user.id;
    // }

    const projects = await Service.find(query)
      .populate("client", "businessName")
      .lean();

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });

    res.header("Content-Type", "application/pdf");
    res.attachment(`projects-export-${Date.now()}.pdf`);
    doc.pipe(res);

    // Add title
    doc.fontSize(20).text("Projects Report", { align: "center" });
    doc.moveDown();
    doc
      .fontSize(10)
      .text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });
    doc.moveDown(2);

    // Add projects
    projects.forEach((project, index) => {
      if (index > 0) doc.moveDown();

      doc
        .fontSize(14)
        .text(`${index + 1}. ${project.projectName}`, { underline: true });
      doc.fontSize(10);
      doc.text(`Client: ${project.client?.businessName || "N/A"}`);
      doc.text(`Service: ${project.serviceProvided}`);
      doc.text(
        `Start Date: ${new Date(project.startDate).toLocaleDateString()}`,
      );
      doc.text(`End Date: ${new Date(project.endDate).toLocaleDateString()}`);
      doc.text(`Payment Status: ${project.paymentStatus}`);
      doc.text(`Project Status: ${project.projectStatus}`);
      doc.text(`Total Price: ${project.totalPrice.toFixed(2)} TND`);

      if (doc.y > 700) {
        doc.addPage();
      }
    });

    doc.end();
  } catch (error) {
    console.error("Error exporting to PDF:", error);
    res.status(500).json({ message: error.message });
  }
};

// Inline update payment/project status (PATCH)
export const updateServiceStatus = async (req, res) => {
  try {
    const { paymentStatus, projectStatus } = req.body;
    const project = await Service.findById(req.params.id).populate(
      "teamMembers",
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const oldPaymentStatus = project.paymentStatus;
    const oldProjectStatus = project.projectStatus;

    if (paymentStatus !== undefined) project.paymentStatus = paymentStatus;
    if (projectStatus !== undefined) project.projectStatus = projectStatus;

    await project.save();
    await project.populate("client teamMembers toolsUsage.tool");

    // Handle payment status transition for financials
    const paymentBecameDone =
      project.paymentStatus === "Done" && oldPaymentStatus !== "Done";
    const paymentBecamePending =
      (project.paymentStatus === "Pending" ||
        project.paymentStatus === "Partial") &&
      oldPaymentStatus === "Done";

    if (paymentBecameDone) {
      // Distribute tools revenue
      if (project.toolsUsage && project.toolsUsage.length > 0) {
        const toolsChargesAmount =
          (project.totalPrice *
            (project.revenueDistribution?.toolsAndCharges || 0)) /
          100;
        for (const usage of project.toolsUsage) {
          const toolId = usage.tool?._id || usage.tool;
          const tool = await Tool.findById(toolId);
          if (tool && tool.payoffPercentage < 100) {
            const shareAmount = (toolsChargesAmount * usage.percentage) / 100;
            const remaining = tool.purchasePrice - tool.revenueCounter;
            tool.revenueCounter += Math.min(shareAmount, remaining);
            tool.usageCount = (tool.usageCount || 0) + 1;
            tool.lastUsed = new Date();
            tool.calculatePayoff();
            await tool.save();
          }
        }
      }

      // Convert pending earnings to received
      if (project.teamMemberShares && project.teamMemberShares.length > 0) {
        for (const share of project.teamMemberShares) {
          const member = await TeamMember.findById(share.memberId);
          if (member && share.amount > 0) {
            member.pendingEarnings = Math.max(
              0,
              member.pendingEarnings - share.amount,
            );
            member.addEarning(
              share.amount,
              project._id,
              `Payment confirmed for project "${project.projectName}"`,
            );
            await member.save();
          }
        }
      }

      // Add entry to Redix Caisse History after Revenue Distribution
      const caisseAmount =
        (project.totalPrice * (project.revenueDistribution?.redixCaisse || 0)) /
        100;
      if (caisseAmount > 0) {
        const metricsDoc = await FinancialMetrics.getInstance();
        metricsDoc.depositHistory.push({
          amount: caisseAmount,
          description: `Revenue Distribution — "${project.projectName}"`,
          source: "service_payment",
          date: new Date(),
        });
        await metricsDoc.save();
      }

      // Add ads fees to reservedTND now that payment is Done
      if (project.adsFees?.enabled && project.adsFees.amountTND > 0) {
        await AdsSettings.findOneAndUpdate(
          {},
          { $inc: { reservedTND: project.adsFees.amountTND } },
          { upsert: true },
        );
      }
    }

    if (
      paymentBecamePending &&
      project.adsFees?.enabled &&
      project.adsFees.amountTND > 0
    ) {
      // Revert ads fees if payment reverted from Done
      await AdsSettings.findOneAndUpdate(
        {},
        { $inc: { reservedTND: -project.adsFees.amountTND } },
        { upsert: true },
      );
    }

    // Send notifications
    if (project.paymentStatus !== oldPaymentStatus && project.teamMembers) {
      for (const member of project.teamMembers) {
        await createNotification(
          member._id,
          project.paymentStatus === "Done"
            ? `Payment for "${project.projectName}" is Done. Your earnings have been added!`
            : `Payment status for "${project.projectName}" changed to ${project.paymentStatus}`,
          project.paymentStatus === "Done" ? "success" : "info",
          project._id,
        );
      }
    }

    if (project.projectStatus !== oldProjectStatus && project.teamMembers) {
      for (const member of project.teamMembers) {
        await createNotification(
          member._id,
          `Status for "${project.projectName}" changed from ${oldProjectStatus} to ${project.projectStatus}`,
          "info",
          project._id,
        );
      }
    }

    await logAudit(
      {
        action:
          paymentStatus !== undefined
            ? "payment_status_change"
            : "status_change",
        entityType: "Project",
        entityId: project._id,
        details: {
          projectName: project.projectName,
          changes: {
            paymentStatus:
              oldPaymentStatus !== project.paymentStatus
                ? { from: oldPaymentStatus, to: project.paymentStatus }
                : undefined,
            projectStatus:
              oldProjectStatus !== project.projectStatus
                ? { from: oldProjectStatus, to: project.projectStatus }
                : undefined,
          },
        },
      },
      req,
    );

    res.json(project);
  } catch (error) {
    console.error("Error updating project status:", error);
    res.status(400).json({ message: error.message });
  }
};

// Record a partial payment
export const recordPartialPayment = async (req, res) => {
  try {
    const { amount } = req.body;
    const project = await Service.findById(req.params.id).populate(
      "teamMembers",
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!amount || amount <= 0) {
      return res
        .status(400)
        .json({ message: "Payment amount must be greater than 0" });
    }

    const oldPaymentStatus = project.paymentStatus;
    project.amountPaid = Math.min(
      (project.amountPaid || 0) + amount,
      project.totalPrice,
    );

    // Auto-set payment status based on amountPaid
    if (project.amountPaid >= project.totalPrice) {
      project.paymentStatus = "Done";
    } else if (project.amountPaid > 0) {
      project.paymentStatus = "Partial";
    }

    await project.save();
    await project.populate("client teamMembers toolsUsage.tool");

    // If payment just became Done, handle financials
    if (project.paymentStatus === "Done" && oldPaymentStatus !== "Done") {
      if (project.toolsUsage && project.toolsUsage.length > 0) {
        const toolsChargesAmount =
          (project.totalPrice *
            (project.revenueDistribution?.toolsAndCharges || 0)) /
          100;
        for (const usage of project.toolsUsage) {
          const toolId = usage.tool?._id || usage.tool;
          const tool = await Tool.findById(toolId);
          if (tool && tool.payoffPercentage < 100) {
            const shareAmount = (toolsChargesAmount * usage.percentage) / 100;
            const remaining = tool.purchasePrice - tool.revenueCounter;
            tool.revenueCounter += Math.min(shareAmount, remaining);
            tool.usageCount = (tool.usageCount || 0) + 1;
            tool.lastUsed = new Date();
            tool.calculatePayoff();
            await tool.save();
          }
        }
      }

      if (project.teamMemberShares && project.teamMemberShares.length > 0) {
        for (const share of project.teamMemberShares) {
          const member = await TeamMember.findById(share.memberId);
          if (member && share.amount > 0) {
            member.pendingEarnings = Math.max(
              0,
              member.pendingEarnings - share.amount,
            );
            member.addEarning(
              share.amount,
              project._id,
              `Payment confirmed for project "${project.projectName}"`,
            );
            await member.save();
          }
        }
      }

      // Add entry to Redix Caisse History after Revenue Distribution
      const caisseAmount =
        (project.totalPrice * (project.revenueDistribution?.redixCaisse || 0)) /
        100;
      if (caisseAmount > 0) {
        const metricsDoc = await FinancialMetrics.getInstance();
        metricsDoc.depositHistory.push({
          amount: caisseAmount,
          description: `Revenue Distribution — "${project.projectName}"`,
          source: "service_payment",
          date: new Date(),
        });
        await metricsDoc.save();
      }

      // Add ads fees to reservedTND now that payment is Done
      if (project.adsFees?.enabled && project.adsFees.amountTND > 0) {
        await AdsSettings.findOneAndUpdate(
          {},
          { $inc: { reservedTND: project.adsFees.amountTND } },
          { upsert: true },
        );
      }
    }

    // Notify team
    if (project.teamMembers) {
      for (const member of project.teamMembers) {
        await createNotification(
          member._id,
          project.paymentStatus === "Done"
            ? `Full payment received for "${project.projectName}"!`
            : `Partial payment of ${amount} TND received for "${project.projectName}" (${project.amountPaid}/${project.totalPrice} TND)`,
          project.paymentStatus === "Done" ? "success" : "info",
          project._id,
        );
      }
    }

    await logAudit(
      {
        action: "payment_status_change",
        entityType: "Project",
        entityId: project._id,
        details: {
          projectName: project.projectName,
          amount,
          amountPaid: project.amountPaid,
          totalPrice: project.totalPrice,
          paymentStatus: project.paymentStatus,
        },
      },
      req,
    );

    res.json(project);
  } catch (error) {
    console.error("Error recording partial payment:", error);
    res.status(400).json({ message: error.message });
  }
};

// Get project statistics (for dashboard)
export const getServiceStats = async (req, res) => {
  try {
    let query = {};

    // For team members, only show stats for projects they're assigned to
    // if (req.user && req.user.role && req.user.role.toLowerCase() === 'team member') {
    //     query.teamMembers = req.user.id;
    // }

    const totalProjects = await Service.countDocuments(query);
    const activeProjects = await Service.countDocuments({
      ...query,
      projectStatus: "In Progress",
    });
    const completedProjects = await Service.countDocuments({
      ...query,
      projectStatus: "Completed",
    });
    const pendingPayments = await Service.countDocuments({
      ...query,
      paymentStatus: "Pending",
    });

    const totalRevenue = await Service.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);

    const overdueProjects = await Service.countDocuments({
      ...query,
      endDate: { $lt: new Date() },
      projectStatus: { $ne: "Completed" },
    });

    res.json({
      totalProjects,
      activeProjects,
      completedProjects,
      pendingPayments,
      overdueProjects,
      totalRevenue: totalRevenue[0]?.total || 0,
    });
  } catch (error) {
    console.error("Error fetching project stats:", error);
    res.status(500).json({ message: error.message });
  }
};

// Toggle or set invoiceIssued flag on a service (PATCH)
export const updateInvoiceIssued = async (req, res) => {
  try {
    const { invoiceIssued } = req.body;
    // Use findByIdAndUpdate to avoid triggering the full pre-save validation hooks
    const project = await Service.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          invoiceIssued: invoiceIssued !== undefined ? invoiceIssued : true,
        },
      },
      { new: true },
    );
    if (!project) return res.status(404).json({ message: "Service not found" });
    await logAudit(
      {
        action: "update",
        entityType: "Service",
        entityId: project._id,
        details: { invoiceIssued: project.invoiceIssued },
      },
      req,
    );
    res.json({ invoiceIssued: project.invoiceIssued });
  } catch (error) {
    console.error("Error updating invoiceIssued:", error);
    res.status(500).json({ message: error.message });
  }
};
