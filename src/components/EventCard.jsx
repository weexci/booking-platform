// src/components/EventCard.jsx
import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";

export default function EventCard({
  event,
  quantities,
  onQuantityChange,
  onBook,
  openLoginModal, // тепер приходить саме цей колбек
  user,
  onRate,
}) {
  const [ratings, setRatings] = useState([]);
  const [avgRating, setAvgRating] = useState(null);
  const [userRating, setUserRating] = useState(null);
  const [selectedScore, setSelectedScore] = useState(1);
  const [loadingRatings, setLoadingRatings] = useState(true);

  // Підписка на зміни аутентифікації, щоб відображати user
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((u) => {
      // Просто спрацьовує повторне рендерення, щоби застосувати user у JSX
      // actual setUser здійснюється у App.js, тут лише слідкуємо за зміною
      // Ви можете лишити цей блок, або прибрати взагалі – у нас user вже передано зверху
    });
    return unsubscribe;
  }, []);

  // Підвантаження всіх оцінок для цієї події
  useEffect(() => {
    async function fetchRatings() {
      setLoadingRatings(true);
      try {
        const auth = getAuth();
        const idToken = auth.currentUser
          ? await auth.currentUser.getIdToken(true)
          : null;

        const url = `/api/ratings?eventId=${encodeURIComponent(event.id)}`;
        const res = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            Authorization: idToken ? `Bearer ${idToken}` : "",
          },
        });
        if (!res.ok) {
          throw new Error(`HTTP помилка: ${res.status}`);
        }
        const data = await res.json();
        setRatings(data);

        if (data.length > 0) {
          const sum = data.reduce((acc, r) => acc + r.score, 0);
          const avg = sum / data.length;
          setAvgRating(avg.toFixed(2));
        } else {
          setAvgRating(null);
        }

        if (auth.currentUser) {
          const own = data.find((r) => r.uid === auth.currentUser.uid);
          setUserRating(own ? own.score : null);
          setSelectedScore(own ? own.score : 1);
        } else {
          setUserRating(null);
          setSelectedScore(1);
        }
      } catch (err) {
        console.error("fetchRatings error:", err);
        setRatings([]);
        setAvgRating(null);
      } finally {
        setLoadingRatings(false);
      }
    }

    fetchRatings();
  }, [event.id, user]);

  const handleScoreChange = (e) => {
    setSelectedScore(Number(e.target.value));
  };

  const handleSubmitRating = async () => {
    if (!user) {
      return openLoginModal();
    }
    try {
      const auth = getAuth();
      const idToken = await auth.currentUser.getIdToken(true);

      const payload = {
        eventId: event.id,
        score: selectedScore,
      };

      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Не вдалося надіслати рейтинг");
      }

      // Примусово оновимо useEffect, спровокувавши повторне завантаження
      setUserRating(selectedScore);
    } catch (err) {
      console.error("Помилка відправки рейтингу:", err);
      alert("Не вдалося зберегти оцінку: " + err.message);
    }
  };

  return (
    <div
      style={{
        width: "300px",
        border: "1px solid #ccc",
        borderRadius: "8px",
        padding: "12px",
        margin: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <img
        src={event.imgSrc}
        alt={event.title}
        style={{
          width: "100%",
          height: "180px",
          objectFit: "cover",
          borderRadius: "6px",
        }}
      />
      <h3 style={{ margin: "8px 0 4px" }}>{event.title}</h3>
      <p style={{ margin: "2px 0" }}>Дата: {event.date}</p>
      <p style={{ margin: "2px 0" }}>Місце: {event.place}</p>
      <p style={{ margin: "2px 0" }}>Ціна: {event.price} грн</p>

      {/* Блок бронювання */}
      <div style={{ marginTop: "8px", display: "flex", alignItems: "center" }}>
        <label style={{ marginRight: "8px" }}>
          Кількість:
          <select
            value={quantities[event.title] || 1}
            onChange={(e) =>
              onQuantityChange(event.title, Number(e.target.value))
            }
            style={{ marginLeft: "4px" }}
          >
            {[...Array(10)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={() => {
            if (!user) {
              openLoginModal(); // якщо не залогінений
            } else {
              onBook(event);
            }
          }}
          style={{ marginLeft: "auto" }}
        >
          Забронювати квиток
        </button>
      </div>

      <hr style={{ margin: "12px 0" }} />
    </div>
  );
}
