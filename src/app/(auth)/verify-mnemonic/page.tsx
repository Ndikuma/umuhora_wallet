
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { cn } from "@/lib/utils.tsx";
import { Undo2, Loader2 } from "lucide-react";

// Function to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

// Function to get 4 random unique indices from 0 to 11
const getRandomIndices = () => {
  const indices = new Set<number>();
  while (indices.size < 4) {
    indices.add(Math.floor(Math.random() * 12));
  }
  return Array.from(indices).sort((a, b) => a - b);
};

export default function VerifyMnemonicPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [originalWords, setOriginalWords] = useState<string[]>([]);
  
  const [shuffledWords, setShuffledWords] = useState<string[]>([]);
  const [challengeIndices, setChallengeIndices] = useState<number[]>([]);
  
  // State to hold the user's answers for each slot { index: word }
  const [answers, setAnswers] = useState<Record<number, string>>({});
  
  useEffect(() => {
    const storedMnemonic = localStorage.getItem("tempMnemonic");
    if (!storedMnemonic) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Phrase de récupération non trouvée. Veuillez d'abord créer un portefeuille.",
      });
      router.push("/create-wallet");
    } else {
      const words = storedMnemonic.split(" ");
      setMnemonic(storedMnemonic);
      setOriginalWords(words);
      setShuffledWords(shuffleArray(words));
      setChallengeIndices(getRandomIndices());
    }
  }, [router, toast]);

  const handleWordBankClick = (word: string) => {
    if (Object.values(answers).includes(word)) return; // Word already used
    
    const nextEmptyIndex = challengeIndices.find(index => !answers[index]);

    if (nextEmptyIndex !== undefined) {
      setAnswers(prev => ({ ...prev, [nextEmptyIndex]: word }));
    }
  };

  const handleChallengeSlotClick = (index: number) => {
    if (answers[index]) {
      const newAnswers = { ...answers };
      delete newAnswers[index];
      setAnswers(newAnswers);
    }
  };

  const handleClear = () => {
    setAnswers({});
  };

  const handleVerify = async () => {
    setIsLoading(true);

    const isCorrect = challengeIndices.every(index => answers[index] === originalWords[index]);

    if (!isCorrect) {
      toast({
        variant: "destructive",
        title: "Échec de la vérification",
        description: "Un ou plusieurs mots sont incorrects. Veuillez réessayer.",
      });
      setIsLoading(false);
      handleClear();
      return;
    }

    try {
      if (!mnemonic) throw new Error("Phrase de récupération non trouvée");
      
      await api.createWallet(mnemonic);

      toast({
        title: "Portefeuille créé avec succès",
        description: "Votre portefeuille est maintenant prêt et sécurisé.",
      });
      localStorage.removeItem("tempMnemonic");
      router.push("/dashboard");
      router.refresh();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Échec de la création du portefeuille",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const allWordsEntered = Object.keys(answers).length === challengeIndices.length && challengeIndices.length > 0;

  if (challengeIndices.length === 0) {
    return null; 
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle>Vérifiez votre phrase</CardTitle>
          <CardDescription>
            Sélectionnez le mot correct dans la liste pour chaque position demandée afin de confirmer que vous avez sauvegardé votre phrase.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {challengeIndices.map(index => (
              <div key={index} className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground">Mot #{index + 1}</label>
                <button
                  type="button"
                  onClick={() => handleChallengeSlotClick(index)}
                  className={cn(
                    "flex h-12 w-full items-center justify-center rounded-md border-2 border-dashed bg-background font-code text-lg font-medium",
                    answers[index] ? "border-primary text-primary cursor-pointer hover:border-destructive hover:text-destructive" : "border-muted-foreground text-muted-foreground",
                  )}
                >
                  {answers[index] || "?"}
                </button>
              </div>
            ))}
          </div>
          
          <div className="rounded-lg border bg-background/50 p-4">
            <div className="flex flex-wrap justify-center gap-3">
              {shuffledWords.map(word => {
                const isUsed = Object.values(answers).includes(word);
                return (
                  <Button
                    key={word}
                    variant={"outline"}
                    disabled={isUsed || allWordsEntered}
                    onClick={() => handleWordBankClick(word)}
                    className={cn(
                        "font-code text-base transition-all",
                        isUsed ? "opacity-30" : "opacity-100",
                    )}
                  >
                    {word}
                  </Button>
                );
              })}
            </div>
          </div>
          
          <div className="flex justify-center">
             <Button variant="ghost" onClick={handleClear} disabled={Object.keys(answers).length === 0 || isLoading}>
                <Undo2 className="mr-2 size-4" />
                Effacer la sélection
            </Button>
          </div>

        </CardContent>
        <CardFooter>
          <Button onClick={handleVerify} size="lg" className="w-full" disabled={!allWordsEntered || isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Vérification..." : "Vérifier & Terminer"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
