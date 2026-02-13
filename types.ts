
export enum AgentCategory {
  ORCHESTRATOR = 'ORCHESTRATOR',
  GENERAL_RULES = 'GENERAL_RULES',
  CARD_TYPE = 'CARD_TYPE',
  EFFECT_TYPE = 'EFFECT_TYPE',
  COLOR_ARCHETYPE = 'COLOR_ARCHETYPE'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  category?: AgentCategory;
  timestamp: number;
}

export interface ClassificationResponse {
  category: AgentCategory;
  reasoning: string;
}

export interface WorkflowStep {
  agent: AgentCategory;
  status: 'idle' | 'processing' | 'completed' | 'error';
  message?: string;
}
