import React, { useState } from 'react';
import { 
  Wheat, 
  Search, 
  Bell, 
  ChevronDown, 
  User, 
  Languages, 
  ShieldCheck, 
  Calendar, 
  Compass, 
  HelpCircle, 
  History, 
  LogOut, 
  Menu, 
  X,
  PhoneCall,
  TrendingUp,
  Layers,
  Building2,
  Gavel,
  DollarSign,
  Scale,
  Clock,
  Activity,
  MoreHorizontal
} from 'lucide-react';
import { Language, UserRole, FarmerProfile, NotificationItem } from '../types';
import { t } from '../i18n';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  language: Language;
  onToggleLanguage: () => void;
  farmer: FarmerProfile;
  role: UserRole;
  onSwitchRole: (role: UserRole) => void;
  unreadCount: number;
  onOpenNotifications: () => void;
  onOpenLogin: () => void;
  isLoggedIn?: boolean;
  onLogout?: () => void;
}

interface HeaderNavLink {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface HeaderNavConfig {
  visible: HeaderNavLink[];
  more: HeaderNavLink[];
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  language,
  onToggleLanguage,
  farmer,
  role,
  onSwitchRole,
  unreadCount,
  onOpenNotifications,
  onOpenLogin,
  isLoggedIn = true,
  onLogout
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const navConfig: HeaderNavConfig = isLoggedIn
    ? role === 'buyer'
      ? {
          visible: [
          { id: 'buyer-home', label: language === 'hi' ? 'होम' : 'Home', icon: Building2 },
          { id: 'buyer-crops', label: language === 'hi' ? 'उपलब्ध फसलें' : 'Available Crops', icon: Wheat },
          { id: 'buyer-bids', label: language === 'hi' ? 'मेरी बोलियां' : 'My Bids', icon: Gavel },
          ],
          more: [
          { id: 'buyer-market', label: language === 'hi' ? 'बाज़ार मांग' : 'Market Overview', icon: TrendingUp },
          { id: 'buyer-transactions', label: language === 'hi' ? 'लेन-देन' : 'Transactions', icon: DollarSign },
          { id: 'buyer-reliability', label: language === 'hi' ? 'विश्वसनीयता' : 'Reliability', icon: ShieldCheck },
          ],
        }
      : role === 'admin' || role === 'staff'
      ? {
          visible: [
          { id: 'admin-dashboard', label: language === 'hi' ? 'डैशबोर्ड' : 'Dashboard', icon: Activity },
          { id: 'admin-queue', label: language === 'hi' ? 'लाइव कतार' : 'Live Queue', icon: Clock },
          { id: 'admin-procurement', label: language === 'hi' ? 'तौल व खरीद' : 'Procurement', icon: Scale },
          ],
          more: [
          { id: 'admin-priority', label: language === 'hi' ? 'फसल प्राथमिकता' : 'Crop Priority', icon: TrendingUp },
          { id: 'admin-payments', label: language === 'hi' ? 'भुगतान निगरानी' : 'Payments', icon: DollarSign },
          ],
        }
      : {
        visible: [
          { id: 'home', label: t(language, 'navHome'), icon: Wheat },
          { id: 'listings', label: language === 'hi' ? 'मेरी फसलें' : 'My Crops', icon: Layers },
          { id: 'book-slot', label: t(language, 'navBookSlot'), icon: Calendar },
          { id: 'track-status', label: t(language, 'navTrackStatus'), icon: Compass },
        ],
        more: [
          { id: 'market-demand', label: language === 'hi' ? 'बाज़ार मांग' : 'Market Demand', icon: TrendingUp },
          { id: 'transactions', label: language === 'hi' ? 'लेन-देन इतिहास' : 'Transactions', icon: DollarSign },
          { id: 'history', label: t(language, 'navHistory'), icon: History },
          { id: 'help', label: t(language, 'navHelp'), icon: HelpCircle },
        ],
      }
    : {
        visible: [
        { id: 'login', label: language === 'hi' ? 'लॉगिन / पंजीकरण' : 'Login / Register', icon: User },
          { id: 'about', label: language === 'hi' ? 'पोर्टल जानकारी व मंडी' : 'How It Works & Mandis', icon: HelpCircle },
        ],
        more: [],
      };

