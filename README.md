# FMX Maintenance Template Manager

A Next.js web application for creating and managing planned maintenance templates for school district HVAC equipment. Generate FMX-compatible Excel import files with ease.

## 🎯 Purpose

This application streamlines the process of creating planned maintenance schedules for HVAC equipment across multiple school buildings. It allows administrators to:

- Define maintenance instruction sets with step-by-step procedures
- Create task templates with complex scheduling (daily, weekly, monthly, yearly)
- Bundle tasks into comprehensive PM templates
- Assign templates to specific equipment
- Export everything as FMX-compatible Excel files

## ✨ Features

### 🏢 **Buildings & Equipment Management**
- Import and manage school buildings and HVAC equipment inventory
- Track equipment types, locations, and FMX naming conventions
- Filter equipment by building for easy organization

### 📋 **Instruction Sets**
- Create detailed maintenance instruction sets
- Define step-by-step procedures with proper ordering
- Ensure unique naming and clear maintenance workflows

### 📅 **Task Templates**
- Set up maintenance tasks with complex scheduling options
- Support for daily, weekly, monthly, and yearly frequencies
- Configurable exclude dates and next due date modes
- Track inventory usage and estimated time requirements

### 📦 **PM Templates**
- Bundle multiple task templates into comprehensive maintenance programs
- Easy drag-and-drop interface for adding/removing tasks
- Template descriptions and organization

### 🔗 **Assignment Management**
- Assign PM templates to specific equipment across buildings
- Filter assignments by building/school for easy management
- View and manage existing assignments with clear overview

### 📊 **FMX Export**
- Generate Excel files in exact FMX Planned Maintenance Import format
- Three specialized sheets: Instructions, Time-based tasks, and Occurrences
- Color-coded headers matching FMX specifications
- Data validation to ensure import compatibility

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- MySQL database
- Admin token for API authentication

### Environment Variables

Create a `.env.local` file in the root directory:

```env
DATABASE_URL="mysql://username:password@localhost:3306/fmx_maintenance"
ADMIN_TOKEN="your-secure-admin-token"
```

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd fmx-exporter
npm install
```

2. **Set up the database:**
```bash
npx prisma generate
npx prisma db push
```

3. **Run the development server:**
```bash
npm run dev
```

4. **Open your browser:**
Navigate to [http://localhost:3000](http://localhost:3000)

### First Time Setup

1. Enter your admin token when prompted
2. Import your buildings and equipment data
3. Create instruction sets for maintenance procedures
4. Define task templates with scheduling
5. Bundle tasks into PM templates
6. Assign templates to equipment
7. Export FMX-compatible spreadsheets

## 🛠 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Database:** MySQL with Prisma ORM
- **Styling:** CSS Modules with design tokens
- **Authentication:** Token-based admin access
- **Excel Generation:** ExcelJS for FMX-compatible exports
- **Icons:** Custom SVG icon system
- **TypeScript:** Full type safety throughout

## 📁 Project Structure

```
fmx-exporter/
├── src/
│   ├── app/                 # Next.js app router pages
│   │   ├── api/            # API routes for CRUD operations
│   │   ├── buildings/      # Buildings & equipment management
│   │   ├── instructions/   # Instruction sets management
│   │   ├── task-templates/ # Task template creation
│   │   ├── pm-templates/   # PM template bundling
│   │   ├── assignments/    # Template assignments
│   │   └── export/         # FMX export functionality
│   ├── components/         # Reusable React components
│   │   ├── ui/            # Base UI components
│   │   ├── navigation/    # Sidebar and header
│   │   ├── buildings/     # Building-specific components
│   │   ├── instructions/  # Instruction components
│   │   └── export/        # Export management
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility libraries
│   ├── styles/            # CSS modules and design tokens
│   └── utils/             # Helper functions
├── prisma/                # Database schema and migrations
├── documentation/         # Project documentation
└── task-tracking/         # Development task tracking
```

## 🔧 API Endpoints

- `GET/POST /api/buildings` - Building management
- `GET/POST /api/equipment` - Equipment management  
- `GET/POST /api/instructions` - Instruction sets
- `GET/POST /api/task-templates` - Task templates
- `GET/POST /api/pm-templates` - PM templates
- `GET/POST /api/assignments` - Template assignments
- `POST /api/export` - Generate FMX Excel export
- `POST /api/export/validate` - Validate export data

## 📋 Database Schema

The application uses a relational database with the following key entities:

- **Building** - School buildings with FMX naming
- **Equipment** - HVAC equipment within buildings
- **InstructionSet** & **InstructionStep** - Maintenance procedures
- **TaskTemplate** - Scheduled maintenance tasks
- **PMTemplate** & **PMTemplateTask** - Bundled task groups
- **PMTemplateAssignment** - Equipment assignments
- **RequestType** - FMX request categorization

## 🔒 Security

- Token-based authentication for all API endpoints
- Input validation and sanitization
- Environment variable protection for sensitive data
- Single-tenant architecture with admin access control

## 🎨 Design System

The application uses a consistent design system with:

- CSS custom properties for colors, spacing, and typography
- Modular CSS with scoped styles
- Professional color-coded interfaces
- Responsive design for mobile and desktop
- Accessible contrast ratios and focus states

## 📖 Documentation

- [`documentation/product-reqs.md`](documentation/product-reqs.md) - Product requirements and features
- [`documentation/fmx-format.md`](documentation/fmx-format.md) - FMX Excel import format specifications
- [`task-tracking/`](task-tracking/) - Development progress tracking

## 🚀 Deployment

### Environment Setup

1. **Database:** Set up MySQL instance (AWS RDS recommended)
2. **Environment Variables:** Configure production DATABASE_URL and ADMIN_TOKEN
3. **Build:** Run `npm run build` to create production bundle

### Deployment Options

- **Vercel:** Recommended for Next.js applications
- **Docker:** Containerized deployment option
- **Traditional Hosting:** Any Node.js compatible hosting

## 🤝 Contributing

1. Follow the existing code structure and conventions
2. Use TypeScript for all new code
3. Follow CSS Modules pattern for styling
4. Update task tracking documentation for significant changes
5. Ensure all API endpoints include proper authentication
