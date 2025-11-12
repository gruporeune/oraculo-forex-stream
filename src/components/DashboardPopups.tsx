import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";
import popupBonus from "@/assets/popup-bonus-afiliados.jpeg";
import popupLive from "@/assets/popup-live-matuza.jpeg";

export const DashboardPopups = () => {
  const [showFirstPopup, setShowFirstPopup] = useState(false);
  const [showSecondPopup, setShowSecondPopup] = useState(false);

  useEffect(() => {
    // Show first popup after a short delay on every login
    setTimeout(() => {
      setShowFirstPopup(true);
    }, 1000);
  }, []);

  const handleCloseFirstPopup = () => {
    setShowFirstPopup(false);
    // Show second popup after first is closed
    setTimeout(() => {
      setShowSecondPopup(true);
    }, 500);
  };

  const handleCloseSecondPopup = () => {
    setShowSecondPopup(false);
  };

  return (
    <>
      {/* First Popup - Bonus Afiliados */}
      <Dialog open={showFirstPopup} onOpenChange={handleCloseFirstPopup}>
        <DialogContent className="max-w-[85vw] sm:max-w-md md:max-w-lg p-0 bg-transparent border-0 overflow-hidden">
          <button
            onClick={handleCloseFirstPopup}
            className="absolute -top-4 -right-4 z-50 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-6 w-6 text-gray-700" />
          </button>
          <div className="relative w-full">
            <img
              src={popupBonus}
              alt="Bônus Exclusivo para Afiliados"
              className="w-full h-auto rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Second Popup - Live Matuza */}
      <Dialog open={showSecondPopup} onOpenChange={handleCloseSecondPopup}>
        <DialogContent className="max-w-[85vw] sm:max-w-md md:max-w-lg p-0 bg-transparent border-0 overflow-hidden">
          <button
            onClick={handleCloseSecondPopup}
            className="absolute -top-4 -right-4 z-50 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-6 w-6 text-gray-700" />
          </button>
          <div className="relative w-full">
            <img
              src={popupLive}
              alt="Live de operações com Matuza"
              className="w-full h-auto rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
