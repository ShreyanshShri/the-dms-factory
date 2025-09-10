# Buildfluence Dashboard

A professional, modern, and intuitive web dashboard for the Buildfluence SaaS automation platform. This dashboard is designed to track outreach performance, manage accounts and campaigns, and provide comprehensive analytics for cold DM automation.

## ✨ Features

### 📊 Overview Section
- **Total Accounts**: Active and paused account counts
- **Total Campaigns**: Active and paused campaign counts  
- **Daily Account Ranking**: Based on DM activity
- **Quick Summary Cards**: Today's performance metrics
  - DMs sent
  - Daily DM goal progress
  - Reply rate

### 👥 Accounts Section
- **Active Accounts**: With detailed statistics
- **Paused Accounts**: Easy management
- **Toggle Controls**: Activate/pause accounts with one click

### 📈 Campaigns Section
- **Active Campaigns**: Current status and performance
- **Campaign Metrics**: DMs sent, replies, engagement rates
- **Performance Tracking**: Real-time campaign analytics

### 📊 Performance Analytics
- **Interactive Charts**: Daily, weekly, and monthly trends
- **Key Metrics**: DMs sent, reply rates, campaign performance
- **Hover Tooltips**: Detailed statistics on demand

### 🔔 Activity & Notifications
- **Recent Activity Log**: Per-account activity tracking
- **Smart Notifications**: Errors, DM limits, campaign completion alerts

### 🎨 Design & UX
- **Modern Layout**: Clean, minimalistic design
- **Dark/Light Mode**: Theme switching capability
- **Visual Hierarchy**: Distinct colors for metrics and states
- **Responsive Design**: Works on all devices

### 🚀 Extra Features
- **Search & Filter**: Advanced account and campaign filtering
- **Data Export**: CSV/PDF export functionality
- **Tooltips**: Helpful explanations for new users
- **Intuitive Navigation**: Sidebar menu for easy access

## 🛠️ Tech Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Charts**: Chart.js with react-chartjs-2
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Routing**: React Router DOM
- **State Management**: React Context API

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Navigate to `http://localhost:3000`

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Header.tsx      # Top navigation bar
│   ├── Sidebar.tsx     # Left sidebar navigation
│   ├── Layout.tsx      # Main layout wrapper
│   ├── MetricCard.tsx  # Performance metric cards
│   ├── DailyRanking.tsx # Account ranking component
│   ├── PerformanceChart.tsx # Interactive charts
│   └── QuickActions.tsx # Action buttons
├── pages/              # Page components
│   ├── Overview.tsx    # Dashboard overview
│   ├── Accounts.tsx    # Account management
│   ├── Campaigns.tsx   # Campaign management
│   ├── Messages.tsx    # Message center
│   ├── Tools.tsx       # Tools and utilities
│   └── Settings.tsx    # Settings and preferences
├── contexts/           # React contexts
│   └── ThemeContext.tsx # Theme management
├── index.css           # Global styles
└── main.tsx           # App entry point
```

## 🎨 Customization

### Colors
The dashboard uses a custom color palette defined in `tailwind.config.js`:
- **Primary**: Blue shades for main actions
- **Success**: Green for positive metrics
- **Warning**: Orange for caution states
- **Danger**: Red for error states

### Themes
- **Light Mode**: Clean, professional appearance
- **Dark Mode**: Easy on the eyes for extended use
- **Auto-switching**: Based on system preferences

## 📱 Responsive Design

The dashboard is fully responsive and optimized for:
- **Desktop**: Full feature set with side-by-side layouts
- **Tablet**: Adapted layouts for medium screens
- **Mobile**: Mobile-first design with collapsible sidebar

## ⚙️ Configuration

### Environment Variables
Create a `.env` file in the root directory:
```env
VITE_APP_TITLE=Buildfluence Dashboard
VITE_API_URL=your_api_endpoint
```

### Build Configuration
- **Development**: `npm run dev`
- **Production Build**: `npm run build`
- **Preview**: `npm run preview`

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Deploy: `vercel --prod`

### Deploy to Netlify
1. Build the project: `npm run build`
2. Deploy the `dist` folder to Netlify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔮 Future Enhancements

- **Real-time Updates**: WebSocket integration for live data
- **Advanced Analytics**: Machine learning insights
- **API Integration**: Connect to external services
- **Mobile App**: Native mobile application
- **Team Collaboration**: Multi-user support
- **Advanced Reporting**: Custom report builder
