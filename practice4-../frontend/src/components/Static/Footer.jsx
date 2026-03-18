import React from "react";
// import './Footer.scss';

export default function Footer() {
  

  return (
    <footer className="footer">
      <div className="footer__inner">
        © {new Date().getFullYear()} Мой Магазин
      </div>
    </footer>
  );
}