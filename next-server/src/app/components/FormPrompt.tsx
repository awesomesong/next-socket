import { useEffect } from "react";
 
export const FormPrompt = () => {
  useEffect(() => {
    const onBeforeUnload = (e: any) => {
        e.preventDefault();
        e.returnValue = "";
    };

    history.pushState(null,"",window.location.href); 

    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("popstate", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.addEventListener("popstate", onBeforeUnload);
    };
  }, []);

  return undefined;
};