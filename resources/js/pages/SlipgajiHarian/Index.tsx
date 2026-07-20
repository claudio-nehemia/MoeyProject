import { useEffect } from 'react';
import { router } from '@inertiajs/react';

export default function Index() {
    useEffect(() => {
        router.visit('/slip-gaji');
    }, []);

    return (
        <div className="flex items-center justify-center min-h-screen bg-stone-50">
            <div className="text-center font-sans">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500 mx-auto"></div>
                <p className="mt-4 text-xs text-stone-500 font-medium">Redirecting to Payslips...</p>
            </div>
        </div>
    );
}
