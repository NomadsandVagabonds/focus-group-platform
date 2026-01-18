import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './admin.module.css';

interface AdminLayoutClientProps {
    children: React.ReactNode;
}

export default function AdminLayoutClient({ children }: AdminLayoutClientProps) {
    const pathname = usePathname();

    const navItems = [
        { href: '/admin', label: 'Sessions', icon: '📋' },
        { href: '/admin/data', label: 'Data', icon: '📊' },
        { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
    ];

    const isActive = (href: string) => {
        if (href === '/admin') {
            return pathname === '/admin' || pathname?.startsWith('/admin/sessions');
        }
        return pathname?.startsWith(href);
    };

    return (
        <div className={styles.dashboardLayout}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <div className={styles.logoMark}>R</div>
                    <span className={styles.logoTextSmall}>Resonant</span>
                </div>

                <nav className={styles.sidebarNav}>
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.navItem} ${isActive(item.href) ? styles.navItemActive : ''}`}
                        >
                            <span className={styles.navIcon}>{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className={styles.sidebarFooter}>
                    <Link href="/" className={styles.backToApp}>
                        ← Back to App
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className={styles.mainContent}>
                {children}
            </main>
        </div>
    );
}
