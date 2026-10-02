import LandingPage from "@/components/LandingPage";
import { CookieConsent } from "@/components/CookieConsent";
import { SupportChat } from "@/components/SupportChat";

export default function HomePage() {
  return (
    <>
      <LandingPage />
      <CookieConsent />
      <SupportChat />
    </>
  );
}
