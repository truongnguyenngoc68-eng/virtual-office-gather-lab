import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "../contexts/SocketContext";
import { formatDate, formatRelativeTime } from "../utils/date";
import { getAvatarColor } from "../utils/avatar";

const ProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useSocket();
  const [profileUser, setProfileUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"posts" | "events" | "resources">(
    "posts"
  );
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [userEvents, setUserEvents] = useState<any[]>([]);
  const [userResources, setUserResources] = useState<any[]>([]);

  const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:5001";
  const isOwnProfile = currentUser?.userId === userId;

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  useEffect(() => {
    if (profileUser) {
      fetchUserContent();
    }
  }, [profileUser, activeTab]);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${serverUrl}/api/users/${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        const data = await response.json();
        setProfileUser(data);
      } else if (response.status === 404) {
        navigate("/app");
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserContent = async () => {
    if (!profileUser) return;

    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Fetch user's posts
      if (activeTab === "posts") {
        // Posts functionality removed
        setUserPosts([]);
      }
    } catch (error) {
      console.error("Error fetching user content:", error);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-[900px] mx-auto p-5 bg-white min-h-screen">
        <div className="text-center py-[60px] px-5 text-gray-600 text-base">Loading profile...</div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="w-full max-w-[900px] mx-auto p-5 bg-white min-h-screen">
        <div className="text-center py-[60px] px-5 text-gray-600 text-base">User not found</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[900px] mx-auto p-5 bg-white min-h-screen">
      <div className="relative mb-[30px]">
        <button className="mb-5 px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-800 cursor-pointer text-sm transition-all hover:bg-gray-200 hover:border-indigo-600 hover:text-indigo-600" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <div className="flex justify-center mb-5">
          <div
            className="w-[120px] h-[120px] rounded-full flex items-center justify-center text-[48px] font-semibold text-white border-4 border-white shadow-lg"
            style={{ backgroundColor: getAvatarColor(profileUser._id) }}
          >
            {profileUser.username?.[0]?.toUpperCase() || "?"}
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-[32px] font-bold text-gray-800 mb-2">{profileUser.username}</h1>
          {profileUser.email && (
            <p className="text-base text-gray-600 mb-3">{profileUser.email}</p>
          )}
          {profileUser.bio && <p className="text-[15px] text-gray-800 leading-relaxed mb-4 max-w-[600px] mx-auto">{profileUser.bio}</p>}
          <div className="flex gap-4 justify-center items-center flex-wrap">
            <span className="text-sm text-gray-600">
              Joined {formatDate(new Date(profileUser.createdAt || Date.now()))}
            </span>
            {profileUser.role && (
              <span className="px-3 py-1 bg-indigo-600 text-white rounded-xl font-semibold text-xs uppercase">{profileUser.role}</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-10">
        <div className="flex gap-2 border-b-2 border-gray-300 mb-6">
          <button
            className={`px-6 py-3 bg-none border-none border-b-2 text-[15px] font-medium cursor-pointer transition-all -mb-[2px] ${
              activeTab === "posts"
                ? "text-indigo-600 border-b-indigo-600"
                : "text-gray-600 border-b-transparent hover:text-gray-800"
            }`}
            onClick={() => setActiveTab("posts")}
          >
            Posts ({userPosts.length})
          </button>
        </div>

        <div className="min-h-[400px]">
          {activeTab === "posts" && (
            <div className="flex flex-col gap-4">
              <div className="text-center py-[60px] px-5 text-gray-600 text-base">No posts yet</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
