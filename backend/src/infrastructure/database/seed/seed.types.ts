export interface SeederContext {
  companyId: string;
  userId: string;
}

export interface SeederDefinition {
  name: string;
  order: number;
  run: (context: SeederContext) => Promise<void>;
}

export interface SeedRunnerResult {
  name: string;
  success: boolean;
  error?: string;
}
