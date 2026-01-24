import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/providers/ToastProvider';
import { useConfirm } from '@/components/ui/Modal';
import { GuardDetailsModal, type GuardActionData } from './components/GuardDetailsModal';
import { accessService } from '@/lib/services/AccessService';
import { useGatePasses } from '@/hooks/useGatePasses';
import { useAuth } from '@/providers/useAuth';
import { getCurrentLocation, getDefaultGateId } from '@/lib/utils/gateLocation';
import type { GatePass } from './gatePassTypes';
import { isVisitorPass, isVehiclePass, canEnter, canExit, getPassTypeLabel } from './gatePassTypes';

// 🛡️ Guard Register
// Mobile-first interface for security guards to manage gate activities
// Shows expected visitors, who's inside, and quick entry/exit actions

export const GuardRegister: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { confirm, ConfirmComponent } = useConfirm();
  const { user } = useAuth();
  const [selectedRecord, setSelectedRecord] = useState<GatePass | null>(null);
  const [activeTab, setActiveTab] = useState<'expected' | 'inside'>('expected');
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Fetch today's expected and inside passes using unified hook
  const today = new Date().toISOString().split('T')[0];
  const { data: passesData, isLoading: loading } = useGatePasses({
    date_from: today,
    date_to: today,
    status: activeTab === 'expected' ? 'pending' : 'inside',
    per_page: 100,
  });

  const allPasses = passesData?.data || [];
  const visitorPasses = allPasses.filter((p: GatePass) => isVisitorPass(p));
  const vehicleMovements = allPasses.filter((p: GatePass) => !isVisitorPass(p));

  // Get GPS location on mount
  useEffect(() => {
    getCurrentLocation().then(setCurrentLocation);
  }, []);



  const handleMarkEntry = async (passId: string) => {
    try {
      // Fetch the full record to show in Guard Details Modal
      const record = await accessService.get(passId);
      setSelectedRecord(record);
    } catch {
      showToast({
        title: 'Error',
        description: 'Failed to load pass details. Please try again.',
        variant: 'error',
      });
    }
  };

  const handleConfirmEntry = async (data: GuardActionData) => {
    if (!selectedRecord) return;
    
    // Validation: Check if pass can enter
    if (!canEnter(selectedRecord)) {
      showToast({
        title: 'Validation Error',
        description: selectedRecord.status !== 'active' 
          ? 'Pass is not active. Cannot record entry.'
          : 'Pass has expired. Cannot record entry.',
        variant: 'error',
      });
      return;
    }

    // For vehicle passes: Check if vehicle is already inside
    if (isVehiclePass(selectedRecord)) {
      // Check if vehicle already has an active entry pass with status 'inside'
      const vehicleInside = vehicleMovements.some((p: GatePass) => 
        p.vehicle_id === selectedRecord.vehicle_id && 
        p.status === 'inside' &&
        p.id !== selectedRecord.id
      );
      
      if (vehicleInside) {
        showToast({
          title: 'Validation Error',
          description: 'Vehicle is already inside the yard. Cannot record entry.',
          variant: 'error',
        });
        return;
      }
    }
    
    try {
      // Prepare condition snapshot from asset checklist
      const conditionSnapshot = {
        asset_checklist: data.asset_checklist,
        incident_log: data.incident_log,
        escort_required: data.escort_required,
        escort_name: data.escort_name,
        supervisor_escalated: data.supervisor_escalated,
        escalation_reason: data.escalation_reason,
      };

      await accessService.recordEntry(selectedRecord.id, {
        notes: data.notes,
        guard_id: user?.id,
        gate_id: getDefaultGateId() || undefined,
        location: currentLocation || undefined,
        condition_snapshot: conditionSnapshot,
      });
      
      showToast({
        title: 'Success',
        description: 'Entry marked successfully! Movement and scan event created.',
        variant: 'success',
      });
      
      setSelectedRecord(null);
      // Refetch will happen automatically via React Query
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to mark entry';
      showToast({
        title: 'Error',
        description: errorMessage,
        variant: 'error',
      });
      throw new Error('Failed to mark entry'); // Re-throw so modal can handle it
    }
  };

  const handleMarkExit = async (passId: string) => {
    // Find the pass to validate
    const pass = allPasses.find((p: GatePass) => p.id === passId);
    
    if (!pass) {
      showToast({
        title: 'Error',
        description: 'Pass not found',
        variant: 'error',
      });
      return;
    }

    // Validation: Check if pass can exit
    if (!canExit(pass)) {
      showToast({
        title: 'Validation Error',
        description: 'Pass is not in a state that allows exit. Pass must be inside.',
        variant: 'error',
      });
      return;
    }

    // For vehicle passes: Check if vehicle is actually inside
    if (isVehiclePass(pass)) {
      if (pass.status !== 'inside') {
        showToast({
          title: 'Validation Error',
          description: 'Vehicle is not inside the yard. Cannot record exit.',
          variant: 'error',
        });
        return;
      }
    }

    const confirmed = await confirm({
      title: 'Mark Exit',
      message: `Mark this pass as exited? This will create a movement record.`,
      confirmLabel: 'Mark Exit',
      cancelLabel: 'Cancel',
    });
    
    if (!confirmed) return;

    try {
      await accessService.recordExit(passId, {
        guard_id: user?.id,
        gate_id: getDefaultGateId() || undefined,
        location: currentLocation || undefined,
      });
      
      showToast({
        title: 'Success',
        description: 'Exit marked successfully! Movement and scan event created.',
        variant: 'success',
      });
      // Refetch will happen automatically via React Query
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to mark exit';
      showToast({
        title: 'Error',
        description: errorMessage,
        variant: 'error',
      });
    }
  };

  const handleMarkReturn = async (movementId: string) => {
    navigate(`/app/stockyard/access/${movementId}`);
  };

  const currentlyInside = {
    visitors: visitorPasses.filter((p: GatePass) => p.status === 'inside').length,
    vehicles: vehicleMovements.filter((p: GatePass) => p.status === 'inside').length // inside = out for vehicles
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

  if (loading && allPasses.length === 0) {
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

          {visitorPasses.filter((p: GatePass) => p.status === 'pending').length === 0 ? (
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
              .filter((p: GatePass) => p.status === 'pending')
              .map((pass: GatePass) => (
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                          Pass #{pass.pass_number}
                        </div>
                        <div style={{ 
                          fontSize: '0.7rem',
                          color: '#6B7280',
                          backgroundColor: '#F3F4F6',
                          padding: '0.2rem 0.4rem',
                          borderRadius: '4px',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.3px',
                        }}>
                          {getPassTypeLabel(pass.pass_type)}
                        </div>
                      </div>
                      {pass.valid_from && (
                        <div style={{ 
                          fontSize: '0.75rem',
                          color: '#6B7280',
                          backgroundColor: '#F3F4F6',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px'
                        }}>
                          🕐 {formatTime(pass.valid_from)}
                        </div>
                      )}
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
                      <strong>👤 {pass.visitor_name}</strong>
                      {pass.additional_visitors && ` + ${pass.additional_visitors.split(',').length}`}
                      {pass.additional_head_count ? ` + ${pass.additional_head_count} more` : ''}
                    </div>
                    {pass.vehicles_to_view && pass.vehicles_to_view.length > 0 && (
                      <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                        🚗 Viewing: {pass.vehicles_to_view.join(', ')}
                      </div>
                    )}
                    {pass.referred_by && (
                      <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>
                        📝 Ref: {pass.referred_by}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleMarkEntry(pass.id)}
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
          {visitorPasses.filter((p: GatePass) => p.status === 'inside').length === 0 && 
           vehicleMovements.filter((p: GatePass) => p.status === 'inside').length === 0 ? (
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
                .filter((p: GatePass) => p.status === 'inside')
                .map((pass: GatePass) => (
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                            🟢 Pass #{pass.pass_number}
                          </div>
                          <div style={{ 
                            fontSize: '0.7rem',
                            color: '#166534',
                            backgroundColor: '#D1FAE5',
                            padding: '0.2rem 0.4rem',
                            borderRadius: '4px',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.3px',
                          }}>
                            {getPassTypeLabel(pass.pass_type)}
                          </div>
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
                        <strong>👤 {pass.visitor_name}</strong>
                        {pass.additional_visitors && ` + ${pass.additional_visitors.split(',').length}`}
                        {pass.additional_head_count ? ` + ${pass.additional_head_count} more` : ''}
                      </div>
                      {pass.vehicles_to_view && pass.vehicles_to_view.length > 0 && (
                        <div style={{ fontSize: '0.75rem', color: '#16A34A' }}>
                          🚗 {pass.vehicles_to_view.join(', ')}
                        </div>
                      )}
                      {pass.entry_time && (
                        <div style={{ fontSize: '0.75rem', color: '#16A34A', marginTop: '0.25rem' }}>
                          ⏰ Entry: {formatTime(pass.entry_time)} ({getTimeAgo(pass.entry_time)})
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => navigate(`/app/stockyard/access/${pass.id}`)}
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
                        onClick={() => handleMarkExit(pass.id)}
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
                .filter((p: GatePass) => p.status === 'inside') // inside = out for vehicles
                .map((movement: GatePass) => (
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                            🟡 Vehicle #{movement.pass_number}
                          </div>
                          <div style={{ 
                            fontSize: '0.7rem',
                            color: '#92400E',
                            backgroundColor: '#FEF3C7',
                            padding: '0.2rem 0.4rem',
                            borderRadius: '4px',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.3px',
                          }}>
                            {getPassTypeLabel(movement.pass_type)}
                          </div>
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
                      {movement.entry_time && (
                        <div style={{ fontSize: '0.75rem', color: '#B45309', marginTop: '0.25rem' }}>
                          🕒 Left: {formatTime(movement.entry_time)} ({getTimeAgo(movement.entry_time)})
                        </div>
                      )}
                      {movement.expected_return_date && (
                        <div style={{ fontSize: '0.75rem', color: '#B45309' }}>
                          ⏰ Expected: {new Date(movement.expected_return_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => navigate(`/app/stockyard/access/${movement.id}`)}
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
                        onClick={() => handleMarkReturn(movement.id)}
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
            onClick={() => navigate('/app/stockyard/access/create?type=visitor')}
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
            onClick={() => navigate('/app/stockyard/access/create?type=inbound')}
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