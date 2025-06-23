import { PrismaClient, AIAgent, AgentStatus } from '@prisma/client';
import { AppError, NotFoundError, AuthorizationError, ValidationError } from '../utils/errors';

const prisma = new PrismaClient();

export interface CreateAIAgentData {
  name: string;
  username: string;
  description: string;
  personality: {
    traits: string[];
    communicationStyle: string;
    expertise: string[];
    responsePatterns: Record<string, any>;
  };
  capabilities: string[];
  pricing: {
    model: 'FREE' | 'PAID';
    price?: number;
    currency?: string;
  };
  systemPrompt?: string;
  avatar?: string;
}

export interface UpdateAIAgentData extends Partial<CreateAIAgentData> {
  status?: AgentStatus;
}

export interface VideoGenerationData {
  productName?: string;
  productDescription?: string;
  productFeatures?: string[];
  shopifyStoreUrl?: string;
  productImages?: string[];
  productVideos?: string[];
  dimensions: {
    width: number;
    height: number;
  };
  duration?: number; // in seconds
  style?: 'modern' | 'classic' | 'minimalist' | 'bold' | 'elegant';
  template?: string;
  backgroundColor?: string;
  textColor?: string;
  music?: boolean;
}

export interface GeneratedVideo {
  id: string;
  url: string;
  thumbnailUrl: string;
  duration: number;
  dimensions: {
    width: number;
    height: number;
  };
  createdAt: Date;
  metadata: Record<string, any>;
}

class AIAgentService {
  async createAgent(creatorId: string, data: CreateAIAgentData): Promise<AIAgent> {
    try {
      // Validate creator exists
      const creator = await prisma.user.findUnique({
        where: { id: creatorId }
      });

      if (!creator) {
        throw new NotFoundError('Creator not found');
      }

      // Check if username is unique
      const existingAgent = await prisma.aIAgent.findUnique({
        where: { username: data.username }
      });

      if (existingAgent) {
        throw new ValidationError('Agent username already exists');
      }

      const agent = await prisma.aIAgent.create({
        data: {
          creatorId,
          name: data.name,
          username: data.username,
          description: data.description,
          personality: data.personality,
          capabilities: data.capabilities,
          pricing: data.pricing,
          systemPrompt: data.systemPrompt,
          avatar: data.avatar,
          status: AgentStatus.DRAFT
        }
      });

      return agent;
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Error creating AI agent:', error);
      throw new AppError('Failed to create AI agent', 500);
    }
  }

  async updateAgent(agentId: string, creatorId: string, data: UpdateAIAgentData): Promise<AIAgent> {
    try {
      // Verify ownership
      const existingAgent = await prisma.aIAgent.findFirst({
        where: {
          id: agentId,
          creatorId
        }
      });

      if (!existingAgent) {
        throw new NotFoundError('Agent not found or you do not have permission to update it');
      }

      const updatedAgent = await prisma.aIAgent.update({
        where: { id: agentId },
        data: {
          ...data,
          updatedAt: new Date()
        }
      });

      return updatedAgent;
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Error updating AI agent:', error);
      throw new AppError('Failed to update AI agent', 500);
    }
  }

  async getAgentById(agentId: string): Promise<AIAgent | null> {
    try {
      const agent = await prisma.aIAgent.findUnique({
        where: { id: agentId },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
              verified: true
            }
          },
          subscriptions: {
            select: {
              id: true,
              plan: true,
              status: true
            }
          },
          reviews: {
            select: {
              id: true,
              rating: true,
              comment: true,
              createdAt: true
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 10
          },
          _count: {
            select: {
              subscriptions: true,
              reviews: true,
              messages: true
            }
          }
        }
      });

