export interface TreeNode {
  id: string;
  name: string;
  type: 'file' | 'dir' | 'function';
  path: string;
  children?: TreeNode[];
  metadata?: {
    summary?: string;
    language?: string;
    size?: number;
    functionCount?: number;
    fileCount?: number;
    type?: string;
    startLine?: number;
    endLine?: number;
    complexity?: 'low' | 'medium' | 'high';
    parameters?: string[];
    returnType?: string;
  };
}

export interface UploadResponse {
  success: boolean;
  tree?: TreeNode;
  jobId?: string;
  message?: string;
  error?: string;
}

export interface Job {
  id: string;
  status: string;
  message?: string;
  extractPath?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobStatusResponse {
  success: boolean;
  job?: Job;
  error?: string;
} 