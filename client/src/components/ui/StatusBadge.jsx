import { cva } from "class-variance-authority";
import { cn } from "@/utils/cn";

const badgeVariants = cva(
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
        variants: {
            status: {
                Pending: "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20",
                "In Progress": "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
                Resolved: "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20",
                Rejected: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
            },
        },
        defaultVariants: {
            status: "Pending",
        },
    }
);

export function StatusBadge({ status, className }) {
    return (
        <div className={cn(badgeVariants({ status }), className)}>
            <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current" />
            {status}
        </div>
    );
}
