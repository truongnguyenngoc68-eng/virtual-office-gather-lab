import { useState, useEffect } from "react";

interface DeviceSettings {
  cameras: MediaDeviceInfo[];
  microphones: MediaDeviceInfo[];
  speakers: MediaDeviceInfo[];
}

interface UseDeviceSettingsReturn {
  devices: DeviceSettings;
  selectedCamera: string;
  selectedMicrophone: string;
  selectedSpeaker: string;
  setSelectedCamera: (deviceId: string) => void;
  setSelectedMicrophone: (deviceId: string) => void;
  setSelectedSpeaker: (deviceId: string) => void;
  loadDevices: () => Promise<void>;
}

/**
 * Custom hook for managing media device settings
 */
export const useDeviceSettings = (isOpen: boolean, activeTab: string): UseDeviceSettingsReturn => {
  const [devices, setDevices] = useState<DeviceSettings>({
    cameras: [],
    microphones: [],
    speakers: [],
  });
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>("");
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>("");

  const loadDevices = async () => {
    try {
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const cameras = deviceList.filter((d) => d.kind === "videoinput");
      const microphones = deviceList.filter((d) => d.kind === "audioinput");
      const speakers = deviceList.filter((d) => d.kind === "audiooutput");

      setDevices({ cameras, microphones, speakers });

      // Set defaults
      if (cameras.length > 0 && !selectedCamera) {
        setSelectedCamera(cameras[0].deviceId);
      }
      if (microphones.length > 0 && !selectedMicrophone) {
        setSelectedMicrophone(microphones[0].deviceId);
      }
      if (speakers.length > 0 && !selectedSpeaker) {
        setSelectedSpeaker(speakers[0].deviceId);
      }
    } catch (error) {
      console.error("Error loading devices:", error);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === "audio") {
      loadDevices();
    }
  }, [isOpen, activeTab]);

  return {
    devices,
    selectedCamera,
    selectedMicrophone,
    selectedSpeaker,
    setSelectedCamera,
    setSelectedMicrophone,
    setSelectedSpeaker,
    loadDevices,
  };
};
