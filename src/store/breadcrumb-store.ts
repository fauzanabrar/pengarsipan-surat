let title: string | null = null;
type Listener = () => void;
const listeners = new Set<Listener>();

export const breadcrumbStore = {
    getTitle: () => title,
    setTitle: (newTitle: string | null) => {
        title = newTitle;
        listeners.forEach(l => l());
    },
    subscribe: (listener: Listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
    }
};
