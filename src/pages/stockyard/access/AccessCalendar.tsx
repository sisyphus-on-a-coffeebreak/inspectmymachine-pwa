import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/apiClient';
import { colors, typography, spacing, responsiveSpacing, cardStyles } from '@/lib/theme';
import { Button } from '@/components/ui/button';
import { ActionGrid, StatsGrid } from '@/components/ui/ResponsiveGrid';

// 📅 Access Calendar (formerly Gate Pass Calendar)
// Calendar view of all access passes
// Shows scheduled passes, active passes, and historical data

interface CalendarPass {
  id: string;
  type: 'visitor' | 'vehicle';
  title: string;
  date: string;
  time: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  visitor_name?: string;
  vehicle_registration?: string;
  purpose: string;
  duration?: string;
  color: string;
}

interface CalendarDay {
  date: string;
  day: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  passes: CalendarPass[];
}

export const AccessCalendar: React.FC = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedPasses, setSelectedPasses] = useState<CalendarPass[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  const fetchCalendarData = useCallback(async () => {
    try {
      setLoading(true);
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const response = await apiClient.get('/gate-pass-calendar', {
        params: {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0]
        }
      });
      
      // Process the response and create calendar days
      const days = generateCalendarDays(currentDate, response.data);
      setCalendarDays(days);
    } catch (error) {
      // Show empty state instead of mock data
      const days = generateCalendarDays(currentDate, []);
      setCalendarDays(days);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  const generateCalendarDays = (date: Date, passes: CalendarPass[]): CalendarDay[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const today = new Date();
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: CalendarDay[] = [];
    const currentDate = new Date(startDate);
    
    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayPasses = passes.filter(pass => pass.date === dateStr);
      
      days.push({
        date: dateStr,
        day: currentDate.getDate(),
        isToday: currentDate.toDateString() === today.toDateString(),
        isCurrentMonth: currentDate.getMonth() === month,
        passes: dayPasses
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleDateClick = (date: string, passes: CalendarPass[]) => {
    setSelectedDate(date);
    setSelectedPasses(passes);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return colors.status.warning;
      case 'active': return colors.status.success;
      case 'completed': return colors.neutral[500];
      case 'cancelled': return colors.status.error;
      default: return colors.neutral[400];
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'visitor' ? '👥' : '🚗';
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📅</div>
        <div style={{ color: '#6B7280' }}>Loading calendar...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '1400px', 
      margin: '0 auto', 
      padding: responsiveSpacing.padding.xl, // Responsive: clamp(32px, 6vw, 48px)
      fontFamily: typography.body.fontFamily,
      backgroundColor: colors.neutral[50],
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: spacing.xl,
        padding: responsiveSpacing.padding.lg, // Responsive: clamp(24px, 5vw, 32px)
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <div>
          <h1 style={{ 
            ...typography.header,
            fontSize: 'clamp(24px, 6vw, 28px)', // Responsive: 24px mobile, 28px desktop
            color: colors.neutral[900],
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm
          }}>
            📅 Gate Pass Calendar
          </h1>
          <p style={{ color: colors.neutral[600], marginTop: spacing.xs }}>
            Calendar view of all gate passes and activities
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: spacing.sm }}>
          <Button
            variant="secondary"
            onClick={() => navigate('/dashboard')}
            icon="🚪"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: responsiveSpacing.padding.lg, // Responsive: clamp(24px, 5vw, 32px)
        marginBottom: spacing.xl,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: spacing.lg
        }}>
          <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
            <Button
              variant="secondary"
              onClick={() => navigateMonth('prev')}
              icon="◀️"
            >
              Previous
            </Button>
            
            <h2 style={{ 
              ...typography.subheader,
              margin: 0,
              color: colors.neutral[900]
            }}>
              {currentDate.toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </h2>
            
            <Button
              variant="secondary"
              onClick={() => navigateMonth('next')}
              icon="▶️"
            >
              Next
            </Button>
          </div>
          
          <div style={{ display: 'flex', gap: spacing.sm }}>
            <Button
              variant={view === 'month' ? 'primary' : 'secondary'}
              onClick={() => setView('month')}
            >
              Month
            </Button>
            <Button
              variant={view === 'week' ? 'primary' : 'secondary'}
              onClick={() => setView('week')}
            >
              Week
            </Button>
            <Button
              variant={view === 'day' ? 'primary' : 'secondary'}
              onClick={() => setView('day')}
            >
              Day
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, 1fr)', 
          gap: '1px',
          backgroundColor: colors.neutral[200],
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          {/* Day Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} style={{
              backgroundColor: colors.neutral[100],
              padding: spacing.sm,
              textAlign: 'center',
              fontWeight: 600,
              color: colors.neutral[700],
              fontSize: 'clamp(13px, 3vw, 14px)' // Responsive: 13px mobile, 14px desktop
            }}>
              {day}
            </div>
          ))}
          
          {/* Calendar Days */}
          {calendarDays.map((day, index) => (
            <div
              key={index}
              onClick={() => handleDateClick(day.date, day.passes)}
              style={{
                backgroundColor: day.isCurrentMonth ? 'white' : colors.neutral[50],
                padding: spacing.sm,
                minHeight: '120px',
                border: day.isToday ? `2px solid ${colors.primary}` : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = day.isCurrentMonth ? colors.neutral[50] : colors.neutral[100];
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = day.isCurrentMonth ? 'white' : colors.neutral[50];
              }}
            >
              <div style={{
                fontWeight: day.isToday ? 700 : 600,
                color: day.isCurrentMonth ? colors.neutral[900] : colors.neutral[400],
                marginBottom: spacing.xs,
                fontSize: 'clamp(13px, 3vw, 14px)' // Responsive: 13px mobile, 14px desktop
              }}>
                {day.day}
              </div>
              
              {/* Pass Indicators */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {day.passes.slice(0, 3).map((pass, passIndex) => (
                  <div
                    key={passIndex}
                    style={{
                      backgroundColor: getStatusColor(pass.status),
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: 'clamp(10px, 2.5vw, 11px)', // Responsive: 10px mobile, 11px desktop
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {getTypeIcon(pass.type)} {pass.time}
                  </div>
                ))}
                {day.passes.length > 3 && (
                  <div style={{
                    color: colors.neutral[600],
                    fontSize: '10px',
                    fontWeight: 600
                  }}>
                    +{day.passes.length - 3} more
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: responsiveSpacing.padding.xl, // Responsive: clamp(32px, 6vw, 48px)
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ 
            ...typography.subheader,
            marginBottom: spacing.lg,
            color: colors.neutral[900]
          }}>
            📅 {new Date(selectedDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
          
          {selectedPasses.length > 0 ? (
            <div style={{ display: 'grid', gap: spacing.lg }}>
              {selectedPasses.map((pass) => (
                <div
                  key={pass.id}
                  style={{
                    padding: responsiveSpacing.padding.lg, // Responsive: clamp(24px, 5vw, 32px)
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    backgroundColor: '#F9FAFB',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: spacing.sm
                  }}>
                    <div>
                      <h4 style={{ 
                        ...typography.subheader,
                        marginBottom: spacing.xs,
                        color: colors.neutral[900]
                      }}>
                        {pass.title}
                      </h4>
                      <p style={{ 
                        ...typography.bodySmall,
                        color: colors.neutral[600],
                        marginBottom: spacing.xs
                      }}>
                        🕐 {pass.time} • {pass.duration || 'Duration not specified'}
                      </p>
                      <p style={{ 
                        ...typography.bodySmall,
                        color: colors.neutral[600],
                        textTransform: 'capitalize'
                      }}>
                        Purpose: {pass.purpose}
                      </p>
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      gap: spacing.sm,
                      alignItems: 'center'
                    }}>
                      <span style={{
                        padding: '4px 12px',
                        backgroundColor: getStatusColor(pass.status),
                        color: 'white',
                        borderRadius: '16px',
                        fontSize: 'clamp(12px, 3vw, 14px)', // Responsive: 12px mobile, 14px desktop
                        fontWeight: 600,
                        textTransform: 'capitalize'
                      }}>
                        {pass.status}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    gap: spacing.sm,
                    justifyContent: 'flex-end'
                  }}>
                    <Button
                      variant="secondary"
                      onClick={() => navigate(`/app/gate-pass/${pass.id}`)}
                      icon="👁️"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: colors.neutral[600]
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📅</div>
              <div style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                No passes scheduled for this date
              </div>
              <div>
                Click on a date with passes to view details
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

