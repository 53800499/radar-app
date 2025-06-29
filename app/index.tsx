/** @format */

import { useRouter } from "expo-router";
import { useEffect } from "react";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // Rediriger automatiquement vers la page splash
    router.replace("/splash");
  }, []);

  return null;
}
