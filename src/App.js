// src/App.js
import React, { useState, useEffect } from "react";
import "./App.css";
import EventList from "./components/EventList";
import BookingList from "./components/BookingList";
import LoginModal from "./components/LoginModal";
import AccountMenu from "./components/AccountMenu";
import RatingsList from "./components/RatingsList";
import { db } from "./firebase";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  deleteDoc
} from "firebase/firestore";
import { Routes, Route, NavLink, Navigate } from "react-router-dom";

const events = [
  {
    title: "Аудиторія 101",
    date: "10.05.2025",
    place: "1 корпус",
    price: 500,
    imgSrc: "images/аудиторія.png",
    type: "it",
    id: "101"
  },
  {
    title: "Аудиторія 102",
    date: "15.06.2025",
    place: "2 корпус",
    price: 300,
    imgSrc: "images/аудиторія.png",
    type: "it",
    id: "102"
  },
  {
    title: "Аудиторія 103",    
    date: "20.06.2025",
    place: "3 корпус",
    price: 400,
    imgSrc: "images/аудиторія.png",
    type: "it",
    id: "103"
  },
  {
    title: "Аудиторія 104",
    date: "01.07.2025",
    place: "4 корпус",
    price: 200,
    imgSrc: "images/аудиторія.png",
    type: "it",
    id: "104"
  },
];


function App() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateSort, setDateSort] = useState("asc");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [user, setUser] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [bookings, setBookings] = useState(() => {
    const saved = localStorage.getItem("bookings");
    return saved ? JSON.parse(saved) : [];
  });

  // Підписуємося на зміну стану аутентифікації
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Якщо залогінений, підвантажуємо його бронювання з Firestore
        const q = query(
          collection(db, "bookings"),
          where("uid", "==", firebaseUser.uid)
        );
        const snap = await getDocs(q);
        const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setBookings(arr);
      } else {
        setUser(null);
        setBookings([]);
      }
    });
    return unsubscribe;
  }, []);

  // Зберігаємо бронювання у localStorage для “offline”
  useEffect(() => {
    localStorage.setItem("bookings", JSON.stringify(bookings));
  }, [bookings]);

  const handleLogout = () => {
    signOut(getAuth()).catch(console.error);
  };

  const handleQuantityChange = (title, qty) =>
    setQuantities((prev) => ({ ...prev, [title]: qty }));

  const handleBooking = async (event) => {
    if (!user) {
      // Якщо не залогінений — відкриваємо модалку логіну
      return setShowLoginModal(true);
    }
    const quantity = parseInt(quantities[event.title] || 1, 10);
    const bookingId = `${user.uid}_${encodeURIComponent(event.title)}`;
    // Перевіряємо, чи вже заброньовано цю подію
    if (!bookings.some((b) => b.title === event.title)) {
      const newB = { ...event, quantity };
      setBookings((prev) => [...prev, newB]);
      // Додаємо до Firestore
      await setDoc(
        doc(db, "bookings", bookingId),
        { uid: user.uid, ...newB, total: event.price * quantity }
      ).catch(console.error);
    }
  };

  // Обробник відправки рейтингу
  const handleRate = async (eventId, score) => {
    if (!user) {
      return setShowLoginModal(true);
    }
    try {
      const auth = getAuth();
      const idToken = await auth.currentUser.getIdToken(true);
      const response = await fetch("/api/ratings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ eventId, score }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Помилка при відправці рейтингу");
      }
      alert("Рейтинг успішно збережено!");
    } catch (err) {
      console.error(err);
      alert("Не вдалося зберегти рейтинг: " + err.message);
    }
  };

  // Фільтрація та сортування подій
  const getFilteredEvents = () => {
    let filtered = [...events];
    if (typeFilter !== "all") {
      filtered = filtered.filter((e) => e.type === typeFilter);
    }
    filtered.sort((a, b) => {
      const dA = new Date(a.date.split(".").reverse().join("-"));
      const dB = new Date(b.date.split(".").reverse().join("-"));
      return dateSort === "asc" ? dA - dB : dB - dA;
    });
    return filtered;
  };

  const totalTickets = bookings.reduce((s, b) => s + b.quantity, 0);
  const totalPrice = bookings.reduce((s, b) => s + b.quantity * b.price, 0);

  return (
    <div className="App">
      <div
        className="account-icon"
        onClick={() => setShowAccountMenu(true)}
        style={{ cursor: "pointer" }}
      >
        <img src="/images/аккаунт.png" alt="Акаунт" />
      </div>

      <header>
        <h1>Платформа онлайн-бронювання</h1>
        <nav>
          <NavLink
            to="/events"
            className={({ isActive }) => (isActive ? "active-link" : "")}
          >
            Події
          </NavLink>
          <NavLink
            to="/bookings"
            className={({ isActive }) => (isActive ? "active-link" : "")}
          >
            Мої бронювання
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) => (isActive ? "active-link" : "")}
          >
            Про нас
          </NavLink>
          {user && <button onClick={handleLogout}>Вийти</button>}
        </nav>
      </header>

      <main>
        <Routes>
          <Route
            path="/events"
            element={
              <section id="events">
                <div className="filters">
                  <label>
                    Тип аудиторії:&nbsp;
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                    >
                      <option value="all">Усі</option>
                      <option value="concert">IT</option>
                      <option value="theatre">Law</option>
                      <option value="forum">Economics</option>
                    </select>
                  </label>
                  <label style={{ marginLeft: "16px" }}>
                    Сортування:&nbsp;
                    <select
                      value={dateSort}
                      onChange={(e) => setDateSort(e.target.value)}
                    >
                      <option value="asc">Від ранніх</option>
                      <option value="desc">Від пізніх</option>
                    </select>
                  </label>
                </div>
                <EventList
                  events={getFilteredEvents()}
                  onBook={handleBooking}
                  quantities={quantities}
                  onQuantityChange={handleQuantityChange}
                  openLoginModal={() => setShowLoginModal(true)}
                  user={user}
                  onRate={handleRate}
                />
              </section>
            }
          />

          <Route
            path="/bookings"
            element={
              <section id="bookings">
                <h2>Мої бронювання</h2>
                <BookingList bookings={bookings} onCancel={async (item) => {
                  // приклад функції відміни бронювання
                  if (!user) {
                    return setShowLoginModal(true);
                  }
                  // видаляємо з Firestore
                  const bookingDocId = `${user.uid}_${encodeURIComponent(item.title)}`;
                  await deleteDoc(doc(db, "bookings", bookingDocId)).catch(console.error);
                  // видаляємо з локального стану
                  setBookings((prev) =>
                    prev.filter((b) => b.title !== item.title)
                  );
                }} />
                <div className="summary" style={{ marginTop: "16px" }}>
                  <p>Квитків: {totalTickets}</p>
                  <p>Сума: {totalPrice} грн</p>
                </div>
              </section>
            }
          />

          <Route
            path="/ratings"
            element={
              <section id="ratings-list">
                <RatingsList />
              </section>
            }
          />

          <Route
            path="/about"
            element={
              <section id="about">
                <h2>Про нас</h2>
                <p>
                  Наша платформа допомагає легко бронювати заходи по всій Україні.
                </p>
              </section>
            }
          />

          <Route path="/" element={<Navigate to="/events" replace />} />
          <Route path="*" element={<div>Сторінку не знайдено.</div>} />
        </Routes>
      </main>

      <footer>
        <p>info@tickets.ua | +380 67 123 4567</p>
      </footer>

      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}
      {showAccountMenu && (
        <AccountMenu onClose={() => setShowAccountMenu(false)} />
      )}
    </div>
  );
}

export default App;