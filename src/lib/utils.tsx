import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { type VariantProps } from "class-variance-authority";
import { badgeVariants } from "@/components/ui/badge";
import { AlertCircle, CircleCheck, CircleX, Clock, ShoppingCart, Hourglass } from "lucide-react";
import React from "react";


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const shortenText = (text: string | null | undefined, start = 8, end = 8) => {
  if (!text) return 'une adresse externe';
  if (text.length <= start + end) return text;
  return `${text.substring(0, start)}...${text.substring(text.length - end)}`;
}

export const getFiat = (val: number | null | undefined, currency: string) => {
  if (val === null || val === undefined) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency.toUpperCase() }).format(0);
  }
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency.toUpperCase() }).format(val);
}

export const getStatusVariant = (status: string): VariantProps<typeof badgeVariants>["variant"] => {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'paid':
    case 'succeeded':
    case 'confirmed':
       return 'success';
    case 'pending':
    case 'awaiting_confirmation':
       return 'warning';
    case 'failed':
    case 'expired':
       return 'destructive';
    default: return 'secondary';
  }
}

export const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'paid':
      case 'succeeded':
      case 'confirmed':
        return <CircleCheck className="size-5" />;
      case 'pending': 
        return <Clock className="size-5" />;
      case 'awaiting_confirmation': 
        return <Hourglass className="size-5" />;
       case 'failed':
       case 'expired':
        return <CircleX className="size-5" />;
      default: return <ShoppingCart className="size-5" />;
    }
}
