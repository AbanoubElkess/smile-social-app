import { PrismaClient } from '@prisma/client';
import { NotFoundError, ValidationError } from '../utils/errors';
import axios from 'axios';

// Temporary enum until Prisma is regenerated
enum VideoGenerationStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

const prisma = new PrismaClient();

interface CreateVideoRequestData {
  userId: string;
  agentId: string;
  productName: string;
  productDescription: string;
  targetAudience: string;
  videoStyle: 'professional' | 'casual' | 'animated' | 'testimonial';
  duration: 15 | 30 | 60;
  voiceType: 'male' | 'female' | 'neutral';
  musicStyle?: 'upbeat' | 'calm' | 'corporate' | 'none';
  brandColors?: string[];
  logoUrl?: string;
}

interface VideoGenerationProgress {
  status: VideoGenerationStatus;
  progress: number; // 0-100
  estimatedTimeRemaining?: number; // seconds
  currentStep?: string;
}

export class PromoVideoService {
  private aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8001';

  /**
   * Create a new promotional video generation request
   */
  async createVideoRequest(data: CreateVideoRequestData) {
    // Validate input
    this.validateVideoRequest(data);

    // Check if user and agent exist
    const user = await prisma.user.findUnique({
      where: { id: data.userId }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const agent = await prisma.aIAgent.findUnique({
      where: { id: data.agentId }
    });

    if (!agent) {
      throw new NotFoundError('AI Agent not found');
    }

    // Create the request
    const videoRequest = await prisma.promoVideoRequest.create({
      data: {
        userId: data.userId,
        agentId: data.agentId,
        productName: data.productName,
        productDescription: data.productDescription,
        targetAudience: data.targetAudience,
        videoStyle: data.videoStyle,
        duration: data.duration,
        voiceType: data.voiceType,
        musicStyle: data.musicStyle,
        brandColors: data.brandColors || [],
        logoUrl: data.logoUrl,
        status: VideoGenerationStatus.PENDING
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        },
        agent: {
          select: {
            id: true,
            name: true,
            username: true
          }
        }
      }
    });

    // Start video generation process asynchronously
    this.startVideoGeneration(videoRequest.id).catch(error => {
      console.error('Failed to start video generation:', error);
      this.updateVideoRequestStatus(videoRequest.id, VideoGenerationStatus.FAILED, error.message);
    });

    return videoRequest;
  }

  /**
   * Get video request by ID
   */
  async getVideoRequest(requestId: string, userId?: string) {
    const videoRequest = await prisma.promoVideoRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        },
        agent: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true
          }
        }
      }
    });

    if (!videoRequest) {
      throw new NotFoundError('Video request not found');
    }

    // Check if user has permission to view this request
    if (userId && videoRequest.userId !== userId) {
      throw new ValidationError('Access denied');
    }

    return videoRequest;
  }

  /**
   * Get all video requests for a user
   */
  async getUserVideoRequests(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      prisma.promoVideoRequest.findMany({
        where: { userId },
        include: {
          agent: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.promoVideoRequest.count({
        where: { userId }
      })
    ]);

    return {
      requests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get video generation progress
   */
  async getVideoProgress(requestId: string): Promise<VideoGenerationProgress> {
    const videoRequest = await this.getVideoRequest(requestId);

    // If completed, return 100% progress
    if (videoRequest.status === VideoGenerationStatus.COMPLETED) {
      return {
        status: videoRequest.status,
        progress: 100,
        currentStep: 'Video generation completed'
      };
    }

    // If failed, return error status
    if (videoRequest.status === VideoGenerationStatus.FAILED) {
      return {
        status: videoRequest.status,
        progress: 0,
        currentStep: videoRequest.errorMessage || 'Video generation failed'
      };
    }

    // For pending/processing, get progress from AI service
    try {
      const response = await axios.get(`${this.aiServiceUrl}/video/progress/${requestId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get video progress:', error);
      return {
        status: videoRequest.status,
        progress: videoRequest.status === VideoGenerationStatus.PROCESSING ? 50 : 0,
        currentStep: 'Generating video...'
      };
    }
  }

  /**
   * Cancel video generation
   */
  async cancelVideoRequest(requestId: string, userId: string) {
    const videoRequest = await this.getVideoRequest(requestId, userId);

    if (videoRequest.status === VideoGenerationStatus.COMPLETED) {
      throw new ValidationError('Cannot cancel completed video generation');
    }

    if (videoRequest.status === VideoGenerationStatus.CANCELLED) {
      throw new ValidationError('Video generation already cancelled');
    }

    // Update status to cancelled
    const updatedRequest = await prisma.promoVideoRequest.update({
      where: { id: requestId },
      data: { 
        status: VideoGenerationStatus.CANCELLED,
        updatedAt: new Date()
      }
    });

    // Notify AI service to cancel processing
    try {
      await axios.post(`${this.aiServiceUrl}/video/cancel/${requestId}`);
    } catch (error) {
      console.error('Failed to cancel video generation in AI service:', error);
    }

    return updatedRequest;
  }

  /**
   * Delete video request (and associated video files)
   */
  async deleteVideoRequest(requestId: string, userId: string) {
    const videoRequest = await this.getVideoRequest(requestId, userId);

    // Delete video files if they exist
    if (videoRequest.videoUrl || videoRequest.thumbnailUrl) {
      try {
        await axios.delete(`${this.aiServiceUrl}/video/files/${requestId}`);
      } catch (error) {
        console.error('Failed to delete video files:', error);
      }
    }

    // Delete from database
    await prisma.promoVideoRequest.delete({
      where: { id: requestId }
    });

    return { message: 'Video request deleted successfully' };
  }

  /**
   * Start video generation process
   */
  private async startVideoGeneration(requestId: string) {
    try {
      // Update status to processing
      await this.updateVideoRequestStatus(requestId, VideoGenerationStatus.PROCESSING);

      // Get the video request data
      const videoRequest = await this.getVideoRequest(requestId);

      // Send request to AI service for video generation
      const response = await axios.post(`${this.aiServiceUrl}/video/generate`, {
        requestId,
        productName: videoRequest.productName,
        productDescription: videoRequest.productDescription,
        targetAudience: videoRequest.targetAudience,
        videoStyle: videoRequest.videoStyle,
        duration: videoRequest.duration,
        voiceType: videoRequest.voiceType,
        musicStyle: videoRequest.musicStyle,
        brandColors: videoRequest.brandColors,
        logoUrl: videoRequest.logoUrl,
        agentPersonality: videoRequest.agent.personality
      });

      console.log('Video generation started:', response.data);
    } catch (error) {
      console.error('Failed to start video generation:', error);
      await this.updateVideoRequestStatus(
        requestId, 
        VideoGenerationStatus.FAILED, 
        error.message || 'Failed to start video generation'
      );
    }
  }

  /**
   * Update video request status (called by AI service webhook)
   */
  async updateVideoRequestStatus(
    requestId: string, 
    status: VideoGenerationStatus, 
    errorMessage?: string,
    videoUrl?: string,
    thumbnailUrl?: string
  ) {
    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    if (status === VideoGenerationStatus.PROCESSING) {
      updateData.processingStartedAt = new Date();
    }

    if (status === VideoGenerationStatus.COMPLETED) {
      updateData.processingCompletedAt = new Date();
      updateData.videoUrl = videoUrl;
      updateData.thumbnailUrl = thumbnailUrl;
    }

    if (status === VideoGenerationStatus.FAILED) {
      updateData.errorMessage = errorMessage;
    }

    const updatedRequest = await prisma.promoVideoRequest.update({
      where: { id: requestId },
      data: updateData
    });

    return updatedRequest;
  }

  /**
   * Validate video request data
   */
  private validateVideoRequest(data: CreateVideoRequestData) {
    if (!data.productName || data.productName.trim().length === 0) {
      throw new ValidationError('Product name is required');
    }

    if (data.productName.length > 100) {
      throw new ValidationError('Product name must be less than 100 characters');
    }

    if (!data.productDescription || data.productDescription.trim().length === 0) {
      throw new ValidationError('Product description is required');
    }

    if (data.productDescription.length > 1000) {
      throw new ValidationError('Product description must be less than 1000 characters');
    }

    if (!data.targetAudience || data.targetAudience.trim().length === 0) {
      throw new ValidationError('Target audience is required');
    }

    if (!['professional', 'casual', 'animated', 'testimonial'].includes(data.videoStyle)) {
      throw new ValidationError('Invalid video style');
    }

    if (![15, 30, 60].includes(data.duration)) {
      throw new ValidationError('Duration must be 15, 30, or 60 seconds');
    }

    if (!['male', 'female', 'neutral'].includes(data.voiceType)) {
      throw new ValidationError('Invalid voice type');
    }

    if (data.musicStyle && !['upbeat', 'calm', 'corporate', 'none'].includes(data.musicStyle)) {
      throw new ValidationError('Invalid music style');
    }

    if (data.brandColors && data.brandColors.length > 5) {
      throw new ValidationError('Maximum 5 brand colors allowed');
    }

    if (data.logoUrl && !this.isValidUrl(data.logoUrl)) {
      throw new ValidationError('Invalid logo URL');
    }
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

export const promoVideoService = new PromoVideoService();
