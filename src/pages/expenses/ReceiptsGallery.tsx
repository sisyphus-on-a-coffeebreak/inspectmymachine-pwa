import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { colors, typography, spacing } from '../../lib/theme';
import { Button } from '../../components/ui/button';
import { EmptyState } from '../../components/ui/EmptyState';

type ReceiptItem = {
  id: string;
  amount: number;
  category: string;
  notes?: string;
  created_at: string;
  receipt_key?: string;
  project_name?: string;
  asset_name?: string;
};

export const ReceiptsGallery: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReceipts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/v1/expenses', { params: { mine: true } });
      const raw = Array.isArray(res.data) ? res.data : (res.data?.items ?? []);
      const mapped: ReceiptItem[] = raw.map((e: any) => ({
        id: String(e.id),
        amount: Number(e.amount ?? 0),
        category: String(e.category ?? 'OTHER'),
        notes: e.notes ?? '',
        created_at: e.ts ? new Date(e.ts).toISOString() : new Date().toISOString(),
        receipt_key: e.receipt_key ?? '',
        project_name: e.project_name ?? undefined,
        asset_name: e.asset_name ?? undefined,
      }));
      setItems(mapped);
    } catch (err) {
      console.error('Failed to fetch receipts', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReceipts(); }, [fetchReceipts]);

  const imgUrl = (key?: string) => key ? `/storage/${key}` : '';

  if (loading) {
    return (
      <div style={{ padding: spacing.xl, textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>📄</div>
        <div style={{ color: colors.neutral[600] }}>Loading receipts...</div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: spacing.xl,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: colors.neutral[50],
      minHeight: '100vh'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xl,
        padding: spacing.lg,
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <div>
          <h1 style={{ ...typography.header, fontSize: '28px', color: colors.neutral[900], margin: 0 }}>📄 Receipts</h1>
          <p style={{ color: colors.neutral[600], marginTop: spacing.xs }}>All your receipt photos in a gallery view</p>
        </div>
        <div style={{ display: 'flex', gap: spacing.sm }}>
          <Button variant="secondary" onClick={() => navigate('/app/expenses')}>
            ← Back
          </Button>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: spacing.lg
      }}>
        {items.map((it) => (
          <div key={it.id} style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid rgba(0,0,0,0.05)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <div style={{
              width: '100%',
              height: '160px',
              backgroundColor: colors.neutral[200],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {it.receipt_key ? (
                <img
                  src={imgUrl(it.receipt_key)}
                  alt={`Receipt ${it.id}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ color: colors.neutral[600] }}>No Image</span>
              )}
            </div>

            <div style={{ padding: spacing.md }}>
              <div style={{ ...typography.subheader, color: colors.neutral[900], marginBottom: spacing.xs }}>
                ₹{it.amount.toLocaleString('en-IN')} • {it.category}
              </div>
              <div style={{ ...typography.bodySmall, color: colors.neutral[600], marginBottom: spacing.xs }}>
                {new Date(it.created_at).toLocaleString('en-IN')}
              </div>
              {(it.project_name || it.asset_name) && (
                <div style={{ ...typography.caption, color: colors.neutral[500] }}>
                  {it.project_name && `Project: ${it.project_name}`}
                  {it.project_name && it.asset_name && ' • '}
                  {it.asset_name && `Asset: ${it.asset_name}`}
                </div>
              )}
              {it.notes && (
                <div style={{ ...typography.caption, color: colors.neutral[600], marginTop: spacing.xs }}>
                  “{it.notes}”
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <EmptyState
          icon="🗂️"
          title="No Receipts Found"
          description="You haven't uploaded any receipt photos yet. Add expenses with receipt photos to see them here."
          action={{
            label: "Add Expense with Receipt",
            onClick: () => navigate('/app/expenses/create'),
            icon: "📷"
          }}
          secondaryAction={{
            label: "View All Expenses",
            onClick: () => navigate('/app/expenses/history'),
            icon: "📊"
          }}
        />
      )}
    </div>
  );
};

export default ReceiptsGallery;


