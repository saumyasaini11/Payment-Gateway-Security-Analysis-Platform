import React from 'react';
import { NavLink } from 'react-router-dom';
import { Shield, LayoutDashboard, History, Cpu } from 'lucide-react';

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-navy-900 text-white min-h-screen flex flex-col border-r border-navy-800">
      {/* Brand Header */}
      <div className="p-6 border-b border-navy-800 flex items-center space-x-3">
        <Shield className="h-8 w-8 text-safety-green" />
        <div>
          <h1 className="font-bold text-sm leading-tight tracking-wider uppercase">Sentinel</h1>
          <p className="text-xs text-navy-300 font-semibold tracking-widest">GATEWAY AUDIT</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-safety-green text-white shadow-lg shadow-safety-green-bg'
                : 'text-navy-200 hover:bg-navy-800 hover:text-white'
            }`
          }
        >
          <LayoutDashboard className="h-5 w-5" />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/history"
          className={({ isActive }) =>
            `flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-safety-green text-white shadow-lg shadow-safety-green-bg'
                : 'text-navy-200 hover:bg-navy-800 hover:text-white'
            }`
          }
        >
          <History className="h-5 w-5" />
          <span>Scan History</span>
        </NavLink>

        <NavLink
          to="/system"
          className={({ isActive }) =>
            `flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-safety-green text-white shadow-lg shadow-safety-green-bg'
                : 'text-navy-200 hover:bg-navy-800 hover:text-white'
            }`
          }
        >
          <Cpu className="h-5 w-5" />
          <span>Engine Status</span>
        </NavLink>
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-navy-800 text-center text-xs text-navy-300">
        <p className="font-medium">Payment Gateway Security</p>
        <p className="text-[10px] mt-1 opacity-70">Analysis Platform v1.2.0</p>
      </div>
    </aside>
  );
};
export default Sidebar;
