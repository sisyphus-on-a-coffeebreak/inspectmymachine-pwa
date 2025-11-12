import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { VisitorGatePass, VehicleMovementPass } from './gatePassTypes';
import { postWithCsrf } from '../../lib/csrf';
import { useToast } from '../../providers/ToastProvider';
import { useConfirm } from '../../components/ui/Modal';
import { GuardDetailsModal, type GuardActionData } from '../../components/gatepass/GuardDetailsModal';
import { gatePassService, type UnifiedGatePassRecord } from '../../lib/services/GatePassService';

// 🛡️ Guard Register
// Mobile-first interface for security guards to manage gate activities
// Shows expected visitors, who's inside, and quick entry/exit actions

export const GuardRegister: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { confirm, ConfirmComponent } = useConfirm();
  const [visitorPasses, setVisitorPasses] = useState<VisitorGatePass[]>([]);
  const [vehicleMovements, setVehicleMovements] = useState<VehicleMovementPass[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'expected' | 'inside'>('expected');
  const [selectedRecord, setSelectedRecord] = useState<UnifiedGatePassRecord | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch today's expected and inside passes
      const today = new Date().toISOString().split('T')[0];
      
      const visitorResponse = await axios.get('/visitor-gate-passes', {
        params: { 
          date: today,
          status: activeTab === 'expected' ? 'pending' : 'inside'
        }
      });

      const vehicleResponse = await axios.get('/vehicle-entry-passes', {
        params: { status: 'out' }
      });

      // Handle response structure - backend may return { success: true, data: [...] } or just [...]
      const visitorData = Array.isArray(visitorResponse.data) 
        ? visitorResponse.data 
        : (visitorResponse.data?.data || []);
      const vehicleData = Array.isArray(vehicleResponse.data) 
        ? vehicleResponse.data 
        : (vehicleResponse.data?.data || []);

      setVisitorPasses(Array.isArray(visitorData) ? visitorData : []);
      setVehicleMovements(Array.isArray(vehicleData) ? vehicleData : []);

    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  } , [activeTab]);

  useEffect(() => {
    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);


  const handleMarkEntry = async (passId: number, type: 'visitor' | 'vehicle') => {
    try {
      // Fetch the full record to show in Guard Details Modal
      const record = await gatePassService.get(String(passId), type);
      setSelectedRecord(record);
    } catch (error) {
      console.error('Failed to fetch record:', error);
      showToast({
        title: 'Error',
        description: 'Failed to load pass details. Please try again.',
        variant: 'error',
      });
    }
  };

  const handleConfirmEntry = async (data: GuardActionData) => {
    if (!selectedRecord) return;
    
    try {
      await gatePassService.markEntry(selectedRecord.id, selectedRecord.type, {
        notes: data.notes,
        incident_log: data.incident_log,
        escort_required: data.escort_required,
        asset_checklist: data.asset_checklist,
      });
      
      showToast({
        title: 'Success',
        description: 'Entry marked successfully!',
        variant: 'success',
      });
      
      setSelectedRecord(null);
      fetchData();
    } catch (error) {
      console.error('Failed to mark entry:', error);
      showToast({
        title: 'Error',
        description: 'Failed to mark entry. Please try again.',
        variant: 'error',
      });
      throw error; // Re-throw so modal can handle it
    }
  };

  const handleMarkExit = async (passId: number, type: 'visitor' | 'vehicle') => {
    const confirmed = await confirm({
      title: 'Mark Exit',
      message: `Mark this ${type === 'visitor' ? 'visitor' : 'vehicle'} as exited?`,
      confirmLabel: 'Mark Exit',
      cancelLabel: 'Cancel',
    });
    
    if (!confirmed) return;

    try {
      await gatePassService.markExit(String(passId), type);
      showToast({
        title: 'Success',
        description: 'Exit marked successfully!',
        variant: 'success',
      });
      fetchData();
    } catch (error) {
      console.error('Failed to mark exit:', error);
      showToast({
        title: 'Error',
        description: 'Failed to mark exit. Please try again.',
        variant: 'error',
      });
    }
  };

  const handleMarkReturn = async (movementId: number) => {
    navigate(`/app/gate-pass/vehicle/${movementId}/return`);
  };

  const currentlyInside = {
    visitors: visitorPasses.filter(p => p.status === 'inside').length,
    vehicles: vehicleMovements.filter(v => v.status === 'out').length
  };

  const expectedToday = visitorPasses.filter(p => p.status === 'pending').length;

  const todayStats = {
    total_visitors: visitorPasses.length,
    total_vehicles: vehicleMovements.length
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return '';
    const minutes = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ago`;
  };

  if (loading && visitorPasses.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <div style={{ color: '#6B7280' }}>Loading register...</div>
      </div>
    );
  }

  return (
    <>
      {ConfirmComponent}
      {selectedRecord && (
        <GuardDetailsModal
          record={selectedRecord}
          onConfirm={handleConfirmEntry}
          onCancel={() => setSelectedRecord(null)}
          onClose={() => setSelectedRecord(null)}
          showSlaTimer={true}
          slaSeconds={300}
        />
      )}
      <div style={{ 
        maxWidth: '600px', 
        margin: '0 auto', 
        padding: '1rem',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      paddingBottom: '5rem' // Space for bottom nav
    }}>
      {/* Header */}
      <div style={{ 
        marginBottom: '1.5rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid #E5E7EB'
      }}>
        <h1 style={{ 
          fontSize: '1.25rem', 
          fontWeight: 600, 
          margin: 0,
          marginBottom: '0.5rem'
        }}>
          🛡️ Security Register
        </h1>
        <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric',
            year: 'numeric'
          })}
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          padding: '1rem',
          backgroundColor: '#F0FDF4',
          borderRadius: '8px',
          border: '1px solid #BBF7D0'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#16A34A', marginBottom: '0.25rem' }}>
            ⏰ Currently Inside:
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#15803D' }}>
            {currentlyInside.visitors} 👥 | {currentlyInside.vehicles} 🚗
          </div>
        </div>
        <div style={{
          padding: '1rem',
          backgroundColor: '#FEF3C7',
          borderRadius: '8px',
          border: '1px solid #FDE68A'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#D97706', marginBottom: '0.25rem' }}>
            📥 Expected Today:
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#B45309' }}>
            {expectedToday}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        backgroundColor: '#F9FAFB',
        padding: '0.25rem',
        borderRadius: '8px'
      }}>
        <button
          onClick={() => setActiveTab('expected')}
          style={{
            flex: 1,
            padding: '0.75rem',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: activeTab === 'expected' ? 'white' : 'transparent',
            color: activeTab === 'expected' ? '#111827' : '#6B7280',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
            boxShadow: activeTab === 'expected' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          📥 Expected Arrivals
        </button>
        <button
          onClick={() => setActiveTab('inside')}
          style={{
            flex: 1,
            padding: '0.75rem',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: activeTab === 'inside' ? 'white' : 'transparent',
            color: activeTab === 'inside' ? '#111827' : '#6B7280',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
            boxShadow: activeTab === 'inside' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          👁️ Inside Now
        </button>
      </div>

      {/* Expected Arrivals Tab */}
      {activeTab === 'expected' && (
        <>
          <h2 style={{ 
            fontSize: '1rem', 
            fontWeight: 600, 
            marginBottom: '1rem',
            color: '#111827'
          }}>
            📥 Expected Arrivals
          </h2>

          {visitorPasses.filter(p => p.status === 'pending').length === 0 ? (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              border: '2px dashed #E5E7EB',
              borderRadius: '12px',
              color: '#6B7280'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
              <div style={{ fontSize: '0.875rem' }}>No expected arrivals</div>
            </div>
          ) : (
            visitorPasses
              .filter(p => p.status === 'pending')
              .map(pass => (
                <div
                  key={pass.id}
                  style={{
                    padding: '1rem',
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    backgroundColor: 'white',
                    marginBottom: '1rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                >
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                        Pass #{pass.pass_number}
                      </div>
                      <div style={{ 
                        fontSize: '0.75rem',
                        color: '#6B7280',
                        backgroundColor: '#F3F4F6',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px'
                      }}>
                        🕐 {pass.expected_time}
                      </div>
                    </div>
                    <div style={{ height: '1px', backgroundColor: '#E5E7EB' }} />
                  </div>

                  <div style={{ 
                    fontSize: '0.875rem',
                    color: '#374151',
                    marginBottom: '0.75rem',
                    lineHeight: 1.6
                  }}>
                    <div style={{ marginBottom: '0.25rem' }}>
                      <strong>👤 {pass.primary_visitor_name}</strong>
                      {pass.additional_visitors && ` + ${pass.additional_visitors.split(',').length}`}
                      {pass.additional_head_count ? ` + ${pass.additional_head_count} more` : ''}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                      🚗 Viewing: {pass.vehicles?.map(v => v.registration_number).join(', ')}
                    </div>
                    {pass.referred_by && (
                      <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>
                        📝 Ref: {pass.referred_by}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleMarkEntry(pass.id!, 'visitor')}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: 'none',
                      borderRadius: '8px',
                      backgroundColor: '#10B981',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      cursor: 'pointer'
                    }}
                  >
                    ✓ Mark Entry
                  </button>
                </div>
              ))
          )}
        </>
      )}

      {/* Inside Now Tab */}
      {activeTab === 'inside' && (
        <>
          <h2 style={{ 
            fontSize: '1rem', 
            fontWeight: 600, 
            marginBottom: '1rem',
            color: '#111827'
          }}>
            👁️ Inside Now
          </h2>

          {/* Visitors Inside */}
          {visitorPasses.filter(p => p.status === 'inside').length === 0 && 
           vehicleMovements.filter(v => v.status === 'out').length === 0 ? (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              border: '2px dashed #E5E7EB',
              borderRadius: '12px',
              color: '#6B7280'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏛️</div>
              <div style={{ fontSize: '0.875rem' }}>Yard is empty</div>
            </div>
          ) : (
            <>
              {visitorPasses
                .filter(p => p.status === 'inside')
                .map(pass => (
                  <div
                    key={pass.id}
                    style={{
                      padding: '1rem',
                      border: '2px solid #10B981',
                      borderRadius: '12px',
                      backgroundColor: '#F0FDF4',
                      marginBottom: '1rem'
                    }}
                  >
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ 
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.5rem'
                      }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                          🟢 Pass #{pass.pass_number}
                        </div>
                      </div>
                      <div style={{ height: '1px', backgroundColor: '#BBF7D0' }} />
                    </div>

                    <div style={{ 
                      fontSize: '0.875rem',
                      color: '#166534',
                      marginBottom: '0.75rem',
                      lineHeight: 1.6
                    }}>
                      <div style={{ marginBottom: '0.25rem' }}>
                        <strong>👤 {pass.primary_visitor_name}</strong>
                        {pass.additional_visitors && ` + ${pass.additional_visitors.split(',').length}`}
                        {pass.additional_head_count ? ` + ${pass.additional_head_count} more` : ''}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#16A34A' }}>
                        🚗 {pass.vehicles?.map(v => v.registration_number).join(', ')}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#16A34A', marginTop: '0.25rem' }}>
                        ⏰ Entry: {formatTime(pass.entry_time)} ({getTimeAgo(pass.entry_time)})
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => {/* TODO: Add visitor pass modal */}}
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          border: '1px solid #BBF7D0',
                          borderRadius: '8px',
                          backgroundColor: 'white',
                          color: '#166534',
                          fontWeight: 500,
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        👁️ Details
                      </button>
                      <button
                        onClick={() => handleMarkExit(pass.id!, 'visitor')}
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          border: 'none',
                          borderRadius: '8px',
                          backgroundColor: '#166534',
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        ✓ Mark Exit
                      </button>
                    </div>
                  </div>
                ))}

              {/* Vehicles Out */}
              {vehicleMovements
                .filter(v => v.status === 'out')
                .map(movement => (
                  <div
                    key={movement.id}
                    style={{
                      padding: '1rem',
                      border: '2px solid #F59E0B',
                      borderRadius: '12px',
                      backgroundColor: '#FFFBEB',
                      marginBottom: '1rem'
                    }}
                  >
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ 
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.5rem'
                      }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                          🟡 Vehicle #{movement.pass_number}
                        </div>
                      </div>
                      <div style={{ height: '1px', backgroundColor: '#FDE68A' }} />
                    </div>

                    <div style={{ 
                      fontSize: '0.875rem',
                      color: '#92400E',
                      marginBottom: '0.75rem',
                      lineHeight: 1.6
                    }}>
                      <div style={{ marginBottom: '0.25rem' }}>
                        <strong>🚗 {movement.vehicle?.registration_number}</strong>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#B45309' }}>
                        {movement.purpose.replace('_', ' ').toUpperCase()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#B45309' }}>
                        👤 Driver: {movement.driver_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#B45309', marginTop: '0.25rem' }}>
                        🕒 Left: {formatTime(movement.departure_time)} ({getTimeAgo(movement.departure_time)})
                      </div>
                      {movement.expected_return_date && (
                        <div style={{ fontSize: '0.75rem', color: '#B45309' }}>
                          ⏰ Expected: {new Date(movement.expected_return_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => navigate(`/app/gate-pass/vehicle/${movement.id}`)}
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          border: '1px solid #FDE68A',
                          borderRadius: '8px',
                          backgroundColor: 'white',
                          color: '#92400E',
                          fontWeight: 500,
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        👁️ Details
                      </button>
                      <button
                        onClick={() => handleMarkReturn(movement.id!)}
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          border: 'none',
                          borderRadius: '8px',
                          backgroundColor: '#92400E',
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        ✓ Mark Return
                      </button>
                    </div>
                  </div>
                ))}
            </>
          )}
        </>
      )}

      {/* Quick Actions Section */}
      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ 
          fontSize: '1rem', 
          fontWeight: 600, 
          marginBottom: '1rem',
          color: '#111827'
        }}>
          🚶 Walk-ins & Quick Log
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            onClick={() => navigate('/app/gate-pass/create-visitor')}
            style={{
              padding: '1rem',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              backgroundColor: 'white',
              color: '#374151',
              fontWeight: 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            + Log Walk-in Visitor
          </button>
          <button
            onClick={() => navigate('/app/gate-pass/create-vehicle')}
            style={{
              padding: '1rem',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              backgroundColor: 'white',
              color: '#374151',
              fontWeight: 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            + Log Quick Vehicle Entry
          </button>
        </div>
      </div>

      {/* Today's Summary */}
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: '#F9FAFB',
        borderRadius: '8px',
        border: '1px solid #E5E7EB'
      }}>
        <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          📊 Today's Summary
        </div>
        <div style={{ fontSize: '0.75rem', color: '#6B7280', lineHeight: 1.6 }}>
          <div>├─ Total Visitors: {todayStats.total_visitors}</div>
          <div>├─ Total Vehicle Movements: {todayStats.total_vehicles}</div>
          <div>└─ Currently Inside: {currentlyInside.visitors + currentlyInside.vehicles}</div>
        </div>
      </div>

      {/* Full Register Link */}
      <button
        onClick={() => navigate('/dashboard')}
        style={{
          width: '100%',
          padding: '1rem',
          marginTop: '1rem',
          border: '1px solid #3B82F6',
          borderRadius: '8px',
          backgroundColor: 'white',
          color: '#3B82F6',
          fontWeight: 600,
          fontSize: '0.875rem',
          cursor: 'pointer'
        }}
      >
        📋 View Full Dashboard
      </button>
      </div>
    </>
  );
};