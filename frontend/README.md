# CMP AI - Frontend

Production-quality React/Vite frontend for the Contractor Management Platform with AI integration.

## Features

- 🎨 **Modern UI** - Built with TailwindCSS and Framer Motion
- 🔐 **Authentication** - JWT-based auth with role-based access control
- 📱 **Responsive Design** - Mobile-first, works on all screen sizes
- ⚡ **Fast Build** - Vite for lightning-fast development and build
- 🧩 **Reusable Components** - Pre-built UI component library
- 🎯 **Type-Safe** - Zustand for state management
- 🔄 **API Integration** - Axios with interceptors and JWT handling

## Tech Stack

- **React 18.2.0** - UI library
- **Vite 5.0.0** - Build tool
- **TailwindCSS 3.3.6** - Styling
- **Framer Motion 10.16.4** - Animations
- **React Router v6 6.20.0** - Routing
- **Axios 1.6.2** - HTTP client
- **Zustand 4.4.5** - State management
- **Lucide React** - Icon library

## Project Structure

```
frontend/src/
├── components/          # Reusable components
│   ├── ui/             # Base UI components (Button, Input, Card, etc.)
│   └── layout/         # Layout components (Sidebar, Navbar, etc.)
├── pages/              # Page components
│   ├── LoginPage.jsx
│   ├── DashboardPage.jsx
│   └── modules/        # Feature-specific pages
├── modules/            # Feature modules
│   ├── auth/
│   ├── customer/
│   ├── contractor/
│   ├── po/
│   ├── timesheet/
│   ├── invoice/
│   └── expense/
├── services/           # API service layer
├── hooks/              # Custom React hooks
├── router/             # Route definitions and guards
├── utils/              # Utility functions
├── constants/          # Constants and enums
└── App.jsx             # Root component
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Backend running on `http://localhost:8080`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Authentication

The app uses JWT-based authentication. Tokens are stored in localStorage and automatically included in API requests via the Axios interceptor.

### Login Flow
1. User enters credentials on LoginPage
2. API returns JWT token and user data
3. Token stored in Zustand store (persisted to localStorage)
4. User redirected to dashboard

### Protected Routes
Routes are protected by the `PrivateRoute` component which checks:
- User authentication status
- User role-based permissions
- Redirects to login if not authenticated

## API Integration

All API calls go through the `apiClient` service which:
- Uses configurable base URL
- Automatically adds JWT token to requests
- Handles 401 responses by logging out user
- Returns parsed response data

### Service Layer
Each feature has a service file in `src/services/`:
- `authService.js` - Authentication
- `customerService.js` - Customer management
- `contractorService.js` - Contractor management
- etc.

## UI Components

Pre-built components in `src/components/ui/`:
- **Button** - Primary, secondary, ghost, danger variants
- **Input** - Text input with validation
- **Select** - Dropdown with options
- **Textarea** - Multi-line text
- **Card** - Container with optional header/footer
- **Table** - Data table with pagination
- **Badge** - Status indicators
- **Modal** - Dialog with animations
- **Loader** - Loading spinner

## Role-Based Access

The app supports 4 roles:
- **ADMIN** - Full access
- **FINANCE** - Financial and invoice management
- **MANAGER** - Team and timesheet management
- **CONTRACTOR** - Personal timesheet and expense submission

Navigation and features automatically adjust based on user role.

## Styling

TailwindCSS is configured with:
- Indigo-600 as primary color
- Custom spacing and rounded corners
- Responsive breakpoints
- Dark mode ready

## Animations

Framer Motion is used for:
- Page transitions
- Modal animations
- Hover effects
- Loading states

## Development Tips

1. **Components** - Keep UI components pure and reusable
2. **Services** - All API calls should go through service layer
3. **State** - Use Zustand for global state (auth, notifications, etc.)
4. **Forms** - Use validation utilities from `src/utils/validators.js`
5. **Formatting** - Use formatters from `src/utils/formatters.js`

## Deployment

### Building for Production
```bash
npm run build
```

This creates an optimized build in the `dist/` directory.

### Environment Variables
Update `.env` file for production:
```
VITE_API_BASE_URL=https://your-api-domain.com/api
```

### Deploy to Netlify, Vercel, or your hosting provider
```bash
npm run build
# Upload dist/ folder to your hosting
```

## Backend Integration

The frontend expects the backend API at `http://localhost:8080/api`

Key endpoints:
- `POST /auth/login` - User login
- `POST /auth/signup` - User registration
- `GET /api/customers` - List customers
- `POST /api/timesheets` - Create timesheet
- `GET /api/invoices` - List invoices
- etc.

Refer to backend README for complete API documentation.

## Support

For issues or questions:
1. Check backend is running on port 8080
2. Verify `.env` configuration
3. Check browser console for errors
4. Check network tab for API responses

## License

Proprietary - All rights reserved
