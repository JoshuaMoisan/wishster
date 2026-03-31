import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default function PlayNotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-6 px-4 text-center">
      <div>
        <h1 className="text-2xl font-semibold">Carte introuvable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ce lien est invalide ou la carte a été désactivée.
        </p>
      </div>
      <Link
        href="/"
        className={cn(buttonVariants({ size: "default" }), "rounded-xl")}
      >
        Retour accueil
      </Link>
    </div>
  );
}
