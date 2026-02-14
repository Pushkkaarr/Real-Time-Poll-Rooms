export interface PollOption {
  optionId: string;
  text: string;
  votes: number;
}

export interface Poll {
  pollId: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  createdAt?: string;
}

export interface CreatePollRequest {
  question: string;
  options: string[];
}

export interface VoteRequest {
  optionId: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}
