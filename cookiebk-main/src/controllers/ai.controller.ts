import { Response, NextFunction } from 'express';
import { aiService } from '../services/ai.service';
import { ApiError } from '../middlewares/error.middleware';
import { AuthRequest } from '../types';
import { logger } from '../utils/logger';
import { ChatHistory } from '../models/ChatHistory';
import { Product } from '../models/Product';

export const analyzeDistress = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const { imageUrl, description } = req.body;

    if (!description) {
      throw ApiError.badRequest('Description is required');
    }

    logger.info(`AI analysis requested by user: ${req.user._id}`);

    const analysis = await aiService.analyzeDistress({
      imageUrl,
      description,
    });

    res.json({
      success: true,
      analysis,
    });
  } catch (error) {
    next(error);
  }
};

export const getGuidance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const { symptoms, animalType } = req.body;

    if (!symptoms) {
      throw ApiError.badRequest('Symptoms are required');
    }

    const description = animalType
      ? `Animal type: ${animalType}. Symptoms: ${symptoms}`
      : symptoms;

    const analysis = await aiService.analyzeDistress({
      description,
    });

    // Save chat history
    await ChatHistory.create({
      userId: req.user._id,
      query: symptoms,
      animalType,
      severity: analysis.severity,
      messages: [
        { role: 'user', content: symptoms, timestamp: new Date() },
        { role: 'assistant', content: JSON.stringify(analysis), timestamp: new Date() },
      ],
    });

    res.json({
      success: true,
      guidance: {
        severity: analysis.severity,
        immediateSteps: analysis.immediateSteps,
        suggestions: analysis.suggestions,
        disclaimer: analysis.disclaimer,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Chat with AI - interactive chat endpoint
export const chat = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const { message, context, chatHistoryId, contactNumber } = req.body;

    if (!message) {
      throw ApiError.badRequest('Message is required');
    }

    // Build the prompt with context
    const prompt = context
      ? `Context: ${context}\n\nUser question: ${message}`
      : message;

    const analysis = await aiService.analyzeDistress({
      description: prompt,
    });

    // Format response
    let responseContent = '';
    if (analysis.immediateSteps && analysis.immediateSteps.length > 0) {
      responseContent += `**Immediate Steps:**\n`;
      analysis.immediateSteps.forEach((step, i) => {
        responseContent += `${i + 1}. ${step}\n`;
      });
      responseContent += '\n';
    }
    if (analysis.suggestions && analysis.suggestions.length > 0) {
      responseContent += `**Suggestions:**\n`;
      analysis.suggestions.forEach((suggestion) => {
        responseContent += `• ${suggestion}\n`;
      });
    }
    if (analysis.disclaimer) {
      responseContent += `\n_${analysis.disclaimer}_`;
    }

    // Update or create chat history
    if (chatHistoryId) {
      await ChatHistory.findByIdAndUpdate(chatHistoryId, {
        $push: {
          messages: [
            { role: 'user', content: message, timestamp: new Date() },
            { role: 'assistant', content: responseContent, timestamp: new Date() },
          ],
        },
        ...(contactNumber && { contactNumber }),
      });
    } else {
      const chatHistory = await ChatHistory.create({
        userId: req.user._id,
        query: message,
        severity: analysis.severity,
        contactNumber,
        messages: [
          { role: 'user', content: message, timestamp: new Date() },
          { role: 'assistant', content: responseContent, timestamp: new Date() },
        ],
      });

      res.json({
        success: true,
        response: responseContent,
        severity: analysis.severity,
        chatHistoryId: chatHistory._id,
      });
      return;
    }

    res.json({
      success: true,
      response: responseContent,
      severity: analysis.severity,
      chatHistoryId,
    });
  } catch (error) {
    next(error);
  }
};

// Get similar past queries
export const getSimilarQueries = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const { query, severity } = req.query;

    if (!query) {
      throw ApiError.badRequest('Query is required');
    }

    // Search for similar queries using text search
    const similarQueries = await ChatHistory.find({
      userId: req.user._id,
      $text: { $search: query as string },
      ...(severity && { severity }),
    })
      .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
      .limit(5)
      .select('query animalType severity contactNumber messages createdAt');

    res.json({
      success: true,
      queries: similarQueries.map((q) => ({
        id: q._id,
        query: q.query,
        animalType: q.animalType,
        severity: q.severity,
        contactNumber: q.contactNumber,
        answer: q.messages.find((m) => m.role === 'assistant')?.content,
        createdAt: q.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// Get user's chat history
export const getChatHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [history, total] = await Promise.all([
      ChatHistory.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select('query animalType severity contactNumber messages createdAt'),
      ChatHistory.countDocuments({ userId: req.user._id }),
    ]);

    res.json({
      success: true,
      history,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get store recommendations based on emergency
export const getStoreRecommendations = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    const { description, severity, animalType } = req.body;

    if (!description) {
      throw ApiError.badRequest('Description is required');
    }

    // Get AI recommendations for what products might help
    const prompt = `Based on this pet emergency situation, suggest what types of products from a pet store might be helpful.

Situation: ${description}
${animalType ? `Animal Type: ${animalType}` : ''}
${severity ? `Severity: ${severity}` : ''}

Respond with JSON containing:
{
  "recommendedCategories": ["array of product category keywords to search for"],
  "reasoning": "brief explanation of why these products are recommended"
}`;

    const aiResponse = await aiService.analyzeDistress({
      description: prompt,
    });

    // Parse AI response to get categories
    let categories: string[] = [];
    let reasoning = '';

    try {
      // The AI might return JSON in immediateSteps or suggestions
      const responseText = aiResponse.immediateSteps?.join(' ') || aiResponse.suggestions?.join(' ') || '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        categories = parsed.recommendedCategories || [];
        reasoning = parsed.reasoning || '';
      }
    } catch {
      // Fallback categories based on severity
      categories = severity === 'critical' || severity === 'high'
        ? ['first-aid', 'emergency', 'medical', 'bandage', 'medicine']
        : ['health', 'care', 'nutrition', 'supplement'];
    }

    // Search for products matching the categories
    const products = await Product.find({
      $or: [
        { category: { $in: categories.map((c) => new RegExp(c, 'i')) } },
        { name: { $in: categories.map((c) => new RegExp(c, 'i')) } },
        { description: { $in: categories.map((c) => new RegExp(c, 'i')) } },
      ],
    })
      .limit(6)
      .select('name description price image category');

    res.json({
      success: true,
      recommendations: {
        products,
        reasoning: reasoning || 'Products that may help with your pet\'s situation.',
        categories,
      },
    });
  } catch (error) {
    next(error);
  }
};
