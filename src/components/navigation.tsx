'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [{ href: '/', label: 'Overview', icon: '◫' }, { href: '/audits', label: 'Website audits', icon: '◎' }, { href: '/settings', label: 'Settings', icon: '⚙' }, { href: '/health', label: 'System health', icon: '♡' }];
export default function Navigation() {
  const pathname = usePathname();
  return <nav aria-label="Main navigation" className="navigation">{items.map(item => {
    const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
    return <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={active ? 'active' : ''}><span aria-hidden="true">{item.icon}</span>{item.label}{active && <i aria-hidden="true"/>}</Link>;
  })}</nav>;
}
