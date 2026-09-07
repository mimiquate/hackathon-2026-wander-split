import {
  FinalCta,
  Gastos,
  Hero,
  HowItWorks,
  SiteFooter,
  SiteNav,
  Vouchers,
} from "@/components/site";

export default function Home() {
  return (
    <>
      <SiteNav />
      <Hero />
      <HowItWorks />
      <Gastos />
      <Vouchers />
      <FinalCta />
      <SiteFooter />
    </>
  );
}
