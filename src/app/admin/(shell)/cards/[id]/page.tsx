import { notFound } from "next/navigation";
import { getCardById } from "@/lib/supabase/service";
import { CardFormEdit } from "@/components/admin/card-form-edit";

type Props = { params: Promise<{ id: string }> };

export default async function EditCardPage({ params }: Props) {
  const { id } = await params;
  const card = await getCardById(id);
  if (!card) notFound();
  return <CardFormEdit initial={card} />;
}
