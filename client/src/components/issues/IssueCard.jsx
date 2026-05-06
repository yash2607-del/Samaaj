import { motion } from "framer-motion";
import { MapPin, Clock, AlertCircle } from "lucide-react";
import { StatusBadge } from "../ui/StatusBadge";
import { formatDistanceToNow } from "date-fns";

export function IssueCard({ issue, onClick }) {
    // Gracefull fallback for missing dates
    const rawDate = issue.createdAt || issue.date;
    const dateObj = rawDate ? new Date(rawDate) : new Date();

    return (
        <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => onClick(issue._id || issue.id)}
            className="group cursor-pointer rounded-xl border border-slate-200 bg-white/70 backdrop-blur-sm p-4 transition-all hover:bg-slate-100 hover:shadow-xl hover:shadow-blue-500/5"
        >
            <div className="flex justify-between items-start mb-3">
                <div className="flex flex-col gap-1.5">
                    <StatusBadge status={issue.status || "Pending"} />
                    {issue.mlReviewStatus && (
                        <StatusBadge status={issue.mlReviewStatus} className="text-[10px] py-0.5 px-2" />
                    )}
                </div>
                <span className="text-xs font-medium text-slate-500 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatDistanceToNow(dateObj)} ago
                </span>
            </div>

            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-blue-400 transition-colors line-clamp-1">
                {issue.title || issue.issueType || "Unknown Issue"}
            </h3>

            <p className="mt-2 text-sm text-slate-500 line-clamp-2">
                {issue.description || "No description provided."}
            </p>

            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                    <span className="line-clamp-1">{issue.location || "Unknown location"}</span>
                </div>

                <div className="flex flex-col items-end gap-1">
                    {issue.trustScore !== undefined && (
                        <div className="flex items-center gap-1 bg-slate-100/80 px-2 py-0.5 rounded text-[10px] font-bold">
                            <span className={issue.trustScore > 0.7 ? "text-emerald-500" : issue.trustScore < 0.4 ? "text-red-500" : "text-amber-500"}>
                                TRUST: {(issue.trustScore * 100).toFixed(0)}%
                            </span>
                        </div>
                    )}
                    {issue.mlConfidence && (
                        <div className="flex items-center gap-1 bg-slate-100/50 px-2 py-1 rounded-md scale-90 origin-right">
                            <AlertCircle className="w-3 h-3 text-indigo-400" />
                            <span className="text-indigo-600 font-medium">AI Match: {(issue.mlConfidence * 100).toFixed(0)}%</span>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
