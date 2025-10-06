
"use client";

import { Copy } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CopyButtonProps extends Omit<ButtonProps, 'onClick'> {
  textToCopy: string;
  toastMessage?: string;
  onCopy?: () => void;
}

export function CopyButton({ textToCopy, toastMessage, children, className, onCopy, ...props }: CopyButtonProps) {
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy);
    toast({
      title: toastMessage || "Copié dans le presse-papiers",
    });
    if (onCopy) {
      onCopy();
    }
  };

  if (!children) {
    return (
       <Button onClick={handleCopy} className={className} {...props}>
         <Copy className="size-4" />
         <span className="sr-only">Copier</span>
      </Button>
    )
  }

  return (
    <Button onClick={handleCopy} className={cn("w-full", className)} {...props}>
      <Copy className="mr-2 size-4" />
      {children}
    </Button>
  );
}