      return agent;
    } catch (error) {
      console.error('Error fetching AI agent:', error);
      throw new AppError('Failed to fetch AI agent', 500);
    }
  }

  async deleteAgent(agentId: string, creatorId: string): Promise<{ message: string }> {
    try {
      // Verify ownership
      const existingAgent = await prisma.aIAgent.findFirst({
        where: {
          id: agentId,
          creatorId
        }
      });

      if (!existingAgent) {
        throw new NotFoundError('Agent not found or you do not have permission to delete it');
      }

      await prisma.aIAgent.delete({
        where: { id: agentId }
      });

      return { message: 'AI agent deleted successfully' };
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Error deleting AI agent:', error);
      throw new AppError('Failed to delete AI agent', 500);
    }
  }

  async listAgents(filters: {
    searchQuery?: string;
    status?: AgentStatus;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    agents: AIAgent[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const {
        status = AgentStatus.PUBLISHED,
        searchQuery,
        page = 1,
        limit = 20
      } = filters;

      const skip = (page - 1) * limit;

      const where: any = {
        status
      };

      if (searchQuery) {
        where.OR = [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { description: { contains: searchQuery, mode: 'insensitive' } },
          { username: { contains: searchQuery, mode: 'insensitive' } }
        ];
      }

      const [agents, total] = await Promise.all([
        prisma.aIAgent.findMany({
          where,
          include: {
            creator: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                verified: true
              }
            },
            _count: {
              select: {
                subscriptions: true,
                reviews: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take: limit
        }),
        prisma.aIAgent.count({ where })
      ]);

      return {
        agents,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error listing AI agents:', error);
      throw new AppError('Failed to list AI agents', 500);
    }
  }

  async generateProductVideo(agentId: string, userId: string, data: VideoGenerationData): Promise<GeneratedVideo> {
    try {
      // Verify agent exists and user has access
      const agent = await prisma.aIAgent.findUnique({
        where: { id: agentId }
      });

      if (!agent) {
        throw new NotFoundError('AI agent not found');
      }

      // Check if user has subscription or agent is free
      const pricing = agent.pricing as any;
      if (pricing?.model === 'PAID') {
        const subscription = await prisma.subscription.findFirst({
          where: {
            userId,
            agentId,
            status: 'ACTIVE'
          }
        });

        if (!subscription) {
          throw new AuthorizationError('Active subscription required for this agent');
        }
      }

      // Validate video generation data
      this.validateVideoGenerationData(data);

      // Extract product information from Shopify store if provided
      let productInfo = null;
      if (data.shopifyStoreUrl) {
        productInfo = await this.extractShopifyProductInfo(data.shopifyStoreUrl);
      }

      // Generate video using AI service (placeholder for actual implementation)
      const generatedVideo = await this.callVideoGenerationAPI({
        ...data,
        productInfo,
        agentPersonality: agent.personality,
        agentCapabilities: agent.capabilities
      });

      // Log the generation for analytics
      await this.logVideoGeneration(agentId, userId, data, generatedVideo);

      return generatedVideo;
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Error generating product video:', error);
      throw new AppError('Failed to generate product video', 500);
    }
  }

  private validateVideoGenerationData(data: VideoGenerationData): void {
    if (!data.dimensions || !data.dimensions.width || !data.dimensions.height) {
      throw new ValidationError('Video dimensions are required');
    }

    if (data.dimensions.width < 100 || data.dimensions.height < 100) {
      throw new ValidationError('Video dimensions must be at least 100x100 pixels');
    }

    if (data.dimensions.width > 4000 || data.dimensions.height > 4000) {
      throw new ValidationError('Video dimensions cannot exceed 4000x4000 pixels');
    }

    if (data.duration && (data.duration < 5 || data.duration > 300)) {
      throw new ValidationError('Video duration must be between 5 and 300 seconds');
    }

    if (!data.productName && !data.shopifyStoreUrl) {
      throw new ValidationError('Either product name or Shopify store URL is required');
    }
  }

  private async extractShopifyProductInfo(shopifyUrl: string): Promise<any> {
    try {
      // This would integrate with Shopify API to extract product information
      // For now, returning a placeholder
      return {
        name: 'Extracted Product Name',
        description: 'Extracted product description',
        images: [],
        features: [],
        price: 0
      };
    } catch (error) {
      console.error('Error extracting Shopify product info:', error);
      return null;
    }
  }

  private async callVideoGenerationAPI(data: any): Promise<GeneratedVideo> {
    // This would call an external video generation API (e.g., RunwayML, Synthesia, etc.)
    // For now, returning a mock response
    const videoId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id: videoId,
      url: `https://example.com/videos/${videoId}.mp4`,
      thumbnailUrl: `https://example.com/thumbnails/${videoId}.jpg`,
      duration: data.duration || 30,
      dimensions: data.dimensions,
      createdAt: new Date(),
      metadata: {
        style: data.style || 'modern',
        template: data.template,
        productName: data.productName,
        agentId: data.agentId
      }
    };
  }

  private async logVideoGeneration(agentId: string, userId: string, requestData: VideoGenerationData, result: GeneratedVideo): Promise<void> {
    try {
      // Log video generation for analytics and billing
      console.log('Video generation logged:', {
        agentId,
        userId,
        videoId: result.id,
        dimensions: result.dimensions,
        duration: result.duration,
        timestamp: new Date()
      });

      // Update agent usage statistics
      await prisma.aIAgent.update({
        where: { id: agentId },
        data: {
          totalInteractions: {
            increment: 1
          },
          revenueGenerated: {
            increment: 0.1 // Small increment for video generation
          }
        }
      });
    } catch (error) {
      console.error('Error logging video generation:', error);
      // Don't throw error as this is non-critical
    }
  }

  async getAgentVideoHistory(agentId: string, userId: string, page = 1, limit = 10): Promise<{
    videos: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      // This would fetch video generation history from a separate table
      // For now, returning mock data
      return {
        videos: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0
        }
      };
    } catch (error) {
      console.error('Error fetching video history:', error);
      throw new AppError('Failed to fetch video history', 500);
    }
  }
}

export const aiAgentService = new AIAgentService();