  const visibleNavLinks = navConfig.visible;
  const moreNavLinks = navConfig.more;
  const activeMoreLink = moreNavLinks.some((link) => currentTab === link.id);

  const handleNavClick = (id: string) => {
    onTabChange(id);
    setMoreMenuOpen(false);
    setMobileMenuOpen(false);
  };

  const activeRole = role === 'buyer'
    ? { label: language === 'hi' ? 'खरीदार' : 'Buyer', icon: Building2, className: 'bg-amber-400 text-emerald-950' }
    : role === 'admin' || role === 'staff'
    ? { label: language === 'hi' ? 'प्रशासक' : 'Admin', icon: ShieldCheck, className: 'bg-amber-400 text-emerald-950' }
    : { label: language === 'hi' ? 'किसान' : 'Farmer', icon: Wheat, className: 'bg-amber-400 text-emerald-950' };
  const ActiveRoleIcon = activeRole.icon;

  const handleRoleSwitch = (nextRole: UserRole, nextTab: string) => {
    onSwitchRole(nextRole);
    onTabChange(nextTab);
    setRoleMenuOpen(false);
  };

  return (
    <header className="bg-[#1B5E3C] text-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Left: Logo & Brand */}
          <div className="flex items-center gap-6">
            <button 
              id="brand-logo-btn"
              onClick={() => onTabChange(isLoggedIn ? 'home' : 'login')}
              className="flex items-center gap-2 text-left group focus:outline-none cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-800/80 flex items-center justify-center border border-emerald-500/30 text-amber-300 group-hover:scale-105 transition-transform">
                <Wheat className="w-6 h-6 text-amber-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                  KisanSetu
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-emerald-800/80 text-emerald-200 border border-emerald-600/40">
                    APMC
                  </span>
                </span>
                <span className="text-[11px] text-emerald-200/80 font-medium hidden sm:inline">
                  {language === 'hi' ? 'मंडी खरीद डिजिटल सेतु' : 'Procurement Portal'}
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {visibleNavLinks.map((link) => {
                const isActive = currentTab === link.id;
                return (
                  <button
                    key={link.id}
                    id={`nav-link-${link.id}`}
                    onClick={() => handleNavClick(link.id)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                      isActive 
                        ? 'bg-emerald-800/90 text-white shadow-inner font-semibold ring-1 ring-emerald-500/40' 
                        : 'text-emerald-100 hover:bg-emerald-800/50 hover:text-white'
                    }`}
                  >
                    {link.label}
                  </button>
                );
              })}
              {moreNavLinks.length > 0 && (
                <div className="relative">
                  <button
                    id="nav-link-more"
                    type="button"
                    onClick={() => setMoreMenuOpen((open) => !open)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                      activeMoreLink || moreMenuOpen
                        ? 'bg-emerald-800/90 text-white shadow-inner font-semibold ring-1 ring-emerald-500/40'
                        : 'text-emerald-100 hover:bg-emerald-800/50 hover:text-white'
                    }`}
                    aria-expanded={moreMenuOpen}
                    aria-haspopup="menu"
                  >
                    <span>{language === 'hi' ? 'अधिक' : 'More'}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${moreMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {moreMenuOpen && (
                    <div
                      className="absolute left-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-2 text-gray-800 z-50 animate-in fade-in slide-in-from-top-2"
                      onMouseLeave={() => setMoreMenuOpen(false)}
                      role="menu"
                    >
                      {moreNavLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                          <button
                            key={link.id}
                            id={`more-nav-${link.id}`}
                            type="button"
                            onClick={() => handleNavClick(link.id)}
                            className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-emerald-50 flex items-center gap-2 cursor-pointer ${
                              currentTab === link.id ? 'text-[#1B5E3C] font-bold bg-emerald-50' : 'text-gray-700'
                            }`}
                            role="menuitem"
                          >
                            <Icon className="w-4 h-4 text-emerald-700" />
                            {link.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </nav>
          </div>

          {/* Center/Right: Search Bar */}
          <div className="hidden md:flex items-center flex-1 min-w-0 max-w-lg mx-4">
            <div className="relative w-full">
              <input
                id="header-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t(language, 'searchPlaceholder')}
                className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white text-gray-800 placeholder-gray-400 rounded-full border-0 focus:ring-2 focus:ring-amber-400 focus:outline-none shadow-inner"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Language Switcher Pill */}
            <button
              id="language-toggle-btn"
              onClick={onToggleLanguage}
              title="Toggle English / हिंदी"
              className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-800/80 hover:bg-emerald-700/80 border border-emerald-600/40 text-emerald-100 flex items-center gap-1.5 transition-colors"
            >
              <Languages className="w-3.5 h-3.5 text-amber-300" />
              <span>{language === 'en' ? 'हिन्दी' : 'English'}</span>
            </button>

            {/* Consolidated Farmer / Buyer / Admin role switcher */}
            <div className="hidden sm:block relative">
              <button
                id="role-switcher-btn"
                type="button"
                onClick={() => setRoleMenuOpen((open) => !open)}
                className={`px-2.5 py-1 rounded-full font-semibold transition-colors cursor-pointer flex items-center gap-1.5 text-xs ${activeRole.className}`}
                aria-expanded={roleMenuOpen}
                aria-haspopup="menu"
              >
                <ActiveRoleIcon className="w-3.5 h-3.5" />
                <span>{activeRole.label}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${roleMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {roleMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-2 text-gray-800 z-50 animate-in fade-in slide-in-from-top-2"
                  onMouseLeave={() => setRoleMenuOpen(false)}
                  role="menu"
                >
                  <button
                    id="role-menu-farmer"
                    type="button"
                    onClick={() => handleRoleSwitch('farmer', 'home')}
                    className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-emerald-50 flex items-center gap-2 cursor-pointer ${role === 'farmer' ? 'bg-amber-50 text-emerald-950 font-bold' : 'text-gray-700'}`}
                    role="menuitem"
                  >
                    <Wheat className="w-4 h-4 text-amber-500" />
                    <span>{language === 'hi' ? 'किसान' : 'Farmer'}</span>
                  </button>
                  <button
                    id="role-menu-buyer"
                    type="button"
                    onClick={() => handleRoleSwitch('buyer', 'buyer-home')}
                    className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-emerald-50 flex items-center gap-2 cursor-pointer ${role === 'buyer' ? 'bg-amber-50 text-emerald-950 font-bold' : 'text-gray-700'}`}
                    role="menuitem"
                  >
                    <Building2 className="w-4 h-4 text-emerald-700" />
                    <span>{language === 'hi' ? 'खरीदार' : 'Buyer'}</span>
                  </button>
                  <button
                    id="role-menu-admin"
                    type="button"
                    onClick={() => handleRoleSwitch('admin', 'admin-dashboard')}
                    className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-emerald-50 flex items-center gap-2 cursor-pointer ${role === 'admin' || role === 'staff' ? 'bg-amber-50 text-emerald-950 font-bold' : 'text-gray-700'}`}
                    role="menuitem"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>{language === 'hi' ? 'प्रशासक' : 'Admin'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Notification Bell with SMS count */}
            {isLoggedIn && (
              <button
                id="notifications-bell-btn"
                onClick={onOpenNotifications}
                title="Alerts & SMS Notifications"
                className="relative p-2 rounded-full hover:bg-emerald-800/70 text-emerald-100 hover:text-white transition-colors focus:outline-none cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-amber-400 text-emerald-950 text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-[#1B5E3C] animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* User Profile dropdown OR Login Button */}
            {isLoggedIn ? (
              <div className="relative">
                <button
                  id="profile-dropdown-btn"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-full bg-emerald-800/80 hover:bg-emerald-700/90 border border-emerald-600/40 text-white text-sm transition-colors focus:outline-none cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full bg-amber-300 text-emerald-950 font-bold flex items-center justify-center text-xs shadow-inner">
                    {farmer.name ? farmer.name.charAt(0) : 'R'}
                  </div>
                  <span className="font-medium text-xs sm:text-sm hidden sm:inline max-w-[110px] truncate">
                    {language === 'hi' ? farmer.nameHi || farmer.name : farmer.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-emerald-200" />
                </button>

                {/* Profile Menu Popover */}
                {profileDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 text-gray-800 z-50 animate-in fade-in slide-in-from-top-2"
                    onMouseLeave={() => setProfileDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs text-gray-500 font-medium">Logged in as</p>
                      <p className="text-sm font-bold text-gray-900 truncate">{farmer.name}</p>
                      <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                        Reg ID: {farmer.registrationNo}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {farmer.village}, {farmer.district}
                      </p>
                    </div>

                    <div className="py-1">
                      <button
                        id="profile-menu-home"
                        onClick={() => {
                          onTabChange('home');
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium hover:bg-emerald-50 text-gray-700 flex items-center gap-2 cursor-pointer"
                      >
                        <Wheat className="w-4 h-4 text-emerald-700" />
                        Farmer Home Dashboard
                      </button>
                      <button
                        id="profile-menu-track"
                        onClick={() => {
                          onTabChange('track-status');
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium hover:bg-emerald-50 text-gray-700 flex items-center gap-2 cursor-pointer"
                      >
                        <Compass className="w-4 h-4 text-emerald-700" />
                        Track Active Token
                      </button>
                      <button
                        id="profile-menu-history"
                        onClick={() => {
                          onTabChange('history');
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium hover:bg-emerald-50 text-gray-700 flex items-center gap-2 cursor-pointer"
                      >
                        <History className="w-4 h-4 text-emerald-700" />
                        My Bookings &amp; J-Forms
                      </button>
                      <button
                        id="profile-menu-buyer-toggle"
                        onClick={() => {
                          onSwitchRole(role === 'buyer' ? 'farmer' : 'buyer');
                          onTabChange(role === 'buyer' ? 'home' : 'buyer-home');
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium hover:bg-emerald-50 text-emerald-900 flex items-center gap-2 cursor-pointer"
                      >
                        <Building2 className="w-4 h-4 text-emerald-700" />
                        {role === 'buyer' ? 'Switch to Farmer View' : 'Switch to Buyer Portal'}
                      </button>
                      <button
                        id="profile-menu-staff-toggle"
                        onClick={() => {
                          onSwitchRole(role === 'farmer' ? 'staff' : 'farmer');
                          onTabChange(role === 'farmer' ? 'admin-queue' : 'home');
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium hover:bg-amber-50 text-amber-900 flex items-center gap-2 cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4 text-amber-600" />
                        {role === 'staff' ? 'Switch to Farmer View' : 'Switch to Staff Portal'}
                      </button>
                    </div>

                    <div className="border-t border-gray-100 pt-1">
                      <button
                        id="profile-menu-logout"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          if (onLogout) {
                            onLogout();
                          } else {
                            onOpenLogin();
                          }
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium hover:bg-red-50 text-red-600 flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        {language === 'hi' ? 'लॉग आउट (साइन आउट)' : 'Log Out (Sign Out)'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="header-login-btn"
                onClick={onOpenLogin}
                className="px-3 sm:px-4 py-1.5 rounded-full bg-amber-400 hover:bg-amber-300 text-emerald-950 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-emerald-950" />
                <span>{language === 'hi' ? 'लॉगिन / पंजीकरण' : 'Login / Register'}</span>
              </button>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              id="mobile-menu-hamburger-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-md hover:bg-emerald-800 text-emerald-100 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden pb-4 pt-2 border-t border-emerald-700/60 space-y-1">
            {visibleNavLinks.map((link) => {
              const isActive = currentTab === link.id;
              const Icon = link.icon;
              return (
                <button
                  key={link.id}
                  id={`mobile-nav-${link.id}`}
                  onClick={() => {
                    handleNavClick(link.id);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium ${
                    isActive ? 'bg-emerald-800 text-white font-bold' : 'text-emerald-100 hover:bg-emerald-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 text-amber-300" />
                  {link.label}
                </button>
              );
            })}
            {moreNavLinks.length > 0 && (
              <div className="pt-1">
                <button
                  id="mobile-nav-more"
                  type="button"
                  onClick={() => setMoreMenuOpen((open) => !open)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium ${
                    activeMoreLink || moreMenuOpen ? 'bg-emerald-800 text-white font-bold' : 'text-emerald-100 hover:bg-emerald-800/60'
                  }`}
                  aria-expanded={moreMenuOpen}
                >
                  <span className="flex items-center gap-3">
                    <MoreHorizontal className="w-4 h-4 text-amber-300" />
                    {language === 'hi' ? 'अधिक' : 'More'}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${moreMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {moreMenuOpen && (
                  <div className="mt-1 ml-3 pl-3 border-l border-emerald-700/60 space-y-1">
                    {moreNavLinks.map((link) => {
                      const isActive = currentTab === link.id;
                      const Icon = link.icon;
                      return (
                        <button
                          key={link.id}
                          id={`mobile-more-nav-${link.id}`}
                          type="button"
                          onClick={() => handleNavClick(link.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium ${
                            isActive ? 'bg-emerald-800 text-white font-bold' : 'text-emerald-100 hover:bg-emerald-800/60'
                          }`}
                        >
                          <Icon className="w-4 h-4 text-amber-300" />
                          {link.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            <div className="pt-2 border-t border-emerald-700/60 mt-2 space-y-1">
              <p className="px-3 text-[11px] font-bold text-emerald-200/80 uppercase tracking-wider">
                {language === 'hi' ? 'भूमिका बदलें (Switch Role)' : 'Switch Role Portal'}
              </p>
              <button
                id="mobile-nav-farmer"
                type="button"
                onClick={() => {
                  onSwitchRole('farmer');
                  onTabChange('home');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium ${
                  role === 'farmer' ? 'bg-amber-400 text-emerald-950 font-bold' : 'text-emerald-100 hover:bg-emerald-800/60'
                }`}
              >
                <Wheat className="w-4 h-4" />
                <span>{language === 'hi' ? 'किसान पोर्टल (Farmer)' : 'Farmer Portal'}</span>
              </button>

              <button
                id="mobile-nav-buyer"
                type="button"
                onClick={() => {
                  onSwitchRole('buyer');
                  onTabChange('buyer-home');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium ${
                  role === 'buyer' ? 'bg-amber-400 text-emerald-950 font-bold' : 'text-emerald-100 hover:bg-emerald-800/60'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>{language === 'hi' ? 'खरीदार पोर्टल (Buyer)' : 'Buyer Portal'}</span>
              </button>

              <button
                id="mobile-nav-admin"
                type="button"
                onClick={() => {
                  onSwitchRole('admin');
                  onTabChange('admin-dashboard');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium ${
                  role === 'admin' || role === 'staff' ? 'bg-amber-400 text-emerald-950 font-bold' : 'text-emerald-100 hover:bg-emerald-800/60'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{language === 'hi' ? 'मंडी प्रशासक (Admin)' : 'Admin Dashboard'}</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </header>
  );
};
