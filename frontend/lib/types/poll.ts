export interface PollOption {
  optionId: string;
  text: string;
  votes?: number;
}

export interface PollQuestion {
  questionId: string;
  text: string;
  options: PollOption[];
  totalVotes?: number;
}

export interface Poll {
  pollId: string;
  title?: string;
  description?: string;
  question?: string; // For backward compatibility
  options?: PollOption[]; // For backward compatibility
  questions?: PollQuestion[]; // New structure
  totalVotes: number;
  createdAt?: string;
}

export interface CreatePollRequest {
  title: string;
  description?: string;
  questions: Array<{
    text: string;
    options: string[];
  }>;
}

export interface CreatePollLegacyRequest {
  question: string;
  options: string[];
}

export interface VoteRequest {
  questionId: string;
  optionId: string;
}

export interface VoteLegacyRequest {
  optionId: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

