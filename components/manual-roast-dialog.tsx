"use client"

import { useState, useEffect } from 'react';
import { useCompletion } from '@ai-sdk/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  ArrowLeftIcon,
  FireIcon,
  CircleNotchIcon,
} from '@phosphor-icons/react/dist/ssr';
import { FileExplorer } from '@/components/file-explorer';
import { fetchFileContent } from '@/app/actions/github-files';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface ManualRoastDialogProps {
  repoName: string; // username/repo
  repoId: number;
}

export function ManualRoastDialog({
  repoName,
  repoId,
}: ManualRoastDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'select' | 'roast'>('select');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [, setFileContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const queryClient = useQueryClient();

  const {
    complete,
    completion,
    isLoading: isRoasting,
  } = useCompletion({
    api: '/api/roast',
    onFinish: (prompt, result) => {
      if (!result || result.length === 0) {
        console.error('[Client/Roast] Stream finished but received 0 bytes.');
        // If the server saved it, maybe we just missed the stream.
        // But usually this means failure to read stream.
        // Let's assume if it's 0 length, it failed to render.
        // But wait, if the roast was saved to DB (as per server logs), then the server generated it.
        // So we can probably refresh.
        // However, let's show a warning if empty.
        toast.warning('Roast saved, but stream output was empty.');
      } else {
        console.log(
          '[Client/Roast] Stream finished successfully. Final text length:',
          result.length
        );
        toast.success('Roast completed and saved.');
      }
      queryClient.invalidateQueries({ queryKey: ['repoDetails'] });
    },
    onError: (err) => {
      console.error('[Client/Roast] Stream error:', err);
      // Try to parse if it's a JSON string in the message (sometimes happens with fetch)
      let message = err.message;
      try {
        const parsed = JSON.parse(message);
        if (parsed.error) message = parsed.error;
      } catch {
        // Not JSON, use as is
      }
      toast.error(`Roast failed: ${message}`);
    },
  });

  useEffect(() => {
    if (completion) {
      console.log(
        `[Client/Roast] Completion updated. Length: ${completion.length}`
      );
    }
  }, [completion]);

  const handleFileSelect = async (path: string) => {
    console.log(`[Client/Roast] File selected: ${path}`);
    setLoadingContent(true);
    const { content, error } = await fetchFileContent(repoName, path);

    if (error) {
      console.error('[Client/Roast] Failed to fetch file content:', error);
      toast.error(error);
      setLoadingContent(false);
      return;
    }

    console.log(
      `[Client/Roast] File content fetched (${
        content?.length || 0
      } chars). Triggering roast...`
    );
    setFileContent(content);
    setSelectedFile(path);
    setStep('roast');
    setLoadingContent(false);

    // Trigger roast immediately
    try {
      await complete('', {
        body: {
          code: content,
          filename: path,
          repoId: repoId,
        },
      });
      console.log("[Client/Roast] 'complete' function executed.");
    } catch (e) {
      console.error("[Client/Roast] 'complete' execution failed:", e);
    }
  };

  const reset = () => {
    setStep('select');
    setSelectedFile(null);
    setFileContent(null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button className="uppercase font-bold gap-2 shrink-0">
          <FireIcon size={18} />
          Roast Manually
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2 shrink-0 border-b">
          <DialogTitle className="flex items-center gap-2">
            {step === 'roast' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 mr-2"
                onClick={reset}
                disabled={isRoasting}
              >
                <ArrowLeftIcon />
              </Button>
            )}
            {step === 'select'
              ? 'Select a File to Roast'
              : `Roasting ${selectedFile}`}
          </DialogTitle>
          <DialogDescription>
            {step === 'select'
              ? 'Browse your repository and pick a file. Our AI will analyze it instantly.'
              : 'Watch as your code gets torn apart in real-time.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 relative bg-muted/10">
          {loadingContent && (
            <div className="absolute inset-0 z-50 bg-background/80 flex items-center justify-center backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2">
                <CircleNotchIcon
                  size={32}
                  className="animate-spin text-primary"
                />
                <p className="text-sm font-bold animate-pulse">
                  Fetching file...
                </p>
              </div>
            </div>
          )}

          {step === 'select' ? (
            <div className="p-4 h-full">
              <FileExplorer
                repoFullName={repoName}
                onFileSelect={handleFileSelect}
              />
            </div>
          ) : (
            <ScrollArea className="h-full p-6">
              {isRoasting && !completion && (
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <CircleNotchIcon className="animate-spin" />
                  <span>Reading code...</span>
                </div>
              )}
              <div className="prose prose-sm dark:prose-invert max-w-none font-mono whitespace-pre-wrap">
                {completion}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
