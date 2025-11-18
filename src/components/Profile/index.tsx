import type { UserInstance } from "../../models/user";
import AuthSession from "../../utils/session";
import "../profileCalendar.scss";
import "./ProfileCard.scss";

type ProfileCardProps = {
  profile: UserInstance;
};

import SkeletonCard from "../SkeletonCard";

const getInitials = (name: string): string => {
  const parts = name.split(" ");
  if (parts.length === 1) {
    return name.substring(0, 2).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const ProfileCard = ({ profile }: ProfileCardProps) => {
  if (!profile || !profile.name) {
    return <SkeletonCard />;
  }

  const userRole = profile.role?.name ?? AuthSession.getRoles();
  const userEmail = profile?.email ?? AuthSession.getEmail();
  const initials = getInitials(profile.name);

  return (
    <div className="profile-card-container">
      <div className="profile-avatar">
        <span className="profile-initials">{initials}</span>
      </div>
      <div className="profile-info-content">
        <h2 className="user-name">{profile.name}</h2>
        <p className="user-role">{userRole}</p>
        <p className="user-email">{userEmail}</p>
      </div>
    </div>
  );
};

export default ProfileCard;
