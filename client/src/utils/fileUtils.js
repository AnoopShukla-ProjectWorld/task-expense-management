import axios from "axios";
import toast from "react-hot-toast";

/**
 * Safely downloads or views a static asset by performing an asynchronous pre-flight
 * check. This prevents broken blank new tabs displaying generic raw JSON 404 responses
 * when seed or legacy entries link to missing physical files on the server.
 * 
 * @param {string} fileUrl - Absolute URL of the static file on the server
 */
export const handleSafeDownload = async (fileUrl) => {
  if (!fileUrl) {
    toast.error("No document file is linked to this entry.");
    return;
  }
  
  const toastId = toast.loading("Verifying file availability...");
  try {
    // Fast pre-flight check to verify filesystem existence on node server
    await axios.head(fileUrl);
    toast.dismiss(toastId);
    
    // Open in a new tab natively
    window.open(fileUrl, "_blank");
  } catch (err) {
    toast.dismiss(toastId);
    toast.error("The requested document is not available on the server filesystem.");
  }
};
