/**
 * GatePassService Tests
 * 
 * Tests for gate pass creation payload normalization
 */

import { gatePassService } from '../GatePassService';
import type { CreateVisitorPassData } from '@/pages/gatepass/gatePassTypes';

// Mock apiClient
jest.mock('../../apiClient', () => ({
  apiClient: {
    post: jest.fn(),
  },
  normalizeError: jest.fn((error) => error),
}));

import { apiClient } from '../../apiClient';

describe('GatePassService.create', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should normalize vehicles_to_view to plain array of strings', async () => {
    const mockResponse = {
      data: {
        id: 'test-id',
        pass_number: 'VP-2025-000001',
        pass_type: 'visitor',
      },
    };

    (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

    const payload: CreateVisitorPassData = {
      pass_type: 'visitor',
      visitor_name: 'Test Visitor',
      visitor_phone: '9090909090',
      referred_by: 'Direct',
      vehicles_to_view: ['uuid-1', 'uuid-2'],
      purpose: 'inspection',
      valid_from: '2025-12-05T00:00:00Z',
      valid_to: '2025-12-05T04:00:00Z',
    };

    await gatePassService.create(payload);

    expect(apiClient.post).toHaveBeenCalledWith(
      '/v2/gate-passes',
      expect.objectContaining({
        vehicles_to_view: ['uuid-1', 'uuid-2'],
      })
    );

    const callArgs = (apiClient.post as jest.Mock).mock.calls[0];
    const sentPayload = callArgs[1];
    
    expect(Array.isArray(sentPayload.vehicles_to_view)).toBe(true);
    expect(sentPayload.vehicles_to_view.every((id: any) => typeof id === 'string')).toBe(true);
  });

  it('should handle vehicles_to_view with mixed types and normalize to strings', async () => {
    const mockResponse = {
      data: {
        id: 'test-id',
        pass_number: 'VP-2025-000001',
        pass_type: 'visitor',
      },
    };

    (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

    const payload = {
      pass_type: 'visitor' as const,
      visitor_name: 'Test Visitor',
      visitor_phone: '9090909090',
      referred_by: 'Direct',
      vehicles_to_view: [123, 'uuid-2', null, undefined, ''],
      purpose: 'inspection' as const,
      valid_from: '2025-12-05T00:00:00Z',
      valid_to: '2025-12-05T04:00:00Z',
    };

    await gatePassService.create(payload);

    const callArgs = (apiClient.post as jest.Mock).mock.calls[0];
    const sentPayload = callArgs[1];
    
    expect(Array.isArray(sentPayload.vehicles_to_view)).toBe(true);
    expect(sentPayload.vehicles_to_view).toEqual(['123', 'uuid-2']);
    expect(sentPayload.vehicles_to_view.every((id: any) => typeof id === 'string' && id.length > 0)).toBe(true);
  });

  it('should handle empty vehicles_to_view array', async () => {
    const mockResponse = {
      data: {
        id: 'test-id',
        pass_number: 'VP-2025-000001',
        pass_type: 'visitor',
      },
    };

    (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

    const payload = {
      pass_type: 'visitor' as const,
      visitor_name: 'Test Visitor',
      visitor_phone: '9090909090',
      referred_by: 'Direct',
      vehicles_to_view: [],
      purpose: 'inspection' as const,
      valid_from: '2025-12-05T00:00:00Z',
      valid_to: '2025-12-05T04:00:00Z',
    };

    await gatePassService.create(payload);

    const callArgs = (apiClient.post as jest.Mock).mock.calls[0];
    const sentPayload = callArgs[1];
    
    expect(Array.isArray(sentPayload.vehicles_to_view)).toBe(true);
    expect(sentPayload.vehicles_to_view).toEqual([]);
  });
});
