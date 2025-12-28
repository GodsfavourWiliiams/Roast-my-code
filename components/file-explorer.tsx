"use client"

import { useState, useEffect, useCallback } from 'react';
import { fetchRepoContents, FileNode } from '@/app/actions/github-files';
import {
  FolderIcon,
  FileCodeIcon,
  CaretLeftIcon,
  MagnifyingGlassIcon,
} from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';

import { useRouter } from 'next/navigation';

interface FileExplorerProps {
  repoFullName: string;
  onFileSelect: (path: string) => void;
}

export function FileExplorer({
  repoFullName,
  onFileSelect,
}: FileExplorerProps) {
  const [currentPath, setCurrentPath] = useState('');
  const [files, setFiles] = useState<FileNode[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const loadPath = useCallback(
    async (path: string) => {
      setIsLoading(true);
      setError(null);
      const { data, error } = await fetchRepoContents(repoFullName, path);
      if (error) {
        setError(error);
      } else {
        setFiles(data || []);
      }
      setIsLoading(false);
    },
    [repoFullName]
  );

  useEffect(() => {
    async function loadPathAsync() {
      await loadPath(currentPath);
    }
    loadPathAsync();
  }, [currentPath, loadPath]);

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    setSearchQuery(''); // Clear search on navigation
  };

  const handleBack = () => {
    const parts = currentPath.split('/');
    parts.pop();
    setCurrentPath(parts.join('/'));
    setSearchQuery('');
  };

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (error) {
    if (error === 'REAUTH_REQUIRED') {
        return (
            <div className="flex flex-col items-center justify-center h-[300px] text-destructive gap-4">
                <p className="font-bold text-center">GitHub Session Expired</p>
                <p className="text-xs text-center px-4 text-muted-foreground">We need you to sign in again to access your files.</p>
                <Button 
                    variant="default" 
                    size="sm" 
                    onClick={() => router.push('/login')}
                >
                    Re-authenticate
                </Button>
            </div>
        )
    }

    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-destructive">
        <p className="font-bold mb-2">Failed to load files</p>
        <p className="text-xs text-center px-4">{error}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => loadPath(currentPath)}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border rounded-md overflow-hidden bg-background">
      <div className="flex flex-col gap-2 p-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
            <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            disabled={!currentPath}
            onClick={handleBack}
            >
            <CaretLeftIcon size={16} />
            </Button>
            <div
            className="font-mono text-xs truncate flex-1"
            title={currentPath || 'root'}
            >
            {currentPath ? `/${currentPath}` : '/'}
            </div>
        </div>
        <div className="relative">
            <MagnifyingGlassIcon
                size={14}
                className="absolute left-2.5 top-2.5 text-muted-foreground"
            />
            <Input
                placeholder="Filter files..."
                className="h-8 pl-8 text-xs bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 p-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))
          ) : filteredFiles.length === 0 ? (
            <div className="text-center text-muted-foreground py-10 text-sm">
              {searchQuery ? 'No matching files found.' : 'This folder is empty.'}
            </div>
          ) : (
            filteredFiles.map((file) => (
              <button
                key={file.sha}
                onClick={() =>
                  file.type === 'dir'
                    ? handleNavigate(file.path)
                    : onFileSelect(file.path)
                }
                className="flex items-center gap-3 w-full p-2 hover:bg-muted/50 rounded-md text-left text-sm group transition-colors"
              >
                <span className="shrink-0 text-muted-foreground group-hover:text-foreground">
                  {file.type === 'dir' ? (
                    <FolderIcon
                      weight="fill"
                      size={18}
                      className="text-blue-400"
                    />
                  ) : (
                    <FileCodeIcon size={18} />
                  )}
                </span>
                <span className="truncate">{file.name}</span>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
