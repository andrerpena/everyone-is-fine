import { useEffect, useState } from "react";

const MOBILE_MAX_WIDTH = 480;

function isMobilePhone(): boolean {
  // Check screen width - phones are typically <= 480px
  const isNarrowScreen = window.innerWidth <= MOBILE_MAX_WIDTH;

  // Check user agent for mobile phone indicators (not tablet)
  const ua = navigator.userAgent.toLowerCase();
  const isMobileUA =
    /iphone|ipod|android.*mobile|windows phone|blackberry|mobile/i.test(ua);

  // iPad specifically reports as "Macintosh" in newer iOS, but we want to allow tablets
  // Android tablets don't have "mobile" in their UA string
  const isTablet = /ipad|tablet|playbook|silk/i.test(ua);

  // It's a mobile phone if it has a narrow screen AND mobile UA, but not a tablet
  return isNarrowScreen && isMobileUA && !isTablet;
}

export function useIsMobilePhone(): boolean {
  const [isMobile, setIsMobile] = useState(() => isMobilePhone());

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(isMobilePhone());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
}
