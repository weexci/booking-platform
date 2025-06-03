import React, { useState } from "react";
import LoginForm from "./LoginForm";
import Register from "./Register";
import { getAuth, signOut } from "firebase/auth";

export default function AccountMenu({ onClose }) {
  const user = getAuth().currentUser;
  const [showRegister, setShowRegister] = useState(false);

  const handleLogout = () => {
    signOut(getAuth())
      .then(() => {
        onClose();
      })
      .catch((error) => {
        console.error("Помилка при виході:", error);
      });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Акаунт</h2>
        {user ? (
          <>
            <p>Ви увійшли як: <strong>{user.email}</strong></p>
            <button onClick={handleLogout}>Вийти</button>
          </>
        ) : (
          <>
            <LoginForm />
            {!showRegister && (
              <button onClick={() => setShowRegister(true)}>Зареєструватись</button>
            )}
            {showRegister && <Register />}
          </>
        )}
        <button onClick={onClose} className="close-btn">Закрити</button>
      </div>
    </div>
  );
}
