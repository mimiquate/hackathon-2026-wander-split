import {
  FinalCta,
  Gastos,
  Hero,
  HowItWorks,
  RouteSection,
  SiteFooter,
  SiteNav,
  Vouchers,
} from "@/components/site";

export default function Home() {
  return (
    <>
      <SiteNav />
      <Hero />
      <RouteSection />
      <HowItWorks />
      <Gastos />
      <Vouchers />
      <FinalCta />
      <SiteFooter />
    </>
  );
}
