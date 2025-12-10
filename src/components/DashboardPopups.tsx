import { useState, useEffect } from "react";
import { Dialog, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import popupPlatinum from "@/assets/popup-platinum-promo.jpg";

export const DashboardPopups = () => {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    // Show popup after a short delay on every login
    const timer = setTimeout(() => {
      setShowPopup(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  return (
    <Dialog open={showPopup} onOpenChange={setShowPopup}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-50 w-full max-w-[85vw] sm:max-w-md md:max-w-lg translate-x-[-50%] translate-y-[-50%] p-0 bg-transparent border-0 overflow-visible",
            "duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          )}
          onPointerDownOutside={handleClosePopup}
          onEscapeKeyDown={handleClosePopup}
        >
          <button
            onClick={handleClosePopup}
            className="absolute -top-2 -right-2 z-[60] bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors touch-manipulation"
            aria-label="Fechar"
          >
            <X className="h-6 w-6 text-gray-700" />
          </button>
          <div className="relative w-full">
            <img
              src={popupPlatinum}
              alt="Promoção Plano Platinum"
              className="w-full h-auto rounded-lg"
            />
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};
