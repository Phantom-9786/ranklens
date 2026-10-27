import type { Metadata } from 'next';
import AuditChat from '@/components/audit-chat';
import { modelConfigured } from '@/lib/ai-config';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Audit assistant' };
export default function AssistantPage() { return <AuditChat configured={modelConfigured()}/>; }
