import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AvatarSelection from "../features/auth/AvatarSelection";

const AvatarPage = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token") || "";

  useEffect(() => {
    if (!token) {
      navigate("/", { replace: true });
    }
  }, [token, navigate]);

  if (!token) {
    return null;
  }

  return (
    <AvatarSelection
      token={token}
      onSuccess={() => {
        // Sau khi lưu avatar, quay lại không gian làm việc
        const lastRoom = localStorage.getItem("roomId");
        if (lastRoom) {
          navigate(`/app/${lastRoom}`, { replace: true });
        } else {
          navigate("/spaces", { replace: true });
        }
      }}
    />
  );
};

export default AvatarPage;

