import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type TaskType = "text" | "image" | "audio" | "video" | "file" | "multimodal";

export type OutputType = "text" | "code" | "file" | "media" | "json";

export interface OutputMetadata {
  language?: string;       // for code: "python", "solidity", etc.
  mimeTypes?: string[];    // for files/media: ["video/mp4", "image/png"]
  labels?: string[];       // human-readable labels per output_files entry
  [key: string]: unknown;  // extensible for future agent-specific data
}

export interface ArcadeReview {
  job_id: string;
  agent_id: string;
  agent_address: string;
  stars: number;
  comment_uri: string | null;
  client_address: string;
  created_at: string;
}

export type ExecutionStatus = "pending" | "running" | "completed" | "failed";

export interface ArcadeJob {
  job_id: string;
  task_text: string | null;
  task_files: string[] | null;
  task_type: TaskType;
  client_address: string;
  agent_address: string;
  agent_endpoint: string | null;
  output_type: OutputType;
  output_text: string | null;
  output_files: string[] | null;
  output_metadata: OutputMetadata | null;
  execution_status: ExecutionStatus;
  execution_error: string | null;
  execution_attempts: number;
  created_at: string;
}
