import { HomeContent } from "@/components/home/home-content";

type Props = {
  searchParams: Promise<{ spotify_error?: string }>;
};

export default async function HomePage({ searchParams }: Props) {
  const sp = await searchParams;
  return <HomeContent spotifyError={sp.spotify_error} />;
}
