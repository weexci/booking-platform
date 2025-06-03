import React from "react";
import LoginForm from "./LoginForm";

export default function LoginModal({ onClose }) {
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <button className="close-btn" onClick={onClose}>✖</button>
        <LoginForm />
      </div>
    </div>
  );
}
