# Redix Digital Solutions — Project Architecture

> Generated: February 22, 2026
> Excludes: `node_modules/`, `dist/`, `.git/`

---

## Root

```
redix-digital-solutions/
├── .gitignore
├── README.md
├── ARCHITECTURE.md
├── backend/
├── frontend/
└── Landing page/
```

---

## Backend

```
backend/
├── .env
├── .env.example
├── package.json
├── package-lock.json
├── server.js
├── server.log
├── start-server.ps1
│
├── config/
│   └── db.js
│
├── controllers/
│   ├── auditController.js
│   ├── authController.js
│   ├── backupController.js
│   ├── chargesController.js
│   ├── clientController.js
│   ├── dashboardController.js
│   ├── expensesController.js
│   ├── financialController.js
│   ├── invoiceController.js
│   ├── marketingController.js
│   ├── notificationController.js
│   ├── reportsController.js
│   ├── servicesController.js
│   ├── settingsController.js
│   ├── taskController.js
│   └── toolsController.js
│
├── middleware/
│   ├── auth.js
│   └── errorHandler.js
│
├── models/
│   ├── AppSettings.js
│   ├── AuditLog.js
│   ├── BoardList.js
│   ├── Charge.js
│   ├── Client.js
│   ├── Expense.js
│   ├── FinancialMetrics.js
│   ├── Invoice.js
│   ├── MarketingProject.js
│   ├── Notification.js
│   ├── Service.js
│   ├── Task.js
│   ├── TeamMember.js
│   ├── Tool.js
│   └── User.js
│
├── routes/
│   ├── audit.js
│   ├── auth.js
│   ├── backup.js
│   ├── charges.js
│   ├── clients.js
│   ├── dashboard.js
│   ├── expenses.js
│   ├── financial.js
│   ├── invoices.js
│   ├── marketing.js
│   ├── notifications.js
│   ├── reports.js
│   ├── services.js
│   ├── settings.js
│   ├── tasks.js
│   └── tools.js
│
├── scripts/
│   └── SeedCoreTeam.js
│
└── utils/
    ├── auditLogger.js
    ├── invoicePdf.js
    ├── invoiceXml.js
    └── notificationService.js
```

---

## Frontend (Admin Dashboard)

