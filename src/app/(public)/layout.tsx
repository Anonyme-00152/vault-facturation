import { SiteFooter } from "@/components/landing/closing";
import { SiteHeader } from "@/components/landing/site-header";
import { SmoothScroll } from "@/components/motion/smooth-scroll";

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SmoothScroll />
      <a
        href="#contenu"
        className="sr-only z-[60] rounded-full bg-foreground px-4 py-2 text-background focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Aller au contenu
      </a>
      <SiteHeader />
      <main id="contenu">{children}</main>
      <SiteFooter />
    </>
  );
}
