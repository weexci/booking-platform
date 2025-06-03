
import React from "react";

export default function BookingList({ bookings, onCancel }) {
  return (
    <div className="booking-list">
      {bookings.length === 0 ? (
        <p>Бронювань поки немає 😔</p>
      ) : (
        bookings.map((b, index) => (
          <div key={index} className="booking-item">
            <img src={b.imgSrc} alt={b.title} />
            <div className="booking-content">
              <div className="booking-info">
                <h3 className="booking-title">{b.title}</h3>
                <div className="booking-details">
                  <p><strong>Дата:</strong> {b.date}</p>
                  <p><strong>Місце:</strong> {b.place}</p>
                  <p><strong>Ціна:</strong> {b.price} грн</p>
                  <p><strong>Кількість:</strong> {b.quantity}</p>
                  <p><strong>Разом:</strong> {b.price * b.quantity} грн</p>
                </div>
              </div>
              <div className="booking-status">
                <p><strong>Статус:</strong> Заброньовано ✅</p>
                <button className="cancel-btn" onClick={() => onCancel(index)}>
                  Скасувати
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
