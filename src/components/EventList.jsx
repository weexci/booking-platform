// src/components/EventList.jsx
import React from "react";
import EventCard from "./EventCard";

export default function EventList({
  events,
  onBook,
  quantities,
  onQuantityChange,
  openLoginModal,
}) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
      }}
    >
      {events.map((ev) => (
        <EventCard
          key={ev.id}
          event={ev}
          quantities={quantities}
          onQuantityChange={onQuantityChange}
          onBook={onBook}
          openLoginModal={openLoginModal}
        />
      ))}
    </div>
  );
}
