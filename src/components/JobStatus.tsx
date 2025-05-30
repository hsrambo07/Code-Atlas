'use client';

import { useEffect, useState } from 'react';

interface Job {
  id: string;
  status: string;
  message?: string;
  createdAt: string;
  updatedAt: string;
}

interface JobStatusProps {
  jobId: string;
  onComplete?: () => void;
}

export default function JobStatus({ jobId, onComplete }: JobStatusProps) {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;

    let pollInterval: NodeJS.Timeout | null = null;
    let isActive = true; // Flag to prevent state updates after cleanup

    const pollJobStatus = async () => {
      if (!isActive) return; // Don't proceed if component is unmounted
      
      try {
        const response = await fetch(`/api/ingest/${jobId}/status`);
        const data = await response.json();

        if (!isActive) return; // Don't update state if component is unmounted

        if (data.success) {
          setJob(data.job);
          setError(null);
          
          // Stop polling if job is completed or failed
          if (data.job.status === 'completed' || data.job.status === 'failed') {
            if (pollInterval) {
              clearInterval(pollInterval);
              pollInterval = null;
            }
            if (data.job.status === 'completed' && onComplete) {
              onComplete();
            }
          }
        } else {
          setError(data.error || 'Failed to fetch job status');
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
        }
      } catch (err) {
        if (!isActive) return;
        setError('Network error while fetching job status');
        console.error('Job status polling error:', err);
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    // Initial fetch
    pollJobStatus();

    // Only start polling if job is not already completed
    const startPolling = () => {
      if (pollInterval) return; // Already polling
      pollInterval = setInterval(() => {
        if (isActive) {
          pollJobStatus();
        }
      }, 3000); // Increased to 3 seconds to reduce load
    };

    // Start polling after initial fetch
    setTimeout(startPolling, 3000);

    return () => {
      isActive = false;
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };
  }, [jobId, onComplete]);

  if (loading && !job) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="text-blue-800 dark:text-blue-200">Loading job status...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="text-red-600 dark:text-red-400">⚠️</div>
          <span className="text-red-800 dark:text-red-200">{error}</span>
        </div>
      </div>
    );
  }

  if (!job) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200';
      case 'processing':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200';
      case 'completed':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200';
      case 'failed':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'processing':
        return '⚙️';
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      default:
        return '❓';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getStatusColor(job.status)}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-xl">{getStatusIcon(job.status)}</span>
          <div>
            <h3 className="font-semibold capitalize">
              Code Analysis: {job.status}
            </h3>
            {job.message && (
              <p className="text-sm opacity-80 mt-1">{job.message}</p>
            )}
          </div>
        </div>
        
        {job.status === 'processing' && (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
        )}
      </div>
      
      <div className="mt-3 text-xs opacity-60">
        <div>Job ID: {job.id}</div>
        <div>Started: {new Date(job.createdAt).toLocaleString()}</div>
        <div>Updated: {new Date(job.updatedAt).toLocaleString()}</div>
      </div>
    </div>
  );
} 