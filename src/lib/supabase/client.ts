import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type TaskType = "text" | "image" | "audio" | "video" | "file" | "multimodal";

export interface ArcadeReview {
  job_id: string;
  agent_id: string;
  agent_address: string;
  stars: number;
  comment_uri: string | null;
  client_address: string;
  created_at: string;
}

export interface ArcadeJob {
  job_id: string;
  task_text: string | null;
  task_files: string[] | null;
  task_type: TaskType;
  client_address: string;
  agent_address: string;
  agent_endpoint: string | null;
  output_text: string | null;
  output_files: string[] | null;
  created_at: string;
}
