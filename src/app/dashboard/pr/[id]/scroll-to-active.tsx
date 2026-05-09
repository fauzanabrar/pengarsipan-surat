'use client';

import { useEffect } from 'react';

export function ScrollToActive({ activeIndex }: { activeIndex: number }) {
    useEffect(() => {
        const element = document.getElementById(`step-${activeIndex}`);
        if (element) {
            // Wait a bit for layout to settle
            setTimeout(() => {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }, [activeIndex]);

    return null;
}
