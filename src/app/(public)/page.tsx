import { AccessFlow } from "@/components/landing/access-flow";
import { Closing } from "@/components/landing/closing";
import { Gdpr } from "@/components/landing/gdpr";
import { Hero } from "@/components/landing/hero";
import { Marquee } from "@/components/landing/marquee";
import { Pillars } from "@/components/landing/pillars";
import { ProductPreview } from "@/components/landing/product-preview";
import { Stats } from "@/components/landing/stats";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Marquee />
      <Pillars />
      <AccessFlow />
      <ProductPreview />
      <Stats />
      <Gdpr />
      <Closing />
    </>
  );
}
