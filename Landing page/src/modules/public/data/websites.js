// src/data/websites.js

const websitesImages = {
  redix: {
    main: "assets/screenshots/redix/main.png",
    screenshots: [
      "assets/screenshots/redix/home.png",
      "assets/screenshots/redix/services.png", 
      "assets/screenshots/redix/about.png",
      "assets/screenshots/redix/contact.png"
    ]
  },
  pexa: {
    main: "assets/screenshots/pexa/main.png",
    screenshots: [
      "assets/screenshots/pexa/portfolio.png",
      "assets/screenshots/pexa/projects.png",
      "assets/screenshots/pexa/skills.png"
    ]
  },
  cimef: {
    main: "assets/screenshots/cimef/main.png", 
    screenshots: [
      "assets/screenshots/cimef/services.png",
      "assets/screenshots/cimef/NosPartenaires.png",
      "assets/screenshots/cimef/Footer.png"
    ]
  },
  thehouse: {
    main: "assets/screenshots/thehouse/main.png",
    screenshots: [
      "assets/screenshots/thehouse/listings.png",
      "assets/screenshots/thehouse/contact.png", 
      "assets/screenshots/thehouse/details.png"
    ]
  },
  yesly: {
    main: "assets/screenshots/yesly/main.png",
    screenshots: [
      "assets/screenshots/yesly/courses.png",
      "assets/screenshots/yesly/booking.png",
      "assets/screenshots/yesly/service.png"
    ]
  },
  ggg: {
    main: "assets/screenshots/ggg/main.png", 
    screenshots: [
      "assets/screenshots/ggg/products.png",
      "assets/screenshots/ggg/about.png",
      "assets/screenshots/ggg/store.png"
    ]
  }
};

export const websites = [
  {
    id: 1,
    title: "Redix Solutions",
    subtitle: "Digital Agency Website", 
    url: "https://www.redixsolutions.pro/",
    description: "Complete digital agency platform featuring service portfolio, team showcase, and client testimonials with modern responsive design.",
    images: websitesImages.redix,
    category: "Corporate",
    industry: "Digital Agency",
    year: "2024",
    client: "Redix Digital",
    status: "Live",
    featured: true,
    technologies: ["React", "Framer Motion", "CSS Modules", "Vite"],
    features: ["Responsive Design", "SEO Optimized", "Performance Optimized", "Modern UI"],
    metrics: {
      loadTime: "< 2s",
      lighthouse: "95+", 
      responsive: "100%"
    }
  },
  {
    id: 2,
    title: "Video editor Portfolio",
    subtitle: "Developer Portfolio",
    url: "https://yassinejeridi.github.io/pexa/",
    description: "Clean and modern developer portfolio showcasing projects, skills, and professional experience with interactive design elements.",
    images: websitesImages.pexa,
    category: "Portfolio", 
    industry: "Personal Branding",
    year: "2024",
    client: "Yassine Jeridi",
    status: "Live",
    featured: true,
    technologies: ["HTML5", "CSS3", "JavaScript", "GitHub Pages"],
    features: ["Interactive Design", "Project Showcase", "Skills Display", "Contact Integration"],
    metrics: {
      loadTime: "< 1.5s",
      lighthouse: "92+",
      responsive: "100%"
    }
  },
  {
    id: 3,
    title: "CIMEF Tunisia",
    subtitle: "Apple Premium Reseller & B2B Solutions",
    url: "https://cimef.tn",
    description: "Corporate web presence for Tunisia’s Apple Premium Reseller and enterprise equipment leader, highlighting retail stores, authorized service, and B2B print and IT solutions.", 
    images: websitesImages.cimef, // keep main + screenshots as configured in your data model
    category: "Corporate",
    industry: "IT Services & Office Equipment",
    year: "2024",
    client: "CIMEF S.A.",
    status: "Live",
    featured: false,
    technologies: ["HTML5", "CSS3", "JavaScript", "Bootstrap"],
    features: [
      "Store & Services Showcase",
      "Apple Premium Reseller Highlight",
      "B2B Solutions Overview",
      "Contact & Support Access"
    ],
    metrics: {
      loadTime: "< 2.5s",
      lighthouse: "90+",
      responsive: "100%"
    }
  },

  {
    id: 4,
    title: "The House RB",
    subtitle: "Real Estate Platform",
    url: "https://yassinejeridi.github.io/TheHouseRB/", 
    description: "Comprehensive real estate platform with property listings, advanced search, detailed property views, and contact management.",
    images: websitesImages.thehouse,
    category: "Real Estate",
    industry: "Property Management",
    year: "2024",
    client: "The House RB",
    status: "Live",
    featured: false,
    technologies: ["HTML5", "CSS3", "JavaScript", "PHP", "MySQL"],
    features: ["Property Listings", "Search Filters", "Image Galleries", "Contact Forms"],
    metrics: {
      loadTime: "< 2.5s",
      lighthouse: "87+",
      responsive: "100%"
    }
  },
  {
    id: 5,
    title: "Yesly Training Center",
    subtitle: "Educational Platform",
    githubUrl: "https://github.com/YassineJeridi/Yesly_training_center",
    description: "Modern educational management system with course catalog, student portal, instructor dashboard, and booking functionality.",
    images: websitesImages.yesly,
    category: "Education",
    industry: "Training & Education", 
    year: "2024",
    client: "Yesly Training Center",
    status: "Screenshots",
    featured: false,
    technologies: ["React", "Vite", "JavaScript", "CSS"],
    features: ["Course Management", "Student Portal", "Booking System", "Responsive Design"],
    metrics: {
      loadTime: "< 2s",
      lighthouse: "90+",
      responsive: "100%"
    }
  },
  {
    id: 6,
    title: "GGG Store",
    subtitle: "E-commerce Platform",
    url: "https://ggguys.store/", 
    description: "Full-featured e-commerce platform with product catalog, shopping cart, user accounts, and secure payment processing.",
    images: websitesImages.ggg,
    category: "E-commerce",
    industry: "Online Retail",
    year: "2024",
    client: "GGG Company",
    status: "Live",
    featured: false,
    technologies: ["React", "Node.js", "JavaScript", "MongoDB"],
    features: ["Product Catalog", "Shopping Cart", "User Accounts", "Payment Processing"],
    metrics: {
      loadTime: "< 2.5s",
      lighthouse: "88+", 
      responsive: "100%"
    }
  }
];

export const categories = [
  "All",
  "Corporate", 
  "Portfolio",
  "Education", 
  "Healthcare",
  "Real Estate",
  "E-commerce"
];

export default websites;
