// src/App.js
import React, { useState, useEffect } from "react";
import "./App.css";
import EventList from "./components/EventList";
import BookingList from "./components/BookingList";
import LoginModal from "./components/LoginModal";
import AccountMenu from "./components/AccountMenu";
import RatingsList from "./components/RatingsList"; // Якщо хочете окремо показувати всі оцінки
import { db } from "./firebase";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
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
    title: "Концерт ONUKA",
    date: "10.05.2025",
    place: "Київ, Палац Україна",
    price: 500,
    imgSrc: "images/onuka.png",
    type: "concert",
    id: "ONUKA"
  },
  {
    title: "Форум 'Освіта майбутнього'",
    date: "15.06.2025",
    place: "Львів, Центр Довженка",
    price: 300,
    imgSrc: "images/центр_довженка.png",
    type: "forum",
    id: "FORUM_OSVITA_MAJBUTNWO"
  },
  {
    title: "Вистава 'Гамлет'",
    date: "20.06.2025",
    place: "Одеса, Театр ім. В. Василька",
    price: 400,
    imgSrc: "images/гамлет.png",
    type: "theatre",
    id: "THEATRE_HAMLET"
  },
  {
    title: "Фестиваль вуличної їжі",
    date: "01.07.2025",
    place: "Харків, Парк Горького",
    price: 200,
    imgSrc: "images/фестиваль_їжі.png",
    type: "exhibition",
    id: "EXHIBITION_FOOD_FEST"
  },
  {
    title: "Конференція 'Digital Ukraine'",
    date: "12.07.2025",
    place: "Дніпро, IT HUB",
    price: 450,
    imgSrc: "images/конференція.png",
    type: "forum",
    id: "FORUM_DIGITAL_UA"
  },
  {
    title: "Кінопоказ 'Українське кіно'",
    date: "22.07.2025",
    place: "Вінниця, кінотеатр 'Родина'",
    price: 250,
    imgSrc: "images/кінопоказ.png",
    type: "cinema",
    id: "CINEMA_UKRAINIAN_MOVIE"
  },
  {
    title: "Театр на Подолі: Майстер і Маргарита",
    date: "25.07.2025",
    place: "Київ, Театр на Подолі",
    price: 380,
    imgSrc: "images/майстер.png",
    type: "theatre",
    id: "THEATRE_MASTER_AND_MARGARITA"
  },
  {
    title: "Концерт The HARDKISS",
    date: "05.08.2025",
    place: "Львів, FESTrepublic",
    price: 600,
    imgSrc: "images/hardkiss.png",
    type: "concert",
    id: "CONCERT_HARDKISS"
  },
  {
    title: "Форум Освіта 2030",
    date: "12.08.2025",
    place: "Харків, Kharkiv Palace",
    price: 250,
    imgSrc: "images/освіта2030.png",
    type: "forum",
    id: "FORUM_OSVITA_2030"
  },
  {
    title: "Кінопоказ 'Інший Франко'",
    date: "20.08.2025",
    place: "Івано-Франківськ, Палац Мистецтв",
    price: 150,
    imgSrc: "images/франко.png",
    type: "cinema",
    id: "CINEMA_ANOTHER_FRANKO"
  },
  {
    title: "Фестиваль Молоді",
    date: "01.09.2025",
    place: "Дніпро, Молодіжний парк",
    price: 100,
    imgSrc: "images/молодь.png",
    type: "exhibition",
    id: "EXHIBITION_YOUTH_FEST"
  },
  {
    title: "Конференція 'Інновації та Бізнес'",
    date: "10.09.2025",
    place: "Одеса, Startup HUB",
    price: 550,
    imgSrc: "images/інновації.png",
    type: "forum",
    id: "FORUM_INNOVATION_BUSINESS"
  },
  {
    title: "Вистава 'Кайдашева сімʼя'",
    date: "18.09.2025",
    place: "Луцьк, Театр Лесі Українки",
    price: 300,
    imgSrc: "images/кайдаші.png",
    type: "theatre",
    id: "THEATRE_KAIDASHEVA"
  },
  {
    title: "Кінофестиваль 'Українське коротке'",
    date: "26.09.2025",
    place: "Черкаси, кінотеатр Мир",
    price: 200,
    imgSrc: "images/коротке.png",
    type: "cinema",
    id: "CINEMA_UKRAINIAN_SHORT"
  },
  {
    title: "Фестиваль настільних ігор",
    date: "05.10.2025",
    place: "Ужгород, ЗОК",
    price: 220,
    imgSrc: "images/ігри.png",
    type: "exhibition",
    id: "EXHIBITION_BOARD_GAMES"
  },
  {
    title: "Концерт Тіна Кароль",
    date: "12.10.2025",
    place: "Запоріжжя, Арена ЗАЗ",
    price: 700,
    imgSrc: "images/кароль.png",
    type: "concert",
    id: "CONCERT_TINA_KAROL"
  }
];

