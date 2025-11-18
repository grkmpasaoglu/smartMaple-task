/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import dayjs from "dayjs";
import "./eventModal.scss";

const EventModal = ({
  event,
  schedule,
  onClose,
}: {
  event: any;
  schedule: any;
  onClose: () => void;
}) => {
  if (!event) return null;
  const staff = schedule.staffs.find(
    (s: any) => s.id === event.extendedProps?.staffId || event.staffId
  );
  const shift = schedule.shifts.find(
    (s: any) => s.id === event.extendedProps?.shiftId || event.shiftId
  );
  const start =
    event.extendedProps?.shiftStart || event.startStr || event.start;
  const end = event.extendedProps?.shiftEnd || event.endStr || event.end;

  const STAFF_COLORS = [
    "#e74c3c",
    "#3498db",
    "#2ecc71",
    "#f1c40f",
    "#9b59b6",
    "#e67e22",
    "#1abc9c",
    "#34495e",
    "#fd79a8",
    "#00b894",
    "#636e72",
    "#fdcb6e",
    "#6c5ce7",
    "#00cec9",
    "#d35400",
  ];

  const staffColorMap = {};
  schedule?.staffs?.forEach((s, idx) => {
    staffColorMap[s.id] = STAFF_COLORS[idx % STAFF_COLORS.length];
  });

  let pairStaffs: {
    name: string;
    color: string;
    start: string;
    end: string;
  }[] = [];
  if (staff?.pairList && start) {
    const clickedDate = dayjs(start).format("DD.MM.YYYY");
    pairStaffs = staff.pairList
      .filter((pair: any) => {
        const pairStart = dayjs(pair.startDate, "DD.MM.YYYY");
        const pairEnd = dayjs(pair.endDate, "DD.MM.YYYY");
        const current = dayjs(clickedDate, "DD.MM.YYYY");
        return (
          current.valueOf() >= pairStart.valueOf() &&
          current.valueOf() <= pairEnd.valueOf()
        );
      })
      .map((pair: any) => {
        const pairStaff = schedule.staffs.find(
          (s: any) => s.id === pair.staffId
        );
        return pairStaff
          ? {
              name: pairStaff.name,
              color: staffColorMap[pairStaff.id],
              start: pair.startDate,
              end: pair.endDate,
            }
          : null;
      })
      .filter(Boolean) as {
      name: string;
      color: string;
      start: string;
      end: string;
    }[];
  }

  // Shift color for header bar
  const shiftColor =
    shift && staff
      ? staffColorMap[staff.id]
      : "#888";

  // Gün, saat, shift header bilgileri
  const headerDay = start ? dayjs(start).format("DD MMMM YYYY") : "-";
  const headerTime = shift?.shiftStart || (start ? dayjs(start).format("HH:mm") : "-");
  const headerShift = shift?.name || event.title;

  // Timeline görseli için saatler
  const timelineStart = shift?.shiftStart || (start ? dayjs(start).format("HH:mm") : "-");
  const timelineEnd = shift?.shiftEnd || (end ? dayjs(end).format("HH:mm") : "-");

  return (
    <div className="event-modal-slide-overlay">
      <div className="event-modal-slide-panel">
        {/* Header bar */}
        <div
          className="event-modal-headerbar"
          style={{
            background: shiftColor,
            color: "#fff",
            padding: "22px 32px 18px 32px",
            borderTopRightRadius: 16,
            borderTopLeftRadius: 16,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 2 }}>
            {headerDay}
          </div>
          <div style={{ fontSize: 17, fontWeight: 500, opacity: 0.92 }}>
            {headerTime} &mdash; {headerShift}
          </div>
        </div>
        {/* Close button */}
        <button className="event-modal-close-btn" onClick={onClose}>
          &times;
        </button>
        {/* Event details */}
        <div style={{ padding: "32px 32px 24px 32px" }}>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 18 }}>
            Personel: <span style={{ fontWeight: 400 }}>{staff?.name || "-"}</span>
          </div>
          {/* Timeline visual */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>
              Shift Timeline
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 500, minWidth: 48 }}>
                {timelineStart}
              </span>
              <div
                style={{
                  flex: 1,
                  height: 6,
                  background: shiftColor,
                  borderRadius: 4,
                  margin: "0 10px",
                  position: "relative",
                  opacity: 0.7,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: -6,
                    width: 12,
                    height: 18,
                    background: "#fff",
                    border: `2px solid ${shiftColor}`,
                    borderRadius: 8,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: -6,
                    width: 12,
                    height: 18,
                    background: "#fff",
                    border: `2px solid ${shiftColor}`,
                    borderRadius: 8,
                  }}
                />
              </div>
              <span style={{ fontSize: 14, fontWeight: 500, minWidth: 48 }}>
                {timelineEnd}
              </span>
            </div>
          </div>
          <div style={{ fontSize: 16, marginBottom: 8 }}>
            <b>Vardiya:</b> {headerShift}
          </div>
          <div style={{ fontSize: 16, marginBottom: 8 }}>
            <b>Tarih:</b> {headerDay}
          </div>
          <div style={{ fontSize: 16, marginBottom: 8 }}>
            <b>Başlangıç:</b> {timelineStart}
          </div>
          <div style={{ fontSize: 16, marginBottom: 8 }}>
            <b>Bitiş:</b> {timelineEnd}
          </div>
          {/* Pair info */}
          {pairStaffs.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                Pair
              </div>
              {pairStaffs.map((p, i) => (
                <div
                  key={i}
                  style={{
                    color: p.color,
                    fontWeight: 500,
                    fontSize: 15,
                    marginBottom: 2,
                  }}
                >
                  {p.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Overlay background */}
      <div className="event-modal-slide-bg" onClick={onClose} />
    </div>
  );
};

export default EventModal;
