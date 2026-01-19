import React from 'react';
import { 
  LayoutDashboard, 
  Zap, 
  Search, 
  Settings, 
  Users,
  HelpCircle
} from 'lucide-react';

interface MobileNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ 
  activeTab, 
  onTabChange 
}) => {
  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: LayoutDashboard,
    },
    {
      id: 'builder-3',
      label: 'Campaigns',
      icon: Zap,
    },
    {
      id: 'keyword-planner',
      label: 'Keywords',
      icon: Search,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-40">
      <div className="flex justify-around items-center py-2 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`
                flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200
                ${isActive 
                  ? 'text-indigo-600 bg-indigo-50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }
                min-w-0 flex-1 relative
              `}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-xs mt-1 font-medium ${isActive ? 'text-indigo-600' : 'text-gray-500'}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-indigo-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
      
      {/* Safe area for devices with home indicator */}
      <div className="h-safe-area-inset-bottom bg-white" />
    </div>
  );
};

// Quick access floating action button for mobile
export const MobileQuickActions: React.FC<{ onNewCampaign: () => void }> = ({ 
  onNewCampaign 
}) => {
  return (
    <div className="fixed bottom-24 right-4 md:hidden z-30">
      <button
        onClick={onNewCampaign}
        className="w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full shadow-lg flex items-center justify-center text-white hover:shadow-xl transition-all duration-200 hover:scale-105 border-4 border-white"
      >
        <Zap className="w-6 h-6" />
      </button>
    </div>
  );
};