function App() {
  // 1) Фільтр і сортування подій (як було у вас)
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateSort, setDateSort] = useState("asc");

  // 2) Стан для модалки логіну
  const [showLoginModal, setShowLoginModal] = useState(false);

  // 3) Стан для модалки аккаунту
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  // 4) Стан для залогіненого користувача
  const [user, setUser] = useState(null);

  // 5) Стан для кількостей квитків
  const [quantities, setQuantities] = useState({});

  // 6) Стан для збережених бронювань
  const [bookings, setBookings] = useState(() => {
    const saved = localStorage.getItem("bookings");
    return saved ? JSON.parse(saved) : [];
  });

  // ------------ Логіка для авторизації -------------
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // коли юзер залогінився, підвантажити його бронювання з Firestore
        (async () => {
          const q = query(
            collection(db, "bookings"),
            where("uid", "==", firebaseUser.uid)
          );
          const snap = await getDocs(q);
          const arr = snap.docs.map((d) => ({
            id: d.id,
            ...d.data()
          }));
          setBookings(arr);
        })();
      } else {
        setUser(null);
        setBookings([]); // якщо юзер вийшов, чистимо локальні бронювання
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    localStorage.setItem("bookings", JSON.stringify(bookings));
  }, [bookings]);

  const handleLogout = () => {
    signOut(getAuth()).catch(console.error);
  };

  // ------------ Бронювання квитків -------------
  const handleQuantityChange = (title, qty) =>
    setQuantities((prev) => ({
      ...prev,
      [title]: qty
    }));

  const handleBooking = async (event) => {
    if (!user) {
      // якщо не залогінений, показуємо модалку логіну
      return setShowLoginModal(true);
    }
    const quantity = parseInt(quantities[event.title] || 1, 10);
    const bookingId = `${user.uid}_${encodeURIComponent(event.title)}`;
    if (!bookings.some((b) => b.title === event.title)) {
      const newB = { ...event, quantity };
      setBookings((prev) => [...prev, newB]);
      await setDoc(doc(db, "bookings", bookingId), {
        uid: user.uid,
        ...newB,
        total: event.price * quantity
      }).catch(console.error);
    }
  };

  const cancelBooking = async (idx) => {
    if (!user || !window.confirm("Скасувати бронювання?")) return;
    const b = bookings[idx];
    await deleteDoc(doc(db, "bookings", b.id)).catch(console.error);
    setBookings((prev) => prev.filter((_, i) => i !== idx));
  };

  // ------------ Рейтинг події -------------
  const handleRate = async (eventId, score) => {
    if (!user) {
      return setShowLoginModal(true);
    }
    try {
      // робимо POST на /api/ratings
      const response = await fetch("/api/ratings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ eventId, score })
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

  // ------------ Фільтрація та сортування подій -------------
  const getFilteredEvents = () => {
    let filtered = [...events];
    if (typeFilter !== "all")
      filtered = filtered.filter((e) => e.type === typeFilter);
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
      {/* Іконка акаунту */}
      <div className="account-icon" onClick={() => setShowAccountMenu(true)}>
        <img src="/images/акаунт.png" alt="Акаунт" />
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
          {getAuth().currentUser && (
            <button onClick={handleLogout}>Вийти</button>
          )}
        </nav>
      </header>

      <main>
        <Routes>
          {/* ------------- Сторінка “Події” ------------- */}
          <Route
            path="/events"
            element={
              <section id="events">
                <div className="filters">
                  <label>
                    Тип події:
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                    >
                      <option value="all">Усі</option>
                      <option value="concert">Концерт</option>
                      <option value="theatre">Театр</option>
                      <option value="forum">Форум</option>
                      <option value="exhibition">Виставка</option>
                      <option value="cinema">Кіно</option>
                    </select>
                  </label>
                  <label>
                    Сортування:
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
                  // нові пропси для рейтингу
                  user={user}
                  onPromptLogin={() => setShowLoginModal(true)}
                  onRate={handleRate}
                />
              </section>
            }
          />

          {/* ------------- Сторінка “Мої бронювання” ------------- */}
          <Route
            path="/bookings"
            element={
              <section id="bookings">
                <h2>Мої бронювання</h2>
                <BookingList bookings={bookings} onCancel={cancelBooking} />
                <div className="summary">
                  <p>Квитків: {totalTickets}</p>
                  <p>Сума: {totalPrice} грн</p>
                </div>
              </section>
            }
          />

          {/* ------------- Якщо потрібна окрема сторінка “Всі рейтинги” ------------- */}
          <Route
            path="/ratings"
            element={
              <section id="ratings-list">
                <RatingsList />
              </section>
            }
          />

          {/* ------------- Сторінка “Про нас” ------------- */}
          <Route
            path="/about"
            element={
              <section id="about">
                <h2>Про нас</h2>
                <p>
                  Наша платформа допомагає легко бронювати заходи по всій
                  Україні.
                </p>
              </section>
            }
          />

          {/* Редірект з “/” на “/events” */}
          <Route path="/" element={<Navigate to="/events" replace />} />

          {/* 404 */}
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
