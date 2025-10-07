
"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

const getTitleFromPath = (path: string) => {
    if (path.startsWith('/dashboard')) return 'On-chain';
    if (path.startsWith('/send')) return 'Envoyer';
    if (path.startsWith('/receive')) return 'Recevoir';
    if (path.startsWith('/buy')) return 'Acheter des Bitcoins';
    if (path.startsWith('/sell')) return 'Vendre des Bitcoins';
    if (path.startsWith('/orders')) return 'Mes Commandes';
    if (path.startsWith('/transactions')) return 'Transactions';
    if (path.startsWith('/profile')) return 'Profil';
    if (path.startsWith('/settings')) return 'Paramètres';
    if (path.startsWith('/support')) return 'Support';
    if (path.startsWith('/lightning')) return 'Lightning';
    return 'On-chain';
}

export function HeaderTitle() {
  const pathname = usePathname();
  const title = useMemo(() => getTitleFromPath(pathname), [pathname]);

  return <h1 className="text-lg font-semibold md:text-xl">{title}</h1>;
}
