import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filesToProcess = [
    'src/pages/dashboard/Dashboard.jsx',
    'src/pages/UserProfile/UserProfile.jsx',
    'src/pages/Usertrackissue/Usertrack.jsx',
    'src/pages/UserIssue/Create.jsx',
    'src/pages/ModeratorDashboard/ModeratorDashboard.jsx',
    'src/pages/ModeratorComplaints/ModeratorComplaints.jsx',
    'src/components/layout/AppLayout.jsx',
    'src/components/issues/IssueCard.jsx'
];

const map = {
    // Ordered by longest key first to prevent partial replacements overlapping
    "bg-slate-950/80": "bg-slate-900/40",  // Darker backdrop for modals in light mode
    "bg-slate-950/50": "bg-slate-50/50",
    "bg-slate-900/95": "bg-white/95",
    "bg-slate-900/50": "bg-white/70",
    "bg-slate-900/30": "bg-slate-100/30",
    "border-slate-800/60": "border-slate-200/60",
    "bg-slate-800/60": "bg-slate-100/60",
    "bg-slate-800/50": "bg-slate-100/50",
    "bg-slate-800/30": "bg-slate-100/30",
    "from-slate-900": "from-slate-50",
    "to-slate-950": "to-slate-100",
    "hover:bg-slate-800": "hover:bg-slate-100",
    "hover:bg-slate-900": "hover:bg-white",
    "hover:text-white": "hover:text-slate-900",
    "border-slate-800": "border-slate-200",
    "border-slate-700": "border-slate-300",
    "bg-slate-950": "bg-slate-50",
    "bg-slate-900": "bg-white",
    "bg-slate-800": "bg-slate-100",
    "bg-slate-700": "bg-slate-200",
    "text-slate-100": "text-slate-900",
    "text-slate-200": "text-slate-800",
    "text-slate-300": "text-slate-700",
    "text-slate-400": "text-slate-500",
    "bg-black/50": "bg-slate-800/50",
};

const sortedKeys = Object.keys(map); // they are manually ordered above generally, wait let's sort properly
sortedKeys.sort((a, b) => b.length - a.length);

filesToProcess.forEach(relPath => {
    const absolutePath = path.join(__dirname, relPath);
    if (!fs.existsSync(absolutePath)) {
        console.warn(`File not found: ${absolutePath}`);
        return;
    }

    let content = fs.readFileSync(absolutePath, 'utf8');
    let originalContent = content;

    sortedKeys.forEach(key => {
        const value = map[key];
        const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedKey}\\b`, 'g');
        content = content.replace(regex, value);
    });

    if (content !== originalContent) {
        fs.writeFileSync(absolutePath, content, 'utf8');
        console.log(`Updated theme in ${relPath}`);
    }
});
