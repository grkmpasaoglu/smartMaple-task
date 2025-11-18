/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import { updateAssignmentDate } from "../../store/schedule/actions";

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
import type { ScheduleInstance } from "../../models/schedule";
import type { UserInstance } from "../../models/user";
import FullCalendar from "@fullcalendar/react";
import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import type { EventInput } from "@fullcalendar/core/index.js";
import "../profileCalendar.scss";
import "./calendarEventColors.scss";
import EventModal from "../EventModal";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(utc);
dayjs.extend(isSameOrBefore);
dayjs.extend(customParseFormat);

type CalendarContainerProps = {
  schedule: ScheduleInstance;
  auth: UserInstance;
};

// Chip tab styles (eklenmesi gereken stil)
const chipTabStyles: React.CSSProperties = {
  display: "flex",
  gap: 8,
  overflowX: "auto",
  padding: "4px 0 12px 0",
  marginBottom: 16,
};

const chipStyles = (color: string, selected: boolean): React.CSSProperties => ({
  background: color,
  color: "#fff",
  border: selected ? "2px solid #222" : "2px solid transparent",
  borderRadius: 20,
  padding: "6px 18px",
  fontWeight: 500,
  fontSize: 15,
  cursor: "pointer",
  outline: "none",
  opacity: selected ? 1 : 0.7,
  boxShadow: selected
    ? "0 2px 8px rgba(0,0,0,0.08)"
    : "0 1px 2px rgba(0,0,0,0.03)",
  transition: "border 0.2s, box-shadow 0.2s, opacity 0.2s",
  whiteSpace: "nowrap",
  userSelect: "none",
});

