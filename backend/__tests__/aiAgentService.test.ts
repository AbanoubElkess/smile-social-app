import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { aiAgentService, CreateAIAgentData, VideoGenerationData } from '../src/services/aiAgentService';
import { AppError, NotFoundError, ValidationError, AuthorizationError } from '../src/utils/errors';

// Mock PrismaClient
jest.mock('@prisma/client');
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
  },
  aIAgent: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  subscription: {
    findFirst: jest.fn(),
  },
} as any;

// Mock the PrismaClient constructor
(PrismaClient as jest.MockedClass<typeof PrismaClient>).mockImplementation(() => mockPrisma);

describe('AIAgentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createAgent', () => {
    const mockCreatorId = 'user-123';
    const mockAgentData: CreateAIAgentData = {
      name: 'Test Agent',
      username: 'test-agent',
      description: 'A test AI agent',
      personality: {
        traits: ['helpful', 'friendly'],
        communicationStyle: 'casual',
        expertise: ['general'],
        responsePatterns: {}
      },
      capabilities: ['chat', 'video-generation'],
      pricing: {
        model: 'FREE'
      },
      systemPrompt: 'You are a helpful AI assistant',
      avatar: 'https://example.com/avatar.jpg'
    };

    it('should create a new AI agent successfully', async () => {
      const mockUser = { id: mockCreatorId, username: 'testuser' };
      const mockCreatedAgent = { id: 'agent-123', ...mockAgentData, creatorId: mockCreatorId };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.aIAgent.findUnique.mockResolvedValue(null); // Username available
      mockPrisma.aIAgent.create.mockResolvedValue(mockCreatedAgent);

      const result = await aiAgentService.createAgent(mockCreatorId, mockAgentData);

      expect(result).toEqual(mockCreatedAgent);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockCreatorId }
      });
      expect(mockPrisma.aIAgent.findUnique).toHaveBeenCalledWith({
        where: { username: mockAgentData.username }
      });
      expect(mockPrisma.aIAgent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          creatorId: mockCreatorId,
          name: mockAgentData.name,
          username: mockAgentData.username,
          description: mockAgentData.description
        })
      });
    });

    it('should throw NotFoundError when creator does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(aiAgentService.createAgent(mockCreatorId, mockAgentData))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError when username already exists', async () => {
      const mockUser = { id: mockCreatorId, username: 'testuser' };
      const mockExistingAgent = { id: 'existing-agent', username: mockAgentData.username };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.aIAgent.findUnique.mockResolvedValue(mockExistingAgent);

      await expect(aiAgentService.createAgent(mockCreatorId, mockAgentData))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('generateProductVideo', () => {
    const mockAgentId = 'agent-123';
    const mockUserId = 'user-123';
    const mockVideoData: VideoGenerationData = {
      productName: 'Test Product',
      productDescription: 'A test product',
      productFeatures: ['feature1', 'feature2'],
      dimensions: {
        width: 1920,
        height: 1080
      },
      duration: 30,
      style: 'modern'
    };

    it('should generate video for free agent successfully', async () => {
      const mockAgent = {
        id: mockAgentId,
        name: 'Test Agent',
        pricing: { model: 'FREE' },
        personality: { traits: ['helpful'] },
        capabilities: ['video-generation']
      };

      mockPrisma.aIAgent.findUnique.mockResolvedValue(mockAgent);

      const result = await aiAgentService.generateProductVideo(mockAgentId, mockUserId, mockVideoData);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('thumbnailUrl');
      expect(result.dimensions).toEqual(mockVideoData.dimensions);
      expect(result.duration).toBe(mockVideoData.duration);
      expect(mockPrisma.aIAgent.findUnique).toHaveBeenCalledWith({
        where: { id: mockAgentId }
      });
    });

    it('should generate video for paid agent with active subscription', async () => {
      const mockAgent = {
        id: mockAgentId,
        name: 'Test Agent',
        pricing: { model: 'PAID' },
        personality: { traits: ['helpful'] },
        capabilities: ['video-generation']
      };
      const mockSubscription = {
        id: 'sub-123',
        userId: mockUserId,
        agentId: mockAgentId,
        status: 'ACTIVE'
      };

      mockPrisma.aIAgent.findUnique.mockResolvedValue(mockAgent);
      mockPrisma.subscription.findFirst.mockResolvedValue(mockSubscription);

      const result = await aiAgentService.generateProductVideo(mockAgentId, mockUserId, mockVideoData);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('url');
      expect(mockPrisma.subscription.findFirst).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          agentId: mockAgentId,
          status: 'ACTIVE'
        }
      });
    });

    it('should throw NotFoundError when agent does not exist', async () => {
      mockPrisma.aIAgent.findUnique.mockResolvedValue(null);

      await expect(aiAgentService.generateProductVideo(mockAgentId, mockUserId, mockVideoData))
        .rejects.toThrow(NotFoundError);
    });

    it('should throw AuthorizationError for paid agent without subscription', async () => {
      const mockAgent = {
        id: mockAgentId,
        name: 'Test Agent',
        pricing: { model: 'PAID' },
        personality: { traits: ['helpful'] },
        capabilities: ['video-generation']
      };

      mockPrisma.aIAgent.findUnique.mockResolvedValue(mockAgent);
      mockPrisma.subscription.findFirst.mockResolvedValue(null);

      await expect(aiAgentService.generateProductVideo(mockAgentId, mockUserId, mockVideoData))
        .rejects.toThrow(AuthorizationError);
    });

    it('should throw ValidationError for invalid video dimensions', async () => {
      const mockAgent = {
        id: mockAgentId,
        name: 'Test Agent',
        pricing: { model: 'FREE' }
      };

      const invalidVideoData = {
        ...mockVideoData,
        dimensions: { width: 50, height: 50 } // Too small
      };

      mockPrisma.aIAgent.findUnique.mockResolvedValue(mockAgent);

      await expect(aiAgentService.generateProductVideo(mockAgentId, mockUserId, invalidVideoData))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for missing product information', async () => {
      const mockAgent = {
        id: mockAgentId,
        name: 'Test Agent',
        pricing: { model: 'FREE' }
      };

      const invalidVideoData = {
        dimensions: { width: 1920, height: 1080 }
        // No productName or shopifyStoreUrl
      };

      mockPrisma.aIAgent.findUnique.mockResolvedValue(mockAgent);

      await expect(aiAgentService.generateProductVideo(mockAgentId, mockUserId, invalidVideoData))
        .rejects.toThrow(ValidationError);
    });

    it('should validate video dimensions properly', async () => {
      const testCases = [
        { width: 99, height: 100, shouldFail: true, reason: 'width too small' },
        { width: 100, height: 99, shouldFail: true, reason: 'height too small' },
        { width: 4001, height: 1000, shouldFail: true, reason: 'width too large' },
        { width: 1000, height: 4001, shouldFail: true, reason: 'height too large' },
        { width: 1920, height: 1080, shouldFail: false, reason: 'valid dimensions' }
      ];

      const mockAgent = {
        id: mockAgentId,
        name: 'Test Agent',
        pricing: { model: 'FREE' }
      };

      mockPrisma.aIAgent.findUnique.mockResolvedValue(mockAgent);

      for (const testCase of testCases) {
        const testVideoData = {
          ...mockVideoData,
          dimensions: { width: testCase.width, height: testCase.height }
        };

        if (testCase.shouldFail) {
          await expect(aiAgentService.generateProductVideo(mockAgentId, mockUserId, testVideoData))
            .rejects.toThrow(ValidationError);
        } else {
          const result = await aiAgentService.generateProductVideo(mockAgentId, mockUserId, testVideoData);
          expect(result).toHaveProperty('id');
        }
      }
    });

    it('should validate video duration properly', async () => {
      const mockAgent = {
        id: mockAgentId,
        name: 'Test Agent',
        pricing: { model: 'FREE' }
      };

      mockPrisma.aIAgent.findUnique.mockResolvedValue(mockAgent);

      // Test invalid durations
      const invalidDurations = [4, 301]; // Too short and too long
      for (const duration of invalidDurations) {
        const testVideoData = { ...mockVideoData, duration };
        await expect(aiAgentService.generateProductVideo(mockAgentId, mockUserId, testVideoData))
          .rejects.toThrow(ValidationError);
      }

      // Test valid durations
      const validDurations = [5, 30, 300];
      for (const duration of validDurations) {
        const testVideoData = { ...mockVideoData, duration };
        const result = await aiAgentService.generateProductVideo(mockAgentId, mockUserId, testVideoData);
        expect(result.duration).toBe(duration);
      }
    });
  });

  describe('getAgentById', () => {
    it('should return agent with full details', async () => {
      const mockAgent = {
        id: 'agent-123',
        name: 'Test Agent',
        creator: {
          id: 'user-123',
          username: 'testuser',
          displayName: 'Test User',
          avatar: null,
          verified: false
        },
        subscriptions: [],
        reviews: [],
        _count: {
          subscriptions: 0,
          reviews: 0,
          messages: 0
        }
      };

      mockPrisma.aIAgent.findUnique.mockResolvedValue(mockAgent);

      const result = await aiAgentService.getAgentById('agent-123');

      expect(result).toEqual(mockAgent);
      expect(mockPrisma.aIAgent.findUnique).toHaveBeenCalledWith({
        where: { id: 'agent-123' },
        include: expect.objectContaining({
          creator: expect.any(Object),
          subscriptions: expect.any(Object),
          reviews: expect.any(Object),
          _count: expect.any(Object)
        })
      });
    });

    it('should return null when agent not found', async () => {
      mockPrisma.aIAgent.findUnique.mockResolvedValue(null);

      const result = await aiAgentService.getAgentById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('listAgents', () => {
    it('should return paginated list of agents', async () => {
      const mockAgents = [
        { id: 'agent-1', name: 'Agent 1' },
        { id: 'agent-2', name: 'Agent 2' }
      ];

      mockPrisma.aIAgent.findMany.mockResolvedValue(mockAgents);
      mockPrisma.aIAgent.count.mockResolvedValue(2);

      const result = await aiAgentService.listAgents({ page: 1, limit: 10 });

      expect(result.agents).toEqual(mockAgents);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1
      });
    });

    it('should filter agents by search query', async () => {
      const mockAgents = [{ id: 'agent-1', name: 'Video Agent' }];

      mockPrisma.aIAgent.findMany.mockResolvedValue(mockAgents);
      mockPrisma.aIAgent.count.mockResolvedValue(1);

      const result = await aiAgentService.listAgents({ searchQuery: 'video' });

      expect(mockPrisma.aIAgent.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { name: { contains: 'video', mode: 'insensitive' } },
            { description: { contains: 'video', mode: 'insensitive' } },
            { username: { contains: 'video', mode: 'insensitive' } }
          ])
        }),
        include: expect.any(Object),
        orderBy: expect.any(Object),
        skip: expect.any(Number),
        take: expect.any(Number)
      });
    });
  });

  describe('updateAgent', () => {
    it('should update agent successfully', async () => {
      const mockAgent = { id: 'agent-123', creatorId: 'user-123', name: 'Test Agent' };
      const mockUpdatedAgent = { ...mockAgent, name: 'Updated Agent' };

      mockPrisma.aIAgent.findFirst.mockResolvedValue(mockAgent);
      mockPrisma.aIAgent.update.mockResolvedValue(mockUpdatedAgent);

      const result = await aiAgentService.updateAgent('agent-123', 'user-123', { name: 'Updated Agent' });

      expect(result).toEqual(mockUpdatedAgent);
      expect(mockPrisma.aIAgent.update).toHaveBeenCalledWith({
        where: { id: 'agent-123' },
        data: expect.objectContaining({
          name: 'Updated Agent',
          updatedAt: expect.any(Date)
        })
      });
    });

    it('should throw NotFoundError when agent not found or user not owner', async () => {
      mockPrisma.aIAgent.findFirst.mockResolvedValue(null);

      await expect(aiAgentService.updateAgent('agent-123', 'user-123', { name: 'Updated' }))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteAgent', () => {
    it('should delete agent successfully', async () => {
      const mockAgent = { id: 'agent-123', creatorId: 'user-123' };

      mockPrisma.aIAgent.findFirst.mockResolvedValue(mockAgent);
      mockPrisma.aIAgent.delete.mockResolvedValue(mockAgent);

      const result = await aiAgentService.deleteAgent('agent-123', 'user-123');

      expect(result).toEqual({ message: 'AI agent deleted successfully' });
      expect(mockPrisma.aIAgent.delete).toHaveBeenCalledWith({
        where: { id: 'agent-123' }
      });
    });

    it('should throw NotFoundError when agent not found or user not owner', async () => {
      mockPrisma.aIAgent.findFirst.mockResolvedValue(null);

      await expect(aiAgentService.deleteAgent('agent-123', 'user-123'))
        .rejects.toThrow(NotFoundError);
    });
  });
});
