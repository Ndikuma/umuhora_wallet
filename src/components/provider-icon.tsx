
import Image from "next/image";
import { Landmark } from "lucide-react";
import type { BuyProvider, SellProvider } from "@/lib/types";

export const ProviderIcon = ({ provider }: { provider: BuyProvider | SellProvider }) => {
    return provider.image ? (
        <Image src={provider.image} alt={`${provider.name} logo`} width={48} height={48} className="rounded-lg border" />
    ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-lg border bg-secondary">
            <Landmark className="size-6 text-muted-foreground" />
        </div>
    );
};
