import { useState } from "react";
import { LayoutDashboard, AlertTriangle, Menu, Map, Users, Settings, LogOut, Search } from "lucide-react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { cn } from "@/utils/cn";

export function AppLayout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // Basic mock user logic matching existing frontend structure
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.dispatchEvent(new Event('authChanged'));
        navigate('/login');
    };

    const navLinks = [
        { name: 'Dashboard', path: user?.role === 'Moderator' ? '/moderator-dashboard' : '/dashboard', icon: LayoutDashboard },
        { name: 'Report Issue', path: '/complaint', icon: AlertTriangle, hideModerator: true },
        { name: 'Track Issue', path: '/track-issue', icon: Map, hideModerator: true },
        { name: 'Manage Complaints', path: '/moderator-complaints', icon: AlertTriangle, hideCitizen: true },
        { name: 'Profile', path: user?.role === 'Moderator' ? '/moderator-profile' : '/user-profile', icon: Users },
        { name: 'Settings', path: '/settings', icon: Settings },
    ];

    return (
        <div className="flex h-screen w-full bg-[#0F172A] text-slate-50 overflow-hidden font-sans">
            {/* Sidebar - Desktop */}
            <aside className="hidden w-64 flex-col border-r border-slate-200/60 bg-white/70 backdrop-blur-xl md:flex">
                <div className="p-6 flex items-center justify-center">
                    <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
                        Samaaj
                    </Link>
                </div>

                <nav className="flex-1 space-y-2 px-4 py-4 overflow-y-auto">
                    {navLinks.map((link) => {
                        if (user?.role === 'Moderator' && link.hideModerator) return null;
                        if (user?.role !== 'Moderator' && link.hideCitizen) return null;

                        const isActive = location.pathname === link.path;
                        const Icon = link.icon;
                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 group",
                                    isActive
                                        ? "bg-blue-500/10 text-blue-400 font-medium shadow-[inset_2px_0_0_0_#3b82f6]"
                                        : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-900"
                                )}
                            >
                                <Icon className={cn("w-5 h-5 transition-colors duration-200", isActive ? "text-blue-500" : "text-slate-500 group-hover:text-slate-700")} />
                                <span>{link.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-200/60">
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400 group"
                    >
                        <LogOut className="w-5 h-5 text-slate-500 group-hover:text-red-400 transition-colors" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
                {/* Top Header */}
                <header className="flex-shrink-0 flex items-center justify-between border-b border-slate-200/60 bg-[#0F172A]/80 backdrop-blur-md px-4 sm:px-6 py-4 z-10 sticky top-0">
                    <div className="flex items-center gap-4 w-full">
                        {/* Mobile toggle */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden text-slate-500 hover:text-slate-900 transition-colors p-1"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        {/* Command Palette Trigger UI (Visual only for now) */}
                        <button className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-300/50 bg-white/70 px-3 py-2 text-sm text-slate-500 hover:bg-slate-100/80 transition-all duration-200 ml-4 lg:ml-0 w-64 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                            <Search className="w-4 h-4 text-slate-500" />
                            <span className="flex-1 text-left">Search issues...</span>
                            <kbd className="hidden lg:inline-flex items-center gap-1 rounded border border-slate-300 bg-slate-100 px-1.5 font-mono text-[10px] font-medium text-slate-500 tracking-widest">
                                <span className="text-xs">⌘</span>K
                            </kbd>
                        </button>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                        {/* User Profile avatar */}
                        {user && (
                            <div className="flex items-center gap-3 bg-slate-100/50 pl-2 pr-4 py-1.5 rounded-full border border-slate-300/30">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm shadow-inner">
                                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div className="hidden sm:flex flex-col">
                                    <span className="text-sm font-medium text-slate-800 leading-tight">{user.name || 'User'}</span>
                                    <span className="text-[10px] text-slate-500 leading-tight">{user.role || 'Citizen'}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                {/* Mobile Navigation Menu Overlay */}
                {isMobileMenuOpen && (
                    <div className="absolute inset-0 z-40 bg-white/95 backdrop-blur-xl md:hidden flex flex-col pt-20 px-4 pb-6 overflow-y-auto">
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="absolute top-5 right-5 text-slate-500 hover:text-slate-900"
                        >
                            ✕
                        </button>
                        <nav className="flex flex-col space-y-2 mt-4">
                            {navLinks.map((link) => {
                                if (user?.role === 'Moderator' && link.hideModerator) return null;
                                if (user?.role !== 'Moderator' && link.hideCitizen) return null;
                                const isActive = location.pathname === link.path;
                                const Icon = link.icon;
                                return (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={cn(
                                            "flex items-center gap-4 rounded-xl px-4 py-3.5 transition-all",
                                            isActive
                                                ? "bg-blue-500/20 text-blue-400 font-medium"
                                                : "text-slate-700 hover:bg-slate-100"
                                        )}
                                    >
                                        <Icon className={cn("w-6 h-6", isActive ? "text-blue-500" : "text-slate-500")} />
                                        <span className="text-lg">{link.name}</span>
                                    </Link>
                                );
                            })}
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-4 rounded-xl px-4 py-3.5 text-slate-700 hover:bg-red-500/20 hover:text-red-400 mt-4 border border-slate-200"
                            >
                                <LogOut className="w-6 h-6 text-red-400" />
                                <span className="text-lg font-medium text-red-400">Logout</span>
                            </button>
                        </nav>
                    </div>
                )}

                {/* Scrollable Page Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative w-full styled-scrollbar">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