```
frontend/
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
│
├── public/
│
└── src/
    ├── App.css
    ├── App.jsx
    ├── index.css
    ├── main.jsx
    │
    ├── assets/
    │   └── redix_logo.png
    │
    ├── components/
    │   ├── Charges/
    │   │   ├── ChargeForm.jsx
    │   │   ├── ChargeForm.module.css
    │   │   ├── ChargesManagement.jsx
    │   │   └── ChargesManagement.module.css
    │   │
    │   ├── Clients/
    │   │   ├── ClientCard.jsx
    │   │   ├── ClientCard.module.css
    │   │   ├── ClientForm.jsx
    │   │   ├── ClientForm.module.css
    │   │   ├── ClientsList.jsx
    │   │   └── ClientsList.module.css
    │   │
    │   ├── Dashboard/
    │   │   ├── DashboardOverview.jsx
    │   │   ├── FinancialCard.jsx
    │   │   ├── FinancialCard.module.css
    │   │   ├── MetricCard.jsx
    │   │   ├── MetricCard.module.css
    │   │   ├── RecentRevenue.jsx
    │   │   ├── RecentRevenue.module.css
    │   │   ├── RevenueChart.jsx
    │   │   └── RevenueChart.module.css
    │   │
    │   ├── Invoices/
    │   │   ├── FinanceStats.jsx
    │   │   ├── FinanceStats.module.css
    │   │   ├── InvoiceDetail.jsx
    │   │   ├── InvoiceDetail.module.css
    │   │   ├── InvoiceForm.jsx
    │   │   └── InvoiceForm.module.css
    │   │
    │   ├── Layout/
    │   │   ├── Layout.jsx
    │   │   ├── Layout.module.css
    │   │   ├── Navbar.jsx
    │   │   ├── Navbar.module.css
    │   │   ├── Sidebar.jsx
    │   │   └── Sidebar.module.css
    │   │
    │   ├── Marketing/
    │   │   ├── MarketingProjectForm.jsx
    │   │   ├── MarketingProjectForm.module.css
    │   │   ├── MarketingProjectsList.jsx
    │   │   └── MarketingProjectsList.module.css
    │   │
    │   ├── Services/
    │   │   ├── DeleteConfirmModal.jsx
    │   │   ├── DeleteConfirmModal.module.css
    │   │   ├── ServiceForm.jsx
    │   │   ├── ServiceForm.module.css
    │   │   ├── ServicesList.jsx
    │   │   └── ServicesList.module.css
    │   │
    │   ├── Settings/
    │   │   ├── TeamMemberForm.jsx
    │   │   ├── TeamMemberForm.module.css
    │   │   ├── TeamMembersList.jsx
    │   │   └── TeamMembersList.module.css
    │   │
    │   ├── Tasks/
    │   │   ├── KanbanColumn.jsx
    │   │   ├── KanbanColumn.module.css
    │   │   ├── TaskCard.jsx
    │   │   ├── TaskCard.module.css
    │   │   ├── TaskModal.jsx
    │   │   └── TaskModal.module.css
    │   │
    │   └── Tools/
    │       ├── ToolForm.jsx
    │       ├── ToolForm.module.css
    │       ├── ToolsList.jsx
    │       └── ToolsList.module.css
    │
    ├── context/
    │   ├── AppContext.jsx
    │   └── AuthContext.jsx
    │
    ├── pages/
    │   ├── ActivityLog.jsx
    │   ├── ActivityLog.module.css
    │   ├── Backup.jsx
    │   ├── Backup.module.css
    │   ├── Clients.jsx
    │   ├── Clients.module.css
    │   ├── Dashboard.jsx
    │   ├── Dashboard.module.css
    │   ├── Expenses.jsx
    │   ├── Expenses.module.css
    │   ├── Investing.jsx
    │   ├── Investing.module.css
    │   ├── Invoices.jsx
    │   ├── Invoices.module.css
    │   ├── KanbanBoard.jsx
    │   ├── KanbanBoard.module.css
    │   ├── Login.jsx
    │   ├── Login.module.css
    │   ├── Marketing.jsx
    │   ├── Marketing.module.css
    │   ├── NotFound.jsx
    │   ├── NotFound.module.css
    │   ├── Profile.jsx
    │   ├── Profile.module.css
    │   ├── Reports.jsx
    │   ├── Reports.module.css
    │   ├── Services.jsx
    │   ├── Services.module.css
    │   ├── Settings.jsx
    │   ├── Settings.module.css
    │   ├── TeamMembers.jsx
    │   ├── TeamMembers.module.css
    │   ├── Tools.jsx
    │   └── Tools.module.css
    │
    └── services/
        ├── api.js
        ├── AuditServices.js
        ├── AuthServices.js
        ├── BackupServices.js
        ├── ChargesServices.js
        ├── ClientsServices.js
        ├── DashboardServices.js
        ├── ExpensesServices.js
        ├── FinancialServices.js
        ├── InvoiceServices.js
        ├── MarketingServices.js
        ├── NotificationServices.js
        ├── ReportsServices.js
        ├── ServicesServices.js
        ├── SettingsServices.js
        ├── TasksServices.js
        └── ToolsServices.js
```

---

## Landing Page