const CalendarContainer = ({ schedule, auth }: CalendarContainerProps) => {
  const dispatch = useDispatch();

  const staffColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    schedule?.staffs?.forEach((staff: any, idx: number) => {
      map[staff.id] = STAFF_COLORS[idx % STAFF_COLORS.length];
    });
    return map;
  }, [schedule?.staffs]);
  const calendarRef = useRef<FullCalendar>(null);
  console.log(schedule, "schedule data buradaa@@@@@@@@");
  const [events, setEvents] = useState<EventInput[]>([]);
  const [highlightedDates, setHighlightedDates] = useState<string[]>([]);

  const [pairedDates, setPairedDates] = useState<
    { date: string; pairStaffId: string }[]
  >([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(
    schedule?.staffs?.[0]?.id || null
  );
  const [initialDate, setInitialDate] = useState<Date>(
    dayjs(schedule?.scheduleStartDate).toDate()
  );
  const [popupEvent, setPopupEvent] = useState<any>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const getPlugins = () => {
    const plugins = [dayGridPlugin];
    plugins.push(interactionPlugin);
    return plugins;
  };

  const getShiftById = (id: string) => {
    return schedule?.shifts?.find((shift: { id: string }) => id === shift.id);
  };

  const getAssigmentById = (id: string) => {
    return schedule?.assignments?.find((assign) => id === assign.id);
  };

  const validDates = () => {
    const dates = [];
    let currentDate = dayjs(schedule.scheduleStartDate);
    while (
      currentDate.isBefore(schedule.scheduleEndDate) ||
      currentDate.isSame(schedule.scheduleEndDate)
    ) {
      dates.push(currentDate.format("YYYY-MM-DD"));
      currentDate = currentDate.add(1, "day");
    }
    return dates;
  };

  const getDatesBetween = (startDate: string, endDate: string): string[] => {
    const dates: string[] = [];

    let current = dayjs(startDate, "DD.MM.YYYY", true);
    const end = dayjs(endDate, "DD.MM.YYYY", true);

    if (!current.isValid() || !end.isValid()) {
      console.error(
        "Geçersiz tarih formatı algılandı:",
        startDate,
        "-",
        endDate
      );
      return [];
    }

    while (current.isSameOrBefore(end, "day")) {
      dates.push(current.format("DD-MM-YYYY"));
      current = current.add(1, "day");
    }
    return dates;
  };

  const getShiftColorClass = (shiftId: string) => {
    const idx = schedule?.shifts?.findIndex((s) => s.id === shiftId) ?? 0;
    return `calendar-event-shift-${idx >= 0 ? idx : 0}`;
  };

  const getStaffColorClass = (staffId: string) => {
    const idx = schedule?.staffs?.findIndex((s) => s.id === staffId) ?? 0;
    return `calendar-event-staff-${idx >= 0 ? idx : 0}`;
  };

  const generateStaffBasedCalendar = () => {
    let works: EventInput[] = [];
    let offDays: string[] = [];
    let staffPairedDates: { date: string; pairStaffId: string }[] = [];

    const scheduleStartFormat = dayjs(schedule.scheduleStartDate).format(
      "DD.MM.YYYY"
    );
    const scheduleEndFormat = dayjs(schedule.scheduleEndDate).format(
      "DD.MM.YYYY"
    );
    const datesInSchedule = getDatesBetween(
      scheduleStartFormat,
      scheduleEndFormat
    );

    if (selectedStaffId) {
      const selectedStaff = schedule?.staffs?.find(
        (staff) => staff.id === selectedStaffId
      );
      offDays = selectedStaff?.offDays || [];

      selectedStaff?.pairList?.forEach((pair) => {
        const datesInPair = getDatesBetween(pair.startDate, pair.endDate);
        datesInPair.forEach((date) => {
          staffPairedDates.push({ date, pairStaffId: pair.staffId });
        });
      });

      const filteredAssignments =
        schedule?.assignments?.filter(
          (assign) => assign.staffId === selectedStaffId
        ) || [];
      for (let i = 0; i < filteredAssignments.length; i++) {
        const assignmentDate = dayjs
          .utc(filteredAssignments[i]?.shiftStart)
          .format("YYYY-MM-DD");
        const isValidDate = validDates().includes(assignmentDate);
        const work = {
          id: filteredAssignments[i]?.id,
          title: getShiftById(filteredAssignments[i]?.shiftId)?.name,
          duration: "01:00",
          date: assignmentDate,
          start: filteredAssignments[i]?.shiftStart,
          staffId: filteredAssignments[i]?.staffId,
          shiftId: filteredAssignments[i]?.shiftId,
          className: `event ${getShiftColorClass(
            filteredAssignments[i]?.shiftId
          )} ${getStaffColorClass(filteredAssignments[i]?.staffId)} ${
            getAssigmentById(filteredAssignments[i]?.id)?.isUpdated
              ? "highlight"
              : ""
          } ${!isValidDate ? "invalid-date" : ""}`,
        };
        works.push(work);
      }
    } else {
      works = (schedule?.assignments || []).map((assign) => {
        const assignmentDate = dayjs
          .utc(assign?.shiftStart)
          .format("YYYY-MM-DD");
        const isValidDate = validDates().includes(assignmentDate);
        return {
          id: assign?.id,
          title: getShiftById(assign?.shiftId)?.name,
          duration: "01:00",
          date: assignmentDate,
          start: assign?.shiftStart,
          staffId: assign?.staffId,
          shiftId: assign?.shiftId,
          className: `event ${getShiftColorClass(
            assign?.shiftId
          )} ${getStaffColorClass(assign?.staffId)} ${
            getAssigmentById(assign?.id)?.isUpdated ? "highlight" : ""
          } ${!isValidDate ? "invalid-date" : ""}`,
        };
      });
      offDays = [];
      staffPairedDates = [];
    }

    let tempHighlightedDates: string[] = [];
    datesInSchedule.forEach((date) => {
      const transformedDate = dayjs(date, "DD-MM-YYYY").format("DD.MM.YYYY");
      if (offDays?.includes(transformedDate)) tempHighlightedDates.push(date);
    });

    setHighlightedDates(tempHighlightedDates);
    setPairedDates(staffPairedDates);
    setEvents(works);
  };

  useEffect(() => {
    if (!selectedStaffId && schedule?.staffs?.length > 0) {
      setSelectedStaffId(schedule.staffs[0].id);
    } else {
      generateStaffBasedCalendar();
    }
  }, [schedule, selectedStaffId]);

  useEffect(() => {
    generateStaffBasedCalendar();
  }, [selectedStaffId]);

  // Toast auto-hide effect
  useEffect(() => {
    if (toast) {
      const timeout = setTimeout(() => setToast(null), 1800);
      return () => clearTimeout(timeout);
    }
  }, [toast]);

  const RenderEventContent = ({ eventInfo }: any) => {
    return (
      <div className="event-content">
        <p>{eventInfo.event.title}</p>
      </div>
    );
  };

  const handleEventDrop = (info: any) => {
    const assignmentId = info.event.id;
    const newStart = info.event.start;

    if (!assignmentId || !newStart) {
      setToast({ message: "Bir hata oluştu ❌", type: "error" });
      return;
    }

    const newDate = dayjs(newStart).utc().toISOString();
    const newDateYMD = dayjs(newStart).format("YYYY-MM-DD");
    const isValid = validDates().includes(newDateYMD);

    if (!isValid) {
      setToast({ message: "Bu tarih geçersiz ❌", type: "error" });
      // Event'i eski yerine döndür
      info.revert();
      return;
    }

    dispatch(
      updateAssignmentDate({
        assignmentId,
        newDate,
      })
    );
    setToast({ message: "Shift updated ✔️", type: "success" });
  };

  return (
    <div className="calendar-section responsive-calendar-section">
      {/* Toast notification */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 18,
            left: "50%",
            transform: "translateX(-50%)",
            background: toast.type === "success" ? "#2ecc71" : "#e74c3c",
            color: "#fff",
            padding: "8px 22px",
            borderRadius: 18,
            fontWeight: 600,
            fontSize: 15,
            zIndex: 9999,
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            transition: "opacity 0.3s",
            opacity: 0.97,
          }}
        >
          {toast.message}
        </div>
      )}
      {/* Toast auto-hide effect */}
      <div className="calendar-wrapper responsive-calendar-wrapper">
        {/* CHIP TABS PERSONEL SEÇİMİ */}
        <div style={chipTabStyles}>
          {schedule?.staffs?.map((staff: any, idx: number) => (
            <button
              key={staff.id}
              style={chipStyles(
                STAFF_COLORS[idx % STAFF_COLORS.length],
                selectedStaffId === staff.id
              )}
              onClick={() => setSelectedStaffId(staff.id)}
              tabIndex={0}
              aria-pressed={selectedStaffId === staff.id}
            >
              {staff.name}
            </button>
          ))}
        </div>
        <FullCalendar
          ref={calendarRef}
          locale={auth.language}
          plugins={getPlugins()}
          contentHeight={"auto"}
          height="auto"
          handleWindowResize={true}
          selectable={true}
          editable={true}
          eventOverlap={true}
          eventDurationEditable={false}
          initialView="dayGridMonth"
          initialDate={initialDate}
          events={events}
          firstDay={1}
          dayMaxEventRows={4}
          fixedWeekCount={true}
          showNonCurrentDates={true}
          eventContent={(eventInfo: any) => (
            <RenderEventContent eventInfo={eventInfo} />
          )}
          eventClick={(info: any) => {
            setPopupEvent(info.event);
          }}
          eventDrop={handleEventDrop}
          datesSet={(info: any) => {
            const prevButton = document.querySelector(
              ".fc-prev-button"
            ) as HTMLButtonElement;
            const nextButton = document.querySelector(
              ".fc-next-button"
            ) as HTMLButtonElement;
            if (
              calendarRef?.current?.getApi().getDate() &&
              !dayjs(schedule?.scheduleStartDate).isSame(
                calendarRef?.current?.getApi().getDate()
              )
            )
              setInitialDate(calendarRef?.current?.getApi().getDate());
            const startDiff = dayjs(info.start)
              .utc()
              .diff(
                dayjs(schedule.scheduleStartDate).subtract(1, "day").utc(),
                "days"
              );
            const endDiff = dayjs(dayjs(schedule.scheduleEndDate)).diff(
              info.end,
              "days"
            );
            if (startDiff < 0 && startDiff > -35) prevButton.disabled = true;
            else prevButton.disabled = false;
            if (endDiff < 0 && endDiff > -32) nextButton.disabled = true;
            else nextButton.disabled = false;
          }}
          dayCellContent={({ date }) => {
            const found = validDates().includes(
              dayjs(date).format("YYYY-MM-DD")
            );
            const isHighlighted = highlightedDates.includes(
              dayjs(date).format("DD-MM-YYYY")
            );

            const pairObj = pairedDates.find(
              (p) => p.date === dayjs(date).format("DD-MM-YYYY")
            );
            const pairColor = pairObj
              ? staffColorMap[pairObj.pairStaffId]
              : undefined;
            let pairName = "";
            if (pairObj && pairObj.pairStaffId) {
              const pairStaff = schedule?.staffs?.find(
                (s: any) => s.id === pairObj.pairStaffId
              );
              pairName = pairStaff ? pairStaff.name : "";
            }
            return (
              <div
                className={`${found ? "" : "date-range-disabled"} ${
                  isHighlighted ? "highlighted-date-orange" : ""
                }`}
                style={
                  pairColor
                    ? {
                        borderBottom: `3px solid ${pairColor}`,
                        position: "relative",
                        paddingBottom: 1,
                      }
                    : {}
                }
              >
                {dayjs(date).date()}
                {pairObj && pairName && (
                  <span
                    style={{
                      display: "block",
                      fontSize: 9,
                      color: pairColor,
                      fontWeight: 500,
                      marginTop: 1,
                      lineHeight: 1,
                      whiteSpace: "nowrap",
                    }}
                  >
                    ({pairName})
                  </span>
                )}
              </div>
            );
          }}
        />
      </div>
      {popupEvent && (
        <EventModal
          event={popupEvent}
          schedule={schedule}
          onClose={() => setPopupEvent(null)}
        />
      )}
    </div>
  );
};

export default CalendarContainer;
