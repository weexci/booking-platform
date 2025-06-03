// src/components/RatingsList.jsx
import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth"; // <-- Додаємо цей рядок

export default function RatingsList() {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const auth = getAuth();
        // Якщо юзер не залогінений, idToken буде null
        const idToken = auth.currentUser
          ? await auth.currentUser.getIdToken(true)
          : null;

        const res = await fetch("/api/ratings", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`
          }
        });
        if (!res.ok) {
          throw new Error(`HTTP помилка: ${res.status}`);
        }
        const data = await res.json();
        setRatings(data);
        setLoading(false);
      } catch (err) {
        console.error("Помилка fetch /api/ratings:", err);
        setError(err.message);
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p>Завантаження рейтингів…</p>;
  if (error) return <p style={{ color: "red" }}>Помилка: {error}</p>;
  if (ratings.length === 0) return <p>Поточних рейтингів немає.</p>;

  return (
    <div style={{ padding: "1rem" }}>
      <h3>Рейтинги подій</h3>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ccc", padding: "6px" }}>Doc ID</th>
            <th style={{ border: "1px solid #ccc", padding: "6px" }}>Event ID</th>
            <th style={{ border: "1px solid #ccc", padding: "6px" }}>Score</th>
            <th style={{ border: "1px solid #ccc", padding: "6px" }}>User UID</th>
          </tr>
        </thead>
        <tbody>
          {ratings.map((r) => (
            <tr key={r.id}>
              <td style={{ border: "1px solid #ccc", padding: "6px" }}>{r.id}</td>
              <td style={{ border: "1px solid #ccc", padding: "6px" }}>
                {r.eventId}
              </td>
              <td style={{ border: "1px solid #ccc", padding: "6px" }}>
                {r.score}
              </td>
              <td style={{ border: "1px solid #ccc", padding: "6px" }}>
                {r.uid}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
