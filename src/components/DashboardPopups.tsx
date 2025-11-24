import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";
import popupBonus from "@/assets/popup-bonus-afiliados.jpeg";

export const DashboardPopups = () => {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    // Show popup after a short delay on every login
    setTimeout(() => {
      setShowPopup(true);
    }, 1000);
  }, []);

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  return (
    <>
      {/* Popup - Bonus Afiliados */}
      <Dialog open={showPopup} onOpenChange={handleClosePopup}>
        <DialogContent className="max-w-[85vw] sm:max-w-md md:max-w-lg p-0 bg-transparent border-0 overflow-hidden">
          <button
            onClick={handleClosePopup}
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
    </>
  );
};