```
Landing page/
├── .env
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
│
├── .vscode/
│   └── tasks.json
│
├── public/
│   ├── redix.png
│   │
│   ├── assets/
│   │   ├── icons/
│   │   │   ├── marketing.svg
│   │   │   ├── mobile-dev.svg
│   │   │   ├── moon.png
│   │   │   ├── security.png
│   │   │   ├── social-media.svg
│   │   │   ├── tunisia.png
│   │   │   ├── TunisianGuy.png
│   │   │   ├── ui-ux.svg
│   │   │   ├── video editing.png
│   │   │   ├── video.svg
│   │   │   ├── web-dev.svg
│   │   │   └── world.png
│   │   │
│   │   ├── logos/
│   │   │   ├── aiesec-LOGO.png
│   │   │   ├── coin-logo.png
│   │   │   ├── EFPHQ-Logo.png
│   │   │   ├── ESEN-AMBASSADORS-LOGO.png
│   │   │   ├── esen-manouba.png
│   │   │   ├── esen-microsoft-club-logo.jpg
│   │   │   ├── FLAYES.png
│   │   │   ├── frita-logo.png
│   │   │   ├── G8.png
│   │   │   ├── ghamza.png
│   │   │   ├── IMC-LOGO.png
│   │   │   ├── isamm-logo.png
│   │   │   ├── istore-tn.jpg
│   │   │   ├── JCI-Manouba.png
│   │   │   ├── Moatez-logo.png
│   │   │   ├── novart.png
│   │   │   ├── orchidee-logo.png
│   │   │   ├── redix.png
│   │   │   ├── Redix1.png
│   │   │   └── sbh.png
│   │   │
│   │   ├── screenshots/
│   │   │   ├── cimef/
│   │   │   │   ├── Footer.png
│   │   │   │   ├── main.png
│   │   │   │   ├── NosPartenaires.png
│   │   │   │   └── services.png
│   │   │   ├── ggg/
│   │   │   │   ├── about.png
│   │   │   │   ├── main.png
│   │   │   │   ├── products.png
│   │   │   │   └── store.png
│   │   │   ├── pexa/
│   │   │   │   ├── main.png
│   │   │   │   ├── portfolio.png
│   │   │   │   ├── projects.png
│   │   │   │   └── skills.png
│   │   │   ├── redix/
│   │   │   │   ├── about.png
│   │   │   │   ├── contact.png
│   │   │   │   ├── home.png
│   │   │   │   ├── main.png
│   │   │   │   └── services.png
│   │   │   ├── thehouse/
│   │   │   │   ├── contact.png
│   │   │   │   ├── details.png
│   │   │   │   ├── listings.png
│   │   │   │   └── main.png
│   │   │   └── yesly/
│   │   │       ├── booking.png
│   │   │       ├── courses.png
│   │   │       ├── main.png
│   │   │       └── service.png
│   │   │
│   │   ├── testimonials/
│   │   │   ├── amir_zanned.jpg
│   │   │   ├── ayoub_dabbabi.jpg
│   │   │   ├── Beha_Aroua.jpg
│   │   │   ├── dr_moetaz_alhousayni.jpg
│   │   │   ├── Khairi_Hammami.jpg
│   │   │   ├── koussay_boubaker.jpg
│   │   │   ├── Mahdi_Ben_Mabrouk.png
│   │   │   ├── mahdi_said.jpg
│   │   │   ├── Maram_Mahrouk.jpg
│   │   │   ├── nour_gaddes.jpg
│   │   │   ├── sabri_zoghlemi.jpg
│   │   │   ├── Walid_Ben_Ali.png
│   │   │   ├── yassine_hizaoui.jpg
│   │   │   └── Yosra_Klaï.jpg
│   │   │
│   │   └── video-marketing/
│   │       ├── thumbnails/
│   │       │   ├── Aiesec Start Act after movie event.png
│   │       │   ├── burger pepare.png
│   │       │   ├── BURGER.png
│   │       │   ├── BYBLOS coffee promo.png
│   │       │   ├── corne & sandwish.png
│   │       │   ├── delice1.jpg
│   │       │   ├── EsenCeremony.jpg
│   │       │   ├── EsenFintechAfterMovie.jpg
│   │       │   ├── EsenFintechTeaser.jpg
│   │       │   ├── Ettrot pres.png
│   │       │   ├── flayes pres.png
│   │       │   ├── FRITA CRISPY BURGER.png
│   │       │   ├── jci Freelancini after movie.jpg
│   │       │   ├── KapariLoungePresentation.jpg
│   │       │   ├── LANDSCAPE VERSION jci.png
│   │       │   ├── new product.png
│   │       │   ├── NudeClothingStore1.jpg
│   │       │   ├── NudeClothingStorePresentation2.jpg
│   │       │   ├── PementosPresentation.jpg
│   │       │   ├── PementosPresentation2.jpg
│   │       │   ├── PREPARTION BOX FRIES.png
│   │       │   └── trotinette croissement.png
│   │       │
│   │       └── videos/
│   │           ├── Aiesec Start Act after movie event.mp4
│   │           ├── burger pepare.mov
│   │           ├── BURGER.mov
│   │           ├── BYBLOS coffee promo.mov
│   │           ├── corne & sandwish.mov
│   │           ├── delice1.mov
│   │           ├── EsenFintechTeaser.mov
│   │           ├── Ettrot pres.mov
│   │           ├── flayes pres.mov
│   │           ├── jci Freelancini after movie.mov
│   │           ├── Kapariloungepresentation.mp4
│   │           ├── new product.mov
│   │           ├── Nudeclothingstore1.mp4
│   │           ├── Nudeclothingstorepresentation2.mp4
│   │           ├── PementosPresentation.mov
│   │           ├── Pementospresentation2.mp4
│   │           ├── PREPARTION BOX FRIES.mov
│   │           └── trotinette croissement.mov
│   │
│   ├── clothing-fashion/
│   │   └── videos/
│   │       ├── ssstik.io_@bthelabel.bali_1760406159407.mp4
│   │       ├── ssstik.io_@bthelabel.bali_1760406208258.mp4
│   │       ├── ssstik.io_@bthelabel.bali_1760406224553.mp4
│   │       ├── ssstik.io_@nude_style_marsa_1760405929323.mp4
│   │       ├── ssstik.io_@nude_style_marsa_1760405948092.mp4
│   │       ├── ssstik.io_@nude_style_marsa_1760405996834.mp4
│   │       ├── ssstik.io_@nude_style_marsa_1760406008858.mp4
│   │       ├── ssstik.io_@nude_style_marsa_1760406028218.mp4
│   │       ├── ssstik.io_@nude_style_marsa_1760406037133.mp4
│   │       ├── ssstik.io_@nude_style_marsa_1760406130664.mp4
│   │       ├── ssstik.io_@nude_style_marsa_1760406144179.mp4
│   │       ├── ssstik.io_@roar 2.mp4
│   │       ├── ssstik.io_@roar 3.mp4
│   │       ├── ssstik.io_@roar 4.mp4
│   │       ├── ssstik.io_@roar1.mp4
│   │       ├── ssstik.io_@stripesme_1760406174098.mp4
│   │       └── ssstik.io_@stripesme_1760406187862.mp4
│   │
│   ├── meuble/
│   │   ├── photos/
│   │   │   ├── photo_1@22-10-2025_20-15-05.jpg  →  photo_35@22-10-2025_20-15-47.jpg
│   │   │   └── (35 photos total)
│   │   └── video/
│   │       ├── o0ks3Fg9EEINzC8oAKgeIhQ1fJE16BBUrDkRuF.mp4
│   │       ├── o4KGtAGfuJgPnDIkUlebBBQzFzSAWmQUVDnDCF.mp4
│   │       ├── oAbBI3BkBQAU0OVJBDMkbQOAWFPnleU0tJm3fC.mp4
│   │       ├── oAu8sCBeQgVJ8LDrjb0DtovykQm6VnoelgDQAB.mp4
│   │       ├── ok5PVr9UDBoNccsRiEYQ74aLBEIBtAjLGiRAw.mp4
│   │       ├── okCDAHqfXiNOyIBOIQiB46f6EqLngerFCS82Cj.mp4
│   │       ├── oUhVucUWKu7jBHzyBQNZfIAJQfIPIB3XBtlk4C.mp4
│   │       └── oUI9xvQEYGUEKyFmVAoici3TbhBaQLAwBCICi.mp4
│   │
│   ├── restaurant/
│   │   └── videos/
│   │       ├── Food (1).mp4
│   │       ├── Food (2).mp4  →  Food (12).mp4
│   │       └── (12 videos total)
│   │
│   └── travel-agency/
│       └── video/
│           ├── @samatourslb 1.mp4  →  @samatourslb 5.mp4
│           ├── @yallatravelagency 1.mp4  →  @yallatravelagency 9.mp4
│           └── (14 videos total)
│
└── src/
    ├── App.css
    ├── App.jsx
    ├── main.jsx
    │
    ├── context/
    │   └── ThemeContext.jsx
    │
    ├── hooks/
    │   └── useScrollLock.js
    │
    ├── styles/
    │   └── theme.css
    │
    └── modules/
        └── public/
            ├── PublicLayout.jsx
            ├── i18n.js
            │
            ├── components/
            │   ├── AnimatedBackground/
            │   │   ├── AnimatedBackground.jsx
            │   │   └── AnimatedBackground.module.css
            │   ├── Banner/
            │   │   ├── Banner.jsx
            │   │   └── Banner.module.css
            │   ├── BookCall/
            │   │   ├── BookCall.jsx
            │   │   └── BookCall.module.css
            │   ├── BookingModal/
            │   │   ├── BookingModal.jsx
            │   │   └── BookingModal.module.css
            │   ├── ChatPopup/
            │   │   ├── ChatPopup.jsx
            │   │   └── ChatPopup.module.css
            │   ├── DevProject/
            │   │   ├── DevProject.jsx
            │   │   ├── DevProject.module.css
            │   │   └── ProjectModal/
            │   │       ├── ProjectModal.jsx
            │   │       └── ProjectModal.module.css
            │   ├── Footer/
            │   │   ├── Footer.jsx
            │   │   └── Footer.module.css
            │   ├── LoadingScreen/
            │   │   ├── LoadingScreen.jsx
            │   │   └── LoadingScreen.module.css
            │   ├── Navbar/
            │   │   ├── Navbar.jsx
            │   │   └── Navbar.module.css
            │   ├── Portfolio/
            │   │   ├── ChefGallery.jsx
            │   │   ├── FashionGallery.jsx
            │   │   ├── FurnitureGallery.jsx
            │   │   ├── PortfolioGallery.module.css
            │   │   └── TravelGallery.jsx
            │   ├── Services/
            │   │   ├── ServiceCard.jsx
            │   │   ├── ServiceCard.module.css
            │   │   ├── Services.jsx
            │   │   ├── Services.module.css
            │   │   ├── ServicesChatPopup.jsx
            │   │   └── ServicesChatPopup.module.css
            │   ├── SupportWidget/
            │   │   ├── SupportWidget.jsx
            │   │   └── SupportWidget.module.css
            │   ├── Testimonials/
            │   │   ├── Testimonials.jsx
            │   │   └── Testimonials.module.css
            │   ├── TrustedBy/
            │   │   ├── TrustedBy.jsx
            │   │   └── TrustedBy.module.css
            │   ├── VideoShowcase/
            │   │   ├── VideoShowcase.jsx
            │   │   └── VideoShowcase.module.css
            │   └── WhyChooseUs/
            │       ├── WhyChooseUs.jsx
            │       └── WhyChooseUs.module.css
            │
            ├── data/
            │   ├── clients.js
            │   ├── portfolioData.js
            │   ├── services.js
            │   ├── testimonials.js
            │   ├── videoShowcase.js
            │   └── websites.js
            │
            ├── locales/
            │   ├── ar.json
            │   ├── en.json
            │   └── fr.json
            │
            ├── pages/
            │   ├── Chef.jsx
            │   ├── Fashion.jsx
            │   ├── Furniture.jsx
            │   ├── Home.jsx
            │   ├── NotFound.jsx
            │   ├── NotFound.module.css
            │   ├── Portfolio.module.css
            │   └── Travel.jsx
            │
            ├── services/
            │   └── telegramService.js
            │
            └── styles/
                ├── animations.css
                ├── global.css
                ├── public-app.css
                └── variables.css
```
