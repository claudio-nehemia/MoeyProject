/**
 * Format project status from enum value to display text
 */
export const formatProjectStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
        'pending': 'Pending',
        'in_progress': 'In Progress',
        'completed': 'Completed',
    };
    return statusMap[status] || status;
};

/**
 * Format priority level from enum value to display text
 */
export const formatPriorityLevel = (priority: string): string => {
    const priorityMap: Record<string, string> = {
        'low': 'Low',
        'medium': 'Medium',
        'high': 'High',
    };
    return priorityMap[priority] || priority;
};

/**
 * Get CSS classes for project status badge
 */
export const getStatusBadgeColor = (status: string): string => {
    switch(status.toLowerCase()) {
        case 'completed': 
            return 'bg-emerald-100 text-emerald-700 border border-emerald-300';
        case 'in_progress': 
            return 'bg-blue-100 text-blue-700 border border-blue-300';
        case 'pending': 
            return 'bg-amber-100 text-amber-700 border border-amber-300';
        default: 
            return 'bg-stone-100 text-stone-700 border border-stone-300';
    }
};

/**
 * Get CSS classes for priority level badge (without borders)
 */
export const getPriorityBadgeColor = (priority: string): string => {
    switch(priority.toLowerCase()) {
        case 'high': 
            return 'bg-red-100 text-red-700';
        case 'medium': 
            return 'bg-blue-100 text-blue-700';
        case 'low': 
            return 'bg-stone-100 text-stone-700';
        default: 
            return 'bg-stone-100 text-stone-700';
    }
};

/**
 * Get CSS classes for priority level badge (with borders)
 */
export const getPriorityBadgeColorWithBorder = (priority: string): string => {
    switch(priority.toLowerCase()) {
        case 'high': 
            return 'bg-orange-100 text-orange-700 border border-orange-300';
        case 'medium': 
            return 'bg-blue-100 text-blue-700 border border-blue-300';
        case 'low': 
            return 'bg-stone-100 text-stone-700 border border-stone-300';
        default: 
            return 'bg-stone-100 text-stone-700 border border-stone-300';
    }
};

/**
 * Valid project status enum values
 */
export const PROJECT_STATUS_VALUES = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
} as const;

/**
 * Valid priority level enum values
 */
export const PRIORITY_LEVEL_VALUES = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
} as const;
