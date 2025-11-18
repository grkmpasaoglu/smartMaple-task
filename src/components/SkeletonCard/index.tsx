import "./skeletonCard.scss";

const SkeletonCard = () => {
  return (
    <div className="profile-section">
      <div className="profile-info">
        <div
          className="skeleton-shimmer"
          style={{ width: 180, height: 48, borderRadius: 4, marginBottom: 8 }}
        />
        <div
          className="skeleton-shimmer"
          style={{ width: 180, height: 32, borderRadius: 4, marginBottom: 6 }}
        />
        <div
          className="skeleton-shimmer"
          style={{ width: 100, height: 32, borderRadius: 4 }}
        />
      </div>
    </div>
  );
};

export default SkeletonCard;
