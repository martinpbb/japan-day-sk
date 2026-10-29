import { useEffect } from "react";
import { useI18n } from "../lib/useI18n.js";

let smartsuppInitialized = false;
const SMARTSUPP_KEY = "bc955f82abb1e2ce11cf5a729c9461f0324d7534";

export default function SmartsuppChat() {
  const { locale } = useI18n();
  useEffect(() => {
    if (smartsuppInitialized || window.smartsupp) return;

    try {
      window._smartsupp = window._smartsupp || {};
      window._smartsupp.key = SMARTSUPP_KEY;
      if (
        window.location.hostname === "japanday.sk" ||
        window.location.hostname === "www.japanday.sk"
      ) {
        window._smartsupp.cookieDomain = ".japanday.sk";
      }
      window._smartsupp.sitePlatform = "Japan Day / React + Vite";
      window.smartsupp = window.smartsupp || function (...args) {
        window.smartsupp._.push(args);
      };
      window.smartsupp._ = window.smartsupp._ || [];
      window.smartsupp("language", locale === "en" ? "en" : locale === "de" ? "de" : locale === "es" ? "es" : "sk");

      const script = document.createElement("script");
      script.type = "text/javascript";
      script.charset = "utf-8";
      script.async = true;
      script.src = "https://www.smartsuppchat.com/loader.js?";

      const firstScript = document.getElementsByTagName("script")[0];
      if (firstScript?.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript);
      } else {
        document.head.appendChild(script);
      }
      smartsuppInitialized = true;
    } catch {
      // A chat failure must not affect the rest of the application.
    }
  }, [locale]);

  return null;
}
/**
 * Copyright © 2026 Martin Labudík
 * All rights reserved.
 *
 * Unauthorized copying, modification, redistribution or reuse
 * of this source code, in whole or in part, is prohibited
 * without prior written permission from the copyright holder.
 */
