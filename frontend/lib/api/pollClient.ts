import axios, { AxiosInstance } from 'axios';
import { CreatePollRequest, VoteRequest } from '@/lib/types/poll';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

class PollApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api/polls`,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  /**
   * Create a new poll with multiple questions
   * @param title - The poll title
   * @param description - Poll description (optional)
   * @param questions - Array of questions with options
   * @returns Poll object with pollId
   */
  async createPoll(
    title: string,
    questions: Array<{ text: string; options: string[] }>,
    description?: string
  ) {
    try {
      const response = await this.client.post('/', {
        title,
        description,
        questions,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a poll by ID
   * @param pollId - The poll ID
   * @returns Poll object with current vote counts
   */
  async getPoll(pollId: string) {
    try {
      const response = await this.client.get(`/${pollId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw this.handleError(error);
    }
  }

  /**
   * Vote on a specific question in a poll
   * @param pollId - The poll ID
   * @param questionId - The question ID
   * @param optionId - The selected option ID
   * @returns Updated poll object
   */
  async voteOnPoll(pollId: string, questionId: string, optionId: string) {
    try {
      const response = await this.client.post(`/${pollId}/vote`, {
        questionId,
        optionId,
      });
      return response.data;
    } catch (error: any) {
      // Return error response in same format as success
      if (error.response?.data) {
        return error.response.data;
      }
      throw this.handleError(error);
    }
  }

  /**
   * Delete a poll
   * @param pollId - The poll ID
   * @returns Success message
   */
  async deletePoll(pollId: string) {
    try {
      const response = await this.client.delete(`/${pollId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw this.handleError(error);
    }
  }

  /**
   * Get all polls (for testing/admin)
   * @returns Array of polls
   */
  async getAllPolls() {
    try {
      const response = await this.client.get('/');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any) {
    if (error.response) {
      return new Error(error.response.data?.message || `API Error: ${error.response.status}`);
    } else if (error.request) {
      return new Error('No response from server');
    } else {
      return new Error(error.message || 'Unknown error');
    }
  }
}

export const pollApi = new PollApiClient();
